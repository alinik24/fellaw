import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  Shield,
  Briefcase,
  MessageSquare,
  FolderOpen,
  UserSearch,
  FileText,
  Users,
  CalendarDays,
  Building2,
  ChevronRight,
  Star,
  CheckCircle2,
  Award,
  Clock,
  ArrowRight,
  Globe,
  Lock
} from 'lucide-react'

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' }
  })
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' }
  })
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { icon: CheckCircle2, number: '25.000+', label: 'gelöste Fälle' },
  { icon: Award,        number: '98%',     label: 'Erfolgsrate' },
  { icon: Users,        number: '500+',    label: 'Anwälte' },
  { icon: Clock,        number: '24/7',    label: 'KI-Support' },
]

const testimonials = [
  {
    name: 'Maria S.',
    role: 'Studentin',
    location: 'Paderborn',
    rating: 5,
    quote: 'Die KI-Beratung hat mir geholfen, meinen Mietstreit zu verstehen. Innerhalb von 2 Wochen war alles gelöst!',
    tag: 'Bürger',
    tagColor: 'blue'
  },
  {
    name: 'Thomas K.',
    role: 'Rechtsanwalt',
    location: 'Berlin',
    rating: 5,
    quote: 'Als Anwalt spare ich täglich Stunden durch die automatische Fallvorbereitung. Ein echtes Gamechanger-Tool.',
    tag: 'Profi',
    tagColor: 'emerald'
  },
  {
    name: 'Elena R.',
    role: 'Migrantin',
    location: 'München',
    rating: 5,
    quote: 'Auf Englisch und Arabisch erklärt — endlich verstehe ich meine Rechte in Deutschland.',
    tag: 'Bürger',
    tagColor: 'blue'
  },
]

