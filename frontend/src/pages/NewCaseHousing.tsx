import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Home,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  Euro,
  MapPin,
  Users
} from 'lucide-react'

const NewCaseHousing = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Rental Details
    propertyAddress: '',
    propertyCity: '',
    propertyType: '',
    roomCount: '',
    squareMeters: '',
    landlordName: '',
    landlordAddress: '',
    landlordEmail: '',
    landlordPhone: '',
    leaseStartDate: '',
    leaseEndDate: '',
    leaseType: '',
    monthlyRent: '',
    additionalCosts: '',
    securityDeposit: '',

    // Step 2: Issue Details
    issueType: '',
    issueDescription: '',
    discoveryDate: '',
    defectType: [] as string[],
    notificationDate: '',
    landlordResponse: '',
    rentReductionRequested: '',
    rentReductionAmount: '',

    // Termination specific
    wasTerminated: '',
    terminationDate: '',
    terminationBy: '',
    terminationReason: '',
    noticePerExpired: '',

    // Deposit specific
    depositClaimed: '',
    depositClaimDate: '',
    depositWithheld: '',
    depositWithheldAmount: '',
    depositWithheldReason: '',

    // Step 3: Evidence & Communication
    documents: [] as File[],
    communications: [] as Array<{
      date: string
      type: string
      content: string
    }>,
    witnesses: [] as Array<{
      name: string
      relationship: string
      contact: string
    }>,
    photosAvailable: '',
    expertOpinion: '',

    // Step 4: Desired Outcome
    desiredOutcome: [] as string[],
    additionalNotes: ''
  })

  const totalSteps = 4

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addCommunication = () => {
    setFormData(prev => ({
      ...prev,
      communications: [
        ...prev.communications,
        { date: '', type: '', content: '' }
      ]
    }))
  }

  const updateCommunication = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      communications: prev.communications.map((comm, i) =>
        i === index ? { ...comm, [field]: value } : comm
      )
    }))
  }

  const removeCommunication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      communications: prev.communications.filter((_, i) => i !== index)
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

  const toggleArrayField = (field: 'defectType' | 'desiredOutcome', value: string) => {
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
    console.log('Submitting housing law case:', formData)
    navigate('/cases')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyAddress && formData.landlordName && formData.monthlyRent
      case 2:
        return formData.issueType && formData.issueDescription
      case 3:
        return true
      case 4:
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
            <div className="p-3 bg-teal-600/20 rounded-lg">
              <Home className="h-8 w-8 text-teal-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Neuer Fall: Mietrecht</h1>
              <p className="text-slate-400 mt-1">Housing / Tenancy Law Case Intake</p>
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
            <span className="text-sm font-medium text-teal-400">
              {Math.round((currentStep / totalSteps) * 100)}% abgeschlossen
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-teal-600 to-teal-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span className={currentStep >= 1 ? 'text-teal-400' : ''}>Mietverhältnis</span>
            <span className={currentStep >= 2 ? 'text-teal-400' : ''}>Problem</span>
            <span className={currentStep >= 3 ? 'text-teal-400' : ''}>Beweise</span>
            <span className={currentStep >= 4 ? 'text-teal-400' : ''}>Ziele</span>
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
          {/* Step 1: Rental Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Mietverhältnis Details</h2>
                <p className="text-slate-400">Informationen über Ihre Mietwohnung</p>
              </div>

              {/* Property Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Objektinformationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse der Mietwohnung <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.propertyAddress}
                      onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="Straße, Hausnummer, PLZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Stadt
                    </label>
                    <input
                      type="text"
                      value={formData.propertyCity}
                      onChange={(e) => updateFormData('propertyCity', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="z.B. Berlin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Art der Immobilie
                    </label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => updateFormData('propertyType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="apartment">Wohnung (Apartment)</option>
                      <option value="house">Haus (House)</option>
                      <option value="room">WG-Zimmer (Room in Shared Flat)</option>
                      <option value="studio">Studio</option>
                      <option value="commercial">Gewerbefläche (Commercial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Anzahl Zimmer
                    </label>
                    <input
                      type="text"
                      value={formData.roomCount}
                      onChange={(e) => updateFormData('roomCount', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="z.B. 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="text"
                      value={formData.squareMeters}
                      onChange={(e) => updateFormData('squareMeters', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="z.B. 65"
                    />
                  </div>
                </div>
              </div>

              {/* Landlord Information */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Vermieterinformationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name des Vermieters / Hausverwaltung <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.landlordName}
                      onChange={(e) => updateFormData('landlordName', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="Name oder Firma"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse des Vermieters
                    </label>
                    <input
                      type="text"
                      value={formData.landlordAddress}
                      onChange={(e) => updateFormData('landlordAddress', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="Straße, Nr., PLZ, Stadt"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={formData.landlordEmail}
                      onChange={(e) => updateFormData('landlordEmail', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="vermieter@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.landlordPhone}
                      onChange={(e) => updateFormData('landlordPhone', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>
              </div>

              {/* Lease Information */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Mietvertragsinformationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mietbeginn
                    </label>
                    <input
                      type="date"
                      value={formData.leaseStartDate}
                      onChange={(e) => updateFormData('leaseStartDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mietende (falls befristet)
                    </label>
                    <input
                      type="date"
                      value={formData.leaseEndDate}
                      onChange={(e) => updateFormData('leaseEndDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Art des Mietvertrags
                    </label>
                    <select
                      value={formData.leaseType}
                      onChange={(e) => updateFormData('leaseType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="unlimited">Unbefristet (Unlimited)</option>
                      <option value="fixed-term">Befristet (Fixed-Term)</option>
                      <option value="sublease">Untermietvertrag (Sublease)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Kaltmiete (€ / Monat) <span className="text-teal-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.monthlyRent}
                        onChange={(e) => updateFormData('monthlyRent', e.target.value)}
                        className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                        placeholder="850.00"
                      />
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nebenkosten (€ / Monat)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.additionalCosts}
                        onChange={(e) => updateFormData('additionalCosts', e.target.value)}
                        className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                        placeholder="150.00"
                      />
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Kaution (€)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.securityDeposit}
                        onChange={(e) => updateFormData('securityDeposit', e.target.value)}
                        className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                        placeholder="1700.00"
                      />
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Issue Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Ihr Anliegen</h2>
                <p className="text-slate-400">Was ist das Problem?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Art des Problems <span className="text-teal-400">*</span>
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => updateFormData('issueType', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="rent-reduction">Mietminderung (Rent Reduction)</option>
                  <option value="defects">Mängel/Schäden (Defects)</option>
                  <option value="termination">Kündigung (Termination)</option>
                  <option value="eviction">Räumungsklage (Eviction)</option>
                  <option value="deposit-return">Kautionsrückforderung (Deposit Return)</option>
                  <option value="rent-increase">Mieterhöhung (Rent Increase)</option>
                  <option value="operating-costs">Nebenkostenabrechnung (Operating Costs)</option>
                  <option value="noise">Lärmbelästigung (Noise)</option>
                  <option value="maintenance">Instandhaltung (Maintenance)</option>
                  <option value="sublease">Untervermietung (Sublease)</option>
                  <option value="other">Sonstiges (Other)</option>
                </select>
              </div>

              {/* Legal Info Box */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200/80">
                    <strong className="text-blue-200">Rechtliche Information:</strong> Mietrechtliche Ansprüche unterliegen verschiedenen Fristen. Bei Mängeln ist unverzügliche Anzeige erforderlich (§ 536c BGB). Kündigungsfristen richten sich nach § 573c BGB und der Mietdauer.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wann wurde das Problem entdeckt? <span className="text-teal-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.discoveryDate}
                  onChange={(e) => updateFormData('discoveryDate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                />
              </div>

              {/* Defects */}
              {(formData.issueType === 'defects' || formData.issueType === 'rent-reduction') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Art der Mängel (Mehrfachauswahl)
                    </label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { value: 'mold', label: 'Schimmel (Mold)' },
                        { value: 'heating', label: 'Heizungsprobleme (Heating Issues)' },
                        { value: 'water-damage', label: 'Wasserschaden (Water Damage)' },
                        { value: 'windows', label: 'Fensterprobleme (Window Issues)' },
                        { value: 'noise-insulation', label: 'Lärmschutz (Noise Insulation)' },
                        { value: 'pests', label: 'Schädlinge (Pests)' },
                        { value: 'plumbing', label: 'Sanitärprobleme (Plumbing)' },
                        { value: 'electrical', label: 'Elektrische Probleme (Electrical)' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => toggleArrayField('defectType', type.value)}
                          className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                            formData.defectType.includes(type.value)
                              ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              formData.defectType.includes(type.value)
                                ? 'bg-teal-600 border-teal-600'
                                : 'border-slate-600'
                            }`}>
                              {formData.defectType.includes(type.value) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm">{type.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Wann haben Sie den Vermieter informiert?
                    </label>
                    <input
                      type="date"
                      value={formData.notificationDate}
                      onChange={(e) => updateFormData('notificationDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Haben Sie eine Mietminderung geltend gemacht?
                    </label>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => updateFormData('rentReductionRequested', 'yes')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.rentReductionRequested === 'yes'
                            ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => updateFormData('rentReductionRequested', 'no')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.rentReductionRequested === 'no'
                            ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Nein
                      </button>
                    </div>

                    {formData.rentReductionRequested === 'yes' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Gewünschte Minderung (%)
                        </label>
                        <input
                          type="text"
                          value={formData.rentReductionAmount}
                          onChange={(e) => updateFormData('rentReductionAmount', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                          placeholder="z.B. 20"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Termination */}
              {(formData.issueType === 'termination' || formData.issueType === 'eviction') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Wurde gekündigt?
                    </label>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => updateFormData('wasTerminated', 'yes')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.wasTerminated === 'yes'
                            ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => updateFormData('wasTerminated', 'no')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.wasTerminated === 'no'
                            ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Nein
                      </button>
                    </div>

                    {formData.wasTerminated === 'yes' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Kündigungsdatum
                            </label>
                            <input
                              type="date"
                              value={formData.terminationDate}
                              onChange={(e) => updateFormData('terminationDate', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Gekündigt durch
                            </label>
                            <select
                              value={formData.terminationBy}
                              onChange={(e) => updateFormData('terminationBy', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                            >
                              <option value="">Bitte wählen...</option>
                              <option value="landlord">Vermieter (Landlord)</option>
                              <option value="tenant">Mieter (Tenant)</option>
                              <option value="mutual">Einvernehmlich (Mutual)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Kündigungsgrund
                          </label>
                          <textarea
                            value={formData.terminationReason}
                            onChange={(e) => updateFormData('terminationReason', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                            placeholder="Was war der angegebene Grund für die Kündigung?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Wurde die Kündigungsfrist eingehalten?
                          </label>
                          <div className="flex gap-4">
                            <button
                              onClick={() => updateFormData('noticePeriodRespected', 'yes')}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                formData.noticePeriodRespected === 'yes'
                                  ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              Ja
                            </button>
                            <button
                              onClick={() => updateFormData('noticePeriodRespected', 'no')}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                formData.noticePeriodRespected === 'no'
                                  ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              Nein
                            </button>
                            <button
                              onClick={() => updateFormData('noticePeriodRespected', 'unsure')}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                formData.noticePeriodRespected === 'unsure'
                                  ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              Unsicher
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Deposit Return */}
              {formData.issueType === 'deposit-return' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Haben Sie die Kaution zurückgefordert?
                    </label>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => updateFormData('depositClaimed', 'yes')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.depositClaimed === 'yes'
                            ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => updateFormData('depositClaimed', 'no')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.depositClaimed === 'no'
                            ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Nein
                      </button>
                    </div>

                    {formData.depositClaimed === 'yes' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Wann haben Sie die Rückforderung gestellt?
                          </label>
                          <input
                            type="date"
                            value={formData.depositClaimDate}
                            onChange={(e) => updateFormData('depositClaimDate', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Wurde die Kaution (teilweise) einbehalten?
                          </label>
                          <div className="flex gap-4 mb-4">
                            <button
                              onClick={() => updateFormData('depositWithheld', 'yes-full')}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                                formData.depositWithheld === 'yes-full'
                                  ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              Ja, vollständig
                            </button>
                            <button
                              onClick={() => updateFormData('depositWithheld', 'yes-partial')}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                                formData.depositWithheld === 'yes-partial'
                                  ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              Ja, teilweise
                            </button>
                            <button
                              onClick={() => updateFormData('depositWithheld', 'no')}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                                formData.depositWithheld === 'no'
                                  ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              Nein
                            </button>
                          </div>
                        </div>

                        {(formData.depositWithheld === 'yes-full' || formData.depositWithheld === 'yes-partial') && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Einbehaltener Betrag (€)
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={formData.depositWithheldAmount}
                                  onChange={(e) => updateFormData('depositWithheldAmount', e.target.value)}
                                  className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                                  placeholder="500.00"
                                />
                                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Begründung des Vermieters
                              </label>
                              <textarea
                                value={formData.depositWithheldReason}
                                onChange={(e) => updateFormData('depositWithheldReason', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                                placeholder="Warum wurde die Kaution einbehalten?"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* General Issue Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Detaillierte Problembeschreibung <span className="text-teal-400">*</span>
                </label>
                <textarea
                  value={formData.issueDescription}
                  onChange={(e) => updateFormData('issueDescription', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                  placeholder="Beschreiben Sie das Problem so detailliert wie möglich. Was ist passiert? Seit wann besteht das Problem? Welche Auswirkungen hat es?"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Je detaillierter Ihre Beschreibung, desto besser können wir Ihnen helfen.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reaktion des Vermieters
                </label>
                <textarea
                  value={formData.landlordResponse}
                  onChange={(e) => updateFormData('landlordResponse', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                  placeholder="Wie hat der Vermieter auf Ihre Mitteilung reagiert?"
                />
              </div>
            </div>
          )}

          {/* Step 3: Evidence & Communication */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Beweise und Kommunikation</h2>
                <p className="text-slate-400">Dokumentation des Sachverhalts</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dokumente hochladen
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-teal-600 transition-colors">
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium cursor-pointer transition-colors"
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
                        <FileText className="h-5 w-5 text-teal-400" />
                        <span className="text-sm text-slate-300 flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Wichtige Dokumente: Mietvertrag, Mängelanzeige, Kündigungsschreiben,
                  Nebenkostenabrechnung, Fotos von Mängeln, Übergabeprotokoll, Schriftverkehr
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fotos der Mängel vorhanden?
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateFormData('photosAvailable', 'yes')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.photosAvailable === 'yes'
                          ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('photosAvailable', 'no')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.photosAvailable === 'no'
                          ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sachverständigengutachten vorhanden?
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateFormData('expertOpinion', 'yes')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.expertOpinion === 'yes'
                          ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('expertOpinion', 'no')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.expertOpinion === 'no'
                          ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>
              </div>

              {/* Communication History */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Kommunikationsverlauf mit dem Vermieter</h3>
                {formData.communications.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Dokumentieren Sie Ihre Kommunikation mit dem Vermieter
                  </p>
                ) : (
                  formData.communications.map((comm, index) => (
                    <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Kontakt {index + 1}</h4>
                        <button
                          onClick={() => removeCommunication(index)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Entfernen
                        </button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3 mb-3">
                        <input
                          type="date"
                          value={comm.date}
                          onChange={(e) => updateCommunication(index, 'date', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 outline-none"
                        />
                        <select
                          value={comm.type}
                          onChange={(e) => updateCommunication(index, 'type', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 outline-none"
                        >
                          <option value="">Typ...</option>
                          <option value="email">E-Mail</option>
                          <option value="letter">Brief (Einschreiben)</option>
                          <option value="phone">Telefon</option>
                          <option value="in-person">Persönlich</option>
                        </select>
                      </div>
                      <textarea
                        value={comm.content}
                        onChange={(e) => updateCommunication(index, 'content', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 outline-none resize-none"
                        placeholder="Zusammenfassung der Kommunikation..."
                      />
                    </div>
                  ))
                )}
                <button
                  onClick={addCommunication}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-teal-600 hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Kontakt hinzufügen
                </button>
              </div>

              {/* Witnesses */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Zeugen (z.B. Nachbarn, Handwerker)</h3>
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
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 outline-none"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={witness.relationship}
                          onChange={(e) => updateWitness(index, 'relationship', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 outline-none"
                          placeholder="Beziehung (z.B. Nachbar)"
                        />
                        <input
                          type="text"
                          value={witness.contact}
                          onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 outline-none"
                          placeholder="Kontakt"
                        />
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={addWitness}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-teal-600 hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="h-5 w-5" />
                  Zeuge hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Desired Outcome */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Ihre Ziele</h2>
                <p className="text-slate-400">Was möchten Sie erreichen?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Gewünschte Ergebnisse (Mehrfachauswahl möglich) <span className="text-teal-400">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'defect-repair', label: 'Mängelbeseitigung (Repair Defects)' },
                    { value: 'rent-reduction', label: 'Mietminderung (Rent Reduction)' },
                    { value: 'deposit-return', label: 'Kautionsrückgabe (Deposit Return)' },
                    { value: 'termination-defense', label: 'Kündigungsschutz (Termination Defense)' },
                    { value: 'terminate-lease', label: 'Mietvertrag beenden (Terminate Lease)' },
                    { value: 'cost-statement', label: 'Nebenkostenabrechnung prüfen (Check Costs)' },
                    { value: 'damages', label: 'Schadensersatz (Damages)' },
                    { value: 'legal-representation', label: 'Gerichtsvertretung (Court Representation)' }
                  ].map((outcome) => (
                    <button
                      key={outcome.value}
                      onClick={() => toggleArrayField('desiredOutcome', outcome.value)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        formData.desiredOutcome.includes(outcome.value)
                          ? 'bg-teal-600/20 border-teal-600 text-teal-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.desiredOutcome.includes(outcome.value)
                            ? 'bg-teal-600 border-teal-600'
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
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                  placeholder="Gibt es noch etwas, das wir wissen sollten?"
                />
              </div>

              {/* Summary Preview */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Zusammenfassung</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Objekt: </span>
                      <span className="text-white font-medium">{formData.propertyAddress || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Problem: </span>
                      <span className="text-white font-medium">{formData.issueType || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Euro className="h-5 w-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Miete: </span>
                      <span className="text-white font-medium">{formData.monthlyRent ? `${formData.monthlyRent} €` : 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-teal-400 mt-0.5 flex-shrink-0" />
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
                  ? 'bg-teal-600 text-white hover:bg-teal-500'
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
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400'
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
              <strong className="text-yellow-200">Hinweis:</strong> Mängelanzeigen sollten schriftlich (per Einschreiben) erfolgen. Bewahren Sie alle Unterlagen und Kommunikation sorgfältig auf. Wir unterstützen Sie bei der Durchsetzung Ihrer Rechte.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NewCaseHousing
