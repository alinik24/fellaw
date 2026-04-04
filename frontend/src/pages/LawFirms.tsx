
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Star, Users, Phone, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const LawFirms = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const mockLawFirms = [
    {
      id: 1,
      name: 'Rechtsanwälte Schmidt & Partner',
      description: 'Full-service law firm specializing in business and family law',
      specializations: ['Business Law', 'Family Law', 'Real Estate'],
      location: 'Paderborn City Center',
      rating: 4.8,
      reviewCount: 127,
      languages: ['German', 'English'],
      phone: '+49 5251 123456',
      website: 'www.schmidt-partner.de',
      established: '1995'
    },
    {
      id: 2,
      name: 'Kanzlei Weber & Associates',
      description: 'Immigration and employment law specialists',
      specializations: ['Immigration Law', 'Employment Law', 'Administrative Law'],
      location: 'Paderborn Südstadt',
      rating: 4.9,
      reviewCount: 89,
      languages: ['German', 'English', 'Turkish'],
      phone: '+49 5251 789012',
      website: 'www.weber-law.de',
      established: '2008'
    },
    {
      id: 3,
      name: 'Müller Rechtsanwälte',
      description: 'Criminal defense and traffic law experts',
      specializations: ['Criminal Law', 'Traffic Law', 'Administrative Law'],
      location: 'Paderborn Innenstadt',
      rating: 4.7,
      reviewCount: 156,
      languages: ['German', 'English', 'Russian'],
      phone: '+49 5251 345678',
      website: 'www.mueller-anwaelte.de',
      established: '1987'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Law Firms Network</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover trusted law firms across Germany. Find established practices with proven track records
            and specialized expertise in your area of need.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Search className="h-5 w-5 mr-2" />
              Find Law Firms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Search by firm name, location, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Filter by specialty (e.g., Family Law, Business Law)"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Law Firms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockLawFirms.map((firm) => (
            <Card key={firm.id} className="bg-card border-2 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Building2 className="h-8 w-8 text-primary mb-2" />
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-warning fill-current" />
                    <span className="text-sm font-medium text-foreground">{firm.rating}</span>
                    <span className="text-xs text-muted-foreground">({firm.reviewCount})</span>
                  </div>
                </div>
                <CardTitle className="text-xl text-foreground">{firm.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{firm.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-1">
                    {firm.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {firm.location}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    Established {firm.established}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 mr-2" />
                    {firm.languages.join(', ')}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {firm.phone}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" variant="default">
                    View Firm Profile
                  </Button>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/find-lawyer">
                      Find Individual Lawyers
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6 mt-12 text-center">
          <CardContent>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Law Firm Not Listed?</h3>
            <p className="text-muted-foreground mb-6">
              Are you a law firm interested in joining our network?
              Connect with clients looking for trusted legal representation.
            </p>
            <Button asChild>
              <Link to="/work-with-us/professionals">
                Join Our Network
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LawFirms;
