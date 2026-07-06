import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import AccessDenied from './pages/AccessDenied'
import FeedbackForm from './pages/FeedbackForm'
import SuccessPage from './pages/SuccessPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
