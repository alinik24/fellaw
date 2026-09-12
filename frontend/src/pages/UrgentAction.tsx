
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Mic,
  Eye,
  Car,
  AlertTriangle,
  Phone,
  Camera,
  Users,
  MapPin,
  Globe,
  EyeOff,
  FileText,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Emergency action surface. Honest-state policy (fellaw-ui-ux rule 6):
 * quick tools that are not yet backed by a live contract show what they
 * WILL do and their real status — they never claim an action happened.
 * Local state (timer, completed checklist items) is real behavior.
 */
const UrgentAction = () => {
  const { type } = useParams<{ type: string }>();
  const { language } = useLanguage();
  const de = language === 'de';
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [plannedTool, setPlannedTool] = useState<{ label: string; detail: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    // Show the rights disclaimer after the first moments settle.
    const disclaimerTimer = setTimeout(() => setShowDisclaimer(true), 5000);
    return () => {
      clearInterval(timer);
      clearTimeout(disclaimerTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const T = {
    active: de ? 'NOTFALL AKTIV' : 'EMERGENCY ACTIVE',
    aiAssistant: de ? 'KI-RECHTSASSISTENT' : 'AI LEGAL ASSISTANT',
    micHint: de ? 'Sprachführung ist noch nicht verfügbar — nutzen Sie die Checkliste unten.' : 'Voice guidance is not available yet — use the checklist below.',
    planTitle: de ? 'Sofort-Checkliste' : 'Smart Action Plan',
    completed: de ? '✓ Erledigt' : '✓ Completed',
    finishCta: de ? 'Abschließen & dokumentieren' : 'Complete Emergency Response & Document',
    plannedTitle: de ? 'Noch nicht verfügbar' : 'Not available yet',
    understand: de ? 'Verstanden' : 'I Understand & Acknowledge',
    disclaimerTitle: de ? 'Wichtiger rechtlicher Hinweis' : 'Important Legal Disclaimer',
  };

  const titles: Record<string, { de: string; en: string }> = {
    'police-interaction': { de: 'Schutz bei Polizeikontrolle', en: 'Police Encounter Protection' },
    'car-accident': { de: 'Unfall-Dokumentation', en: 'Car Accident Response' },
    'assault-violence': { de: 'Schutzprotokoll nach Übergriff', en: 'Assault Protection Protocol' },
    'workplace-harassment': { de: 'Vorfall-Dokumentation am Arbeitsplatz', en: 'Workplace Incident Documentation' },
    'housing-eviction': { de: 'Schutz Ihrer Wohnrechte', en: 'Housing Rights Protection' },
    'child-custody': { de: 'Sorgerechts-Notfall', en: 'Child Custody Emergency' },
    'immigration-detention': { de: 'Schutz Ihrer Aufenthaltsrechte', en: 'Immigration Rights Protection' },
    'wrongful-arrest': { de: 'Schutz bei Festnahme', en: 'Arrest Rights Protection' },
    'cyber-harassment': { de: 'Dokumentation Cyber-Delikte', en: 'Cyber Crime Documentation' },
    'voice': { de: 'KI-Situationsanalyse', en: 'AI Situation Analysis' },
  };
  const title = (titles[type || '']?.[de ? 'de' : 'en']) || (de ? 'Notfall-Rechtshilfe' : 'Emergency Legal Response');

  const guidance: Record<string, { de: string; en: string }> = {
    'police-interaction': {
      de: 'Ruhig bleiben, Hände sichtbar. Sie haben das Recht zu schweigen und das Recht auf einen Anwalt. Stimmen Sie Durchsuchungen ohne Durchsuchungsbeschluss nicht zu.',
      en: 'Stay calm and keep your hands visible. You have the right to remain silent and the right to an attorney. Do not consent to searches without a warrant.',
    },
    'car-accident': {
      de: 'Sichern Sie zuerst die Unfallstelle und bringen Sie sich in Sicherheit. Prüfen Sie Verletzungen und rufen Sie bei Bedarf die 112. Kein Schuldeingeständnis.',
      en: 'First, ensure your safety and move to a safe location if possible. Check for injuries and call emergency services if needed. Do not admit fault.',
    },
    'assault-violence': {
      de: 'Ihre Sicherheit hat Vorrang. Bei akuter Gefahr rufen Sie die 110. Dokumentieren Sie alles, sobald es sicher ist.',
      en: 'Your safety is the priority. If you are in immediate danger, call 110. Document everything when it is safe to do so.',
    },
    'workplace-harassment': {
      de: 'Dokumentieren Sie den Vorfall sofort mit Datum, Uhrzeit, Ort und Zeugen. Bewahren Sie alle Kommunikationswege auf.',
      en: 'Document the incident immediately with specific details including date, time, location, and witnesses. Keep records of all communications.',
    },
    'housing-eviction': {
      de: 'Das deutsche Mietrecht bietet starken Schutz. Dokumentieren Sie alle Schreiben. Auch im Räumungsverfahren haben Sie Rechte.',
      en: 'German tenant law provides strong protections. Document all notices and communications. You have rights even during eviction proceedings.',
    },
    'child-custody': {
      de: 'Das Kindeswohl steht im Vordergrund. Dokumentieren Sie alle Kontakte und halten Sie Vereinbarungen strikt ein.',
      en: 'Child welfare is paramount. Document all interactions and ensure any custody agreements are followed strictly.',
    },
    'immigration-detention': {
      de: 'Sie haben Rechte — unabhängig von Ihrem Aufenthaltsstatus. Sie können einen Dolmetscher und Ihre Botschaft verlangen.',
      en: 'You have rights regardless of your immigration status. You can request an interpreter and contact your embassy.',
    },
    'wrongful-arrest': {
      de: 'Sagen Sie klar, dass Sie Durchsuchungen nicht zustimmen. Fragen Sie, ob Sie frei sind zu gehen. Verlangen Sie sofort einen Anwalt.',
      en: 'Clearly state you do not consent to searches. Ask if you are free to leave. Request a lawyer immediately.',
    },
    'cyber-harassment': {
      de: 'Sichern Sie sofort alle digitalen Beweise. Machen Sie Screenshots, bevor Inhalte gelöscht oder verändert werden können.',
      en: 'Preserve all digital evidence immediately. Take screenshots before the content can be deleted or modified.',
    },
    'voice': {
      de: 'Ich verstehe Ihre Situation. Die Sprachführung ist noch in Entwicklung — nutzen Sie die Checkliste für konkrete Schritte.',
      en: 'I understand your situation. Voice guidance is still in development — use the checklist for concrete steps.',
    },
  };
  const guidanceText = (guidance[type || '']?.[de ? 'de' : 'en']) || (de
    ? 'Der KI-Assistent analysiert Ihre Situation und liefert in Kürze konkrete Schritte.'
    : 'AI legal assistant is analyzing your situation and will provide specific guidance momentarily.');

  // Checklist items are local, honest behavior — completing them is real state.
  const smartActions: Record<string, Array<{ id: string; label: string; detail: string; icon: any }>> = {
    'police-interaction': de ? [
      { id: 'stay-calm', label: 'Ruhig bleiben, Hände sichtbar', detail: 'Keine hastigen Bewegungen', icon: Eye },
      { id: 'rights-card', label: 'Rechtekarte zeigen', detail: 'Formulierungen in mehreren Sprachen', icon: FileText },
      { id: 'log-officer', label: 'Einsatzkräfte notieren', detail: 'Dienstnummer, Kennzeichen, Uhrzeit', icon: Shield },
      { id: 'calendar', label: 'Kalendereintrag', detail: 'Vorfall in eigenen Kalender übernehmen', icon: Clock },
    ] : [
      { id: 'stay-calm', label: 'Stay Calm & Hands Visible', detail: 'Avoid sudden movements', icon: Eye },
      { id: 'rights-card', label: 'Show Rights Card', detail: 'Legal phrasing in multiple languages', icon: FileText },
      { id: 'log-officer', label: 'Log Officer Info', detail: 'Badge #, vehicle plate, and time', icon: Shield },
      { id: 'calendar', label: 'Adjust My Calendar', detail: 'Add interaction details to personal calendar', icon: Clock },
    ],
    'car-accident': de ? [
      { id: 'safe-location', label: 'Sicherer Ort', detail: 'Gefahrenblinkel, Warnweste, Unfallstelle sichern', icon: Car },
      { id: 'log-injuries', label: 'Verletzungen erfassen', detail: 'Selbstcheck für die Dokumentation', icon: AlertTriangle },
      { id: 'exchange-info', label: 'Daten austauschen (wenn sicher)', detail: 'Kontaktdaten und Zeugenaussagen', icon: Users },
      { id: 'tell-side', label: 'Sachverhalt schildern', detail: 'Für eine vollständige Dokumentation', icon: Mic },
    ] : [
      { id: 'safe-location', label: 'Move to Safe Location', detail: 'Hazards on, secure the scene', icon: Car },
      { id: 'log-injuries', label: 'Log Injuries', detail: 'Self-assessment checklist', icon: AlertTriangle },
      { id: 'exchange-info', label: 'Exchange Info (If Safe)', detail: 'Contact details and witness statements', icon: Users },
      { id: 'tell-side', label: 'Tell My Side', detail: 'Narrate incident for documentation', icon: Mic },
    ],
    'assault-violence': de ? [
      { id: 'document', label: 'Details dokumentieren', detail: 'Fotos von Verletzungen und Umgebung', icon: Camera },
      { id: 'describe-attacker', label: 'Person beschreiben', detail: 'Erscheinung und Merkmale', icon: Eye },
      { id: 'witnesses', label: 'Zeugen erfassen', detail: 'Kontaktdaten möglicher Zeugen', icon: Users },
    ] : [
      { id: 'document', label: 'Document Details', detail: 'Photo capture of injuries and environment', icon: Camera },
      { id: 'describe-attacker', label: 'Describe Attacker', detail: 'Physical descriptions and features', icon: Eye },
      { id: 'witnesses', label: 'Collect Witness Info', detail: 'Contact information of witnesses', icon: Users },
    ],
  };
  const actions = smartActions[type || ''] || [];

  // Quick tools: NOT yet live contracts. Opening one shows an honest
  // planned-status dialog instead of claiming it executed.
  const quickTools: Record<string, { label: string; detail: string; icon: any }> = {
    'call-assist': de
      ? { label: 'Anruf-Begleitung', detail: 'Wird Sie künftig beim Notruf führen (110/112 wählen Sie selbst). Status: geplant.', icon: Phone }
      : { label: 'Smart Call Assist', detail: 'Will guide you through calling emergency services in a future version (you dial 110/112 yourself today). Status: planned.', icon: Phone },
    record: de
      ? { label: 'Foto/Video sichern', detail: 'Nutzen Sie jetzt die Kamera-App Ihres Geräts. Direkte Integration: geplant.', icon: Camera }
      : { label: 'Capture Photo/Video', detail: 'Use your device camera app now. In-app capture: planned.', icon: Camera },
    translation: de
      ? { label: 'Sofortübersetzung', detail: 'Mehrsprachige Rechtstexte sind verfügbar; Live-Dolmetschen: geplant.', icon: Globe }
      : { label: 'Instant Translation', detail: 'Multilingual rights cards are available; live interpreting: planned.', icon: Globe },
    'auto-report': de
      ? { label: 'Bericht erzeugen', detail: 'Automatischer Vorfallsbericht aus Ihren Notizen: geplant. Nutzen Sie zwischenzeitlich „Abschließen & dokumentieren“.', icon: FileText }
      : { label: 'Auto-Generate Report', detail: 'Automatic incident report from your notes: planned. Use “Complete & document” in the meantime.', icon: FileText },
    'alert-contacts': de
      ? { label: 'Kontakte warnen', detail: 'Benachrichtigung Ihrer Notfallkontakte: geplant. Rufen Sie bei Gefahr selbst die 110.', icon: Users }
      : { label: 'Alert My Contacts', detail: 'Notifying your emergency contacts: planned. Call 110 yourself if in danger.', icon: Users },
    'safe-zone': de
      ? { label: 'Sichere Orte', detail: 'Kartensuche sicherer Orte: geplant. Polizei/Notdienste erreichen Sie unter 110/112.', icon: MapPin }
      : { label: 'Safe Zone Finder', detail: 'Map search for safe places: planned. Police/emergency services: 110/112.', icon: MapPin },
    'hidden-mode': de
      ? { label: 'Stiller Modus', detail: 'Verdeckter Notfallmodus: geplant.', icon: EyeOff }
      : { label: 'Hidden Emergency Mode', detail: 'Discreet emergency mode: planned.', icon: EyeOff },
  };
  const quickOrder = ['call-assist', 'record'];
  if (type === 'police-interaction') quickOrder.push('translation', 'auto-report');
  if (type === 'car-accident') quickOrder.push('alert-contacts');
  if (type === 'assault-violence') quickOrder.push('safe-zone', 'hidden-mode');

  const handleActionComplete = (actionId: string) => {
    if (!completedActions.includes(actionId)) {
      setCompletedActions([...completedActions, actionId]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency header — semantic danger color, no decorative gradient */}
      <div className="bg-destructive text-destructive-foreground p-4" role="status">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" aria-hidden="true" />
              <span className="font-mono" aria-label={de ? `Verstrichene Zeit ${formatTime(elapsedTime)}` : `Elapsed time ${formatTime(elapsedTime)}`}>
                {formatTime(elapsedTime)}
              </span>
            </div>
            <div className="bg-black/20 px-3 py-1 rounded-full text-sm font-medium">
              {T.active}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Title & guidance */}
        <Card className="bg-warning/10 border-2 border-warning rounded-lg p-6 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Card className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mic className="h-6 w-6 text-primary mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-medium text-sm text-primary mb-2">{T.aiAssistant}</div>
                  <p className="text-sm text-foreground leading-relaxed">{guidanceText}</p>
                  <p className="text-xs text-muted-foreground mt-2">{T.micHint}</p>
                </div>
              </div>
            </Card>
          </CardContent>
        </Card>

        {/* Checklist — real local behavior */}
        {actions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">{T.planTitle}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actions.map((action) => {
                const done = completedActions.includes(action.id);
                return (
                  <Button
                    key={action.id}
                    size="lg"
                    variant={done ? 'secondary' : 'default'}
                    aria-pressed={done}
                    className="w-full h-auto py-6 flex flex-col items-center justify-center text-center leading-tight"
                    onClick={() => handleActionComplete(action.id)}
                    disabled={done}
                  >
                    <action.icon className="h-8 w-8 mb-2" aria-hidden="true" />
                    <span className="font-medium">{action.label}</span>
                    <span className="text-xs mt-1 font-normal opacity-80">{action.detail}</span>
                    {done && <span className="text-xs mt-1">{T.completed}</span>}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4"
            asChild
          >
            <a href={`/urgent/summary/${type}`}>
              {T.finishCta}
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* Fixed bottom quick-action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickOrder.map((id) => {
              const tool = quickTools[id];
              if (!tool) return null;
              return (
                <Button
                  key={id}
                  variant={id === 'call-assist' ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex flex-col items-center py-3 px-2 h-auto"
                  onClick={() => setPlannedTool({ label: tool.label, detail: tool.detail })}
                >
                  <tool.icon className="h-5 w-5 mb-1" aria-hidden="true" />
                  <span className="text-xs leading-tight">{tool.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Honest planned-status dialog */}
      <AlertDialog open={plannedTool !== null} onOpenChange={(open) => { if (!open) setPlannedTool(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{plannedTool?.label} — {T.plannedTitle}</AlertDialogTitle>
            <AlertDialogDescription>{plannedTool?.detail}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setPlannedTool(null)}>{de ? 'Schließen' : 'Close'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legal disclaimer dialog */}
      <AlertDialog open={showDisclaimer && !disclaimerAcknowledged} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{T.disclaimerTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {de ? (
                <>
                  <p><strong>Sie haben das Recht zu schweigen und das Recht auf einen Anwalt.</strong> Diese App bietet allgemeine rechtliche Orientierung und keine Rechtsberatung.</p>
                  <p>In Deutschland haben Sie bei Polizeikontakten konkrete Grundrechte — einschließlich des Rechts, Durchsuchungen ohne Beschluss zu verweigern, und des Rechts, einen Anwalt zu kontaktieren.</p>
                  <p>Diese App hilft beim Dokumentieren und bei der Orientierung. Folgen Sie für Ihre Sicherheit immer den Anweisungen der Einsatzkräfte.</p>
                </>
              ) : (
                <>
                  <p><strong>You have the right to remain silent and the right to an attorney.</strong> This app provides general legal guidance and does not constitute legal advice.</p>
                  <p>In Germany, you have specific constitutional rights during police interactions, including the right to refuse searches without a warrant and the right to contact a lawyer.</p>
                  <p>This app is designed to help you document events and understand your rights, but always follow the instructions of law enforcement for your safety.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setDisclaimerAcknowledged(true);
                setShowDisclaimer(false);
              }}
            >
              {T.understand}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UrgentAction;
