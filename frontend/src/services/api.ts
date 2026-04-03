import axios from 'axios'
import type {
  User,
  Case,
  CaseCreate,
  TimelineEvent,
  TimelineEventCreate,
  Evidence,
  EvidenceCreate,
  Document,
  Conversation,
  Message,
  LawDocument,
  RoadmapStep,
  Narrative,
  NarrativeCreate,
  ChatMessage,
  AuthTokens,
  RegisterData,
  LawSearchResult
} from '../types'

const BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterData): Promise<{ data: User }> =>
    api.post('/auth/register', data),

  login: (email: string, password: string): Promise<{ data: AuthTokens }> => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },

  guestSession: (): Promise<{ data: AuthTokens }> =>
    api.post('/auth/guest'),

  getMe: (): Promise<{ data: User }> =>
    api.get('/auth/me'),

  updateMe: (data: Partial<User>): Promise<{ data: User }> =>
    api.put('/auth/me', data)
}

// ─── Cases API ───────────────────────────────────────────────────────────────
export const casesApi = {
  list: (): Promise<{ data: Case[] }> =>
    api.get('/cases'),

  create: (data: CaseCreate): Promise<{ data: Case }> =>
    api.post('/cases', data),

  get: (id: string): Promise<{ data: Case }> =>
    api.get(`/cases/${id}`),

  update: (id: string, data: Partial<CaseCreate>): Promise<{ data: Case }> =>
    api.put(`/cases/${id}`, data),

  delete: (id: string): Promise<{ data: void }> =>
    api.delete(`/cases/${id}`),

  // Timeline
  addTimelineEvent: (caseId: string, data: TimelineEventCreate): Promise<{ data: TimelineEvent }> =>
    api.post(`/cases/${caseId}/timeline`, data),

  getTimeline: (caseId: string): Promise<{ data: TimelineEvent[] }> =>
    api.get(`/cases/${caseId}/timeline`),

  updateTimelineEvent: (caseId: string, eventId: string, data: Partial<TimelineEventCreate>): Promise<{ data: TimelineEvent }> =>
    api.put(`/cases/${caseId}/timeline/${eventId}`, data),

  deleteTimelineEvent: (caseId: string, eventId: string): Promise<{ data: void }> =>
    api.delete(`/cases/${caseId}/timeline/${eventId}`),

  // Roadmap
  generateRoadmap: (caseId: string): Promise<{ data: RoadmapStep[] }> =>
    api.post(`/cases/${caseId}/roadmap/generate`),

  getRoadmap: (caseId: string): Promise<{ data: RoadmapStep[] }> =>
    api.get(`/cases/${caseId}/roadmap`),

  updateRoadmapStep: (caseId: string, stepId: string, data: Partial<RoadmapStep>): Promise<{ data: RoadmapStep }> =>
    api.put(`/cases/${caseId}/roadmap/${stepId}`, data),

  // Narratives
  getNarratives: (caseId: string): Promise<{ data: Narrative[] }> =>
    api.get(`/cases/${caseId}/narratives`),

  generateNarrative: (caseId: string, data: NarrativeCreate): Promise<{ data: Narrative }> =>
    api.post(`/cases/${caseId}/narratives/generate`, data),

  updateNarrative: (caseId: string, narrativeId: string, data: Partial<Narrative>): Promise<{ data: Narrative }> =>
    api.put(`/cases/${caseId}/narratives/${narrativeId}`, data)
}

// ─── Evidence API ─────────────────────────────────────────────────────────────
export const evidenceApi = {
  list: (caseId: string): Promise<{ data: Evidence[] }> =>
    api.get(`/evidence?case_id=${caseId}`),

  create: (data: EvidenceCreate): Promise<{ data: Evidence }> =>
    api.post('/evidence', data),

  update: (id: string, data: Partial<EvidenceCreate>): Promise<{ data: Evidence }> =>
    api.put(`/evidence/${id}`, data),

  delete: (id: string): Promise<{ data: void }> =>
    api.delete(`/evidence/${id}`),

  analyze: (id: string): Promise<{ data: Evidence }> =>
    api.post(`/evidence/${id}/analyze`),

  getTimeline: (caseId: string): Promise<{ data: Evidence[] }> =>
    api.get(`/evidence/timeline?case_id=${caseId}`)
}

