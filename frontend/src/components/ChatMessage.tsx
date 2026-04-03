import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Scale, Copy, Check, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import type { Citation } from '@/types'
import toast from 'react-hot-toast'

export interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: Citation[]
  createdAt?: string
  isStreaming?: boolean
}

// ─── Citation inline panel ────────────────────────────────────────────────────
function CitationsPanel({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)

  if (!citations.length) return null

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
      >
        <BookOpen size={12} />
        <span>{citations.length} Quellen</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 flex flex-col gap-2 overflow-hidden"
        >
          {citations.map((c, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.law_id && (
                    <span className="bg-teal-900/50 text-teal-300 border border-teal-700/50 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {c.law_id}
                    </span>
                  )}
                  {c.section && (
                    <span className="text-slate-400">§ {c.section}</span>
                  )}
                  <span className="text-slate-300 font-medium truncate max-w-[200px]">{c.title}</span>
                </div>
                {c.relevance_score !== undefined && (
                  <span className="text-slate-500 shrink-0">
                    {Math.round(c.relevance_score * 100)}%
                  </span>
                )}
              </div>
              {c.text && (
                <p className="text-slate-400 line-clamp-2 leading-relaxed">{c.text}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─── Streaming cursor ─────────────────────────────────────────────────────────
function StreamingCursor() {
  return (
    <motion.span
      className="inline-block w-0.5 h-4 bg-teal-400 ml-0.5 align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'steps(1)' }}
    />
  )
}

// ─── ChatMessage ──────────────────────────────────────────────────────────────
export default function ChatMessage({
  role,
  content,
  citations = [],
  createdAt,
  isStreaming = false
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Kopiert!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Kopieren fehlgeschlagen.')
    }
  }

  if (role === 'system') return null

  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 24 : -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar (assistant only) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-900/60 border border-teal-700/50 flex items-center justify-center mt-1">
          <Scale size={14} className="text-teal-400" />
        </div>
      )}

      {/* Bubble */}
      <div className={cn('relative max-w-[75%] flex flex-col', isUser && 'items-end')}>
        <div
          ref={contentRef}
          className={cn(
            'px-4 py-3 text-sm leading-relaxed shadow-md',
            isUser
              ? 'bg-blue-600 text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'
              : 'bg-slate-800 text-slate-100 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-slate-700/50'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none
              prose-p:my-1.5 prose-p:leading-relaxed
              prose-headings:text-slate-100 prose-headings:font-semibold
              prose-strong:text-slate-100
              prose-code:bg-slate-900/80 prose-code:text-teal-300 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700/50
              prose-ul:my-1.5 prose-ol:my-1.5
              prose-li:my-0.5
              prose-blockquote:border-teal-500 prose-blockquote:text-slate-300
              prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </div>
          )}

          {/* Copy button (hover) */}
          {hovered && !isStreaming && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleCopy}
              className={cn(
                'absolute top-2 p-1 rounded text-slate-400 hover:text-white transition-colors',
                isUser ? 'left-2' : 'right-2'
              )}
              title="Kopieren"
            >
              {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} />}
            </motion.button>
          )}
        </div>

        {/* Citations */}
        {!isUser && citations.length > 0 && (
          <div className="px-1">
            <CitationsPanel citations={citations} />
          </div>
        )}

        {/* Timestamp */}
        {createdAt && (
          <span className="text-[10px] text-slate-500 mt-1 px-1">
            {formatDateTime(createdAt)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
