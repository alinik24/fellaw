import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  FolderOpen,
  Filter,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { casesApi } from '../services/api'
import {
  cn,
  CASE_TYPES,
  CASE_TYPE_LABELS,
  CASE_TYPE_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  URGENCY_COLORS,
  URGENCY_LABELS,
  formatDate,
  formatRelativeDate
} from '../lib/utils'
import type { Case } from '../types'

const STATUS_OPTIONS = ['active', 'pending', 'closed', 'won', 'lost']

export default function Cases() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: async () => (await casesApi.list()).data
  })

  const filtered = cases.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || c.case_type === filterType
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const grouped = {
    active: filtered.filter(c => c.status === 'active'),
    pending: filtered.filter(c => c.status === 'pending'),
    closed: filtered.filter(c => ['closed', 'won', 'lost'].includes(c.status))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Meine Fälle</h1>
          <p className="text-slate-400 text-sm mt-1">
            {cases.length} Fall{cases.length !== 1 ? 'e' : ''} insgesamt
          </p>
        </div>
        <button onClick={() => navigate('/cases/new')} className="btn-primary">
          <Plus size={16} />
          Neuer Fall
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Fälle durchsuchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="">Alle Typen</option>
          {CASE_TYPES.map(t => (
            <option key={t} value={t}>{CASE_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="">Alle Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            {search || filterType || filterStatus ? 'Keine Fälle gefunden' : 'Noch keine Fälle'}
          </h3>
          <p className="text-slate-500 mb-6">
            {search || filterType || filterStatus
              ? 'Versuchen Sie, die Filter anzupassen'
              : 'Erstellen Sie Ihren ersten Rechtsfall'}
          </p>
          {!search && !filterType && !filterStatus && (
            <button onClick={() => navigate('/cases/new')} className="btn-primary mx-auto">
              <Plus size={16} />
              Ersten Fall erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([group, items]) => {
            if (items.length === 0) return null
            const groupLabel = { active: 'Aktive Fälle', pending: 'Ausstehend', closed: 'Abgeschlossen' }[group]
            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{groupLabel}</h2>
                  <span className="text-xs bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((c, i) => (
                    <CaseCard key={c.id} case_={c} index={i} onClick={() => navigate(`/cases/${c.id}`)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CaseCard({ case_: c, index, onClick }: { case_: Case; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/70 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', CASE_TYPE_COLORS[c.case_type])}>
            {CASE_TYPE_LABELS[c.case_type] || c.case_type}
          </span>
          <span className={cn(STATUS_COLORS[c.status])}>
            {STATUS_LABELS[c.status] || c.status}
          </span>
        </div>
        <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <h3 className="text-white font-semibold mb-2 line-clamp-2 leading-snug">{c.title}</h3>

      {c.description && (
        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{c.description}</p>
      )}

      <div className="space-y-1.5">
        {c.urgency_level && (
          <div className="flex items-center gap-1.5 text-xs">
            <AlertCircle size={12} className={URGENCY_COLORS[c.urgency_level]} />
            <span className={URGENCY_COLORS[c.urgency_level]}>
              Priorität: {URGENCY_LABELS[c.urgency_level]}
            </span>
          </div>
        )}
        {c.incident_date && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock size={12} />
            Vorfall: {formatDate(c.incident_date)}
          </div>
        )}
        {c.opposing_party && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1 h-1 rounded-full bg-slate-500 ml-0.5" />
            Gegenseite: {c.opposing_party}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
        Aktualisiert {formatRelativeDate(c.updated_at)}
      </div>
    </motion.div>
  )
}
