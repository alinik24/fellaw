import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, FileText, Map, Sword, Plus, Trash2,
  Send, Paperclip, ChevronDown, Scale, Lightbulb,
  PenLine, GitBranch, Shield, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { chatApi, casesApi } from '@/services/api'
import type { Conversation, Message, Case } from '@/types'
import { cn, formatRelativeDate } from '@/lib/utils'
import ChatMessage from '@/components/ChatMessage'

// ─── Constants ────────────────────────────────────────────────────────────────
const CONV_TYPE_ICONS: Record<string, React.ReactNode> = {
  general:          <MessageSquare size={14} />,
  narrative:        <FileText size={14} />,
  roadmap:          <Map size={14} />,
  counterargument:  <Sword size={14} />,
  document_analysis:<FileText size={14} />
}

const CONV_TYPE_LABELS: Record<string, string> = {
  general:          'Allgemein',
  narrative:        'Stellungnahme',
  roadmap:          'Roadmap',
  counterargument:  'Argumente',
  document_analysis:'Dokument'
}

const QUICK_ACTIONS = [
  {
    icon: <Lightbulb size={22} className="text-yellow-400" />,
    title: 'Rechtliche Situation erklären',
    desc: 'Schildern Sie Ihre Situation und erhalten Sie eine rechtliche Einschätzung.',
    type: 'general',
    prompt: 'Ich möchte meine rechtliche Situation erklären: '
  },
  {
    icon: <PenLine size={22} className="text-blue-400" />,
    title: 'Stellungnahme verfassen',
    desc: 'Erstellen Sie eine professionelle rechtliche Stellungnahme oder einen Schriftsatz.',
    type: 'narrative',
    prompt: 'Bitte helfen Sie mir, eine Stellungnahme zu verfassen. '
  },
  {
    icon: <GitBranch size={22} className="text-teal-400" />,
    title: 'Roadmap erstellen',
    desc: 'Erhalten Sie einen Schritt-für-Schritt-Plan für Ihren Rechtsfall.',
    type: 'roadmap',
    prompt: 'Erstellen Sie eine rechtliche Roadmap für meinen Fall. '
  },
  {
    icon: <Shield size={22} className="text-purple-400" />,
    title: 'Argumente analysieren',
    desc: 'Analysieren Sie Gegenargumente und stärken Sie Ihre Rechtsposition.',
    type: 'counterargument',
    prompt: 'Bitte analysieren Sie folgende Gegenargumente: '
  }
]

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-700/50 flex items-center justify-center">
        <Scale size={14} className="text-teal-400" />
      </div>
      <div className="bg-slate-800 border border-slate-700/50 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Conversation list item ───────────────────────────────────────────────────
