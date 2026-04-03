import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  BookOpen,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Badge
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  label: string
  labelDe: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [language, setLanguage] = useState<'DE' | 'EN'>('DE')

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      labelDe: 'Übersicht',
      href: '/dashboard',
      icon: <LayoutDashboard size={18} />
    },
    {
      label: 'My Cases',
      labelDe: 'Meine Fälle',
      href: '/cases',
      icon: <FolderOpen size={18} />
    },
    {
      label: 'Legal Chat',
      labelDe: 'Rechts-Chat',
      href: '/chat',
      icon: <MessageSquare size={18} />
    },
    {
      label: 'Law Library',
      labelDe: 'Rechtsbibliothek',
      href: '/laws',
      icon: <BookOpen size={18} />
    },
    {
      label: 'Documents',
      labelDe: 'Dokumente',
      href: '/documents',
      icon: <Upload size={18} />
    },
    {
      label: 'Settings',
      labelDe: 'Einstellungen',
      href: '/settings',
      icon: <Settings size={18} />
    }
  ]

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
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-bold text-white whitespace-nowrap">fellaw</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <span className={cn('flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white')}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {language === 'DE' ? item.labelDe : item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {item.badge}
                </span>
              )}
              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {language === 'DE' ? item.labelDe : item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Language toggle */}
      <div className="px-2 py-2 border-t border-slate-700/50">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg mb-2"
            >
              <button
                onClick={() => setLanguage('DE')}
                className={cn(
                  'flex-1 text-xs font-medium py-1 rounded-md transition-all',
                  language === 'DE'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                DE
              </button>
              <button
                onClick={() => setLanguage('EN')}
                className={cn(
                  'flex-1 text-xs font-medium py-1 rounded-md transition-all',
                  language === 'EN'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                EN
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User info */}
        <div className={cn('flex items-center gap-2 px-1 py-2 rounded-lg', !collapsed && 'hover:bg-slate-800 cursor-pointer')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
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
                  {user?.is_guest ? '🔒 Gastmodus' : user?.email}
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
