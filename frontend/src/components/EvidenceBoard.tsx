import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Edit2, X, Save, Zap, FileText, Camera,
  Video, User, Archive, Mail, HelpCircle, TrendingUp
} from 'lucide-react'
import { evidenceApi } from '../services/api'
import { cn, formatDate } from '../lib/utils'
import type { Evidence, EvidenceCreate } from '../types'
import toast from 'react-hot-toast'

const EVIDENCE_TYPES = [
  { value: 'document', label: 'Dokument', icon: <FileText size={14} /> },
  { value: 'photo', label: 'Foto', icon: <Camera size={14} /> },
  { value: 'video', label: 'Video', icon: <Video size={14} /> },
  { value: 'testimony', label: 'Aussage', icon: <User size={14} /> },
  { value: 'record', label: 'Aufzeichnung', icon: <Archive size={14} /> },
  { value: 'correspondence', label: 'Korrespondenz', icon: <Mail size={14} /> },
  { value: 'other', label: 'Sonstiges', icon: <HelpCircle size={14} /> }
]

const COLUMNS = [
  { key: 'favorable', label: 'Günstig', color: 'border-t-emerald-500', badgeClass: 'badge-done' },
  { key: 'neutral', label: 'Neutral', color: 'border-t-slate-500', badgeClass: 'text-slate-300 bg-slate-700/50 border border-slate-600 text-xs px-2 py-0.5 rounded-full' },
  { key: 'unfavorable', label: 'Ungünstig', color: 'border-t-red-500', badgeClass: 'badge-urgent' }
]

const STRENGTH_LABELS: Record<string, string> = { weak: 'Schwach', moderate: 'Mittel', strong: 'Stark' }
const STRENGTH_COLORS: Record<string, string> = {
  weak: 'text-red-400',
  moderate: 'text-yellow-400',
  strong: 'text-green-400'
}

interface Props { caseId: string }

const EMPTY_FORM: EvidenceCreate = {
  case_id: '',
  title: '',
  description: '',
  evidence_type: 'document',
  favorability: 'neutral',
  strength: 'moderate',
  source: '',
  date_obtained: ''
}

export default function EvidenceBoard({ caseId }: Props) {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState<EvidenceCreate>({ ...EMPTY_FORM, case_id: caseId })
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  const { data: evidence = [], isLoading } = useQuery<Evidence[]>({
    queryKey: ['evidence', caseId],
    queryFn: async () => (await evidenceApi.list(caseId)).data
  })

  const addMutation = useMutation({
    mutationFn: () => evidenceApi.create({ ...form, case_id: caseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] })
      toast.success('Beweis hinzugefügt')
      setShowAdd(false)
      setForm({ ...EMPTY_FORM, case_id: caseId })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] })
      toast.success('Beweis gelöscht')
    }
  })

  const analyzeMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.analyze(id),
    onMutate: (id) => setAnalyzing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] })
      setAnalyzing(null)
      toast.success('KI-Analyse abgeschlossen')
    },
    onError: () => {
      setAnalyzing(null)
      toast.error('Analyse fehlgeschlagen')
    }
  })

  const filtered = evidence.filter(e => !filterType || e.evidence_type === filterType)

  const getTypeIcon = (type: string) => EVIDENCE_TYPES.find(t => t.value === type)?.icon || <HelpCircle size={14} />

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white">Beweise</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input-field w-auto text-sm py-1.5"
          >
            <option value="">Alle Typen</option>
            {EVIDENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus size={14} /> Beweis hinzufügen
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colItems = filtered.filter(e => e.favorability === col.key)
            return (
              <div key={col.key} className={cn('bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden border-t-4', col.color)}>
                <div className="p-3 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                    <span className="text-xs text-slate-400">{colItems.length}</span>
                  </div>
                </div>
                <div className="p-3 space-y-2 min-h-[200px]">
                  {colItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      Keine Beweise
                    </div>
                  ) : (
                    colItems.map((ev, i) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-all"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            {getTypeIcon(ev.evidence_type)}
                            <span>{EVIDENCE_TYPES.find(t => t.value === ev.evidence_type)?.label}</span>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => analyzeMutation.mutate(ev.id)}
                              className="p-1 text-slate-400 hover:text-teal-400 hover:bg-teal-900/20 rounded"
                              title="KI-Analyse"
                              disabled={analyzing === ev.id}
                            >
                              {analyzing === ev.id ? (
                                <span className="w-3 h-3 border border-teal-400/40 border-t-teal-400 rounded-full animate-spin block" />
                              ) : <Zap size={11} />}
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(ev.id)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-white mb-1">{ev.title}</div>
                        {ev.description && <p className="text-xs text-slate-400 line-clamp-2 mb-1.5">{ev.description}</p>}
                        <div className="flex items-center justify-between">
                          {ev.strength && (
                            <span className={cn('text-xs font-medium flex items-center gap-1', STRENGTH_COLORS[ev.strength])}>
                              <TrendingUp size={10} />
                              {STRENGTH_LABELS[ev.strength]}
                            </span>
                          )}
                          {ev.date_obtained && (
                            <span className="text-xs text-slate-500">{formatDate(ev.date_obtained)}</span>
                          )}
                        </div>
                        {ev.ai_analysis && (
                          <div className="mt-2 text-xs text-teal-300 bg-teal-900/20 border border-teal-700/30 rounded p-2">
                            <span className="font-medium">KI: </span>{ev.ai_analysis.slice(0, 120)}...
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Beweis hinzufügen</h3>
                <button onClick={() => setShowAdd(false)}><X size={16} className="text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Titel *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Kurze Bezeichnung"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Beschreibung</label>
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field text-sm resize-none min-h-[70px]"
                    placeholder="Details..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Typ</label>
                    <select
                      value={form.evidence_type}
                      onChange={e => setForm(f => ({ ...f, evidence_type: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {EVIDENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Wertung</label>
                    <select
                      value={form.favorability}
                      onChange={e => setForm(f => ({ ...f, favorability: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Stärke</label>
                    <select
                      value={form.strength || ''}
                      onChange={e => setForm(f => ({ ...f, strength: e.target.value }))}
                      className="input-field text-sm"
                    >
                      <option value="weak">Schwach</option>
                      <option value="moderate">Mittel</option>
                      <option value="strong">Stark</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Datum</label>
                    <input
                      type="date"
                      value={form.date_obtained || ''}
                      onChange={e => setForm(f => ({ ...f, date_obtained: e.target.value }))}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quelle</label>
                  <input
                    type="text"
                    value={form.source || ''}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Herkunft des Beweises"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">
                  Abbrechen
                </button>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!form.title || addMutation.isPending}
                  className="btn-primary flex-1 justify-center"
                >
                  {addMutation.isPending ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Plus size={14} />}
                  Hinzufügen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
