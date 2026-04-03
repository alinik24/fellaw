import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Package,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  Euro,
  Store,
  CreditCard
} from 'lucide-react'

const NewCaseConsumer = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Purchase Details
    issueType: '',
    productOrService: '',
    productName: '',
    productDescription: '',
    purchaseDate: '',
    purchasePrice: '',
    seller: '',
    sellerType: '',
    sellerAddress: '',
    sellerWebsite: '',
    sellerEmail: '',
    sellerPhone: '',
    purchaseLocation: '',
    paymentMethod: '',

    // Step 2: Issue Description
    issueDescription: '',
    discoveryDate: '',
    defectType: [] as string[],
    serviceIssueType: [] as string[],
    attemptedResolution: '',
    sellerResponse: '',
    warrantyInfo: '',
    warrantyExpiry: '',

    // Step 3: Communication & Evidence
    documents: [] as File[],
    communications: [] as Array<{
      date: string
      type: string
      content: string
    }>,
    witnesses: [] as Array<{
      name: string
      contact: string
    }>,
    photosAvailable: '',
    receiptAvailable: '',

    // Step 4: Desired Outcome
    desiredOutcome: [] as string[],
    refundAmount: '',
    replacementPreference: '',
    additionalDamages: '',
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
        { name: '', contact: '' }
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

  const toggleArrayField = (field: 'defectType' | 'serviceIssueType' | 'desiredOutcome', value: string) => {
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
    console.log('Submitting consumer protection case:', formData)
    navigate('/cases')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.issueType && formData.productOrService && formData.seller
      case 2:
        return formData.issueDescription && formData.discoveryDate
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
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Neuer Fall: Verbraucherschutz</h1>
              <p className="text-slate-400 mt-1">Consumer Protection Case Intake</p>
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
            <span className="text-sm font-medium text-purple-400">
              {Math.round((currentStep / totalSteps) * 100)}% abgeschlossen
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span className={currentStep >= 1 ? 'text-purple-400' : ''}>Kauf</span>
            <span className={currentStep >= 2 ? 'text-purple-400' : ''}>Problem</span>
            <span className={currentStep >= 3 ? 'text-purple-400' : ''}>Beweise</span>
            <span className={currentStep >= 4 ? 'text-purple-400' : ''}>Ziele</span>
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
          {/* Step 1: Purchase Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Details zum Kauf</h2>
                <p className="text-slate-400">Informationen über Ihren Kauf</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Art des Problems <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => updateFormData('issueType', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="product-defect">Produktmangel (Product Defect)</option>
                    <option value="service-issue">Dienstleistungsproblem (Service Issue)</option>
                    <option value="non-delivery">Nicht-Lieferung (Non-Delivery)</option>
                    <option value="wrong-item">Falscher Artikel (Wrong Item)</option>
                    <option value="warranty-claim">Garantieanspruch (Warranty Claim)</option>
                    <option value="return-refusal">Rückgabeverweigerung (Return Refusal)</option>
                    <option value="cancellation">Stornierung (Cancellation)</option>
                    <option value="subscription">Abo-Problem (Subscription Issue)</option>
                    <option value="online-shopping">Online-Shopping-Problem</option>
                    <option value="price-dispute">Preisstreit (Price Dispute)</option>
                    <option value="fraud">Betrug (Fraud)</option>
                    <option value="other">Sonstiges (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Produkt oder Dienstleistung? <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={formData.productOrService}
                    onChange={(e) => updateFormData('productOrService', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="product">Produkt (Product)</option>
                    <option value="service">Dienstleistung (Service)</option>
                    <option value="both">Beides (Both)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Produktname / Dienstleistung
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => updateFormData('productName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="z.B. iPhone 15 Pro, Waschmaschine Bosch XYZ, Handwerkerleistung"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.productDescription}
                  onChange={(e) => updateFormData('productDescription', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                  placeholder="Kurze Beschreibung des Produkts oder der Dienstleistung"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kaufdatum
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => updateFormData('purchaseDate', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kaufpreis
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.purchasePrice}
                      onChange={(e) => updateFormData('purchasePrice', e.target.value)}
                      className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="199.99"
                    />
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Verkäufer-Informationen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Verkäufer / Händler <span className="text-purple-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.seller}
                      onChange={(e) => updateFormData('seller', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="Name des Geschäfts, Unternehmens oder Verkäufers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Verkäufertyp
                    </label>
                    <select
                      value={formData.sellerType}
                      onChange={(e) => updateFormData('sellerType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="retail-store">Einzelhandelsgeschäft (Retail Store)</option>
                      <option value="online-marketplace">Online-Marktplatz (e.g., Amazon, eBay)</option>
                      <option value="online-shop">Online-Shop</option>
                      <option value="private-seller">Privater Verkäufer (Private Seller)</option>
                      <option value="service-provider">Dienstleister (Service Provider)</option>
                      <option value="manufacturer">Hersteller (Manufacturer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Kaufort / Website
                    </label>
                    <input
                      type="text"
                      value={formData.purchaseLocation}
                      onChange={(e) => updateFormData('purchaseLocation', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="Stadt oder Website-URL"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse des Verkäufers
                    </label>
                    <input
                      type="text"
                      value={formData.sellerAddress}
                      onChange={(e) => updateFormData('sellerAddress', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="Straße, Nr., PLZ, Stadt"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      E-Mail des Verkäufers
                    </label>
                    <input
                      type="email"
                      value={formData.sellerEmail}
                      onChange={(e) => updateFormData('sellerEmail', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="verkauf@beispiel.de"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Telefon des Verkäufers
                    </label>
                    <input
                      type="tel"
                      value={formData.sellerPhone}
                      onChange={(e) => updateFormData('sellerPhone', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Zahlungsmethode
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="cash">Bargeld (Cash)</option>
                  <option value="debit-card">EC-Karte (Debit Card)</option>
                  <option value="credit-card">Kreditkarte (Credit Card)</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank-transfer">Überweisung (Bank Transfer)</option>
                  <option value="invoice">Rechnung (Invoice)</option>
                  <option value="financing">Ratenzahlung (Financing)</option>
                  <option value="other">Sonstiges (Other)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Issue Description */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Problembeschreibung</h2>
                <p className="text-slate-400">Was ist das Problem?</p>
              </div>

              {/* Legal Info Box */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200/80">
                    <strong className="text-blue-200">Rechtliche Information:</strong> Nach § 437 BGB haben Sie bei Mängeln das Recht auf Nacherfüllung (Reparatur oder Ersatzlieferung), Rücktritt vom Vertrag oder Minderung. Die gesetzliche Gewährleistungsfrist beträgt 2 Jahre ab Übergabe (§ 438 BGB).
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wann haben Sie das Problem entdeckt? <span className="text-purple-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.discoveryDate}
                  onChange={(e) => updateFormData('discoveryDate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>

              {/* Product Defect Types */}
              {formData.productOrService === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Art des Produktmangels (Mehrfachauswahl)
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { value: 'not-working', label: 'Funktioniert nicht (Not Working)' },
                      { value: 'damaged', label: 'Beschädigt (Damaged)' },
                      { value: 'incomplete', label: 'Unvollständig (Incomplete)' },
                      { value: 'wrong-specs', label: 'Falsche Spezifikationen (Wrong Specs)' },
                      { value: 'quality-issue', label: 'Qualitätsmangel (Quality Issue)' },
                      { value: 'safety-concern', label: 'Sicherheitsproblem (Safety Concern)' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleArrayField('defectType', type.value)}
                        className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                          formData.defectType.includes(type.value)
                            ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.defectType.includes(type.value)
                              ? 'bg-purple-600 border-purple-600'
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
              )}

              {/* Service Issue Types */}
              {formData.productOrService === 'service' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Art des Dienstleistungsproblems (Mehrfachauswahl)
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { value: 'not-completed', label: 'Nicht abgeschlossen (Not Completed)' },
                      { value: 'poor-quality', label: 'Schlechte Qualität (Poor Quality)' },
                      { value: 'delayed', label: 'Verspätet (Delayed)' },
                      { value: 'overcharged', label: 'Überteuert (Overcharged)' },
                      { value: 'unprofessional', label: 'Unprofessionell (Unprofessional)' },
                      { value: 'damaged-property', label: 'Sachschaden (Property Damage)' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleArrayField('serviceIssueType', type.value)}
                        className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                          formData.serviceIssueType.includes(type.value)
                            ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.serviceIssueType.includes(type.value)
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-slate-600'
                          }`}>
                            {formData.serviceIssueType.includes(type.value) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Detaillierte Problembeschreibung <span className="text-purple-400">*</span>
                </label>
                <textarea
                  value={formData.issueDescription}
                  onChange={(e) => updateFormData('issueDescription', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                  placeholder="Beschreiben Sie das Problem so detailliert wie möglich. Was funktioniert nicht? Was ist beschädigt? Was wurde nicht wie erwartet geliefert?"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Je detaillierter Ihre Beschreibung, desto besser können wir Ihnen helfen.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Haben Sie versucht, das Problem zu lösen?
                </label>
                <textarea
                  value={formData.attemptedResolution}
                  onChange={(e) => updateFormData('attemptedResolution', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                  placeholder="z.B. Reklamation beim Verkäufer, Reparaturversuch, Rücksendung angefordert..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wie hat der Verkäufer reagiert?
                </label>
                <textarea
                  value={formData.sellerResponse}
                  onChange={(e) => updateFormData('sellerResponse', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                  placeholder="Beschreiben Sie die Reaktion des Verkäufers auf Ihre Reklamation..."
                />
              </div>

              {/* Warranty Information */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Garantie / Gewährleistung</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Garantie-/Gewährleistungsinformationen
                    </label>
                    <textarea
                      value={formData.warrantyInfo}
                      onChange={(e) => updateFormData('warrantyInfo', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                      placeholder="Gibt es eine Herstellergarantie? Welche Bedingungen gelten?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Garantieablaufdatum
                    </label>
                    <input
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={(e) => updateFormData('warrantyExpiry', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Evidence & Documentation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Beweise und Dokumentation</h2>
                <p className="text-slate-400">Laden Sie relevante Unterlagen hoch</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dokumente hochladen
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-purple-600 transition-colors">
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium cursor-pointer transition-colors"
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
                        <FileText className="h-5 w-5 text-purple-400" />
                        <span className="text-sm text-slate-300 flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Wichtige Dokumente: Kaufbeleg, Rechnung, Garantieschein, Produktbeschreibung,
                  E-Mail-Korrespondenz, Fotos des Mangels, Lieferschein, etc.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Haben Sie einen Kaufbeleg?
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateFormData('receiptAvailable', 'yes')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.receiptAvailable === 'yes'
                          ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('receiptAvailable', 'no')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.receiptAvailable === 'no'
                          ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Haben Sie Fotos des Produkts/Mangels?
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateFormData('photosAvailable', 'yes')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.photosAvailable === 'yes'
                          ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => updateFormData('photosAvailable', 'no')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.photosAvailable === 'no'
                          ? 'bg-purple-600/20 border-purple-600 text-purple-400'
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
                <h3 className="text-lg font-semibold text-white mb-4">Kommunikationsverlauf mit dem Verkäufer</h3>
                {formData.communications.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Dokumentieren Sie Ihre Kommunikation mit dem Verkäufer
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
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
                        />
                        <select
                          value={comm.type}
                          onChange={(e) => updateCommunication(index, 'type', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
                        >
                          <option value="">Typ...</option>
                          <option value="email">E-Mail</option>
                          <option value="phone">Telefon</option>
                          <option value="in-person">Persönlich</option>
                          <option value="letter">Brief</option>
                          <option value="chat">Chat</option>
                        </select>
                      </div>
                      <textarea
                        value={comm.content}
                        onChange={(e) => updateCommunication(index, 'content', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none resize-none"
                        placeholder="Zusammenfassung der Kommunikation..."
                      />
                    </div>
                  ))
                )}
                <button
                  onClick={addCommunication}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-purple-600 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Kontakt hinzufügen
                </button>
              </div>

              {/* Witnesses */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Zeugen</h3>
                {formData.witnesses.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Gibt es Personen, die das Problem bestätigen können?
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
                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={witness.name}
                          onChange={(e) => updateWitness(index, 'name', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={witness.contact}
                          onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
                          placeholder="Kontakt (Telefon/E-Mail)"
                        />
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={addWitness}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-purple-600 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-5 w-5" />
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
                  Gewünschte Ergebnisse (Mehrfachauswahl möglich) <span className="text-purple-400">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'full-refund', label: 'Vollständige Rückerstattung (Full Refund)' },
                    { value: 'partial-refund', label: 'Teilweise Rückerstattung (Partial Refund)' },
                    { value: 'replacement', label: 'Ersatzlieferung (Replacement)' },
                    { value: 'repair', label: 'Reparatur (Repair)' },
                    { value: 'price-reduction', label: 'Preisminderung (Price Reduction)' },
                    { value: 'contract-cancellation', label: 'Vertragskündigung (Cancel Contract)' },
                    { value: 'damages', label: 'Schadensersatz (Damages)' },
                    { value: 'apology', label: 'Entschuldigung (Apology)' }
                  ].map((outcome) => (
                    <button
                      key={outcome.value}
                      onClick={() => toggleArrayField('desiredOutcome', outcome.value)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        formData.desiredOutcome.includes(outcome.value)
                          ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.desiredOutcome.includes(outcome.value)
                            ? 'bg-purple-600 border-purple-600'
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

              {(formData.desiredOutcome.includes('full-refund') || formData.desiredOutcome.includes('partial-refund')) && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gewünschter Rückerstattungsbetrag
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.refundAmount}
                      onChange={(e) => updateFormData('refundAmount', e.target.value)}
                      className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                      placeholder="199.99"
                    />
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  </div>
                </div>
              )}

              {formData.desiredOutcome.includes('replacement') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ersatzpräferenz
                  </label>
                  <textarea
                    value={formData.replacementPreference}
                    onChange={(e) => updateFormData('replacementPreference', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                    placeholder="Möchten Sie dasselbe Produkt oder ein alternatives Modell?"
                  />
                </div>
              )}

              {formData.desiredOutcome.includes('damages') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Zusätzliche Schäden / Folgeschäden
                  </label>
                  <textarea
                    value={formData.additionalDamages}
                    onChange={(e) => updateFormData('additionalDamages', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                    placeholder="Beschreiben Sie zusätzliche Schäden, die durch den Mangel entstanden sind..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Zusätzliche Anmerkungen
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
                  placeholder="Gibt es noch etwas, das wir wissen sollten?"
                />
              </div>

              {/* Summary Preview */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Zusammenfassung</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Produkt: </span>
                      <span className="text-white font-medium">{formData.productName || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Store className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Verkäufer: </span>
                      <span className="text-white font-medium">{formData.seller || 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Euro className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Kaufpreis: </span>
                      <span className="text-white font-medium">{formData.purchasePrice ? `${formData.purchasePrice} €` : 'Nicht angegeben'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
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
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
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
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 w-5" />
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
              <strong className="text-yellow-200">Hinweis:</strong> Als Verbraucher haben Sie umfassende Rechte nach dem BGB. Wir helfen Ihnen, diese durchzusetzen. Bewahren Sie alle Kaufbelege und Kommunikation auf.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NewCaseConsumer
