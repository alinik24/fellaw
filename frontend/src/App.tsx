import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import UrgentSelect from "./pages/UrgentSelect";
import UrgentAction from "./pages/UrgentAction";
import UrgentSummary from "./pages/UrgentSummary";
import NewCase from "./pages/NewCase";
import NewCaseTrafficViolation from "./pages/NewCaseTrafficViolation";
import NewCaseConsumerDispute from "./pages/NewCaseConsumerDispute";
import NewCaseFamilyInquiry from "./pages/NewCaseFamilyInquiry";
import NewCaseEmploymentInquiry from "./pages/NewCaseEmploymentInquiry";
import NewCaseVisaImmigration from "./pages/NewCaseVisaImmigration";
import CaseAssessment from "./pages/CaseAssessment";
import SelfService from "./pages/SelfService";
import FindLawyer from "./pages/FindLawyer";
import OngoingCases from "./pages/OngoingCases";
import GraybeardMediation from "./pages/GraybeardMediation";
import LawyerOnboarding from "./pages/LawyerOnboarding";
import LawyerDashboard from "./pages/LawyerDashboard";
import LawFirms from "./pages/LawFirms";
import Insurance from "./pages/Insurance";
import Careers from "./pages/Careers";
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
            <Route path="/new-case/traffic-violation" element={<NewCaseTrafficViolation />} />
            <Route path="/new-case/consumer-dispute" element={<NewCaseConsumerDispute />} />
            <Route path="/new-case/family-inquiry" element={<NewCaseFamilyInquiry />} />
            <Route path="/new-case/employment-inquiry" element={<NewCaseEmploymentInquiry />} />
            <Route path="/new-case/visa-immigration" element={<NewCaseVisaImmigration />} />
            <Route path="/case-assessment/:caseId" element={<CaseAssessment />} />
            <Route path="/self-service" element={<SelfService />} />
            <Route path="/find-lawyer" element={<FindLawyer />} />
            <Route path="/ongoing-cases" element={<OngoingCases />} />
            <Route path="/graybeard-mediation" element={<GraybeardMediation />} />
            <Route path="/law-firms" element={<LawFirms />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/work-with-us/professionals" element={<LawyerOnboarding />} />
            <Route path="/work-with-us/careers" element={<Careers />} />
            <Route path="/dashboard" element={<LawyerDashboard />} />
            <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
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
