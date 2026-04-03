import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Inbox,
  Briefcase,
  CalendarDays,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Activity,
  Euro,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { referralsApi, casesApi, professionalsApi } from '@/services/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type DashboardTab = 'overview' | 'requests' | 'cases' | 'calendar' | 'messages'

interface StatCard {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
  trend?: string
  trendUp?: boolean
}

interface IncomingRequest {
  id: string
  client_name: string
  case_type: string
  urgency: string
  message: string
  created_at: string
  status: 'new' | 'reviewed'
}

interface ActiveCase {
  id: string
  client: string
  title: string
  case_type: string
  status: string
  progress: number
  last_activity: string
}

interface Deadline {
  id: string
  case: string
  deadline: string
  type: string
  bucket: 'today' | 'week' | 'later'
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_REQUESTS: IncomingRequest[] = [
  {
    id: '1',
    client_name: 'Thomas Weber',
    case_type: 'Mietrecht',
    urgency: 'high',
    message: 'Mein Vermieter möchte die Miete um 20% erhöhen. Ist das legal?',
    created_at: '2026-03-21T08:00:00Z',
    status: 'new'
  },
  {
    id: '2',
    client_name: 'Elena Rodriguez',
    case_type: 'Arbeitsrecht',
    urgency: 'normal',
    message: 'Ich brauche Hilfe bei der Überprüfung meines Arbeitsvertrages.',
    created_at: '2026-03-21T06:30:00Z',
    status: 'new'
  },
  {
    id: '3',
    client_name: 'Ahmed Hassan',
    case_type: 'Ausländerrecht',
    urgency: 'urgent',
    message: 'Mein Visum läuft in 3 Tagen ab. Notfall!',
    created_at: '2026-03-20T20:00:00Z',
    status: 'reviewed'
  },
]

const MOCK_CASES: ActiveCase[] = [
  { id: '1', client: 'Weber, T.', title: 'Mieterhöhungsstreit', case_type: 'Mietrecht',     status: 'In Bearbeitung', progress: 65, last_activity: 'Vor 2 Stunden' },
  { id: '2', client: 'Rodriguez, E.', title: 'Arbeitsvertrag',   case_type: 'Arbeitsrecht', status: 'Prüfung',        progress: 30, last_activity: 'Vor 4 Stunden' },
  { id: '3', client: 'Hassan, A.',    title: 'Visum-Verlängerung', case_type: 'Ausländerrecht', status: 'Dokumente',   progress: 85, last_activity: 'Vor 1 Tag'    },
]

const MOCK_DEADLINES: Deadline[] = [
  { id: '1', case: 'Weber vs. Vermieter', deadline: 'Heute, 17:00 Uhr',    type: 'Dokumenteinreichung', bucket: 'today' },
  { id: '2', case: 'Rodriguez Arbeitsvertrag', deadline: 'Morgen, 10:00 Uhr', type: 'Mandantengespräch', bucket: 'week' },
  { id: '3', case: 'Hassan Visum',         deadline: '25. Mär. 2026',       type: 'Gerichtsanhörung',   bucket: 'later' },
]

const MOCK_ACTIVITY = [
  { text: 'Dokument hochgeladen – Weber-Fall', time: 'Vor 30 Min.' },
  { text: 'Neue Nachricht von Rodriguez, E.',  time: 'Vor 1 Std.' },
  { text: 'Termin vereinbart mit Hassan, A.', time: 'Vor 2 Std.' },
  { text: 'Zahlung erhalten – Beratungsgebühr', time: 'Vor 3 Std.' },
  { text: 'Fallstatus aktualisiert – Weber, T.', time: 'Gestern' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
const URGENCY_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  normal: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  low:    'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}
const URGENCY_LABELS: Record<string, string> = {
  urgent: 'Notfall',
  high:   'Hoch',
  normal: 'Normal',
  low:    'Niedrig',
}

function StatCardComp({ card }: { card: StatCard }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-4 rounded-xl border', card.color)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
          {card.icon}
        </div>
        {card.trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            card.trendUp ? 'text-emerald-400' : 'text-red-400'
          )}>
            {card.trendUp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {card.trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold text-white">{card.value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{card.label}</div>
      {card.sub && <div className="text-[10px] text-slate-500 mt-0.5">{card.sub}</div>}
    </motion.div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={cn(
          'h-full rounded-full',
          value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-blue-500' : 'bg-amber-500'
        )}
      />
    </div>
  )
}

// ─── Tab panels ───────────────────────────────────────────────────────────────
function OverviewPanel({
  requests,
  activity
}: {
  requests: IncomingRequest[]
  activity: typeof MOCK_ACTIVITY
}) {
  const stats: StatCard[] = [
    {
      label: 'Neue Anfragen heute',
      value: requests.filter(r => r.status === 'new').length,
      icon: <Inbox size={16} className="text-blue-400" />,
      color: 'bg-blue-900/30 border-blue-700/30',
      trend: '+2',
      trendUp: true
    },
    {
      label: 'Aktive Fälle',
      value: MOCK_CASES.length,
      icon: <Briefcase size={16} className="text-emerald-400" />,
      color: 'bg-emerald-900/30 border-emerald-700/30',
    },
    {
      label: 'Anstehende Fristen',
      value: MOCK_DEADLINES.filter(d => d.bucket === 'today').length,
      sub: 'Heute fällig',
      icon: <CalendarDays size={16} className="text-amber-400" />,
      color: 'bg-amber-900/30 border-amber-700/30',
    },
    {
      label: 'Einnahmen (März)',
      value: '€4.800',
      icon: <Euro size={16} className="text-purple-400" />,
      color: 'bg-purple-900/30 border-purple-700/30',
      trend: '+12%',
      trendUp: true
    },
  ]

  const urgentRequests = requests.filter(r => r.urgency === 'urgent')

  return (
    <div className="space-y-5">
      {/* Urgent alert */}
      <AnimatePresence>
        {urgentRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-900/30 border border-red-700/40"
          >
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-300">
                {urgentRequests.length} Notfall-Anfrage{urgentRequests.length > 1 ? 'n' : ''} wartend
              </div>
              <div className="text-xs text-red-400/70 mt-0.5">
                {urgentRequests.map(r => r.client_name).join(', ')} — sofortige Aufmerksamkeit erforderlich
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((card, i) => (
          <motion.div key={i} custom={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCardComp card={card} />
          </motion.div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Letzte Aktivitäten</h3>
        </div>
        <div className="space-y-2">
          {activity.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-300">{item.text}</span>
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RequestsPanel({
  requests,
  onAccept,
  onDecline
}: {
  requests: IncomingRequest[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}) {
  const [decliningId, setDecliningId]   = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  const handleDecline = (id: string) => {
    onDecline(id)
    setDecliningId(null)
    setDeclineReason('')
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000)
    if (diffH < 1) return 'Vor wenigen Minuten'
    if (diffH < 24) return `Vor ${diffH} Stunde${diffH > 1 ? 'n' : ''}`
    return `Vor ${Math.floor(diffH / 24)} Tag${diffH > 48 ? 'en' : ''}`
  }

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Inbox size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Keine eingehenden Anfragen</p>
        </div>
      ) : (
        requests.map((req) => (
          <motion.div
            key={req.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/60 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {req.client_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{req.client_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-600/30">
                    {req.case_type}
                  </span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', URGENCY_STYLES[req.urgency])}>
                    {URGENCY_LABELS[req.urgency]}
                  </span>
                  {req.status === 'new' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-medium">
                      Neu
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-2 italic">
                  "{req.message}"
                </p>
                <div className="text-[10px] text-slate-500 mt-1">{formatTime(req.created_at)}</div>
              </div>
            </div>

            {/* Decline reason input */}
            <AnimatePresence>
              {decliningId === req.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-700/40">
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      rows={2}
                      placeholder="Grund für Ablehnung (optional)…"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all"
                      >
                        Ablehnen bestätigen
                      </button>
                      <button
                        onClick={() => setDecliningId(null)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-all"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            {decliningId !== req.id && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onAccept(req.id)}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={12} />
                  Akzeptieren
                </button>
                <button
                  onClick={() => setDecliningId(req.id)}
                  className="flex-1 py-2 rounded-lg border border-red-700/50 text-red-400 hover:bg-red-900/20 text-xs font-medium transition-all"
                >
                  Ablehnen
                </button>
                <button className="px-3 py-2 rounded-lg border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 text-xs transition-all">
                  Details
                  <ArrowRight size={10} className="inline ml-1" />
                </button>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  )
}

function CasesPanel({ cases }: { cases: ActiveCase[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left text-xs text-slate-400 font-medium py-2 pr-4">Mandant</th>
            <th className="text-left text-xs text-slate-400 font-medium py-2 pr-4">Fall</th>
            <th className="text-left text-xs text-slate-400 font-medium py-2 pr-4">Rechtsgebiet</th>
            <th className="text-left text-xs text-slate-400 font-medium py-2 pr-4">Status</th>
            <th className="text-left text-xs text-slate-400 font-medium py-2 pr-4 w-32">Fortschritt</th>
            <th className="text-left text-xs text-slate-400 font-medium py-2">Letzte Aktivität</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {cases.map((c, i) => (
            <motion.tr
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="hover:bg-slate-800/30 cursor-pointer transition-colors"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-xs font-bold">
                    {c.client.charAt(0)}
                  </div>
                  <span className="text-xs text-white font-medium">{c.client}</span>
                </div>
              </td>
              <td className="py-3 pr-4 text-xs text-slate-300">{c.title}</td>
              <td className="py-3 pr-4">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                  {c.case_type}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-[10px] text-emerald-400">{c.status}</span>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <ProgressBar value={c.progress} />
                  <span className="text-[10px] text-slate-400 w-8 text-right">{c.progress}%</span>
                </div>
              </td>
              <td className="py-3 text-[10px] text-slate-500">{c.last_activity}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CalendarPanel({ deadlines }: { deadlines: Deadline[] }) {
  const buckets: Array<{ key: Deadline['bucket']; label: string; color: string }> = [
    { key: 'today', label: 'Heute',        color: 'text-red-400' },
    { key: 'week',  label: 'Diese Woche',  color: 'text-amber-400' },
    { key: 'later', label: 'Später',       color: 'text-slate-400' },
  ]

  return (
    <div className="space-y-5">
      {buckets.map(({ key, label, color }) => {
        const items = deadlines.filter(d => d.bucket === key)
        if (items.length === 0) return null
        return (
          <div key={key}>
            <div className={cn('text-xs font-semibold uppercase tracking-wider mb-2', color)}>
              {label}
            </div>
            <div className="space-y-2">
              {items.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                  <Clock size={14} className={color} />
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{d.case}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{d.type}</div>
                  </div>
                  <div className="text-xs text-slate-300 text-right whitespace-nowrap">{d.deadline}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MessagesPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
        <MessageSquare size={24} className="text-slate-500" />
      </div>
      <h3 className="font-semibold text-white mb-1">Nachrichten</h3>
      <p className="text-slate-400 text-sm">Demnächst verfügbar</p>
      <p className="text-slate-500 text-xs mt-1">Das Messaging-System wird in Kürze freigeschaltet.</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LawyerDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [requests, setRequests]   = useState<IncomingRequest[]>([])
  const [cases, setCases]         = useState<ActiveCase[]>([])
  const [loading, setLoading]     = useState(true)
  const [profile, setProfile]     = useState<{ full_name?: string } | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [reqRes, casesRes, profileRes] = await Promise.allSettled([
          referralsApi.getIncoming(),
          casesApi.list(),
          professionalsApi.getMyProfile(),
        ])
        if (reqRes.status === 'fulfilled')    setRequests(reqRes.value.data as unknown as IncomingRequest[])
        if (casesRes.status === 'fulfilled')  setCases(casesRes.value.data as unknown as ActiveCase[])
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data as unknown as { full_name?: string })
      } catch {
        // Use mock data
      } finally {
        if (requests.length === 0) setRequests(MOCK_REQUESTS)
        if (cases.length === 0)    setCases(MOCK_CASES)
        setLoading(false)
      }
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAccept = async (id: string) => {
    try {
      await referralsApi.accept(id)
    } catch { /* optimistic update */ }
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const handleDecline = async (id: string) => {
    try {
      await referralsApi.decline(id)
    } catch { /* optimistic update */ }
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const tabs: Array<{ key: DashboardTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'overview',  label: 'Übersicht',           icon: <TrendingUp size={14} /> },
    { key: 'requests',  label: 'Eingehende Anfragen', icon: <Inbox      size={14} />, badge: requests.filter(r => r.status === 'new').length },
    { key: 'cases',     label: 'Meine Fälle',         icon: <Briefcase  size={14} /> },
    { key: 'calendar',  label: 'Kalender',            icon: <CalendarDays size={14} /> },
    { key: 'messages',  label: 'Nachrichten',         icon: <MessageSquare size={14} /> },
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Dashboard wird geladen…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Guten Morgen{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-slate-400 text-sm">
              {new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              activeTab === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                activeTab === tab.key ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              )}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview'  && <OverviewPanel requests={requests} activity={MOCK_ACTIVITY} />}
          {activeTab === 'requests'  && <RequestsPanel requests={requests} onAccept={handleAccept} onDecline={handleDecline} />}
          {activeTab === 'cases'     && <CasesPanel cases={cases.length > 0 ? cases : MOCK_CASES} />}
          {activeTab === 'calendar'  && <CalendarPanel deadlines={MOCK_DEADLINES} />}
          {activeTab === 'messages'  && <MessagesPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
