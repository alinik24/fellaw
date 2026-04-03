import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Car,
  AlertTriangle,
  Briefcase,
  Home,
  Baby,
  Globe,
  Gavel,
  Laptop,
  Mic,
  Phone
} from 'lucide-react'

const UrgentSelect = () => {
  const emergencyTypes = [
    {
      id: 'police-interaction',
      title: 'Polizeikontrolle / Festnahme',
      titleEn: 'Police Stop / Detention',
      icon: Shield,
      description: 'Verkehrskontrollen, Identitätsprüfungen oder Festnahmen – sofortiger Rechtsschutz.',
      descriptionEn: 'Traffic stops, identity checks, or detention requiring immediate rights protection.',
      urgency: 5,
      features: [
        'Sofortige Rechtsbelehrung',
        'Polizeiinformationen erfassen',
        'Echtzeit-Rechtsberatung',
        'Notfall-Kontakt-Benachrichtigung'
      ]
    },
    {
      id: 'car-accident',
      title: 'Verkehrsunfall',
      titleEn: 'Car Accident',
      icon: Car,
      description: 'Fahrzeugkollisionen – sofortige Dokumentation und Rechtsschutz.',
      descriptionEn: 'Vehicle collisions requiring immediate documentation and legal protection.',
      urgency: 4,
      features: [
        'Unfallort-Dokumentation',
        'Versicherungsanspruch vorbereiten',
        'Verletzungen erfassen',
        'Zeugenkontakte sichern'
      ]
    },
    {
      id: 'assault-violence',
      title: 'Körperverletzung / Gewalt',
      titleEn: 'Assault / Violence',
      icon: AlertTriangle,
      description: 'Körperliche Angriffe, häusliche Gewalt oder Bedrohungen.',
      descriptionEn: 'Physical assault, domestic violence, or threats requiring urgent intervention.',
      urgency: 5,
      features: [
        'Beweissicherung',
        'Sichere Orte finden',
        'Notdienste koordinieren',
        'Vertrauliche Dokumentation'
      ]
    },
    {
      id: 'workplace-harassment',
      title: 'Mobbing am Arbeitsplatz',
      titleEn: 'Workplace Harassment',
      icon: Briefcase,
      description: 'Belästigung, Diskriminierung oder Missbrauch am Arbeitsplatz.',
      descriptionEn: 'Workplace misconduct, harassment, or discrimination requiring action.',
      urgency: 3,
      features: [
        'Vorfall dokumentieren',
        'HR-Kommunikation',
        'Beweissammlung',
        'Anonyme Meldung'
      ]
    },
    {
      id: 'housing-eviction',
      title: 'Wohnung / Zwangsräumung',
      titleEn: 'Housing / Eviction',
      icon: Home,
      description: 'Rechtswidrige Kündigung, Mietstreitigkeiten oder Mieterrechtsverletzungen.',
      descriptionEn: 'Unlawful eviction, housing disputes, or tenant rights violations.',
      urgency: 4,
      features: [
        'Mieterrechte prüfen',
        'Kündigungsanalyse',
        'Notwohnungssuche',
        'Rechtsdokumentation'
      ]
    },
    {
      id: 'child-custody',
      title: 'Sorgerecht / Familienkonflikt',
      titleEn: 'Child Custody',
      icon: Baby,
      description: 'Sorgerechtsstreitigkeiten, Familienkonflikte oder Notfälle im Familienrecht.',
      descriptionEn: 'Child custody disputes, domestic conflicts, or family court emergencies.',
      urgency: 4,
      features: [
        'Sorgerechtsdokumente prüfen',
        'Kindeswohl dokumentieren',
        'Notfall-Gerichtseingaben',
        'Familienvermittlung'
      ]
    },
    {
      id: 'immigration-detention',
      title: 'Ausländerrecht / Abschiebung',
      titleEn: 'Immigration / Deportation',
      icon: Globe,
      description: 'Ausländerbehörde, Grenzprobleme oder Visumskomplikationen.',
      descriptionEn: 'Immigration enforcement, border issues, or visa complications.',
      urgency: 5,
      features: [
        'Rechte in mehreren Sprachen',
        'Botschaftskontakt',
        'Dokumentationsanforderungen',
        'Anwaltsnetzwerk'
      ]
    },
    {
      id: 'wrongful-arrest',
      title: 'Rechtswidrige Festnahme',
      titleEn: 'Wrongful Arrest',
      icon: Gavel,
      description: 'Unrechtmäßige Festnahme, illegale Durchsuchungen oder Grundrechtsverletzungen.',
      descriptionEn: 'Unlawful detention, improper searches, or constitutional rights violations.',
      urgency: 5,
      features: [
        'Grundrechtskarten',
        'Durchsuchungsprotokoll',
        'Beweissicherung',
        'Strafverteidiger-Netzwerk'
      ]
    },
    {
      id: 'cyber-harassment',
      title: 'Cybermobbing / Erpressung',
      titleEn: 'Cyber Harassment',
      icon: Laptop,
      description: 'Online-Bedrohungen, Cybermobbing, Erpressung oder digitales Stalking.',
      descriptionEn: 'Online threats, cyberbullying, blackmail, or digital stalking.',
      urgency: 3,
      features: [
        'Digitale Beweise sichern',
        'Plattform-Meldeanleitungen',
        'Datenschutz-Tools',
        'Cybercrime-Dokumentation'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">NOTFALL-RECHTSHILFE</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-white">
            Sofortiger Rechtsbeistand
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Wählen Sie Ihre Notsituation für sofortige rechtliche Beratung und Schutz.
            Unsere KI bietet situationsspezifische Hilfe zum Schutz Ihrer Rechte.
          </p>
        </motion.div>

        {/* Emergency Type Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {emergencyTypes.map((emergency, idx) => (
            <motion.div
              key={emergency.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
            >
              <Link
                to={`/urgent/action/${emergency.id}`}
                className="group block h-full"
              >
                <div className="h-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-red-600/50 hover:bg-slate-800/70 transition-all duration-200">
                  {/* Urgency Indicator */}
                  {emergency.urgency >= 4 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {Array.from({ length: emergency.urgency }).map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-red-400 font-medium uppercase">Höchste Dringlichkeit</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="p-3 bg-red-600/20 rounded-lg w-fit mb-4">
                    <emergency.icon className="h-8 w-8 text-red-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                    {emergency.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-1">{emergency.titleEn}</p>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4">
                    {emergency.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Funktionen:</p>
                    <ul className="space-y-1">
                      {emergency.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-xs text-slate-400 flex items-start">
                          <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center text-red-400 font-medium">
                    <span className="text-sm">Jetzt Hilfe</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4 mb-12"
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <Phone className="h-8 w-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Polizei Notruf</h3>
            <p className="text-3xl font-bold text-blue-400 mb-2">110</p>
            <p className="text-sm text-slate-400">Für akute Bedrohungen und Notfälle</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <Phone className="h-8 w-8 text-red-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Rettungsdienst</h3>
            <p className="text-3xl font-bold text-red-400 mb-2">112</p>
            <p className="text-sm text-slate-400">Für medizinische Notfälle</p>
          </div>
        </motion.div>

        {/* AI Voice Assistant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl p-8 text-center">
            <Mic className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Können Sie Ihre Situation nicht finden?
            </h3>
            <p className="text-slate-400 mb-6">
              Unsere KI kann jede Notsituation verstehen und darauf reagieren.
              Beschreiben Sie Ihre Situation mit eigenen Worten.
            </p>
            <Link
              to="/urgent/action/voice"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              <Mic className="h-4 w-4" />
              Mit KI-Assistent sprechen
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UrgentSelect;
