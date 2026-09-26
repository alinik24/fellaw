
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Car,
  AlertTriangle,
  Briefcase,
  Home,
  Baby,
  Globe,
  Gavel,
  Laptop,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

/** Bilingual emergency-type catalogue — single source, keyed by locale. */
const EMERGENCY_TYPES = {
  de: [
    { id: 'police-interaction', icon: Shield, title: 'Polizeikontrolle / Festnahme', description: 'Verkehrskontrollen, Identitätsprüfungen oder Festnahmen — sofortige Rechteabsicherung.', features: ['Sofort-Rechtekarten', 'Dokumentation von Einsatzkräften', 'Echtzeit-Rechtsleitfaden', 'Notfallkontakte aktivieren'] },
    { id: 'car-accident', icon: Car, title: 'Verkehrsunfall', description: 'Unfälle, die sofortige Dokumentation und rechtlichen Schutz erfordern.', features: ['Unfallort-Dokumentationsleitfaden', 'Versicherungsansprüge vorbereiten', 'Medizinische Abklärung', 'Zeugendaten erfassen'] },
    { id: 'assault-violence', icon: AlertTriangle, title: 'Übergriffe / Gewalt', description: 'Körperliche Übergriffe, häusliche Gewalt oder Bedrohungen — dringende rechtliche Intervention.', features: ['Beweismittelsicherung', 'Sichere Orte finden', 'Koordination mit Notdiensten', 'Vertrauliche Dokumentation'] },
    { id: 'workplace-harassment', icon: Briefcase, title: 'Belästigung am Arbeitsplatz', description: 'Fehlverhalten, Belästigung oder Diskriminierung am Arbeitsplatz — schnelles Handeln nötig.', features: ['Vorfall-Dokumentation', 'Kommunikation mit HR', 'Beweissicherungs-Protokolle', 'Anonyme Meldeoptionen'] },
    { id: 'housing-eviction', icon: Home, title: 'Wohnen / Räumung', description: 'Unrechtmäßige Räumung, Wohnungsstreit oder Verletzung von Mieterrechten.', features: ['Mieterrechte prüfen', 'Räumungsordnung analysieren', 'Notunterkunft-Ressourcen', 'Rechtliche Dokumentationshilfe'] },
    { id: 'child-custody', icon: Baby, title: 'Sorgerecht / Familienkonflikt', description: 'Sorgerechtsstreit, familiäre Konflikte oder familiengerichtliche Notfälle.', features: ['Sorgerechtsdokumente analysieren', 'Kindeswohl dokumentieren', 'Einstweilige Anordnungen', 'Familienmediation'] },
    { id: 'immigration-detention', icon: Globe, title: 'Aufenthalt / Grenzgewahrsam', description: 'Aufenthaltsrechtliche Maßnahmen, Grenzprobleme oder Visumskomplikationen.', features: ['Rechte in mehreren Sprachen', 'Kontakte zu Botschaften', 'Unterlagen-Anforderungen', 'Netzwerk Aufenthaltsrecht'] },
    { id: 'wrongful-arrest', icon: Gavel, title: 'Unrechtmäßige Verhaftung / Durchsuchung', description: 'Rechtswidrige Festnahme, unzulässige Durchsuchung oder Grundrechtsverletzungen.', features: ['Grundrechtskarten', 'Durchsuchungs-Protokolle', 'Beweismittelsicherung', 'Strafverteidiger-Netzwerk'] },
    { id: 'cyber-harassment', icon: Laptop, title: 'Cyber-Belästigung / Erpressung', description: 'Online-Bedrohung, Cybermobbing, Erpressung oder digitales Stalking.', features: ['Digitale Beweise sichern', 'Plattform-Meldeleitfäden', 'Datenschutz-Tools', 'Cyberkriminalität dokumentieren'] },
  ],
  en: [
    { id: 'police-interaction', icon: Shield, title: 'Police Stop / Detainment', description: 'Traffic stops, identity checks, or detention situations requiring immediate rights protection.', features: ['Instant rights assertion cards', 'Officer information logging', 'Real-time legal guidance', 'Emergency contact alerts'] },
    { id: 'car-accident', icon: Car, title: 'Car Accident', description: 'Vehicle collisions requiring immediate documentation and legal protection.', features: ['Scene documentation guide', 'Insurance claim preparation', 'Medical assessment prompts', 'Witness information capture'] },
    { id: 'assault-violence', icon: AlertTriangle, title: 'Assault / Violence', description: 'Physical assault, domestic violence, or threats requiring urgent legal intervention.', features: ['Evidence preservation guide', 'Safe location finder', 'Emergency services coordination', 'Confidential documentation'] },
    { id: 'workplace-harassment', icon: Briefcase, title: 'Workplace Harassment / Abuse', description: 'Workplace misconduct, harassment, or discrimination requiring immediate action.', features: ['Incident documentation tools', 'HR communication guidance', 'Evidence collection protocols', 'Anonymous reporting options'] },
    { id: 'housing-eviction', icon: Home, title: 'Housing / Eviction', description: 'Unlawful eviction, housing disputes, or tenant rights violations.', features: ['Tenant rights verification', 'Eviction notice analysis', 'Emergency housing resources', 'Legal documentation support'] },
    { id: 'child-custody', icon: Baby, title: 'Child Custody / Domestic Conflict', description: 'Child custody disputes, domestic conflicts, or family court emergencies.', features: ['Custody document analysis', 'Child welfare documentation', 'Emergency court filings', 'Family mediation resources'] },
    { id: 'immigration-detention', icon: Globe, title: 'Immigration / Border Detainment', description: 'Immigration enforcement, border issues, or visa complications.', features: ['Rights in multiple languages', 'Embassy contact assistance', 'Documentation requirements', 'Immigration lawyer network'] },
    { id: 'wrongful-arrest', icon: Gavel, title: 'Wrongful Arrest / Search', description: 'Unlawful detention, improper searches, or constitutional rights violations.', features: ['Constitutional rights cards', 'Search consent protocols', 'Evidence preservation', 'Criminal defense network'] },
    { id: 'cyber-harassment', icon: Laptop, title: 'Cyber Harassment / Blackmail', description: 'Online threats, cyberbullying, blackmail, or digital stalking.', features: ['Digital evidence capture', 'Platform reporting guides', 'Privacy protection tools', 'Cybercrime documentation'] },
  ],
} as const;

