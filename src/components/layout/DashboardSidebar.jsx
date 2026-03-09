import { Link, useNavigate } from 'react-router-dom'

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
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
          </svg>
        ),
        label: 'Patents', id: 'patents', badge: { text: '', type: 'green' },
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        ),
        label: 'Monitoring', id: 'monitoring', badge: null,
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ),
       // label: 'Findings', id: 'findings', badge: { text: '7', type: 'red' },
        label: 'Findings', id: 'findings', badge: null,
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
        label: 'Reports', id: 'reports', badge: null,
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        ),
        label: 'History', id: 'history', badge: null,
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
        label: 'Profile', id: 'team', badge: null, href: '/profile',
      },
      {
        icon: (
          <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        ),
        label: 'Settings', id: 'settings', badge: null,
      },
    ],
  },
]

export default function DashboardSidebar({ activeItem, onItemClick, isOpen, onClose }) {
  const navigate = useNavigate()

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
                  onClick={() => handleClick(item)}
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

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">JD</div>
            <div>
              <div className="sb-uname">Jane Doe</div>
              <div className="sb-urole">IP Attorney</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
