import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useUI } from '../../hooks/useUI';
import { usePatents } from '../../hooks/usePatents';
import { useAuth } from '../../hooks/useAuth';
import { RefreshCw } from 'lucide-react';
import { Search, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import ProjectCard from '../../components/dashboard/ProjectCard';
import ProjectModal from '../../components/dashboard/ProjectModal';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import { useUser } from '../../hooks/useUser';

const getStatusShorthand = (status) => {
  status = String(status || '');
  if (status.includes('Expired')) return 'expired';
  if (status.includes('Patented')) return 'patented';
  if (status.includes('Abandoned')) return 'abandoned';
  if (status.includes('-')) return status.split('-')[0].toLowerCase();
  if (status.includes('_')) return status.split('_')[0].toLowerCase();
  return status.toLowerCase();
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

// Maps each StatCard to the patent statuses it should show
const STAT_STATUS_MAP = {
  activeScans:      ['patented'],
  patentsAnalyzed:  'all',
  highRiskMatches:  ['patented'],
  clearedPatents:   ['complete', 'cleared', 'expired', 'abandoned'],
};

export default function DashboardPage() {
  const { patents, ui } = useStore();
  const { setPage, clearError } = useUI();
  const { loadPatents, loadStats, filterPatents } = usePatents();
  const { loadUserProfile } = useUser();
  const { logout } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const newPatent = { title: '', patentNumber: '' };

  // Read filters from Redux
  const searchQuery  = patents.filters.searchQuery;
  const statusFilter = patents.filters.status;

  useEffect(() => {
    clearError();
    handleLoadDashboard();
    loadUserProfile();
  }, []);

  const handleLoadDashboard = async () => {
    console.log('🔐 Session:', JSON.parse(localStorage.getItem('session') || '{}'));
    // FIX 1: Call both loadPatents AND loadStats so patents.stats.highRiskMatches
    // gets populated from the backend (previously only loadPatents was called).
    await Promise.all([loadPatents(), loadStats()]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await handleLoadDashboard();
    setIsRefreshing(false);
  };

  // Toggle stat card filter: clicking the active card resets to 'all'
  const handleStatCardClick = (cardKey) => {
    const next = statusFilter === cardKey ? 'all' : cardKey;
    filterPatents({ status: next });
  };

  const mappedPatents = patents.patents.map(p => ({
    id: p._id,
    title: p.title || p.name || 'Untitled Project',
    patentNumber: p.patentId || String(p._id || '').split('_')[1] || 'N/A',
    status: getStatusShorthand(p.status),
    updatedAt: formatTimeAgo(p.lastUpdated || p.updated_date || p.created_date),
    inventors: p.inventors,
    filedDate: p.filedDate || p.filed_date,
    keywords: p.keywords,
    description: p.description,
    matchesCount: p.matchCount || p.match_count || 0,
    // FIX 2: Extract per-patent high risk count so we can use it as a local
    // fallback when the backend stats endpoint returns nothing.
    highRiskCount: p.highRiskMatches || p.high_risk_matches || 0,
    documentsCount: p.documentsCount,
    progress: p.progress || 0,
    infringementAnalysisStatus: p.infringement_analysis_status || 'unknown',
  }));

  console.log('📊 Raw patent fields:', patents.patents[0]);
  console.log('📋 All statuses:', mappedPatents.map(p => ({ title: p.title, status: p.status })));

  // FIX 3: Compute highRiskMatches locally by summing per-patent counts.
  // This mirrors what home_new.html does:
  //   cases.reduce((sum, c) => sum + (c.highRiskMatches || 0), 0)
  // Used as a fallback when patents.stats.highRiskMatches is not yet available.
  const localHighRiskMatches = mappedPatents.reduce(
    (sum, p) => sum + (p.highRiskCount || 0),
    0
  );

  // Resolved value: backend stat takes priority, local sum is the fallback.
  const highRiskMatchesValue = patents.stats.highRiskMatches || localHighRiskMatches;

  // Step 1 — filter by status card selection
  const statusFilteredPatents = (() => {
    if (!statusFilter || statusFilter === 'all') return mappedPatents;
    const allowed = STAT_STATUS_MAP[statusFilter];
    if (!allowed || allowed === 'all') return mappedPatents;
    return mappedPatents.filter(p => allowed.includes(p.status));
  })();

  // Step 2 — filter by search query on top of status filter
  const filteredPatents = searchQuery.trim()
    ? statusFilteredPatents.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patentNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : statusFilteredPatents;

  const activePatents = patents.patents.filter(p =>
    ['patented', 'active'].includes(getStatusShorthand(p.status))
  );
  const closedPatents = patents.patents.filter(p =>
    ['expired', 'abandoned'].includes(getStatusShorthand(p.status))
  );

  // Dynamic section title
  const sectionTitle = (() => {
    if (searchQuery.trim()) return `Results for "${searchQuery}"`;
    if (statusFilter && statusFilter !== 'all') {
      const labels = {
        activeScans:     'Active Scans',
        patentsAnalyzed: 'All Patents',
        highRiskMatches: 'High Risk Patents',
        clearedPatents:  'Cleared Patents',
      };
      return labels[statusFilter] || 'Active Patents';
    }
    return 'Active Patents';
  })();

  return (
    <div className="dash-shell">
      <DashboardSidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dash-main">

        {/* ── Top Nav ── */}
        <header className="topnav">
          <div className="tn-left">
            <button className="tn-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
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
              <input
                placeholder="Search patents, findings..."
                value={searchQuery}
                onChange={(e) => filterPatents({ searchQuery: e.target.value })}
              />
              {searchQuery && (
                <button
                  className="tn-search-clear"
                  onClick={() => filterPatents({ searchQuery: '' })}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="tn-right">
            <button className="tn-icon" aria-label="Notifications">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="tn-vsep" />
            <Link to="/" className="tn-btn tn-btn--home">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </Link>
            <button className="tn-btn" onClick={() => { logout(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="tn-btn-label">Log out</span>
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="dash-content">

          {/* Alert — FIX 4: Removed hardcoded `|| true` so the alert only shows
              when there are actual high risk matches or a real error. */}
          {!alertDismissed && (highRiskMatchesValue > 0 || ui.error) && (
            <div className="alert">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="alert-body">
                {ui.error
                  ? <><strong>Error:</strong> {ui.error}</>
                  : <><strong>{highRiskMatchesValue} HIGH risk findings</strong> require attorney review — potential infringement detected.</>
                }
              </div>
              <button className="alert-close" onClick={() => setAlertDismissed(true)}>×</button>
            </div>
          )}

          {/* ── Page Header ── */}
          <div className="page-hd">
            <div>
              <div className="page-eyebrow">Overview</div>
              <h1 className="page-title">Patent <em>Monitoring</em></h1>
            </div>
            <div className="hd-actions">
              {statusFilter && statusFilter !== 'all' && (
                <button
                  className="btn-filter-reset"
                  onClick={() => filterPatents({ status: 'all' })}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Clear filter
                </button>
              )}
              <button className="btn-export">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span className="btn-label">Export</span>
              </button>
              <button className="btn-new" onClick={() => setIsModalOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Patent
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <StatCard
              title="Active Scans"
              value={ui.loading ? '—' : (patents.stats.activeScans || activePatents.length)}
              subtitle="This week"
              icon={<Search size={18} />}
              color="blue"
              onClick={() => handleStatCardClick('activeScans')}
              isActive={statusFilter === 'activeScans'}
            />
            <StatCard
              title="Patents Analyzed"
              value={ui.loading ? '—' : (patents.stats.patentsAnalyzed || patents.patents.length)}
              subtitle="Total"
              icon={<FileText size={18} />}
              color="purple"
              onClick={() => handleStatCardClick('patentsAnalyzed')}
              isActive={statusFilter === 'patentsAnalyzed'}
            />
            {/* FIX 3 applied here: uses highRiskMatchesValue (backend || local sum)
                instead of patents.stats.highRiskMatches || 0 */}
            <StatCard
              title="High Risk Matches"
              value={ui.loading ? '—' : highRiskMatchesValue}
              subtitle="Requires attention"
              icon={<AlertTriangle size={18} />}
              color="yellow"
              onClick={() => handleStatCardClick('highRiskMatches')}
              isActive={statusFilter === 'highRiskMatches'}
            />
            <StatCard
              title="Cleared Patents"
              value={ui.loading ? '—' : (patents.stats.clearedPatents || closedPatents.length)}
              subtitle="No infringement"
              icon={<CheckCircle size={18} />}
              color="green"
              onClick={() => handleStatCardClick('clearedPatents')}
              isActive={statusFilter === 'clearedPatents'}
            />
          </div>

          {/* ── Section Header ── */}
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
                <div className="sec-title">{sectionTitle}</div>
              </div>
            </div>
            <div className="sec-hd-right">
              <button className="btn-refresh" onClick={handleRefresh} aria-label="Refresh">
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                className="btn-viewall"
                onClick={() => filterPatents({ status: 'all', searchQuery: '' })}
              >
                <span>View All</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Loading state ── */}
          {ui.loading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid var(--rule2)',
                borderTop: '3px solid var(--accent)', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto 12px',
              }} />
              <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Loading projects...</p>
            </div>
          )}

          {/* ── Empty state ── */}
          {!ui.loading && filteredPatents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink3)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {searchQuery.trim() ? '🔍' : statusFilter && statusFilter !== 'all' ? '🗂️' : '📭'}
              </div>
              {searchQuery.trim() ? (
                <>
                  <p style={{ fontSize: 15 }}>No patents match <strong>"{searchQuery}"</strong>.</p>
                  <button className="btn-export" style={{ marginTop: 20 }} onClick={() => filterPatents({ searchQuery: '' })}>
                    Clear search
                  </button>
                </>
              ) : statusFilter && statusFilter !== 'all' ? (
                <>
                  <p style={{ fontSize: 15 }}>No patents in this category.</p>
                  <button className="btn-export" style={{ marginTop: 20 }} onClick={() => filterPatents({ status: 'all' })}>
                    Show all patents
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15 }}>No patents found. Add a patent to get started.</p>
                  <button className="btn-new" style={{ marginTop: 20 }} onClick={() => setIsModalOpen(true)}>
                    + Add Patent
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Patent Cards Grid ── */}
          {!ui.loading && filteredPatents.length > 0 && (
            <div className="patents-grid">
              {filteredPatents.map((patent, index) => (
                <div
                  key={patent.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${0.5 + index * 0.1}s`, opacity: 0 }}
                >
                  <ProjectCard {...patent} />
                </div>
              ))}
            </div>
          )}

          {/* ── Weekly Search Section ── */}
          {!searchQuery.trim() && (!statusFilter || statusFilter === 'all') && (
            <>
              <div className="sec-hd" style={{ marginTop: 40 }}>
                <div className="sec-hd-left">
                  <div className="sec-ico">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <div>
                    <div className="sec-eye">
                      <div className="live-dot" />
                      Automated Monitoring
                    </div>
                    <div className="sec-title">Weekly Search Results</div>
                  </div>
                </div>
              </div>

              <div className="pcard patented weekly-card">
                <div className="pcard-top">
                  <span className="pcard-badge patented">
                    <span className="pcard-dot" />
                    Active
                  </span>
                </div>
                <div className="pcard-title" style={{ fontSize: 15 }}>Automated VGR Monitoring</div>
                <div className="pcard-num">
                  {patents.stats.lastScanDate
                    ? `Last scan: ${formatDate(patents.stats.lastScanDate)}`
                    : 'Last scan: Loading...'}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink2)', margin: '10px 0', lineHeight: 1.6, fontWeight: 300 }}>
                  Weekly automated scans monitor competitor filings and industry changes relevant to your portfolio.
                </p>
                <div className="pcard-foot">
                  <div className="pcard-live">
                    <div className="live-bars"><span /><span /><span /><span /></div>
                    {patents.stats.newResults || 0} new results
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }

        .tn-search { position: relative; display: flex; align-items: center; }
        .tn-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: var(--ink3);
          padding: 0 2px;
          display: flex;
          align-items: center;
        }
        .tn-search-clear:hover { color: var(--ink1); }

        .btn-filter-reset {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 20px;
          border: 1px solid var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          color: var(--accent);
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.15s;
        }
        .btn-filter-reset:hover {
          background: color-mix(in srgb, var(--accent) 20%, transparent);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .patents-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .weekly-card { max-width: 100%; width: 100%; }

        .tn-center    { display: flex; }
        .tn-sep       { display: block; }
        .tn-sub       { display: block; }
        .tn-btn-label { display: inline; }
        .btn-label    { display: inline; }
        .tn-btn--home span { display: inline; }

        @media (max-width: 1279px) {
          .stats-grid { gap: 16px; }
          .patents-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 1023px) {
          .dash-content { padding: 20px 20px 40px !important; }
          .tn-sep { display: none; }
          .tn-sub { display: none; }
          .tn-search input { width: 140px !important; }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin-bottom: 24px;
          }
          .patents-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .page-hd {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .page-title { font-size: clamp(20px, 4vw, 28px) !important; }
          .sec-hd { flex-wrap: wrap; gap: 10px; }
        }

        @media (max-width: 767px) {
          .topnav { padding: 0 14px !important; height: 52px !important; }
          .tn-center { display: none; }
          .tn-btn--home span { display: none; }
          .tn-title { font-size: 13px !important; }
          .dash-content { padding: 16px 16px 40px !important; }
          .alert { padding: 10px 12px !important; font-size: 13px !important; }
          .page-hd {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          .page-title { font-size: 22px !important; }
          .hd-actions { width: 100%; justify-content: flex-end; flex-wrap: wrap; }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .patents-grid { grid-template-columns: 1fr; gap: 12px; }
          .sec-hd { flex-wrap: wrap; gap: 10px; }
          .sec-title { font-size: 14px !important; }
        }

        @media (max-width: 599px) {
          .topnav { padding: 0 12px !important; height: 50px !important; }
          .tn-center    { display: none; }
          .tn-vsep      { display: none !important; }
          .tn-btn--home { display: none !important; }
          .tn-btn-label { display: none; }
          .tn-title { font-size: 12px !important; }
          .tn-btn svg { width: 15px; height: 15px; }
          .dash-content { padding: 14px 12px 40px !important; }
          .alert {
            flex-wrap: wrap;
            padding: 10px 10px !important;
            gap: 8px !important;
          }
          .alert-body { font-size: 12px !important; flex: 1 1 0; min-width: 0; }
          .page-hd {
            flex-direction: column !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }
          .page-eyebrow { font-size: 10px !important; }
          .page-title   { font-size: 20px !important; }
          .hd-actions { width: 100%; display: flex; gap: 8px; flex-wrap: wrap; }
          .btn-label { display: none; }
          .btn-export { padding: 7px 10px !important; min-width: unset !important; }
          .btn-new { flex: 1; justify-content: center !important; }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 18px;
          }
          .patents-grid { grid-template-columns: 1fr; gap: 10px; }
          .sec-hd {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 10px;
            padding: 12px 0 !important;
          }
          .sec-hd-right { align-self: flex-end; }
          .sec-title  { font-size: 13px !important; }
          .sec-eye    { font-size: 9px !important; }
          .pcard-title { font-size: 14px !important; }
        }

        @media (max-width: 379px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
          .page-title { font-size: 18px !important; }
          .dash-content { padding: 12px 10px 32px !important; }
          .topnav { padding: 0 10px !important; }
        }
      `}</style>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={newPatent}
      />
    </div>
  );
}
