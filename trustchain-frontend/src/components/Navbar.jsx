import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, CreditCard, Users, LogOut, Moon, Sun, History, Bell } from 'lucide-react'
import useAuthStore from '../hooks/useAuthStore'
import useThemeStore from '../hooks/useThemeStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/history',   icon: History,         label: 'History'  },
    { path: '/pay',       icon: CreditCard,       label: 'Pay'      },
    { path: '/helpers',   icon: Users,            label: 'Helpers'  },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 28px',
      height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px var(--brand-glow)',
        }}>
          <Shield size={19} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
          Trust<span style={{ color: 'var(--brand)' }}>Chain</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {navLinks.map(({ path, icon: Icon, label }) => (
          <Link key={path} to={path} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: 8,
            fontSize: 14, fontWeight: 500,
            color: isActive(path) ? 'var(--brand)' : 'var(--text-muted)',
            background: isActive(path) ? 'var(--brand-dim)' : 'transparent',
            transition: 'all 0.2s',
          }}>
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggle}
          className="btn btn-ghost btn-icon"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{ padding: '9px', color: 'var(--text-muted)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Bell */}
        <button className="btn btn-ghost btn-icon" style={{ padding: '9px', color: 'var(--text-muted)', position: 'relative' }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--brand)',
          }} />
        </button>

        {/* Avatar + name */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--brand-dim)',
              border: '1.5px solid var(--border-bright)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'var(--brand)',
            }}>
              {user.full_name?.[0]?.toUpperCase()}
            </div>
            <div style={{ textAlign: 'right', display: 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.full_name}</div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="btn btn-ghost btn-icon" style={{ padding: '9px', color: 'var(--text-muted)' }}>
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  )
}
