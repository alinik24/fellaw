/**
 * CaseJourney — drives the real persisted first-response journey (blocker 16,
 * Journey A/B/C). No fabricated state: every panel reads/writes the canonical
 * authenticated API and re-reads after a hard reload.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  completeAction, computeFirstResponse, createHandoff, createReminder, fetchJourneyState,
  listFacts, reviewFact, verifiedNextAction,
  type DomainClock, type ExtractedFact, type NorthStar,
} from '@/lib/api/firstResponse';

const DE = navigator.language.startsWith('de');

function t(de: string, en: string): string {
  return DE ? de : en;
}

export default function CaseJourney() {
  const { caseId = '' } = useParams();
  const [params] = useSearchParams();
  const documentId = params.get('document') ?? '';
  const [token] = useState(() => localStorage.getItem('access_token'));

  const [facts, setFacts] = useState<ExtractedFact[] | null>(null);
  const [factsError, setFactsError] = useState<string | null>(null);
  // Clocks/reminders/handoff are reconstructed from the persisted-read
  // contract (GET /state) on mount and after every write — never from the
  // previous React render. A hard reload therefore rebuilds the whole page
  // from the API/DB, not from component memory.
  const [clocks, setClocks] = useState<DomainClock[] | null>(null);
  const [reminders, setReminders] = useState<Array<{ id: string; reminder_date: string; status: string }> | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<{ id: string; status: string; facts: number; clocks: number; reminders: number } | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [handoffMsg, setHandoffMsg] = useState<string | null>(null);
  const [north, setNorth] = useState<NorthStar | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // THE hard-reload reconstruction path: load ALL persisted journey state
  // from the API (facts, semantic clocks, reminders, handoff, north star).
  // This effect runs on every mount — i.e. after a REAL document reload the
  // React component memory is destroyed and the page is rebuilt from here.
  async function loadState() {
    if (!caseId) return;
    try {
      const s = await fetchJourneyState(caseId);
      const docFacts = documentId
        ? s.facts.filter((f) => f.document_id === documentId)
        : s.facts;
      setFacts(docFacts);
      setClocks(s.clocks);
      setReminders(s.reminders);
      setHandoffStatus(
        s.handoff
          ? {
              id: s.handoff.id,
              status: s.handoff.status,
              facts: (s.handoff.dossier.facts || []).length,
              clocks: (s.handoff.dossier.clocks || []).length,
              reminders: (s.handoff.dossier.reminders || []).length,
            }
          : null,
      );
      setNorth(s.north_star);
      setFactsError(null);
    } catch (e) {
      setFactsError((e as Error).message);
    }
  }

  // On every mount (including hard reload) reconstruct from the API only.
  useEffect(() => {
    void loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, documentId]);

  async function loadFacts() {
    if (!caseId || !documentId) return;
    setFactsError(null);
    try {
      setFacts(await listFacts(caseId, documentId));
    } catch (e) {
      setFactsError((e as Error).message);
    }
  }

  async function loadNorth() {
    try {
      setNorth(await verifiedNextAction(caseId));
    } catch {
      /* non-fatal */
    }
  }

  async function confirmFact(f: ExtractedFact, status: 'USER_CONFIRMED' | 'USER_CORRECTED' | 'REJECTED') {
    setBusy(true);
    try {
      await reviewFact(caseId, documentId, f.id, status);
      await loadState();
    } catch (e) {
      setFactsError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function requestFirstResponse() {
    setBusy(true);
    setResponseError(null);
    try {
      await computeFirstResponse(caseId, documentId);
      await loadState();
    } catch (e) {
      setResponseError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitReminder(sourceClockId: string) {
    if (!reminderDate) return;
    setBusy(true);
    setReminderMsg(null);
    try {
      const r = await createReminder(caseId, sourceClockId, reminderDate);
      setReminderMsg(t(`Erinnerung ${r.reminder_date} angelegt (${r.status}).`, `Reminder ${r.reminder_date} created (${r.status}).`));
      await loadState();
    } catch (e) {
      setReminderMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitHandoff() {
    setBusy(true);
    setHandoffMsg(null);
    try {
      await createHandoff(caseId, 'Welche individuellen rechtlichen Prüfungen sind erforderlich? Bitte fachlich prüfen.', 'de', 'email');
      await loadState();
    } catch (e) {
      setHandoffMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCompleteAction() {
    // Bind the completion to the EXACT action the client observed from
    // GET /state (id + version). If the action was superseded before this
    // click lands, the server fails closed (409) and does NOT complete the
    // replacement action.
    const current = north?.current_action;
    if (!current) {
      setHandoffMsg(t('Keine aktuelle Aktion zum Abschließen vorhanden.', 'No current action to complete.'));
      return;
    }
    setBusy(true);
    setHandoffMsg(null);
    try {
      const r = await completeAction(caseId, current.id, current.version);
      setHandoffMsg(t(`Aktion abgeschlossen (Nordstern: ${r.north_star.verified_next_action_completed}).`, `Action completed (north star: ${r.north_star.verified_next_action_completed}).`));
      await loadState();
    } catch (e) {
      setHandoffMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const unauthenticated = !token;

  return (
    <main className="fellow-container" aria-label={t('Fall-Journey', 'Case journey')}>
      <header className="fellow-section-heading">
        <div>
          <p className="fellow-eyebrow">{t('Echte gespeicherte Fallreise', 'Real persisted case journey')}</p>
          <h1>{t('Fall-Journey', 'Case journey')}</h1>
          <p className="fellow-muted">{t('Fall', 'Case')}: {caseId.slice(0, 8)}… · {t('Dokument', 'Document')}: {documentId.slice(0, 8)}…</p>
        </div>
      </header>

      {unauthenticated && (
        <section className="fellow-empty" aria-label={t('Anmeldung erforderlich', 'Authentication required')}>
          <h2>{t('Anmeldung erforderlich', 'Sign-in required')}</h2>
          <p>{t('Bitte melden Sie sich an, um den Fall zu sehen.', 'Please sign in to view this case.')}</p>
        </section>
      )}

      {!unauthenticated && (
        <div className="fellow-journey-grid">
          <section aria-labelledby="facts-h" className="fellow-panel">
            <div className="fellow-section-heading fellow-section-heading--row">
              <h2 id="facts-h">{t('Extraktions-Fakten', 'Extraction facts')}</h2>
              <Button variant="outline" size="sm" onClick={loadFacts} disabled={busy}>{t('Neu laden', 'Reload')}</Button>
            </div>
            {factsError && <p className="fellow-error" role="alert">{factsError}</p>}
            {facts === null && <p className="fellow-muted">{t('Fakten werden geladen…', 'Loading facts…')}</p>}
            {facts && facts.length === 0 && <p className="fellow-empty">{t('Keine Fakten. Bitte zuerst ein Dokument hochladen.', 'No facts yet. Upload a document first.')}</p>}
            {facts && facts.length > 0 && (
              <ul className="fellow-fact-list">
                {facts.map((f) => (
                  <li key={f.id} className="fellow-fact-row" data-testid={`fact-${f.fact_type}`}>
                    <div>
                      <strong>{f.fact_type}</strong>
                      <span className="fellow-muted"> · {f.value ?? '–'}</span>
                      <span> · {f.review_status}</span>
                      {f.extractor && <span className="fellow-muted"> · {t('Quelle', 'source')}: {f.extractor}</span>}
                    </div>
                    {f.review_status === 'EXTRACTED_CANDIDATE' && (
                      <div className="fellow-fact-actions">
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => confirmFact(f, 'USER_CONFIRMED')}>{t('Bestätigen', 'Confirm')}</Button>
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => confirmFact(f, 'REJECTED')}>{t('Ablehnen', 'Reject')}</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="fr-h" className="fellow-panel">
            <div className="fellow-section-heading fellow-section-heading--row">
              <h2 id="fr-h">{t('Erste Antwort', 'First response')}</h2>
              <Button size="sm" disabled={busy || !documentId} onClick={requestFirstResponse}>{t('Erste Antwort anfordern', 'Request first response')}</Button>
            </div>
            {responseError && <p className="fellow-error" role="alert">{responseError}</p>}
            {clocks && clocks.length === 0 && !responseError && (
              <p className="fellow-muted">{t('Noch keine Fristen berechnet. Bitte zuerst ein Dokument hochladen und „Erste Antwort anfordern“.', 'No clocks yet. Upload a document and request the first response.')}</p>
            )}
            {clocks && clocks.length > 0 && (
              <div data-testid="first-response" className="fellow-response">
                <ul className="fellow-clock-list">
                  {clocks.filter((c) => c.status !== 'cancelled').map((c: DomainClock) => (
                    <li key={c.id} data-testid={`clock-${c.clock_type}`}>
                      <strong>{c.clock_type}</strong>
                      <span> · {c.due_date ?? t('(kein Datum)', '(no date)')}</span>
                      <span> · {c.verification_status}</span>
                      {c.clock_type === 'STATUTORY_DEADLINE' && c.status !== 'completed' && (
                        <span className="fellow-reminder-inline">
                          <input
                            aria-label={t('Erinnerungsdatum', 'Reminder date')}
                            type="date"
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                          />
                          <Button variant="outline" size="sm" disabled={busy || !reminderDate} onClick={() => submitReminder(c.id)}>{t('Erinnerung', 'Reminder')}</Button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {reminders && reminders.length > 0 && (
                  <p className="fellow-feedback" data-testid="reminder-status">
                    <strong>{t('Erinnerungen', 'Reminders')}:</strong>{' '}
                    {reminders.map((r) => `${r.reminder_date} (${r.status})`).join(', ')}
                  </p>
                )}
                {reminderMsg && <p className="fellow-feedback" role="status">{reminderMsg}</p>}
              </div>
            )}
          </section>

          <section aria-labelledby="handoff-h" className="fellow-panel">
            <div className="fellow-section-heading fellow-section-heading--row">
              <h2 id="handoff-h">{t('Übergabe & Nordstern', 'Handoff & north star')}</h2>
              <Button variant="outline" size="sm" disabled={busy} onClick={submitHandoff}>{t('Übergabe anlegen', 'Create handoff')}</Button>
            </div>
            {handoffMsg && <p className="fellow-feedback" role="status">{handoffMsg}</p>}
            {handoffStatus && (
              <div data-testid="handoff" className="fellow-feedback">
                <p><strong>{t('Übergabe-Status', 'Handoff status')}:</strong> {handoffStatus.status} <span className="fellow-muted">(id {handoffStatus.id.slice(0, 8)}…)</span></p>
                <p><strong>{t('counsel_decision', 'counsel_decision')}:</strong> UNKNOWN</p>
                <p><strong>{t('Fakten in Übergabe', 'facts in dossier')}:</strong> {handoffStatus.facts}</p>
                <p><strong>{t('Fristen in Übergabe', 'clocks in dossier')}:</strong> {handoffStatus.clocks}</p>
                <p><strong>{t('Erinnerungen in Übergabe', 'reminders in dossier')}:</strong> {handoffStatus.reminders}</p>
              </div>
            )}
            {!handoffStatus && !busy && (
              <p className="fellow-muted" data-testid="handoff-none">{t('Noch keine Übergabe angelegt.', 'No handoff created yet.')}</p>
            )}
            <div className="fellow-section-heading fellow-section-heading--row">
              <Button variant="outline" size="sm" disabled={busy} onClick={submitCompleteAction}>{t('Aktuelle Aktion abschließen', 'Complete current action')}</Button>
            </div>
            {north && (
              <p className="fellow-feedback" data-testid="north-star">
                <strong>{t('Aktuelle nächste Aktion abgeschlossen', 'Current next action completed')}:</strong>{' '}
                {north.verified_next_action_completed ? t('Ja', 'Yes') : t('Nein', 'No')}
              </p>
            )}
            {north && north.evidence_events.length > 0 && (
              <p className="fellow-muted" data-testid="north-events">
                <strong>{t('Ereignisse', 'Events')}:</strong> {north.evidence_events.join(', ')}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