function ConvItem({
  conv,
  active,
  onSelect,
  onDelete
}: {
  conv: Conversation
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [showDel, setShowDel] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
        active
          ? 'bg-blue-600/20 border border-blue-600/40 text-white'
          : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowDel(true)}
      onMouseLeave={() => setShowDel(false)}
    >
      <span className={cn('flex-shrink-0', active ? 'text-blue-400' : 'text-slate-400')}>
        {CONV_TYPE_ICONS[conv.conversation_type] ?? <MessageSquare size={14} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium">
          {conv.title || 'Neue Unterhaltung'}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {formatRelativeDate(conv.updated_at)}
        </p>
      </div>
      {showDel && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="p-1 rounded hover:bg-red-900/50 hover:text-red-400 text-slate-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Chat page ────────────────────────────────────────────────────────────────
export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeConvId, setActiveConvId] = useState<string | undefined>(conversationId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedCase, setSelectedCase] = useState<string | undefined>()
  const [convType, setConvType] = useState<string>('general')
  const [showCaseDropdown, setShowCaseDropdown] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.listConversations()
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

  // Load conversation when switching
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    chatApi.getConversation(activeConvId).then(res => {
      setMessages(res.data.messages ?? [])
      setConvType(res.data.conversation_type)
      setSelectedCase(res.data.case_id)
    }).catch(() => setMessages([]))
  }, [activeConvId])

  // Sync URL param
  useEffect(() => {
    if (conversationId !== activeConvId) {
      setActiveConvId(conversationId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      // Optimistic user message
      const tempUser: Message = {
        id: 'temp-' + Date.now(),
        conversation_id: activeConvId ?? '',
        role: 'user',
        content: text,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, tempUser])
      setIsTyping(true)

      const res = await chatApi.sendMessage({
        message: text,
        conversation_id: activeConvId,
        case_id: selectedCase,
        conversation_type: convType
      })
      return res.data
    },
    onSuccess: (assistantMsg) => {
      setIsTyping(false)
      // Replace temp messages with real assistant reply
      setMessages(prev => {
        const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'))
        return [...withoutTemp, assistantMsg]
      })
      // Refresh conversation to get conversation_id / title
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (assistantMsg.conversation_id && !activeConvId) {
        setActiveConvId(assistantMsg.conversation_id)
        navigate(`/chat/${assistantMsg.conversation_id}`, { replace: true })
      }
    },
    onError: () => {
      setIsTyping(false)
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
      toast.error('Nachricht konnte nicht gesendet werden.')
    }
  })

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || sendMutation.isPending) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    sendMutation.mutate(text)
  }, [input, sendMutation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── New conversation ──────────────────────────────────────────────────────────
  const handleNewChat = () => {
    eventSourceRef.current?.close()
    setActiveConvId(undefined)
    setMessages([])
    setInput('')
    setConvType('general')
    setSelectedCase(undefined)
    navigate('/chat', { replace: true })
  }

  // ── Delete conversation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (activeConvId === id) handleNewChat()
      toast.success('Unterhaltung gelöscht.')
    },
    onError: () => toast.error('Löschen fehlgeschlagen.')
  })

  // ── Quick action ──────────────────────────────────────────────────────────────
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setConvType(action.type)
    setInput(action.prompt)
    textareaRef.current?.focus()
  }

  const activeConv = conversations.find(c => c.id === activeConvId)

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">

      {/* ── LEFT: Sidebar ───────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-700/50">
        {/* New chat button */}
        <div className="p-3 border-b border-slate-700/50">
          <button
            onClick={handleNewChat}
            className="btn-primary w-full justify-center text-sm py-2"
          >
            <Plus size={16} />
            Neue Unterhaltung
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-center text-slate-500 text-xs mt-8 px-4">
              Noch keine Unterhaltungen. Starten Sie jetzt!
            </p>
          )}

          {/* Group by type */}
          {Object.entries(CONV_TYPE_LABELS).map(([type, label]) => {
            const group = conversations.filter(c => c.conversation_type === type)
            if (!group.length) return null
            return (
              <div key={type} className="mb-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-1.5 font-semibold">
                  {label}
                </p>
                {group.map(conv => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    active={conv.id === activeConvId}
                    onSelect={() => {
                      setActiveConvId(conv.id)
                      navigate(`/chat/${conv.id}`)
                    }}
                    onDelete={() => deleteMutation.mutate(conv.id)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: Chat window ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 bg-slate-900/80 border-b border-slate-700/50 gap-3 flex-shrink-0">
          <h2 className="text-sm font-semibold text-white truncate">
            {activeConv?.title || 'Neue Unterhaltung'}
          </h2>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Conversation type selector */}
            <select
              value={convType}
              onChange={e => setConvType(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(CONV_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {/* Case selector */}
            <div className="relative">
              <button
                onClick={() => setShowCaseDropdown(!showCaseDropdown)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                  selectedCase
                    ? 'bg-blue-900/40 border-blue-600/50 text-blue-300'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'
                )}
              >
                <Paperclip size={12} />
                {selectedCase
                  ? (cases.find(c => c.id === selectedCase)?.title ?? 'Fall verknüpft')
                  : 'Fall verknüpfen'}
                <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {showCaseDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => { setSelectedCase(undefined); setShowCaseDropdown(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-700 transition-colors"
                    >
                      Kein Fall
                    </button>
                    {cases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCase(c.id); setShowCaseDropdown(false) }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs transition-colors truncate',
                          selectedCase === c.id
                            ? 'bg-blue-900/40 text-blue-300'
                            : 'text-slate-300 hover:bg-slate-700'
                        )}
                      >
                        {c.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {selectedCase && (
              <button
                onClick={() => setSelectedCase(undefined)}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                title="Fall entfernen"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[400px] gap-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-900/40 border border-teal-700/50 flex items-center justify-center mx-auto mb-4">
                  <Scale size={32} className="text-teal-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Wie kann ich Ihnen heute helfen?
                </h2>
                <p className="text-slate-400 text-sm max-w-md">
                  Ich bin Ihr KI-Rechtsassistent. Stellen Sie mir eine Frage oder wählen Sie eine der folgenden Optionen.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => handleQuickAction(action)}
                    className="glass-hover p-4 rounded-xl text-left group"
                  >
                    <div className="mb-2">{action.icon}</div>
                    <p className="text-sm font-medium text-white mb-1">{action.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{action.desc}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              citations={msg.citations}
              createdAt={msg.created_at}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/60 flex-shrink-0">
          <div className="flex items-end gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Schreiben Sie Ihre Frage… (Strg+Enter zum Senden)"
              rows={1}
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none text-sm leading-relaxed max-h-[120px] overflow-y-auto"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                input.trim() && !sendMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              {sendMutation.isPending ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-2">
            Kein Ersatz für anwaltliche Beratung · Strg+Enter zum Senden
          </p>
        </div>
      </div>
    </div>
  )
}
