import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Heart,
  Globe,
  ShoppingCart,
  Car,
  Home,
  FileText,
  ArrowRight
} from 'lucide-react'

const CaseTypeSelector = () => {
  const caseTypes = [
    {
      id: 'employment',
      title: 'Arbeitsrecht',
      titleEn: 'Employment Law',
      icon: Briefcase,
      description: 'Kündigung, Diskriminierung, Lohnstreitigkeiten',
      examples: ['Kündigungsschutz', 'Abfindung', 'Mobbing am Arbeitsplatz', 'Überstunden'],
      color: 'blue'
    },
    {
      id: 'family',
      title: 'Familienrecht',
      titleEn: 'Family Law',
      icon: Heart,
      description: 'Scheidung, Sorgerecht, Unterhalt',
      examples: ['Scheidung', 'Sorgerecht', 'Kindesunterhalt', 'Adoption'],
      color: 'pink'
    },
    {
      id: 'immigration',
      title: 'Ausländerrecht',
      titleEn: 'Immigration Law',
      icon: Globe,
      description: 'Visa, Asyl, Aufenthaltstitel',
      examples: ['Visumantrag', 'Asylverfahren', 'Familienzusammenführung', 'Abschiebeschutz'],
      color: 'green'
    },
    {
      id: 'consumer',
      title: 'Verbraucherschutz',
      titleEn: 'Consumer Protection',
      icon: ShoppingCart,
      description: 'Mangelhafte Produkte, Online-Shopping',
      examples: ['Produktmangel', 'Garantieanspruch', 'Online-Shopping', 'Rückgaberecht'],
      color: 'purple'
    },
    {
      id: 'traffic',
      title: 'Verkehrsrecht',
      titleEn: 'Traffic Law',
      icon: Car,
      description: 'Bußgelder, Unfälle, Führerschein',
      examples: ['Bußgeldbescheid', 'Unfallschadensersatz', 'Führerscheinentzug', 'Geschwindigkeitsverstoß'],
      color: 'orange'
    },
    {
      id: 'housing',
      title: 'Mietrecht',
      titleEn: 'Housing / Tenancy Law',
      icon: Home,
      description: 'Mietstreitigkeiten, Kündigung, Mängel',
      examples: ['Mietminderung', 'Kündigung', 'Kaution', 'Schimmel'],
      color: 'teal'
    },
    {
      id: 'general',
      title: 'Allgemeines Zivilrecht',
      titleEn: 'General Civil Law',
      icon: FileText,
      description: 'Verträge, Schadensersatz',
      examples: ['Vertragsbruch', 'Schadensersatz', 'Forderungen', 'Verjährung'],
      color: 'slate'
    }
  ]

  const colorClasses: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
    blue: { bg: 'bg-blue-600/20', border: 'border-blue-600/30', icon: 'text-blue-400', hover: 'hover:border-blue-600/50' },
    pink: { bg: 'bg-pink-600/20', border: 'border-pink-600/30', icon: 'text-pink-400', hover: 'hover:border-pink-600/50' },
    green: { bg: 'bg-green-600/20', border: 'border-green-600/30', icon: 'text-green-400', hover: 'hover:border-green-600/50' },
    purple: { bg: 'bg-purple-600/20', border: 'border-purple-600/30', icon: 'text-purple-400', hover: 'hover:border-purple-600/50' },
    orange: { bg: 'bg-orange-600/20', border: 'border-orange-600/30', icon: 'text-orange-400', hover: 'hover:border-orange-600/50' },
    teal: { bg: 'bg-teal-600/20', border: 'border-teal-600/30', icon: 'text-teal-400', hover: 'hover:border-teal-600/50' },
    slate: { bg: 'bg-slate-600/20', border: 'border-slate-600/30', icon: 'text-slate-400', hover: 'hover:border-slate-600/50' }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Welches Rechtsgebiet betrifft Ihren Fall?
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Wählen Sie das passende Rechtsgebiet für ein maßgeschneidertes Aufnahmeformular
            mit spezifischen Fragen und rechtlichen Hinweisen.
          </p>
        </motion.div>

        {/* Case Type Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {caseTypes.map((caseType, idx) => {
            const colors = colorClasses[caseType.color]
            return (
              <motion.div
                key={caseType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={`/cases/new/${caseType.id}`}
                  className="group block h-full"
                >
                  <div className={`h-full bg-slate-800/50 border ${colors.border} rounded-xl p-6 ${colors.hover} transition-all duration-200`}>
                    {/* Icon */}
                    <div className={`p-3 ${colors.bg} rounded-lg w-fit mb-4`}>
                      <caseType.icon className={`h-8 w-8 ${colors.icon}`} />
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-semibold text-white mb-1 group-hover:${colors.icon} transition-colors`}>
                      {caseType.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">{caseType.titleEn}</p>

                    {/* Description */}
                    <p className="text-sm text-slate-400 mb-4">
                      {caseType.description}
                    </p>

                    {/* Examples */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">Beispiele:</p>
                      <div className="flex flex-wrap gap-2">
                        {caseType.examples.slice(0, 3).map((example, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center ${colors.icon} font-medium`}>
                      <span className="text-sm">Formular ausfüllen</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Unsicher welches Rechtsgebiet?
            </h3>
            <p className="text-slate-400 mb-4">
              Nutzen Sie unseren KI-Chat für eine Erstberatung oder starten Sie
              mit dem allgemeinen Formular.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/chat"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                KI-Chat starten
              </Link>
              <Link
                to="/cases/new/general"
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Allgemeines Formular
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CaseTypeSelector
