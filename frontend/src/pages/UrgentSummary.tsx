import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download,
  Send,
  Check,
  FileText,
  Printer,
  Share2,
  ArrowLeft,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  User
} from 'lucide-react'

const UrgentSummary = () => {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const emergencyTitles: Record<string, string> = {
    'police-interaction': 'Polizeikontrolle',
    'car-accident': 'Verkehrsunfall',
    'assault-violence': 'Körperverletzung',
    'workplace-harassment': 'Mobbing am Arbeitsplatz',
    'housing-eviction': 'Wohnungsrecht',
    'child-custody': 'Sorgerecht',
    'immigration-detention': 'Ausländerrecht',
    'wrongful-arrest': 'Rechtswidrige Festnahme',
    'cyber-harassment': 'Cybermobbing'
  }

  const handleSaveCase = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
    navigate('/cases')
  }

  const handleDownloadPDF = () => {
    alert('PDF-Bericht wird generiert...')
  }

  const handleShareReport = () => {
    alert('Bericht-Link kopiert')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/urgent/select"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Notfallauswahl
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Check className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dokumentation abgeschlossen</h1>
              <p className="text-slate-400 mt-1">Ihre Notfalldokumentation wurde erfasst</p>
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-green-600/20 border border-green-600/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <Check className="h-6 w-6 text-green-400 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">Alle Schritte dokumentiert</h3>
              <p className="text-slate-300">
                Ihre Notfalldokumentation wurde erfolgreich erfasst und gespeichert.
                Sie können diese Dokumentation jetzt als Fall speichern oder als PDF herunterladen.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Zusammenfassung</h2>

          <div className="space-y-4">
            {/* Emergency Type */}
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-1">Notfalltyp</div>
                <div className="text-white font-medium">{emergencyTitles[type || ''] || 'Unbekannt'}</div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-1">Zeitstempel</div>
                <div className="text-white font-medium">
                  {new Date().toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-1">Standort</div>
                <div className="text-white font-medium">GPS-Koordinaten gespeichert</div>
                <div className="text-sm text-slate-400 mt-1">Berlin, Deutschland (Beispiel)</div>
              </div>
            </div>

            {/* Evidence Collected */}
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-1">Gesammelte Beweise</div>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Zeitstempel und GPS-Daten</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">Detaillierte Vorfallsbeschreibung</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">KI-generierte Empfehlungen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Nächste Schritte</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium text-white">Dokumentation überprüfen</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Prüfen Sie alle gesammelten Informationen auf Vollständigkeit
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-white">Als Fall speichern</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Erstellen Sie einen neuen Fall für weitere Nachverfolgung
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-white">Rechtsberatung einholen</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Kontaktieren Sie einen Anwalt für professionelle Beratung
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <button
            onClick={handleSaveCase}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-xl font-semibold transition-colors"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Als Fall speichern
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Download className="h-5 w-5" />
            PDF herunterladen
          </button>
        </motion.div>

        {/* Additional Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 mt-4"
        >
          <button
            onClick={handleShareReport}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white rounded-lg font-medium transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Teilen
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white rounded-lg font-medium transition-colors"
          >
            <Printer className="h-4 w-4" />
            Drucken
          </button>
        </motion.div>

        {/* Legal Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-200/80">
              <strong className="text-yellow-200">Wichtiger Hinweis:</strong> Diese Dokumentation ersetzt keine
              professionelle Rechtsberatung. Bitte konsultieren Sie einen zugelassenen Rechtsanwalt für
              verbindliche rechtliche Beratung gemäß § 3 RDG.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default UrgentSummary
