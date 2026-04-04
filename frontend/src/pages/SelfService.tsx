
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: number, sender: 'user' | 'ai', content: string}>>([
    { id: 1, sender: 'ai', content: 'Hello! I\'m here to help you with your rent increase dispute case. What questions do you have?' }
  ]);
  const [newMessage, setNewMessage] = useState('');

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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMsg = {
      id: chatMessages.length + 1,
      sender: 'user' as const,
      content: newMessage
    };
    setChatMessages([...chatMessages, userMsg]);
    setNewMessage('');

    // Simulate AI response based on context
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        sender: 'ai' as const,
        content: generateContextualResponse(newMessage)
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateContextualResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('appeal') || lowerInput.includes('letter')) {
      return 'The appeal letter has been drafted based on Mietpreisbremse regulations. You can review and customize it in Step 1. Make sure to include your specific lease details and the comparison rent data from your neighborhood.';
    } else if (lowerInput.includes('document') || lowerInput.includes('upload')) {
      return 'For Step 2, you\'ll need: 1) Your current lease agreement, 2) Previous rent receipts showing payment history, 3) Local rent comparison data (Mietspiegel) for Paderborn. These documents strengthen your case significantly.';
    } else if (lowerInput.includes('landlord') || lowerInput.includes('contact')) {
      return 'In Step 3, we provide email templates and phone conversation scripts. Remember to keep all communication professional and documented. Always send important objections via registered mail (Einschreiben).';
    } else if (lowerInput.includes('deadline') || lowerInput.includes('time')) {
      return 'You typically have 3 months to object to a rent increase after receiving the notice. The expected response from your landlord is by July 15, 2024. We\'ll set up reminders for you in Step 5.';
    } else if (lowerInput.includes('success') || lowerInput.includes('chance')) {
      return 'Based on similar cases in Paderborn, there\'s a high probability of success. Mietpreisbremse has been in effect since 2020, and many rent increases have been successfully challenged when they exceed the 10% limit above local comparative rent.';
    } else {
      return 'I can help you with: understanding the appeal letter, gathering documents, communicating with your landlord, understanding deadlines, or assessing your chances. What would you like to know more about?';
    }
  };

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
          <h1 className="text-4xl font-bold mb-4 text-foreground">Your Step-by-Step Guide: {caseData.name}</h1>
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
                  ${isCurrent ? 'border-2 border-primary bg-primary/10' : ''}
                  ${isCompleted ? 'border-2 border-success bg-success/10' : ''}
                  ${!isAccessible ? 'opacity-50' : ''}
                  ${!isCurrent && !isCompleted ? 'bg-card border-2 hover:shadow-xl transition-all' : ''}
                `}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <step.icon className={`h-6 w-6 ${isCompleted ? 'text-success' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <CardTitle className="text-lg text-foreground">{step.title}</CardTitle>
                        <CardDescription className="text-muted-foreground">{step.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-success/10">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {isCurrent && !isCompleted && (
                        <Badge variant="default" className="bg-primary/10">
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
                      <div className="mt-4 p-3 bg-primary/10 rounded">
                        <p className="text-sm text-foreground">
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
              disabled={completedSteps.length !== steps.length}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finish Workflow
            </Button>
          )}
        </div>

        {/* Need More Help Section */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6">
          <CardHeader>
            <CardTitle className="text-foreground">Need More Help?</CardTitle>
            <CardDescription className="text-muted-foreground">
              If you encounter difficulties or need expert guidance, these options are available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {isChatOpen ? 'Hide AI Assistant' : 'Chat With AI Assistant'}
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/find-lawyer">
                  <Users className="h-4 w-4 mr-2" />
                  Consult a Lawyer
                </Link>
              </Button>
            </div>

            {/* Inline Chat Interface */}
            {isChatOpen && (
              <div className="mt-6 border-2 border-primary rounded-lg overflow-hidden">
                <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-semibold">AI Assistant - Rent Increase Case Support</span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="bg-background p-4 h-96 overflow-y-auto space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-lg ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border-2 border-border text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="bg-card p-4 border-t-2 border-border">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about your case, documents, deadlines..."
                      className="flex-1 px-4 py-2 border-2 border-border rounded bg-background text-foreground"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Context-aware assistant for your Rent Increase Dispute case
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelfService;
