import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, File, FileText, Image, X, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { documentsApi } from '@/services/api'
import type { Document } from '@/types'
import { cn, formatDate } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'text/plain': ['.txt']
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

const CATEGORIES = [
  { value: 'evidence',      label: 'Beweismittel' },
  { value: 'court_doc',     label: 'Gerichtsdokument' },
  { value: 'correspondence',label: 'Korrespondenz' },
  { value: 'contract',      label: 'Vertrag' },
  { value: 'identification',label: 'Ausweisdokument' },
  { value: 'medical',       label: 'Medizinische Unterlagen' },
  { value: 'other',         label: 'Sonstiges' }
]

// ─── File type icon ───────────────────────────────────────────────────────────
function FileIcon({ mime }: { mime?: string }) {
  if (!mime) return <File size={20} className="text-slate-400" />
  if (mime === 'application/pdf') return <FileText size={20} className="text-red-400" />
  if (mime.includes('word')) return <FileText size={20} className="text-blue-400" />
  if (mime.startsWith('image/')) return <Image size={20} className="text-purple-400" />
  return <File size={20} className="text-slate-400" />
}

// ─── Format file size ─────────────────────────────────────────────────────────
function fmtSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Document['processing_status'] }) {
  const map: Record<Document['processing_status'], { label: string; className: string; icon: React.ReactNode }> = {
    pending:    { label: 'Ausstehend',  className: 'bg-slate-700/60 text-slate-300 border-slate-600/50',       icon: <Clock size={10} /> },
    processing: { label: 'Verarbeitung',className: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',   icon: <Loader2 size={10} className="animate-spin" /> },
    completed:  { label: 'Abgeschlossen',className: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',icon: <CheckCircle2 size={10} /> },
    failed:     { label: 'Fehler',      className: 'bg-red-900/50 text-red-300 border-red-700/50',              icon: <AlertCircle size={10} /> }
  }
  const { label, className, icon } = map[status]
  return (
    <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', className)}>
      {icon}{label}
    </span>
  )
}

// ─── Urgency badge ────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-900/50 text-red-300 border-red-700/50',
    high:     'bg-orange-900/50 text-orange-300 border-orange-700/50',
    medium:   'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
    low:      'bg-green-900/50 text-green-300 border-green-700/50'
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', map[urgency] ?? map['low'])}>
      {urgency}
    </span>
  )
}

