
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  Scale,
  CheckCircle,
  ListChecks, 
  Brain, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Phone, 
  FileText, 
  CalendarDays, 
  Handshake, 
  Wallet, 
  Briefcase,
  ExternalLink,
  Target,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const CaseAssessment = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [assessmentStep, setAssessmentStep] = useState<'intake' | 'assessment' | 'options'>('intake');
  const [caseConfirmed, setCaseConfirmed] = useState(false);
  const [scenarioProgress, setScenarioProgress] = useState({ worse: 0, middle: 0, best: 0 });

  // Mock case data based on caseId
  const mockCaseData = {
    legalArea: 'Mietrecht',
    specificProcedure: 'Mieterhöhung',
    caseName: 'Rent Increase Dispute - Apartment Paderborn',
    keyDates: ['Notice Received: 2024-05-15', 'Response Due: 2024-06-15'],
    involvedParties: ['Tenant: You', 'Landlord: Immobilien GmbH Paderborn'],
    initialSummary: 'Received rent increase notice that may violate Mietpreisbremse regulations in Paderborn.',
    successProbability: 'High',
    isSuitableForMediation: true
  };

  useEffect(() => {
    if (caseConfirmed && assessmentStep === 'intake') {
      setTimeout(() => setAssessmentStep('assessment'), 1000);
    }
  }, [caseConfirmed, assessmentStep]);

  useEffect(() => {
    if (assessmentStep === 'assessment') {
      // Animate scenario probabilities
      setTimeout(() => setScenarioProgress({ worse: 15, middle: 60, best: 25 }), 500);
    }
  }, [assessmentStep]);

  const handleDisclaimerAcknowledge = () => {
    setDisclaimerAcknowledged(true);
  };

  const renderIntakeStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Confirm Your Case Details</h1>
        <p className="text-muted-foreground">Review and confirm the information we've extracted from your input.</p>
      </div>

      <Card className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <CardHeader>
          <CardTitle>AI Auto-Categorization</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Based on your input, this appears to be a <strong>{mockCaseData.legalArea}</strong> (tenancy law) concerning a <strong>{mockCaseData.specificProcedure}</strong> (rent increase).</p>
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border rounded-lg p-6">
        <CardHeader>
          <CardTitle>Dynamic Case Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Case Name (Suggested)</h3>
            <p className="text-muted-foreground">{mockCaseData.caseName}</p>
          </div>
          <div>
            <h3 className="font-semibold">Key Dates</h3>
            <ul className="text-muted-foreground">
              {mockCaseData.keyDates.map((date, index) => (
                <li key={index}>• {date}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Involved Parties</h3>
            <ul className="text-muted-foreground">
              {mockCaseData.involvedParties.map((party, index) => (
                <li key={index}>• {party}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Initial Summary</h3>
            <p className="text-muted-foreground">{mockCaseData.initialSummary}</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="mb-4">Is this an accurate starting point for your case?</p>
        <div className="space-x-4">
          <Button onClick={() => setCaseConfirmed(true)} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Yes, Looks Good
          </Button>
          <Button variant="secondary">
            <FileText className="h-4 w-4 mr-2" />
            No, Let Me Refine
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAssessmentStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Your Case: Assessment & Options</h1>
        <Progress value={75} className="w-full max-w-md mx-auto" />
      </div>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border rounded-lg p-6">
        <CardHeader>
          <CardTitle>Legal Assessment (AI-driven)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Preliminary Legal Assessment:</h3>
            <p className="text-muted-foreground">Based on your situation and German law, here are potential outcomes: Rent increase likely invalid if it exceeds Mietpreisbremse limits in Paderborn. High probability of successful challenge with proper documentation.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Relevant Rules Summary & Links:
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded border dark:border-blue-700">
                <p className="text-sm font-medium">§§ 557a BGB - Mietpreisbremse (Rent Brake)</p>
                <p className="text-xs text-muted-foreground">Rent increases in areas with tight housing markets are limited to 10% above local comparative rent.</p>
                <a href="#" className="text-blue-600 text-xs hover:underline">View on gesetze-im-internet.de</a>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded border dark:border-blue-700">
                <p className="text-sm font-medium">Paderborn Rent Brake Regulation (2020)</p>
                <p className="text-xs text-muted-foreground">Specific application of rent brake rules in Paderborn housing market.</p>
                <a href="#" className="text-blue-600 text-xs hover:underline">View official NRW housing portal</a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Tips to Improve Your Chance:
            </h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm">Gather all rental communication records and payment history documentation</p>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm">Research comparable rent prices in your Paderborn neighborhood using official sources</p>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm">Respond to rent increase notice within legal deadline (usually 3 months)</p>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm">Consider mediation before formal legal proceedings to save costs</p>
              </div>
            </div>
          </div>
          
          {/* Three Scenario Outcomes */}
          <div>
            <h3 className="font-semibold mb-4">Scenario Outcomes (AI Prediction):</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-lg text-red-800">Worse Scenario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-2">
                    Rent increase is upheld due to insufficient evidence or procedural errors in your objection.
                  </p>
                  <div className="space-y-2">
                    <Progress value={scenarioProgress.worse} className="h-2 bg-red-100" />
                    <div className="text-xs text-red-600 font-medium">{scenarioProgress.worse}% likelihood</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-lg text-yellow-800">Middle Scenario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 mb-2">
                    Partial success - rent increase reduced but not completely invalidated through negotiation.
                  </p>
                  <div className="space-y-2">
                    <Progress value={scenarioProgress.middle} className="h-2 bg-yellow-100" />
                    <div className="text-xs text-yellow-600 font-medium">{scenarioProgress.middle}% likelihood</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg text-green-800">Best Scenario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700 mb-2">
                    Complete invalidation of rent increase based on Mietpreisbremse violations with potential compensation.
                  </p>
                  <div className="space-y-2">
                    <Progress value={scenarioProgress.best} className="h-2 bg-green-100" />
                    <div className="text-xs text-green-600 font-medium">{scenarioProgress.best}% likelihood</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              *Probabilities represent independent likelihoods for each scenario based on similar cases.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Relevant Similar Cases & User Experiences:</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm">"Successfully challenged rent increase in Paderborn - saved €200/month" - JuraForum user</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm">"Mietpreisbremse applies in Paderborn since 2020" - Mieterverein NRW</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Disclaimer */}
      <Card className="bg-orange-50/80 backdrop-blur-sm border border-orange-200 rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-orange-800">Important Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-4">This assessment is AI-generated and for informational purposes only. It is NOT legal advice and does not substitute for consultation with a qualified lawyer. Always seek professional legal counsel for specific situations.</p>
          <Button 
            variant="secondary" 
            onClick={handleDisclaimerAcknowledge}
            className="bg-orange-100 hover:bg-orange-200"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Acknowledge & Continue
          </Button>
        </CardContent>
      </Card>

      {/* Your Legal Options */}
      {disclaimerAcknowledged && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Your Next Steps: Tailored Legal Options</h2>
            <p className="text-muted-foreground">Based on your case assessment and preferences, here are the pathways available to you. Select the option that best suits your needs and budget.</p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Self-Service Option */}
            <Card className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ListChecks className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-xl">1. Self-Service Legal Tools</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Manage your legal case independently using our AI-powered platform. Get step-by-step guidance, automated document creation, and easy communication support.</p>
                
                <div>
                  <h4 className="font-medium mb-2">Best For:</h4>
                  <p className="text-sm text-muted-foreground">Straightforward administrative issues, minor disputes, or if you want full control over your case.</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Why Choose This?</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Affordable: Minimal or no legal fees</li>
                    <li>✅ Full Control: You lead every step</li>
                    <li>✅ Instant Access: Begin immediately</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Keep in Mind:</h4>
                  <ul className="text-sm space-y-1">
                    <li>❌ No lawyer representation</li>
                    <li>❌ Not suited for complex cases</li>
                    <li>❌ Requires your time and effort</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pricing:</h4>
                  <p className="text-sm font-bold">Starting at €0 – €49/month</p>
                </div>

                <Button
                  className="w-full whitespace-normal h-auto py-3"
                  disabled={!disclaimerAcknowledged}
                  asChild={disclaimerAcknowledged}
                >
                  {disclaimerAcknowledged ? (
                    <Link to="/self-service" className="text-center">Start Self-Service Workflow</Link>
                  ) : (
                    <span className="text-center">Please acknowledge disclaimer first</span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Lawyer Consultation Option */}
            <Card className="bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm border-2 border-green-200 dark:border-green-800 rounded-lg p-6 shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Scale className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-xl">2. Lawyer Consultation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Get expert advice from a qualified German lawyer who will review your case and provide strategic recommendations tailored to you.</p>
                
                <div>
                  <h4 className="font-medium mb-2">Best For:</h4>
                  <p className="text-sm text-muted-foreground">When you want professional legal insight without full representation.</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Why Choose This?</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Expert Guidance: Clear legal understanding</li>
                    <li>✅ Cost-Effective: Lower fees than full representation</li>
                    <li>✅ Focused Advice: Tailored strategy for your situation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Keep in Mind:</h4>
                  <ul className="text-sm space-y-1">
                    <li>❌ No ongoing case management</li>
                    <li>❌ Fees apply per consultation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pricing:</h4>
                  <p className="text-sm font-bold">€190–€250 + VAT per consultation</p>
                </div>

                <Button
                  className="w-full whitespace-normal h-auto py-3"
                  disabled={!disclaimerAcknowledged}
                  asChild={disclaimerAcknowledged}
                >
                  {disclaimerAcknowledged ? (
                    <Link to="/find-lawyer?consultationOnly=true" className="text-center">Find & Book Lawyer Consultation</Link>
                  ) : (
                    <span className="text-center">Please acknowledge disclaimer first</span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Full Representation Option */}
            <Card className="bg-purple-50/80 dark:bg-purple-900/30 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6 shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-xl">3. Full Legal Representation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Engage a lawyer to fully manage your case—handling all communication, preparing documents, and representing you in court if needed.</p>
                
                <div>
                  <h4 className="font-medium mb-2">Best For:</h4>
                  <p className="text-sm text-muted-foreground">Complex disputes, court proceedings, or when you want comprehensive legal support.</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Why Choose This?</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Full-Service Support: From start to finish</li>
                    <li>✅ Highest Chance of Success: Professional representation</li>
                    <li>✅ Peace of Mind: Less stress, more confidence</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Keep in Mind:</h4>
                  <ul className="text-sm space-y-1">
                    <li>❌ Higher cost</li>
                    <li>❌ Less direct control over case actions</li>
                    <li className="text-blue-600">If your case may be resolved outside court, we recommend trying Graybeard Mediation First</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pricing:</h4>
                  <p className="text-sm font-bold">€500–€5000+ (varies by case complexity)</p>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!disclaimerAcknowledged}
                  asChild={disclaimerAcknowledged}
                >
                  {disclaimerAcknowledged ? (
                    <Link to="/find-lawyer?fullRepresentation=true">Find & Retain Lawyer</Link>
                  ) : (
                    <span>Please acknowledge disclaimer first</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Graybeard Mediation */}
          {mockCaseData.isSuitableForMediation && disclaimerAcknowledged && (
            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
              <CardContent className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Handshake className="h-8 w-8 text-orange-600 mr-2" />
                  <h3 className="text-xl font-semibold">Consider Graybeard Mediation First</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Based on your case type, mediation could resolve this dispute faster and at lower cost than traditional legal proceedings.
                </p>
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link to={`/graybeard-mediation?caseId=${caseId}&returnTo=/case-assessment/${caseId}`}>
                    Start Graybeard Mediation First
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderOptionsStep = () => renderAssessmentStep();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/new-case">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {assessmentStep === 'intake' && renderIntakeStep()}
        {assessmentStep === 'assessment' && renderAssessmentStep()}
        {assessmentStep === 'options' && renderOptionsStep()}
      </div>
    </div>
  );
};

export default CaseAssessment;
