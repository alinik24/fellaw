export interface User {
  id: string
  email: string
  full_name?: string
  is_active: boolean
  is_guest: boolean
  preferred_language?: string
  created_at: string
}

export interface Case {
  id: string
  user_id: string
  title: string
  description?: string
  case_type: string
  status: 'active' | 'closed' | 'won' | 'lost' | 'pending'
  urgency_level?: 'low' | 'medium' | 'high' | 'critical'
  incident_date?: string
  location?: string
  opposing_party?: string
  court_name?: string
  case_number?: string
  next_hearing_date?: string
  created_at: string
  updated_at: string
  timeline_events?: TimelineEvent[]
  evidence?: Evidence[]
  documents?: Document[]
}

export interface CaseCreate {
  title: string
  description?: string
  case_type: string
  urgency_level?: string
  incident_date?: string
  location?: string
  opposing_party?: string
  court_name?: string
  case_number?: string
  next_hearing_date?: string
}

export interface TimelineEvent {
  id: string
  case_id: string
  event_date: string
  title: string
  description?: string
  event_type: 'incident' | 'filing' | 'hearing' | 'decision' | 'communication' | 'evidence' | 'other'
  is_key_event: boolean
  source?: string
  created_at: string
}

export interface TimelineEventCreate {
  event_date: string
  title: string
  description?: string
  event_type: string
  is_key_event?: boolean
  source?: string
}

export interface Evidence {
  id: string
  case_id: string
  title: string
  description?: string
  evidence_type: 'document' | 'photo' | 'video' | 'testimony' | 'record' | 'correspondence' | 'other'
  favorability: 'favorable' | 'neutral' | 'unfavorable'
  strength?: 'weak' | 'moderate' | 'strong'
  date_obtained?: string
  source?: string
  file_path?: string
  ai_analysis?: string
  created_at: string
}

export interface EvidenceCreate {
  case_id: string
  title: string
  description?: string
  evidence_type: string
  favorability: string
  strength?: string
  date_obtained?: string
  source?: string
}

export interface Document {
  id: string
  user_id: string
  case_id?: string
  filename: string
  original_filename: string
  file_size?: number
  mime_type?: string
  category_type?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  extracted_text?: string
  ai_analysis?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  case_id?: string
  title?: string
  conversation_type: 'general' | 'narrative' | 'roadmap' | 'counterargument' | 'document_analysis'
  model_used?: string
  language?: string
  message_count: number
  created_at: string
  updated_at: string
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: Citation[]
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Citation {
  law_id?: string
  title: string
  section?: string
  text?: string
  relevance_score?: number
}

export interface LawDocument {
  id: string
  title: string
  law_code: string
  section?: string
  paragraph?: string
  content: string
  url?: string
  effective_date?: string
  created_at: string
}

export interface RoadmapStep {
  id: string
  case_id: string
  step_number: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  deadline?: string
  action_items?: string[]
  resources?: string[]
  legal_basis?: string
  ai_notes?: string
  created_at: string
}

export interface Narrative {
  id: string
  case_id: string
  narrative_type: string
  language: string
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NarrativeCreate {
  narrative_type: string
  language?: string
  additional_context?: string
}

export interface ChatMessage {
  message: string
  conversation_id?: string
  case_id?: string
  conversation_type?: string
  model?: string
  language?: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
  preferred_language?: string
}

export interface LawSearchResult {
  results: LawDocument[]
  total: number
  query: string
}

export interface Stats {
  active_cases: number
  total_cases: number
  total_documents: number
  total_conversations: number
  pending_actions: number
}
