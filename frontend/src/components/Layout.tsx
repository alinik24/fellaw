
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  Shield,
  BookOpen,
  Phone,
  Globe,
  X,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  // Check if we're in emergency mode
  const isEmergencyMode = location.pathname.includes('/urgent/action/') || location.pathname.includes('/urgent/summary/');

  // Check if user is registered
  const isRegisteredUser = localStorage.getItem('isRegisteredUser') === 'true';

  useEffect(() => {
    // Load identity state from localStorage
    const storedIdentity = localStorage.getItem('isAnonymous');
    if (storedIdentity !== null) {
      setIsAnonymous(storedIdentity === 'true');
    }
  }, []);

  useEffect(() => {
    // Close menu when navigating or entering emergency mode
    if (isEmergencyMode) {
      setIsMenuOpen(false);
    }
  }, [location.pathname, isEmergencyMode]);

  const toggleIdentity = () => {
    const newState = !isAnonymous;
    setIsAnonymous(newState);
    localStorage.setItem('isAnonymous', newState.toString());
    localStorage.setItem('isRegisteredUser', (!newState).toString());
  };

  const confirmGoIncognito = () => {
    setIsAnonymous(true);
    localStorage.setItem('isAnonymous', 'true');
    localStorage.setItem('isRegisteredUser', 'false');
    setIsMenuOpen(false);
  };

  const navigationLinks = [
    { name: 'My Cases', icon: Briefcase, href: '/ongoing-cases' },
    { name: 'Law Firms Network', icon: Building2, href: '/law-firms' },
    { name: 'Find Lawyers', icon: UserCheck, href: '/find-lawyer' },
    { name: 'Legal Insurance', icon: Shield, href: '/insurance' },
    { name: 'Self-Service Legal Tools', icon: BookOpen, href: '/self-service' },
    { name: 'Contact & Support', icon: Phone, href: '/contact' }
  ];

  return (
    <div className="min-h-screen w-full bg-background relative">
      {/* Dynamic Background Elements */}
      <div className="legal-stripe-pattern fixed inset-0 pointer-events-none opacity-10" />
      <div className="floating-shapes fixed inset-0 pointer-events-none" />
      
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform">
              <div className="w-8 h-8">
                <img src="/logo.png" alt="fellaw" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                fellaw
              </span>
            </Link>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2">
              {/* Language Selector */}
              <LanguageSelector />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Identity Toggle */}
              {isAnonymous ? (
                <Button
                  onClick={toggleIdentity}
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3 py-1 text-sm font-medium"
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  {t('nav.incognito')}
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3 py-1 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('nav.registered')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Identity Change</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to switch to Anonymous Mode? This will remove your personal data from this session and limit personalized features.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmGoIncognito}>Go Incognito</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Hamburger Menu Button */}
              {!isEmergencyMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && !isEmergencyMode && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div
            className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <img src="/logo.png" alt="fellaw" className="h-6 w-6 object-contain" />
                  <span className="text-lg font-semibold">fellaw</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-4 mb-8">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200">{link.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
