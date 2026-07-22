import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { preconnectMaps } from '@/maps/preconnectMaps'
import { AuthProvider } from '@/auth/context/AuthContext'
import { CurrentMemberProvider } from '@/roles/context/CurrentMemberContext'
import { PublicEventsProvider } from '@/events/context/PublicEventsContext'
import RoleRoute from '@/core/router/RoleRoute'
import HomePage from '@/public-site/home/HomePage'
import { ToastViewport } from '@/shared/toast/ToastViewport'

const LoginPage = lazy(() => import('@/auth/pages/LoginPage'))
const AuthCallbackPage = lazy(() => import('@/auth/pages/AuthCallbackPage'))
const PrivacyPolicyPage = lazy(() => import('@/public-site/legal/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/public-site/legal/TermsOfServicePage'))
const AllEventsPage = lazy(() => import('@/events/pages/AllEventsPage'))
const EventsManagerPage = lazy(() => import('@/events/pages/EventsManagerPage'))
const ManageRolesPage = lazy(() => import('@/roles/pages/ManageRolesPage'))
const ManageTasksPage = lazy(() => import('@/tasks/pages/ManageTasksPage'))

function AppRoutes() {
  const isHome = useLocation().pathname === '/'

  // Home stays mounted for the whole session and is only hidden when a sub-route
  // is open — so navigating (or swiping) back reveals the *live* page instead of
  // remounting it. The countdown keeps ticking and every image stays decoded, so
  // there's no timer freeze or poster re-render on return: a back-swipe now feels
  // exactly like tapping the home button. Sub-routes render on top as usual.
  return (
    <>
      <div style={{ display: isHome ? 'contents' : 'none' }}>
        <HomePage active={isHome} />
      </div>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={null} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/all-events" element={<AllEventsPage />} />
          <Route path="/events" element={<RoleRoute minRole="subcom"><EventsManagerPage /></RoleRoute>} />
          <Route path="/subcom/tasks/:eventId" element={<RoleRoute minRole="subcom"><ManageTasksPage /></RoleRoute>} />
          <Route path="/roles" element={<RoleRoute minRole="president"><ManageRolesPage /></RoleRoute>} />
        </Routes>
      </Suspense>
    </>
  )
}

function App() {
  // Warm the connection to Google Maps hosts once the app is idle, so the first
  // map embed loads noticeably faster without competing with initial paint.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    const id = w.requestIdleCallback?.(preconnectMaps)
    const t = id === undefined ? setTimeout(preconnectMaps, 2000) : undefined
    return () => { if (t) clearTimeout(t) }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrentMemberProvider>
          <PublicEventsProvider>
            <AppRoutes />
          </PublicEventsProvider>
        </CurrentMemberProvider>
      </AuthProvider>
      <ToastViewport />
    </BrowserRouter>
  )
}

export default App
