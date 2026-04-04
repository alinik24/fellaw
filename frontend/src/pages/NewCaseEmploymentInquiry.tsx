
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, Building, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NewCaseEmploymentInquiry = () => {
  const [issueType, setIssueType] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [employmentDates, setEmploymentDates] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = (type: string) => {
    const fileName = `${type}_${Date.now()}.pdf`;
    setUploadedFiles(prev => [...prev, fileName]);
  };

  const canSubmit = issueType && description.trim().length > 10;

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
            <Briefcase className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">Employment Law Inquiry</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get guidance on employment law matters including workplace rights, termination, contracts, and workplace disputes.
          </p>
        </div>

        {/* Employment Details */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Employment Issue Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please provide information about your employment law situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue-type">Type of Issue</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termination">Termination/Dismissal (Kündigung)</SelectItem>
                    <SelectItem value="workplace-discrimination">Workplace Discrimination (Diskriminierung)</SelectItem>
                    <SelectItem value="harassment">Workplace Harassment (Mobbing)</SelectItem>
                    <SelectItem value="wage-dispute">Wage Dispute (Lohnstreit)</SelectItem>
                    <SelectItem value="contract-review">Contract Review (Vertragsüberprüfung)</SelectItem>
                    <SelectItem value="working-conditions">Working Conditions (Arbeitsbedingungen)</SelectItem>
                    <SelectItem value="maternity-leave">Maternity/Parental Leave (Mutterschutz/Elternzeit)</SelectItem>
                    <SelectItem value="sick-leave">Sick Leave Issues (Krankschreibung)</SelectItem>
                    <SelectItem value="other">Other Employment Matter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="employer-name">Employer Name</Label>
                <Input 
                  id="employer-name"
                  placeholder="Company or organization name"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employment-dates">Employment Period</Label>
                <Input 
                  id="employment-dates"
                  placeholder="e.g., January 2020 - Present"
                  value={employmentDates}
                  onChange={(e) => setEmploymentDates(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="position">Position/Role</Label>
                <Input 
                  id="position"
                  placeholder="Your job title or role"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe your employment law issue in detail. Include what happened, when it occurred, who was involved, and what steps you've already taken..."
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
              Upload relevant documents such as employment contracts, termination letters, or correspondence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => handleFileUpload('contract')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-muted"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Employment Contract</div>
                  <div className="text-xs text-muted-foreground">Arbeitsvertrag</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('correspondence')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-muted"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Correspondence</div>
                  <div className="text-xs text-muted-foreground">Emails, letters, notices</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('evidence')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-muted"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Evidence</div>
                  <div className="text-xs text-muted-foreground">Screenshots, documents</div>
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
            <CardTitle className="text-primary">Employment Law Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">
              German employment law provides strong worker protections including termination protections,
              equal treatment requirements, and comprehensive rights for employees.
            </p>
            <div className="text-sm text-muted-foreground">
              <strong>Key protections include:</strong> Notice periods for termination, protection against unfair dismissal,
              anti-discrimination laws, wage continuation during illness, and works council rights.
            </div>
          </CardContent>
        </Card>

        {/* Submission */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Ready for Employment Law Analysis?</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your employment law situation, review applicable German labor law,
              and recommend the best course of action to protect your rights.
            </p>
            <Button
              size="lg"
              disabled={!canSubmit}
              asChild={canSubmit}
            >
              {canSubmit ? (
                <Link to={`/case-assessment/employment-${Date.now()}`}>
                  Analyze My Employment Case
                </Link>
              ) : (
                <span>Please complete issue details and description</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCaseEmploymentInquiry;
