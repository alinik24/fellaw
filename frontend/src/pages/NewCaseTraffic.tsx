import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Car,
  AlertTriangle,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  CreditCard,
  Shield
} from 'lucide-react'

const NewCaseTraffic = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Incident Details
    issueType: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    incidentCity: '',
    weatherConditions: '',
    roadConditions: '',

    // Step 2: Vehicle & License Info
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    licensePlate: '',
    vehicleOwner: '',
    driverName: '',
    driverLicenseNumber: '',
    driverLicenseDate: '',
    insuranceCompany: '',
    policyNumber: '',

    // Step 3: Violation/Accident Details
    violationType: [] as string[],
    fineAmount: '',
    points: '',
    noticeNumber: '',
    noticeDate: '',
    officerName: '',
    officerBadge: '',
    speedLimit: '',
    actualSpeed: '',
    measurementMethod: '',
    alcoholLevel: '',
    drugTest: '',

    // Accident specific
    wasAccident: '',
    accidentType: '',
    injuries: '',
    propertyDamage: '',
    otherParties: [] as Array<{
      name: string
      contact: string
      insurance: string
      vehicleInfo: string
    }>,
    policeReportNumber: '',

    // Step 4: Evidence & Witnesses
    documents: [] as File[],
    witnesses: [] as Array<{
      name: string
      contact: string
      statement: string
    }>,
    photosAvailable: '',
    videoAvailable: '',
    dashcamFootage: '',

    // Step 5: Desired Outcome
    desiredOutcome: [] as string[],
    additionalNotes: ''
  })

  const totalSteps = 5

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addOtherParty = () => {
    setFormData(prev => ({
      ...prev,
      otherParties: [
        ...prev.otherParties,
        { name: '', contact: '', insurance: '', vehicleInfo: '' }
      ]
    }))
  }

  const updateOtherParty = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      otherParties: prev.otherParties.map((party, i) =>
        i === index ? { ...party, [field]: value } : party
      )
    }))
  }

  const removeOtherParty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      otherParties: prev.otherParties.filter((_, i) => i !== index)
    }))
  }

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        { name: '', contact: '', statement: '' }
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

  const toggleArrayField = (field: 'violationType' | 'desiredOutcome', value: string) => {
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
    console.log('Submitting traffic law case:', formData)
    navigate('/cases')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.issueType && formData.incidentDate
      case 2:
        return formData.vehicleType && formData.driverName
      case 3:
        return formData.issueType !== 'fine' || (formData.noticeNumber && formData.noticeDate)
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
            <div className="p-3 bg-orange-600/20 rounded-lg">
              <Car className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Neuer Fall: Verkehrsrecht</h1>
              <p className="text-slate-400 mt-1">Traffic Law Case Intake</p>
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
            <span className="text-sm font-medium text-orange-400">
              {Math.round((currentStep / totalSteps) * 100)}% abgeschlossen
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span className={currentStep >= 1 ? 'text-orange-400' : ''}>Vorfall</span>
            <span className={currentStep >= 2 ? 'text-orange-400' : ''}>Fahrzeug</span>
            <span className={currentStep >= 3 ? 'text-orange-400' : ''}>Details</span>
            <span className={currentStep >= 4 ? 'text-orange-400' : ''}>Beweise</span>
            <span className={currentStep >= 5 ? 'text-orange-400' : ''}>Ziele</span>
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
          {/* Step 1: Incident Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Details zum Vorfall</h2>
                <p className="text-slate-400">Wann und wo ist es passiert?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Art des Vorfalls <span className="text-orange-400">*</span>
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => updateFormData('issueType', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="fine">Bußgeldbescheid (Traffic Fine)</option>
                  <option value="speeding">Geschwindigkeitsverstoß (Speeding)</option>
                  <option value="accident">Verkehrsunfall (Traffic Accident)</option>
                  <option value="dui">Trunkenheit am Steuer (DUI)</option>
                  <option value="license-suspension">Führerscheinentzug (License Suspension)</option>
                  <option value="red-light">Rotlichtverstoß (Red Light Violation)</option>
                  <option value="parking">Parkvergehen (Parking Violation)</option>
                  <option value="registration">Zulassungsproblem (Registration Issue)</option>
                  <option value="insurance-dispute">Versicherungsstreit (Insurance Dispute)</option>
                  <option value="other">Sonstiges (Other)</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Datum des Vorfalls <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => updateFormData('incidentDate', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => updateFormData('incidentTime', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Genauer Ort (Straße, Kreuzung, Hausnummer)
                </label>
                <input
                  type="text"
                  value={formData.incidentLocation}
                  onChange={(e) => updateFormData('incidentLocation', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  placeholder="z.B. Berliner Straße 123, Kreuzung Hauptstraße/Bahnhofstraße"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stadt / Gemeinde
                </label>
                <input
                  type="text"
                  value={formData.incidentCity}
                  onChange={(e) => updateFormData('incidentCity', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  placeholder="z.B. München"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Wetterbedingungen
                  </label>
                  <select
                    value={formData.weatherConditions}
                    onChange={(e) => updateFormData('weatherConditions', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="clear">Klar / Sonnig (Clear)</option>
                    <option value="cloudy">Bewölkt (Cloudy)</option>
                    <option value="rain">Regen (Rain)</option>
                    <option value="heavy-rain">Starkregen (Heavy Rain)</option>
                    <option value="snow">Schnee (Snow)</option>
                    <option value="fog">Nebel (Fog)</option>
                    <option value="ice">Glatteis (Ice)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Straßenzustand
                  </label>
                  <select
                    value={formData.roadConditions}
                    onChange={(e) => updateFormData('roadConditions', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="dry">Trocken (Dry)</option>
                    <option value="wet">Nass (Wet)</option>
                    <option value="icy">Vereist (Icy)</option>
                    <option value="snowy">Schneebedeckt (Snowy)</option>
                    <option value="damaged">Beschädigt (Damaged)</option>
                    <option value="construction">Baustelle (Construction)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Vehicle & License Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Fahrzeug- und Führerscheininformationen</h2>
                <p className="text-slate-400">Details zu Fahrzeug und Fahrer</p>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Fahrzeuginformationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fahrzeugtyp <span className="text-orange-400">*</span>
                    </label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => updateFormData('vehicleType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="car">PKW (Car)</option>
                      <option value="motorcycle">Motorrad (Motorcycle)</option>
                      <option value="truck">LKW (Truck)</option>
                      <option value="van">Transporter (Van)</option>
                      <option value="bus">Bus</option>
                      <option value="bicycle">Fahrrad (Bicycle)</option>
                      <option value="e-scooter">E-Scooter</option>
                      <option value="pedestrian">Fußgänger (Pedestrian)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Kennzeichen
                    </label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => updateFormData('licensePlate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="z.B. M-AB 1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Marke
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleMake}
                      onChange={(e) => updateFormData('vehicleMake', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="z.B. Volkswagen, BMW"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Modell
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleModel}
                      onChange={(e) => updateFormData('vehicleModel', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="z.B. Golf, 3er"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fahrzeughalter
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleOwner}
                      onChange={(e) => updateFormData('vehicleOwner', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="Falls nicht Sie selbst"
                    />
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Fahrerinformationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name des Fahrers <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.driverName}
                      onChange={(e) => updateFormData('driverName', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="Ihr Name oder Name des Fahrers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Führerscheinnummer
                    </label>
                    <input
                      type="text"
                      value={formData.driverLicenseNumber}
                      onChange={(e) => updateFormData('driverLicenseNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="Führerscheinnummer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Ausstellungsdatum Führerschein
                    </label>
                    <input
                      type="date"
                      value={formData.driverLicenseDate}
                      onChange={(e) => updateFormData('driverLicenseDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Versicherungsinformationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Versicherungsgesellschaft
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceCompany}
                      onChange={(e) => updateFormData('insuranceCompany', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="z.B. Allianz, HUK-COBURG"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Versicherungsnummer
                    </label>
                    <input
                      type="text"
                      value={formData.policyNumber}
                      onChange={(e) => updateFormData('policyNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="Versicherungsschein-Nr."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Violation/Accident Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Details zum Verstoß / Unfall</h2>
                <p className="text-slate-400">Spezifische Informationen</p>
              </div>

              {/* Traffic Fine Details */}
              {(formData.issueType === 'fine' || formData.issueType === 'speeding' || formData.issueType === 'red-light') && (
                <>
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-200/80">
                        <strong className="text-blue-200">Rechtliche Information:</strong> Sie haben nach § 67 OWiG 2 Wochen Zeit, Einspruch gegen den Bußgeldbescheid einzulegen. Ein Einspruch hemmt die Rechtskraft und ermöglicht eine Überprüfung.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bußgeldbescheid-Nummer
                      </label>
                      <input
                        type="text"
                        value={formData.noticeNumber}
                        onChange={(e) => updateFormData('noticeNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="Aktenzeichen / Bescheidnummer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Datum des Bescheids
                      </label>
                      <input
                        type="date"
                        value={formData.noticeDate}
                        onChange={(e) => updateFormData('noticeDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bußgeldhöhe (€)
                      </label>
                      <input
                        type="text"
                        value={formData.fineAmount}
                        onChange={(e) => updateFormData('fineAmount', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="z.B. 150"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Punkte in Flensburg
                      </label>
                      <input
                        type="text"
                        value={formData.points}
                        onChange={(e) => updateFormData('points', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="z.B. 1 oder 2"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Name des Beamten (falls bekannt)
                      </label>
                      <input
                        type="text"
                        value={formData.officerName}
                        onChange={(e) => updateFormData('officerName', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="Name des kontrollierenden Beamten"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Dienstnummer (falls bekannt)
                      </label>
                      <input
                        type="text"
                        value={formData.officerBadge}
                        onChange={(e) => updateFormData('officerBadge', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="Dienstnummer"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Speeding Specific */}
              {formData.issueType === 'speeding' && (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Erlaubte Geschwindigkeit (km/h)
                      </label>
                      <input
                        type="text"
                        value={formData.speedLimit}
                        onChange={(e) => updateFormData('speedLimit', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="z.B. 50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Gemessene Geschwindigkeit (km/h)
                      </label>
                      <input
                        type="text"
                        value={formData.actualSpeed}
                        onChange={(e) => updateFormData('actualSpeed', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="z.B. 70"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Messverfahren
                      </label>
                      <select
                        value={formData.measurementMethod}
                        onChange={(e) => updateFormData('measurementMethod', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      >
                        <option value="">Wählen...</option>
                        <option value="radar">Radar</option>
                        <option value="laser">Laser</option>
                        <option value="fixed-camera">Festinstallierte Kamera</option>
                        <option value="mobile-camera">Mobile Kamera</option>
                        <option value="section-control">Abschnittskontrolle</option>
                        <option value="other">Sonstiges</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* DUI Specific */}
              {formData.issueType === 'dui' && (
                <>
                  <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-200/80">
                        <strong className="text-red-200">Wichtig:</strong> Alkohol- oder Drogenfahrten sind Straftaten nach § 316 StGB (ab 1,1‰) bzw. Ordnungswidrigkeiten (0,5-1,09‰). Die Folgen reichen von Geldstrafen bis zu Freiheitsstrafen und Führerscheinentzug.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Gemessener Alkoholwert (‰)
                      </label>
                      <input
                        type="text"
                        value={formData.alcoholLevel}
                        onChange={(e) => updateFormData('alcoholLevel', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="z.B. 0.8"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Drogentest durchgeführt?
                      </label>
                      <select
                        value={formData.drugTest}
                        onChange={(e) => updateFormData('drugTest', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      >
                        <option value="">Bitte wählen...</option>
                        <option value="yes-positive">Ja, positiv</option>
                        <option value="yes-negative">Ja, negativ</option>
                        <option value="no">Nein</option>
                        <option value="refused">Verweigert</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Accident Details */}
              <div className="pt-6 border-t border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  War ein Unfall beteiligt?
                </label>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => updateFormData('wasAccident', 'yes')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.wasAccident === 'yes'
                        ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => updateFormData('wasAccident', 'no')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.wasAccident === 'no'
                        ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Nein
                  </button>
                </div>

                {formData.wasAccident === 'yes' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Art des Unfalls
                      </label>
                      <select
                        value={formData.accidentType}
                        onChange={(e) => updateFormData('accidentType', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                      >
                        <option value="">Bitte wählen...</option>
                        <option value="rear-end">Auffahrunfall (Rear-End)</option>
                        <option value="side-impact">Seitenaufprall (Side Impact)</option>
                        <option value="head-on">Frontalzusammenstoß (Head-On)</option>
                        <option value="parking">Parkschaden (Parking)</option>
                        <option value="pedestrian">Fußgänger beteiligt (Pedestrian)</option>
                        <option value="bicycle">Fahrrad beteiligt (Bicycle)</option>
                        <option value="single-vehicle">Alleinunfall (Single Vehicle)</option>
                        <option value="other">Sonstiges</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Personenschäden / Verletzungen
                      </label>
                      <textarea
                        value={formData.injuries}
                        onChange={(e) => updateFormData('injuries', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors resize-none"
                        placeholder="Gab es Verletzte? Welche Verletzungen?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Sachschäden
                      </label>
                      <textarea
                        value={formData.propertyDamage}
                        onChange={(e) => updateFormData('propertyDamage', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors resize-none"
                        placeholder="Beschreiben Sie die Schäden an Fahrzeugen oder Eigentum..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Polizeiliches Aktenzeichen
                      </label>
                      <input
                        type="text"
                        value={formData.policeReportNumber}
                        onChange={(e) => updateFormData('policeReportNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                        placeholder="Falls Polizei vor Ort war"
                      />
                    </div>

                    {/* Other Parties */}
                    <div className="pt-6 border-t border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Andere Unfallbeteiligte</h3>
                      {formData.otherParties.length === 0 ? (
                        <p className="text-slate-400 text-sm mb-4">
                          Waren weitere Fahrzeuge oder Personen beteiligt?
                        </p>
                      ) : (
                        formData.otherParties.map((party, index) => (
                          <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-white">Beteiligter {index + 1}</h4>
                              <button
                                onClick={() => removeOtherParty(index)}
                                className="text-red-400 hover:text-red-300 text-sm transition-colors"
                              >
                                Entfernen
                              </button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={party.name}
                                onChange={(e) => updateOtherParty(index, 'name', e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={party.contact}
                                onChange={(e) => updateOtherParty(index, 'contact', e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                                placeholder="Kontakt (Telefon/E-Mail)"
                              />
                              <input
                                type="text"
                                value={party.insurance}
                                onChange={(e) => updateOtherParty(index, 'insurance', e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                                placeholder="Versicherung"
                              />
                              <input
                                type="text"
                                value={party.vehicleInfo}
                                onChange={(e) => updateOtherParty(index, 'vehicleInfo', e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                                placeholder="Fahrzeug (Marke, Kennzeichen)"
                              />
                            </div>
                          </div>
                        ))
                      )}
                      <button
                        onClick={addOtherParty}
                        className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-orange-600 hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <Car className="h-5 w-5" />
                        Beteiligten hinzufügen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Evidence & Witnesses */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Beweise und Zeugen</h2>
                <p className="text-slate-400">Dokumentation des Vorfalls</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dokumente hochladen
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-orange-600 transition-colors">
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium cursor-pointer transition-colors"
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
                        <FileText className="h-5 w-5 text-orange-400" />
                        <span className="text-sm text-slate-300 flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Wichtige Dokumente: Bußgeldbescheid, Führerschein, Zulassungsbescheinigung,
                  Versicherungsschein, Unfallskizze, Fotos, Polizeibericht, ärztliche Atteste
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fotos vorhanden?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateFormData('photosAvailable', 'yes')}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        formData.photosAvailable === 'yes'
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('photosAvailable', 'no')}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        formData.photosAvailable === 'no'
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Videomaterial?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateFormData('videoAvailable', 'yes')}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        formData.videoAvailable === 'yes'
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('videoAvailable', 'no')}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        formData.videoAvailable === 'no'
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dashcam-Aufnahme?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateFormData('dashcamFootage', 'yes')}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        formData.dashcamFootage === 'yes'
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('dashcamFootage', 'no')}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        formData.dashcamFootage === 'no'
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>
              </div>

              {/* Witnesses */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Zeugen</h3>
                {formData.witnesses.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Gab es Zeugen des Vorfalls?
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
                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={witness.name}
                          onChange={(e) => updateWitness(index, 'name', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={witness.contact}
                          onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none"
                          placeholder="Kontakt"
                        />
                      </div>
                      <textarea
                        value={witness.statement}
                        onChange={(e) => updateWitness(index, 'statement', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 outline-none resize-none"
                        placeholder="Was hat der Zeuge gesehen?"
                      />
                    </div>
                  ))
                )}
                <button
                  onClick={addWitness}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-orange-600 hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-5 w-5" />
                  Zeuge hinzufügen
                </button>
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
                  Gewünschte Ergebnisse (Mehrfachauswahl möglich) <span className="text-orange-400">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'dismiss-fine', label: 'Bußgeld abwenden (Dismiss Fine)' },
                    { value: 'reduce-fine', label: 'Bußgeld reduzieren (Reduce Fine)' },
                    { value: 'avoid-points', label: 'Punkte vermeiden (Avoid Points)' },
                    { value: 'keep-license', label: 'Führerschein behalten (Keep License)' },
                    { value: 'insurance-claim', label: 'Versicherungsanspruch (Insurance Claim)' },
                    { value: 'damages', label: 'Schadensersatz (Damages)' },
                    { value: 'appeal', label: 'Einspruch einlegen (Appeal)' },
                    { value: 'legal-representation', label: 'Gerichtsvertretung (Court Representation)' }
                  ].map((outcome) => (
                    <button
                      key={outcome.value}
                      onClick={() => toggleArrayField('desiredOutcome', outcome.value)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        formData.desiredOutcome.includes(outcome.value)
                          ? 'bg-orange-600/20 border-orange-600 text-orange-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.desiredOutcome.includes(outcome.value)
                            ? 'bg-orange-600 border-orange-600'
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
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors resize-none"
                  placeholder="Gibt es noch etwas, das wir wissen sollten? Besondere Umstände, mildernde Faktoren?"
                />
              </div>

              {/* Summary Preview */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Zusammenfassung</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Car className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Vorfall: </span>
                      <span className="text-white font-medium">{formData.issueType || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Datum: </span>
                      <span className="text-white font-medium">{formData.incidentDate || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Ort: </span>
                      <span className="text-white font-medium">{formData.incidentCity || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
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
                  ? 'bg-orange-600 text-white hover:bg-orange-500'
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
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400'
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
              <strong className="text-yellow-200">Hinweis:</strong> Bei Bußgeldbescheiden ist die Einspruchsfrist von 2 Wochen zwingend einzuhalten. Wir unterstützen Sie bei der Prüfung und ggf. beim Einspruch.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NewCaseTraffic
