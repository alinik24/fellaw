import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, RefreshCw } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../services/api'
import ChatMessage from './ChatMessage'
import toast from 'react-hot-toast'
import type { Message, Conversation } from '../types'

interface ChatInlineProps {
  caseId: string
}

export default function ChatInline({ caseId }: ChatInlineProps) {
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await chatApi.sendMessage({
        message: content,
        conversation_id: conversationId ?? undefined,
        case_id: caseId,
        conversation_type: 'legal_chat',
      })
      return res.data
    },
    onMutate: (content) => {
      const userMsg: Message = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversationId ?? '',
        role: 'user',
        content,
        citations: [],
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMsg])
      setIsThinking(true)
    },
    onSuccess: (data) => {
      setIsThinking(false)
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id)
      }
      const assistantMsg: Message = {
        id: data.id,
        conversation_id: data.conversation_id,
        role: 'assistant',
        content: data.content,
        citations: data.citations ?? [],
        created_at: data.created_at,
      }
      setMessages(prev => [...prev, assistantMsg])
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (err: unknown) => {
      setIsThinking(false)
      const msg = err instanceof Error ? err.message : 'Fehler beim Senden'
      toast.error(msg)
      // Remove the optimistic user message
      setMessages(prev => prev.filter(m => !m.id.startsWith('tmp-')))
    },
  })

  const handleSend = () => {
    const content = input.trim()
    if (!content || sendMutation.isPending) return
    setInput('')
    sendMutation.mutate(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setMessages([])
    setConversationId(null)
    setInput('')
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-900/50 border border-teal-700/50 flex items-center justify-center">
            <Bot size={16} className="text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">KI-Rechtsassistent</p>
            <p className="text-xs text-slate-400">Für diesen Fall spezialisiert</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="btn-ghost text-xs px-2 py-1"
          title="Gespräch zurücksetzen"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-teal-900/30 border border-teal-700/30 flex items-center justify-center">
              <Bot size={24} className="text-teal-400" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">Wie kann ich helfen?</p>
              <p className="text-slate-500 text-sm mt-1">
                Stellen Sie Fragen zu Ihrem Fall — ich kenne den Kontext.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs mt-2">
              {[
                'Welche Fristen muss ich beachten?',
                'Was sollte ich als nächstes tun?',
                'Wie formuliere ich eine Stellungnahme?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    textareaRef.current?.focus()
                  }}
                  className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessage
                role={msg.role as 'user' | 'assistant' | 'system'}
                content={msg.content}
                citations={msg.citations}
                createdAt={msg.created_at}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-teal-900/50 border border-teal-700/50 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-teal-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frage zum Fall stellen… (Enter zum Senden)"
            rows={1}
            className="flex-1 input-field resize-none text-sm leading-5 py-2.5 min-h-[40px]"
            disabled={sendMutation.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="btn-primary py-2.5 px-3 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Kein Ersatz für anwaltliche Beratung · Enter zum Senden · Shift+Enter für Zeilenumbruch
        </p>
      </div>
    </div>
  )
}
