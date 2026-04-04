
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, DollarSign, Users, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Insurance = () => {
  const [policyNumber, setPolicyNumber] = useState('');
  const [provider, setProvider] = useState('');

  const insuranceProviders = [
    {
      name: 'ARAG',
      description: 'Germany\'s leading legal insurance provider',
      coverage: ['Civil law disputes', 'Employment law', 'Traffic law', 'Tenant law'],
      contact: '0211 963-0'
    },
    {
      name: 'ROLAND',
      description: 'Comprehensive legal protection insurance',
      coverage: ['Private legal matters', 'Professional liability', 'Property disputes', 'Contract law'],
      contact: '0221 8277-0'
    },
    {
      name: 'DAS',
      description: 'Reliable legal insurance solutions',
      coverage: ['Criminal defense', 'Administrative law', 'Social security law', 'Consumer protection'],
      contact: '089 6275-0'
    },
    {
      name: 'Advocard',
      description: 'Personal legal insurance coverage',
      coverage: ['Family law', 'Inheritance law', 'Neighbor disputes', 'Online legal issues'],
      contact: '0180 5 236 236'
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
          <div className="w-20 h-20 mx-auto mb-6 bg-success rounded-xl flex items-center justify-center">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">Legal Insurance</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Protect yourself with legal insurance coverage. Check your existing policy or explore new options 
            for comprehensive legal protection in Germany.
          </p>
        </div>

        {/* My Insurance Policy Section */}
        <Card className="bg-primary/10 backdrop-blur-sm border-2 border-primary rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-primary">My Insurance Policy</CardTitle>
            <CardDescription className="text-muted-foreground">
              Check your current legal insurance coverage and verify what legal services are included.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Insurance Provider</Label>
                <Input 
                  id="provider"
                  placeholder="e.g., ARAG, ROLAND, DAS"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="policy-number">Policy Number</Label>
                <Input 
                  id="policy-number"
                  placeholder="Your policy number"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button disabled={!provider || !policyNumber}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Coverage
              </Button>
              <Button variant="outline" asChild>
                <Link to="/find-lawyer">
                  Find Insurance-Accepted Lawyers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Providers */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Explore Insurance Providers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {insuranceProviders.map((provider, index) => (
              <Card key={index} className="bg-card border-2 hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <Shield className="h-6 w-6 text-success mr-2" />
                    {provider.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">{provider.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Coverage Areas</h4>
                    <ul className="space-y-1">
                      {provider.coverage.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center">
                          <CheckCircle className="h-3 w-3 text-success mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {provider.contact}
                  </div>

                  <Button className="w-full" variant="outline">
                    Learn More About {provider.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="bg-success/10 backdrop-blur-sm border-2 border-success rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-success">Why Legal Insurance?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-foreground">Cost Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Legal insurance covers attorney fees, court costs, and expert witness expenses.
                </p>
              </div>
              
              <div className="text-center">
                <Users className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-foreground">Access to Lawyers</h3>
                <p className="text-sm text-muted-foreground">
                  Network of qualified lawyers who accept insurance coverage for their services.
                </p>
              </div>
              
              <div className="text-center">
                <Shield className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-foreground">Peace of Mind</h3>
                <p className="text-sm text-muted-foreground">
                  Know that you're protected against unexpected legal costs and disputes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-card border-2 hover:shadow-xl transition-all rounded-lg p-6 text-center">
          <CardContent>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Ready to Get Protected?</h3>
            <p className="text-muted-foreground mb-6">
              Compare policies, check eligibility, or get personalized recommendations
              for legal insurance coverage that fits your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>
                Check Eligibility
              </Button>
              <Button variant="outline">
                Compare Policies
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insurance;
