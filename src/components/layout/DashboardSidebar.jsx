import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState } from 'react'



const NAV_ITEMS = [
  {
    label: 'MAIN',
    links: [
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
        label: 'Dashboard', id: 'dashboard', badge: null, href: '/dashboard',
      },
      /*{
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
          </svg>
        ),
        label: 'Patents', id: 'patents', badge: { text: '', type: 'green' },
      },*/
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        ),
        label: 'Monitoring', id: 'monitoring', badge: null, wip: true,
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ),
        label: 'Findings', id: 'findings', badge: null, wip: true,
      },
    ],
  },
  {
    label: 'ANALYSIS',
    links: [
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
        label: 'Reports', id: 'reports', badge: null, wip: true,
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        ),
        label: 'History', id: 'history', badge: null, wip: true,
      },
    ],
  },
  {
    label: 'ACCOUNT',
    links: [
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        ),
        label: 'Profile', id: 'profile', badge: null, href: '/profile',
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
        label: 'Settings', id: 'settings', badge: null,
      },
    ],
  },
]

export default function DashboardSidebar({ activeItem, onItemClick, isOpen, onClose }) {
  const navigate = useNavigate()
  //const user = useSelector((state) => state.auth.user)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 })
  // In DashboardSidebar.jsx — replace the existing useSelector line
  const reduxUser  = useSelector((state) => state.auth.user)    // basic auth user
  const userProfile = useSelector((state) => state.user.profile) // full profile from API

  // Merge — prefer full profile data, fall back to auth user
  const user = userProfile || reduxUser

  const getInitials = (u) => {
    if (!u) return '?'
    if (u.name || u.full_name) {
      const name  = u.name || u.full_name
      const parts = name.trim().split(' ').filter(Boolean)
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase()
    }
    if (u.email) return u.email.slice(0, 2).toUpperCase()
    return '?'
  }

  const displayName = user?.name || user?.full_name || user?.email || 'Unknown User'
  const displayRole = user?.role || user?.job_title || user?.title || 'User'
  const initials    = getInitials(user)

  const handleClick = (item) => {
    onItemClick(item.id)
    onClose()
    if (item.href) navigate(item.href)
  }

  return (
    <>
      <div className={`overlay${isOpen ? ' show' : ''}`} onClick={onClose} />
      <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar">
        <Link to="/" className="sb-brand">
          <div className="sb-glyph">
            <div style={{
              width: 36, height: 36,
              background: 'var(--deep)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img
                src="/logo.png"
                alt="Patent Gap AI"
                style={{ width: 22, height: 22, objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
          <div className="sb-wordmark">
            Patent Gap AI
            <small>Dashboard</small>
          </div>
        </Link>

        <nav className="sb-nav">
          {NAV_ITEMS.map((section, si) => (
            <div key={si}>
              <span className="sb-label">{section.label}</span>
              {section.links.map((item) => (
                <button
                  key={item.id}
                  className={`sb-link${activeItem === item.id ? ' active' : ''}`}
                  onClick={() => !item.wip && handleClick(item)}
                  style={item.wip ? { cursor: 'not-allowed', opacity: 0.6, position: 'relative' } : { position: 'relative' }}
                  onMouseEnter={item.wip ? (e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ visible: true, x: rect.right + 8, y: rect.top + rect.height / 2 })
                  } : undefined}
                  onMouseLeave={item.wip ? () => setTooltip({ visible: false, x: 0, y: 0 }) : undefined}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span className={`sb-badge ${item.badge.type}`}>{item.badge.text}</span>
                  )}
                </button>
              ))}
              {si < NAV_ITEMS.length - 1 && <div className="sb-hr" />}
            </div>
          ))}
        </nav>

        {/* ✅ Bottom user section — clicking navigates to /profile */}
        <div className="sb-footer">
          <button
            className="sb-user"
            onClick={() => { onItemClick('profile'); onClose(); navigate('/profile'); }}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid transparent',   // ✅ always has border space, just invisible
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              textAlign: 'left',
              transition: 'border-color 0.15s',  // ✅ only animate the border
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rule)'}   // ✅ just outline
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}   // ✅ hide outline
          >
            <div className="sb-avatar" title={displayName}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="sb-uname" style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {displayName}
              </div>
              <div className="sb-urole">{displayRole}</div>
            </div>
            {/* ✅ small arrow hint */}
            <svg style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.4 }}
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Global tooltip — outside sidebar, no clipping */}
      {tooltip.visible && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateY(-50%)',
          background: '#2c2c2a',
          color: '#d3d1c7',
          fontSize: 11,
          padding: '4px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          Under development
        </div>
      )}
    </>
  )
  
}

