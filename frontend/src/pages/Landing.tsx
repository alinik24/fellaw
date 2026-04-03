import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Scale,
  MessageSquare,
  FolderOpen,
  Clock,
  FileText,
  BookOpen,
  Upload,
  Shield,
  Globe,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
  })
}

const features = [
  {
    icon: <MessageSquare className="text-blue-400" size={24} />,
    title: 'KI-Rechtsberatung',
    titleEn: 'AI Legal Chat',
    desc: 'Stellen Sie rechtliche Fragen auf Deutsch oder Englisch und erhalten Sie fundierte Antworten basierend auf deutschem Recht.',
    color: 'from-blue-500/20 to-blue-600/10'
  },
  {
    icon: <FolderOpen className="text-teal-400" size={24} />,
    title: 'Fallverwaltung',
    titleEn: 'Case Management',
    desc: 'Organisieren Sie Ihre Rechtsfälle strukturiert – von Strafrecht über Mietrecht bis hin zu Arbeitsstreitigkeiten.',
    color: 'from-teal-500/20 to-teal-600/10'
  },
  {
    icon: <Clock className="text-purple-400" size={24} />,
    title: 'Zeitleiste & Beweise',
    titleEn: 'Evidence Timeline',
    desc: 'Dokumentieren Sie alle Ereignisse chronologisch und kategorisieren Sie Beweise nach Relevanz und Stärke.',
    color: 'from-purple-500/20 to-purple-600/10'
  },
  {
    icon: <FileText className="text-orange-400" size={24} />,
    title: 'Narrativ-Generator',
    titleEn: 'Narrative Builder',
    desc: 'Lassen Sie die KI professionelle rechtliche Narrativen, Klageschriften und Verteidigungsargumente erstellen.',
    color: 'from-orange-500/20 to-orange-600/10'
  },
  {
    icon: <BookOpen className="text-green-400" size={24} />,
    title: 'Rechtsdatenbank',
    titleEn: 'Law Database',
    desc: 'Durchsuchen Sie BGB, StGB, StPO und andere deutsche Gesetze mit intelligenter Volltextsuche.',
    color: 'from-green-500/20 to-green-600/10'
  },
  {
    icon: <Upload className="text-pink-400" size={24} />,
    title: 'Dokumentenanalyse',
    titleEn: 'Document Analysis',
    desc: 'Laden Sie Behördenschreiben, Verträge oder Urteile hoch – die KI analysiert und erklärt den Inhalt.',
    color: 'from-pink-500/20 to-pink-600/10'
  }
]

const trustIndicators = [
  { icon: <Globe size={16} />, text: 'Zweisprachig DE/EN' },
  { icon: <Scale size={16} />, text: 'Basiert auf deutschem Recht' },
  { icon: <Shield size={16} />, text: 'Datenschutz-zuerst' },
  { icon: <Star size={16} />, text: 'Kostenlos nutzbar' }
]

const useCases = [
  'Einwanderer & Geflüchtete',
  'Studierende in Deutschland',
  'Menschen mit geringem Einkommen',
  'Selbstständige & Freelancer'
]

export default function Landing() {
  const navigate = useNavigate()
  const { guestLogin, guestLoading } = useAuth()

  const handleGuestLogin = async () => {
    try {
      await guestLogin()
      navigate('/dashboard')
    } catch {
      // error handled in hook
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Scale size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">fellaw</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-ghost text-sm">
              Anmelden
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm">
              Registrieren
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-950/20 to-teal-950/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/40 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-8"
          >
            <Scale size={14} />
            KI-gestützte Rechtsberatung für Deutschland
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Ihr{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              KI-gestützter
            </span>
            <br />
            Rechtsberater
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Navigieren Sie komplexe deutsche Rechtsfälle ohne Anwalt – mit KI-Unterstützung,
            die Ihre Sprache spricht. Für Einwanderer, Studierende und alle, die Recht brauchen.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
            >
              <ArrowRight size={18} />
              Jetzt starten
            </button>
            <button
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-base"
            >
              {guestLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                  Wird geladen...
                </span>
              ) : (
                <>
                  <ChevronRight size={18} />
                  Als Gast fortfahren
                </>
              )}
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {trustIndicators.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="text-teal-400">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-12 px-4 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-500 text-sm mb-6">IDEAL FÜR</p>
          <div className="flex flex-wrap justify-center gap-3">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-full text-slate-300 text-sm"
              >
                <CheckCircle size={14} className="text-teal-400" />
                {uc}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Alles, was Sie für Ihren Rechtsfall brauchen
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Von der ersten Beratung bis zur fertigen Klageschrift – fellaw begleitet Sie durch jeden Schritt.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/70 hover:bg-slate-800/50 transition-all duration-300 cursor-default"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center mb-4 group-hover:border-slate-600 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{feature.titleEn}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-blue-950/50 to-teal-950/30 border border-blue-700/30 rounded-3xl p-10"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/5 to-teal-600/5" />
            <div className="relative">
              <Scale size={40} className="text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Bereit, Ihr Recht zu kennen?
              </h2>
              <p className="text-slate-400 mb-8">
                Kostenlos registrieren und sofort mit KI-gestützter Rechtsberatung starten.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all"
                >
                  <ArrowRight size={18} />
                  Kostenlos registrieren
                </button>
                <button
                  onClick={handleGuestLogin}
                  className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-8 py-3 rounded-xl transition-all"
                >
                  Ohne Konto testen
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <Scale size={12} className="text-white" />
          </div>
          <span className="text-slate-400 text-sm">fellaw – KI-gestützte Rechtshilfe</span>
        </div>
        <p className="text-slate-600 text-xs">
          Diese Plattform bietet keine Rechtsberatung im Sinne des RDG. Alle Informationen dienen nur zur Orientierung.
        </p>
      </footer>
    </div>
  )
}
