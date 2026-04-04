
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ClipboardList, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Mail, 
  Phone, 
  MessageSquare, 
  CalendarDays, 
  PenTool, 
  Users,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const SelfService = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Mock case data
  const caseData = {
    name: 'Rent Increase Dispute - Apartment Paderborn',
    task: 'Contest Rent Increase Notice'
  };

  const steps = [
    {
      id: 1,
      title: 'Review & Sign Appeal Letter',
      description: 'AI-drafted letter challenging the rent increase based on Mietpreisbremse regulations',
      icon: FileText,
      actions: [
        { label: 'View/Edit & Sign Appeal Letter', icon: PenTool, action: 'document' },
      ],
      detail: 'Our AI has prepared a formal objection letter citing relevant German tenancy law. Review, customize if needed, and digitally sign.'
    },
    {
      id: 2,
      title: 'Gather Supporting Documents',
      description: 'Collect required documentation to support your case',
      icon: Upload,
      actions: [
        { label: 'Upload Documents', icon: Upload, action: 'upload' },
      ],
      detail: 'Required: Current lease agreement, previous rent receipts, local rent comparison data'
    },
    {
      id: 3,
      title: 'Prepare Communication',
      description: 'AI-tailored communication samples and assistance',
      icon: Mail,
      actions: [
        { label: 'Draft Email Sample', icon: Mail, action: 'email' },
        { label: 'Call Conversation Sample', icon: Phone, action: 'call' },
        { label: 'Live Call Assistance (AI Listener)', icon: MessageSquare, action: 'ai-call' },
      ],
      detail: 'Get templates for communicating with your landlord and guidance for phone conversations'
    },
    {
      id: 4,
      title: 'Submit Your Case',
      description: 'Submit your objection through the appropriate channels',
      icon: CheckCircle2,
      actions: [
        { label: 'Confirmed Submission', icon: CheckCircle2, action: 'submit' },
      ],
      detail: 'Submit via registered mail to landlord. We provide pre-filled address labels and tracking guidance.'
    },
    {
      id: 5,
      title: 'Follow Up',
      description: 'Track progress and set reminders for next steps',
      icon: CalendarDays,
      actions: [
        { label: 'Set Reminder', icon: CalendarDays, action: 'reminder' },
      ],
      detail: 'Expected response by July 15, 2024. We will remind you to follow up if no response received.'
    }
  ];

  const handleStepAction = (stepId: number, action: string) => {
    console.log(`Action ${action} for step ${stepId}`);
    
    // Simulate action completion
    switch (action) {
      case 'document':
        alert('Opening AI-drafted appeal letter for review and signature...');
        break;
      case 'upload':
        alert('Document upload interface opened. Please upload your lease agreement and rent receipts.');
        break;
      case 'email':
        alert('Email template generated: "Dear [Landlord], I formally object to the rent increase..."');
        break;
      case 'call':
        alert('Call script provided: Key points to discuss with your landlord about the rent increase.');
        break;
      case 'ai-call':
        alert('AI call assistance activated. The AI will listen and provide real-time suggestions.');
        break;
      case 'submit':
        alert('Submission confirmed! Your objection has been sent via registered mail.');
        break;
      case 'reminder':
        alert('Reminder set for July 15, 2024. You will receive notifications about next steps.');
        break;
    }
    
    // Mark step as completed
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/case-assessment/sample">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Case Assessment
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Your Step-by-Step Guide: {caseData.name}</h1>
          <p className="text-xl text-muted-foreground mb-6">Your Task: {caseData.task}</p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </div>

        {/* Step Cards */}
        <div className="space-y-6 mb-8">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isAccessible = step.id <= currentStep || isCompleted;

            return (
              <Card 
                key={step.id} 
                className={`
                  ${isCurrent ? 'border-blue-500 bg-blue-50/50' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-50/50' : ''}
                  ${!isAccessible ? 'opacity-50' : ''}
                `}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <step.icon className={`h-6 w-6 ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {isCurrent && !isCompleted && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Current Step
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {(isCurrent || isCompleted) && (
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{step.detail}</p>
                    
                    <div className="space-y-3">
                      {step.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={isCompleted ? "secondary" : "default"}
                          onClick={() => handleStepAction(step.id, action.action)}
                          className="w-full justify-start"
                          disabled={!isAccessible}
                        >
                          <action.icon className="h-4 w-4 mr-2" />
                          {action.label}
                          {isCompleted && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                        </Button>
                      ))}
                    </div>

                    {isCurrent && !isCompleted && step.actions.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          💡 Complete the actions above, then click "Mark Complete & Next Step" to proceed.
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
          >
            Previous Step
          </Button>
          
          {currentStep < steps.length ? (
            <Button 
              onClick={handleNextStep}
              disabled={!completedSteps.includes(currentStep)}
            >
              Mark Complete & Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={completedSteps.length !== steps.length}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finish Workflow
            </Button>
          )}
        </div>

        {/* Need More Help Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
            <CardDescription>
              If you encounter difficulties or need expert guidance, these options are available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat With AI Assistant
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/find-lawyer">
                  <Users className="h-4 w-4 mr-2" />
                  Consult a Lawyer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelfService;
