
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Handshake, 
  MessageSquare, 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Send,
  Calendar,
  PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const GraybeardMediation = () => {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('caseId');
  const returnTo = searchParams.get('returnTo');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [minimumOutcome, setMinimumOutcome] = useState('');
  const [otherPartyEmail, setOtherPartyEmail] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'AI Mediator',
      content: 'Welcome to Graybeard AI Mediation. I will help facilitate a fair resolution between both parties. Let\'s start by understanding your position.',
      timestamp: '10:00 AM',
      type: 'ai'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const mediationSteps = [
    { id: 1, title: 'Define Dispute', status: 'completed' },
    { id: 2, title: 'Find Legal Counsel', status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, title: 'Invite Parties', status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending' },
    { id: 4, title: 'AI-Guided Negotiation', status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending' },
    { id: 5, title: 'Draft Agreement', status: currentStep === 5 ? 'current' : 'pending' }
  ];

  const progressPercentage = (currentStep / mediationSteps.length) * 100;

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = {
        id: messages.length + 1,
        sender: 'You',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user'
      };
      
      setMessages([...messages, userMessage]);
      setNewMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          sender: 'AI Mediator',
          content: 'Thank you for sharing your perspective. I understand your concerns about the rent increase. Let me suggest a compromise that might work for both parties...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'ai'
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleNextStep = () => {
    if (currentStep < mediationSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderDefineDispute = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Define Your Dispute</CardTitle>
          <CardDescription>Provide clear details about the conflict you want to resolve</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dispute">Describe the Dispute</Label>
            <Textarea
              id="dispute"
              placeholder="Example: My landlord increased my rent by 30% without following proper procedures under German law..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <div>
            <Label htmlFor="desired">Desired Outcome</Label>
            <Textarea
              id="desired"
              placeholder="What would be your ideal resolution?"
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="minimum">Minimum Acceptable Outcome</Label>
            <Textarea
              id="minimum"
              placeholder="What is the minimum you would accept to resolve this dispute?"
              value={minimumOutcome}
              onChange={(e) => setMinimumOutcome(e.target.value)}
            />
          </div>
          
          <Button onClick={handleNextStep} disabled={!disputeDescription || !desiredOutcome}>
            Continue to Legal Counsel
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderFindLegalCounsel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legal Counsel Recommendation</CardTitle>
          <CardDescription>While mediation aims to avoid court, having legal counsel available can strengthen your position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-800 mb-3">
              Based on your dispute type (tenancy law), we recommend having a qualified lawyer available for consultation during mediation.
            </p>
            <Button asChild variant="outline">
              <Link to="/find-lawyer" target="_blank">
                Find a Tenancy Lawyer
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm">I understand the recommendation and am ready to proceed</span>
          </div>
          
          <Button onClick={handleNextStep}>
            Continue to Invite Parties
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderInviteParties = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite Other Party</CardTitle>
          <CardDescription>Send an invitation to the other party to join the mediation process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="other-party-email">Other Party's Email</Label>
            <Input
              id="other-party-email"
              type="email"
              placeholder="landlord@example.com"
              value={otherPartyEmail}
              onChange={(e) => setOtherPartyEmail(e.target.value)}
            />
          </div>
          
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Auto-Generated Invitation Preview:</h4>
            <p className="text-sm text-muted-foreground">
              "Dear [Landlord], I would like to invite you to participate in an AI-assisted mediation process to resolve our rent dispute. This neutral platform can help us reach a fair agreement without court proceedings..."
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={handleNextStep} disabled={!otherPartyEmail}>
              Send Invitation & Continue
            </Button>
            <Button variant="outline">
              Customize Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNegotiation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Guided Negotiation</CardTitle>
          <CardDescription>Communicate with the other party under AI guidance</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Chat Interface */}
          <div className="border rounded-lg p-4 h-80 overflow-y-auto mb-4 bg-gray-50">
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'
                  }`}>
                    <p className="text-sm font-medium">{message.sender}</p>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Message Input */}
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* AI Suggestions */}
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm font-medium text-blue-800 mb-2">AI Suggestions:</p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="text-xs">
                "Would you be open to a 10% increase instead of 30%?"
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                "I'm willing to accept a gradual increase over 2 years"
              </Button>
            </div>
          </div>
          
          <Button onClick={handleNextStep} className="w-full mt-4">
            Move to Agreement Drafting
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderDraftAgreement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Draft Settlement Agreement</CardTitle>
          <CardDescription>Review and finalize the AI-generated agreement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded bg-white">
            <h4 className="font-medium mb-3">Mediation Settlement Agreement</h4>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Parties:</strong> [Your Name] (Tenant) and [Landlord Name] (Landlord)</p>
              <p><strong>Property:</strong> [Address in Paderborn]</p>
              <p><strong>Agreement:</strong> The parties agree to a rent increase of 15% instead of the originally proposed 30%, to be implemented in two phases: 7.5% effective immediately and 7.5% after 12 months.</p>
              <p><strong>Additional Terms:</strong> Landlord agrees to complete necessary maintenance repairs within 30 days.</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button>
              <PenTool className="h-4 w-4 mr-2" />
              Edit Agreement
            </Button>
            <Button variant="outline">
              Download Draft
            </Button>
          </div>
          
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-green-800 mb-3">
              Both parties have indicated agreement to these terms. Ready to finalize?
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalize Agreement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1: return renderDefineDispute();
      case 2: return renderFindLegalCounsel();
      case 3: return renderInviteParties();
      case 4: return renderNegotiation();
      case 5: return renderDraftAgreement();
      default: return renderDefineDispute();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to={returnTo || "/find-lawyer"}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Handshake className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold">AI-Assisted Mediation (Graybeard)</h1>
          </div>
          <p className="text-xl text-muted-foreground">Resolve Disputes Amicably with AI Guidance</p>
        </div>

        {/* Progress Overview */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Mediation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="mb-6" />
            
            <div className="flex justify-between">
              {mediationSteps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed' ? 'bg-green-600 text-white' :
                    step.status === 'current' ? 'bg-blue-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <p className="text-xs mt-2 text-center max-w-20">{step.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Mediation Content */}
          <div className="lg:col-span-3">
            {getCurrentStepContent()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mediation Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mediation Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Started: Today, 10:00 AM</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Est. Completion: 2-3 days</span>
                </div>
              </CardContent>
            </Card>

            {/* Key Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">Rent Amount</Badge>
                  <Badge variant="secondary" className="text-xs">Timing</Badge>
                  <Badge variant="secondary" className="text-xs">Legal Compliance</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Rent Increase Notice</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Current Lease Agreement</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need a Lawyer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need a Lawyer?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Get expert legal advice during mediation
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/find-lawyer">
                    <Users className="h-4 w-4 mr-2" />
                    Find Lawyer
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraybeardMediation;
