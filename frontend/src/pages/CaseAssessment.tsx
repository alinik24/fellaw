
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
import { useLanguage } from '@/contexts/LanguageContext';

const CaseAssessment = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { t } = useLanguage();
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
        <h1 className="text-3xl font-bold mb-4 text-foreground">Confirm Your Case Details</h1>
        <p className="text-muted-foreground">Review and confirm the information we've extracted from your input.</p>
      </div>

      <Card className="bg-primary/10 backdrop-blur-sm border-2 border-primary rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-foreground">AI Auto-Categorization</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Based on your input, this appears to be a <strong>{mockCaseData.legalArea}</strong> (tenancy law) concerning a <strong>{mockCaseData.specificProcedure}</strong> (rent increase).</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-foreground">Dynamic Case Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Case Name (Suggested)</h3>
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
          <Button onClick={() => setCaseConfirmed(true)}>
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
        <h1 className="text-3xl font-bold mb-4 text-foreground">Your Case: Assessment & Options</h1>
        <Progress value={75} className="w-full max-w-md mx-auto" />
      </div>

      <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-foreground">Legal Assessment (AI-driven)</CardTitle>
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
              <div className="p-3 bg-primary/10 rounded border border-primary">
                <p className="text-sm font-medium text-foreground">§§ 557a BGB - Mietpreisbremse (Rent Brake)</p>
                <p className="text-xs text-muted-foreground">Rent increases in areas with tight housing markets are limited to 10% above local comparative rent.</p>
                <a href="#" className="text-primary text-xs hover:underline">View on gesetze-im-internet.de</a>
              </div>
              <div className="p-3 bg-primary/10 rounded border border-primary">
                <p className="text-sm font-medium">Paderborn Rent Brake Regulation (2020)</p>
                <p className="text-xs text-muted-foreground">Specific application of rent brake rules in Paderborn housing market.</p>
                <a href="#" className="text-primary text-xs hover:underline">View official NRW housing portal</a>
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
                <Lightbulb className="h-4 w-4 text-warning mt-1 flex-shrink-0" />
                <p className="text-sm">Gather all rental communication records and payment history documentation</p>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-warning mt-1 flex-shrink-0" />
                <p className="text-sm">Research comparable rent prices in your Paderborn neighborhood using official sources</p>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-warning mt-1 flex-shrink-0" />
                <p className="text-sm">Respond to rent increase notice within legal deadline (usually 3 months)</p>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-warning mt-1 flex-shrink-0" />
                <p className="text-sm">Consider mediation before formal legal proceedings to save costs</p>
              </div>
            </div>
          </div>
          
          {/* Three Scenario Outcomes */}
          <div>
            <h3 className="font-semibold mb-4">Scenario Outcomes (AI Prediction):</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card border-2 border-destructive">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-lg text-foreground">Worse Scenario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-2">
                    Rent increase is upheld due to insufficient evidence or procedural errors in your objection.
                  </p>
                  <div className="space-y-2">
                    <Progress value={scenarioProgress.worse} className="h-2 [&>div]:bg-destructive" />
                    <div className="text-xs text-destructive font-medium">{scenarioProgress.worse}% likelihood</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 border-warning">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-warning" />
                    <CardTitle className="text-lg text-foreground">Middle Scenario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-2">
                    Partial success - rent increase reduced but not completely invalidated through negotiation.
                  </p>
                  <div className="space-y-2">
                    <Progress value={scenarioProgress.middle} className="h-2 [&>div]:bg-warning" />
                    <div className="text-xs text-warning font-medium">{scenarioProgress.middle}% likelihood</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 border-success">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <CardTitle className="text-lg text-foreground">Best Scenario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-2">
                    Complete invalidation of rent increase based on Mietpreisbremse violations with potential compensation.
                  </p>
                  <div className="space-y-2">
                    <Progress value={scenarioProgress.best} className="h-2 [&>div]:bg-success" />
                    <div className="text-xs text-success font-medium">{scenarioProgress.best}% likelihood</div>
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
              <div className="p-3 bg-card border-2 border-border rounded">
                <p className="text-sm text-foreground">"Successfully challenged rent increase in Paderborn - saved €200/month" - JuraForum user</p>
              </div>
              <div className="p-3 bg-card border-2 border-border rounded">
                <p className="text-sm text-foreground">"Mietpreisbremse applies in Paderborn since 2020" - Mieterverein NRW</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Disclaimer */}
      <Card className="bg-card border-2 border-warning rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-warning" />
            Important Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">This assessment is AI-generated and for informational purposes only. It is NOT legal advice and does not substitute for consultation with a qualified lawyer. Always seek professional legal counsel for specific situations.</p>
          <Button
            variant="secondary"
            onClick={handleDisclaimerAcknowledge}
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
            <h2 className="text-3xl font-bold mb-6 text-foreground">{t('caseAssessment.nextSteps')}</h2>
            <p className="text-muted-foreground">{t('caseAssessment.nextStepsDesc')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Self-Service Option */}
            <Card className="bg-card border-2 border-primary rounded-lg p-6 shadow-md flex flex-col">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center space-x-2">
                  <ListChecks className="h-6 w-6 text-primary flex-shrink-0" />
                  <CardTitle className="text-lg text-foreground leading-tight">1. {t('caseAssessment.selfService')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1">
                <div className="flex flex-col">
                  {/* 1. Description paragraph - based on LONGEST across 3 cards */}
                  <div className="h-[84px] mb-16">
                    <p className="text-sm text-foreground leading-relaxed">{t('caseAssessment.selfServiceDesc')}</p>
                  </div>

                  {/* 2. Best For section - Title + Content as one block */}
                  <div className="h-[104px] mb-6">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.bestFor')}</h4>
                    <p className="text-sm text-foreground leading-relaxed">{t('caseAssessment.bestForSelf')}</p>
                  </div>

                  {/* 3. Why Choose section - Title + Content as one block */}
                  <div className="h-[136px] mb-16">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.whyChoose')}</h4>
                    <ul className="text-sm text-foreground space-y-2 leading-relaxed">
                      <li>✅ {t('caseAssessment.whyChooseSelf1')}</li>
                      <li>✅ {t('caseAssessment.whyChooseSelf2')}</li>
                      <li>✅ {t('caseAssessment.whyChooseSelf3')}</li>
                    </ul>
                  </div>

                  {/* 4. Keep in Mind section - Title + Content as one block - based on LONGEST (3 items) */}
                  <div className="h-[136px] mb-12">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.keepInMind')}</h4>
                    <ul className="text-sm text-foreground space-y-2 leading-relaxed">
                      <li>❌ {t('caseAssessment.keepInMindSelf1')}</li>
                      <li>❌ {t('caseAssessment.keepInMindSelf2')}</li>
                      <li>❌ {t('caseAssessment.keepInMindSelf3')}</li>
                    </ul>
                  </div>

                  {/* 5. Pricing section - Title + Content as one block */}
                  <div className="h-[72px] mb-12">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.pricing')}</h4>
                    <p className="text-lg font-bold text-primary">{t('caseAssessment.pricingSelf')}</p>
                  </div>
                </div>

                {/* Button - always at bottom */}
                <Button
                  className="w-full h-12 mt-auto"
                  disabled={!disclaimerAcknowledged}
                  asChild={disclaimerAcknowledged}
                >
                  {disclaimerAcknowledged ? (
                    <Link to="/self-service" className="flex items-center justify-center">{t('caseAssessment.startSelfService')}</Link>
                  ) : (
                    <span className="text-center text-xs">{t('caseAssessment.acknowledgeFirst')}</span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Lawyer Consultation Option */}
            <Card className="bg-card border-2 border-success rounded-lg p-6 shadow-md flex flex-col">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center space-x-2">
                  <Scale className="h-6 w-6 text-success flex-shrink-0" />
                  <CardTitle className="text-lg text-foreground leading-tight">2. {t('caseAssessment.lawyerConsult')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1">
                <div className="flex flex-col">
                  {/* 1. Description paragraph - SAME height */}
                  <div className="h-[84px] mb-16">
                    <p className="text-sm text-foreground leading-relaxed">{t('caseAssessment.lawyerConsultDesc')}</p>
                  </div>

                  {/* 2. Best For section - SAME total height → title aligns */}
                  <div className="h-[104px] mb-6">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.bestFor')}</h4>
                    <p className="text-sm text-foreground leading-relaxed">{t('caseAssessment.bestForConsult')}</p>
                  </div>

                  {/* 3. Why Choose section - SAME total height → title aligns */}
                  <div className="h-[136px] mb-16">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.whyChoose')}</h4>
                    <ul className="text-sm text-foreground space-y-2 leading-relaxed">
                      <li>✅ {t('caseAssessment.whyChooseConsult1')}</li>
                      <li>✅ {t('caseAssessment.whyChooseConsult2')}</li>
                      <li>✅ {t('caseAssessment.whyChooseConsult3')}</li>
                    </ul>
                  </div>

                  {/* 4. Keep in Mind section - SAME total height → title aligns */}
                  <div className="h-[136px] mb-12">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.keepInMind')}</h4>
                    <ul className="text-sm text-foreground space-y-2 leading-relaxed">
                      <li>❌ {t('caseAssessment.keepInMindConsult1')}</li>
                      <li>❌ {t('caseAssessment.keepInMindConsult2')}</li>
                    </ul>
                  </div>

                  {/* 5. Pricing section - SAME total height → title aligns */}
                  <div className="h-[72px] mb-12">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.pricing')}</h4>
                    <p className="text-lg font-bold text-primary">{t('caseAssessment.pricingConsult')}</p>
                  </div>
                </div>

                {/* Button - always at bottom */}
                <Button
                  className="w-full h-12 mt-auto"
                  disabled={!disclaimerAcknowledged}
                  asChild={disclaimerAcknowledged}
                >
                  {disclaimerAcknowledged ? (
                    <Link to="/find-lawyer?consultationOnly=true" className="flex items-center justify-center">{t('caseAssessment.bookConsultation')}</Link>
                  ) : (
                    <span className="text-center text-xs">{t('caseAssessment.acknowledgeFirst')}</span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Full Representation Option */}
            <Card className="bg-card border-2 border-accent rounded-lg p-6 shadow-md flex flex-col">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-6 w-6 text-accent flex-shrink-0" />
                  <CardTitle className="text-lg text-foreground leading-tight">3. {t('caseAssessment.fullRep')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1">
                <div className="flex flex-col">
                  {/* 1. Description paragraph - SAME height */}
                  <div className="h-[84px] mb-16">
                    <p className="text-sm text-foreground leading-relaxed">{t('caseAssessment.fullRepDesc')}</p>
                  </div>

                  {/* 2. Best For section - SAME total height → title aligns */}
                  <div className="h-[104px] mb-6">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.bestFor')}</h4>
                    <p className="text-sm text-foreground leading-relaxed">{t('caseAssessment.bestForFull')}</p>
                  </div>

                  {/* 3. Why Choose section - SAME total height → title aligns */}
                  <div className="h-[136px] mb-16">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.whyChoose')}</h4>
                    <ul className="text-sm text-foreground space-y-2 leading-relaxed">
                      <li>✅ {t('caseAssessment.whyChooseFull1')}</li>
                      <li>✅ {t('caseAssessment.whyChooseFull2')}</li>
                      <li>✅ {t('caseAssessment.whyChooseFull3')}</li>
                    </ul>
                  </div>

                  {/* 4. Keep in Mind section - SAME total height → title aligns */}
                  <div className="h-[136px] mb-12">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.keepInMind')}</h4>
                    <ul className="text-sm text-foreground space-y-2 leading-relaxed">
                      <li>❌ {t('caseAssessment.keepInMindFull1')}</li>
                      <li>❌ {t('caseAssessment.keepInMindFull2')}</li>
                    </ul>
                  </div>

                  {/* 5. Pricing section - SAME total height → title aligns */}
                  <div className="h-[72px] mb-12">
                    <h4 className="font-semibold text-foreground mb-3">{t('caseAssessment.pricing')}</h4>
                    <p className="text-lg font-bold text-primary">{t('caseAssessment.pricingFull')}</p>
                  </div>
                </div>

                {/* Button - always at bottom */}
                <Button
                  className="w-full h-12 mt-auto"
                  disabled={!disclaimerAcknowledged}
                  asChild={disclaimerAcknowledged}
                >
                  {disclaimerAcknowledged ? (
                    <Link to="/find-lawyer?fullRepresentation=true" className="flex items-center justify-center">{t('caseAssessment.retainLawyer')}</Link>
                  ) : (
                    <span className="text-center text-xs">{t('caseAssessment.acknowledgeFirst')}</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Graybeard Mediation */}
          {mockCaseData.isSuitableForMediation && disclaimerAcknowledged && (
            <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6">
              <CardContent className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Handshake className="h-8 w-8 text-warning mr-2" />
                  <h3 className="text-xl font-semibold text-foreground">Consider Graybeard Mediation First</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Based on your case type, mediation could resolve this dispute faster and at lower cost than traditional legal proceedings.
                </p>
                <Button asChild>
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
