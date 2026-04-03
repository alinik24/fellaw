import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  FolderOpen,
  MessageSquare,
  Upload,
  Plus,
  ArrowRight,
  Clock,
  Scale,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react'
import { casesApi, chatApi, documentsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { cn, CASE_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, formatRelativeDate, CASE_TYPE_COLORS } from '../lib/utils'
import type { Case, Conversation, Document } from '../types'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: cases = [] } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: async () => (await casesApi.list()).data
  })

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => (await chatApi.listConversations()).data
  })

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await documentsApi.list()).data
  })

  const activeCases = cases.filter(c => c.status === 'active')
  const urgentCases = cases.filter(c => c.urgency_level === 'critical' || c.urgency_level === 'high')
  const recentCases = [...cases].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5)
  const recentDocs = [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)

  const stats = [
    {
      label: 'Aktive Fälle',
      value: activeCases.length,
      icon: <FolderOpen size={20} className="text-blue-400" />,
      color: 'from-blue-600/20 to-blue-600/5',
      border: 'border-blue-700/30',
      change: `${cases.length} gesamt`
    },
    {
      label: 'Dringende Fälle',
      value: urgentCases.length,
      icon: <AlertCircle size={20} className="text-orange-400" />,
      color: 'from-orange-600/20 to-orange-600/5',
      border: 'border-orange-700/30',
      change: 'Hohe Priorität'
    },
    {
      label: 'Dokumente',
      value: documents.length,
      icon: <FileText size={20} className="text-teal-400" />,
      color: 'from-teal-600/20 to-teal-600/5',
      border: 'border-teal-700/30',
      change: `${documents.filter(d => d.processing_status === 'completed').length} analysiert`
    },
    {
      label: 'Gespräche',
      value: conversations.length,
      icon: <MessageSquare size={20} className="text-purple-400" />,
      color: 'from-purple-600/20 to-purple-600/5',
      border: 'border-purple-700/30',
      change: 'KI-Chats'
    }
  ]

  const quickActions = [
    {
      label: 'Neuer Fall',
      desc: 'Fall dokumentieren',
      icon: <Plus size={20} className="text-blue-400" />,
      onClick: () => navigate('/cases/new'),
      color: 'hover:border-blue-600/40'
    },
    {
      label: 'KI befragen',
      desc: 'Rechtliche Frage stellen',
      icon: <MessageSquare size={20} className="text-teal-400" />,
      onClick: () => navigate('/chat'),
      color: 'hover:border-teal-600/40'
    },
    {
      label: 'Dokument hochladen',
      desc: 'Analysieren lassen',
      icon: <Upload size={20} className="text-purple-400" />,
      onClick: () => navigate('/documents'),
      color: 'hover:border-purple-600/40'
    },
    {
      label: 'Gesetze suchen',
      desc: 'Rechtsdatenbank',
      icon: <Scale size={20} className="text-orange-400" />,
      onClick: () => navigate('/laws'),
      color: 'hover:border-orange-600/40'
    }
  ]

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Nutzer'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
        {/* Welcome banner */}
        <motion.div variants={item}>
          <div className="relative bg-gradient-to-br from-blue-950/60 to-slate-900/60 border border-blue-700/30 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {greeting}, {firstName}! 👋
                </h1>
                <p className="text-slate-400">
                  {activeCases.length > 0
                    ? `Sie haben ${activeCases.length} aktive${activeCases.length === 1 ? 'n Fall' : ' Fälle'}`
                    : 'Beginnen Sie mit Ihrem ersten Rechtsfall'}
                  {urgentCases.length > 0 && (
                    <span className="ml-2 text-orange-400 font-medium">
                      · {urgentCases.length} dringend
                    </span>
                  )}
                </p>
              </div>
              {user?.is_guest && (
                <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-sm px-4 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  Gastmodus – Daten werden nicht gespeichert
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                'relative bg-gradient-to-br rounded-xl p-5 border overflow-hidden',
                stat.color,
                stat.border
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-slate-800/50">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-300">{stat.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.change}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Schnellzugriff</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className={cn(
                  'flex flex-col items-start p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl transition-all duration-200 text-left group',
                  action.color
                )}
              >
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/50 mb-3 group-hover:border-slate-600 transition-colors">
                  {action.icon}
                </div>
                <div className="text-sm font-semibold text-white">{action.label}</div>
                <div className="text-xs text-slate-400">{action.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent cases */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Aktuelle Fälle</h2>
              <button
                onClick={() => navigate('/cases')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Alle anzeigen <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {recentCases.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center">
                  <FolderOpen size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Noch keine Fälle</p>
                  <button onClick={() => navigate('/cases/new')} className="mt-3 text-blue-400 text-sm hover:text-blue-300">
                    Ersten Fall erstellen →
                  </button>
                </div>
              ) : (
                recentCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl hover:border-slate-600/60 hover:bg-slate-800/50 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white truncate">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border', CASE_TYPE_COLORS[c.case_type])}>
                          {CASE_TYPE_LABELS[c.case_type] || c.case_type}
                        </span>
                        <span className={cn(STATUS_COLORS[c.status])}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {formatRelativeDate(c.updated_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Aktivität</h2>
            </div>
            <div className="space-y-2">
              {[...conversations.slice(0, 3).map(conv => ({
                icon: <MessageSquare size={14} className="text-teal-400" />,
                title: conv.title || 'Chat-Gespräch',
                desc: `${conv.message_count} Nachrichten`,
                time: formatRelativeDate(conv.updated_at),
                color: 'bg-teal-900/30'
              })), ...recentDocs.slice(0, 2).map(doc => ({
                icon: <FileText size={14} className="text-purple-400" />,
                title: doc.original_filename,
                desc: doc.processing_status === 'completed' ? 'Analysiert' : 'Wird verarbeitet',
                time: formatRelativeDate(doc.created_at),
                color: 'bg-purple-900/30'
              }))].slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', activity.color)}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{activity.title}</div>
                    <div className="text-xs text-slate-500">{activity.desc}</div>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{activity.time}</span>
                </div>
              ))}
              {conversations.length === 0 && documents.length === 0 && (
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center">
                  <TrendingUp size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Noch keine Aktivitäten</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
