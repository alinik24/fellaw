import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Code,
  Scale,
  MessageSquare,
  TrendingUp,
  Heart,
  Shield,
  Globe,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Careers = () => {
  const openPositions = [
    {
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      location: 'Remote / Paderborn',
      type: 'Full-time',
      icon: Code,
      description: 'Build scalable legal tech solutions with React, TypeScript, and Node.js',
      requirements: ['5+ years experience', 'TypeScript/React', 'API design', 'Legal tech interest']
    },
    {
      title: 'Legal Operations Specialist',
      department: 'Legal',
      location: 'Hybrid / Bielefeld',
      type: 'Full-time',
      icon: Scale,
      description: 'Bridge the gap between legal expertise and technology',
      requirements: ['Law degree', 'Process optimization', 'Tech-savvy', 'German & English fluent']
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      icon: MessageSquare,
      description: 'Help clients maximize value from our platform',
      requirements: ['3+ years CS experience', 'Legal background helpful', 'Empathy', 'Problem-solving']
    },
    {
      title: 'Product Marketing Manager',
      department: 'Marketing',
      location: 'Remote / Gütersloh',
      type: 'Full-time',
      icon: TrendingUp,
      description: 'Tell the fellaw story and drive user growth',
      requirements: ['B2C/B2B marketing', 'Content creation', 'Analytics', 'Legal tech interest']
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, mental health support, and gym membership'
    },
    {
      icon: Zap,
      title: 'Flexible Work',
      description: 'Remote-first culture with flexible hours and unlimited PTO'
    },
    {
      icon: TrendingUp,
      title: 'Growth & Learning',
      description: 'Annual learning budget, conferences, and mentorship programs'
    },
    {
      icon: Users,
      title: 'Inclusive Culture',
      description: 'Diverse team, regular team events, and open communication'
    },
    {
      icon: Shield,
      title: 'Equity & Impact',
      description: 'Competitive equity packages and the chance to democratize legal access'
    },
    {
      icon: Globe,
      title: 'Global Team',
      description: 'Work with talented people across Germany and Europe'
    }
  ];

  const values = [
    {
      title: 'Access for All',
      description: 'We believe legal help should be accessible regardless of background or budget'
    },
    {
      title: 'Innovation with Purpose',
      description: 'We leverage technology to solve real problems, not for tech\'s sake'
    },
    {
      title: 'Transparency',
      description: 'We operate with honesty and clarity in everything we do'
    },
    {
      title: 'Continuous Learning',
      description: 'We embrace curiosity and growth, both individually and as a team'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary rounded-xl flex items-center justify-center">
            <Users className="h-10 w-10 text-primary-foreground" />
          </div>

          <h1 className="text-5xl font-bold mb-4 text-foreground">Join the fellaw Team</h1>

          <p className="text-xl text-muted-foreground mb-8">
            Help us democratize access to legal services across Germany
          </p>

          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="#positions">View Open Positions</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#culture">Our Culture</a>
            </Button>
          </div>
        </div>

        {/* Mission Statement */}
        <section className="mb-16 bg-card border-2 hover:shadow-xl transition-all rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            fellaw is on a mission to make quality legal assistance accessible to everyone in Germany.
            We're building intelligent, human-centered tools that empower people to understand and exercise
            their legal rights—without the complexity, cost, or intimidation of traditional systems.
          </p>
        </section>

        {/* Values */}
        <section id="culture" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="bg-card border-2 hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">{value.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Why fellaw?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-card border-2 hover:shadow-xl transition-all">
                <CardHeader className="text-center">
                  <benefit.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-lg text-foreground">{benefit.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section id="positions" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="bg-card border-2 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <position.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-2 text-foreground">{position.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{position.department}</Badge>
                          <Badge variant="outline">{position.location}</Badge>
                          <Badge>{position.type}</Badge>
                        </div>
                        <CardDescription className="text-base mb-4">{position.description}</CardDescription>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Key Requirements:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {position.requirements.map((req, i) => (
                              <li key={i} className="flex items-center">
                                <ArrowRight className="h-4 w-4 mr-2 text-primary" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <Button asChild>
                      <a href={`mailto:careers@fellaw.com?subject=Application: ${position.title}`}>
                        Apply Now
                      </a>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-primary text-primary-foreground rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Don't See Your Role?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            We're always looking for talented, passionate people. Send us your resume and tell us why you'd be a great fit.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="mailto:careers@fellaw.com?subject=General Application">
              Get in Touch
            </a>
          </Button>
        </section>

      </div>
    </div>
  );
};

export default Careers;
