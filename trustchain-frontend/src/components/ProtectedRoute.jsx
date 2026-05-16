import { Navigate } from 'react-router-dom'
import useAuthStore from '../hooks/useAuthStore'

export default function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}
