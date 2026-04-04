
import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Award,
  DollarSign,
  Clock,
  Star,
  Globe,
  MapPin,
  Users,
  Shield,
  Building2,
  UserCheck,
  BookOpen,
  Settings,
  CalendarDays,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t } = useLanguage();
  const isRegisteredUser = localStorage.getItem('isRegisteredUser') === 'true';

  const mockCases = [
    {
      id: '1',
      title: 'Parking Fine Appeal',
      nextStep: 'Submit documents',
      deadline: '2024-06-15',
      progress: 75
    },
    {
      id: '2',
      title: 'Rent Increase Dispute',
      nextStep: 'Await landlord response',
      deadline: '2024-06-20',
      progress: 45
    }
  ];

  const successStats = [
    { icon: CheckCircle, number: '15,000+', label: t('home.stats.casesResolved') },
    { icon: Award, number: '98%', label: t('home.stats.successRate') },
    { icon: DollarSign, number: '€2.3M', label: t('home.stats.costsSaved') },
    { icon: Clock, number: '48h', label: t('home.stats.avgResponse') }
  ];

  const testimonials = [
    {
      name: 'Maria Schmidt',
      role: 'Small Business Owner',
      location: 'Paderborn',
      rating: 5,
      quote: 'fellaw helped me resolve a contract dispute in just 3 days. The AI guidance was incredibly helpful.',
      caseType: 'Contract Dispute',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'Ahmed Hassan',
      role: 'Student',
      location: 'Bielefeld',
      rating: 5,
      quote: 'As an international student, I was overwhelmed by German legal procedures. This platform made everything clear.',
      caseType: 'Visa Extension',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'Julia Weber',
      role: 'Freelancer',
      location: 'Gütersloh',
      rating: 5,
      quote: 'The emergency assistance feature was a lifesaver during my car accident. Professional and efficient.',
      caseType: 'Car Accident',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const legalInsurancePartners = [
    {
      name: 'ARAG',
      description: 'Leading German legal insurance provider',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop',
      specialties: ['Family Law', 'Traffic Law', 'Employment Law']
    },
    {
      name: 'ROLAND',
      description: 'Comprehensive legal protection services',
      logo: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=200&h=100&fit=crop',
      specialties: ['Real Estate', 'Consumer Rights', 'Criminal Defense']
    },
    {
      name: 'DAS',
      description: 'Trusted legal insurance since 1928',
      logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&h=100&fit=crop',
      specialties: ['Business Law', 'Insurance Disputes', 'Contract Law']
    },
    {
      name: 'Advocard',
      description: 'Modern legal insurance solutions',
      logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=200&h=100&fit=crop',
      specialties: ['Immigration Law', 'Tax Law', 'Administrative Law']
    }
  ];

  const quickAccessCards = [
    {
      title: 'Law Firms Network',
      description: 'Connect with verified law firms across Germany',
      icon: Building2,
      href: '/law-firms'
    },
    {
      title: 'Find Your Lawyer',
      description: 'Match with specialized lawyers for your case',
      icon: UserCheck,
      href: '/find-lawyer'
    },
    {
      title: 'Legal Insurance',
      description: 'Explore legal insurance options and coverage',
      icon: Shield,
      href: '/insurance'
    },
    {
      title: 'Careers at fellaw',
      description: 'Join our mission to make legal services accessible',
      icon: Briefcase,
      href: '/work-with-us/careers'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Registered User View */}
        {isRegisteredUser ? (
          <>
            {/* Welcome Back Section */}
            <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-xl p-8 mb-12 shadow-lg text-left">
              <h1 className="text-4xl font-bold mb-2">Welcome Back, User!</h1>
              <p className="text-xl text-muted-foreground mb-8">Ready to continue your legal journey?</p>

              {/* Active Cases */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Your Active Cases</h2>
                {mockCases.length > 0 ? (
                  <div className="space-y-4">
                    {mockCases.map((case_) => (
                      <Card key={case_.id} className="bg-white/30 dark:bg-gray-800/30 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{case_.title}</h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                Next: {case_.nextStep}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <CalendarDays className="h-4 w-4 mr-1" />
                                Deadline: {case_.deadline}
                              </div>
                            </div>
                            <Button size="sm" asChild>
                              <Link to={`/case-assessment/${case_.id}`}>Continue</Link>
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{case_.progress}%</span>
                            </div>
                            <Progress value={case_.progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-6 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No active cases found.</p>
                    <Button asChild>
                      <Link to="/new-case">Start New Case</Link>
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </>
        ) : (
          /* New User View */
          <>
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center mb-16">
              <div className="w-20 h-20 mx-auto mb-6 hover:scale-105 transition-transform">
                <img src="/logo.png" alt="fellaw Logo" className="w-full h-full object-contain" />
              </div>

              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('home.title')}
              </h1>

              <h2 className="text-2xl mb-4 text-foreground">{t('home.tagline')}</h2>

              <p className="text-xl text-muted-foreground mb-12">
                {t('home.description')}
              </p>
            </div>

            {/* Success Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {successStats.map((stat, index) => (
                <Card key={index} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-foreground">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* SECTION 1: Main Action Buttons - Crisis Now & Get Legal Advice */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/urgent/select"
                    className="group relative h-48 overflow-hidden rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  >
                    <img
                      src="/images/crises.png"
                      alt="Crisis Now"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 via-red-600/70 to-transparent flex flex-col items-center justify-end p-6 group-hover:from-red-900 transition-all">
                      <span className="text-2xl font-bold text-white mb-2">{t('home.crisisNow')}</span>
                      <span className="text-sm text-white/90 text-center">For emergency legal situations</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>For police stops, accidents, assaults, or time-critical situations.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/new-case"
                    className="group relative h-48 overflow-hidden rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  >
                    <img
                      src="/images/normal.png"
                      alt="Get Legal Advice"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-600/70 to-transparent flex flex-col items-center justify-end p-6 group-hover:from-blue-900 transition-all">
                      <span className="text-2xl font-bold text-white mb-2">{t('home.getLegalAdvice')}</span>
                      <span className="text-sm text-white/90 text-center">Build your legal case step by step</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Describe your situation at your own pace. For contract reviews, disputes, or general inquiries.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </section>

        {/* Separator */}
        <div className="flex items-center justify-center my-12">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <div className="mx-4">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* SECTION 2: Dashboard Access Section */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800 hover:shadow-xl transition-all">
              <CardHeader>
                <UserCheck className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle className="text-2xl">User Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Manage your cases, documents, and communications in one place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" size="lg">
                  <Link to="/auth/user/login">Access Dashboard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all">
              <CardHeader>
                <Briefcase className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">{t('home.lawyerDashboard.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('home.lawyerDashboard.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" size="lg">
                  <Link to="/auth/lawyer/login">{t('home.lawyerDashboard.button')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trusted Legal Insurance Partners */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Trusted Legal Insurance Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {legalInsurancePartners.map((partner) => (
              <Card key={partner.name} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-full h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-xl font-bold">{partner.name}</CardTitle>
                  <CardDescription className="text-sm">{partner.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {partner.specialties.map((specialty, index) => (
                      <div key={index} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full inline-block mr-1 mb-1">
                        {specialty}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Trusted by Professionals</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="flex text-yellow-400 mb-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <div className="font-semibold">{testimonial.name}</div>
                    </div>
                  </div>
                  <blockquote className="text-sm italic mb-4">"{testimonial.quote}"</blockquote>
                  <div className="text-sm">
                    <div className="text-muted-foreground">{testimonial.role}, {testimonial.location}</div>
                    <div className="text-blue-600 font-medium">Case: {testimonial.caseType}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Platform Description */}
        <section className="mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">A Horizontal Intelligent Research-Based Platform</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered platform combines legal expertise with intelligent automation to provide comprehensive legal solutions across Germany, supporting multiple languages and specialized workflows.
          </p>
        </section>

        {/* Quick Access Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Quick Access & Tailor Your Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickAccessCards.map((card, index) => (
              <Link key={index} to={card.href}>
                <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <card.icon className="h-8 w-8 text-blue-600 mb-2" />
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}

            {/* Modular Platform Card */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <Settings className="h-8 w-8 text-purple-600 mb-2" />
                    <CardTitle className="text-lg">Tailor Your Legal Workflow</CardTitle>
                    <CardDescription>Customize features to your specific needs</CardDescription>
                  </CardHeader>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modular Legal Platform</DialogTitle>
                  <DialogDescription>
                    Our modular platform allows you to build your own office and workflows, customizing features to your specific legal needs and practice. You can configure automated document generation, client communication workflows, case tracking systems, and specialized tools for different areas of law.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Serving All of Germany */}
        <section className="text-center bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6">Serving All of Germany</h2>
          <div className="flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-blue-600" />
              <span>Nationwide Coverage</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-green-600" />
              <span>Local Expertise</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-purple-600" />
              <span>Multilingual Support</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
