import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Scale, BookOpen, ExternalLink, Copy, Check,
  RefreshCw, X, Loader2, FileText, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { lawsApi } from '@/services/api'
import type { LawDocument } from '@/types'
import { cn, truncate } from '@/lib/utils'

// ─── Law codes catalogue ──────────────────────────────────────────────────────
const LAW_CODES = [
  { code: 'BGB',      label: 'Bürgerliches Gesetzbuch' },
  { code: 'StGB',     label: 'Strafgesetzbuch' },
  { code: 'StPO',     label: 'Strafprozessordnung' },
  { code: 'ZPO',      label: 'Zivilprozessordnung' },
  { code: 'VwGO',     label: 'Verwaltungsgerichtsordnung' },
  { code: 'AGG',      label: 'Allg. Gleichbehandlungsgesetz' },
  { code: 'AufenthG', label: 'Aufenthaltsgesetz' },
  { code: 'AsylG',    label: 'Asylgesetz' },
  { code: 'SGB2',     label: 'Sozialgesetzbuch II' },
  { code: 'WoGG',     label: 'Wohngeldgesetz' },
  { code: 'BtMG',     label: 'Betäubungsmittelgesetz' }
]

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-5 w-16 bg-slate-700 rounded" />
        <div className="h-4 w-24 bg-slate-700 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-slate-700 rounded mb-2" />
      <div className="h-3 w-full bg-slate-700/60 rounded mb-1" />
      <div className="h-3 w-5/6 bg-slate-700/60 rounded" />
    </div>
  )
}