// ─── Uploaded item ────────────────────────────────────────────────────────────
function UploadedItem({
  doc,
  onDelete,
  onReanalyze
}: {
  doc: Document
  onDelete: () => void
  onReanalyze: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  let analysis: Record<string, unknown> | null = null
  try {
    if (typeof doc.ai_analysis === 'string' && doc.ai_analysis.trim().startsWith('{')) {
      analysis = JSON.parse(doc.ai_analysis) as Record<string, unknown>
    }
  } catch { /* ignore */ }

  const summaryText = typeof analysis?.summary === 'string'
    ? analysis.summary
    : typeof doc.ai_analysis === 'string'
      ? doc.ai_analysis.slice(0, 180)
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        <FileIcon mime={doc.mime_type} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{doc.original_filename}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {fmtSize(doc.file_size)}
            {doc.created_at && ` · ${formatDate(doc.created_at)}`}
          </p>
        </div>

        <StatusBadge status={doc.processing_status} />

        <div className="flex items-center gap-1 flex-shrink-0">
          {doc.processing_status === 'completed' && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Analyse anzeigen"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={onReanalyze}
                className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"
                title="Neu analysieren"
              >
                <RefreshCw size={14} />
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Löschen"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Analysis results */}
      <AnimatePresence>
        {expanded && doc.processing_status === 'completed' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-700/50"
          >
            <div className="p-3 space-y-2">
              {summaryText && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Zusammenfassung</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{summaryText}</p>
                </div>
              )}

              {analysis && typeof analysis.key_dates === 'string' && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Schlüsseldaten</p>
                  <p className="text-xs text-slate-300">{analysis.key_dates as string}</p>
                </div>
              )}

              {analysis && typeof analysis.legal_implications === 'string' && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Rechtliche Konsequenzen</p>
                  <p className="text-xs text-slate-300">{analysis.legal_implications as string}</p>
                </div>
              )}

              {analysis && typeof analysis.action_required === 'string' && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Handlungsbedarf</p>
                  <p className="text-xs text-slate-300">{analysis.action_required as string}</p>
                </div>
              )}

              {analysis && typeof analysis.urgency === 'string' && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dringlichkeit</p>
                  <UrgencyBadge urgency={analysis.urgency as string} />
                </div>
              )}

              {!summaryText && !analysis && (
                <p className="text-xs text-slate-500 italic">Keine Analysedaten verfügbar.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar (processing) */}
      {doc.processing_status === 'processing' && (
        <div className="h-1 bg-slate-700">
          <motion.div
            className="h-1 bg-blue-500"
            animate={{ width: ['30%', '90%'] }}
            transition={{ duration: 8, ease: 'easeInOut' }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ─── DocumentUpload ───────────────────────────────────────────────────────────
interface DocumentUploadProps {
  caseId?: string
  onUploadComplete?: () => void
}

export default function DocumentUpload({ caseId, onUploadComplete }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [category, setCategory] = useState<string>('other')

  // Poll processing documents every 3s
  useEffect(() => {
    const processing = uploads.filter(d => d.processing_status === 'processing' || d.processing_status === 'pending')
    if (!processing.length) return

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        processing.map(async d => {
          try {
            const res = await documentsApi.get(d.id)
            return res.data
          } catch {
            return d
          }
        })
      )

      setUploads(prev =>
        prev.map(existing => updated.find(u => u.id === existing.id) ?? existing)
      )

      const nowDone = updated.filter(d => d.processing_status === 'completed')
      if (nowDone.length > 0) {
        toast.success(`${nowDone.length} Dokument(e) analysiert!`)
        onUploadComplete?.()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [uploads, onUploadComplete])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setIsUploading(true)

    for (const file of acceptedFiles) {
      try {
        const res = await documentsApi.upload(file, caseId, category)
        setUploads(prev => [res.data, ...prev])
        toast.success(`"${file.name}" hochgeladen!`)
      } catch {
        toast.error(`"${file.name}" konnte nicht hochgeladen werden.`)
      }
    }

    setIsUploading(false)
  }, [caseId, category])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true
  })

  const handleDelete = async (docId: string) => {
    try {
      await documentsApi.delete(docId)
      setUploads(prev => prev.filter(d => d.id !== docId))
      toast.success('Dokument gelöscht.')
    } catch {
      toast.error('Löschen fehlgeschlagen.')
    }
  }

  const handleReanalyze = async (docId: string) => {
    try {
      const res = await documentsApi.reanalyze(docId)
      setUploads(prev => prev.map(d => d.id === docId ? res.data : d))
      toast.success('Neu-Analyse gestartet…')
    } catch {
      toast.error('Neu-Analyse fehlgeschlagen.')
    }
  }

  return (
    <div className="space-y-4">

      {/* Category selector */}
      <div>
        <label className="text-xs text-slate-400 font-medium mb-1.5 block">Dokumentkategorie</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="input-field text-sm"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 size={32} className="text-blue-400 animate-spin" />
          ) : isDragActive ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            >
              <Upload size={32} className="text-blue-400" />
            </motion.div>
          ) : (
            <Upload size={32} className="text-slate-400" />
          )}

          <div>
            <p className="text-sm font-medium text-slate-200">
              {isDragActive
                ? 'Datei hier ablegen…'
                : isUploading
                  ? 'Wird hochgeladen…'
                  : 'Datei hierher ziehen oder klicken'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, DOCX, JPG, PNG, TXT · max. 50 MB
            </p>
          </div>
        </div>
      </div>

      {/* Rejection errors */}
      {fileRejections.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-300 space-y-0.5">
            {fileRejections.map(({ file, errors }) => (
              <p key={file.name}>
                <strong>{file.name}:</strong> {errors.map(e => e.message).join(', ')}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Upload list */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">{uploads.length} Dokument(e)</p>
            {uploads.map(doc => (
              <UploadedItem
                key={doc.id}
                doc={doc}
                onDelete={() => handleDelete(doc.id)}
                onReanalyze={() => handleReanalyze(doc.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
