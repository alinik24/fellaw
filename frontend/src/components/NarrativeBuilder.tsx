import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2, RefreshCw, Sparkles, Copy, Check, ChevronDown,
  Globe, AlertTriangle, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { chatApi, casesApi } from '@/services/api'
import type { Narrative, NarrativeCreate } from '@/types'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const NARRATIVE_TYPES: { value: string; label: string; icon?: React.ReactNode }[] = [
  { value: 'police_statement',    label: 'Polizeiliche Stellungnahme',  icon: <FileText size={14} /> },
  { value: 'court_brief',         label: 'Schriftsatz fürs Gericht',    icon: <FileText size={14} /> },
  { value: 'letter_to_opposing',  label: 'Brief an Gegenpartei',        icon: <FileText size={14} /> },
  { value: 'formal_complaint',    label: 'Formelle Beschwerde',         icon: <FileText size={14} /> },
  { value: 'witness_statement',   label: 'Zeugenaussage',               icon: <FileText size={14} /> }
]

const IMPROVE_PROMPTS = [
  'Machen Sie den Text formeller.',
  'Fügen Sie mehr rechtliche Details hinzu.',
  'Kürzen Sie den Text auf das Wesentliche.',
  'Verbessern Sie die Argumentation.'
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface NarrativeBuilderProps {
  caseId: string
}

// ─── Version entry ────────────────────────────────────────────────────────────
interface VersionEntry {
  version: number
  content: string
  createdAt: string
}

// ─── NarrativeBuilder ─────────────────────────────────────────────────────────
export default function NarrativeBuilder({ caseId }: NarrativeBuilderProps) {
  const [narrativeType, setNarrativeType] = useState<string>('police_statement')
  const [language, setLanguage] = useState<'de' | 'en'>('de')
  const [additionalContext, setAdditionalContext] = useState('')
  const [content, setContent] = useState('')
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [showImproveMenu, setShowImproveMenu] = useState(false)

  // Fetch existing narratives
  const { data: existingNarratives } = useQuery<Narrative[]>({
    queryKey: ['narratives', caseId],
    queryFn: async () => {
      const res = await casesApi.getNarratives(caseId)
      return res.data
    }
  })

  // Pre-populate with most recent matching narrative
  useEffect(() => {
    if (!existingNarratives) return
    const match = existingNarratives
      .filter(n => n.narrative_type === narrativeType && n.language === language)
      .sort((a, b) => b.version - a.version)[0]
    if (match) {
      setContent(match.content)
      const versionList: VersionEntry[] = existingNarratives
        .filter(n => n.narrative_type === narrativeType && n.language === language)
        .sort((a, b) => a.version - b.version)
        .map(n => ({ version: n.version, content: n.content, createdAt: n.created_at }))
      setVersions(versionList)
      setSelectedVersion(versionList.length - 1)
    } else {
      setContent('')
      setVersions([])
      setSelectedVersion(0)
    }
  }, [existingNarratives, narrativeType, language])

  // Generate via chatApi
  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload: NarrativeCreate = {
        narrative_type: narrativeType,
        language,
        additional_context: additionalContext || undefined
      }
      // Try casesApi first, fall back to chatApi
      try {
        const res = await casesApi.generateNarrative(caseId, payload)
        return res.data.content
      } catch {
        const res = await chatApi.generateNarrative({
          case_id: caseId,
          narrative_type: narrativeType,
          language
        })
        return res.data.content
      }
    },
    onSuccess: (newContent) => {
      setContent(newContent)
      const newVersion: VersionEntry = {
        version: versions.length + 1,
        content: newContent,
        createdAt: new Date().toISOString()
      }
      setVersions(prev => [...prev, newVersion])
      setSelectedVersion(versions.length)
      toast.success('Stellungnahme erfolgreich generiert!')
    },
    onError: () => toast.error('Generierung fehlgeschlagen. Bitte erneut versuchen.')
  })

  // Improve via chat
  const improveMutation = useMutation({
    mutationFn: async (improvePrompt: string) => {
      const res = await chatApi.sendMessage({
        message: `Verbessere folgenden rechtlichen Text: "${improvePrompt}"\n\n---\n${content}`,
        case_id: caseId,
        conversation_type: 'narrative',
        language
      })
      return res.data.content
    },
    onSuccess: (improved) => {
      setContent(improved)
      const newVersion: VersionEntry = {
        version: versions.length + 1,
        content: improved,
        createdAt: new Date().toISOString()
      }
      setVersions(prev => [...prev, newVersion])
      setSelectedVersion(versions.length)
      setShowImproveMenu(false)
      toast.success('Text verbessert!')
    },
    onError: () => toast.error('Verbesserung fehlgeschlagen.')
  })

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVersionSwitch = (idx: number) => {
    setSelectedVersion(idx)
    setContent(versions[idx]?.content ?? '')
  }

  const isGenerating = generateMutation.isPending || improveMutation.isPending
  const charCount = content.length

  return (
    <div className="space-y-4">

      {/* ── Type selector ──────────────────────────────────────────────────── */}
      <div>
        <label className="text-xs text-slate-400 font-medium mb-2 block">Dokumenttyp</label>
        <div className="flex flex-wrap gap-2">
          {NARRATIVE_TYPES.map(nt => (
            <button
              key={nt.value}
              onClick={() => setNarrativeType(nt.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                narrativeType === nt.value
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
              )}
            >
              {nt.icon}
              {nt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Language toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-slate-400" />
        <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
          {(['de', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-semibold transition-all',
                language === lang
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Additional context ─────────────────────────────────────────────── */}
      <div>
        <label className="text-xs text-slate-400 font-medium mb-1.5 block">
          Zusätzlicher Kontext <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          value={additionalContext}
          onChange={e => setAdditionalContext(e.target.value)}
          placeholder="Besondere Anweisungen oder ergänzende Informationen für die KI…"
          rows={2}
          className="input-field resize-none text-sm"
        />
      </div>

      {/* ── Generate button ────────────────────────────────────────────────── */}
      <button
        onClick={() => generateMutation.mutate()}
        disabled={isGenerating}
        className="btn-primary w-full justify-center"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Generiere…
          </>
        ) : (
          <>
            <Wand2 size={16} />
            Stellungnahme generieren
          </>
        )}
      </button>

      {/* ── Generated content ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {content && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Version selector + char count */}
            <div className="flex items-center justify-between">
              {versions.length > 1 ? (
                <div className="relative">
                  <select
                    value={selectedVersion}
                    onChange={e => handleVersionSwitch(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1.5 pr-7 focus:outline-none appearance-none"
                  >
                    {versions.map((v, i) => (
                      <option key={i} value={i}>Version {v.version}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <span className="text-xs text-slate-500">Version 1</span>
              )}
              <span className="text-xs text-slate-500">{charCount.toLocaleString('de')} Zeichen</span>
            </div>

            {/* Editable textarea */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              className="input-field resize-y font-mono text-sm leading-relaxed"
            />

            {/* Action bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={isGenerating}
                className="btn-secondary text-xs py-1.5"
              >
                <RefreshCw size={12} className={cn(isGenerating && 'animate-spin')} />
                Neu generieren
              </button>

              {/* Improve dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowImproveMenu(!showImproveMenu)}
                  disabled={isGenerating}
                  className="btn-secondary text-xs py-1.5"
                >
                  <Sparkles size={12} />
                  Verbessern
                  <ChevronDown size={10} />
                </button>
                <AnimatePresence>
                  {showImproveMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden"
                    >
                      {IMPROVE_PROMPTS.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => improveMutation.mutate(prompt)}
                          className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={handleCopy} className="btn-secondary text-xs py-1.5">
                {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} />}
                {copied ? 'Kopiert!' : 'Kopieren'}
              </button>

              <button
                onClick={() => toast('Export-Funktion in Entwicklung.', { icon: '🚧' })}
                className="btn-ghost text-xs py-1.5"
              >
                Export
              </button>
            </div>

            {/* Legal disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <strong className="text-amber-300">Hinweis:</strong> Dieser Text wurde von einer KI generiert und stellt keinen Ersatz für anwaltliche Beratung dar. Bitte prüfen Sie den Inhalt sorgfältig.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
