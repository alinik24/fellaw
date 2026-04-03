import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  UserSearch,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Trash2,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import { referralsApi } from '@/services/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type ReferralStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

interface Referral {
  id: string
  case_id: string
  case_title?: string
  lawyer_name?: string
  lawyer_id?: string
  status: ReferralStatus
  message?: string
  lawyer_response?: string
  urgency?: string
  created_at: string
  updated_at?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_REFERRALS: Referral[] = [
  {
    id: '1',
    case_id: 'c1',
    case_title: 'Mieterhöhungsstreit',
    lawyer_name: 'Dr. Sarah Müller',
    status: 'accepted',
    message: 'Ich benötige Hilfe bei einem unrechtmäßigen Mieterhöhungsverlangen.',
    lawyer_response: 'Gerne helfe ich Ihnen. Ich melde mich innerhalb 24h für einen Termin.',
    urgency: 'high',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-19T09:00:00Z',
  },
  {
    id: '2',
    case_id: 'c2',
    case_title: 'Kündigung prüfen lassen',
    lawyer_name: 'Hans Weber',
    status: 'pending',
    message: 'Mein Arbeitgeber hat mich fristlos gekündigt. Ist das rechtens?',
    urgency: 'urgent',
    created_at: '2026-03-20T14:30:00Z',
  },
  {
    id: '3',
    case_id: 'c3',
    case_title: 'Bußgeldbescheid',
    lawyer_name: 'Dr. Elena Rodriguez',
    status: 'declined',
    message: 'Möchte einen Bußgeldbescheid anfechten.',
    lawyer_response: 'Leider ist meine Kapazität derzeit ausgeschöpft. Bitte wenden Sie sich an einen anderen Anwalt.',
    urgency: 'normal',
    created_at: '2026-03-15T08:00:00Z',
    updated_at: '2026-03-15T16:00:00Z',
  },
  {
    id: '4',
    case_id: 'c4',
    case_title: 'Visumsantrag',
    lawyer_name: 'Ahmed Hassan',
    status: 'completed',
    message: 'Benötige Unterstützung beim Verlängerungsantrag meines Aufenthaltstitels.',
    lawyer_response: 'Fall erfolgreich abgeschlossen. Ihr Antrag wurde eingereicht.',
    urgency: 'normal',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-03-10T12:00:00Z',
  },
]

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReferralStatus, {
  label: string
  color: string
  bg: string
  border: string
  icon: React.ReactNode
}> = {
  pending: {
    label: 'Ausstehend',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    icon: <Clock size={12} />
  },
  accepted: {
    label: 'Akzeptiert',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    icon: <CheckCircle2 size={12} />
  },
  declined: {
    label: 'Abgelehnt',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    icon: <XCircle size={12} />
  },
  completed: {
    label: 'Abgeschlossen',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    icon: <CheckCircle2 size={12} />
  },
  cancelled: {
    label: 'Storniert',
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/30',
    icon: <XCircle size={12} />
  },
}

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Niedrig',  color: 'text-slate-400' },
  normal: { label: 'Normal',   color: 'text-blue-400' },
  high:   { label: 'Hoch',     color: 'text-amber-400' },
  urgent: { label: 'Notfall',  color: 'text-red-400' },
}