// ─── Documents API ────────────────────────────────────────────────────────────
export const documentsApi = {
  upload: (file: File, caseId?: string, categoryType?: string): Promise<{ data: Document }> => {
    const formData = new FormData()
    formData.append('file', file)
    if (caseId) formData.append('case_id', caseId)
    if (categoryType) formData.append('category_type', categoryType)
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  get: (id: string): Promise<{ data: Document }> =>
    api.get(`/documents/${id}`),

  list: (caseId?: string): Promise<{ data: Document[] }> =>
    api.get(caseId ? `/documents?case_id=${caseId}` : '/documents'),

  delete: (id: string): Promise<{ data: void }> =>
    api.delete(`/documents/${id}`),

  reanalyze: (id: string): Promise<{ data: Document }> =>
    api.post(`/documents/${id}/reanalyze`)
}

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (data: ChatMessage): Promise<{ data: Message }> =>
    api.post('/chat/message', data),

  createConversation: (data: { title?: string; case_id?: string; conversation_type?: string }): Promise<{ data: Conversation }> =>
    api.post('/chat/conversations', data),

  listConversations: (): Promise<{ data: Conversation[] }> =>
    api.get('/chat/conversations'),

  getConversation: (id: string): Promise<{ data: Conversation }> =>
    api.get(`/chat/conversations/${id}`),

  deleteConversation: (id: string): Promise<{ data: void }> =>
    api.delete(`/chat/conversations/${id}`),

  generateNarrative: (data: { case_id: string; narrative_type: string; language?: string }): Promise<{ data: Message }> =>
    api.post('/chat/narrative', data),

  generateRoadmap: (caseId: string): Promise<{ data: Message }> =>
    api.post('/chat/roadmap', { case_id: caseId }),

  analyzeCounterargument: (data: { case_id: string; argument: string }): Promise<{ data: Message }> =>
    api.post('/chat/counterargument', data),

  analyzeDocument: (text: string, docType?: string): Promise<{ data: Message }> =>
    api.post('/chat/analyze-document', { text, document_type: docType })
}

// ─── Laws API ─────────────────────────────────────────────────────────────────
export const lawsApi = {
  search: (query: string, lawCodes?: string[], limit?: number): Promise<{ data: LawSearchResult }> =>
    api.post('/laws/search', { query, law_codes: lawCodes, limit: limit ?? 10 }),

  get: (id: string): Promise<{ data: LawDocument }> =>
    api.get(`/laws/${id}`),

  getCodes: (): Promise<{ data: string[] }> =>
    api.get('/laws/codes'),

  triggerIngest: (): Promise<{ data: { message: string } }> =>
    api.post('/laws/ingest'),

  getIngestStatus: (): Promise<{ data: { status: string; progress?: number } }> =>
    api.get('/laws/ingest/status')
}

// ─── Professionals API ────────────────────────────────────────────────────────
export const professionalsApi = {
  getFirms: (params?: { city?: string; specialization?: string; verified?: boolean }) =>
    api.get('/professionals/firms', { params }),

  getFirm: (id: string) =>
    api.get(`/professionals/firms/${id}`),

  createFirm: (data: any) =>
    api.post('/professionals/firms', data),

  getLawyers: (params?: {
    specialization?: string
    city?: string
    language?: string
    max_rate?: number
    verified_only?: boolean
    offers_free?: boolean
    skip?: number
    limit?: number
  }) => api.get('/professionals/lawyers', { params }),

  getLawyer: (id: string) =>
    api.get(`/professionals/lawyers/${id}`),

  getMyProfile: () =>
    api.get('/professionals/lawyers/me'),

  createMyProfile: (data: any) =>
    api.post('/professionals/lawyers/profile', data),

  updateMyProfile: (data: any) =>
    api.put('/professionals/lawyers/me', data),

  matchLawyers: (data: {
    case_id: string
    preferred_specializations?: string[]
    preferred_language?: string
    max_hourly_rate?: number
  }) => api.post('/professionals/match', data),

  addReview: (lawyerId: string, data: { rating: number; comment?: string; is_anonymous?: boolean }) =>
    api.post(`/professionals/lawyers/${lawyerId}/reviews`, data),

  getReviews: (lawyerId: string) =>
    api.get(`/professionals/lawyers/${lawyerId}/reviews`),
}

// ─── Referrals API ────────────────────────────────────────────────────────────
export const referralsApi = {
  create: (data: { case_id: string; message?: string; urgency?: string }) =>
    api.post('/referrals', data),

  getMy: () =>
    api.get('/referrals/my'),

  getIncoming: () =>
    api.get('/referrals/incoming'),

  get: (id: string) =>
    api.get(`/referrals/${id}`),

  accept: (id: string) =>
    api.put(`/referrals/${id}/accept`),

  decline: (id: string, reason?: string) =>
    api.put(`/referrals/${id}/decline`, { lawyer_response: reason }),

  complete: (id: string) =>
    api.put(`/referrals/${id}/complete`),

  cancel: (id: string) =>
    api.delete(`/referrals/${id}`),
}

export default api
