import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, CreditCard, Users, LogOut } from 'lucide-react'
import useAuthStore from '../hooks/useAuthStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,5,8,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--purple) 0%, #3B2070 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px var(--purple-glow)',
        }}>
          <Shield size={18} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
          Trust<span style={{ color: 'var(--purple-bright)' }}>Chain</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/pay', icon: CreditCard, label: 'Pay' },
          { path: '/helpers', icon: Users, label: 'Helpers' },
        ].map(({ path, icon: Icon, label }) => (
          <Link key={path} to={path} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: 8,
            fontSize: 14, fontWeight: 500,
            color: isActive(path) ? 'var(--purple-bright)' : 'var(--text-muted)',
            background: isActive(path) ? 'var(--purple-dim)' : 'transparent',
            transition: 'all 0.2s',
          }}>
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {user.is_enrolled ? '● Enrolled' : '○ Enrolling...'}
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 12px' }}>
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  )
}
