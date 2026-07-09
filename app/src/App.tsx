import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home          from '@/pages/public/Home'
import Login         from '@/pages/auth/Login'
import Dashboard     from '@/pages/member/Dashboard'
import ManageTasks   from '@/pages/subcom/ManageTasks'
import CreateEvent   from '@/pages/exec/CreateEvent'
import EventsPage    from '@/pages/events/EventsPage'
import ManageRoles   from '@/pages/roles/ManageRoles'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"      element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/events"                element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/roles"                 element={<ProtectedRoute><ManageRoles /></ProtectedRoute>} />
        <Route path="/dashboard"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/subcom/tasks/:eventId" element={<ProtectedRoute><ManageTasks /></ProtectedRoute>} />
        <Route path="/exec/create-event"     element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
