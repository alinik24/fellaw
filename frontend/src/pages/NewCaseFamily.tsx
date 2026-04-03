import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Users,
  Baby,
  Home,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'

const NewCaseFamily = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Family Situation
    maritalStatus: '',
    marriageDate: '',
    separationDate: '',
    divorceFilingDate: '',
    spouseFirstName: '',
    spouseLastName: '',
    spouseEmail: '',
    spousePhone: '',
    hasChildren: '',
    numberOfChildren: '',

    // Step 2: Issue Details
    issueType: '',
    issueDescription: '',
    urgencyLevel: '',
    custodyType: '',
    currentCustodyArrangement: '',
    desiredCustodyArrangement: '',
    supportType: [] as string[],
    monthlyIncome: '',
    spouseMonthlyIncome: '',
    sharedAssets: '',
    sharedDebts: '',
    domesticViolence: '',
    violenceDescription: '',
    protectionOrderExists: '',

    // Step 3: Children Information
    children: [] as Array<{
      firstName: string
      lastName: string
      dateOfBirth: string
      currentResidence: string
      specialNeeds: string
      schoolInfo: string
    }>,

    // Step 4: Evidence & Documents
    documents: [] as File[],
    witnesses: [] as Array<{
      name: string
      relationship: string
      contact: string
    }>,
    previousCourtCases: '',
    mediationAttempted: '',

    // Step 5: Desired Outcome
    desiredOutcome: [] as string[],
    additionalNotes: ''
  })

  const totalSteps = 5

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [
        ...prev.children,
        {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          currentResidence: '',
          specialNeeds: '',
          schoolInfo: ''
        }
      ]
    }))
  }

  const updateChild = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    }))
  }

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }))
  }

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        { name: '', relationship: '', contact: '' }
      ]
    }))
  }

  const updateWitness = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.map((witness, i) =>
        i === index ? { ...witness, [field]: value } : witness
      )
    }))
  }

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(e.target.files!)]
      }))
    }
  }

  const toggleArrayField = (field: 'supportType' | 'desiredOutcome', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    // TODO: Submit to backend API
    console.log('Submitting family law case:', formData)
    navigate('/cases')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.maritalStatus && formData.hasChildren
      case 2:
        return formData.issueType && formData.issueDescription
      case 3:
        return formData.hasChildren === 'no' || formData.children.length > 0
      case 4:
        return true
      case 5:
        return formData.desiredOutcome.length > 0
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/cases/new"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Rechtsgebietsauswahl
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-600/20 rounded-lg">
              <Heart className="h-8 w-8 text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Neuer Fall: Familienrecht</h1>
              <p className="text-slate-400 mt-1">Family Law Case Intake</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">
              Schritt {currentStep} von {totalSteps}
            </span>
            <span className="text-sm font-medium text-pink-400">
              {Math.round((currentStep / totalSteps) * 100)}% abgeschlossen
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-pink-600 to-pink-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span className={currentStep >= 1 ? 'text-pink-400' : ''}>Familiensituation</span>
            <span className={currentStep >= 2 ? 'text-pink-400' : ''}>Anliegen</span>
            <span className={currentStep >= 3 ? 'text-pink-400' : ''}>Kinder</span>
            <span className={currentStep >= 4 ? 'text-pink-400' : ''}>Beweise</span>
            <span className={currentStep >= 5 ? 'text-pink-400' : ''}>Ziele</span>
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 mb-8"
        >
          {/* Step 1: Family Situation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Familiensituation</h2>
                <p className="text-slate-400">Grundlegende Informationen über Ihre Familie</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Familienstand <span className="text-pink-400">*</span>
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => updateFormData('maritalStatus', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="married">Verheiratet</option>
                    <option value="separated">Getrennt lebend</option>
                    <option value="divorced">Geschieden</option>
                    <option value="widowed">Verwitwet</option>
                    <option value="partnership">Eingetragene Lebenspartnerschaft</option>
                    <option value="unmarried">Unverheiratet mit Kind(ern)</option>
                  </select>
                </div>

                {(formData.maritalStatus === 'married' || formData.maritalStatus === 'separated' || formData.maritalStatus === 'divorced' || formData.maritalStatus === 'partnership') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Datum der Eheschließung
                    </label>
                    <input
                      type="date"
                      value={formData.marriageDate}
                      onChange={(e) => updateFormData('marriageDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                    />
                  </div>
                )}

                {(formData.maritalStatus === 'separated' || formData.maritalStatus === 'divorced') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Datum der Trennung
                    </label>
                    <input
                      type="date"
                      value={formData.separationDate}
                      onChange={(e) => updateFormData('separationDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                    />
                  </div>
                )}

                {formData.maritalStatus === 'divorced' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Datum der Scheidungseinreichung
                    </label>
                    <input
                      type="date"
                      value={formData.divorceFilingDate}
                      onChange={(e) => updateFormData('divorceFilingDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Spouse Information */}
              {formData.maritalStatus && formData.maritalStatus !== 'unmarried' && (
                <>
                  <div className="pt-6 border-t border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Informationen zum (Ehe-)Partner</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Vorname
                        </label>
                        <input
                          type="text"
                          value={formData.spouseFirstName}
                          onChange={(e) => updateFormData('spouseFirstName', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                          placeholder="Max"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Nachname
                        </label>
                        <input
                          type="text"
                          value={formData.spouseLastName}
                          onChange={(e) => updateFormData('spouseLastName', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                          placeholder="Mustermann"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          E-Mail
                        </label>
                        <input
                          type="email"
                          value={formData.spouseEmail}
                          onChange={(e) => updateFormData('spouseEmail', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                          placeholder="max.mustermann@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          value={formData.spousePhone}
                          onChange={(e) => updateFormData('spousePhone', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                          placeholder="+49 123 456789"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Children */}
              <div className="pt-6 border-t border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Haben Sie gemeinsame Kinder? <span className="text-pink-400">*</span>
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateFormData('hasChildren', 'yes')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.hasChildren === 'yes'
                        ? 'bg-pink-600/20 border-pink-600 text-pink-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => updateFormData('hasChildren', 'no')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.hasChildren === 'no'
                        ? 'bg-pink-600/20 border-pink-600 text-pink-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Nein
                  </button>
                </div>
              </div>

              {formData.hasChildren === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Anzahl der gemeinsamen Kinder
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfChildren}
                    onChange={(e) => updateFormData('numberOfChildren', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                    placeholder="z.B. 2"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Issue Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Ihr Anliegen</h2>
                <p className="text-slate-400">Beschreiben Sie Ihr familienrechtliches Problem</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Art des Anliegens <span className="text-pink-400">*</span>
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => updateFormData('issueType', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="divorce">Scheidung (Divorce)</option>
                  <option value="custody">Sorgerecht (Child Custody)</option>
                  <option value="child-support">Kindesunterhalt (Child Support)</option>
                  <option value="spousal-support">Ehegattenunterhalt (Spousal Support)</option>
                  <option value="asset-division">Vermögensaufteilung (Asset Division)</option>
                  <option value="visitation">Umgangsrecht (Visitation Rights)</option>
                  <option value="adoption">Adoption</option>
                  <option value="paternity">Vaterschaftsanerkennung (Paternity)</option>
                  <option value="domestic-violence">Häusliche Gewalt (Domestic Violence)</option>
                  <option value="other">Sonstiges (Other)</option>
                </select>
              </div>

              {/* Legal Info Box for Divorce */}
              {formData.issueType === 'divorce' && (
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200/80">
                      <strong className="text-blue-200">Rechtliche Information:</strong> Nach § 1565 BGB kann eine Ehe geschieden werden, wenn sie gescheitert ist. Eine Ehe ist gescheitert, wenn die Lebensgemeinschaft nicht mehr besteht und nicht erwartet werden kann, dass die Ehegatten sie wiederherstellen. In der Regel ist ein Trennungsjahr erforderlich.
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Info Box for Custody */}
              {formData.issueType === 'custody' && (
                <>
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-200/80">
                        <strong className="text-blue-200">Rechtliche Information:</strong> Nach § 1626 BGB haben Eltern das Recht und die Pflicht, für das minderjährige Kind zu sorgen (elterliche Sorge). Das Kindeswohl steht gemäß § 1697a BGB bei allen Entscheidungen im Vordergrund.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gewünschte Sorgerechtregelung
                    </label>
                    <select
                      value={formData.custodyType}
                      onChange={(e) => updateFormData('custodyType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="sole">Alleiniges Sorgerecht (Sole Custody)</option>
                      <option value="joint">Gemeinsames Sorgerecht (Joint Custody)</option>
                      <option value="modify">Änderung bestehender Regelung (Modify Existing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Aktuelle Sorgerechtssituation
                    </label>
                    <textarea
                      value={formData.currentCustodyArrangement}
                      onChange={(e) => updateFormData('currentCustodyArrangement', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                      placeholder="Beschreiben Sie die aktuelle Situation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gewünschte Regelung
                    </label>
                    <textarea
                      value={formData.desiredCustodyArrangement}
                      onChange={(e) => updateFormData('desiredCustodyArrangement', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                      placeholder="Was ist Ihr Wunsch?"
                    />
                  </div>
                </>
              )}

              {/* Support Type Selection */}
              {(formData.issueType === 'child-support' || formData.issueType === 'spousal-support') && (
                <>
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-200/80">
                        <strong className="text-blue-200">Rechtliche Information:</strong> Unterhaltsansprüche richten sich nach §§ 1601 ff. BGB (Verwandtenunterhalt) und §§ 1569 ff. BGB (nachehelicher Unterhalt). Die Höhe bemisst sich nach der Düsseldorfer Tabelle.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ihr monatliches Nettoeinkommen
                      </label>
                      <input
                        type="text"
                        value={formData.monthlyIncome}
                        onChange={(e) => updateFormData('monthlyIncome', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                        placeholder="z.B. 2.500 €"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Monatliches Nettoeinkommen des Partners
                      </label>
                      <input
                        type="text"
                        value={formData.spouseMonthlyIncome}
                        onChange={(e) => updateFormData('spouseMonthlyIncome', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                        placeholder="z.B. 3.000 €"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Domestic Violence */}
              {formData.issueType === 'domestic-violence' && (
                <>
                  <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-200/80">
                        <strong className="text-red-200">Wichtig:</strong> Bei akuter Gefahr rufen Sie sofort die Polizei (110). Das Gewaltschutzgesetz (GewSchG) bietet Ihnen umfassenden Schutz. Wir helfen Ihnen bei der Beantragung einer einstweiligen Anordnung.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Existiert bereits eine Schutzanordnung?
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => updateFormData('protectionOrderExists', 'yes')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.protectionOrderExists === 'yes'
                            ? 'bg-pink-600/20 border-pink-600 text-pink-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => updateFormData('protectionOrderExists', 'no')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.protectionOrderExists === 'no'
                            ? 'bg-pink-600/20 border-pink-600 text-pink-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Nein
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Asset Division */}
              {formData.issueType === 'asset-division' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gemeinsame Vermögenswerte (geschätzt)
                    </label>
                    <input
                      type="text"
                      value={formData.sharedAssets}
                      onChange={(e) => updateFormData('sharedAssets', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                      placeholder="z.B. 250.000 € (Haus, Auto, Ersparnisse)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gemeinsame Schulden
                    </label>
                    <input
                      type="text"
                      value={formData.sharedDebts}
                      onChange={(e) => updateFormData('sharedDebts', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                      placeholder="z.B. 150.000 € Hypothek"
                    />
                  </div>
                </div>
              )}

              {/* General Issue Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Detaillierte Beschreibung Ihres Anliegens <span className="text-pink-400">*</span>
                </label>
                <textarea
                  value={formData.issueDescription}
                  onChange={(e) => updateFormData('issueDescription', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                  placeholder="Bitte beschreiben Sie Ihre Situation so detailliert wie möglich. Was ist passiert? Wann begann das Problem? Was sind die Hauptkonfliktpunkte?"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Je detaillierter Ihre Beschreibung, desto besser können wir Ihnen helfen.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dringlichkeit
                </label>
                <select
                  value={formData.urgencyLevel}
                  onChange={(e) => updateFormData('urgencyLevel', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="immediate">Sofort (Immediate)</option>
                  <option value="urgent">Dringend - innerhalb 1 Woche</option>
                  <option value="normal">Normal - innerhalb 1 Monat</option>
                  <option value="planning">Planung - mehr als 1 Monat</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Children Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Informationen zu den Kindern</h2>
                <p className="text-slate-400">Details zu den betroffenen Kindern</p>
              </div>

              {formData.hasChildren === 'no' ? (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8 text-center">
                  <Baby className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    Sie haben angegeben, dass keine Kinder betroffen sind.
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Klicken Sie auf "Weiter", um fortzufahren.
                  </p>
                </div>
              ) : (
                <>
                  {formData.children.map((child, index) => (
                    <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Kind {index + 1}</h3>
                        {formData.children.length > 1 && (
                          <button
                            onClick={() => removeChild(index)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            Entfernen
                          </button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Vorname
                          </label>
                          <input
                            type="text"
                            value={child.firstName}
                            onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                            placeholder="Vorname"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nachname
                          </label>
                          <input
                            type="text"
                            value={child.lastName}
                            onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                            placeholder="Nachname"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Geburtsdatum
                          </label>
                          <input
                            type="date"
                            value={child.dateOfBirth}
                            onChange={(e) => updateChild(index, 'dateOfBirth', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Aktueller Wohnort
                          </label>
                          <input
                            type="text"
                            value={child.currentResidence}
                            onChange={(e) => updateChild(index, 'currentResidence', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                            placeholder="Bei wem lebt das Kind aktuell?"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Schule / Kindergarten
                          </label>
                          <input
                            type="text"
                            value={child.schoolInfo}
                            onChange={(e) => updateChild(index, 'schoolInfo', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                            placeholder="Name der Einrichtung"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Besondere Bedürfnisse / Gesundheit
                          </label>
                          <textarea
                            value={child.specialNeeds}
                            onChange={(e) => updateChild(index, 'specialNeeds', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                            placeholder="z.B. Allergien, chronische Erkrankungen, besondere Förderung"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addChild}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-pink-600 hover:text-pink-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Baby className="h-5 w-5" />
                    Weiteres Kind hinzufügen
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 4: Evidence & Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Beweise und Dokumente</h2>
                <p className="text-slate-400">Laden Sie relevante Unterlagen hoch</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dokumente hochladen
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-pink-600 transition-colors">
                  <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">
                    Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    PDF, DOCX, JPG, PNG (max. 10 MB pro Datei)
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Dateien auswählen
                  </label>
                </div>
                {formData.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-slate-300">
                      Hochgeladene Dateien ({formData.documents.length}):
                    </p>
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg">
                        <FileText className="h-5 w-5 text-pink-400" />
                        <span className="text-sm text-slate-300 flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Relevante Dokumente: Heiratsurkunde, Geburtsurkunden, Einkommensnachweise,
                  Mietverträge, Bescheide, vorherige Gerichtsurteile, E-Mails, etc.
                </p>
              </div>

              {/* Witnesses */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Zeugen</h3>
                {formData.witnesses.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Gibt es Personen, die Ihre Angaben bestätigen können?
                  </p>
                ) : (
                  formData.witnesses.map((witness, index) => (
                    <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Zeuge {index + 1}</h4>
                        <button
                          onClick={() => removeWitness(index)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Entfernen
                        </button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={witness.name}
                          onChange={(e) => updateWitness(index, 'name', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-pink-500 outline-none"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={witness.relationship}
                          onChange={(e) => updateWitness(index, 'relationship', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-pink-500 outline-none"
                          placeholder="Beziehung (z.B. Freund, Kollege)"
                        />
                        <input
                          type="text"
                          value={witness.contact}
                          onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-pink-500 outline-none"
                          placeholder="Kontakt"
                        />
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={addWitness}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-pink-600 hover:text-pink-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="h-5 w-5" />
                  Zeuge hinzufügen
                </button>
              </div>

              {/* Previous Court Cases */}
              <div className="pt-6 border-t border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gab es bereits Gerichtsverfahren in dieser Angelegenheit?
                </label>
                <textarea
                  value={formData.previousCourtCases}
                  onChange={(e) => updateFormData('previousCourtCases', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                  placeholder="Beschreiben Sie frühere Verfahren, Aktenzeichen, Urteile..."
                />
              </div>

              {/* Mediation Attempt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Haben Sie versucht, das Problem außergerichtlich zu lösen?
                </label>
                <textarea
                  value={formData.mediationAttempted}
                  onChange={(e) => updateFormData('mediationAttempted', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                  placeholder="z.B. Mediation, Gespräche, Anwaltsschreiben..."
                />
              </div>
            </div>
          )}

          {/* Step 5: Desired Outcome */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Ihre Ziele</h2>
                <p className="text-slate-400">Was möchten Sie erreichen?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Gewünschte Ergebnisse (Mehrfachauswahl möglich) <span className="text-pink-400">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'divorce-decree', label: 'Scheidungsurteil erwirken' },
                    { value: 'custody-award', label: 'Sorgerecht erhalten' },
                    { value: 'child-support', label: 'Kindesunterhalt regeln' },
                    { value: 'spousal-support', label: 'Ehegattenunterhalt regeln' },
                    { value: 'asset-division', label: 'Vermögensaufteilung' },
                    { value: 'visitation-rights', label: 'Umgangsrecht festlegen' },
                    { value: 'protection-order', label: 'Schutzanordnung erwirken' },
                    { value: 'mediation', label: 'Einvernehmliche Lösung finden' },
                    { value: 'modify-agreement', label: 'Bestehende Vereinbarung ändern' },
                    { value: 'enforcement', label: 'Durchsetzung bestehender Regelung' }
                  ].map((outcome) => (
                    <button
                      key={outcome.value}
                      onClick={() => toggleArrayField('desiredOutcome', outcome.value)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        formData.desiredOutcome.includes(outcome.value)
                          ? 'bg-pink-600/20 border-pink-600 text-pink-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.desiredOutcome.includes(outcome.value)
                            ? 'bg-pink-600 border-pink-600'
                            : 'border-slate-600'
                        }`}>
                          {formData.desiredOutcome.includes(outcome.value) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm">{outcome.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Zusätzliche Anmerkungen
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
                  placeholder="Gibt es noch etwas, das wir wissen sollten? Besondere Umstände, Zeitdruck, spezifische Wünsche?"
                />
              </div>

              {/* Summary Preview */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Zusammenfassung</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Familienstand: </span>
                      <span className="text-white font-medium">
                        {formData.maritalStatus === 'married' && 'Verheiratet'}
                        {formData.maritalStatus === 'separated' && 'Getrennt lebend'}
                        {formData.maritalStatus === 'divorced' && 'Geschieden'}
                        {formData.maritalStatus === 'partnership' && 'Eingetragene Lebenspartnerschaft'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Anliegen: </span>
                      <span className="text-white font-medium">{formData.issueType || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Baby className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Kinder: </span>
                      <span className="text-white font-medium">
                        {formData.hasChildren === 'yes' ? `${formData.children.length} Kind(er)` : 'Keine'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Dokumente: </span>
                      <span className="text-white font-medium">{formData.documents.length} Datei(en)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                canProceed()
                  ? 'bg-pink-600 text-white hover:bg-pink-500'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Weiter
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${
                canProceed()
                  ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-500 hover:to-pink-400'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 h-5" />
              Fall einreichen
            </button>
          )}
        </div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-200/80">
              <strong className="text-yellow-200">Hinweis:</strong> Alle Angaben werden vertraulich behandelt.
              Diese Informationen helfen uns, Sie bestmöglich zu beraten und an den richtigen Anwalt zu vermitteln.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NewCaseFamily