const COPY = {
  de: {
    back: 'Zurück',
    title: 'Notfall-Rechtshilfe',
    subtitle: 'Wählen Sie Ihre Situation — Sie erhalten sofort konkrete Schritte, keine Warteschleife.',
    featuresLabel: 'Wichtigste Funktionen:',
    cta: 'Jetzt Hilfe erhalten',
    notFound: 'Ihre Situation ist nicht dabei?',
    notFoundBody: 'Schildern Sie dem Assistenten, was passiert ist.',
    assistant: 'Mit dem KI-Assistenten sprechen',
  },
  en: {
    back: 'Back',
    title: 'Emergency Legal Assistance',
    subtitle: 'Pick your situation — you get concrete steps immediately, no waiting room.',
    featuresLabel: 'Key Features:',
    cta: 'Get Help Now',
    notFound: "Can't Find Your Situation?",
    notFoundBody: 'Tell the assistant what happened.',
    assistant: 'Talk to AI Assistant',
  },
} as const;

const UrgentSelect = () => {
  const { language } = useLanguage();
  const de = language === 'de';
  const copy = de ? COPY.de : COPY.en;
  const emergencyTypes = de ? EMERGENCY_TYPES.de : EMERGENCY_TYPES.en;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Bar */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {copy.back}
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{copy.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{copy.subtitle}</p>
        </div>

        {/* Emergency Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {emergencyTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card key={type.id} className="group transition-all duration-200 hover:shadow-lg hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copy.featuresLabel}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    {type.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <span className="text-primary mr-2" aria-hidden="true">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/urgent/action/${type.id}`}>
                      {copy.cta}
                      <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Not covered fallback */}
        <div className="text-center mb-16">
          <h3 className="text-xl font-semibold mb-2">{copy.notFound}</h3>
          <p className="text-muted-foreground mb-4">{copy.notFoundBody}</p>
          <Button asChild>
            <Link to="/">
              <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
              {copy.assistant}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UrgentSelect;