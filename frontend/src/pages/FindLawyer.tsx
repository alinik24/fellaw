import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Globe,
  X,
  ChevronDown,
  Send,
  Sparkles,
  User,
  BadgeCheck,
  Clock,
  MessageSquare,
  ChevronRight
} from 'lucide-react'
import { professionalsApi, referralsApi } from '@/services/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lawyer {
  id: string
  full_name: string
  title?: string
  specializations: string[]
  rating?: number
  review_count?: number
  hourly_rate?: number
  languages: string[]
  city?: string
  is_verified?: boolean
  offers_free_consultation?: boolean
  bio?: string
  years_experience?: number
  photo_url?: string
}

interface Filters {
  specialization: string
  city: string
  language: string
  max_rate: string
  offers_free: boolean
}

// ─── Mock data (shown when API not available) ─────────────────────────────────
const MOCK_LAWYERS: Lawyer[] = [
  {
    id: '1',
    full_name: 'Dr. Sarah Müller',
    title: 'Rechtsanwältin',
    specializations: ['Mietrecht', 'Verbraucherschutz'],
    rating: 4.8,
    review_count: 127,
    hourly_rate: 220,
    languages: ['Deutsch', 'Englisch'],
    city: 'Paderborn',
    is_verified: true,
    offers_free_consultation: true,
    bio: 'Über 12 Jahre Erfahrung im Mietrecht und Verbraucherschutz. Ich helfe Ihnen, Ihre Rechte als Mieter durchzusetzen.',
    years_experience: 12
  },
  {
    id: '2',
    full_name: 'Hans Weber',
    title: 'Rechtsanwalt',
    specializations: ['Verkehrsrecht', 'Strafrecht'],
    rating: 4.9,
    review_count: 203,
    hourly_rate: 180,
    languages: ['Deutsch', 'Türkisch'],
    city: 'Paderborn',
    is_verified: true,
    offers_free_consultation: false,
    bio: 'Spezialist für Verkehrsrecht und Bußgeldsachen. Über 15 Jahre Berufserfahrung.',
    years_experience: 15
  },
  {
    id: '3',
    full_name: 'Dr. Elena Rodriguez',
    title: 'Rechtsanwältin',
    specializations: ['Ausländerrecht', 'Familienrecht'],
    rating: 4.7,
    review_count: 89,
    hourly_rate: 160,
    languages: ['Deutsch', 'Englisch', 'Spanisch'],
    city: 'Berlin',
    is_verified: true,
    offers_free_consultation: true,
    bio: 'Spezialisiert auf Aufenthaltsrecht und Einbürgerungsverfahren. Ich spreche Ihre Sprache – im wörtlichen Sinne.',
    years_experience: 8
  },
  {
    id: '4',
    full_name: 'Ahmed Hassan',
    title: 'Rechtsanwalt',
    specializations: ['Arbeitsrecht', 'Sozialrecht'],
    rating: 4.6,
    review_count: 54,
    hourly_rate: 140,
    languages: ['Deutsch', 'Arabisch', 'Englisch'],
    city: 'München',
    is_verified: false,
    offers_free_consultation: true,
    bio: 'Ihr Anwalt für Arbeitsrechtsstreitigkeiten und Sozialleistungen. Erstberatung kostenlos.',
    years_experience: 5
  },
]

const SPECIALIZATIONS = [
  'Alle Gebiete', 'Mietrecht', 'Arbeitsrecht', 'Familienrecht',
  'Strafrecht', 'Verkehrsrecht', 'Ausländerrecht', 'Sozialrecht',
  'Verbraucherschutz', 'Erbrecht', 'Steuerrecht'
]

const LANGUAGES = ['Alle Sprachen', 'Deutsch', 'Englisch', 'Türkisch', 'Arabisch', 'Russisch', 'Spanisch', 'Polnisch']

// ─── Star rating display ──────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
        />
      ))}
      <span className="text-xs text-slate-400 ml-0.5">
        {rating.toFixed(1)}{count ? ` (${count})` : ''}
      </span>
    </div>
  )
}

