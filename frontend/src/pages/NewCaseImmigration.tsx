import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Plane,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Home,
  Briefcase
} from 'lucide-react'

const NewCaseImmigration = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Personal & Immigration Status
    countryOfOrigin: '',
    nationality: '',
    dateOfEntry: '',
    currentVisaType: '',
    visaExpiryDate: '',
    passportNumber: '',
    passportExpiryDate: '',
    currentAddress: '',
    residencePermitNumber: '',
    maritalStatus: '',
    hasGermanFamily: '',

    // Step 2: Issue Details
    issueType: '',
    issueDescription: '',
    urgencyLevel: '',
    deportationNoticeDate: '',
    deportationDate: '',
    asylumApplicationDate: '',
    asylumDecision: '',
    visaDenialReason: '',
    familyMemberInGermany: '',
    familyRelationship: '',
    employerName: '',
    jobTitle: '',
    employmentStartDate: '',
    workPermitType: '',

    // Step 3: Travel & Residence History
    previousCountries: [] as Array<{
      country: string
      fromDate: string
      toDate: string
      purpose: string
    }>,
    previousVisaApplications: [] as Array<{
      country: string
      date: string
      type: string
      result: string
    }>,
    travelRestrictions: '',
    criminalRecord: '',

    // Step 4: Evidence & Documents
    documents: [] as File[],
    languageSkills: [] as string[],
    germanLanguageLevel: '',
    integrationCourseCompleted: '',
    employmentHistory: '',
    financialSituation: '',

    // Step 5: Desired Outcome
    desiredOutcome: [] as string[],
    additionalNotes: ''
  })

  const totalSteps = 5

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addPreviousCountry = () => {
    setFormData(prev => ({
      ...prev,
      previousCountries: [
        ...prev.previousCountries,
        { country: '', fromDate: '', toDate: '', purpose: '' }
      ]
    }))
  }

  const updatePreviousCountry = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      previousCountries: prev.previousCountries.map((country, i) =>
        i === index ? { ...country, [field]: value } : country
      )
    }))
  }

  const removePreviousCountry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      previousCountries: prev.previousCountries.filter((_, i) => i !== index)
    }))
  }

  const addVisaApplication = () => {
    setFormData(prev => ({
      ...prev,
      previousVisaApplications: [
        ...prev.previousVisaApplications,
        { country: '', date: '', type: '', result: '' }
      ]
    }))
  }

  const updateVisaApplication = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      previousVisaApplications: prev.previousVisaApplications.map((app, i) =>
        i === index ? { ...app, [field]: value } : app
      )
    }))
  }

  const removeVisaApplication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      previousVisaApplications: prev.previousVisaApplications.filter((_, i) => i !== index)
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

  const toggleArrayField = (field: 'languageSkills' | 'desiredOutcome', value: string) => {
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
    console.log('Submitting immigration law case:', formData)
    navigate('/cases')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.countryOfOrigin && formData.nationality && formData.currentVisaType
      case 2:
        return formData.issueType && formData.issueDescription
      case 3:
        return true
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
            <div className="p-3 bg-green-600/20 rounded-lg">
              <Globe className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Neuer Fall: Ausländerrecht</h1>
              <p className="text-slate-400 mt-1">Immigration Law Case Intake</p>
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
            <span className="text-sm font-medium text-green-400">
              {Math.round((currentStep / totalSteps) * 100)}% abgeschlossen
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span className={currentStep >= 1 ? 'text-green-400' : ''}>Status</span>
            <span className={currentStep >= 2 ? 'text-green-400' : ''}>Anliegen</span>
            <span className={currentStep >= 3 ? 'text-green-400' : ''}>Historie</span>
            <span className={currentStep >= 4 ? 'text-green-400' : ''}>Beweise</span>
            <span className={currentStep >= 5 ? 'text-green-400' : ''}>Ziele</span>
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
          {/* Step 1: Immigration Status */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Persönliche Daten & Aufenthaltsstatus</h2>
                <p className="text-slate-400">Grundlegende Informationen zu Ihrer Situation</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Herkunftsland <span className="text-green-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.countryOfOrigin}
                    onChange={(e) => updateFormData('countryOfOrigin', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                    placeholder="z.B. Syrien, Ukraine, Türkei"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Staatsangehörigkeit <span className="text-green-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => updateFormData('nationality', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                    placeholder="z.B. Syrisch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Datum der Einreise nach Deutschland
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfEntry}
                    onChange={(e) => updateFormData('dateOfEntry', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Aktueller Aufenthaltsstatus <span className="text-green-400">*</span>
                  </label>
                  <select
                    value={formData.currentVisaType}
                    onChange={(e) => updateFormData('currentVisaType', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="tourist">Touristenvisum (Tourist Visa)</option>
                    <option value="student">Studentenvisum (Student Visa)</option>
                    <option value="work">Arbeitsvisum (Work Visa)</option>
                    <option value="blue-card">Blaue Karte EU (EU Blue Card)</option>
                    <option value="family-reunion">Familienzusammenführung (Family Reunion)</option>
                    <option value="asylum-seeker">Asylbewerber (Asylum Seeker)</option>
                    <option value="refugee">Anerkannter Flüchtling (Recognized Refugee)</option>
                    <option value="subsidiary">Subsidiärer Schutz (Subsidiary Protection)</option>
                    <option value="tolerated">Duldung (Tolerated Stay)</option>
                    <option value="permanent">Niederlassungserlaubnis (Permanent Residence)</option>
                    <option value="citizenship-application">Einbürgerungsantrag (Citizenship Application)</option>
                    <option value="expired">Abgelaufen (Expired)</option>
                    <option value="none">Kein gültiger Status (No Valid Status)</option>
                  </select>
                </div>

                {formData.currentVisaType && formData.currentVisaType !== 'none' && formData.currentVisaType !== 'expired' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ablaufdatum des Visums/der Aufenthaltserlaubnis
                      </label>
                      <input
                        type="date"
                        value={formData.visaExpiryDate}
                        onChange={(e) => updateFormData('visaExpiryDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Aufenthaltstitel-Nummer
                      </label>
                      <input
                        type="text"
                        value={formData.residencePermitNumber}
                        onChange={(e) => updateFormData('residencePermitNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                        placeholder="Falls vorhanden"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reisepassnummer
                  </label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => updateFormData('passportNumber', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                    placeholder="z.B. P123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ablaufdatum des Reisepasses
                  </label>
                  <input
                    type="date"
                    value={formData.passportExpiryDate}
                    onChange={(e) => updateFormData('passportExpiryDate', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Aktuelle Adresse in Deutschland
                </label>
                <input
                  type="text"
                  value={formData.currentAddress}
                  onChange={(e) => updateFormData('currentAddress', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  placeholder="Straße, Nr., PLZ, Stadt"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Familienstand
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => updateFormData('maritalStatus', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="single">Ledig (Single)</option>
                    <option value="married">Verheiratet (Married)</option>
                    <option value="divorced">Geschieden (Divorced)</option>
                    <option value="widowed">Verwitwet (Widowed)</option>
                    <option value="partnership">Partnerschaft (Partnership)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Haben Sie Familienangehörige in Deutschland?
                  </label>
                  <select
                    value={formData.hasGermanFamily}
                    onChange={(e) => updateFormData('hasGermanFamily', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="yes">Ja</option>
                    <option value="no">Nein</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Issue Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Ihr Anliegen</h2>
                <p className="text-slate-400">Beschreiben Sie Ihr ausländerrechtliches Problem</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Art des Anliegens <span className="text-green-400">*</span>
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => updateFormData('issueType', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="visa-application">Visumsantrag (Visa Application)</option>
                  <option value="visa-extension">Visumsverlängerung (Visa Extension)</option>
                  <option value="visa-denial">Visumsablehnung (Visa Denial)</option>
                  <option value="residence-permit">Aufenthaltserlaubnis (Residence Permit)</option>
                  <option value="asylum-application">Asylantrag (Asylum Application)</option>
                  <option value="asylum-appeal">Asylablehnung Widerspruch (Asylum Appeal)</option>
                  <option value="deportation">Abschiebung/Ausweisung (Deportation)</option>
                  <option value="family-reunion">Familienzusammenführung (Family Reunion)</option>
                  <option value="work-permit">Arbeitserlaubnis (Work Permit)</option>
                  <option value="citizenship">Einbürgerung (Citizenship/Naturalization)</option>
                  <option value="blue-card">Blaue Karte EU (EU Blue Card)</option>
                  <option value="student-visa">Studienvisum (Student Visa)</option>
                  <option value="dublin-procedure">Dublin-Verfahren (Dublin Procedure)</option>
                  <option value="other">Sonstiges (Other)</option>
                </select>
              </div>

              {/* Deportation Notice */}
              {formData.issueType === 'deportation' && (
                <>
                  <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-200/80">
                        <strong className="text-red-200">Wichtig:</strong> Bei Abschiebungsanordnung ist schnelles Handeln erforderlich. Wir können eine einstweilige Anordnung nach § 80 Abs. 5 VwGO beim zuständigen Verwaltungsgericht beantragen.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Datum des Abschiebungsbescheids
                      </label>
                      <input
                        type="date"
                        value={formData.deportationNoticeDate}
                        onChange={(e) => updateFormData('deportationNoticeDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Geplantes Abschiebungsdatum
                      </label>
                      <input
                        type="date"
                        value={formData.deportationDate}
                        onChange={(e) => updateFormData('deportationDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Asylum */}
              {(formData.issueType === 'asylum-application' || formData.issueType === 'asylum-appeal') && (
                <>
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-200/80">
                        <strong className="text-blue-200">Rechtliche Information:</strong> Asylverfahren unterliegen dem Asylgesetz (AsylG). Die Prüfung erfolgt durch das Bundesamt für Migration und Flüchtlinge (BAMF). Bei Ablehnung können Sie Klage beim Verwaltungsgericht einreichen.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Datum der Asylantragstellung
                      </label>
                      <input
                        type="date"
                        value={formData.asylumApplicationDate}
                        onChange={(e) => updateFormData('asylumApplicationDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      />
                    </div>

                    {formData.issueType === 'asylum-appeal' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Entscheidung des BAMF
                        </label>
                        <select
                          value={formData.asylumDecision}
                          onChange={(e) => updateFormData('asylumDecision', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                        >
                          <option value="">Bitte wählen...</option>
                          <option value="rejected">Abgelehnt (Rejected)</option>
                          <option value="inadmissible">Unzulässig (Inadmissible)</option>
                          <option value="manifestly-unfounded">Offensichtlich unbegründet (Manifestly Unfounded)</option>
                          <option value="pending">Noch ausstehend (Pending)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Visa Denial */}
              {formData.issueType === 'visa-denial' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Grund der Visumsablehnung
                  </label>
                  <textarea
                    value={formData.visaDenialReason}
                    onChange={(e) => updateFormData('visaDenialReason', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                    placeholder="Was war der angegebene Grund für die Ablehnung?"
                  />
                </div>
              )}

              {/* Family Reunion */}
              {formData.issueType === 'family-reunion' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Familienangehöriger in Deutschland
                    </label>
                    <input
                      type="text"
                      value={formData.familyMemberInGermany}
                      onChange={(e) => updateFormData('familyMemberInGermany', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      placeholder="Name des Angehörigen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Verwandtschaftsgrad
                    </label>
                    <select
                      value={formData.familyRelationship}
                      onChange={(e) => updateFormData('familyRelationship', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="spouse">Ehepartner (Spouse)</option>
                      <option value="child">Kind (Child)</option>
                      <option value="parent">Elternteil (Parent)</option>
                      <option value="sibling">Geschwister (Sibling)</option>
                      <option value="grandparent">Großelternteil (Grandparent)</option>
                      <option value="other">Sonstiges (Other)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Work Permit / Blue Card */}
              {(formData.issueType === 'work-permit' || formData.issueType === 'blue-card') && (
                <>
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-200/80">
                        <strong className="text-blue-200">Rechtliche Information:</strong> Die Blaue Karte EU nach § 18b Abs. 1 AufenthG erfordert einen deutschen oder anerkannten ausländischen Hochschulabschluss sowie ein Jahresgehalt von mindestens {new Date().getFullYear() === 2026 ? '45.300 €' : '43.800 €'} (Mangelberufe: {new Date().getFullYear() === 2026 ? '41.042 €' : '39.682 €'}).
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Arbeitgeber
                      </label>
                      <input
                        type="text"
                        value={formData.employerName}
                        onChange={(e) => updateFormData('employerName', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                        placeholder="Name des Unternehmens"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => updateFormData('jobTitle', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                        placeholder="Berufsbezeichnung"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Geplanter Arbeitsbeginn
                      </label>
                      <input
                        type="date"
                        value={formData.employmentStartDate}
                        onChange={(e) => updateFormData('employmentStartDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Art der Arbeitserlaubnis
                      </label>
                      <select
                        value={formData.workPermitType}
                        onChange={(e) => updateFormData('workPermitType', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      >
                        <option value="">Bitte wählen...</option>
                        <option value="skilled-worker">Fachkräfte (Skilled Worker)</option>
                        <option value="blue-card">Blaue Karte EU (EU Blue Card)</option>
                        <option value="ict">ICT-Karte (ICT Card)</option>
                        <option value="researcher">Forscher (Researcher)</option>
                        <option value="self-employed">Selbstständig (Self-Employed)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* General Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Detaillierte Beschreibung Ihres Anliegens <span className="text-green-400">*</span>
                </label>
                <textarea
                  value={formData.issueDescription}
                  onChange={(e) => updateFormData('issueDescription', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  placeholder="Bitte beschreiben Sie Ihre Situation so detailliert wie möglich. Was ist passiert? Welche Behörden waren beteiligt? Was sind die Hauptprobleme?"
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
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="immediate">Sofort - Abschiebung droht</option>
                  <option value="urgent">Dringend - Frist läuft ab</option>
                  <option value="normal">Normal - innerhalb 1 Monat</option>
                  <option value="planning">Planung - mehr als 1 Monat</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Travel & Residence History */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Reise- und Aufenthaltshistorie</h2>
                <p className="text-slate-400">Informationen zu früheren Aufenthalten</p>
              </div>

              {/* Previous Countries */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Frühere Aufenthalte in anderen Ländern</h3>
                {formData.previousCountries.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Hatten Sie längere Aufenthalte in anderen Ländern?
                  </p>
                ) : (
                  formData.previousCountries.map((country, index) => (
                    <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Aufenthalt {index + 1}</h4>
                        <button
                          onClick={() => removePreviousCountry(index)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Entfernen
                        </button>
                      </div>
                      <div className="grid md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={country.country}
                          onChange={(e) => updatePreviousCountry(index, 'country', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Land"
                        />
                        <input
                          type="date"
                          value={country.fromDate}
                          onChange={(e) => updatePreviousCountry(index, 'fromDate', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Von"
                        />
                        <input
                          type="date"
                          value={country.toDate}
                          onChange={(e) => updatePreviousCountry(index, 'toDate', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Bis"
                        />
                        <input
                          type="text"
                          value={country.purpose}
                          onChange={(e) => updatePreviousCountry(index, 'purpose', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Zweck"
                        />
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={addPreviousCountry}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-green-600 hover:text-green-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plane className="h-5 w-5" />
                  Aufenthalt hinzufügen
                </button>
              </div>

              {/* Previous Visa Applications */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Frühere Visumsanträge</h3>
                {formData.previousVisaApplications.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Haben Sie bereits Visa für andere Länder beantragt?
                  </p>
                ) : (
                  formData.previousVisaApplications.map((app, index) => (
                    <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Antrag {index + 1}</h4>
                        <button
                          onClick={() => removeVisaApplication(index)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Entfernen
                        </button>
                      </div>
                      <div className="grid md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={app.country}
                          onChange={(e) => updateVisaApplication(index, 'country', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Land"
                        />
                        <input
                          type="date"
                          value={app.date}
                          onChange={(e) => updateVisaApplication(index, 'date', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Datum"
                        />
                        <input
                          type="text"
                          value={app.type}
                          onChange={(e) => updateVisaApplication(index, 'type', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                          placeholder="Typ"
                        />
                        <select
                          value={app.result}
                          onChange={(e) => updateVisaApplication(index, 'result', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500 outline-none"
                        >
                          <option value="">Ergebnis...</option>
                          <option value="approved">Genehmigt</option>
                          <option value="denied">Abgelehnt</option>
                          <option value="pending">Ausstehend</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={addVisaApplication}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-green-600 hover:text-green-400 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Visumsantrag hinzufügen
                </button>
              </div>

              {/* Travel Restrictions */}
              <div className="pt-6 border-t border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bestehen Reisebeschränkungen oder Einreiseverbote?
                </label>
                <textarea
                  value={formData.travelRestrictions}
                  onChange={(e) => updateFormData('travelRestrictions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  placeholder="z.B. Schengen-Einreiseverbot, Beschränkungen für bestimmte Länder..."
                />
              </div>

              {/* Criminal Record */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Strafrechtliche Vorgeschichte
                </label>
                <textarea
                  value={formData.criminalRecord}
                  onChange={(e) => updateFormData('criminalRecord', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  placeholder="Falls vorhanden, geben Sie Details an (Art der Straftat, Urteil, Land). Dies ist wichtig für die rechtliche Beratung."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Diese Information wird vertraulich behandelt und ist wichtig für Ihre rechtliche Beratung.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Evidence & Integration */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Nachweise & Integration</h2>
                <p className="text-slate-400">Dokumente und Integrationsnachweise</p>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dokumente hochladen
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-green-600 transition-colors">
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium cursor-pointer transition-colors"
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
                        <FileText className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-slate-300 flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Wichtige Dokumente: Reisepass, Visum, Aufenthaltstitel, Geburtsurkunde, Heiratsurkunde,
                  Arbeitsvertrag, Mietvertrag, Kontoauszüge, Sprachzertifikate, Abschlüsse, etc.
                </p>
              </div>

              {/* Language Skills */}
              <div className="pt-6 border-t border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Sprachkenntnisse (Mehrfachauswahl)
                </label>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { value: 'german', label: 'Deutsch' },
                    { value: 'english', label: 'Englisch' },
                    { value: 'french', label: 'Französisch' },
                    { value: 'spanish', label: 'Spanisch' },
                    { value: 'arabic', label: 'Arabisch' },
                    { value: 'turkish', label: 'Türkisch' },
                    { value: 'russian', label: 'Russisch' },
                    { value: 'ukrainian', label: 'Ukrainisch' },
                    { value: 'other', label: 'Sonstige' }
                  ].map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => toggleArrayField('languageSkills', lang.value)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        formData.languageSkills.includes(lang.value)
                          ? 'bg-green-600/20 border-green-600 text-green-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.languageSkills.includes(lang.value)
                            ? 'bg-green-600 border-green-600'
                            : 'border-slate-600'
                        }`}>
                          {formData.languageSkills.includes(lang.value) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm">{lang.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* German Language Level */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deutschkenntnisse (Niveau)
                </label>
                <select
                  value={formData.germanLanguageLevel}
                  onChange={(e) => updateFormData('germanLanguageLevel', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="none">Keine Kenntnisse (None)</option>
                  <option value="A1">A1 - Anfänger</option>
                  <option value="A2">A2 - Grundkenntnisse</option>
                  <option value="B1">B1 - Fortgeschritten</option>
                  <option value="B2">B2 - Selbstständig</option>
                  <option value="C1">C1 - Fachkundig</option>
                  <option value="C2">C2 - Muttersprachlich</option>
                </select>
              </div>

              {/* Integration Course */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Integrationskurs abgeschlossen?
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateFormData('integrationCourseCompleted', 'yes')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.integrationCourseCompleted === 'yes'
                        ? 'bg-green-600/20 border-green-600 text-green-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => updateFormData('integrationCourseCompleted', 'in-progress')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.integrationCourseCompleted === 'in-progress'
                        ? 'bg-green-600/20 border-green-600 text-green-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Laufend
                  </button>
                  <button
                    onClick={() => updateFormData('integrationCourseCompleted', 'no')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.integrationCourseCompleted === 'no'
                        ? 'bg-green-600/20 border-green-600 text-green-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Nein
                  </button>
                </div>
              </div>

              {/* Employment History */}
              <div className="pt-6 border-t border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Beruflicher Werdegang
                </label>
                <textarea
                  value={formData.employmentHistory}
                  onChange={(e) => updateFormData('employmentHistory', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  placeholder="Beschreiben Sie Ihre berufliche Erfahrung (Positionen, Unternehmen, Zeiträume)..."
                />
              </div>

              {/* Financial Situation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Finanzielle Situation
                </label>
                <textarea
                  value={formData.financialSituation}
                  onChange={(e) => updateFormData('financialSituation', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  placeholder="z.B. Einkommen, Ersparnisse, Unterstützung durch Familie, Sozialleistungen..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Diese Information ist wichtig für Visumsanträge und kann den Ausgang Ihres Falls beeinflussen.
                </p>
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
                  Gewünschte Ergebnisse (Mehrfachauswahl möglich) <span className="text-green-400">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'visa-approval', label: 'Visum erhalten' },
                    { value: 'visa-extension', label: 'Visum verlängern' },
                    { value: 'residence-permit', label: 'Aufenthaltserlaubnis' },
                    { value: 'asylum-protection', label: 'Asyl/Schutzstatus' },
                    { value: 'stop-deportation', label: 'Abschiebung verhindern' },
                    { value: 'family-reunion', label: 'Familienzusammenführung' },
                    { value: 'work-permit', label: 'Arbeitserlaubnis' },
                    { value: 'blue-card', label: 'Blaue Karte EU' },
                    { value: 'citizenship', label: 'Einbürgerung' },
                    { value: 'appeal-decision', label: 'Bescheid anfechten' }
                  ].map((outcome) => (
                    <button
                      key={outcome.value}
                      onClick={() => toggleArrayField('desiredOutcome', outcome.value)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        formData.desiredOutcome.includes(outcome.value)
                          ? 'bg-green-600/20 border-green-600 text-green-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.desiredOutcome.includes(outcome.value)
                            ? 'bg-green-600 border-green-600'
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
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  placeholder="Gibt es noch etwas, das wir wissen sollten? Besondere Umstände, Zeitdruck, spezifische Wünsche?"
                />
              </div>

              {/* Summary Preview */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Zusammenfassung</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Herkunft: </span>
                      <span className="text-white font-medium">{formData.countryOfOrigin || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className="text-white font-medium">{formData.currentVisaType || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Anliegen: </span>
                      <span className="text-white font-medium">{formData.issueType || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
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
                  ? 'bg-green-600 text-white hover:bg-green-500'
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
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400'
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
              Bei ausländerrechtlichen Fragen ist oft schnelles Handeln erforderlich. Wir werden Ihren Fall
              mit höchster Priorität behandeln.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NewCaseImmigration
