/**
 * Platform API client — shared web/bot contract.
 *
 * Mirrors backend/app/api/platform.py and backend/app/api/chat.py.
 * The role is ALWAYS derived server-side from the bearer token.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type Role = 'anonymous' | 'citizen' | 'lawyer' | 'admin';
export type CapabilityStatus = 'implemented' | 'partial' | 'planned' | 'missing' | 'removed';
export type CapabilityKind = 'navigation' | 'read' | 'mutation';

export interface Capability {
  id: string;
  label_de: string;
  label_en: string;
  kind: CapabilityKind;
  status: CapabilityStatus;
  roles: Role[];
  web_route: string;
  bot_intent: string;
  owner: string;
  api_path: string | null;
  requires_confirmation: boolean;
  note: string;
  tags: string[];
}

export interface CapabilitiesResponse {
  role: Role;
  summary: { total: number; by_status: Record<CapabilityStatus, number> };
  capabilities: Capability[];
  disclaimer: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  case_type: string;
  status: string;
  urgency: string;
  next_deadline: string | null;
  roadmap_generated: boolean;
  next_step_title: string | null;
}

export interface Overview {
  role: Role;
  display_name: string;
  language: string;
  counts: Record<string, number>;
  recent_cases: CaseSummary[];
  urgent_cases: CaseSummary[];
  deep_links: Record<string, string>;
  capabilities: string[];
  generated_at: string;
}

export interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  citations: Array<Record<string, unknown>>;
  created_at: string;
}

export interface CreatedCase {
  id: string;
  title: string;
  case_type: string;
  status: string;
  description: string | null;
  urgency: string;
}

export async function createCase(params: {
  title: string;
  case_type: string;
  description?: string | null;
  urgency?: string;
}): Promise<CreatedCase> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      title: params.title,
      case_type: params.case_type,
      description: params.description ?? null,
      urgency: params.urgency ?? 'medium',
    }),
  });
  return handle<CreatedCase>(res);
}

export function getAccessToken(): string | null {
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
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function fetchCapabilities(): Promise<CapabilitiesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/platform/capabilities`, {
    headers: { ...authHeaders() },
  });
  return handle<CapabilitiesResponse>(res);
}

export async function fetchOverview(): Promise<Overview> {
  const res = await fetch(`${API_BASE_URL}/api/v1/platform/overview`, {
    headers: { ...authHeaders() },
  });
  return handle<Overview>(res);
}

export async function sendChatMessage(params: {
  message: string;
  conversation_id?: string | null;
  case_id?: string | null;
  language?: string | null;
}): Promise<ChatMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      message: params.message,
      conversation_id: params.conversation_id ?? null,
      case_id: params.case_id ?? null,
      language: params.language ?? null,
      conversation_type: 'general',
      stream: false,
    }),
  });
  return handle<ChatMessageResponse>(res);
}

export interface LawSearchHit {
  id: string;
  title: string;
  law_code: string;
  section: string | null;
  content: string;
  url: string | null;
  relevance_score: number;
  mode: string | null;
}

/**
 * PR-02C Finding 1: bounded A-path — statute/source lookup with citations.
 * This is the ONLY generative-adjacent surface the assistant widget uses.
 * It returns retrieved statute text, never an individualized assessment.
 */
export async function searchLaws(params: {
  q: string;
  limit?: number;
}): Promise<LawSearchHit[]> {
  const qs = new URLSearchParams({ q: params.q, limit: String(params.limit ?? 5) });
  const res = await fetch(`${API_BASE_URL}/api/v1/laws/search?${qs}`, {
    headers: { ...authHeaders() },
  });
  return handle<LawSearchHit[]>(res);
}

/** Pure helper (unit-testable): pick a capability by loose keyword. */
export function matchCapability(input: string, caps: Capability[]): Capability | null {
  const q = input.toLowerCase();
  const table: Array<[RegExp, string]> = [
    [/\b(urgent|emergency|notfall|dringend|police|polizei|arrest|unfall)\b/, 'urgent_help'],
    [/\b(lawyer|anwalt|anw[aä]ltin|attorney|rechtsanwalt)\b/, 'find_lawyer'],
    [/\b(new case|neuer fall|fall anlegen|intake|start a case)\b/, 'start_case_intake'],
    [/\b(my cases|meine f[aä]lle|ongoing|laufende)\b/, 'my_cases'],
    [/\b(upload|hochladen|dokument|document|scan)\b/, 'upload_document'],
    [/\b(insurance|rechtsschutz|versicherung)\b/, 'insurance_check'],
    [/\b(mediation|schlichtung)\b/, 'mediation'],
    [/\b(template|vorlage|muster|self[- ]service|selbsthilfe)\b/, 'self_service'],
    [/\b(pay|bezahlen|zahlung|price|preis|kosten|fee|geb[uü]hr)\b/, 'pay_consultation'],
    [/\b(book|termin|appointment|buchen)\b/, 'book_consultation'],
  ];
  for (const [re, id] of table) {
    if (re.test(q)) {
      const cap = caps.find((c) => c.id === id);
      if (cap) return cap;
    }
  }
  return null;
}
