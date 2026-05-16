import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pay from './pages/Pay'
import Helpers from './pages/Helpers'
import Onboarding from './pages/Onboarding'
import FraudFeed from './pages/FraudFeed'
import Alerts from './pages/Alerts'
import Navbar from './components/Navbar'
import { ProtectedRoute } from './components/UI'
import useAuthStore from './hooks/useAuthStore'

function Layout({ children }) {
  return <><Navbar />{children}</>
}

function AuthLogoutListener() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  useEffect(() => {
    const h = () => { logout(); navigate('/login', { replace: true }) }
    window.addEventListener('auth:logout', h)
    return () => window.removeEventListener('auth:logout', h)
  }, [])
  return null
}

function AppRoutes() {
  const { token } = useAuthStore()
  return (
    <>
      <AuthLogoutListener />
      <div className="mesh-bg" />
      <div className="grid-overlay" />
      <Routes>
        <Route path="/"           element={token ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login"      element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register"   element={token ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard"  element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/pay"        element={<ProtectedRoute><Layout><Pay /></Layout></ProtectedRoute>} />
        <Route path="/helpers"    element={<ProtectedRoute><Layout><Helpers /></Layout></ProtectedRoute>} />
        <Route path="/fraud-feed" element={<ProtectedRoute><Layout><FraudFeed /></Layout></ProtectedRoute>} />
        <Route path="/alerts"     element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#130D10', color:'#fff', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontFamily:'Geist, sans-serif', fontSize:'14px' },
        success: { iconTheme: { primary:'#22C55E', secondary:'#130D10' } },
        error:   { iconTheme: { primary:'#EF4444', secondary:'#130D10' } },
      }} />
      <AppRoutes />
    </BrowserRouter>
  )
}
