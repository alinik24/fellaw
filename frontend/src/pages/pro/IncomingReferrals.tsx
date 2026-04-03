import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  User,
  Briefcase,
  MessageSquare,
  Euro,
  X
} from 'lucide-react'
import { referralsApi } from '@/services/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type ReferralStatus = 'new' | 'accepted' | 'declined' | 'completed'

interface IncomingReferral {
  id: string
  citizen_name: string
  case_id: string
  case_type: string
  urgency: 'low' | 'normal' | 'high' | 'urgent'
  message: string
  created_at: string
  status: ReferralStatus
  estimated_fee?: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK: IncomingReferral[] = [
  {
    id: '1',
    citizen_name: 'Thomas Weber',
    case_id: 'c1',
    case_type: 'Mietrecht',
    urgency: 'high',
    message: 'Mein Vermieter verlangt eine Mieterhöhung von 30%. Das erscheint mir unverhältnismäßig. Bitte prüfen Sie meinen Fall.',
    created_at: '2026-03-21T08:15:00Z',
    status: 'new',
  },
  {
    id: '2',
    citizen_name: 'Elena Rodriguez',
    case_id: 'c2',
    case_type: 'Arbeitsrecht',
    urgency: 'normal',
    message: 'Ich habe eine Abmahnung erhalten und verstehe nicht, ob sie rechtmäßig ist. Können Sie mir helfen?',
    created_at: '2026-03-21T06:00:00Z',
    status: 'new',
  },
  {
    id: '3',
    citizen_name: 'Ahmed Hassan',
    case_id: 'c3',
    case_type: 'Ausländerrecht',
    urgency: 'urgent',
    message: 'Meine Aufenthaltserlaubnis läuft in 48 Stunden ab und die Ausländerbehörde hat meinen Antrag abgelehnt!',
    created_at: '2026-03-20T22:00:00Z',
    status: 'new',
  },
  {
    id: '4',
    citizen_name: 'Maria Schmidt',
    case_id: 'c4',
    case_type: 'Familienrecht',
    urgency: 'normal',
    message: 'Scheidungsverfahren — Fragen zur Unterhaltspflicht.',
    created_at: '2026-03-19T10:00:00Z',
    status: 'accepted',
    estimated_fee: 280,
  },
  {
    id: '5',
    citizen_name: 'Klaus Bauer',
    case_id: 'c5',
    case_type: 'Strafrecht',
    urgency: 'low',
    message: 'Ermittlungsverfahren wegen Trunkenheit am Steuer. Erstberatung gewünscht.',
    created_at: '2026-03-15T14:00:00Z',
    status: 'declined',
  },
  {
    id: '6',
    citizen_name: 'Fatima Al-Hassan',
    case_id: 'c6',
    case_type: 'Sozialrecht',
    urgency: 'normal',
    message: 'Widerspruch gegen Hartz-IV-Bescheid — Unterstützung benötigt.',
    created_at: '2026-03-10T09:00:00Z',
    status: 'completed',
  },
]

// ─── Config ───────────────────────────────────────────────────────────────────
const URGENCY = {
  urgent: { label: 'Notfall',  cls: 'bg-red-500/20 text-red-400 border-red-500/40',    icon: <AlertTriangle size={10} /> },
  high:   { label: 'Dringend', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  normal: { label: 'Normal',   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40'  },
  low:    { label: 'Niedrig',  cls: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
}

const STATUS_TABS: Array<{ key: ReferralStatus | 'all'; label: string }> = [
  { key: 'all',       label: 'Alle' },
  { key: 'new',       label: 'Neu' },
  { key: 'accepted',  label: 'Akzeptiert' },
  { key: 'completed', label: 'Abgeschlossen' },
]

// ─── Accept modal ─────────────────────────────────────────────────────────────
function AcceptModal({
  referral,
  onConfirm,
  onClose
}: {
  referral: IncomingReferral
  onConfirm: (fee: number | undefined) => void
  onClose: () => void
}) {
  const [fee, setFee] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm(fee ? Number(fee) : undefined)
    setLoading(false)
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base">Anfrage akzeptieren</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X size={15} /></button>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Sie akzeptieren die Anfrage von <span className="font-semibold text-white">{referral.citizen_name}</span> zum Thema{' '}
          <span className="text-emerald-400">{referral.case_type}</span>.
        </p>

        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">
            Voraussichtliches Honorar (€/h) — optional
          </label>
          <div className="relative">
            <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="z. B. 200"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Wird dem Mandanten als Orientierung mitgeteilt</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
            Akzeptieren
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm rounded-lg transition-all"
          >
            Abbrechen
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Referral card ────────────────────────────────────────────────────────────
function ReferralCard({
  referral,
  onAccept,
  onDecline
}: {
  referral: IncomingReferral
  onAccept: (r: IncomingReferral) => void
  onDecline: (id: string, reason: string) => void
}) {
  const urg  = URGENCY[referral.urgency]
  const [expanded, setExpanded]       = useState(false)
  const [declining, setDeclining]     = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'bg-slate-800/50 border rounded-xl overflow-hidden transition-all',
        referral.urgency === 'urgent'
          ? 'border-red-700/50 hover:border-red-600/60'
          : 'border-slate-700/50 hover:border-slate-600/60'
      )}
    >
      {/* Urgent top stripe */}
      {referral.urgency === 'urgent' && (
        <div className="bg-red-900/40 border-b border-red-700/50 px-4 py-1.5 flex items-center gap-2">
          <AlertTriangle size={12} className="text-red-400" />
          <span className="text-xs font-semibold text-red-300">Notfall — sofortige Aufmerksamkeit erforderlich</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold flex-shrink-0">
            {referral.citizen_name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {referral.status === 'new' ? (
                <span className="text-sm font-semibold text-white">Anonymer Mandant</span>
              ) : (
                <span className="text-sm font-semibold text-white">{referral.citizen_name}</span>
              )}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5', urg.cls)}>
                {(urg as any).icon}{urg.label}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                {referral.case_type}
              </span>
              {referral.status === 'new' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-semibold">
                  Neu
                </span>
              )}
              {referral.status === 'accepted' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold">
                  Akzeptiert
                </span>
              )}
              {referral.status === 'completed' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700/20 text-emerald-300 border border-emerald-700/30 font-semibold">
                  Abgeschlossen
                </span>
              )}
              {referral.status === 'declined' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-700/20 text-red-400 border border-red-700/30 font-semibold">
                  Abgelehnt
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed italic">
              "{referral.message}"
            </p>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Clock size={9} /> {formatDate(referral.created_at)}</span>
              {referral.estimated_fee && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Euro size={9} /> €{referral.estimated_fee}/h vereinbart
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronRight size={14} className={cn('transition-transform', expanded && 'rotate-90')} />
          </button>
        </div>

        {/* Decline textarea */}
        <AnimatePresence>
          {declining && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-700/40">
                <label className="text-xs text-slate-400 mb-1 block">Grund für Ablehnung (wird dem Mandanten mitgeteilt)</label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={2}
                  placeholder="Optionaler Grund…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDecline(referral.id, declineReason); setDeclining(false) }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all"
                  >
                    Ablehnen bestätigen
                  </button>
                  <button
                    onClick={() => setDeclining(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-all"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons for new referrals */}
        {referral.status === 'new' && !declining && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onAccept(referral)}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={12} />
              Akzeptieren
            </button>
            <button
              onClick={() => setDeclining(true)}
              className="flex-1 py-2 rounded-lg border border-red-700/50 text-red-400 hover:bg-red-900/20 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <XCircle size={12} />
              Ablehnen
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-2 rounded-lg border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 text-xs transition-all"
            >
              <Briefcase size={12} />
            </button>
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User size={12} />
                  <span>Fall-ID: {referral.case_id}</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 rounded-lg p-3 italic">
                  "{referral.message}"
                </div>
                {referral.status === 'accepted' && (
                  <button className="w-full py-2 rounded-lg border border-blue-600/30 text-blue-400 hover:bg-blue-600/10 text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                    <MessageSquare size={12} />
                    Nachricht an Mandant
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IncomingReferrals() {
  const [referrals, setReferrals]         = useState<IncomingReferral[]>([])
  const [loading, setLoading]             = useState(true)
  const [tab, setTab]                     = useState<ReferralStatus | 'all'>('all')
  const [acceptTarget, setAcceptTarget]   = useState<IncomingReferral | null>(null)

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const res = await referralsApi.getIncoming()
      setReferrals(res.data as unknown as IncomingReferral[])
    } catch {
      setReferrals(MOCK)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  const handleAcceptConfirm = async (fee: number | undefined) => {
    if (!acceptTarget) return
    try {
      await referralsApi.accept(acceptTarget.id)
    } catch { /* optimistic */ }
    setReferrals(prev =>
      prev.map(r => r.id === acceptTarget.id
        ? { ...r, status: 'accepted' as ReferralStatus, estimated_fee: fee, citizen_name: r.citizen_name }
        : r
      )
    )
    setAcceptTarget(null)
  }

  const handleDecline = async (id: string, reason: string) => {
    try {
      await referralsApi.decline(id, reason)
    } catch { /* optimistic */ }
    setReferrals(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'declined' as ReferralStatus } : r)
    )
  }

  const counts = (STATUS_TABS).reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? referrals.length
      : referrals.filter(r => r.status === t.key).length
    return acc
  }, {} as Record<string, number>)

  const filtered = tab === 'all'
    ? referrals
    : referrals.filter(r => r.status === tab)

  const newCount = referrals.filter(r => r.status === 'new').length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            Eingehende Anfragen
            {newCount > 0 && (
              <span className="text-sm px-2 py-0.5 bg-red-500 text-white rounded-full font-semibold">
                {newCount} neu
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm">Anfragen von Bürgern, die Ihre Unterstützung suchen</p>
        </div>
        <button
          onClick={fetchReferrals}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Aktualisieren"
        >
          <RefreshCw size={16} />
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              tab === t.key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                tab === t.key ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
              )}>
                {counts[t.key]}
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
                <div className="w-10 h-10 bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                  <div className="h-2 bg-slate-700 rounded w-2/3" />
                  <div className="h-2 bg-slate-700 rounded w-1/4" />
                </div>
              </div>
              <div className="h-8 bg-slate-700 rounded-lg mt-3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} className="text-slate-500" />
          </div>
          <h3 className="font-semibold text-white mb-1">Keine Anfragen in dieser Kategorie</h3>
          <p className="text-slate-400 text-sm">Neue Anfragen erscheinen hier sobald Bürger Sie kontaktieren.</p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {filtered.map((r) => (
              <ReferralCard
                key={r.id}
                referral={r}
                onAccept={setAcceptTarget}
                onDecline={handleDecline}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Accept modal */}
      <AnimatePresence>
        {acceptTarget && (
          <AcceptModal
            referral={acceptTarget}
            onConfirm={handleAcceptConfirm}
            onClose={() => setAcceptTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
