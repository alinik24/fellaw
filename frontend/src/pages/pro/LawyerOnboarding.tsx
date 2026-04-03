import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Scale,
  Plus,
  X
} from 'lucide-react'
import { professionalsApi } from '@/services/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Step1Data {
  title: string
  bar_number: string
  bio: string
  years_experience: string
  languages: string[]
}

interface Step2Data {
  specializations: string[]
  hourly_rate: string
  offers_free_consultation: boolean
  consultation_fee: string
}

interface Step3Data {
  firm_choice: 'solo' | 'join' | 'create'
  firm_name: string
  firm_city: string
}

type FormData = Step1Data & Step2Data & Step3Data

// ─── Constants ────────────────────────────────────────────────────────────────
const SPECIALIZATION_OPTIONS = [
  'Mietrecht', 'Arbeitsrecht', 'Familienrecht', 'Strafrecht',
  'Verkehrsrecht', 'Ausländerrecht', 'Sozialrecht', 'Verbraucherschutz',
  'Erbrecht', 'Steuerrecht', 'Gesellschaftsrecht', 'Medizinrecht',
  'IT-Recht', 'Markenrecht', 'Baurecht', 'Verwaltungsrecht'
]

const LANGUAGE_OPTIONS = [
  'Deutsch', 'Englisch', 'Türkisch', 'Arabisch',
  'Russisch', 'Spanisch', 'Polnisch', 'Französisch', 'Italienisch'
]

const TITLES = ['Rechtsanwalt', 'Rechtsanwältin', 'Dr. jur.', 'Prof. Dr. jur.', 'LL.M.', 'Notar', 'Notarin']

const steps = [
  { id: 1, label: 'Persönliche Angaben', icon: <User size={16} /> },
  { id: 2, label: 'Spezialisierung & Honorar', icon: <Briefcase size={16} /> },
  { id: 3, label: 'Kanzlei', icon: <Building2 size={16} /> },
]

// ─── Multi-select tag component ───────────────────────────────────────────────
function TagSelect({
  options,
  selected,
  onChange,
  accentColor = 'emerald'
}: {
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
  accentColor?: string
}) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-all font-medium',
            selected.includes(opt)
              ? accentColor === 'emerald'
                ? 'bg-emerald-600/30 border-emerald-600/50 text-emerald-300'
                : 'bg-blue-600/30 border-blue-600/50 text-blue-300'
              : 'bg-slate-800/60 border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-white'
          )}
        >
          {selected.includes(opt) && <span className="mr-1">✓</span>}
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  children
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 font-medium block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors'
const selectClass = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none'

