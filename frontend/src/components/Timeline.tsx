import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Star, X, Save, Calendar, AlertCircle } from 'lucide-react'
import { casesApi } from '../services/api'
import { cn, formatDate } from '../lib/utils'
import type { TimelineEvent, TimelineEventCreate } from '../types'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { value: 'incident', label: 'Vorfall', color: 'bg-red-500' },
  { value: 'filing', label: 'Einreichung', color: 'bg-blue-500' },
  { value: 'hearing', label: 'Verhandlung', color: 'bg-purple-500' },
  { value: 'decision', label: 'Entscheidung', color: 'bg-orange-500' },
  { value: 'communication', label: 'Kommunikation', color: 'bg-teal-500' },
  { value: 'evidence', label: 'Beweis', color: 'bg-green-500' },
  { value: 'other', label: 'Sonstiges', color: 'bg-slate-500' }
]

const getTypeInfo = (type: string) => EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1]

interface Props { caseId: string }

const EMPTY_FORM: TimelineEventCreate = {
  event_date: '',
  title: '',
  description: '',
  event_type: 'other',
  is_key_event: false,
  source: ''
}

export default function TimelineComponent({ caseId }: Props) {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<TimelineEventCreate>(EMPTY_FORM)

  const { data: events = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['timeline', caseId],
    queryFn: async () => (await casesApi.getTimeline(caseId)).data
  })

  const addMutation = useMutation({
    mutationFn: () => casesApi.addTimelineEvent(caseId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', caseId] })
      toast.success('Ereignis hinzugefügt')
      setShowAdd(false)
      setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Fehler beim Hinzufügen')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimelineEventCreate> }) =>
      casesApi.updateTimelineEvent(caseId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', caseId] })
      toast.success('Ereignis aktualisiert')
      setEditId(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => casesApi.deleteTimelineEvent(caseId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', caseId] })
      toast.success('Ereignis gelöscht')
    }
  })

  const sorted = [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Zeitleiste</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          <Plus size={14} /> Ereignis hinzufügen
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p>Noch keine Ereignisse in der Zeitleiste</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-blue-400 text-sm hover:text-blue-300">
            Erstes Ereignis hinzufügen →
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700/60" />

          <div className="space-y-4">
            {sorted.map((event, i) => {
              const typeInfo = getTypeInfo(event.event_type)
              const isEdit = editId === event.id
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-14"
                >
                  {/* Dot */}
                  <div className={cn(
                    'absolute left-2.5 top-4 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center z-10',
                    typeInfo.color,
                    event.is_key_event && 'ring-2 ring-yellow-400/50 ring-offset-1 ring-offset-slate-950'
                  )}>
                    {event.is_key_event && <Star size={8} className="text-yellow-300 fill-yellow-300" />}
                  </div>

                  {isEdit ? (
                    <div className="bg-slate-800 border border-blue-500/50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Datum</label>
                          <input
                            type="date"
                            defaultValue={event.event_date.split('T')[0]}
                            onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                            className="input-field text-sm py-1.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Typ</label>
                          <select
                            defaultValue={event.event_type}
                            onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                            className="input-field text-sm py-1.5"
                          >
                            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <input
                        type="text"
                        defaultValue={event.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="input-field text-sm py-1.5 mb-2"
                        placeholder="Titel"
                      />
                      <textarea
                        defaultValue={event.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="input-field text-sm py-1.5 resize-none min-h-[60px] mb-3"
                        placeholder="Beschreibung"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={event.is_key_event}
                            onChange={e => setForm(f => ({ ...f, is_key_event: e.target.checked }))}
                            className="accent-yellow-400"
                          />
                          Schlüsselereignis
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-1 px-2">
                            <X size={12} />
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: event.id, data: form })}
                            className="btn-primary text-xs py-1 px-2"
                          >
                            <Save size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      'group bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/70 transition-all',
                      event.is_key_event && 'border-yellow-700/40 bg-yellow-900/5'
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full text-white', typeInfo.color)}>
                              {typeInfo.label}
                            </span>
                            {event.is_key_event && (
                              <span className="flex items-center gap-1 text-xs text-yellow-400">
                                <Star size={10} fill="currentColor" /> Schlüssel
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                          {event.description && (
                            <p className="text-slate-400 text-sm mt-1">{event.description}</p>
                          )}
                          <div className="text-xs text-slate-500 mt-2">
                            {formatDate(event.event_date)}
                            {event.source && ` · Quelle: ${event.source}`}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditId(event.id)
                              setForm({
                                event_date: event.event_date,
                                title: event.title,
                                description: event.description,
                                event_type: event.event_type,
                                is_key_event: event.is_key_event,
                                source: event.source
                              })
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(event.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add form modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Ereignis hinzufügen</h3>
                <button onClick={() => setShowAdd(false)}><X size={16} className="text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Datum *</label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Typ</label>
                    <select
                      value={form.event_type}
                      onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Titel *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Kurze Beschreibung"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Beschreibung</label>
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field text-sm resize-none min-h-[80px]"
                    placeholder="Details zum Ereignis..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quelle</label>
                  <input
                    type="text"
                    value={form.source || ''}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="z.B. Zeuge, Dokument"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_key_event || false}
                    onChange={e => setForm(f => ({ ...f, is_key_event: e.target.checked }))}
                    className="accent-yellow-400"
                  />
                  Als Schlüsselereignis markieren
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">
                  Abbrechen
                </button>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!form.event_date || !form.title || addMutation.isPending}
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
