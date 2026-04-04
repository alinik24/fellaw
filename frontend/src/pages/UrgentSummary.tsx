
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  GraduationCap, 
  Shield, 
  DollarSign, 
  Upload, 
  Mail, 
  Download, 
  AlertTriangle,
  FileText,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UrgentSummary = () => {
  const { type } = useParams<{ type: string }>();
  const [selectedDecision, setSelectedDecision] = useState<string>('');

  const getPageTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      'police-interaction': 'Police Encounter Documentation Complete',
      'car-accident': 'Car Accident Documentation Complete',
      'assault-violence': 'Assault Documentation Complete',
      'workplace-harassment': 'Workplace Incident Documentation Complete',
      'housing-eviction': 'Housing Rights Documentation Complete',
      'child-custody': 'Child Custody Documentation Complete',
      'immigration-detention': 'Immigration Rights Documentation Complete',
      'wrongful-arrest': 'Arrest Rights Documentation Complete',
      'cyber-harassment': 'Cyber Crime Documentation Complete',
      'voice': 'AI Situation Documentation Complete'
    };
    return titles[type] || 'Emergency Documentation Complete';
  };

  const isAccidentCase = type === 'car-accident';

  // Mock documentation data
  const collectedDocuments = [
    {
      name: 'Audio Recording',
      status: 'Complete',
      detail: '4:32 minutes, HD quality',
      icon: FileText,
      statusColor: 'text-success'
    },
    {
      name: 'GPS Location Data',
      status: 'Complete',
      detail: 'Precise coordinates + timestamp',
      icon: MapPin,
      statusColor: 'text-success'
    },
    {
      name: 'Timeline Documentation',
      status: 'Complete',
      detail: '8 events logged with timestamps',
      icon: Clock,
      statusColor: 'text-success'
    },
    {
      name: 'Photo Evidence',
      status: 'Missing',
      detail: 'No photos captured',
      icon: Upload,
      statusColor: 'text-warning'
    }
  ];

  const estimatedCost = '€450 - €1,200';
  const costDescription = 'Based on case complexity and representation level chosen';

  const handleDecision = (decision: string) => {
    setSelectedDecision(decision);
    if (decision === 'download') {
      // Simulate download
      alert('Downloading encrypted documentation package...');
      setTimeout(() => {
        alert('Download complete! All files are encrypted and ready for legal use.');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{getPageTitle(type || '')}</h1>
        </div>

        {/* Emergency Status */}
        <Card className="bg-success/10 backdrop-blur-sm border border-success rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Emergency Response Complete</h2>
              <p className="text-muted-foreground">Your situation has been documented and you have taken appropriate protective actions.</p>
            </div>
          </div>
        </Card>

        {/* Status & Legal Options for Accident Cases */}
        {isAccidentCase && (
          <Card className="bg-card backdrop-blur-sm border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Your Status & Legal Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Link to="/find-lawyer" className="block">
                  <Card className="bg-primary/10 border-primary hover:bg-primary/20 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">I'm a Student</div>
                        <div className="text-sm text-muted-foreground">Access student legal aid</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/find-lawyer" className="block">
                  <Card className="bg-success/10 border-success hover:bg-success/20 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-success" />
                      <div>
                        <div className="font-medium text-foreground">I Have Legal Insurance</div>
                        <div className="text-sm text-muted-foreground">Check coverage options</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex items-start space-x-3 mb-4">
                  <DollarSign className="h-6 w-6 text-warning mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Estimated Cost</div>
                    <div className="text-lg font-semibold text-warning">{estimatedCost}</div>
                    <div className="text-sm text-muted-foreground">{costDescription}</div>
                  </div>
                </div>

                <Button asChild>
                  <Link to="/case-assessment/initial-review">
                    Explore Detailed Legal Options
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Further Incident Details for Accident Cases */}
        {isAccidentCase && (
          <Card className="bg-card backdrop-blur-sm border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Further Incident Details (Optional)</CardTitle>
              <CardDescription>
                Adding more evidence can strengthen your case and insurance claim.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Upload className="h-6 w-6 mb-2" />
                  Add Photos
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Upload className="h-6 w-6 mb-2" />
                  Add Video
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Upload className="h-6 w-6 mb-2" />
                  Add Audio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Captured Documentation Summary */}
        <Card className="bg-card backdrop-blur-sm border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Documentation Summary</CardTitle>
            <CardDescription>
              Review all collected evidence and documentation from your emergency response.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collectedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <doc.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{doc.name}</div>
                      <div className="text-sm text-muted-foreground">{doc.detail}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${doc.statusColor}`}>
                      {doc.status}
                    </span>
                    {doc.status === 'Complete' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Missing Details */}
        <Card className="bg-warning/10 backdrop-blur-sm border-2 border-warning rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Important Missing Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              These items could strengthen your case if added now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Add Missing Documents Now</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Request Official Records</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Decision Point */}
        <Card className="bg-card backdrop-blur-sm border-2 hover:shadow-xl transition-all rounded-lg p-6">
          <CardHeader>
            <CardTitle className="text-foreground">What would you like to do next?</CardTitle>
            <CardDescription>
              Choose how you want to proceed with your documented case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Full Legal Case */}
              <Card className="border-2 border-primary hover:border-primary/80 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg text-foreground">Create Full Legal Case</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    Get comprehensive AI analysis, lawyer matching, and full legal support for your situation.
                    This includes case strategy, document preparation, and potential representation.
                  </CardDescription>
                  <Button
                    className="w-full"
                    asChild
                    onClick={() => setSelectedDecision('case')}
                  >
                    <Link to={`/case-assessment/emergency-${type}-${Date.now()}`}>
                      Yes, Create My Case
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Download Files Only */}
              <Card className="border-2 border-border hover:border-muted-foreground transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Download className="h-6 w-6 text-muted-foreground" />
                    <CardTitle className="text-lg text-foreground">Download Files Only</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    Download your collected data and documentation for personal records or to share
                    with your own legal representation. All files are encrypted and legally admissible.
                  </CardDescription>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleDecision('download')}
                  >
                    No, Just Download Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {selectedDecision === 'download' && (
          <Card className="bg-success/10 backdrop-blur-sm border border-success rounded-lg p-6 mt-6">
            <CardContent className="text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Download Complete</h3>
              <p className="text-muted-foreground">
                Your emergency documentation has been securely packaged and downloaded.
                All files are encrypted and can be used as legal evidence if needed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UrgentSummary;
