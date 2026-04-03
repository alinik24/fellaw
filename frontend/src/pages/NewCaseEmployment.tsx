import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Upload,
  Info,
  Check,
  AlertCircle
} from 'lucide-react'

const NewCaseEmployment = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Basic Info
    employmentType: '',
    employer: '',
    position: '',
    employmentStartDate: '',
    employmentEndDate: '',
    stillEmployed: 'yes',

    // Issue Type
    issueType: '',
    issueDescription: '',
    issueDate: '',

    // Termination Details (if applicable)
    terminationType: '',
    terminationDate: '',
    terminationReason: '',
    noticePeriod: '',
    severancePay: '',

    // Discrimination/Harassment (if applicable)
    discriminationType: [] as string[],
    harassmentDetails: '',
    witnesses: '',

    // Wages/Hours
    salary: '',
    unpaidWages: '',
    unpaidWagesAmount: '',
    overtime: '',
    overtimeHours: '',

    // Documents
    hasContract: '',
    hasPayslips: '',
    hasTerminationLetter: '',

    // Desired Outcome
    desiredOutcome: [] as string[]
  })

  const employmentIssues = [
    { value: 'termination', label: 'Kündigung / Entlassung', labelEn: 'Termination / Dismissal' },
    { value: 'discrimination', label: 'Diskriminierung', labelEn: 'Discrimination' },
    { value: 'harassment', label: 'Mobbing / Belästigung', labelEn: 'Harassment / Bullying' },
    { value: 'wages', label: 'Lohn / Gehalt', labelEn: 'Wages / Salary' },
    { value: 'hours', label: 'Arbeitszeiten / Überstunden', labelEn: 'Working Hours / Overtime' },
    { value: 'contract', label: 'Vertragsprobleme', labelEn: 'Contract Issues' },
    { value: 'severance', label: 'Abfindung', labelEn: 'Severance Pay' },
    { value: 'maternity', label: 'Mutterschutz / Elternzeit', labelEn: 'Maternity / Parental Leave' }
  ]

  const discriminationTypes = [
    { value: 'age', label: 'Alter' },
    { value: 'gender', label: 'Geschlecht' },
    { value: 'race', label: 'Ethnische Herkunft' },
    { value: 'religion', label: 'Religion' },
    { value: 'disability', label: 'Behinderung' },
    { value: 'pregnancy', label: 'Schwangerschaft' },
    { value: 'sexual-orientation', label: 'Sexuelle Orientierung' }
  ]

  const desiredOutcomes = [
    { value: 'reinstatement', label: 'Wiedereinstellung' },
    { value: 'severance', label: 'Abfindung' },
    { value: 'unpaid-wages', label: 'Ausstehende Gehälter' },
    { value: 'damages', label: 'Schadensersatz' },
    { value: 'reference', label: 'Arbeitszeugnis' },
    { value: 'settlement', label: 'Vergleich' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit to API
    console.log('Employment case data:', formData)
    navigate('/cases')
  }

  const nextStep = () => setStep(Math.min(step + 1, 4))
  const prevStep = () => setStep(Math.max(step - 1, 1))

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            s < step ? 'bg-green-600 text-white' :
            s === step ? 'bg-blue-600 text-white' :
            'bg-slate-700 text-slate-400'
          }`}>
            {s < step ? <Check className="h-5 w-5" /> : s}
          </div>
          {s < 4 && (
            <div className={`flex-1 h-1 mx-2 ${
              s < step ? 'bg-green-600' : 'bg-slate-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          to="/cases/new"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Auswahl
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Arbeitsrecht Fall</h1>
              <p className="text-slate-400">Employment Law Case</p>
            </div>
          </div>
        </motion.div>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Employment Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Beschäftigungsdetails</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Art der Beschäftigung *
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="permanent">Unbefristet</option>
                      <option value="fixed-term">Befristet</option>
                      <option value="probation">Probezeit</option>
                      <option value="part-time">Teilzeit</option>
                      <option value="temporary">Zeitarbeit</option>
                      <option value="freelance">Freiberuflich</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Arbeitgeber *
                    </label>
                    <input
                      type="text"
                      value={formData.employer}
                      onChange={(e) => setFormData({...formData, employer: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Firmenname"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Position / Berufsbezeichnung *
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="z.B. Software-Entwickler, Verkäufer"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Beginn der Beschäftigung *
                      </label>
                      <input
                        type="date"
                        value={formData.employmentStartDate}
                        onChange={(e) => setFormData({...formData, employmentStartDate: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Noch beschäftigt?
                      </label>
                      <select
                        value={formData.stillEmployed}
                        onChange={(e) => setFormData({...formData, stillEmployed: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="yes">Ja</option>
                        <option value="no">Nein</option>
                      </select>
                    </div>
                  </div>

                  {formData.stillEmployed === 'no' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ende der Beschäftigung
                      </label>
                      <input
                        type="date"
                        value={formData.employmentEndDate}
                        onChange={(e) => setFormData({...formData, employmentEndDate: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Monatliches Bruttogehalt (€)
                    </label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="z.B. 3500"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Info Box */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <strong>Wichtig:</strong> Im deutschen Arbeitsrecht gelten besondere Kündigungsfristen
                    und Kündigungsschutzbestimmungen (KSchG). Bei Kündigungen in Betrieben mit mehr als 10
                    Arbeitnehmern kann Kündigungsschutzklage erhoben werden.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Issue Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Problembeschreibung</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Art des Problems *
                    </label>
                    <select
                      value={formData.issueType}
                      onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Bitte wählen...</option>
                      {employmentIssues.map(issue => (
                        <option key={issue.value} value={issue.value}>
                          {issue.label} / {issue.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Wann ist das Problem aufgetreten? *
                    </label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Detaillierte Beschreibung *
                    </label>
                    <textarea
                      value={formData.issueDescription}
                      onChange={(e) => setFormData({...formData, issueDescription: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Beschreiben Sie die Situation so detailliert wie möglich..."
                      required
                    />
                    <p className="text-sm text-slate-400 mt-2">
                      Tipp: Nennen Sie Datum, Ort, beteiligte Personen und konkrete Vorfälle
                    </p>
                  </div>

                  {/* Conditional fields based on issue type */}
                  {formData.issueType === 'termination' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Art der Kündigung
                        </label>
                        <select
                          value={formData.terminationType}
                          onChange={(e) => setFormData({...formData, terminationType: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Bitte wählen...</option>
                          <option value="ordinary">Ordentliche Kündigung</option>
                          <option value="extraordinary">Außerordentliche Kündigung (fristlos)</option>
                          <option value="mutual">Aufhebungsvertrag</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Kündigungsgrund (falls angegeben)
                        </label>
                        <input
                          type="text"
                          value={formData.terminationReason}
                          onChange={(e) => setFormData({...formData, terminationReason: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          placeholder="z.B. betriebsbedingt, verhaltensbedingt"
                        />
                      </div>
                    </>
                  )}

                  {formData.issueType === 'discrimination' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Art der Diskriminierung (mehrfach möglich)
                      </label>
                      <div className="space-y-2">
                        {discriminationTypes.map(type => (
                          <label key={type.value} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={formData.discriminationType.includes(type.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, discriminationType: [...formData.discriminationType, type.value]})
                                } else {
                                  setFormData({...formData, discriminationType: formData.discriminationType.filter(t => t !== type.value)})
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-slate-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-300">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AGG Reference */}
              {formData.issueType === 'discrimination' && (
                <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-purple-200">
                      <strong>Rechtlicher Hinweis:</strong> Diskriminierung am Arbeitsplatz verstößt gegen
                      das Allgemeine Gleichbehandlungsgesetz (AGG). Sie haben Anspruch auf Schadensersatz
                      und Entschädigung. Frist: 2 Monate nach Kenntnis.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Evidence & Documents */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Beweise & Dokumente</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Welche Dokumente haben Sie?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.hasContract === 'yes'}
                          onChange={(e) => setFormData({...formData, hasContract: e.target.checked ? 'yes' : 'no'})}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-slate-300">Arbeitsvertrag</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.hasPayslips === 'yes'}
                          onChange={(e) => setFormData({...formData, hasPayslips: e.target.checked ? 'yes' : 'no'})}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-slate-300">Gehaltsabrechnungen</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.hasTerminationLetter === 'yes'}
                          onChange={(e) => setFormData({...formData, hasTerminationLetter: e.target.checked ? 'yes' : 'no'})}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-slate-300">Kündigungsschreiben</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Zeugen
                    </label>
                    <textarea
                      value={formData.witnesses}
                      onChange={(e) => setFormData({...formData, witnesses: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Namen und Kontaktdaten von Zeugen (falls vorhanden)"
                    />
                  </div>

                  <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">Dokumente hochladen</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Arbeitsvertrag, Kündigungsschreiben, E-Mails, etc.
                    </p>
                    <button
                      type="button"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Dateien auswählen
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                      PDF, DOCX, JPG, PNG (max. 10 MB pro Datei)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Desired Outcome */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Gewünschtes Ergebnis</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Was möchten Sie erreichen? (mehrfach möglich)
                    </label>
                    <div className="space-y-2">
                      {desiredOutcomes.map(outcome => (
                        <label key={outcome.value} className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={formData.desiredOutcome.includes(outcome.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, desiredOutcome: [...formData.desiredOutcome, outcome.value]})
                              } else {
                                setFormData({...formData, desiredOutcome: formData.desiredOutcome.filter(o => o !== outcome.value)})
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-600"
                          />
                          <span className="text-slate-300 font-medium">{outcome.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-200">
                    <strong>Bereit zur Einreichung:</strong> Ihre Angaben sind vollständig.
                    Nach dem Absenden können Sie mit einem Anwalt sprechen oder unsere
                    KI-gestützte Analyse nutzen.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors ml-auto"
              >
                Weiter
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors ml-auto"
              >
                <Check className="h-5 w-5" />
                Fall erstellen
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCaseEmployment
