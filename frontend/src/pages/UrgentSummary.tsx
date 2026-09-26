
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  Shield,
  Upload,
  AlertTriangle,
  Download,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Emergency summary — honest-state policy:
 * The urgent flow (checklist + guidance) runs locally in the browser.
 * Nothing is transmitted or stored server-side from this flow, so this
 * page shows real next steps instead of fabricated evidence records,
 * invented cost estimates, or simulated downloads.
 */
const UrgentSummary = () => {
  const { type } = useParams<{ type: string }>();
  const { language } = useLanguage();
  const de = language === 'de';

  const titles: Record<string, { de: string; en: string }> = {
    'police-interaction': { de: 'Schritte bei Polizeikontrolle abgeschlossen', en: 'Police Encounter Steps Complete' },
    'car-accident': { de: 'Unfall-Schritte abgeschlossen', en: 'Car Accident Steps Complete' },
    'assault-violence': { de: 'Schritte nach Übergriff abgeschlossen', en: 'Assault Steps Complete' },
    'workplace-harassment': { de: 'Vorfall-Schritte abgeschlossen', en: 'Workplace Incident Steps Complete' },
    'housing-eviction': { de: 'Wohnrechts-Schritte abgeschlossen', en: 'Housing Rights Steps Complete' },
    'child-custody': { de: 'Sorgerechts-Schritte abgeschlossen', en: 'Child Custody Steps Complete' },
    'immigration-detention': { de: 'Aufenthaltsrechts-Schritte abgeschlossen', en: 'Immigration Rights Steps Complete' },
    'wrongful-arrest': { de: 'Festnahme-Schritte abgeschlossen', en: 'Arrest Rights Steps Complete' },
    'cyber-harassment': { de: 'Cyber-Dokumentation abgeschlossen', en: 'Cyber Documentation Steps Complete' },
  };
  const title = titles[type || '']?.[de ? 'de' : 'en'] || (de ? 'Notfall-Schritte abgeschlossen' : 'Emergency Steps Complete');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{title}</h1>
        </div>

        {/* Honest status */}
        <Card className="bg-success/10 border border-success rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {de ? 'Sie haben die Notfall-Schritte durchgearbeitet' : 'You have worked through the emergency steps'}
              </h2>
              <p className="text-muted-foreground">
                {de
                  ? 'Diese Übersicht und die Checkliste liefen lokal in Ihrem Browser. Es wurden keine Daten übertragen oder gespeichert.'
                  : 'This summary and the checklist ran locally in your browser. Nothing was transmitted or stored.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Real next steps — all backed by live routes */}
        <Card className="bg-card border-2 rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">
              {de ? 'Konkrete nächste Schritte' : 'Concrete next steps'}
            </CardTitle>
            <CardDescription>
              {de
                ? 'Jeder Schritt führt zu einer echten Funktion — ohne erfundene Ergebnisse.'
                : 'Every step leads to a real feature — no invented outcomes.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/new-case" className="block">
                <Card className="bg-primary/10 border-primary hover:bg-primary/20 transition-colors">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                    <div>
                      <div className="font-medium text-foreground">{de ? 'Fall anlegen' : 'Create a case'}</div>
                      <div className="text-sm text-muted-foreground">
                        {de ? 'Schilderung optional speicherbar (Konto)' : 'Save your description (account required)'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/find-lawyer" className="block">
                <Card className="bg-success/10 border-success hover:bg-success/20 transition-colors">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-success" aria-hidden="true" />
                    <div>
                      <div className="font-medium text-foreground">{de ? 'Anwalt finden' : 'Find a lawyer'}</div>
                      <div className="text-sm text-muted-foreground">
                        {de ? 'Echte Suche nach Gebiet und Ort' : 'Real search by area and location'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-start space-x-3">
                <Phone className="h-6 w-6 text-destructive mt-1" aria-hidden="true" />
                <div>
                  <div className="font-medium text-foreground">
                    {de ? 'Bei akuter Gefahr' : 'In acute danger'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {de
                      ? 'Polizei: 110 · Rettungsdienst/Feuerwehr: 112. Die App ersetzt keinen Notruf.'
                      : 'Police: 110 · Ambulance/fire: 112. This app does not replace an emergency call.'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Honest limitation notice — replaces fabricated "documentation summary" */}
        <Card className="bg-warning/10 border-2 border-warning rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              {de ? 'Was noch nicht verfügbar ist' : 'What is not available yet'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {de
                ? 'Ehrlich statt erfunden: Diese Funktionen sind geplant, aber noch nicht angeschlossen.'
                : 'Honest instead of invented: these features are planned but not yet connected.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Download className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                {de
                  ? 'Export/Download der Notfall-Dokumentation (derzeit läuft alles lokal im Browser).'
                  : 'Export/download of the emergency documentation (currently everything runs locally in your browser).'}
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                {de
                  ? 'Automatische Fotos/Audio-Aufzeichnung in der App (nutzen Sie zwischenzeitlich Ihre Geräte-Apps).'
                  : 'In-app photo/audio capture (use your device apps in the meantime).'}
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                {de
                  ? 'Automatische Kostenabschätzung — Kosten hängen vom Anwalt und Mandat ab; nutzen Sie die Anwaltsuche für realistische Ansprechpartner.'
                  : 'Automatic cost estimate — costs depend on the lawyer and matter; use lawyer search for realistic contacts.'}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Primary path forward */}
        <Card className="bg-card border-2 rounded-lg p-6">
          <CardHeader>
            <CardTitle className="text-foreground">
              {de ? 'Wie möchten Sie fortfahren?' : 'How would you like to proceed?'}
            </CardTitle>
            <CardDescription>
              {de
                ? 'Ihre Situation jetzt strukturiert weiterführen.'
                : 'Take your situation forward in a structured way.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/new-case">
                {de ? 'Situation schildern & Fall anlegen' : 'Describe your situation & create a case'}
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UrgentSummary;
