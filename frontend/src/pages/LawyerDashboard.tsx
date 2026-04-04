
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Inbox, 
  Briefcase, 
  MessageCircle, 
  CheckCircle, 
  CalendarDays, 
  Users, 
  Settings, 
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const LawyerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data
  const dashboardStats = {
    urgentAlerts: 2,
    newRequests: 7,
    activeCases: 12,
    upcomingDeadlines: 5,
    thisMonthRevenue: '€8,450',
    thisMonthCases: 15
  };

  const urgentAlerts = [
    {
      id: 1,
      type: 'Emergency Response',
      client: 'Anonymous User',
      situation: 'Police Stop Documentation',
      timestamp: '15 minutes ago',
      priority: 'critical'
    },
    {
      id: 2,
      type: 'Court Deadline',
      client: 'Maria Schmidt',
      situation: 'Appeal documents due tomorrow',
      timestamp: '2 hours ago',
      priority: 'high'
    }
  ];

  const newClientRequests = [
    {
      id: 1,
      client: 'Ahmed Hassan',
      caseType: 'Immigration Law',
      description: 'Blue Card visa application assistance',
      requestedDate: '2024-06-15',
      estimatedValue: '€500'
    },
    {
      id: 2,
      client: 'Julia Weber',
      caseType: 'Tenancy Law',
      description: 'Rent increase dispute in Paderborn',
      requestedDate: '2024-06-14',
      estimatedValue: '€350'
    },
    {
      id: 3,
      client: 'Thomas Mueller',
      caseType: 'Traffic Law',
      description: 'Speeding ticket appeal',
      requestedDate: '2024-06-13',
      estimatedValue: '€200'
    }
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      case: 'Schmidt vs. Landlord',
      deadline: 'Tomorrow, 5:00 PM',
      task: 'Submit appeal documents',
      priority: 'high'
    },
    {
      id: 2,
      case: 'Weber Employment Contract',
      deadline: 'June 20, 2024',
      task: 'Client consultation',
      priority: 'medium'
    },
    {
      id: 3,
      case: 'Hassan Visa Application',
      deadline: 'June 25, 2024',
      task: 'Document preparation',
      priority: 'low'
    }
  ];

  const recentActivity = [
    { action: 'New case assignment: Traffic Fine Appeal', time: '30 minutes ago' },
    { action: 'Client consultation completed with Maria Schmidt', time: '2 hours ago' },
    { action: 'Emergency response documented for police stop case', time: '4 hours ago' },
    { action: 'Document uploaded for Hassan visa case', time: '6 hours ago' },
    { action: 'Payment received: €450 from Weber case', time: '1 day ago' }
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'requests', label: 'Client Requests', icon: Inbox, badge: dashboardStats.newRequests },
    { id: 'cases', label: 'My Cases', icon: Briefcase, badge: dashboardStats.activeCases },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'todo', label: 'To-Do List', icon: CheckCircle },
    { id: 'calendar', label: 'Calendar & Deadlines', icon: CalendarDays, badge: dashboardStats.upcomingDeadlines },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'new-case', label: 'Create New Case', icon: PlusCircle }
  ];

  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* Urgent Alerts */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-6 w-6" />
            <span>Urgent Client Alerts</span>
            <Badge variant="destructive">{dashboardStats.urgentAlerts}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {urgentAlerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-white rounded border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-red-800">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">Client: {alert.client}</p>
                    <p className="text-sm">{alert.situation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                    <Button size="sm" variant="destructive" className="mt-2">
                      Review Urgent Case
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Inbox className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.newRequests}</p>
                <p className="text-sm text-muted-foreground">New Client Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.activeCases}</p>
                <p className="text-sm text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.upcomingDeadlines}</p>
                <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{dashboardStats.thisMonthRevenue}</p>
                <p className="text-sm text-muted-foreground">This Month Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Client Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>New Client Requests</span>
              <Button variant="outline" size="sm">
                Review All Requests
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newClientRequests.map((request) => (
                <div key={request.id} className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{request.client}</p>
                      <p className="text-sm text-muted-foreground">{request.caseType}</p>
                      <p className="text-sm">{request.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{request.estimatedValue}</p>
                      <p className="text-xs text-muted-foreground">{request.requestedDate}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="default">Accept</Button>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Deadlines</span>
              <Button variant="outline" size="sm">
                View All Deadlines
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{deadline.case}</p>
                      <p className="text-sm">{deadline.task}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deadline.deadline}</p>
                      <Badge 
                        variant={deadline.priority === 'high' ? 'destructive' : 
                                deadline.priority === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {deadline.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="flex-1">{activity.action}</span>
                <span className="text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlaceholderContent = (title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">This section is under development and will be available soon.</p>
      </CardContent>
    </Card>
  );

  const getMainContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardContent();
      case 'requests': return renderPlaceholderContent('Client Requests');
      case 'cases': return renderPlaceholderContent('My Cases');
      case 'messages': return renderPlaceholderContent('Messages');
      case 'todo': return renderPlaceholderContent('To-Do List');
      case 'calendar': return renderPlaceholderContent('Calendar & Deadlines');
      case 'team': return renderPlaceholderContent('Team Management');
      case 'settings': return renderPlaceholderContent('Settings');
      case 'new-case': return renderPlaceholderContent('Create New Case');
      default: return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Left Navigation Sidebar */}
        <div className="w-64 bg-white border-r border-border p-6 min-h-screen">
          <div className="mb-8">
            <h2 className="text-xl font-bold">Legal Command Center</h2>
            <p className="text-sm text-muted-foreground">Dr. Maria Weber</p>
          </div>
          
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">
                  {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-muted-foreground">Welcome back, Dr. Weber</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Quick Action
                </Button>
              </div>
            </div>

            {/* Main Content */}
            {getMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard;
