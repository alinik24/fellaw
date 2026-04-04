
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  Shield, 
  Search, 
  Award, 
  DollarSign, 
  CalendarDays, 
  MapPin, 
  Globe, 
  ArrowRight, 
  Handshake, 
  Video, 
  Phone, 
  Users, 
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const FindLawyer = () => {
  const [isStudent, setIsStudent] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);

  // Mock lawyer data
  const mockLawyers = [
    {
      id: 1,
      name: 'Dr. Maria Weber',
      photo: '👩‍⚖️',
      specializations: ['Tenancy Law', 'Consumer Rights'],
      rating: 4.8,
      reviews: 127,
      priceModel: '€220/hour',
      nextAvailability: 'Today, 3:00 PM',
      location: 'Paderborn',
      languages: ['German', 'English'],
      badges: ['Insurance Accepted', 'Free Consult'],
      description: 'Specialized in tenant rights with 15+ years experience in Paderborn area.'
    },
    {
      id: 2,
      name: 'Rechtsanwalt Ahmed Hassan',
      photo: '👨‍⚖️',
      specializations: ['Immigration Law', 'Administrative Law'],
      rating: 4.9,
      reviews: 203,
      priceModel: '€190/hour',
      nextAvailability: 'Tomorrow, 10:00 AM',
      location: 'Bielefeld',
      languages: ['German', 'Arabic', 'English'],
      badges: ['Pro Bono'],
      description: 'Expert in immigration and asylum law, fluent in Arabic and German.'
    },
    {
      id: 3,
      name: 'Julia Schneider',
      photo: '👩‍💼',
      specializations: ['Traffic Law', 'Criminal Defense'],
      rating: 4.7,
      reviews: 89,
      priceModel: '€200/hour',
      nextAvailability: 'Friday, 2:00 PM',
      location: 'Gütersloh',
      languages: ['German'],
      badges: ['Insurance Accepted'],
      description: 'Criminal defense attorney with focus on traffic violations and misdemeanors.'
    }
  ];

  const handleInsuranceCheck = () => {
    alert(`Checking policy with ${insuranceProvider}... Policy verified! Filtering lawyers who accept your insurance.`);
  };

  const handleBooking = (lawyer: any) => {
    setSelectedLawyer(lawyer);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/case-assessment/sample">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Find a Lawyer for Your Case</h1>
          <p className="text-xl text-muted-foreground">We can connect you with lawyers specializing in tenancy law or rent dispute procedures.</p>
        </div>

        {/* Student Legal Services Card */}
        <Card className="bg-card border-2 border-primary rounded-lg p-6 mb-6 shadow-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl text-foreground">Student Legal Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="student-toggle" 
                checked={isStudent} 
                onCheckedChange={setIsStudent}
              />
              <Label htmlFor="student-toggle">I am a Student</Label>
            </div>
            
            {isStudent && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="university">Select your University</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uni-paderborn">Universität Paderborn</SelectItem>
                      <SelectItem value="fh-bielefeld">FH Bielefeld (Campus Paderborn)</SelectItem>
                      <SelectItem value="any">Any University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="secondary">
                  Find University Legal Service
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              Explore free or low-cost legal aid options available to students in Germany.
            </p>
          </CardContent>
        </Card>

        {/* Legal Insurance Coverage Card */}
        <Card className="bg-card border-2 border-success rounded-lg p-6 mb-6 shadow-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-success" />
              <CardTitle className="text-xl text-foreground">Legal Insurance Coverage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="insurance-toggle" 
                checked={hasInsurance} 
                onCheckedChange={setHasInsurance}
              />
              <Label htmlFor="insurance-toggle">I have Legal Insurance</Label>
            </div>
            
            {hasInsurance && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="insurance-provider">Insurance Provider</Label>
                  <Input 
                    id="insurance-provider"
                    placeholder="e.g., ARAG, ROLAND, DAS, Advocard"
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="policy-number">Policy Number</Label>
                  <Input 
                    id="policy-number"
                    placeholder="Enter your policy number"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={handleInsuranceCheck}>
                  Check My Policy Details & Filter Lawyers
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              Verify your legal insurance coverage and find lawyers who work with your provider.
            </p>
          </CardContent>
        </Card>

        {/* Find Lawyers Search Filters Card */}
        <Card className="bg-card border-2 rounded-lg p-6 mb-6 shadow-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Search className="h-6 w-6 text-foreground" />
              <CardTitle className="text-foreground">Find Lawyers</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">Filter lawyers by location, language, specialty, and availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  placeholder="e.g., Paderborn, Berlin"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="turkish">Turkish</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenancy">Tenancy Law</SelectItem>
                    <SelectItem value="traffic">Traffic Law</SelectItem>
                    <SelectItem value="criminal">Criminal Law</SelectItem>
                    <SelectItem value="immigration">Immigration Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <Switch id="pro-bono" />
                <Label htmlFor="pro-bono">Offers Pro Bono / Reduced Fees</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="free-consult" />
                <Label htmlFor="free-consult">Offers Free Initial Consultation</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Graybeard AI Mediation Integration */}
        <Card className="bg-card border-2 border-accent rounded-lg p-6 mb-6 text-center shadow-md">
          <CardHeader>
            <div className="flex items-center justify-center space-x-3">
              <Handshake className="h-6 w-6 text-accent" />
              <CardTitle className="text-foreground">Explore AI-Assisted Mediation (Graybeard)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Try to resolve disputes efficiently without court proceedings. Graybeard offers structured, neutral AI guidance.
            </p>
            <Button variant="outline" asChild>
              <Link to="/graybeard-mediation">
                <Handshake className="h-4 w-4 mr-2" />
                Start Mediation
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Available Lawyers Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Available Lawyers ({mockLawyers.length})</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLawyers.map((lawyer) => (
              <Card key={lawyer.id} className="bg-card border-2 hover:shadow-lg hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{lawyer.photo}</span>
                    <div>
                      <CardTitle className="text-lg text-foreground">{lawyer.name}</CardTitle>
                      <div className="flex items-center space-x-1 mt-1">
                        <Award className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium">{lawyer.rating}</span>
                        <span className="text-sm text-muted-foreground">({lawyer.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {lawyer.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.priceModel}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.nextAvailability}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.languages.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {lawyer.badges.map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{lawyer.description}</p>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" onClick={() => handleBooking(lawyer)}>
                        Book Consultation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Book Consultation with {lawyer.name}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Choose your preferred consultation type and schedule a time.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                            <Video className="h-6 w-6 mb-2" />
                            <span className="text-sm">Video Call</span>
                          </Button>
                          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                            <Phone className="h-6 w-6 mb-2" />
                            <span className="text-sm">Phone Call</span>
                          </Button>
                          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                            <MapPin className="h-6 w-6 mb-2" />
                            <span className="text-sm">In-Person</span>
                          </Button>
                        </div>

                        <div className="p-4 bg-muted rounded">
                          <p className="text-sm font-medium mb-2 text-foreground">Next Available:</p>
                          <p className="text-sm">{lawyer.nextAvailability}</p>
                        </div>
                        
                        <Button className="w-full">
                          Confirm Booking - {lawyer.priceModel}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindLawyer;
