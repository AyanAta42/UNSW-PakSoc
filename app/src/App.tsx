import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<HomePage />} />
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
          </PublicEventsProvider>
        </CurrentMemberProvider>
      </AuthProvider>
      <ToastViewport />
    </BrowserRouter>
  )
}

export default App
