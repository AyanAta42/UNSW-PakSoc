import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/public/Home'
import Dashboard from '@/pages/member/Dashboard'
import ManageTasks from '@/pages/subcom/ManageTasks'
import CreateEvent from '@/pages/exec/CreateEvent'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Member */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Sub-committee */}
        <Route path="/subcom/tasks/:eventId" element={<ManageTasks />} />

        {/* Exec */}
        <Route path="/exec/create-event" element={<CreateEvent />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
