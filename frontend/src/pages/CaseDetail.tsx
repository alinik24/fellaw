import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  FileText,
  Map,
  MessageSquare,
  Upload,
  BarChart3,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { casesApi, documentsApi } from '../services/api'
import {
  cn,
  CASE_TYPE_LABELS,
  CASE_TYPE_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  URGENCY_COLORS,
  URGENCY_LABELS,
  formatDate
} from '../lib/utils'
import type { Case } from '../types'
import toast from 'react-hot-toast'
import TimelineComponent from '../components/Timeline'
import EvidenceBoard from '../components/EvidenceBoard'
import RoadmapView from '../components/RoadmapView'
import NarrativeBuilder from '../components/NarrativeBuilder'
import DocumentUpload from '../components/DocumentUpload'
import ChatInline from '../components/ChatInline'

const TABS = [
  { id: 'overview', label: 'Übersicht', icon: <BarChart3 size={14} /> },
  { id: 'timeline', label: 'Zeitleiste', icon: <Clock size={14} /> },
  { id: 'evidence', label: 'Beweise', icon: <FileText size={14} /> },
  { id: 'roadmap', label: 'Fahrplan', icon: <Map size={14} /> },
  { id: 'narratives', label: 'Narrative', icon: <Edit2 size={14} /> },
  { id: 'documents', label: 'Dokumente', icon: <Upload size={14} /> },
  { id: 'chat', label: 'KI-Chat', icon: <MessageSquare size={14} /> }
]

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Case>>({})

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ['case', id],
    queryFn: async () => (await casesApi.get(id!)).data,
    enabled: !!id
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Case>) => casesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] })
      toast.success('Fall aktualisiert')
      setEditing(false)
    },
    onError: () => toast.error('Fehler beim Aktualisieren')
  })

  const deleteMutation = useMutation({
    mutationFn: () => casesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Fall gelöscht')
      navigate('/cases')
    }
  })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-full">
      <span className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  if (!caseData) return (
    <div className="p-6 text-center text-slate-400">Fall nicht gefunden.</div>
  )

  const c = caseData

  const startEdit = () => {
    setEditForm({
      title: c.title,
      description: c.description,
      status: c.status,
      urgency_level: c.urgency_level,
      opposing_party: c.opposing_party,
      court_name: c.court_name,
      case_number: c.case_number,
      next_hearing_date: c.next_hearing_date
    })
    setEditing(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/cases')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-3">
            <ChevronLeft size={14} /> Alle Fälle
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', CASE_TYPE_COLORS[c.case_type])}>
                  {CASE_TYPE_LABELS[c.case_type] || c.case_type}
                </span>
                <span className={cn(STATUS_COLORS[c.status])}>
                  {STATUS_LABELS[c.status]}
                </span>
                {c.urgency_level && (
                  <span className={cn('text-xs flex items-center gap-1', URGENCY_COLORS[c.urgency_level])}>
                    <AlertCircle size={10} />
                    {URGENCY_LABELS[c.urgency_level]}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white">{c.title}</h1>
              {c.description && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{c.description}</p>}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={startEdit} className="btn-secondary text-sm py-1.5">
                <Edit2 size={14} /> Bearbeiten
              </button>
              <button
                onClick={() => {
                  if (confirm('Fall wirklich löschen?')) deleteMutation.mutate()
                }}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
            {c.incident_date && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} /> Vorfall: {formatDate(c.incident_date)}
              </span>
            )}
            {c.opposing_party && (
              <span className="flex items-center gap-1.5">
                <AlertCircle size={12} /> Gegenseite: {c.opposing_party}
              </span>
            )}
            {c.court_name && (
              <span className="flex items-center gap-1.5">
                <FileText size={12} /> {c.court_name}
              </span>
            )}
            {c.case_number && (
              <span className="flex items-center gap-1.5">
                Az.: {c.case_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {activeTab === 'overview' && <CaseOverview case_={c} onEdit={startEdit} />}
          {activeTab === 'timeline' && <TimelineComponent caseId={c.id} />}
          {activeTab === 'evidence' && <EvidenceBoard caseId={c.id} />}
          {activeTab === 'roadmap' && <RoadmapView caseId={c.id} />}
          {activeTab === 'narratives' && <NarrativeBuilder caseId={c.id} />}
          {activeTab === 'documents' && <DocumentUpload caseId={c.id} />}
          {activeTab === 'chat' && <ChatInline caseId={c.id} />}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Fall bearbeiten</h2>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Titel</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Beschreibung</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="input-field min-h-[80px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
                  <select
                    value={editForm.status || ''}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Case['status'] }))}
                    className="input-field"
                  >
                    {['active', 'pending', 'closed', 'won', 'lost'].map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Dringlichkeit</label>
                  <select
                    value={editForm.urgency_level || ''}
                    onChange={e => setEditForm(f => ({ ...f, urgency_level: e.target.value as Case['urgency_level'] }))}
                    className="input-field"
                  >
                    {['low', 'medium', 'high', 'critical'].map(u => (
                      <option key={u} value={u}>{URGENCY_LABELS[u]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Gegenpartei</label>
                <input
                  type="text"
                  value={editForm.opposing_party || ''}
                  onChange={e => setEditForm(f => ({ ...f, opposing_party: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Gericht</label>
                <input
                  type="text"
                  value={editForm.court_name || ''}
                  onChange={e => setEditForm(f => ({ ...f, court_name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Aktenzeichen</label>
                <input
                  type="text"
                  value={editForm.case_number || ''}
                  onChange={e => setEditForm(f => ({ ...f, case_number: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">
                <X size={14} /> Abbrechen
              </button>
              <button
                onClick={() => updateMutation.mutate(editForm)}
                disabled={updateMutation.isPending}
                className="btn-primary flex-1 justify-center"
              >
                {updateMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Save size={14} />}
                Speichern
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function CaseOverview({ case_: c, onEdit }: { case_: Case; onEdit: () => void }) {
  const infoItems = [
    { label: 'Falltyp', value: CASE_TYPE_LABELS[c.case_type] || c.case_type },
    { label: 'Status', value: STATUS_LABELS[c.status] },
    { label: 'Dringlichkeit', value: c.urgency_level ? URGENCY_LABELS[c.urgency_level] : '—' },
    { label: 'Vorfallsdatum', value: c.incident_date ? formatDate(c.incident_date) : '—' },
    { label: 'Ort', value: c.location || '—' },
    { label: 'Gegenpartei', value: c.opposing_party || '—' },
    { label: 'Gericht', value: c.court_name || '—' },
    { label: 'Aktenzeichen', value: c.case_number || '—' },
    { label: 'Nächster Termin', value: c.next_hearing_date ? formatDate(c.next_hearing_date) : '—' },
    { label: 'Erstellt am', value: formatDate(c.created_at) }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Fallinformationen</h3>
            <button onClick={onEdit} className="btn-ghost text-sm py-1">
              <Edit2 size={12} /> Bearbeiten
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {infoItems.map(item => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-sm text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {c.description && (
          <div className="card mt-4">
            <h3 className="font-semibold text-white mb-3">Fallbeschreibung</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{c.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Schnellaktionen</h3>
          <div className="space-y-2">
            {[
              { label: 'Zeitleiste ergänzen', icon: <Clock size={14} /> },
              { label: 'Beweis hinzufügen', icon: <FileText size={14} /> },
              { label: 'Fahrplan generieren', icon: <Map size={14} /> },
              { label: 'KI befragen', icon: <MessageSquare size={14} /> }
            ].map((a, i) => (
              <button key={i} className="w-full btn-ghost text-sm justify-start">
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>

        {c.next_hearing_date && (
          <div className="card border-yellow-700/30 bg-yellow-900/10">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-1">
              <Calendar size={14} />
              Nächster Termin
            </div>
            <div className="text-xl font-bold text-white">{formatDate(c.next_hearing_date)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