const trustBadges = [
  { icon: Lock,   label: 'DSGVO-konform',          sub: 'Datenschutz nach EU-Recht' },
  { icon: Scale,  label: 'Deutsches Recht',          sub: 'BGB · StGB · ArbG · AufenthG' },
  { icon: Globe,  label: 'Mehrsprachig',             sub: 'DE · EN · AR · TR · RU' },
  { icon: Shield, label: 'Kostenlose Erstberatung', sub: 'Kein Risiko, kein Vertrag' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function FeatureBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-shrink-0 opacity-80">{icon}</span>
      <span className="text-white/80">{text}</span>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DualPortalLanding() {
  const navigate = useNavigate()
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [hoverCard, setHoverCard] = useState<'citizen' | 'lawyer' | null>(null)

  // Auto-cycle testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ── Top nav bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
            <Scale size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">JusticAI</span>
          <span className="text-slate-500 text-xs hidden sm:block">— Ihr Rechtsassistent</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Anmelden
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-all font-medium"
          >
            Registrieren
          </button>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="pt-28 pb-16 px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Deutsches Rechtsassistenz-System — KI-gestützt
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Ihr Recht. Ihr Anwalt.<br />Ihre KI.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Wählen Sie Ihren Einstiegspunkt — ob Sie rechtliche Hilfe suchen oder als Anwalt Mandanten betreuen möchten.
          </p>
        </motion.div>

        {/* ── Dual portal cards ── */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CITIZEN CARD */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            custom={1}
            onHoverStart={() => setHoverCard('citizen')}
            onHoverEnd={() => setHoverCard(null)}
            className="relative group rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => navigate('/register?role=citizen')}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900/80 to-slate-900 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-500" />

            <div className="relative p-8 flex flex-col gap-6">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                <Shield size={28} className="text-blue-400" />
              </div>

              {/* Title */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
                  Bürgerportal
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                  Ich brauche Rechtshilfe
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Für Bürger, Migranten und Studierende — auf Deutsch, Englisch und mehr.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2.5">
                <FeatureBullet icon={<MessageSquare size={14} className="text-blue-400" />} text="KI-Rechtsberatung auf Abruf" />
                <FeatureBullet icon={<FolderOpen    size={14} className="text-blue-400" />} text="Fallverwaltung & Zeitleiste" />
                <FeatureBullet icon={<UserSearch    size={14} className="text-blue-400" />} text="Passenden Anwalt finden" />
                <FeatureBullet icon={<FileText      size={14} className="text-blue-400" />} text="Dokumente analysieren & erstellen" />
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/register?role=citizen') }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Jetzt starten
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/dashboard') }}
                  className="w-full py-2.5 rounded-xl border border-blue-600/40 text-blue-300 hover:bg-blue-600/10 text-sm font-medium transition-all"
                >
                  Als Gast fortfahren
                </button>
              </div>
            </div>
          </motion.div>

          {/* PROFESSIONAL CARD */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            custom={2}
            onHoverStart={() => setHoverCard('lawyer')}
            onHoverEnd={() => setHoverCard(null)}
            className="relative group rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => navigate('/register?role=lawyer')}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900/80 to-slate-900 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl group-hover:bg-emerald-600/30 transition-all duration-500" />

            <div className="relative p-8 flex flex-col gap-6">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center">
                <Briefcase size={28} className="text-emerald-400" />
              </div>

              {/* Title */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
                  Profi-Portal
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                  Ich bin Rechtsanwalt / Kanzlei
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Für Anwälte, Kanzleien und Rechtsbeistände — professionelles Fallmanagement.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2.5">
                <FeatureBullet icon={<Users         size={14} className="text-emerald-400" />} text="Mandantenverwaltung & Kommunikation" />
                <FeatureBullet icon={<FolderOpen    size={14} className="text-emerald-400" />} text="Fallzuweisung & KI-Vorbereitung" />
                <FeatureBullet icon={<CalendarDays  size={14} className="text-emerald-400" />} text="Kalender & Fristenmanagement" />
                <FeatureBullet icon={<Building2     size={14} className="text-emerald-400" />} text="Kanzleiprofil & Team-Verwaltung" />
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/register?role=lawyer') }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Professionell beitreten
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/pro/dashboard') }}
                  className="w-full py-2.5 rounded-xl border border-emerald-600/40 text-emerald-300 hover:bg-emerald-600/10 text-sm font-medium transition-all"
                >
                  Demo ansehen
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 border-y border-slate-800/60 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center gap-1 text-center"
              >
                <stat.icon size={20} className="text-slate-400 mb-1" />
                <div className="text-2xl font-extrabold text-white">{stat.number}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-8"
          >
            Vertrauen & Sicherheit
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                custom={i}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center hover:border-slate-600 transition-colors"
              >
                <badge.icon size={20} className="text-slate-300" />
                <div className="text-sm font-semibold text-white">{badge.label}</div>
                <div className="text-xs text-slate-400">{badge.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials carousel ── */}
      <section className="py-12 px-4 bg-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center text-xl font-bold text-white mb-8"
          >
            Was unsere Nutzer sagen
          </motion.h2>

          <div className="relative h-48 overflow-hidden">
            <AnimatePresence mode="wait">
              {testimonials.map((t, i) =>
                i === activeTestimonial ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
                  >
                    <StarRating rating={t.rating} />
                    <blockquote className="text-slate-200 text-base leading-relaxed mt-3 mb-4 italic">
                      "{t.quote}"
                    </blockquote>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        t.tagColor === 'blue' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {t.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-slate-400">{t.role} · {t.location}</div>
                      </div>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.tagColor === 'blue'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-emerald-600/20 text-emerald-400'
                      }`}>
                        {t.tag}
                      </span>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeTestimonial ? 'bg-white w-5' : 'bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners row (placeholder) ── */}
      <section className="py-10 px-4 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-500 text-xs uppercase tracking-widest mb-6">
            Partnerinstitutionen & Kanzleien
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Kanzlei Müller & Partner', 'Rechtsberatung Weber', 'LegaAssist GmbH', 'AnwaltConnect', 'JurNetz Paderborn'].map((firm, i) => (
              <div
                key={i}
                className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm font-medium hover:border-slate-600 transition-colors"
              >
                {firm}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <Scale size={14} />
            <span>© 2026 fellaw. Alle Rechte vorbehalten.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-white transition-colors">Impressum</a>
            <a href="#" className="hover:text-white transition-colors">AGB</a>
            <a href="#" className="hover:text-white transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
