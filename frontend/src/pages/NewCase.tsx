import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, ChevronLeft, Scale } from 'lucide-react'
import { casesApi } from '../services/api'
import { CASE_TYPES, CASE_TYPE_LABELS } from '../lib/utils'
import toast from 'react-hot-toast'
import type { CaseCreate } from '../types'

const STEPS = [
  { title: 'Falltyp & Grundinfo', desc: 'Art des Falles und Titel' },
  { title: 'Vorfallsdetails', desc: 'Datum, Ort und Gegenpartei' },
  { title: 'Aktuelle Situation', desc: 'Dringlichkeit und Gericht' },
  { title: 'Überprüfung', desc: 'Fall erstellen' }
]

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Niedrig', desc: 'Kein unmittelbarer Handlungsbedarf' },
  { value: 'medium', label: 'Mittel', desc: 'Innerhalb einiger Wochen' },
  { value: 'high', label: 'Hoch', desc: 'Innerhalb weniger Tage' },
  { value: 'critical', label: 'Kritisch', desc: 'Sofortiger Handlungsbedarf' }
]

export default function NewCase() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<CaseCreate>>({
    case_type: '',
    title: '',
    description: '',
    urgency_level: 'medium',
    incident_date: '',
    location: '',
    opposing_party: '',
    court_name: '',
    case_number: '',
    next_hearing_date: ''
  })

  const mutation = useMutation({
    mutationFn: () => casesApi.create(form as CaseCreate),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Fall erfolgreich erstellt!')
      navigate(`/cases/${res.data.id}`)
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Falls.')
    }
  })

  const update = (key: keyof CaseCreate, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const canNext = () => {
    if (step === 0) return !!form.case_type && !!form.title?.trim()
    if (step === 1) return true
    if (step === 2) return true
    return true
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 })
  }
  const [dir, setDir] = useState(1)

  const goNext = () => { setDir(1); setStep(s => s + 1) }
  const goPrev = () => { setDir(-1); setStep(s => s - 1) }

  return (
    <div className="min-h-full p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/cases')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4">
            <ChevronLeft size={14} /> Zurück zu den Fällen
          </button>
          <h1 className="text-2xl font-bold text-white mb-1">Neuen Fall erstellen</h1>
          <p className="text-slate-400 text-sm">Dokumentieren Sie Ihren Rechtsfall Schritt für Schritt</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all border-2 ${
                  i < step
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : i === step
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <div className="hidden sm:block mt-1 text-center">
                  <div className={`text-xs font-medium ${i <= step ? 'text-white' : 'text-slate-500'}`}>
                    {s.title}
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 min-w-[20px] transition-all ${i < step ? 'bg-blue-600' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">{STEPS[step].title}</h2>
            <p className="text-slate-400 text-sm">{STEPS[step].desc}</p>
          </div>

          <div className="p-6 min-h-[320px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-5"
              >
                {/* Step 0: Type & Basic */}
                {step === 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Falltyp *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CASE_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => update('case_type', type)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                              form.case_type === type
                                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
                            }`}
                          >
                            {CASE_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Falltitel *</label>
                      <input
                        type="text"
                        value={form.title || ''}
                        onChange={e => update('title', e.target.value)}
                        className="input-field"
                        placeholder="z.B. Kündigung wegen Eigenbedarfs"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Beschreibung</label>
                      <textarea
                        value={form.description || ''}
                        onChange={e => update('description', e.target.value)}
                        className="input-field min-h-[100px] resize-none"
                        placeholder="Kurze Beschreibung des Falles..."
                      />
                    </div>
                  </>
                )}

                {/* Step 1: Incident details */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Datum des Vorfalls</label>
                      <input
                        type="date"
                        value={form.incident_date || ''}
                        onChange={e => update('incident_date', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Ort des Vorfalls</label>
                      <input
                        type="text"
                        value={form.location || ''}
                        onChange={e => update('location', e.target.value)}
                        className="input-field"
                        placeholder="z.B. Berlin, Musterstraße 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Gegenpartei</label>
                      <input
                        type="text"
                        value={form.opposing_party || ''}
                        onChange={e => update('opposing_party', e.target.value)}
                        className="input-field"
                        placeholder="z.B. Vermieter, Arbeitgeber"
                      />
                    </div>
                  </>
                )}

                {/* Step 2: Current situation */}
                {step === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Dringlichkeit</label>
                      <div className="grid grid-cols-2 gap-2">
                        {URGENCY_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => update('urgency_level', opt.value)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              form.urgency_level === opt.value
                                ? 'bg-blue-600/20 border-blue-500'
                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="text-sm font-medium text-white">{opt.label}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Gericht</label>
                      <input
                        type="text"
                        value={form.court_name || ''}
                        onChange={e => update('court_name', e.target.value)}
                        className="input-field"
                        placeholder="z.B. Amtsgericht Berlin Mitte"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Aktenzeichen</label>
                      <input
                        type="text"
                        value={form.case_number || ''}
                        onChange={e => update('case_number', e.target.value)}
                        className="input-field"
                        placeholder="z.B. 45 C 123/24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Nächster Verhandlungstermin</label>
                      <input
                        type="date"
                        value={form.next_hearing_date || ''}
                        onChange={e => update('next_hearing_date', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Falltyp</span>
                        <span className="text-white font-medium">{CASE_TYPE_LABELS[form.case_type || ''] || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Titel</span>
                        <span className="text-white font-medium">{form.title || '—'}</span>
                      </div>
                      {form.incident_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Vorfallsdatum</span>
                          <span className="text-white">{form.incident_date}</span>
                        </div>
                      )}
                      {form.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Ort</span>
                          <span className="text-white">{form.location}</span>
                        </div>
                      )}
                      {form.opposing_party && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Gegenpartei</span>
                          <span className="text-white">{form.opposing_party}</span>
                        </div>
                      )}
                      {form.urgency_level && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Dringlichkeit</span>
                          <span className="text-white">{URGENCY_OPTIONS.find(u => u.value === form.urgency_level)?.label}</span>
                        </div>
                      )}
                      {form.court_name && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Gericht</span>
                          <span className="text-white">{form.court_name}</span>
                        </div>
                      )}
                    </div>
                    {form.description && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Beschreibung</div>
                        <div className="text-sm text-slate-300 bg-slate-700/30 rounded-xl p-3">{form.description}</div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700/50 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Zurück
            </button>

            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="btn-primary disabled:opacity-40"
              >
                Weiter <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Scale size={16} />
                )}
                {mutation.isPending ? 'Wird erstellt...' : 'Fall erstellen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