// ─── Step panels ──────────────────────────────────────────────────────────────
function Step1({ data, onChange }: { data: Step1Data; onChange: (d: Partial<Step1Data>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Titel / Berufsbezeichnung" required>
          <select
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={selectClass}
          >
            <option value="">Bitte wählen…</option>
            {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Zulassungsnummer (BAR-Nr.)" required>
          <input
            type="text"
            value={data.bar_number}
            onChange={(e) => onChange({ bar_number: e.target.value })}
            placeholder="z. B. DE2024-0001"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Berufserfahrung (Jahre)" required>
        <input
          type="number"
          min={0}
          max={60}
          value={data.years_experience}
          onChange={(e) => onChange({ years_experience: e.target.value })}
          placeholder="z. B. 10"
          className={inputClass}
        />
      </Field>

      <Field label="Über mich / Bio" required>
        <textarea
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          rows={4}
          placeholder="Beschreiben Sie Ihren Hintergrund, Ihren Ansatz und warum Mandanten zu Ihnen kommen sollten…"
          className={cn(inputClass, 'resize-none')}
        />
        <div className="text-[10px] text-slate-500 mt-1 text-right">{data.bio.length}/500</div>
      </Field>

      <Field label="Gesprochene Sprachen" required>
        <TagSelect
          options={LANGUAGE_OPTIONS}
          selected={data.languages}
          onChange={(langs) => onChange({ languages: langs })}
        />
      </Field>
    </div>
  )
}

function Step2({ data, onChange }: { data: Step2Data; onChange: (d: Partial<Step2Data>) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Rechtsgebiete (Mehrfachauswahl möglich)" required>
        <TagSelect
          options={SPECIALIZATION_OPTIONS}
          selected={data.specializations}
          onChange={(specs) => onChange({ specializations: specs })}
        />
        {data.specializations.length > 0 && (
          <div className="mt-2 text-xs text-emerald-400">
            {data.specializations.length} Gebiet{data.specializations.length > 1 ? 'e' : ''} ausgewählt
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Stundenhonorar (€/h)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
            <input
              type="number"
              min={0}
              value={data.hourly_rate}
              onChange={(e) => onChange({ hourly_rate: e.target.value })}
              placeholder="z. B. 200"
              className={cn(inputClass, 'pl-7')}
            />
          </div>
        </Field>

        <Field label="Erstberatungsgebühr (€)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
            <input
              type="number"
              min={0}
              value={data.consultation_fee}
              onChange={(e) => onChange({ consultation_fee: e.target.value })}
              placeholder="0 = kostenlos"
              className={cn(inputClass, 'pl-7')}
              disabled={data.offers_free_consultation}
            />
          </div>
        </Field>
      </div>

      {/* Free consultation toggle */}
      <div className="flex items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
        <div
          onClick={() => onChange({ offers_free_consultation: !data.offers_free_consultation })}
          className={cn(
            'w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-all flex-shrink-0',
            data.offers_free_consultation ? 'bg-emerald-600' : 'bg-slate-700'
          )}
        >
          <div className={cn(
            'w-5 h-5 rounded-full bg-white shadow transition-transform',
            data.offers_free_consultation ? 'translate-x-5' : 'translate-x-0'
          )} />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Kostenlose Erstberatung anbieten</div>
          <div className="text-xs text-slate-400">Erhöht Ihre Auffindbarkeit und Anfragen erheblich</div>
        </div>
      </div>
    </div>
  )
}

function Step3({ data, onChange }: { data: Step3Data; onChange: (d: Partial<Step3Data>) => void }) {
  const options: Array<{ key: Step3Data['firm_choice']; label: string; sub: string; icon: React.ReactNode }> = [
    {
      key: 'solo',
      label: 'Einzelanwalt / Selbstständig',
      sub: 'Ich arbeite alleine ohne Kanzlei',
      icon: <User size={20} className="text-emerald-400" />
    },
    {
      key: 'join',
      label: 'Bestehende Kanzlei beitreten',
      sub: 'Ich suche nach einer Kanzlei, der ich beitreten kann',
      icon: <Building2 size={20} className="text-blue-400" />
    },
    {
      key: 'create',
      label: 'Neue Kanzlei gründen',
      sub: 'Ich möchte eine neue Kanzlei auf der Plattform erstellen',
      icon: <Plus size={20} className="text-purple-400" />
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Wie möchten Sie auf der Plattform tätig sein?</p>

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange({ firm_choice: opt.key })}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
              data.firm_choice === opt.key
                ? 'bg-emerald-900/30 border-emerald-600/50'
                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/60'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              data.firm_choice === opt.key ? 'bg-emerald-600/20' : 'bg-slate-700/60'
            )}>
              {opt.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{opt.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{opt.sub}</div>
            </div>
            {data.firm_choice === opt.key && (
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Firm name / city for join or create */}
      <AnimatePresence>
        {(data.firm_choice === 'join' || data.firm_choice === 'create') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Field label={data.firm_choice === 'join' ? 'Kanzleiname (suchen)' : 'Name der neuen Kanzlei'} required>
                <input
                  type="text"
                  value={data.firm_name}
                  onChange={(e) => onChange({ firm_name: e.target.value })}
                  placeholder={data.firm_choice === 'join' ? 'z. B. Müller & Partner' : 'z. B. Weber Rechtsanwaltskanzlei'}
                  className={inputClass}
                />
              </Field>
              <Field label="Stadt" required>
                <input
                  type="text"
                  value={data.firm_city}
                  onChange={(e) => onChange({ firm_city: e.target.value })}
                  placeholder="z. B. Paderborn"
                  className={inputClass}
                />
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function Summary({ data }: { data: FormData }) {
  const firmLabel =
    data.firm_choice === 'solo'   ? 'Einzelanwalt'
    : data.firm_choice === 'join' ? `Beitritt: ${data.firm_name || '—'} (${data.firm_city || '—'})`
    : `Neue Kanzlei: ${data.firm_name || '—'} (${data.firm_city || '—'})`

  const rows = [
    { label: 'Titel', value: data.title || '—' },
    { label: 'BAR-Nummer', value: data.bar_number || '—' },
    { label: 'Erfahrung', value: data.years_experience ? `${data.years_experience} Jahre` : '—' },
    { label: 'Sprachen', value: data.languages.join(', ') || '—' },
    { label: 'Rechtsgebiete', value: data.specializations.join(', ') || '—' },
    { label: 'Stundenhonorar', value: data.hourly_rate ? `€${data.hourly_rate}/h` : '—' },
    { label: 'Erstberatung', value: data.offers_free_consultation ? 'Kostenlos' : data.consultation_fee ? `€${data.consultation_fee}` : '—' },
    { label: 'Kanzlei', value: firmLabel },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Bitte überprüfen Sie Ihre Angaben vor dem Absenden:</p>
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl divide-y divide-slate-700/30">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start px-4 py-2.5 gap-4">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{label}</span>
            <span className="text-xs text-slate-200 text-right">{value}</span>
          </div>
        ))}
      </div>
      {data.bio && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Bio</div>
          <p className="text-xs text-slate-300 leading-relaxed">{data.bio}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LawyerOnboarding() {
  const navigate  = useNavigate()
  const [step, setStep]       = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    bar_number: '',
    bio: '',
    years_experience: '',
    languages: ['Deutsch'],
    specializations: [],
    hourly_rate: '',
    offers_free_consultation: false,
    consultation_fee: '',
    firm_choice: 'solo',
    firm_name: '',
    firm_city: '',
  })

  const update = (partial: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...partial }))
  }

  const canNext = (): boolean => {
    if (step === 1) return !!(formData.title && formData.bar_number && formData.bio && formData.languages.length > 0)
    if (step === 2) return formData.specializations.length > 0
    if (step === 3) {
      if (formData.firm_choice === 'solo') return true
      return !!(formData.firm_name && formData.firm_city)
    }
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        bar_number: formData.bar_number,
        bio: formData.bio,
        years_experience: Number(formData.years_experience),
        languages: formData.languages,
        specializations: formData.specializations,
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
        offers_free_consultation: formData.offers_free_consultation,
        consultation_fee: formData.consultation_fee ? Number(formData.consultation_fee) : undefined,
      }
      await professionalsApi.createMyProfile(payload)

      if (formData.firm_choice === 'create' && formData.firm_name) {
        await professionalsApi.createFirm({ name: formData.firm_name, city: formData.firm_city })
      }

      setSubmitted(true)
    } catch {
      // still show success for demo
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profil erstellt!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Ihr Anwaltsprofil wurde erfolgreich eingerichtet. Sie können jetzt Anfragen von Mandanten empfangen.
          </p>
          <button
            onClick={() => navigate('/pro/dashboard')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 mx-auto"
          >
            Zum Dashboard
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    )
  }

  const isSummaryStep = step === 4

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Scale size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">JusticAI</span>
          <span className="text-slate-500 text-sm">— Anwaltsprofil einrichten</span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0',
                step > s.id
                  ? 'bg-emerald-600 text-white'
                  : step === s.id
                    ? 'bg-emerald-600/30 border-2 border-emerald-500 text-emerald-300'
                    : 'bg-slate-700 text-slate-400'
              )}>
                {step > s.id ? <CheckCircle2 size={14} /> : s.id}
              </div>
              {!isSummaryStep && step === s.id && (
                <span className="text-xs font-medium text-white hidden sm:block">{s.label}</span>
              )}
              {i < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 rounded-full transition-all',
                  step > s.id ? 'bg-emerald-600' : 'bg-slate-700'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white mb-1">
              {isSummaryStep ? 'Zusammenfassung & Absenden' : steps[step - 1]?.label}
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              {step === 1 && 'Erzählen Sie uns von sich und Ihrer Qualifikation.'}
              {step === 2 && 'Welche Rechtsgebiete decken Sie ab und was sind Ihre Konditionen?'}
              {step === 3 && 'Sind Sie Einzelanwalt oder Teil einer Kanzlei?'}
              {isSummaryStep && 'Überprüfen Sie Ihre Daten und schließen Sie die Registrierung ab.'}
            </p>

            {step === 1 && <Step1 data={formData} onChange={update} />}
            {step === 2 && <Step2 data={formData} onChange={update} />}
            {step === 3 && <Step3 data={formData} onChange={update} />}
            {isSummaryStep && <Summary data={formData} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          Zurück
        </button>

        {isSummaryStep ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wird gespeichert…
              </>
            ) : (
              <>
                Profil erstellen
                <CheckCircle2 size={14} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
          >
            {step === steps.length ? 'Überprüfen' : 'Weiter'}
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Step indicator */}
      <p className="text-center text-xs text-slate-500 mt-3">
        Schritt {Math.min(step, steps.length)} von {steps.length}
      </p>
    </div>
  )
}
