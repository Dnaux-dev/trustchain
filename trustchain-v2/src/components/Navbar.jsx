import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Users, LogOut, Radio, Bell, Home, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainLogo from './TrustChainLogo'
import toast from 'react-hot-toast'

export function BottomNav() {
  const loc = useLocation()
  const active = p => loc.pathname === p
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
      background: 'rgba(7,5,10,0.97)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
    }}>
      {[
        { path: '/dashboard',   icon: Home,          label: 'Home' },
        { path: '/pay',         icon: CreditCard,    label: 'Pay' },
        { path: '/fraud-feed',  icon: Activity,      label: 'Feed' },
        { path: '/alerts',      icon: Bell,          label: 'Alerts' },
        { path: '/helpers',     icon: Users,         label: 'Helpers' },
      ].map(({ path, icon: Icon, label }) => (
        <Link key={path} to={path} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '4px 12px',
          color: active(path) ? 'var(--squad-orange)' : 'rgba(255,255,255,0.28)',
          transition: 'color 0.15s',
        }}>
          <Icon size={20} strokeWidth={active(path) ? 2.5 : 1.5} />
          <span style={{ fontSize: 9, fontWeight: active(path) ? 700 : 400, letterSpacing: '0.2px' }}>{label}</span>
        </Link>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const loc = useLocation()
  const active = p => loc.pathname === p
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const handleLogout = () => { logout(); toast.success('Signed out'); navigate('/login') }

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 60,
        background: 'rgba(7,5,10,0.94)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 16px' : '0 24px',
      }}>

        {/* Real TrustChain logo */}
        <Link to="/dashboard" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrustChainLogo height={22} />
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--mono)', letterSpacing: '1.5px', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 8 }}>
            by Squad
          </div>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: 16 }}>
            {[
              { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
              { path: '/pay',        icon: CreditCard,      label: 'Pay' },
              { path: '/fraud-feed', icon: Activity,        label: 'Live Feed', live: true },
              { path: '/alerts',     icon: Bell,            label: 'Alerts' },
              { path: '/helpers',    icon: Users,           label: 'Helpers' },
            ].map(({ path, icon: Icon, label, live }) => (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7,
                fontSize: 13, fontWeight: 500,
                color: active(path) ? 'var(--squad-orange)' : 'rgba(255,255,255,0.4)',
                background: active(path) ? 'rgba(244,82,30,0.08)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Icon size={13} />
                {label}
                {live && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-glow 1.5s infinite', flexShrink: 0 }} />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {user && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: isMobile ? '5px 9px' : '6px 11px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--squad-orange) 0%, var(--squad-magenta) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>
                {user.full_name?.[0] || 'U'}
              </div>
              {!isMobile && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1 }}>{user.full_name?.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, lineHeight: 1, marginTop: 2, fontFamily: 'var(--mono)', color: user.is_enrolled ? 'var(--green)' : 'var(--gold)' }}>
                    {user.is_enrolled ? '● Protected' : '○ Enrolling'}
                  </div>
                </div>
              )}
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '5px 9px' }}>
            <LogOut size={13} />
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}
    </>
  )
}
