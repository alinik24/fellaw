
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

const UrgentSelect = () => {
  const emergencyTypes = [
    {
      id: 'police-interaction',
      title: 'Police Stop / Detainment',
      icon: Shield,
      description: 'Traffic stops, identity checks, or detention situations requiring immediate rights protection.',
      features: [
        'Instant rights assertion cards',
        'Officer information logging',
        'Real-time legal guidance',
        'Emergency contact alerts'
      ]
    },
    {
      id: 'car-accident',
      title: 'Car Accident',
      icon: Car,
      description: 'Vehicle collisions requiring immediate documentation and legal protection.',
      features: [
        'Scene documentation guide',
        'Insurance claim preparation',
        'Medical assessment prompts',
        'Witness information capture'
      ]
    },
    {
      id: 'assault-violence',
      title: 'Assault / Violence',
      icon: AlertTriangle,
      description: 'Physical assault, domestic violence, or threats requiring urgent legal intervention.',
      features: [
        'Evidence preservation guide',
        'Safe location finder',
        'Emergency services coordination',
        'Confidential documentation'
      ]
    },
    {
      id: 'workplace-harassment',
      title: 'Workplace Harassment / Abuse',
      icon: Briefcase,
      description: 'Workplace misconduct, harassment, or discrimination requiring immediate action.',
      features: [
        'Incident documentation tools',
        'HR communication guidance',
        'Evidence collection protocols',
        'Anonymous reporting options'
      ]
    },
    {
      id: 'housing-eviction',
      title: 'Housing / Eviction',
      icon: Home,
      description: 'Unlawful eviction, housing disputes, or tenant rights violations.',
      features: [
        'Tenant rights verification',
        'Eviction notice analysis',
        'Emergency housing resources',
        'Legal documentation support'
      ]
    },
    {
      id: 'child-custody',
      title: 'Child Custody / Domestic Conflict',
      icon: Baby,
      description: 'Child custody disputes, domestic conflicts, or family court emergencies.',
      features: [
        'Custody document analysis',
        'Child welfare documentation',
        'Emergency court filings',
        'Family mediation resources'
      ]
    },
    {
      id: 'immigration-detention',
      title: 'Immigration / Border Detainment',
      icon: Globe,
      description: 'Immigration enforcement, border issues, or visa complications.',
      features: [
        'Rights in multiple languages',
        'Embassy contact assistance',
        'Documentation requirements',
        'Immigration lawyer network'
      ]
    },
    {
      id: 'wrongful-arrest',
      title: 'Wrongful Arrest / Search',
      icon: Gavel,
      description: 'Unlawful detention, improper searches, or constitutional rights violations.',
      features: [
        'Constitutional rights cards',
        'Search consent protocols',
        'Evidence preservation',
        'Criminal defense network'
      ]
    },
    {
      id: 'cyber-harassment',
      title: 'Cyber Harassment / Blackmail',
      icon: Laptop,
      description: 'Online threats, cyberbullying, blackmail, or digital stalking.',
      features: [
        'Digital evidence capture',
        'Platform reporting guides',
        'Privacy protection tools',
        'Cybercrime documentation'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Bar */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Emergency Legal Assistance</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Select your emergency situation below for immediate legal guidance and protection. 
            Our AI will provide instant, situation-specific assistance to protect your rights.
          </p>
        </div>

        {/* Emergency Type Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {emergencyTypes.map((emergency) => (
            <Link key={emergency.id} to={`/urgent/action/${emergency.id}`} className="group">
              <Card className="bg-background border-2 border-border rounded-lg p-6 hover:border-red-500 hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="pb-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg w-fit mb-4">
                    <emergency.icon className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold group-hover:text-red-600 transition-colors">
                    {emergency.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {emergency.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-sm">Key Features:</h4>
                    <ul className="space-y-1">
                      {emergency.features.map((feature, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start">
                          <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center text-red-600 font-medium">
                    <span className="text-sm">Get Help Now</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* AI Voice Assistant Option */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <Mic className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Can't Find Your Situation?</h3>
              <p className="text-muted-foreground mb-6">
                Our AI can understand and respond to any emergency through voice interaction.
                Describe your situation in your own words.
              </p>
              <Button variant="outline" asChild>
                <Link to="/urgent/action/voice">
                  <Mic className="h-4 w-4 mr-2" />
                  Talk to AI Assistant
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UrgentSelect;
