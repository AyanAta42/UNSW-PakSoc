import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/auth/context/AuthContext'
import { CurrentMemberProvider } from '@/roles/context/CurrentMemberContext'
import { PublicEventsProvider } from '@/events/context/PublicEventsContext'
import HomePage from '@/public-site/home/HomePage'

const LoginPage = lazy(() => import('@/auth/pages/LoginPage'))
const AuthCallbackPage = lazy(() => import('@/auth/pages/AuthCallbackPage'))
const PrivacyPolicyPage = lazy(() => import('@/public-site/legal/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/public-site/legal/TermsOfServicePage'))
const AllEventsPage = lazy(() => import('@/events/pages/AllEventsPage'))
const EventsManagerPage = lazy(() => import('@/events/pages/EventsManagerPage'))
const ManageRolesPage = lazy(() => import('@/roles/pages/ManageRolesPage'))
const ManageTasksPage = lazy(() => import('@/tasks/pages/ManageTasksPage'))
const RoleRoute = lazy(() => import('@/core/router/RoleRoute'))

function App() {
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
                <Route
                  path="/events"
                  element={
                    <Suspense fallback={null}>
                      <RoleRoute minRole="subcom"><EventsManagerPage /></RoleRoute>
                    </Suspense>
                  }
                />
                <Route
                  path="/subcom/tasks/:eventId"
                  element={
                    <Suspense fallback={null}>
                      <RoleRoute minRole="subcom"><ManageTasksPage /></RoleRoute>
                    </Suspense>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <Suspense fallback={null}>
                      <RoleRoute minRole="president"><ManageRolesPage /></RoleRoute>
                    </Suspense>
                  }
                />
              </Routes>
            </Suspense>
          </PublicEventsProvider>
        </CurrentMemberProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
