import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CurrentMemberProvider } from '@/roles/context/CurrentMemberContext'
import RoleRoute         from '@/core/router/RoleRoute'
import HomePage          from '@/public-site/home/HomePage'
import LoginPage         from '@/auth/pages/LoginPage'
import AuthCallbackPage  from '@/auth/pages/AuthCallbackPage'
import PrivacyPolicyPage from '@/public-site/legal/PrivacyPolicyPage'
import TermsOfServicePage from '@/public-site/legal/TermsOfServicePage'
import EventsManagerPage from '@/events/pages/EventsManagerPage'
import AllEventsPage     from '@/events/pages/AllEventsPage'
import ManageRolesPage   from '@/roles/pages/ManageRolesPage'
import ManageTasksPage   from '@/tasks/pages/ManageTasksPage'

function App() {
  return (
    <BrowserRouter>
      <CurrentMemberProvider>
        <Routes>
          {/* Public — anyone can visit */}
          <Route path="/"        element={<HomePage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms"   element={<TermsOfServicePage />} />

          <Route path="/all-events" element={<AllEventsPage />} />
          <Route path="/events"                element={<RoleRoute minRole="subcom"><EventsManagerPage /></RoleRoute>} />
          <Route path="/subcom/tasks/:eventId" element={<RoleRoute minRole="subcom"><ManageTasksPage /></RoleRoute>} />

          {/* President only */}
          <Route path="/roles" element={<RoleRoute minRole="president"><ManageRolesPage /></RoleRoute>} />
        </Routes>
      </CurrentMemberProvider>
    </BrowserRouter>
  )
}

export default App
