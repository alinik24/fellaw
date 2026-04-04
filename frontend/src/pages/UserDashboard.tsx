import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  MessageSquare,
  Upload,
  Plus,
  Clock,
  FileText,
  AlertCircle,
  ArrowRight,
  Scale,
  TrendingUp,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Mock data - replace with real API calls
  const mockCases = [
    {
      id: '1',
      title: 'Parking Fine Appeal',
      type: 'traffic_violation',
      status: 'active',
      urgency: 'medium',
      nextStep: 'Submit documents',
      deadline: '2024-06-15',
      progress: 75,
      updated_at: '2024-06-01'
    },
    {
      id: '2',
      title: 'Rent Increase Dispute',
      type: 'housing',
      status: 'active',
      urgency: 'high',
      nextStep: 'Await landlord response',
      deadline: '2024-06-20',
      progress: 45,
      updated_at: '2024-06-03'
    },
    {
      id: '3',
      title: 'Employment Contract Review',
      type: 'employment',
      status: 'pending',
      urgency: 'low',
      nextStep: 'Initial review',
      deadline: '2024-07-01',
      progress: 20,
      updated_at: '2024-05-28'
    }
  ];

  const mockDocuments = [
    { id: '1', name: 'Contract_Review.pdf', type: 'contract', created_at: '2024-06-01', size: '2.3 MB' },
    { id: '2', name: 'Traffic_Ticket.jpg', type: 'evidence', created_at: '2024-05-30', size: '1.1 MB' },
    { id: '3', name: 'Rental_Agreement.pdf', type: 'contract', created_at: '2024-05-28', size: '3.2 MB' }
  ];

  const activeCases = mockCases.filter(c => c.status === 'active');
  const urgentCases = mockCases.filter(c => c.urgency === 'high' || c.urgency === 'critical');

  const stats = [
    {
      label: 'Active Cases',
      value: activeCases.length,
      icon: FolderOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      change: `${mockCases.length} total`
    },
    {
      label: 'Urgent Cases',
      value: urgentCases.length,
      icon: AlertCircle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      change: 'High Priority'
    },
    {
      label: 'Documents',
      value: mockDocuments.length,
      icon: FileText,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      change: `${mockDocuments.length} analyzed`
    },
    {
      label: 'AI Chats',
      value: 5,
      icon: MessageSquare,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      change: 'AI Conversations'
    }
  ];

  const quickActions = [
    {
      label: 'New Case',
      desc: 'Start a new legal case',
      icon: Plus,
      onClick: () => navigate('/new-case'),
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Ask AI',
      desc: 'Get legal guidance',
      icon: MessageSquare,
      onClick: () => navigate('/chat'),
      color: 'text-teal-600 dark:text-teal-400'
    },
    {
      label: 'Upload Document',
      desc: 'Analyze documents',
      icon: Upload,
      onClick: () => navigate('/documents'),
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Find Lawyer',
      desc: 'Get professional help',
      icon: Scale,
      onClick: () => navigate('/find-lawyer'),
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{"full_name": "User"}');
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {greeting}, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground text-lg">
                  {activeCases.length > 0
                    ? `You have ${activeCases.length} active case${activeCases.length === 1 ? '' : 's'}`
                    : 'Start your first legal case'}
                  {urgentCases.length > 0 && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                      · {urgentCases.length} urgent
                    </span>
                  )}
                </p>
              </div>
              <Button onClick={() => navigate('/new-case')} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Case
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2"
                onClick={action.onClick}
              >
                <CardContent className="p-6">
                  <action.icon className={`h-8 w-8 ${action.color} mb-3`} />
                  <h3 className="font-semibold text-lg mb-1">{action.label}</h3>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Cases</h2>
            <Button variant="outline" onClick={() => navigate('/ongoing-cases')}>
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="space-y-4">
            {mockCases.slice(0, 3).map((case_) => (
              <Card key={case_.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{case_.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          case_.urgency === 'high'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {case_.urgency}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Next: {case_.nextStep}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {case_.deadline}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{case_.progress}%</span>
                        </div>
                        <Progress value={case_.progress} className="h-2" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/case-assessment/${case_.id}`)}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Documents</h2>
            <Button variant="outline" onClick={() => navigate('/documents')}>
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDocuments.map((doc) => (
              <Card key={doc.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.size}</p>
                      <p className="text-xs text-muted-foreground">{doc.created_at}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                <p className="text-muted-foreground">
                  Our AI assistant is available 24/7 to answer your legal questions.
                </p>
              </div>
              <Button onClick={() => navigate('/chat')} size="lg" variant="default">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