// ─── Referral card ────────────────────────────────────────────────────────────
function ReferralCard({
  referral,
  onCancel
}: {
  referral: Referral
  onCancel: (id: string) => void
}) {
  const status = STATUS_CONFIG[referral.status]
  const urgency = URGENCY_CONFIG[referral.urgency ?? 'normal']
  const [expanded, setExpanded] = useState(false)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/60 transition-all"
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status dot */}
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', status.bg, status.border, 'border')}>
            <span className={status.color}>{status.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Case title + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate">
                {referral.case_title ?? `Fall #${referral.case_id.slice(0, 6)}`}
              </h3>
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                status.color, status.bg, status.border
              )}>
                {status.label}
              </span>
              {referral.urgency && referral.urgency !== 'normal' && (
                <span className={cn('text-[10px] font-semibold', urgency.color)}>
                  {referral.urgency === 'urgent' && <AlertTriangle size={10} className="inline mr-0.5" />}
                  {urgency.label}
                </span>
              )}
            </div>

            {/* Lawyer */}
            {referral.lawyer_name && (
              <div className="text-xs text-slate-400 mt-0.5">
                Anwalt: <span className="text-slate-200">{referral.lawyer_name}</span>
              </div>
            )}

            {/* Date */}
            <div className="text-xs text-slate-500 mt-0.5">
              Gesendet am {formatDate(referral.created_at)}
              {referral.updated_at && referral.updated_at !== referral.created_at && (
                <span> · Aktualisiert {formatDate(referral.updated_at)}</span>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight
              size={14}
              className={cn('transition-transform', expanded && 'rotate-90')}
            />
          </button>
        </div>

        {/* Message preview */}
        {!expanded && referral.message && (
          <p className="text-xs text-slate-400 mt-2 ml-11 line-clamp-1 italic">
            "{referral.message}"
          </p>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-700/40 pt-3 space-y-3">
              {referral.message && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Ihre Nachricht</div>
                  <p className="text-sm text-slate-300 bg-slate-800/60 rounded-lg p-3 italic">
                    "{referral.message}"
                  </p>
                </div>
              )}

              {referral.lawyer_response && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Antwort des Anwalts</div>
                  <p className={cn(
                    'text-sm rounded-lg p-3',
                    referral.status === 'declined'
                      ? 'text-red-300 bg-red-900/20 border border-red-800/30'
                      : 'text-emerald-300 bg-emerald-900/20 border border-emerald-800/30'
                  )}>
                    "{referral.lawyer_response}"
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {referral.status === 'pending' && (
                  <button
                    onClick={() => onCancel(referral.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-700/50 text-red-400 hover:bg-red-900/20 text-xs font-medium transition-all"
                  >
                    <Trash2 size={12} />
                    Anfrage zurückziehen
                  </button>
                )}
                {(referral.status === 'declined' || referral.status === 'cancelled') && (
                  <button
                    onClick={() => {/* navigate to find-lawyer */}}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 text-xs font-medium transition-all"
                  >
                    <UserSearch size={12} />
                    Anderen Anwalt suchen
                  </button>
                )}
                {referral.status === 'accepted' && (
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 text-xs font-medium transition-all"
                  >
                    <MessageSquare size={12} />
                    Nachricht senden
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MyReferrals() {
  const navigate  = useNavigate()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<ReferralStatus | 'all'>('all')

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const res = await referralsApi.getMy()
      setReferrals(res.data as unknown as Referral[])
    } catch {
      setReferrals(MOCK_REFERRALS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  const handleCancel = async (id: string) => {
    try {
      await referralsApi.cancel(id)
      setReferrals((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' as ReferralStatus } : r))
    } catch {
      setReferrals((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' as ReferralStatus } : r))
    }
  }

  const tabs: Array<{ key: ReferralStatus | 'all'; label: string }> = [
    { key: 'all',       label: 'Alle' },
    { key: 'pending',   label: 'Ausstehend' },
    { key: 'accepted',  label: 'Akzeptiert' },
    { key: 'completed', label: 'Abgeschlossen' },
    { key: 'declined',  label: 'Abgelehnt' },
  ]

  const filtered = filter === 'all'
    ? referrals
    : referrals.filter((r) => r.status === filter)

  const counts = tabs.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? referrals.length
      : referrals.filter((r) => r.status === tab.key).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Meine Anfragen</h1>
          <p className="text-slate-400 text-sm">Alle Anfragen, die Sie an Anwälte gesendet haben</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReferrals}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Aktualisieren"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate('/find-lawyer')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
          >
            <UserSearch size={14} />
            Neue Anfrage
          </button>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                filter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              )}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                  <div className="h-2 bg-slate-700 rounded w-1/3" />
                  <div className="h-2 bg-slate-700 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Send size={24} className="text-slate-500" />
          </div>
          <h3 className="font-semibold text-white mb-1">
            {filter === 'all' ? 'Keine Anfragen vorhanden' : 'Keine Anfragen in dieser Kategorie'}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {filter === 'all'
              ? 'Finden Sie einen Anwalt und stellen Sie Ihre erste Anfrage.'
              : 'Wechseln Sie zu einer anderen Kategorie oder erstellen Sie eine neue Anfrage.'}
          </p>
          <button
            onClick={() => navigate('/find-lawyer')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
          >
            <UserSearch size={14} />
            Anwalt finden
          </button>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {filtered.map((referral) => (
              <ReferralCard
                key={referral.id}
                referral={referral}
                onCancel={handleCancel}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Summary banner */}
      {!loading && referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Zusammenfassung</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['pending', 'accepted', 'completed', 'declined'] as ReferralStatus[]).map((s) => {
              const count = referrals.filter((r) => r.status === s).length
              const cfg = STATUS_CONFIG[s]
              return (
                <div key={s} className="text-center">
                  <div className={cn('text-lg font-bold', cfg.color)}>{count}</div>
                  <div className="text-[10px] text-slate-500">{cfg.label}</div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
