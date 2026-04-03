import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Map, Check, Clock, Play, SkipForward, Sparkles, ChevronDown, ChevronUp, Calendar, ExternalLink
} from 'lucide-react'
import { casesApi } from '../services/api'
import { cn, formatDate } from '../lib/utils'
import type { RoadmapStep } from '../types'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending: { label: 'Ausstehend', icon: <Clock size={14} />, color: 'text-slate-400', bg: 'bg-slate-700/50', border: 'border-slate-600' },
  in_progress: { label: 'In Bearbeitung', icon: <Play size={14} />, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-600' },
  completed: { label: 'Abgeschlossen', icon: <Check size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-600' },
  skipped: { label: 'Übersprungen', icon: <SkipForward size={14} />, color: 'text-slate-500', bg: 'bg-slate-800/30', border: 'border-slate-700' }
}

interface Props { caseId: string }

export default function RoadmapView({ caseId }: Props) {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const { data: steps = [], isLoading } = useQuery<RoadmapStep[]>({
    queryKey: ['roadmap', caseId],
    queryFn: async () => (await casesApi.getRoadmap(caseId)).data
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoadmapStep> }) =>
      casesApi.updateRoadmapStep(caseId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roadmap', caseId] })
  })

  const generateMutation = useMutation({
    mutationFn: () => casesApi.generateRoadmap(caseId),
    onMutate: () => setGenerating(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', caseId] })
      setGenerating(false)
      toast.success('Fahrplan wurde generiert!')
    },
    onError: () => {
      setGenerating(false)
      toast.error('Fehler beim Generieren')
    }
  })

  const completedCount = steps.filter(s => s.status === 'completed').length
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number)

  const setStatus = (id: string, status: RoadmapStep['status']) => {
    updateMutation.mutate({ id, data: { status } })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Rechtlicher Fahrplan</h2>
          {steps.length > 0 && (
            <p className="text-slate-400 text-sm mt-0.5">{completedCount} von {steps.length} Schritten abgeschlossen</p>
          )}
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generating}
          className="btn-primary text-sm"
        >
          {generating ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : <Sparkles size={14} />}
          {steps.length > 0 ? 'Neu generieren' : 'Fahrplan generieren'}
        </button>
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Gesamtfortschritt</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : steps.length === 0 ? (
        <div className="text-center py-16">
          <Map size={40} className="text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-slate-300 font-medium mb-2">Noch kein Fahrplan</h3>
          <p className="text-slate-500 text-sm mb-4">
            Lassen Sie die KI einen individuellen Fahrplan für Ihren Fall erstellen
          </p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generating}
            className="btn-primary mx-auto"
          >
            {generating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Sparkles size={16} />}
            KI-Fahrplan generieren
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((step, i) => {
            const config = STATUS_CONFIG[step.status]
            const isExpanded = expandedId === step.id
            const actionItems: string[] = Array.isArray(step.action_items) ? step.action_items : []
            const resources: string[] = Array.isArray(step.resources) ? step.resources : []

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  'border rounded-xl overflow-hidden transition-all',
                  config.border,
                  step.status === 'completed' ? 'opacity-70' : ''
                )}
              >
                <div
                  className={cn('p-4 cursor-pointer', config.bg)}
                  onClick={() => setExpandedId(isExpanded ? null : step.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Step number / check */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 mt-0.5',
                      step.status === 'completed'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : step.status === 'in_progress'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                        : 'bg-slate-700 border-slate-600 text-slate-400'
                    )}>
                      {step.status === 'completed' ? <Check size={14} /> : step.step_number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-white text-sm">{step.title}</h4>
                          {step.description && !isExpanded && (
                            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{step.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={cn('flex items-center gap-1 text-xs', config.color)}>
                            {config.icon} {config.label}
                          </span>
                          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </div>

                      {step.deadline && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Calendar size={10} /> Frist: {formatDate(step.deadline)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-800/20 border-t border-slate-700/50">
                    <div className="pt-3 pl-11 space-y-3">
                      {step.description && (
                        <p className="text-slate-300 text-sm">{step.description}</p>
                      )}

                      {actionItems.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-slate-400 mb-1.5">Maßnahmen:</div>
                          <ul className="space-y-1">
                            {actionItems.map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {resources.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-slate-400 mb-1.5">Ressourcen:</div>
                          <ul className="space-y-1">
                            {resources.map((res, j) => (
                              <li key={j} className="flex items-center gap-1.5 text-sm text-blue-400">
                                <ExternalLink size={11} /> {res}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.legal_basis && (
                        <div className="text-xs bg-slate-700/40 rounded-lg px-3 py-2 text-slate-300">
                          <span className="font-medium text-slate-400">Rechtsgrundlage: </span>{step.legal_basis}
                        </div>
                      )}

                      {step.ai_notes && (
                        <div className="text-xs bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2 text-blue-300">
                          <span className="font-medium">KI-Hinweis: </span>{step.ai_notes}
                        </div>
                      )}

                      {/* Status buttons */}
                      <div className="flex gap-2 flex-wrap pt-1">
                        {(['pending', 'in_progress', 'completed', 'skipped'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(step.id, s)}
                            disabled={step.status === s}
                            className={cn(
                              'text-xs px-3 py-1.5 rounded-lg border transition-all',
                              step.status === s
                                ? cn(STATUS_CONFIG[s].bg, STATUS_CONFIG[s].border, STATUS_CONFIG[s].color, 'font-medium')
                                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                            )}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
