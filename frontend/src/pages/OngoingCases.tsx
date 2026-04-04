
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Briefcase, 
  Clock, 
  CalendarDays, 
  Users, 
  DollarSign, 
  HelpCircle,
  ClipboardList,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const OngoingCases = () => {
  // Mock active cases data
  const activeCases = [
    {
      id: 'case-001',
      title: 'Rent Increase Dispute',
      type: 'Tenancy Law',
      status: 'In Progress',
      progress: 65,
      nextStep: 'Await landlord response',
      deadline: '2024-07-15',
      assignedLawyer: 'Dr. Maria Weber',
      estimatedCost: '€450',
      outcomePrediction: 'High Success',
      icon: FileText,
      priority: 'medium'
    },
    {
      id: 'case-002',
      title: 'Traffic Fine Appeal',
      type: 'Traffic Law',
      status: 'Action Required',
      progress: 30,
      nextStep: 'Submit appeal documents',
      deadline: '2024-06-20',
      assignedLawyer: 'Self-Service',
      estimatedCost: '€0',
      outcomePrediction: 'Moderate Success',
      icon: Briefcase,
      priority: 'high'
    },
    {
      id: 'case-003',
      title: 'Employment Contract Review',
      type: 'Employment Law',
      status: 'Consultation Scheduled',
      progress: 15,
      nextStep: 'Lawyer consultation on June 18',
      deadline: '2024-06-25',
      assignedLawyer: 'Julia Schneider',
      estimatedCost: '€220',
      outcomePrediction: 'Review Only',
      icon: FileText,
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50/50';
      case 'medium': return 'border-yellow-500 bg-yellow-50/50';
      case 'low': return 'border-green-500 bg-green-50/50';
      default: return 'border-gray-200 bg-white/80 dark:bg-gray-800/80';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Low</Badge>;
      default: return null;
    }
  };

  const getOutcomePredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'High Success': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'Moderate Success': return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      case 'Review Only': return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">My Active Legal Cases</h1>
          <p className="text-xl text-muted-foreground">Track and manage all your ongoing legal matters in one place.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{activeCases.length}</p>
                  <p className="text-sm text-muted-foreground">Active Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">Urgent Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CalendarDays className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">€670</p>
                  <p className="text-sm text-muted-foreground">Total Est. Costs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases Grid */}
        {activeCases.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {activeCases.map((case_) => (
              <Card 
                key={case_.id} 
                className={`shadow-lg hover:shadow-xl transition-all duration-200 ${getPriorityColor(case_.priority)}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <case_.icon className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{case_.title}</CardTitle>
                        <CardDescription>{case_.type}</CardDescription>
                      </div>
                    </div>
                    {getPriorityBadge(case_.priority)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Section */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Status: {case_.status}</span>
                      <span>{case_.progress}% Complete</span>
                    </div>
                    <Progress value={case_.progress} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  {/* Case Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Next Step</p>
                        <p className="text-muted-foreground">{case_.nextStep}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Deadline</p>
                        <p className="text-muted-foreground">{case_.deadline}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Assigned Lawyer</p>
                        <p className="text-muted-foreground">{case_.assignedLawyer}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Estimated Cost</p>
                        <p className="text-muted-foreground">{case_.estimatedCost}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Outcome Prediction */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded">
                    {getOutcomePredictionIcon(case_.outcomePrediction)}
                    <div>
                      <p className="font-medium text-sm">Outcome Prediction</p>
                      <p className="text-muted-foreground text-sm">{case_.outcomePrediction}</p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Button asChild className="w-full">
                    <Link to={`/case-assessment/${case_.id}`}>
                      View Case Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* No Active Cases State */
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-12 text-center">
            <ClipboardList className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">No Active Cases Found</h2>
            <p className="text-muted-foreground mb-8">You don't have any ongoing legal cases at the moment. Start by describing your legal situation.</p>
            <Button asChild size="lg">
              <Link to="/new-case">
                <FileText className="h-4 w-4 mr-2" />
                Start a New Case
              </Link>
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        {activeCases.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for managing your legal cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" asChild>
                  <Link to="/new-case">
                    <FileText className="h-4 w-4 mr-2" />
                    Start New Case
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-lawyer">
                    <Users className="h-4 w-4 mr-2" />
                    Find a Lawyer
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/self-service">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Self-Service Tools
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OngoingCases;
