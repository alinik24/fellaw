import { useState } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  BookOpen,
  Upload,
  UserSearch,
  Send,
  Inbox,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  User,
  Globe,
  ArrowLeftRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface LayoutProps {
  portalRole?: 'citizen' | 'lawyer'
}

// ─── Page title maps ──────────────────────────────────────────────────────────
const CITIZEN_TITLES: Record<string, string> = {
  '/dashboard':    'Übersicht',
  '/cases':        'Meine Fälle',
  '/cases/new':    'Neuer Fall',
  '/chat':         'KI-Rechtsberatung',
  '/laws':         'Rechtsbibliothek',
  '/documents':    'Dokumente',
  '/find-lawyer':  'Anwalt finden',
  '/referrals':    'Meine Anfragen',
}

const PRO_TITLES: Record<string, string> = {
  '/pro/dashboard':  'Übersicht',
  '/pro/referrals':  'Eingehende Anfragen',
  '/pro/cases':      'Meine Fälle',
  '/pro/clients':    'Mandanten',
  '/pro/calendar':   'Kalender & Fristen',
  '/pro/profile':    'Mein Profil',
  '/pro/onboarding': 'Profil einrichten',
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onCollapse,
  portalRole,
  language,
  onLanguage,
}: {
  collapsed: boolean
  onCollapse: (v: boolean) => void
  portalRole: 'citizen' | 'lawyer'
  language: 'DE' | 'EN'
  onLanguage: (l: 'DE' | 'EN') => void
}) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth()

  const isCitizen = portalRole === 'citizen'
  const accent    = isCitizen ? 'blue' : 'emerald'

  const citizenNav: NavItem[] = [
    { label: 'Übersicht',        href: '/dashboard',    icon: <LayoutDashboard size={18} /> },
    { label: 'Meine Fälle',      href: '/cases',        icon: <FolderOpen      size={18} /> },
    { label: 'KI-Chat',          href: '/chat',         icon: <MessageSquare   size={18} /> },
    { label: 'Rechtsbibliothek', href: '/laws',         icon: <BookOpen        size={18} /> },
    { label: 'Dokumente',        href: '/documents',    icon: <Upload          size={18} /> },
    { label: 'Anwalt finden',    href: '/find-lawyer',  icon: <UserSearch      size={18} /> },
    { label: 'Meine Anfragen',   href: '/referrals',    icon: <Send            size={18} /> },
  ]

  const proNav: NavItem[] = [
    { label: 'Übersicht',          href: '/pro/dashboard',  icon: <LayoutDashboard size={18} /> },
    { label: 'Eingehende Anfragen', href: '/pro/referrals', icon: <Inbox           size={18} />, badge: 3 },
    { label: 'Meine Fälle',        href: '/pro/cases',      icon: <FolderOpen      size={18} /> },
    { label: 'Nachrichten',        href: '/pro/clients',    icon: <MessageSquare   size={18} /> },
    { label: 'Kalender',           href: '/pro/calendar',   icon: <CalendarDays    size={18} /> },
    { label: 'Team',               href: '/pro/profile',    icon: <Users           size={18} /> },
    { label: 'Einstellungen',      href: '/settings',       icon: <Settings        size={18} /> },
  ]

  const navItems = isCitizen ? citizenNav : proNav

  const accentActive = isCitizen
    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'

  const accentIcon = isCitizen
    ? 'bg-blue-600'
    : 'bg-emerald-600'

  const switchLabel = isCitizen
    ? (language === 'DE' ? 'Zum Anwaltsportal' : 'Switch to Pro Portal')
    : (language === 'DE' ? 'Zur Bürgeransicht'  : 'Switch to Citizen View')

  const switchTarget = isCitizen ? '/pro/dashboard' : '/dashboard'

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-slate-900 border-r border-slate-700/50 z-20 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-slate-700/50 min-h-[64px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', accentIcon)}>
            <Scale size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="text-sm font-bold text-white whitespace-nowrap leading-tight">
                  JusticAI
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap leading-tight">
                  Ihr Rechtsassistent
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Role badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2"
          >
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full',
              isCitizen
                ? 'bg-blue-600/20 text-blue-400'
                : 'bg-emerald-600/20 text-emerald-400'
            )}>
              {isCitizen ? (language === 'DE' ? 'Bürgerportal' : 'Citizen Portal') : (language === 'DE' ? 'Profi-Portal' : 'Pro Portal')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/pro/dashboard' && location.pathname.startsWith(item.href))
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive ? accentActive : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <span className={cn(
                'flex-shrink-0',
                isActive
                  ? isCitizen ? 'text-blue-400' : 'text-emerald-400'
                  : 'text-slate-400 group-hover:text-white'
              )}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && item.badge > 0 && !collapsed && (
                <span className={cn(
                  'ml-auto text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0',
                  isCitizen ? 'bg-blue-600' : 'bg-emerald-600'
                )}>
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer area */}
      <div className="px-2 py-2 border-t border-slate-700/50 space-y-1">
        {/* Language toggle */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg"
            >
              <Globe size={12} className="text-slate-500 ml-1" />
              {(['DE', 'EN'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguage(lang)}
                  className={cn(
                    'flex-1 text-xs font-medium py-1 rounded-md transition-all',
                    language === lang
                      ? isCitizen ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {lang}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portal switch */}
        <button
          onClick={() => navigate(switchTarget)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
        >
          <ArrowLeftRight size={14} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {switchLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 px-1 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
            isCitizen
              ? 'bg-gradient-to-br from-blue-500 to-blue-700'
              : 'bg-gradient-to-br from-emerald-500 to-teal-700'
          )}>
            {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || <User size={14} />}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <div className="text-xs font-medium text-white truncate">
                  {user?.full_name || user?.email || 'Gast'}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {user?.is_guest ? 'Gastmodus' : user?.email}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Abmelden"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="absolute -right-3 top-[76px] w-6 h-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}

// ─── Layout (role-aware) ──────────────────────────────────────────────────────
export default function Layout({ portalRole }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen]             = useState(false)
  const [language, setLanguage]                 = useState<'DE' | 'EN'>('DE')
  const [notifOpen, setNotifOpen]               = useState(false)

  const location = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  // Determine role: prop → localStorage fallback
  const role: 'citizen' | 'lawyer' = portalRole
    ?? ((localStorage.getItem('user_role') as 'citizen' | 'lawyer') || 'citizen')

  const isCitizen = role === 'citizen'

  const titleMap = isCitizen ? CITIZEN_TITLES : PRO_TITLES

  const getTitle = () => {
    const exact = titleMap[location.pathname]
    if (exact) return exact
    if (location.pathname.startsWith('/cases/'))    return 'Falldetails'
    if (location.pathname.startsWith('/chat/'))     return 'KI-Rechtsberatung'
    if (location.pathname.startsWith('/pro/'))      return 'Profi-Portal'
    return 'JusticAI'
  }

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    return parts.map((part, i) => ({
      label: titleMap['/' + parts.slice(0, i + 1).join('/')]
        || (part === 'new' ? 'Neu' : part === 'pro' ? 'Profi' : part),
      href: '/' + parts.slice(0, i + 1).join('/')
    }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar – desktop */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          portalRole={role}
          language={language}
          onLanguage={setLanguage}
        />
      </div>

      {/* Sidebar – mobile */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-20 lg:hidden transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          collapsed={false}
          onCollapse={() => setMobileOpen(false)}
          portalRole={role}
          language={language}
          onLanguage={setLanguage}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className={cn(
          'h-16 backdrop-blur-sm border-b border-slate-700/50 flex items-center px-4 gap-4 flex-shrink-0',
          isCitizen
            ? 'bg-slate-900/80'
            : 'bg-slate-900/90'
        )}>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm min-w-0">
            <span className="text-slate-500 hidden sm:block">JusticAI</span>
            {getBreadcrumbs().map((crumb, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight size={12} className="text-slate-600 hidden sm:block" />
                <span
                  className={cn(
                    'truncate cursor-pointer',
                    i === arr.length - 1
                      ? 'text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  )}
                  onClick={() => i < arr.length - 1 && navigate(crumb.href)}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle (header mirror) */}
            <div className="hidden md:flex items-center gap-0.5 p-0.5 bg-slate-800 rounded-lg">
              {(['DE', 'EN'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-md transition-all',
                    language === lang
                      ? isCitizen ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bell size={18} />
                <span className={cn(
                  'absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full',
                  isCitizen ? 'bg-blue-500' : 'bg-emerald-500'
                )} />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-700">
                      <span className="text-sm font-semibold text-white">Benachrichtigungen</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-slate-400 text-center py-4">Keine neuen Benachrichtigungen</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <button
              onClick={() => navigate(isCitizen ? '/settings' : '/pro/profile')}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                isCitizen
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-700'
              )}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'G'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
