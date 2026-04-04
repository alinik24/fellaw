
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
  Shield 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const UrgentAction = () => {
  const { type } = useParams<{ type: string }>();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Show disclaimer after 5 seconds
    const disclaimerTimer = setTimeout(() => {
      setShowDisclaimer(true);
    }, 5000);

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

  const getEmergencyTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      'police-interaction': 'Police Encounter Protection',
      'car-accident': 'Car Accident Response',
      'assault-violence': 'Assault Protection Protocol',
      'workplace-harassment': 'Workplace Incident Documentation',
      'housing-eviction': 'Housing Rights Protection',
      'child-custody': 'Child Custody Emergency',
      'immigration-detention': 'Immigration Rights Protection',
      'wrongful-arrest': 'Arrest Rights Protection',
      'cyber-harassment': 'Cyber Crime Documentation',
      'voice': 'AI Situation Analysis'
    };
    return titles[type] || 'Emergency Legal Response';
  };

  const getAIGuidance = (type: string) => {
    const guidance: { [key: string]: string } = {
      'police-interaction': 'Stay calm and keep your hands visible. You have the right to remain silent and the right to an attorney. Do not consent to searches without a warrant.',
      'car-accident': 'First, ensure your safety and move to a safe location if possible. Check for injuries and call emergency services if needed. Do not admit fault.',
      'assault-violence': 'Your safety is the priority. If you are in immediate danger, call 110. Document everything when it is safe to do so.',
      'workplace-harassment': 'Document the incident immediately with specific details including date, time, location, and witnesses. Keep records of all communications.',
      'housing-eviction': 'German tenant law provides strong protections. Document all notices and communications. You have rights even during eviction proceedings.',
      'child-custody': 'Child welfare is paramount. Document all interactions and ensure any custody agreements are followed strictly.',
      'immigration-detention': 'You have rights regardless of your immigration status. You can request an interpreter and contact your embassy.',
      'wrongful-arrest': 'Clearly state you do not consent to searches. Ask if you are free to leave. Request a lawyer immediately.',
      'cyber-harassment': 'Preserve all digital evidence immediately. Take screenshots before the content can be deleted or modified.',
      'voice': 'I understand your situation. Let me provide specific guidance based on what you\'ve described. Tap the microphone to continue our conversation.'
    };
    return guidance[type] || 'AI legal assistant is analyzing your situation and will provide specific guidance momentarily.';
  };

  const getSmartActions = (type: string) => {
    const actions: { [key: string]: Array<{id: string, label: string, detail: string, icon: any}> } = {
      'police-interaction': [
        { id: 'stay-calm', label: 'Stay Calm & Hands Visible', detail: 'Avoid sudden movements, place hands on steering wheel', icon: Eye },
        { id: 'rights-card', label: 'Show Rights Card', detail: 'Display digital card with legal phrasing in multiple languages', icon: FileText },
        { id: 'log-officer', label: 'Log Officer Info', detail: 'Quick input of badge #, vehicle plate, and time', icon: Shield },
        { id: 'calendar', label: 'Adjust My Calendar', detail: 'Add interaction details to personal calendar', icon: Clock }
      ],
      'car-accident': [
        { id: 'safe-location', label: 'Move to Safe Location', detail: 'Safety assessment, move vehicle, activate hazards', icon: Car },
        { id: 'log-injuries', label: 'Log Injuries', detail: 'Self-assessment checklist for documentation', icon: AlertTriangle },
        { id: 'exchange-info', label: 'Exchange Info (If Safe)', detail: 'Contact details and witness statements', icon: Users },
        { id: 'tell-side', label: 'Tell My Side', detail: 'Narrate incident for comprehensive documentation', icon: Mic }
      ],
      'assault-violence': [
        { id: 'document', label: 'Document Details', detail: 'Photo capture of injuries and environment', icon: Camera },
        { id: 'describe-attacker', label: 'Describe Attacker', detail: 'Physical descriptions and identifying features', icon: Eye },
        { id: 'witnesses', label: 'Collect Witness Info', detail: 'Contact information of potential witnesses', icon: Users }
      ]
    };
    return actions[type] || [];
  };

  const getQuickActions = (type: string) => {
    const baseActions = [
      { id: 'call-assist', label: 'Smart Call Assist', icon: Phone, variant: 'destructive' as const },
      { id: 'record', label: 'Record Photo/Video', icon: Camera, variant: 'default' as const }
    ];

    const typeSpecificActions: { [key: string]: Array<{id: string, label: string, icon: any, variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'}> } = {
      'police-interaction': [
        { id: 'translation', label: 'Instant Translation', icon: Globe, variant: 'default' },
        { id: 'auto-report', label: 'Auto-Generate Report', icon: FileText, variant: 'default' }
      ],
      'car-accident': [
        { id: 'alert-contacts', label: 'Alert My Contacts', icon: Users, variant: 'destructive' },
        { id: 'auto-report', label: 'Auto-Generate Report', icon: FileText, variant: 'default' }
      ],
      'assault-violence': [
        { id: 'safe-zone', label: 'Safe Zone Finder', icon: MapPin, variant: 'default' },
        { id: 'hidden-mode', label: 'Hidden Emergency Mode', icon: EyeOff, variant: 'default' }
      ]
    };

    return [...baseActions, ...(typeSpecificActions[type] || [])];
  };

  const handleActionComplete = (actionId: string) => {
    if (!completedActions.includes(actionId)) {
      setCompletedActions([...completedActions, actionId]);
    }
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'call-assist':
        // This would open the call assist modal
        alert('Smart Call Assist: AI-guided emergency services call initiated');
        break;
      case 'record':
        alert('Recording mode activated');
        break;
      case 'alert-contacts':
        alert('Emergency contacts notified with current location');
        break;
      case 'safe-zone':
        alert('Locating nearest safe public areas and police stations');
        break;
      case 'translation':
        alert('Real-time translation activated');
        break;
      case 'hidden-mode':
        alert('Silent emergency mode activated');
        break;
      case 'auto-report':
        alert('Generating preliminary report from collected data');
        break;
      default:
        alert(`${actionId} activated`);
    }
  };

  const smartActions = getSmartActions(type || '');
  const quickActions = getQuickActions(type || '');

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="bg-white/20 dark:bg-gray-800/20 dark:bg-gray-800/20 px-3 py-1 rounded-full text-sm font-medium">
              EMERGENCY ACTIVE
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Emergency Title & AI Guidance */}
        <Card className="bg-orange-50/80 dark:bg-orange-900/30 backdrop-blur-sm border-2 border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-orange-800">
              {getEmergencyTitle(type || '')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mic className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-blue-600 mb-2">AI LEGAL ASSISTANT</div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {getAIGuidance(type || '')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    🎤 Tap microphone in Quick Action bar to speak with AI assistant
                  </p>
                </div>
              </div>
            </Card>
          </CardContent>
        </Card>

        {/* Smart Action Plan */}
        {smartActions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Smart Action Plan</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smartActions.map((action) => (
                <Button
                  key={action.id}
                  size="lg"
                  variant={completedActions.includes(action.id) ? "secondary" : "default"}
                  className="w-full h-auto py-6 flex flex-col items-center justify-center text-center leading-tight hover:shadow-lg"
                  onClick={() => handleActionComplete(action.id)}
                  disabled={completedActions.includes(action.id)}
                >
                  <action.icon className="h-8 w-8 mb-2" />
                  <span className="font-medium">{action.label}</span>
                  {completedActions.includes(action.id) && (
                    <span className="text-xs mt-1">✓ Completed</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Complete Emergency Response Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
            asChild
          >
            <a href={`/urgent/summary/${type}`}>
              Complete Emergency Response & Document
            </a>
          </Button>
        </div>
      </div>

      {/* Fixed Bottom Quick Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-border p-4 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                size="sm"
                className="flex flex-col items-center py-3 px-2 h-auto"
                onClick={() => handleQuickAction(action.id)}
              >
                <action.icon className="h-5 w-5 mb-1" />
                <span className="text-xs leading-tight">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Disclaimer Modal */}
      <AlertDialog open={showDisclaimer && !disclaimerAcknowledged} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Important Legal Disclaimer</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>You have the right to remain silent and the right to an attorney.</strong> 
                This app provides general legal guidance and does not constitute legal advice.
              </p>
              <p>
                In Germany, you have specific constitutional rights during police interactions, 
                including the right to refuse searches without a warrant and the right to contact a lawyer.
              </p>
              <p>
                This app is designed to help you document events and understand your rights, 
                but always follow the instructions of law enforcement for your safety.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setDisclaimerAcknowledged(true);
                setShowDisclaimer(false);
              }}
            >
              I Understand & Acknowledge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UrgentAction;
