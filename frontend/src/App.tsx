import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Public
const DualPortalLanding = lazy(() => import('@/pages/DualPortalLanding'))
const Login             = lazy(() => import('@/pages/Login'))
const Register          = lazy(() => import('@/pages/Register'))

// Citizen Portal
const Dashboard   = lazy(() => import('@/pages/Dashboard'))
const Cases       = lazy(() => import('@/pages/Cases'))
const NewCase     = lazy(() => import('@/pages/NewCase'))
const CaseDetail  = lazy(() => import('@/pages/CaseDetail'))
const Chat        = lazy(() => import('@/pages/Chat'))
const LawLibrary  = lazy(() => import('@/pages/LawLibrary'))
const Documents   = lazy(() => import('@/pages/Documents'))
const FindLawyer  = lazy(() => import('@/pages/FindLawyer'))
const MyReferrals = lazy(() => import('@/pages/MyReferrals'))

// Urgent Legal Help
const UrgentSelect  = lazy(() => import('@/pages/UrgentSelect'))
const UrgentAction  = lazy(() => import('@/pages/UrgentAction'))
const UrgentSummary = lazy(() => import('@/pages/UrgentSummary'))

// Professional Portal
const LawyerDashboard   = lazy(() => import('@/pages/pro/LawyerDashboard'))
const LawyerOnboarding  = lazy(() => import('@/pages/pro/LawyerOnboarding'))
const IncomingReferrals = lazy(() => import('@/pages/pro/IncomingReferrals'))

// ─── Full-screen loader ───────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Laden…</p>
      </div>
    </div>
  )
}

// ─── Protected route guard ────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// ─── Role guard for professional routes ──────────────────────────────────────
function RequirePro({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  const role  = localStorage.getItem('user_role')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (role && role !== 'lawyer' && role !== 'firm') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  useAuth() // warm up the auth query cache

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<DualPortalLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Citizen Portal (protected, citizen layout) ── */}
        <Route
          element={
            <RequireAuth>
              <Layout portalRole="citizen" />
            </RequireAuth>
          }
        >
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/cases"       element={<Cases />} />
          <Route path="/cases/new"   element={<NewCase />} />
          <Route path="/cases/:id"   element={<CaseDetail />} />
          <Route path="/chat"        element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/laws"        element={<LawLibrary />} />
          <Route path="/documents"   element={<Documents />} />
          <Route path="/find-lawyer" element={<FindLawyer />} />
          <Route path="/referrals"   element={<MyReferrals />} />
          {/* Urgent Legal Help */}
          <Route path="/urgent/select" element={<UrgentSelect />} />
          <Route path="/urgent/action/:type" element={<UrgentAction />} />
          <Route path="/urgent/summary/:type" element={<UrgentSummary />} />
        </Route>

        {/* ── Professional Portal (protected, pro layout) ── */}
        <Route
          element={
            <RequirePro>
              <Layout portalRole="lawyer" />
            </RequirePro>
          }
        >
          <Route path="/pro/dashboard"   element={<LawyerDashboard />} />
          <Route path="/pro/onboarding"  element={<LawyerOnboarding />} />
          <Route path="/pro/referrals"   element={<IncomingReferrals />} />
          {/* Additional pro routes reuse citizen pages with lawyer context */}
          <Route path="/pro/cases"       element={<Cases />} />
          <Route path="/pro/clients"     element={<Cases />} />
          <Route path="/pro/calendar"    element={<Dashboard />} />
          <Route path="/pro/profile"     element={<Dashboard />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
