import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/auth/context/AuthContext'
import { CurrentMemberProvider } from '@/roles/context/CurrentMemberContext'
import RoleRoute from '@/core/router/RoleRoute'
import HomePage from '@/public-site/home/HomePage'

const LoginPage = lazy(() => import('@/auth/pages/LoginPage'))
const AuthCallbackPage = lazy(() => import('@/auth/pages/AuthCallbackPage'))
const PrivacyPolicyPage = lazy(() => import('@/public-site/legal/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/public-site/legal/TermsOfServicePage'))
const AllEventsPage = lazy(() => import('@/events/pages/AllEventsPage'))
const EventsManagerPage = lazy(() => import('@/events/pages/EventsManagerPage'))
const ManageRolesPage = lazy(() => import('@/roles/pages/ManageRolesPage'))
const ManageTasksPage = lazy(() => import('@/tasks/pages/ManageTasksPage'))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrentMemberProvider>
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
        </CurrentMemberProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
