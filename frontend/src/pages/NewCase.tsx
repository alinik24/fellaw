
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  FileText, 
  Image, 
  Video, 
  Upload,
  Lock,
  Car,
  ShoppingCart,
  Heart,
  Briefcase,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const NewCase = () => {
  const [caseDescription, setCaseDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice recording
      setTimeout(() => {
        setCaseDescription(prev => prev + ' [Voice input: I received a notice from my landlord about a rent increase, and I believe it might not comply with local regulations in Paderborn.]');
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleFileUpload = (type: string) => {
    // Simulate file upload
    const fileName = `${type}_${Date.now()}.pdf`;
    setUploadedFiles(prev => [...prev, fileName]);
    
    // Simulate AI document parsing
    if (type === 'document') {
      setTimeout(() => {
        setCaseDescription(prev => prev + '\n\n[AI Extracted from document: Mahnung #12345, Amount: €150, Due Date: 2024-06-20, Creditor: Example GmbH]');
      }, 1500);
    }
  };

  const examplePrompts = [
    "I received a Mahnung (dunning letter) for an alleged unpaid bill. I believe it's a mistake.",
    "My landlord increased my rent, and I think it's not compliant with the Mietpreisbremse (rent brake) regulations in Paderborn.",
    "I'm buying an apartment in Paderborn and need a legal review of the Kaufvertrag (purchase contract).",
    "I want to apply for a Blue Card visa, and I'm unsure about the necessary documents for the Ausländerbehörde (Foreigners' Office).",
    "I took out a small loan, and now I'm struggling with the repayment terms.",
    "I had a conflict with my neighbor about noise complaints after 10 PM. I live in a shared apartment in Paderborn and the Hausordnung (house rules) mentions quiet hours.",
    "I need help understanding a clause in my employment contract regarding remote work from Paderborn."
  ];

  const canSubmit = caseDescription.trim().length > 10 || uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Screen Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">What's Your Situation?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your legal situation in detail. Our AI will analyze your case and provide tailored recommendations for the best path forward.
          </p>
        </div>

        {/* Quick Access to Common Non-Urgent Cases */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Quick Access - Common Case Types</CardTitle>
            <CardDescription>
              Get specialized guidance for common legal situations with tailored intake forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Button
                asChild
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <Link to="/new-case/traffic-violation">
                  <Car className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-center">Traffic Violation</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 dark:hover:bg-green-900/30"
              >
                <Link to="/new-case/consumer-dispute">
                  <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-center">Consumer Dispute</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-pink-50 dark:hover:bg-pink-900/30"
              >
                <Link to="/new-case/family-inquiry">
                  <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm text-center">Family Law</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <Link to="/new-case/employment-inquiry">
                  <Briefcase className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-center">Employment Law</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                <Link to="/new-case/visa-immigration">
                  <Globe className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm text-center">Visa & Immigration</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tell Us Your Story */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Tell Us Your Story</CardTitle>
            <CardDescription>
              Provide as much detail as possible about your situation. Include dates, parties involved, 
              and any relevant background information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="case-description">Case Description</Label>
              <Textarea
                id="case-description"
                placeholder={`Example scenarios:\n\n${examplePrompts.slice(0, 3).join('\n\n')}`}
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="min-h-[200px] mt-2"
              />
            </div>
            
            <div className="flex justify-center">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={handleVoiceInput}
                className="flex items-center space-x-2"
              >
                <Mic className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
                <span>{isRecording ? 'Recording... (Click to stop)' : 'Speak Your Story'}</span>
              </Button>
            </div>
            
            {isRecording && (
              <div className="text-center text-sm text-muted-foreground">
                🔴 Recording in progress... Speak clearly about your legal situation.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Direct Upload Area */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Supporting Documents & Evidence</CardTitle>
            <CardDescription>
              Upload any relevant documents, photos, or media that support your case. 
              Our AI will analyze and extract key information automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => handleFileUpload('document')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Upload Document / Letter</div>
                  <div className="text-xs text-muted-foreground">PDF, DOC, contracts, notices</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('photo')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <Image className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Upload Photos</div>
                  <div className="text-xs text-muted-foreground">Evidence, damages, documents</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('media')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <Video className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Upload Audio/Video</div>
                  <div className="text-xs text-muted-foreground">Recordings, statements</div>
                </div>
              </Button>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files:</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded border">
                      <Upload className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{file}</span>
                      <span className="text-xs text-green-600">✓ Uploaded & Analyzed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Enhancement Notice */}
            {(caseDescription.includes('[AI Extracted') || uploadedFiles.length > 0) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-800">
                  <strong>AI Enhancement:</strong> Your documents have been analyzed and key information 
                  has been automatically extracted and added to your case description.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Setting */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">Privacy Mode</div>
                <div className="text-sm text-muted-foreground">
                  {isAnonymous ? 'Anonymous Mode: ON - Personal data protected' : 'Identified Mode: ON - Personalized features enabled'}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              {isAnonymous ? 'Switch to Identified' : 'Switch to Anonymous'}
            </Button>
          </CardContent>
        </Card>

        {/* Submission */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold mb-4">Ready for AI Analysis?</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your case, identify relevant German laws, assess your options, 
              and recommend the best legal pathway forward.
            </p>
            <Button
              size="lg"
              disabled={!canSubmit}
              asChild={canSubmit}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {canSubmit ? (
                <Link to={`/case-assessment/case-${Date.now()}`}>
                  Analyze My Case
                </Link>
              ) : (
                <span>Please provide case details or upload documents</span>
              )}
            </Button>
            
            {canSubmit && (
              <p className="text-xs text-muted-foreground mt-3">
                Analysis typically takes 2-3 minutes. You'll receive a comprehensive assessment with legal options.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCase;
