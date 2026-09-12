
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  UserCheck,
  Phone,
  Globe,
  X,
  Home,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChatAssistant } from '@/components/ChatAssistant';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  useEffect(() => {
    const openAssistant = () => setIsChatOpen(true);
    window.addEventListener('open-fellaw-assistant', openAssistant);
    return () => window.removeEventListener('open-fellaw-assistant', openAssistant);
  }, []);

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
    // PR-01: fabricated/frozen areas (law firms, insurance, self-service) are unrouted.
    { name: t('nav.myCases'), icon: Briefcase, href: '/user/dashboard', requiresAuth: true },
    { name: t('nav.findLawyers'), icon: UserCheck, href: '/find-lawyer', requiresAuth: false },
    { name: t('nav.contact'), icon: Phone, href: '/contact', requiresAuth: false }
  ];

  const handleNavClick = (e: React.MouseEvent, link: typeof navigationLinks[0]) => {
    if (link.requiresAuth && !isRegisteredUser) {
      e.preventDefault();
      window.location.href = '/auth/user/login';
    }
  };

  return (
    <div className="min-h-screen w-full bg-background relative fellow-shell">
      
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 fellow-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 fellow-brand">
              <div className="fellow-brand__mark">
                <img src="/logo.png" alt="fellaw" className="w-full h-full object-contain" />
              </div>
              <span className="fellow-brand__name">
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
                <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                  <img src="/logo.png" alt="fellaw" className="h-6 w-6 object-contain" />
                  <span className="text-lg font-semibold">fellaw</span>
                </Link>
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
                {navigationLinks
                  .filter(link => !link.requiresAuth || isRegisteredUser)
                  .map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={(e) => {
                        handleNavClick(e, link);
                        setIsMenuOpen(false);
                      }}
                    >
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground">{link.name}</span>
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

      {/* Floating Chat Button */}
      {!isChatOpen && !isEmergencyMode && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg fellow-chat-trigger"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Assistant */}
      {isChatOpen && <ChatAssistant onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default Layout;
