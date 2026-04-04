
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  DollarSign, 
  Calendar, 
  Shield, 
  Upload, 
  Eye, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const LawyerOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Firm Profile
    firmName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    officeHours: '',
    
    // Specializations
    specializations: [] as string[],
    languages: [] as string[],
    
    // Pricing
    pricingModel: '',
    hourlyRate: '',
    freeConsultation: false,
    proBono: false,
    
    // Verification
    barNumber: '',
    license: null as File | null,
    
    // Availability
    availabilityType: ''
  });

  const totalSteps = 6;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const specializationOptions = [
    'Traffic Law', 'Housing/Tenancy Law', 'Administrative Law', 'Criminal Law',
    'Family Law', 'Employment Law', 'Immigration Law', 'Consumer Rights',
    'Contract Law', 'Property Law', 'Tax Law', 'Insurance Law'
  ];

  const languageOptions = [
    'German', 'English', 'Turkish', 'Arabic', 'Russian', 'French',
    'Spanish', 'Italian', 'Polish', 'Portuguese'
  ];

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specializations: prev.specializations.filter(s => s !== specialization)
      }));
    }
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter(l => l !== language)
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-6 w-6" />
          <span>Firm/Individual Profile</span>
        </CardTitle>
        <CardDescription>Basic information about your legal practice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="firm-name">Firm/Practice Name</Label>
          <Input
            id="firm-name"
            placeholder="e.g., Weber Legal Services"
            value={formData.firmName}
            onChange={(e) => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="Königstraße 15"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Paderborn"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal">Postal Code</Label>
            <Input
              id="postal"
              placeholder="33098"
              value={formData.postalCode}
              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+49 5251 123456"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Professional Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="info@weberlegal.de"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              placeholder="https://weberlegal.de"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="hours">Office Hours</Label>
          <Input
            id="hours"
            placeholder="Mon-Fri: 9:00-17:00, Sat: 9:00-12:00"
            value={formData.officeHours}
            onChange={(e) => setFormData(prev => ({ ...prev, officeHours: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Legal Specializations</CardTitle>
        <CardDescription>Select your areas of legal expertise (select multiple)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {specializationOptions.map((specialization) => (
            <div key={specialization} className="flex items-center space-x-2">
              <Checkbox
                id={specialization}
                checked={formData.specializations.includes(specialization)}
                onCheckedChange={(checked) => handleSpecializationChange(specialization, !!checked)}
              />
              <Label htmlFor={specialization} className="text-sm">{specialization}</Label>
            </div>
          ))}
        </div>
        
        {formData.specializations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Selected Specializations:</p>
            <div className="flex flex-wrap gap-2">
              {formData.specializations.map((spec) => (
                <Badge key={spec} variant="secondary">{spec}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-6 w-6" />
          <span>Languages Spoken</span>
        </CardTitle>
        <CardDescription>Select all languages you can provide legal services in</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {languageOptions.map((language) => (
            <div key={language} className="flex items-center space-x-2">
              <Checkbox
                id={language}
                checked={formData.languages.includes(language)}
                onCheckedChange={(checked) => handleLanguageChange(language, !!checked)}
              />
              <Label htmlFor={language} className="text-sm">{language}</Label>
            </div>
          ))}
        </div>
        
        {formData.languages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Selected Languages:</p>
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang) => (
                <Badge key={lang} variant="secondary">{lang}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6" />
          <span>Pricing Models</span>
        </CardTitle>
        <CardDescription>Define your fee structure and service options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="pricing-model">Primary Pricing Model</Label>
          <Select value={formData.pricingModel} onValueChange={(value) => setFormData(prev => ({ ...prev, pricingModel: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select pricing model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly Rate</SelectItem>
              <SelectItem value="fixed">Fixed Fee</SelectItem>
              <SelectItem value="contingency">Contingency Fee</SelectItem>
              <SelectItem value="mixed">Mixed (Case-dependent)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.pricingModel === 'hourly' && (
          <div>
            <Label htmlFor="hourly-rate">Hourly Rate (€)</Label>
            <Input
              id="hourly-rate"
              type="number"
              placeholder="220"
              value={formData.hourlyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
            />
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-consultation"
              checked={formData.freeConsultation}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, freeConsultation: !!checked }))}
            />
            <Label htmlFor="free-consultation">Offer Free Initial Consultation (30 minutes)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pro-bono"
              checked={formData.proBono}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, proBono: !!checked }))}
            />
            <Label htmlFor="pro-bono">Accept Pro Bono / Reduced Fee Cases</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <span>Professional Verification</span>
        </CardTitle>
        <CardDescription>Verify your legal credentials and bar admission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bar-number">Bar Association Number</Label>
          <Input
            id="bar-number"
            placeholder="e.g., RAK Hamm 12345"
            value={formData.barNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, barNumber: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your registration number with the relevant German bar association
          </p>
        </div>
        
        <div>
          <Label htmlFor="license-upload">Upload License/Certificate</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload your bar admission certificate or professional license
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
          <p className="text-sm text-blue-800">
            <Shield className="h-4 w-4 inline mr-1" />
            All documents are securely encrypted and only used for verification purposes. 
            Your information will be verified within 24-48 hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <span>Availability Settings</span>
          </CardTitle>
          <CardDescription>Configure how clients can book consultations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="availability-type">Calendar Integration</Label>
            <Select value={formData.availabilityType} onValueChange={(value) => setFormData(prev => ({ ...prev, availabilityType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select availability management" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Calendar</SelectItem>
                <SelectItem value="outlook">Microsoft Outlook</SelectItem>
                <SelectItem value="manual">Manual Time Slots</SelectItem>
                <SelectItem value="always">Always Available (Call Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profile Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-6 w-6" />
            <span>Public Profile Preview</span>
          </CardTitle>
          <CardDescription>How your profile will appear to potential clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {formData.firmName.charAt(0) || 'L'}
              </div>
              <div>
                <h3 className="font-semibold">{formData.firmName || 'Your Firm Name'}</h3>
                <p className="text-sm text-muted-foreground">{formData.city || 'Your City'}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-1">
                {formData.specializations.slice(0, 3).map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                ))}
                {formData.specializations.length > 3 && (
                  <Badge variant="secondary" className="text-xs">+{formData.specializations.length - 3} more</Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span>📞 {formData.phone || 'Phone Number'}</span>
                <span>💬 {formData.languages.slice(0, 2).join(', ') || 'Languages'}</span>
              </div>
              
              {formData.freeConsultation && (
                <Badge variant="outline" className="text-xs">Free Consultation</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.firmName && formData.address && formData.city && formData.phone && formData.email;
      case 2: return formData.specializations.length > 0;
      case 3: return formData.languages.length > 0;
      case 4: return formData.pricingModel;
      case 5: return formData.barNumber;
      case 6: return formData.availabilityType;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Lawyer Onboarding & Profile Setup</h1>
          <p className="text-xl text-muted-foreground">Join our network of qualified legal professionals</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Step Content */}
        {getCurrentStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={!isStepValid()}
              asChild
            >
              <Link to="/dashboard">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Setup & Go to Dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LawyerOnboarding;
