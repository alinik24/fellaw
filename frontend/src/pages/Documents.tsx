import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Image, File, Eye, RefreshCw, Trash2,
  Filter, X, Loader2, CheckCircle2, AlertCircle, Clock,
  FolderOpen, ChevronDown, ExternalLink, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { documentsApi, casesApi } from '@/services/api'
import type { Document, Case } from '@/types'
import { cn, formatDate, truncate } from '@/lib/utils'
import DocumentUpload from '@/components/DocumentUpload'

// ─── File type icon ───────────────────────────────────────────────────────────
function FileTypeIcon({ mime }: { mime?: string }) {
  const base = 'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0'
  if (mime === 'application/pdf')
    return <div className={cn(base, 'bg-red-900/40 border border-red-700/50')}><FileText size={20} className="text-red-400" /></div>
  if (mime?.includes('word'))
    return <div className={cn(base, 'bg-blue-900/40 border border-blue-700/50')}><FileText size={20} className="text-blue-400" /></div>
  if (mime?.startsWith('image/'))
    return <div className={cn(base, 'bg-purple-900/40 border border-purple-700/50')}><Image size={20} className="text-purple-400" /></div>
  return <div className={cn(base, 'bg-slate-700/60 border border-slate-600/50')}><File size={20} className="text-slate-400" /></div>
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Document['processing_status'] }) {
  const map = {
    pending:    { label: 'Ausstehend',   cls: 'bg-slate-700/60 text-slate-300 border-slate-600/50',        icon: <Clock size={10} /> },
    processing: { label: 'Verarbeitung', cls: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',    icon: <Loader2 size={10} className="animate-spin" /> },
    completed:  { label: 'Fertig',       cls: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50', icon: <CheckCircle2 size={10} /> },
    failed:     { label: 'Fehler',       cls: 'bg-red-900/50 text-red-300 border-red-700/50',              icon: <AlertCircle size={10} /> }
  }
  const { label, cls, icon } = map[status]
  return (
    <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', cls)}>
      {icon}{label}
    </span>
  )
}

// ─── Format size ──────────────────────────────────────────────────────────────
function fmtSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Category labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  evidence:       'Beweismittel',
  court_doc:      'Gerichtsdokument',
  correspondence: 'Korrespondenz',
  contract:       'Vertrag',
  identification: 'Ausweisdokument',
  medical:        'Medizinische Unterlagen',
  other:          'Sonstiges'
}

// ─── Document card ────────────────────────────────────────────────────────────
function DocumentCard({
  doc,
  caseTitle,
  onView,
  onReanalyze,
  onDelete
}: {
  doc: Document
  caseTitle?: string
  onView: () => void
  onReanalyze: () => void
  onDelete: () => void
}) {
  let summaryText: string | null = null
  try {
    if (typeof doc.ai_analysis === 'string' && doc.ai_analysis.trim().startsWith('{')) {
      const parsed = JSON.parse(doc.ai_analysis) as Record<string, unknown>
      if (typeof parsed.summary === 'string') summaryText = parsed.summary
    } else if (typeof doc.ai_analysis === 'string') {
      summaryText = doc.ai_analysis.slice(0, 160)
    }
  } catch { /* ignore */ }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:border-slate-600 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <FileTypeIcon mime={doc.mime_type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{doc.original_filename}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {fmtSize(doc.file_size)} · {formatDate(doc.created_at)}
          </p>
        </div>
        <StatusBadge status={doc.processing_status} />
      </div>

      {/* Category + case */}
      <div className="flex flex-wrap gap-2">
        {doc.category_type && (
          <span className="text-[10px] bg-slate-700/50 text-slate-400 border border-slate-600/50 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[doc.category_type] ?? doc.category_type}
          </span>
        )}
        {caseTitle && (
          <span className="text-[10px] bg-blue-900/30 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ExternalLink size={9} />
            {truncate(caseTitle, 28)}
          </span>
        )}
      </div>

      {/* Summary preview */}
      {summaryText && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {summaryText}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50 mt-auto">
        <button onClick={onView} className="btn-ghost text-xs py-1 flex-1 justify-center">
          <Eye size={12} />
          Anzeigen
        </button>
        {doc.processing_status === 'completed' && (
          <button onClick={onReanalyze} className="btn-ghost text-xs py-1 flex-1 justify-center">
            <RefreshCw size={12} />
            Neu analysieren
          </button>
        )}
        <button onClick={onDelete} className="btn-ghost text-xs py-1 text-red-400 hover:bg-red-900/20 flex-1 justify-center">
          <Trash2 size={12} />
          Löschen
        </button>
      </div>
    </motion.div>
  )
}

// ─── Documents page ───────────────────────────────────────────────────────────
export default function Documents() {
  const queryClient = useQueryClient()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [filterCase, setFilterCase] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewDoc, setViewDoc] = useState<Document | null>(null)

  // Queries
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await documentsApi.list()
      return res.data
    }
  })

  const { data: cases = [] } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await casesApi.list()
      return res.data
    }
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Dokument gelöscht.')
    },
    onError: () => toast.error('Löschen fehlgeschlagen.')
  })

  const reanalyzeMutation = useMutation({
    mutationFn: (id: string) => documentsApi.reanalyze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Neu-Analyse gestartet…')
    },
    onError: () => toast.error('Neu-Analyse fehlgeschlagen.')
  })

  // Filtered & searched documents
  const filtered = useMemo(() => {
    return documents.filter(doc => {
      if (filterCase !== 'all' && doc.case_id !== filterCase) return false
      if (filterCategory !== 'all' && doc.category_type !== filterCategory) return false
      if (filterStatus !== 'all' && doc.processing_status !== filterStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return doc.original_filename.toLowerCase().includes(q)
      }
      return true
    })
  }, [documents, filterCase, filterCategory, filterStatus, searchQuery])

  const caseMap = useMemo(() => {
    const m: Record<string, string> = {}
    cases.forEach(c => { m[c.id] = c.title })
    return m
  }, [cases])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Dokumente</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {documents.length} Dokument{documents.length !== 1 ? 'e' : ''} insgesamt
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          <Upload size={16} />
          Dokument hochladen
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-slate-400 flex-shrink-0" />

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Dateiname suchen…"
            className="input-field pl-8 py-1.5 text-sm"
          />
        </div>

        {/* Case filter */}
        <div className="relative">
          <select
            value={filterCase}
            onChange={e => setFilterCase(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none appearance-none"
          >
            <option value="all">Alle Fälle</option>
            <option value="">Kein Fall</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{truncate(c.title, 30)}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none appearance-none"
          >
            <option value="all">Alle Kategorien</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none appearance-none"
          >
            <option value="all">Alle Status</option>
            <option value="completed">Abgeschlossen</option>
            <option value="processing">Verarbeitung</option>
            <option value="pending">Ausstehend</option>
            <option value="failed">Fehler</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Clear filters */}
        {(filterCase !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setFilterCase('all')
              setFilterCategory('all')
              setFilterStatus('all')
              setSearchQuery('')
            }}
            className="btn-ghost text-xs py-1.5 text-red-400 hover:bg-red-900/20"
          >
            <X size={12} />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* ── Document grid ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-44">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/60 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-700/60 rounded w-full mb-2" />
              <div className="h-3 bg-slate-700/60 rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
            <FolderOpen size={36} className="text-slate-500" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold text-lg mb-1">
              {documents.length === 0
                ? 'Noch keine Dokumente hochgeladen'
                : 'Keine Dokumente gefunden'}
            </p>
            <p className="text-slate-500 text-sm max-w-sm">
              {documents.length === 0
                ? 'Laden Sie Ihre ersten Dokumente hoch, um KI-gestützte Analysen zu erhalten.'
                : 'Versuchen Sie, die Filter anzupassen.'}
            </p>
          </div>
          {documents.length === 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary mt-2"
            >
              <Upload size={16} />
              Erstes Dokument hochladen
            </button>
          )}
        </motion.div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(doc => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                caseTitle={doc.case_id ? caseMap[doc.case_id] : undefined}
                onView={() => setViewDoc(doc)}
                onReanalyze={() => reanalyzeMutation.mutate(doc.id)}
                onDelete={() => deleteMutation.mutate(doc.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Upload modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Upload size={16} className="text-blue-400" />
                  Dokument hochladen
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5">
                <DocumentUpload
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['documents'] })
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── View document modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setViewDoc(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50 flex-shrink-0">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">{viewDoc.original_filename}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmtSize(viewDoc.file_size)} · {formatDate(viewDoc.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setViewDoc(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-4"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {viewDoc.ai_analysis && (
                  <div>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">KI-Analyse</h3>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {viewDoc.ai_analysis}
                      </pre>
                    </div>
                  </div>
                )}

                {viewDoc.extracted_text && (
                  <div>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Extrahierter Text</h3>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                        {viewDoc.extracted_text}
                      </pre>
                    </div>
                  </div>
                )}

                {!viewDoc.ai_analysis && !viewDoc.extracted_text && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <File size={32} className="text-slate-600 mb-3" />
                    <p className="text-slate-400 text-sm">Keine Analysedaten verfügbar.</p>
                    {viewDoc.processing_status === 'processing' && (
                      <p className="text-yellow-400 text-xs mt-1">Dokument wird verarbeitet…</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
