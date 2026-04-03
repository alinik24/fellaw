import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, loginLoading, guestLogin, guestLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch {
      // handled in hook
    }
  }

  const handleGuest = async () => {
    try {
      await guestLogin()
      navigate('/dashboard')
    } catch {
      // handled in hook
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Scale size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Willkommen zurück</h1>
          <p className="text-slate-400 mt-1">Melden Sie sich bei fellaw an</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-Mail-Adresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="ihre@email.de"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Passwort</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Ihr Passwort"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {loginLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loginLoading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-800/50 px-3 text-slate-500">oder</span>
            </div>
          </div>

          <button
            onClick={handleGuest}
            disabled={guestLoading}
            className="btn-secondary w-full justify-center py-3"
          >
            {guestLoading ? (
              <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
            ) : null}
            Als Gast fortfahren
          </button>

          <p className="text-center text-slate-500 text-sm mt-6">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