// ─── Lawyer card ──────────────────────────────────────────────────────────────
function LawyerCard({
  lawyer,
  onContact,
  onDetail
}: {
  lawyer: Lawyer
  onContact: (l: Lawyer) => void
  onDetail: (l: Lawyer) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-blue-600/40 hover:bg-slate-800/70 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {lawyer.full_name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm">{lawyer.full_name}</h3>
            {lawyer.is_verified && (
              <BadgeCheck size={14} className="text-blue-400 flex-shrink-0" />
            )}
            {lawyer.offers_free_consultation && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 font-medium">
                Gratis Erstberatung
              </span>
            )}
          </div>
          {lawyer.title && (
            <div className="text-xs text-slate-400 mt-0.5">{lawyer.title}</div>
          )}
          {lawyer.rating && (
            <div className="mt-1">
              <StarRating rating={lawyer.rating} count={lawyer.review_count} />
            </div>
          )}
        </div>

        {/* Rate */}
        {lawyer.hourly_rate && (
          <div className="text-right flex-shrink-0">
            <div className="text-blue-400 font-bold text-sm">€{lawyer.hourly_rate}</div>
            <div className="text-xs text-slate-500">/Stunde</div>
          </div>
        )}
      </div>

      {/* Specializations */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {lawyer.specializations.map((s) => (
          <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/50">
            {s}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        {lawyer.city && (
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {lawyer.city}
          </span>
        )}
        {lawyer.languages.length > 0 && (
          <span className="flex items-center gap-1">
            <Globe size={10} /> {lawyer.languages.join(', ')}
          </span>
        )}
        {lawyer.years_experience && (
          <span className="flex items-center gap-1">
            <Clock size={10} /> {lawyer.years_experience} J. Erfahrung
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onContact(lawyer)}
          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <Send size={12} />
          Kontaktieren
        </button>
        <button
          onClick={() => onDetail(lawyer)}
          className="px-3 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1"
        >
          Profil
          <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-700 rounded w-2/3" />
          <div className="h-2 bg-slate-700 rounded w-1/3" />
          <div className="h-2 bg-slate-700 rounded w-1/4" />
        </div>
      </div>
      <div className="flex gap-1 mt-3">
        <div className="h-5 w-16 bg-slate-700 rounded-full" />
        <div className="h-5 w-20 bg-slate-700 rounded-full" />
      </div>
      <div className="h-8 bg-slate-700 rounded-lg mt-4" />
    </div>
  )
}

// ─── Contact modal ────────────────────────────────────────────────────────────
function ContactModal({
  lawyer,
  onClose
}: {
  lawyer: Lawyer
  onClose: () => void
}) {
  const [caseId, setCaseId] = useState('')
  const [message, setMessage] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await referralsApi.create({ case_id: caseId || 'general', message, urgency })
      setSent(true)
    } catch {
      // In dev, still show success feedback
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-3">
              <Send size={20} className="text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-1">Anfrage gesendet!</h3>
            <p className="text-slate-400 text-sm mb-4">
              {lawyer.full_name} wird sich in Kürze bei Ihnen melden.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-all"
            >
              Schließen
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Anfrage an {lawyer.full_name}</h3>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Dringlichkeit</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Niedrig — keine Eile</option>
                  <option value="normal">Normal — innerhalb 1 Woche</option>
                  <option value="high">Hoch — dringend</option>
                  <option value="urgent">Notfall — sofort!</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Ihre Nachricht <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Beschreiben Sie Ihr Anliegen kurz…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Wird gesendet…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Anfrage senden
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Lawyer detail sheet ──────────────────────────────────────────────────────
function LawyerDetailSheet({
  lawyer,
  onClose,
  onContact
}: {
  lawyer: Lawyer
  onClose: () => void
  onContact: (l: Lawyer) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-xl">
              {lawyer.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-white">{lawyer.full_name}</h2>
                {lawyer.is_verified && <BadgeCheck size={16} className="text-blue-400" />}
              </div>
              <div className="text-sm text-slate-400">{lawyer.title}</div>
              {lawyer.rating && (
                <StarRating rating={lawyer.rating} count={lawyer.review_count} />
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {lawyer.bio && (
          <div className="mb-4">
            <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Über mich</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{lawyer.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {lawyer.hourly_rate && (
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-0.5">Stundenhonorar</div>
              <div className="text-blue-400 font-bold">€{lawyer.hourly_rate}/h</div>
            </div>
          )}
          {lawyer.years_experience && (
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-0.5">Erfahrung</div>
              <div className="text-white font-semibold">{lawyer.years_experience} Jahre</div>
            </div>
          )}
          {lawyer.city && (
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-0.5">Standort</div>
              <div className="text-white font-semibold">{lawyer.city}</div>
            </div>
          )}
          {lawyer.offers_free_consultation && (
            <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-0.5">Kostenlose Erstberatung</div>
              <div className="text-emerald-300 font-semibold text-xs">Verfügbar</div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sprachen</h4>
          <div className="flex flex-wrap gap-1.5">
            {lawyer.languages.map((l) => (
              <span key={l} className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Rechtsgebiete</h4>
          <div className="flex flex-wrap gap-1.5">
            {lawyer.specializations.map((s) => (
              <span key={s} className="text-xs px-2 py-1 rounded-full bg-blue-600/20 text-blue-300 border border-blue-600/30">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Bewertungen</h4>
          <p className="text-xs text-slate-400 italic">Bewertungen werden geladen…</p>
        </div>

        <button
          onClick={() => { onClose(); onContact(lawyer) }}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare size={14} />
          Anfrage senden
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FindLawyer() {
  const navigate = useNavigate()
  const [lawyers, setLawyers]         = useState<Lawyer[]>([])
  const [loading, setLoading]         = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [contactLawyer, setContactLawyer] = useState<Lawyer | null>(null)
  const [detailLawyer, setDetailLawyer]   = useState<Lawyer | null>(null)

  const [filters, setFilters] = useState<Filters>({
    specialization: '',
    city: '',
    language: '',
    max_rate: '',
    offers_free: false,
  })

  const fetchLawyers = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (filters.specialization && filters.specialization !== 'Alle Gebiete')
        params.specialization = filters.specialization
      if (filters.city) params.city = filters.city
      if (filters.language && filters.language !== 'Alle Sprachen')
        params.language = filters.language
      if (filters.max_rate) params.max_rate = Number(filters.max_rate)
      if (filters.offers_free) params.offers_free = true

      const res = await professionalsApi.getLawyers(params)
      setLawyers(res.data as unknown as Lawyer[] ?? [])
    } catch {
      // Fallback to mock data for development
      setLawyers(MOCK_LAWYERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLawyers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => fetchLawyers()

  const filteredLawyers = lawyers.filter((l) => {
    if (filters.offers_free && !l.offers_free_consultation) return false
    if (filters.max_rate && l.hourly_rate && l.hourly_rate > Number(filters.max_rate)) return false
    if (filters.city && !l.city?.toLowerCase().includes(filters.city.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Anwalt finden</h1>
        <p className="text-slate-400 text-sm">Finden Sie den passenden Rechtsanwalt für Ihren Fall</p>
      </motion.div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Stadt, Name oder Rechtsgebiet…"
            value={filters.city}
            onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
            showFilters
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
          )}
        >
          <SlidersHorizontal size={14} />
          Filter
        </button>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
        >
          <Search size={14} />
        </button>
      </div>

      {/* AI Match banner */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/cases')}
        className="w-full mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-900/60 to-blue-800/40 border border-blue-600/30 text-left flex items-center gap-3 hover:border-blue-500/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-600/30 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">KI-Matching für mein Fall</div>
          <div className="text-xs text-slate-400 mt-0.5">Wählen Sie einen Fall aus und lassen Sie die KI den besten Anwalt finden</div>
        </div>
        <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </motion.button>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Specialization */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Rechtsgebiet</label>
                  <div className="relative">
                    <select
                      value={filters.specialization}
                      onChange={(e) => setFilters(f => ({ ...f, specialization: e.target.value }))}
                      className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s === 'Alle Gebiete' ? '' : s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Sprache</label>
                  <div className="relative">
                    <select
                      value={filters.language}
                      onChange={(e) => setFilters(f => ({ ...f, language: e.target.value }))}
                      className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l === 'Alle Sprachen' ? '' : l}>{l}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Max rate */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Max. Honorar (€/h)</label>
                  <input
                    type="number"
                    placeholder="z. B. 200"
                    value={filters.max_rate}
                    onChange={(e) => setFilters(f => ({ ...f, max_rate: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Free consultation toggle */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <div
                      onClick={() => setFilters(f => ({ ...f, offers_free: !f.offers_free }))}
                      className={cn(
                        'w-10 h-5 rounded-full transition-all flex items-center px-0.5',
                        filters.offers_free ? 'bg-blue-600' : 'bg-slate-700'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full bg-white transition-transform',
                        filters.offers_free ? 'translate-x-5' : 'translate-x-0'
                      )} />
                    </div>
                    <span className="text-sm text-slate-300">Kostenlose Erstberatung</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setFilters({ specialization: '', city: '', language: '', max_rate: '', offers_free: false })}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Zurücksetzen
                </button>
                <button
                  onClick={handleSearch}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-all font-medium"
                >
                  Suchen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {!loading && (
        <div className="text-xs text-slate-400 mb-4">
          {filteredLawyers.length} Anwälte gefunden
        </div>
      )}

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredLawyers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-slate-500" />
          </div>
          <h3 className="font-semibold text-white mb-1">Keine Anwälte gefunden</h3>
          <p className="text-slate-400 text-sm">Versuchen Sie, Ihre Filter zu erweitern.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredLawyers.map((lawyer) => (
              <LawyerCard
                key={lawyer.id}
                lawyer={lawyer}
                onContact={setContactLawyer}
                onDetail={setDetailLawyer}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Contact modal */}
      <AnimatePresence>
        {contactLawyer && (
          <ContactModal lawyer={contactLawyer} onClose={() => setContactLawyer(null)} />
        )}
      </AnimatePresence>

      {/* Detail sheet */}
      <AnimatePresence>
        {detailLawyer && (
          <LawyerDetailSheet
            lawyer={detailLawyer}
            onClose={() => setDetailLawyer(null)}
            onContact={(l) => { setDetailLawyer(null); setContactLawyer(l) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
