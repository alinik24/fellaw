
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Calendar, Users, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NewCaseFamilyInquiry = () => {
  const [inquiryType, setInquiryType] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [children, setChildren] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = (type: string) => {
    const fileName = `${type}_${Date.now()}.pdf`;
    setUploadedFiles(prev => [...prev, fileName]);
  };

  const canSubmit = inquiryType && description.trim().length > 10;

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
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-pink-600 to-red-600 rounded-xl flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Family Law Inquiry</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get guidance on family law matters including marriage, divorce, child custody, and inheritance issues.
          </p>
        </div>

        {/* Family Law Details */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Family Law Inquiry Details</CardTitle>
            <CardDescription>
              Please provide information about your family law situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inquiry-type">Nature of Inquiry</Label>
                <Select value={inquiryType} onValueChange={setInquiryType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="divorce">Divorce Proceedings (Scheidung)</SelectItem>
                    <SelectItem value="child-custody">Child Custody (Sorgerecht)</SelectItem>
                    <SelectItem value="child-support">Child Support (Unterhalt)</SelectItem>
                    <SelectItem value="prenuptial">Prenuptial Agreement (Ehevertrag)</SelectItem>
                    <SelectItem value="inheritance">Inheritance Issues (Erbrecht)</SelectItem>
                    <SelectItem value="adoption">Adoption (Adoption)</SelectItem>
                    <SelectItem value="domestic-violence">Domestic Violence (Häusliche Gewalt)</SelectItem>
                    <SelectItem value="other">Other Family Matter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="marital-status">Current Marital Status</Label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="married">Married (Verheiratet)</SelectItem>
                    <SelectItem value="separated">Separated (Getrennt)</SelectItem>
                    <SelectItem value="divorced">Divorced (Geschieden)</SelectItem>
                    <SelectItem value="single">Single (Ledig)</SelectItem>
                    <SelectItem value="widowed">Widowed (Verwitwet)</SelectItem>
                    <SelectItem value="civil-partnership">Civil Partnership (Eingetragene Partnerschaft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="children">Number of Children</Label>
                <Input 
                  id="children"
                  placeholder="e.g., 2 children (ages 8, 12)"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="key-dates">Important Dates</Label>
                <Input 
                  id="key-dates"
                  placeholder="Marriage date, separation date, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Situation Summary</Label>
              <Textarea
                id="description"
                placeholder="Please describe your family law situation in detail. Include relevant background, current status, and what specific guidance or assistance you need..."
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
              Upload relevant documents such as marriage certificates, custody agreements, or court orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => handleFileUpload('certificates')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Certificates</div>
                  <div className="text-xs text-muted-foreground">Marriage, birth, divorce</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('legal-documents')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Legal Documents</div>
                  <div className="text-xs text-muted-foreground">Agreements, court orders</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('evidence')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Evidence</div>
                  <div className="text-xs text-muted-foreground">Communications, photos</div>
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
        <Card className="bg-pink-50/80 backdrop-blur-sm border border-pink-200 rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-pink-800">Family Law Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-pink-700 mb-4">
              German family law provides comprehensive protections for families and children. 
              Family matters often require sensitive handling and specialized legal expertise.
            </p>
            <div className="text-sm text-pink-600">
              <strong>Key principles:</strong> Best interests of children, financial security provisions, 
              mediation before court proceedings, equal parental rights, and protection from domestic violence.
            </div>
          </CardContent>
        </Card>

        {/* Submission */}
        <Card className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-6">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold mb-4">Ready for Family Law Analysis?</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your family law situation, review applicable German family law, 
              and recommend appropriate next steps with sensitivity to your family's needs.
            </p>
            <Button
              size="lg"
              disabled={!canSubmit}
              asChild={canSubmit}
              className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700"
            >
              {canSubmit ? (
                <Link to={`/case-assessment/family-${Date.now()}`}>
                  Analyze My Family Case
                </Link>
              ) : (
                <span>Please complete inquiry details and description</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCaseFamilyInquiry;
