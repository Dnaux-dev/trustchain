import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Pay from './pages/Pay'
import Helpers from './pages/Helpers'
import Onboarding from './pages/Onboarding'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './hooks/useAuthStore'
import useThemeStore from './hooks/useThemeStore'

// Initialize theme on app load
useThemeStore.getState()

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

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
        {/* Landing */}
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Landing />} />

        {/* Auth */}
        <Route path="/login"    element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to={user?.is_enrolled ? '/dashboard' : '/onboarding'} /> : <Register />} />

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
        <Route path="/history" element={
          <ProtectedRoute>
            <AppLayout><History /></AppLayout>
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
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} />} />
      </Routes>
    </>
  )
}

export default function App() {
  const { theme } = useThemeStore()

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border-bright)',
            borderRadius: '12px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00E5A0', secondary: '#0C0C14' } },
          error:   { iconTheme: { primary: '#FF4757', secondary: '#0C0C14' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  )
}