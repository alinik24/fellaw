import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import UrgentSelect from "./pages/UrgentSelect";
import UrgentAction from "./pages/UrgentAction";
import UrgentSummary from "./pages/UrgentSummary";
import NewCase from "./pages/NewCase";
import FindLawyer from "./pages/FindLawyer";
import UserLogin from "./pages/auth/UserLogin";
import UserRegister from "./pages/auth/UserRegister";
import LawyerLogin from "./pages/auth/LawyerLogin";
import UserDashboard from "./pages/UserDashboard";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/urgent/select" element={<UrgentSelect />} />
            <Route path="/urgent/action/:type" element={<UrgentAction />} />
            <Route path="/urgent/summary/:type" element={<UrgentSummary />} />
            <Route path="/new-case" element={<NewCase />} />
            {/* PR-01C: non-persistent specialized funnels removed; legacy URLs
                resolve to the canonical persisted intake. */}
            <Route path="/new-case/traffic-violation" element={<Navigate to="/new-case" replace />} />
            <Route path="/new-case/consumer-dispute" element={<Navigate to="/new-case" replace />} />
            <Route path="/new-case/family-inquiry" element={<Navigate to="/new-case" replace />} />
            <Route path="/new-case/employment-inquiry" element={<Navigate to="/new-case" replace />} />
            <Route path="/new-case/visa-immigration" element={<Navigate to="/new-case" replace />} />
            {/* Removed/frozen surfaces redirect to safe state-backed destinations (PR-01). */}
            <Route path="/case-assessment/:caseId" element={<Navigate to="/user/dashboard" replace />} />
            <Route path="/self-service" element={<Navigate to="/" replace />} />
            <Route path="/find-lawyer" element={<FindLawyer />} />
            <Route path="/ongoing-cases" element={<Navigate to="/user/dashboard" replace />} />
            <Route path="/graybeard-mediation" element={<Navigate to="/" replace />} />
            <Route path="/law-firms" element={<Navigate to="/" replace />} />
            <Route path="/insurance" element={<Navigate to="/" replace />} />
            <Route path="/work-with-us/professionals" element={<Navigate to="/" replace />} />
            <Route path="/work-with-us/careers" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/lawyer/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/contact" element={<Contact />} />
            {/* Authentication Routes */}
            <Route path="/auth/user/login" element={<UserLogin />} />
            <Route path="/auth/user/register" element={<UserRegister />} />
            <Route path="/auth/lawyer/login" element={<LawyerLogin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
