import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [language, setLanguage] = useState('de')
  const { register, registerLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({ email, password, full_name: fullName, preferred_language: language })
      navigate('/dashboard')
    } catch {
      // handled in hook
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Scale size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Konto erstellen</h1>
          <p className="text-slate-400 mt-1">Starten Sie mit fellaw</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vollständiger Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Max Mustermann"
              />
            </div>

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
                  placeholder="Mindestens 8 Zeichen"
                  required
                  minLength={8}
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bevorzugte Sprache</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={registerLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {registerLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {registerLoading ? 'Wird erstellt...' : 'Konto erstellen'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Bereits registriert?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Anmelden
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
