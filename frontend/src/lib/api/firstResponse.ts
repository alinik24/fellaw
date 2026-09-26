/**
 * First-response journey API client (blocker 14/16 journey contract).
 *
 * Mirrors backend/app/api/first_response.py + first_response_state.py:
 * facts confirm/correct, first-response computation, reminders, handoff,
 * verified-next-action. All reads/writes are authenticated; role is derived
 * server-side from the bearer token. No client-side state fabrication.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ExtractedFact {
  id: string;
  document_id: string;
  fact_type: string;
  value: string | null;
  reviewed_value: string | null;
  review_status: string;
  extractor: string;
  confidence: number | null;
  source_page: number | null;
  source_span: string | null;
  reviewed_at: string | null;
}

export interface DomainClock {
  id: string;
  clock_type: string;
  due_date: string | null;
  verification_status: string;
  status: string;
  label: string;
  source_rule_id?: string | null;
}

export interface FirstResponseResult {
  case_id: string;
  document_id: string;
  classification: { family: string; label: string; confidence: number | null };
  clocks: DomainClock[];
  reminder_semantics: string;
}

export interface ReminderResult {
  id: string;
  case_id: string;
  source_clock_id: string;
  reminder_date: string;
  status: string;
}

export interface Dossier {
  case_id: string;
  title: string;
  case_type: string;
  status: string;
  counsel_decision: string;
  language: string;
  contact_preference: string | null;
  documents: Array<{ id: string; original_filename: string }>;
  facts: ExtractedFact[];
  clocks: DomainClock[];
  reminders: Array<{ id: string; reminder_date: string; status: string }>;
  timeline: Array<{ event_name: string; occurred_at: string | null }>;
}

export interface HandoffResult {
  id: string;
  case_id: string;
  status: string;
  dossier: Dossier;
  exact_human_question: string;
}

export interface NorthStar {
  case_id: string;
  verified_next_action_completed: boolean;
  evidence_events: string[];
  current_action?: { id: string; action_key: string; status: string; version: number } | null;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    const err = new Error(String(detail)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function listFacts(caseId: string, documentId: string): Promise<ExtractedFact[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/documents/${documentId}/facts`, { headers: authHeaders() });
  return handle<ExtractedFact[]>(res);
}

export async function reviewFact(
  caseId: string, documentId: string, factId: string,
  review_status: 'USER_CONFIRMED' | 'USER_CORRECTED' | 'REJECTED' | 'UNRESOLVED',
  reviewed_value?: string,
): Promise<ExtractedFact> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/documents/${documentId}/facts/${factId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(reviewed_value ? { review_status, reviewed_value } : { review_status }),
  });
  return handle<ExtractedFact>(res);
}

export async function computeFirstResponse(caseId: string, documentId: string): Promise<FirstResponseResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ case_id: caseId, document_id: documentId }),
  });
  return handle<FirstResponseResult>(res);
}

export async function createReminder(caseId: string, sourceClockId: string, reminderDate: string): Promise<ReminderResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ source_clock_id: sourceClockId, reminder_date: reminderDate }),
  });
  return handle<ReminderResult>(res);
}

export async function createHandoff(caseId: string, exactHumanQuestion: string, language = 'de', contactPreference = 'email'): Promise<HandoffResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ exact_human_question: exactHumanQuestion, language, contact_preference: contactPreference }),
  });
  return handle<HandoffResult>(res);
}

export async function verifiedNextAction(caseId: string): Promise<NorthStar> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/verified-next-action`, { headers: authHeaders() });
  return handle<NorthStar>(res);
}

export interface JourneyState {
  case_id: string;
  title: string;
  case_type: string;
  status: string;
  documents: Array<{ id: string; original_filename: string }>;
  facts: ExtractedFact[];
  clocks: DomainClock[];
  reminders: Array<{ id: string; reminder_date: string; status: string }>;
  timeline: Array<{ event_name: string; occurred_at: string | null }>;
  handoff: {
    id: string;
    status: string;
    exact_human_question: string;
    dossier: Dossier;
  } | null;
  north_star: NorthStar;
}

/** Persisted-read contract: reconstruct the whole journey from the DB
 *  after a REAL browser hard reload. No React memory participates. */
export async function fetchJourneyState(caseId: string): Promise<JourneyState> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/state`, { headers: authHeaders() });
  return handle<JourneyState>(res);
}

export interface CompleteActionResult {
  case_id: string;
  completed: boolean;
  action: { id: string; action_key: string; status: string; version: number };
  north_star: NorthStar;
}

/** Server-owned domain completion of the EXACT action the client observed.
 * Binds completion to actionId (+ expectedVersion) so a stale click that was
 * superseded before the request arrives FAILS CLOSED (409) instead of
 * completing whatever action is current at request time. */
export async function completeAction(caseId: string, actionId: string, version?: number): Promise<CompleteActionResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/first-response/${caseId}/actions/${actionId}/complete`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: version !== undefined ? JSON.stringify({ expected_version: version }) : undefined,
  });
  return handle<CompleteActionResult>(res);
}
