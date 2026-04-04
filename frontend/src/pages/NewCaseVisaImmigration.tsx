import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText as PassportIcon, Globe, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NewCaseVisaImmigration = () => {
  const [visaType, setVisaType] = useState('');
  const [nationality, setNationality] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = (type: string) => {
    const fileName = `${type}_${Date.now()}.pdf`;
    setUploadedFiles(prev => [...prev, fileName]);
  };

  const canSubmit = visaType && nationality && description.trim().length > 10;

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
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <PassportIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Visa & Immigration Inquiry</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get guidance on visa applications, residence permits, citizenship, and immigration law matters in Germany.
          </p>
        </div>

        {/* Immigration Details */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Immigration Inquiry Details</CardTitle>
            <CardDescription>
              Please provide information about your visa or immigration situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visa-type">Visa/Permit Type</Label>
                <Select value={visaType} onValueChange={setVisaType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visa/permit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue-card">EU Blue Card</SelectItem>
                    <SelectItem value="work-permit">Work Permit (Arbeitserlaubnis)</SelectItem>
                    <SelectItem value="student-visa">Student Visa (Studentenvisum)</SelectItem>
                    <SelectItem value="residence-permit">Residence Permit (Aufenthaltserlaubnis)</SelectItem>
                    <SelectItem value="family-reunion">Family Reunion (Familienzusammenführung)</SelectItem>
                    <SelectItem value="asylum">Asylum Application (Asylantrag)</SelectItem>
                    <SelectItem value="citizenship">German Citizenship (Deutsche Staatsbürgerschaft)</SelectItem>
                    <SelectItem value="visa-extension">Visa Extension (Visaverlängerung)</SelectItem>
                    <SelectItem value="other">Other Immigration Matter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input 
                  id="nationality"
                  placeholder="e.g., Turkish, Indian, American"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current-status">Current Status in Germany</Label>
                <Select value={currentStatus} onValueChange={setCurrentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select current status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="worker">Employed</SelectItem>
                    <SelectItem value="job-seeker">Job Seeker</SelectItem>
                    <SelectItem value="tourist">Tourist/Visitor</SelectItem>
                    <SelectItem value="asylum-seeker">Asylum Seeker</SelectItem>
                    <SelectItem value="family-member">Family Member of German/EU Citizen</SelectItem>
                    <SelectItem value="none">Not yet in Germany</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="expiry-date">Current Visa/Permit Expiry</Label>
                <Input 
                  id="expiry-date"
                  type="date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description of Your Situation</Label>
              <Textarea
                id="description"
                placeholder="Please describe your immigration situation in detail. Include your goals, any challenges you're facing, deadlines, interactions with Ausländerbehörde, etc..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>
              Upload relevant documents such as passport, current visa, official letters from authorities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => handleFileUpload('passport')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <PassportIcon className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Passport/ID</div>
                  <div className="text-xs text-muted-foreground">Reisepass, Personalausweis</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('official-letters')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Official Letters</div>
                  <div className="text-xs text-muted-foreground">Ausländerbehörde, embassy</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('supporting-docs')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Supporting Docs</div>
                  <div className="text-xs text-muted-foreground">Certificates, contracts</div>
                </div>
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files:</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/30 rounded border">
                      <Upload className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{file}</span>
                      <span className="text-xs text-green-600">✓ Uploaded & Analyzed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Guidance */}
        <Card className="bg-purple-50/80 backdrop-blur-sm border border-purple-200 rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-800">Immigration Law Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              German immigration law provides various pathways for living and working in Germany. 
              Each visa type has specific requirements and application procedures.
            </p>
            <div className="text-sm text-purple-600">
              <strong>Important considerations:</strong> Application deadlines, required documentation, 
              language requirements, integration courses, and compliance with residence conditions.
            </div>
          </CardContent>
        </Card>

        {/* Submission */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold mb-4">Ready for Immigration Law Analysis?</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your immigration situation, review applicable German immigration law, 
              and provide guidance on the best path forward for your visa or residence goals.
            </p>
            <Button
              size="lg"
              disabled={!canSubmit}
              asChild={canSubmit}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {canSubmit ? (
                <Link to={`/case-assessment/immigration-${Date.now()}`}>
                  Analyze My Immigration Case
                </Link>
              ) : (
                <span>Please complete visa details and description</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCaseVisaImmigration;
