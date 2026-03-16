import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/layout/DashboardSidebar'
import { useAuth } from '../../hooks/useAuth'

const PATENTS = [
  { status: 'patented', title: 'System and Method for Distributed Neural Inference Across Edge Devices', num: '16330877', progress: 82, dots: [true, true, true, true, false], time: '8 weeks ago' },
  { status: 'patented', title: 'Illuminating System for Determining the Topography of the Cornea of an Eye', num: '16330879', progress: 68, dots: [true, true, true, false, false], time: '8 weeks ago' },
  { status: 'abandoned', title: 'Apparatus for Manufacturing Membrane Electrode Assembly', num: '14104983', progress: 75, dots: [true, true, true, true, false], time: '7 weeks ago', grey: true },
  { status: 'abandoned', title: 'Coil Winding Structure of Stator Bobbin for Drive Motor', num: '14104973', progress: 55, dots: [true, true, true, false, false], time: '7 weeks ago', grey: true },
  { status: 'expired', title: 'Partial Encapsulation of Stents', num: '14104893', progress: 88, dots: [true, true, true, true, true], time: '7 weeks ago', red: true },
  { status: 'patented', title: 'Extended Patellofemoral', num: '14104693', progress: 91, dots: [true, true, true, true, true], time: '7 weeks ago' },
]

const STATS = [
  {
    label: 'Active Patents', num: '24', bar: 'green', note: '3 added this month',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
      </svg>
    ),
  },
  {
    label: 'Active Findings', num: '7', bar: 'amber', note: '2 HIGH risk', amber: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Reports Generated', num: '12', bar: 'green', note: 'Last 30 days',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: 'Claims Monitored', num: '341', bar: 'green', note: 'Across all patents',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
]

export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()
  const doLogout = () => { logout(); navigate('/login') }

  return (
    <div className="dash-shell">
      <DashboardSidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dash-main">
        {/* Top Nav */}
        <header className="topnav">
          <div className="tn-left">
            <button className="tn-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="tn-title">Patent Gap AI</span>
            <div className="tn-sep" />
            <span className="tn-sub">Dashboard</span>
          </div>

          <div className="tn-center">
            <div className="tn-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search patents, findings..." />
            </div>
          </div>

          <div className="tn-right">
            <button className="tn-icon" aria-label="Notifications">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="tn-vsep" />
            <Link to="/" className="tn-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </Link>
            <button className="tn-btn" onClick={doLogout}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">

          {/* Alert */}
          {!alertDismissed && (
            <div className="alert">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="alert-body">
                <strong>2 HIGH risk findings</strong> require attorney review — potential § 112(a) written description failure and IPR exposure detected on patent #16330877.
              </div>
              <button className="alert-close" onClick={() => setAlertDismissed(true)}>×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="page-hd">
            <div>
              <div className="page-eyebrow">Overview</div>
              <h1 className="page-title">Patent <em>Monitoring</em></h1>
            </div>
            <div className="hd-actions">
              <button className="btn-export">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
              </button>
              <button className="btn-new">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Patent
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stat-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-card">
                <div>
                  <div className="stat-lbl">{s.label}</div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-foot">
                    <div className={`stat-bar${s.amber ? ' amber' : ''}`} />
                    <span className="stat-note">{s.note}</span>
                  </div>
                </div>
                <div className={`stat-ico${s.amber ? ' amber' : ''}`}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Section Header */}
          <div className="sec-hd">
            <div className="sec-hd-left">
              <div className="sec-ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                </svg>
              </div>
              <div>
                <div className="sec-eye">
                  <div className="live-dot" />
                  Live Monitoring
                </div>
                <div className="sec-title">Active Patents</div>
              </div>
            </div>
            <div className="sec-hd-right">
              <button className="btn-refresh" aria-label="Refresh">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
              <button className="btn-viewall">
                <span>View All</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Patent Cards Grid */}
          <div className="cards-grid">
            {PATENTS.map((p, i) => (
              <div key={i} className={`pcard ${p.status}`}>
                <div className="pcard-top">
                  <span className={`pcard-badge ${p.status}`}>
                    <span className="pcard-dot" />
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  <button className="card-ext" aria-label="Open">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </button>
                </div>
                <div className="pcard-title">{p.title}</div>
                <div className="pcard-num">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  {p.num}
                </div>
                <div className="pcard-progress">
                  <div className="prog-track">
                    <div
                      className={`prog-fill ${p.red ? 'red' : p.grey ? 'grey' : 'green'}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="prog-dots" style={{ color: p.red ? 'var(--red)' : p.grey ? 'var(--ink3)' : 'var(--accent)' }}>
                    {p.dots.map((filled, di) => (
                      <div key={di} className="pdot" style={{ opacity: filled ? 0.35 : 0.1 }} />
                    ))}
                  </div>
                </div>
                <div className="pcard-foot">
                  <div className="pcard-time">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {p.time}
                  </div>
                  <div className="pcard-live">
                    <div className="live-bars">
                      <span /><span /><span /><span />
                    </div>
                    Live
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