// ─── Law detail modal ─────────────────────────────────────────────────────────
function LawModal({ law, onClose }: { law: LawDocument; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(law.content)
    setCopied(true)
    toast.success('Text kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        >
          {/* Modal header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-700/50 flex-shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-teal-900/50 text-teal-300 border border-teal-700/50 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                  {law.law_code}
                </span>
                {law.section && (
                  <span className="text-slate-400 text-sm">§ {law.section}</span>
                )}
                {law.paragraph && (
                  <span className="text-slate-400 text-sm">Abs. {law.paragraph}</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-white leading-snug">{law.title}</h2>
              {law.effective_date && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Gültig ab: {law.effective_date}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Law content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-invert prose-sm max-w-none
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
              prose-strong:text-slate-100
            ">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                {law.content}
              </pre>
            </div>
          </div>

          {/* Modal footer */}
          <div className="flex items-center gap-2 p-4 border-t border-slate-700/50 flex-shrink-0 flex-wrap">
            <button onClick={handleCopy} className="btn-secondary text-sm py-1.5">
              {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>

            {law.url && (
              <a
                href={law.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm py-1.5"
              >
                <ExternalLink size={14} />
                Quelle öffnen
              </a>
            )}

            <div className="flex-1" />
            <button
              onClick={() => { toast.success('In Fall übernommen (Demo).'); onClose() }}
              className="btn-primary text-sm py-1.5"
            >
              <BookOpen size={14} />
              In Fall verwenden
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ law, onClick }: { law: LawDocument; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:border-slate-600 cursor-pointer group transition-all duration-200 hover:bg-slate-800/70"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-teal-900/50 text-teal-300 border border-teal-700/50 px-2 py-0.5 rounded text-xs font-mono font-semibold">
            {law.law_code}
          </span>
          {law.section && (
            <span className="text-slate-400 text-xs">§ {law.section}</span>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
        {law.title}
      </h3>

      <p className="text-xs text-slate-400 leading-relaxed">
        {truncate(law.content, 200)}
      </p>
    </motion.div>
  )
}

// ─── LawLibrary page ──────────────────────────────────────────────────────────
export default function LawLibrary() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [selectedLaw, setSelectedLaw] = useState<LawDocument | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input (400ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Search query
  const {
    data: searchResult,
    isFetching,
    isError
  } = useQuery({
    queryKey: ['laws-search', debouncedQuery, selectedCodes],
    queryFn: async () => {
      const res = await lawsApi.search(
        debouncedQuery || '*',
        selectedCodes.length ? selectedCodes : undefined,
        20
      )
      return res.data
    },
    enabled: true
  })

  // Ingest trigger
  const ingestMutation = useMutation({
    mutationFn: () => lawsApi.triggerIngest(),
    onSuccess: () => toast.success('Gesetze werden aktualisiert…'),
    onError: () => toast.error('Aktualisierung fehlgeschlagen.')
  })

  const { data: ingestStatus } = useQuery({
    queryKey: ['ingest-status'],
    queryFn: async () => {
      const res = await lawsApi.getIngestStatus()
      return res.data
    },
    refetchInterval: ingestMutation.isPending ? 3000 : false
  })

  const toggleCode = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const results = searchResult?.results ?? []
  const totalCount = searchResult?.total ?? 0

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">

      {/* ── LEFT sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-700/50">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen size={16} className="text-teal-400" />
            Rechtsgebiete
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* "All" option */}
          <button
            onClick={() => setSelectedCodes([])}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
              selectedCodes.length === 0
                ? 'bg-blue-600/20 text-blue-300 border border-blue-600/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            <span>Alle Gesetze</span>
            {totalCount > 0 && (
              <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </button>

          {LAW_CODES.map(({ code, label }) => {
            const count = results.filter(r => r.law_code === code).length
            const active = selectedCodes.includes(code)
            return (
              <button
                key={code}
                onClick={() => toggleCode(code)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  active
                    ? 'bg-teal-900/30 text-teal-300 border border-teal-700/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-xs">{code}</p>
                  <p className="text-[10px] truncate text-slate-500">{label}</p>
                </div>
                {count > 0 && (
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Ingest button */}
        <div className="p-3 border-t border-slate-700/50">
          {ingestStatus && (
            <p className="text-[10px] text-slate-500 mb-2 text-center">
              Status: <span className={cn(
                ingestStatus.status === 'completed' ? 'text-teal-400' :
                ingestStatus.status === 'running' ? 'text-yellow-400' : 'text-slate-400'
              )}>{ingestStatus.status}</span>
              {ingestStatus.progress !== undefined && ` (${ingestStatus.progress}%)`}
            </p>
          )}
          <button
            onClick={() => ingestMutation.mutate()}
            disabled={ingestMutation.isPending}
            className="btn-secondary w-full justify-center text-xs py-2"
          >
            {ingestMutation.isPending
              ? <Loader2 size={12} className="animate-spin" />
              : <RefreshCw size={12} />}
            Gesetze aktualisieren
          </button>
        </div>
      </div>

      {/* ── MAIN content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/60 flex-shrink-0">
          <div className="relative max-w-2xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Paragraph oder Begriff suchen…"
              className="input-field pl-10 pr-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            {isFetching && (
              <Loader2 size={14} className="text-slate-400 animate-spin" />
            )}
            <p className="text-xs text-slate-400">
              {isFetching ? 'Suche…' : `${totalCount} Ergebnisse`}
              {selectedCodes.length > 0 && ` in ${selectedCodes.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isError && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Scale size={32} className="text-slate-600" />
              <p className="text-slate-400 text-sm">Suchanfrage fehlgeschlagen. Bitte erneut versuchen.</p>
            </div>
          )}

          {isFetching && results.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!isFetching && !isError && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                <Scale size={28} className="text-slate-500" />
              </div>
              <div>
                <p className="text-slate-300 font-medium mb-1">Keine Ergebnisse gefunden</p>
                <p className="text-slate-500 text-sm">
                  {query
                    ? `Keine Gesetze für "${query}" gefunden.`
                    : 'Verwenden Sie die Suchleiste, um Paragrafen zu finden.'}
                </p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {results.map(law => (
                <ResultCard
                  key={law.id}
                  law={law}
                  onClick={() => setSelectedLaw(law)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Law detail modal */}
      {selectedLaw && (
        <LawModal law={selectedLaw} onClose={() => setSelectedLaw(null)} />
      )}
    </div>
  )
}
