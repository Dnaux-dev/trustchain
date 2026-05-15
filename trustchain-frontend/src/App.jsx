import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pay from './pages/Pay'
import Helpers from './pages/Helpers'
import Onboarding from './pages/Onboarding'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './hooks/useAuthStore'

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

// Must live inside BrowserRouter to use useNavigate
function AuthLogoutListener() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  useEffect(() => {
    const handler = () => {
      logout()
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [navigate, logout])
  return null
}

function AppRoutes() {
  const { token, user } = useAuthStore()

  return (
    <>
      <AuthLogoutListener />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={token ? <Navigate to="/dashboard" /> : <Login />} />
        {/* After register: new users (not enrolled) go to onboarding, existing users go to dashboard */}
        <Route path="/register" element={token ? <Navigate to={user?.is_enrolled ? "/dashboard" : "/onboarding"} /> : <Register />} />

        {/* Onboarding — no Navbar */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* Protected — with Navbar */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/pay" element={
          <ProtectedRoute>
            <AppLayout><Pay /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/helpers" element={
          <ProtectedRoute>
            <AppLayout><Helpers /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0C0C14',
            color: '#F0F0FF',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00E5A0', secondary: '#0C0C14' } },
          error: { iconTheme: { primary: '#FF4757', secondary: '#0C0C14' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  )
}