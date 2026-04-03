import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  Mic,
  Eye,
  Car,
  AlertTriangle,
  Phone,
  Camera,
  Users,
  MapPin,
  Globe,
  EyeOff,
  FileText,
  Shield,
  Check,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

const UrgentAction = () => {
  const { type } = useParams<{ type: string }>()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [completedActions, setCompletedActions] = useState<string[]>([])
  const [showGuidance, setShowGuidance] = useState(true)

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const emergencyConfig: Record<string, {
    title: string
    titleEn: string
    aiGuidance: string
    smartActions: Array<{ id: string; label: string; detail: string; icon: any }>
    quickActions: Array<{ id: string; label: string; icon: any; variant: string }>
  }> = {
    'police-interaction': {
      title: 'Polizeikontrolle - Rechtsschutz',
      titleEn: 'Police Encounter Protection',
      aiGuidance: 'Bleiben Sie ruhig und halten Sie Ihre Hände sichtbar. Sie haben das Recht zu schweigen und das Recht auf einen Anwalt. Stimmen Sie keinen Durchsuchungen ohne Durchsuchungsbefehl zu.',
      smartActions: [
        { id: 'stay-calm', label: 'Ruhig bleiben & Hände sichtbar', detail: 'Keine plötzlichen Bewegungen, Hände auf Lenkrad', icon: Eye },
        { id: 'rights-card', label: 'Rechtskarte zeigen', detail: 'Digitale Karte mit Rechtsformulierungen anzeigen', icon: FileText },
        { id: 'log-officer', label: 'Beamteninformationen erfassen', detail: 'Dienstnummer, Kennzeichen, Uhrzeit dokumentieren', icon: Shield },
        { id: 'location', label: 'Standort speichern', detail: 'GPS-Koordinaten und Adresse dokumentieren', icon: MapPin }
      ],
      quickActions: [
        { id: 'call-assist', label: 'Notruf-Assistent', icon: Phone, variant: 'destructive' },
        { id: 'record', label: 'Foto/Video aufnehmen', icon: Camera, variant: 'default' },
        { id: 'translation', label: 'Sofort-Übersetzung', icon: Globe, variant: 'default' },
        { id: 'auto-report', label: 'Bericht erstellen', icon: FileText, variant: 'default' }
      ]
    },
    'car-accident': {
      title: 'Verkehrsunfall - Sofortmaßnahmen',
      titleEn: 'Car Accident Response',
      aiGuidance: 'Sicherheit geht vor. Bewegen Sie sich an einen sicheren Ort, wenn möglich. Prüfen Sie auf Verletzungen und rufen Sie ggf. Rettungsdienste. Geben Sie keine Schuld zu.',
      smartActions: [
        { id: 'safe-location', label: 'Sicheren Ort aufsuchen', detail: 'Warnblinker aktivieren, Fahrzeug bewegen', icon: Car },
        { id: 'log-injuries', label: 'Verletzungen dokumentieren', detail: 'Checkliste zur Selbsteinschätzung', icon: AlertTriangle },
        { id: 'exchange-info', label: 'Informationen austauschen', detail: 'Kontaktdaten und Zeugenaussagen', icon: Users },
        { id: 'tell-side', label: 'Hergang schildern', detail: 'Vorfall für Dokumentation beschreiben', icon: Mic }
      ],
      quickActions: [
        { id: 'call-assist', label: 'Notruf 112', icon: Phone, variant: 'destructive' },
        { id: 'record', label: 'Unfallstelle fotografieren', icon: Camera, variant: 'default' },
        { id: 'alert-contacts', label: 'Kontakte benachrichtigen', icon: Users, variant: 'default' },
        { id: 'auto-report', label: 'Unfallbericht', icon: FileText, variant: 'default' }
      ]
    },
    'assault-violence': {
      title: 'Körperverletzung - Schutzprotokoll',
      titleEn: 'Assault Protection Protocol',
      aiGuidance: 'Ihre Sicherheit hat Priorität. Wenn Sie in unmittelbarer Gefahr sind, rufen Sie 110. Dokumentieren Sie alles, wenn es sicher ist.',
      smartActions: [
        { id: 'document', label: 'Beweise dokumentieren', detail: 'Fotos von Verletzungen und Umgebung', icon: Camera },
        { id: 'describe-attacker', label: 'Täter beschreiben', detail: 'Physische Merkmale und Kennzeichen', icon: Eye },
        { id: 'witnesses', label: 'Zeugen erfassen', detail: 'Kontaktinformationen von Zeugen', icon: Users },
        { id: 'safe-location', label: 'Sicheren Ort finden', detail: 'Nächste Polizeistation oder öffentlicher Ort', icon: MapPin }
      ],
      quickActions: [
        { id: 'call-assist', label: 'Polizei 110', icon: Phone, variant: 'destructive' },
        { id: 'record', label: 'Beweise sichern', icon: Camera, variant: 'default' },
        { id: 'safe-zone', label: 'Sichere Zone', icon: MapPin, variant: 'default' },
        { id: 'hidden-mode', label: 'Versteckter Modus', icon: EyeOff, variant: 'default' }
      ]
    },
    'workplace-harassment': {
      title: 'Mobbing am Arbeitsplatz',
      titleEn: 'Workplace Harassment',
      aiGuidance: 'Dokumentieren Sie den Vorfall sofort mit konkreten Details: Datum, Uhrzeit, Ort und Zeugen. Bewahren Sie alle Kommunikationen auf.',
      smartActions: [
        { id: 'incident-log', label: 'Vorfall protokollieren', detail: 'Detaillierte Beschreibung mit Datum/Uhrzeit', icon: FileText },
        { id: 'witnesses', label: 'Zeugen dokumentieren', detail: 'Namen und Kontakte von Anwesenden', icon: Users },
        { id: 'evidence', label: 'Beweise sammeln', detail: 'E-Mails, Nachrichten, Fotos sichern', icon: Camera },
        { id: 'hr-contact', label: 'HR-Kommunikation', detail: 'Offizieller Meldeweg vorbereiten', icon: AlertCircle }
      ],
      quickActions: [
        { id: 'record', label: 'Dokumentieren', icon: Camera, variant: 'default' },
        { id: 'auto-report', label: 'Beschwerde erstellen', icon: FileText, variant: 'default' }
      ]
    },
    'housing-eviction': {
      title: 'Wohnungsrecht / Kündigung',
      titleEn: 'Housing Rights Protection',
      aiGuidance: 'Das deutsche Mietrecht bietet starken Schutz. Dokumentieren Sie alle Kündigungen und Kommunikation. Sie haben auch während einer Räumung Rechte.',
      smartActions: [
        { id: 'check-notice', label: 'Kündigung prüfen', detail: 'Rechtmäßigkeit und Fristen analysieren', icon: FileText },
        { id: 'document-condition', label: 'Zustand dokumentieren', detail: 'Fotos der Wohnung erstellen', icon: Camera },
        { id: 'tenant-rights', label: 'Mieterrechte', detail: 'Ihre Rechte nach BGB prüfen', icon: Shield },
        { id: 'find-help', label: 'Hilfe finden', detail: 'Mieterverein oder Beratungsstelle', icon: Users }
      ],
      quickActions: [
        { id: 'record', label: 'Dokumentieren', icon: Camera, variant: 'default' },
        { id: 'auto-report', label: 'Widerspruch erstellen', icon: FileText, variant: 'default' }
      ]
    },
    voice: {
      title: 'KI-Situationsanalyse',
      titleEn: 'AI Situation Analysis',
      aiGuidance: 'Ich verstehe Ihre Situation. Beschreiben Sie mir bitte, was passiert ist. Ich werde Ihnen spezifische Hilfe und Anleitung geben.',
      smartActions: [
        { id: 'voice-input', label: 'Situation beschreiben', detail: 'Mit Sprache oder Text eingeben', icon: Mic },
        { id: 'ai-analysis', label: 'KI-Analyse', detail: 'Automatische Kategorisierung und Empfehlungen', icon: AlertCircle },
        { id: 'action-plan', label: 'Aktionsplan', detail: 'Schrittweise Anleitung basierend auf Ihrer Situation', icon: FileText }
      ],
      quickActions: [
        { id: 'voice-record', label: 'Sprachaufnahme', icon: Mic, variant: 'default' },
        { id: 'translate', label: 'Übersetzen', icon: Globe, variant: 'default' }
      ]
    }
  }

  const config = emergencyConfig[type || ''] || emergencyConfig.voice
  const progress = (completedActions.length / config.smartActions.length) * 100

  const handleActionComplete = (actionId: string) => {
    if (!completedActions.includes(actionId)) {
      setCompletedActions([...completedActions, actionId])
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Emergency Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg font-bold">{formatTime(elapsedTime)}</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              NOTFALL AKTIV
            </div>
          </div>
          <div className="text-sm">
            {completedActions.length} / {config.smartActions.length} Schritte
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-slate-400">{config.titleEn}</p>
        </motion.div>

        {/* AI Guidance */}
        {showGuidance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-600/20 border border-blue-600/30 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-600/30 rounded-lg">
                <Mic className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-400 mb-2 uppercase">KI Rechtsassistent</div>
                <p className="text-white leading-relaxed">{config.aiGuidance}</p>
              </div>
              <button
                onClick={() => setShowGuidance(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Fortschritt</span>
            <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-600 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Smart Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Empfohlene Schritte</h2>
            {config.smartActions.map((action, idx) => {
              const isCompleted = completedActions.includes(action.id)
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${
                    isCompleted ? 'border-green-600/50 bg-green-600/10' : 'border-slate-700/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-600/20' : 'bg-slate-700/50'}`}>
                      <action.icon className={`h-6 w-6 ${isCompleted ? 'text-green-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{action.label}</h3>
                      <p className="text-sm text-slate-400">{action.detail}</p>
                    </div>
                    {isCompleted ? (
                      <div className="p-2 bg-green-600/20 rounded-lg">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleActionComplete(action.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Erledigt
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Schnellaktionen</h2>
            {config.quickActions.map((action, idx) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${
                  action.variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white'
                }`}
              >
                <action.icon className="h-5 w-5" />
                <span className="flex-1 text-left">{action.label}</span>
              </motion.button>
            ))}

            {/* Emergency Contact */}
            <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-4 mt-6">
              <h3 className="font-semibold text-white mb-2">Notruf</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Polizei</span>
                  <span className="text-2xl font-bold text-white">110</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Rettungsdienst</span>
                  <span className="text-2xl font-bold text-white">112</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {completedActions.length >= config.smartActions.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <Link
              to={`/urgent/summary/${type}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-lg transition-colors"
            >
              Zusammenfassung anzeigen
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default UrgentAction
