
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Car, Calendar, MapPin, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NewCaseTrafficViolation = () => {
  const [violationType, setViolationType] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = (type: string) => {
    const fileName = `${type}_${Date.now()}.pdf`;
    setUploadedFiles(prev => [...prev, fileName]);
  };

  const canSubmit = violationType && location && description.trim().length > 10;

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

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary rounded-xl flex items-center justify-center">
            <Car className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">Traffic Violation Case</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Provide specific details about your traffic violation to receive targeted legal guidance.
          </p>
        </div>

        {/* Violation Details */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Violation Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please provide specific information about your traffic violation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="violation-type">Type of Violation</Label>
                <Select value={violationType} onValueChange={setViolationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speeding">Speeding (Geschwindigkeitsüberschreitung)</SelectItem>
                    <SelectItem value="parking">Parking Violation (Parkverstoß)</SelectItem>
                    <SelectItem value="red-light">Red Light Violation (Rotlichtverstoß)</SelectItem>
                    <SelectItem value="mobile-phone">Mobile Phone Use (Handyverstoß)</SelectItem>
                    <SelectItem value="right-of-way">Right of Way (Vorfahrtsverstoß)</SelectItem>
                    <SelectItem value="other">Other Traffic Violation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location">Location (Paderborn Area)</Label>
                <Input 
                  id="location"
                  placeholder="e.g., Paderborn City Center, A33 near Paderborn"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-time">Date & Time</Label>
                <Input 
                  id="date-time"
                  type="datetime-local"
                />
              </div>
              
              <div>
                <Label htmlFor="vehicle-details">Vehicle Details</Label>
                <Input 
                  id="vehicle-details"
                  placeholder="License plate, vehicle type"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened, any circumstances, whether you received a fine notice (Bußgeldbescheid), etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Supporting Documents</CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload any relevant documents such as the fine notice, photos, or witness statements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => handleFileUpload('fine-notice')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-muted"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Fine Notice</div>
                  <div className="text-xs text-muted-foreground">Bußgeldbescheid, ticket</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('photos')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-muted"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Photos</div>
                  <div className="text-xs text-muted-foreground">Scene, vehicle, signs</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('documents')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-muted"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Other Documents</div>
                  <div className="text-xs text-muted-foreground">Statements, evidence</div>
                </div>
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files:</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-success/10 rounded border">
                      <Upload className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">{file}</span>
                      <span className="text-xs text-success">✓ Uploaded & Analyzed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Guidance */}
        <Card className="bg-primary/10 backdrop-blur-sm border-2 border-primary rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-primary">AI Legal Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">
              Based on German traffic law, traffic violations can often be contested if there are procedural errors,
              unclear signage, or mitigating circumstances. Our AI will analyze your case for potential defenses.
            </p>
            <div className="text-sm text-muted-foreground">
              <strong>Common defenses include:</strong> Faulty measurement equipment, unclear road signs,
              emergency situations, or procedural violations in the citation process.
            </div>
          </CardContent>
        </Card>

        {/* Submission */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Ready for Traffic Law Analysis?</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your traffic violation case, review applicable German traffic laws,
              and recommend the best defense strategy.
            </p>
            <Button
              size="lg"
              disabled={!canSubmit}
              asChild={canSubmit}
            >
              {canSubmit ? (
                <Link to={`/case-assessment/traffic-${Date.now()}`}>
                  Analyze My Traffic Case
                </Link>
              ) : (
                <span>Please complete violation details and description</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCaseTrafficViolation;
