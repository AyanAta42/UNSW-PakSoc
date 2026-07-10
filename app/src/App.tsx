import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute    from '@/core/router/ProtectedRoute'
import HomePage          from '@/public-site/home/HomePage'
import LoginPage         from '@/auth/pages/LoginPage'
import PrivacyPolicyPage from '@/public-site/legal/PrivacyPolicyPage'
import TermsOfServicePage from '@/public-site/legal/TermsOfServicePage'
import EventsManagerPage from '@/events/pages/EventsManagerPage'
import ManageRolesPage   from '@/roles/pages/ManageRolesPage'
import ManageTasksPage   from '@/tasks/pages/ManageTasksPage'

function Dashboard() {
  return <div style={{ padding: 48, fontFamily: 'system-ui,sans-serif' }}>Dashboard — coming soon.</div>
}
function CreateEvent() {
  return <div style={{ padding: 48, fontFamily: 'system-ui,sans-serif' }}>Create Event — coming soon.</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"        element={<HomePage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms"   element={<TermsOfServicePage />} />

        {/* Protected routes — require login */}
        <Route path="/events"                element={<ProtectedRoute><EventsManagerPage /></ProtectedRoute>} />
        <Route path="/roles"                 element={<ProtectedRoute><ManageRolesPage /></ProtectedRoute>} />
        <Route path="/dashboard"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/subcom/tasks/:eventId" element={<ProtectedRoute><ManageTasksPage /></ProtectedRoute>} />
        <Route path="/exec/create-event"     element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
