import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, FileText, ListChecks, Loader2, MessageCircle, Plus, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchOverview, getAccessToken, Overview } from '@/lib/api/platform';
import { useLanguage } from '@/contexts/LanguageContext';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const de = language === 'de';
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setError(de ? 'Bitte melden Sie sich an.' : 'Please sign in.');
      setLoading(false);
      return () => { active = false; };
    }
    fetchOverview()
      .then((data) => active && setOverview(data))
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : 'Unable to load your overview'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) {
    return <main className="fellow-page fellow-dashboard-state" aria-busy="true"><Loader2 className="animate-spin" aria-hidden="true" /><p>{de ? 'Ihre Übersicht wird geladen…' : 'Loading your overview…'}</p></main>;
  }

  if (error || !overview) {
    return (
      <main className="fellow-page fellow-dashboard-state" role="alert">
        <ShieldAlert aria-hidden="true" />
        <h1>{de ? 'Übersicht nicht verfügbar' : 'Overview unavailable'}</h1>
        <p>{de ? 'Ihre Fälle konnten gerade nicht geladen werden. Ihre Daten wurden nicht verändert.' : 'Your cases could not be loaded right now. No data was changed.'}</p>
        <div className="fellow-inline-actions"><Button asChild><Link to="/auth/user/login">{de ? 'Anmelden' : 'Sign in'}</Link></Button><Button variant="outline" onClick={() => window.location.reload()}>{de ? 'Erneut versuchen' : 'Try again'}</Button><Button variant="outline" asChild><Link to="/urgent/select">{de ? 'Soforthilfe' : 'Urgent help'}</Link></Button></div>
      </main>
    );
  }

  const urgent = overview.urgent_cases;
  const recent = overview.recent_cases;

  return (
    <main className="fellow-page fellow-dashboard" aria-labelledby="dashboard-title">
      <header className="fellow-page-header">
        <div><p className="fellow-eyebrow">{de ? 'Ihre Übersicht' : 'Your overview'}</p><h1 id="dashboard-title">{de ? `Willkommen, ${overview.display_name}` : `Welcome, ${overview.display_name}`}</h1><p>{de ? 'Alles Wichtige für Ihren nächsten Schritt an einem Ort.' : 'Everything you need for your next step, in one place.'}</p></div>
        <Button asChild className="fellow-primary-action"><Link to="/new-case"><Plus aria-hidden="true" />{de ? 'Neuen Fall starten' : 'Start a new case'}</Link></Button>
      </header>

      {urgent.length > 0 && <section className="fellow-dashboard-alert" aria-labelledby="urgent-title"><div className="fellow-dashboard-alert__icon"><ShieldAlert aria-hidden="true" /></div><div><p className="fellow-eyebrow">{de ? 'Zeitkritisch' : 'Time-critical'}</p><h2 id="urgent-title">{urgent.length} {de ? 'Fall' : 'case'}{urgent.length === 1 ? '' : de ? 'e' : 's'} {de ? 'braucht Aufmerksamkeit' : 'need attention'}</h2><p>{de ? 'Prüfen Sie zuerst die markierten Fristen.' : 'Check the marked deadlines first.'}</p></div><Link to={overview.deep_links.urgent} className="fellow-text-link">{de ? 'Soforthilfe' : 'Urgent help'} <ArrowRight aria-hidden="true" /></Link></section>}

      <section className="fellow-dashboard-grid" aria-label={de ? 'Fallübersicht' : 'Case overview'}>
        <div className="fellow-dashboard-main">
          <div className="fellow-section-heading fellow-section-heading--row"><div><p className="fellow-eyebrow">{de ? 'Ihre Fälle' : 'Your cases'}</p><h2>{overview.counts.cases_open} {de ? 'offen' : 'open'}</h2></div><Link to={overview.deep_links.cases} className="fellow-text-link">{de ? 'Alle Fälle' : 'All cases'} <ArrowRight aria-hidden="true" /></Link></div>
          {recent.length === 0 ? <div className="fellow-empty"><FileText aria-hidden="true" /><h3>{de ? 'Noch kein Fall angelegt' : 'No case yet'}</h3><p>{de ? 'Beginnen Sie mit einer kurzen Schilderung Ihrer Situation.' : 'Start with a short description of your situation.'}</p><Button asChild className="fellow-primary-action"><Link to="/new-case">{de ? 'Ersten Fall starten' : 'Start your first case'}</Link></Button></div> : <div className="fellow-case-list">{recent.map((caseItem) => <Link className={`fellow-case-row ${caseItem.urgency === 'high' || caseItem.urgency === 'critical' ? 'is-urgent' : ''}`} key={caseItem.id} to={`/user/dashboard?case=${caseItem.id}`}><div className="fellow-case-row__marker" aria-hidden="true" /><div className="fellow-case-row__body"><div className="fellow-case-row__title"><h3>{caseItem.title}</h3><span>{caseItem.status}</span></div><p>{caseItem.case_type} · {caseItem.urgency}</p>{caseItem.roadmap_generated ? <p className="fellow-case-row__roadmap" data-testid={`roadmap-${caseItem.id}`}><ListChecks aria-hidden="true" />{caseItem.next_step_title ? <>{de ? 'Nächster Schritt' : 'Next step'}: <strong>{caseItem.next_step_title}</strong></> : (de ? 'Alle Schritte abgeschlossen' : 'All steps completed')}</p> : <p className="fellow-case-row__roadmap fellow-case-row__roadmap--none" data-testid={`roadmap-${caseItem.id}`}><ListChecks aria-hidden="true" />{de ? 'Roadmap noch nicht erstellt' : 'Roadmap not yet generated'}</p>}</div><div className="fellow-case-row__deadline">{caseItem.next_deadline ? <><CalendarClock aria-hidden="true" /><span>{de ? 'Frist' : 'Deadline'}<strong>{caseItem.next_deadline}</strong></span></> : <span>{de ? 'Keine nächste Frist' : 'No upcoming deadline'}</span>}<ArrowRight aria-hidden="true" /></div></Link>)}</div>}
        </div>

        <aside className="fellow-dashboard-side"><div className="fellow-dashboard-side__heading"><Sparkles aria-hidden="true" /><h2>{de ? 'Schnellzugriff' : 'Quick access'}</h2></div><Link to={overview.deep_links.new_case} className="fellow-side-action"><Plus aria-hidden="true" /><span><strong>{de ? 'Neuen Fall anlegen' : 'Start a new case'}</strong><small>{de ? 'Geführt und Schritt für Schritt' : 'Guided, step by step'}</small></span><ArrowRight aria-hidden="true" /></Link><Link to={overview.deep_links.find_lawyer} className="fellow-side-action"><FileText aria-hidden="true" /><span><strong>{de ? 'Anwalt finden' : 'Find a lawyer'}</strong><small>{de ? 'Passend zu Ihrem Anliegen' : 'Matched to your situation'}</small></span><ArrowRight aria-hidden="true" /></Link><button type="button" className="fellow-side-action" onClick={() => window.dispatchEvent(new CustomEvent('open-fellaw-assistant'))}><MessageCircle aria-hidden="true" /><span><strong>{de ? 'Assistent fragen' : 'Ask the assistant'}</strong><small>{de ? 'Rechtsinformation, keine Beratung' : 'Information, not legal advice'}</small></span><ArrowRight aria-hidden="true" /></button><div className="fellow-dashboard-note"><p className="fellow-eyebrow">{de ? 'Privatsphäre' : 'Privacy'}</p><p>{de ? 'Ihre Übersicht ist nur für Ihr Konto sichtbar.' : 'Your overview is visible only to your account.'}</p></div></aside>
      </section>
    </main>
  );
};

export default UserDashboard;
