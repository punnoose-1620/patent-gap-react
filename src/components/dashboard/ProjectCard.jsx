import { useNavigate } from 'react-router-dom';

const AnalysisStatusIcon = ({ status }) => {
  const s = String(status || '').toLowerCase();

 /* if (s === 'completed') {
    return (
      <span title="Analysis complete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(46,125,50,0.12)', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
    );
  }

  if (s === 'pending' || s === 'processing' || s === 'running' || s === 'queued' || s === 'in_progress') {
    return (
      <span title={`Analysis ${s}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(180,83,9,0.12)', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1.2s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </span>
    );
  }

  if (s === 'failed' || s === 'error') {
    return (
      <span title="Analysis failed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(185,28,28,0.10)', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    );
  }*/

  // unknown / none / not started
 /* return (
    <span title="Analysis not started" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(140,140,132,0.10)', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8C8C84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </span>
  );*/
  if (s === 'started') {
    return (
      <span title="Infringement analysis incomplete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(185,28,28,0.10)', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>
    );
  }

  return null;
};

const ProjectCard = ({
  id,
  title,
  patentNumber,
  status,
  updatedAt,
  inventors,
  filedDate,
  keywords,
  description,
  matchesCount,
  documentsCount,
  progress = 0,
  infringementAnalysisStatus = 'unknown',
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/patent-detail', {
      state: {
        id, title, patentNumber, status, updatedAt,
        inventors, filedDate, keywords, description,
        matchesCount, documentsCount, progress
      }
    });
  };

  const s = String(status || '').toLowerCase();
  const isExpired   = s === 'expired';
  const isAbandoned = s === 'abandoned';

  const badgeClass = isExpired ? 'expired' : isAbandoned ? 'abandoned' : 'patented';
  const fillClass  = isExpired ? 'red' : isAbandoned ? 'grey' : 'green';
  const dotColor   = isExpired ? 'var(--red, #B91C1C)' : isAbandoned ? 'var(--ink3, #8C8C84)' : 'var(--accent, #2E7D32)';
  const badgeLabel = isExpired ? 'Expired' : isAbandoned ? 'Abandoned' : 'Patented';

  const pct        = Math.min(100, Math.max(0, progress || 0));
  const filledDots = Math.round((pct / 100) * 5);

  return (
    <div onClick={handleCardClick} className="pcard" style={{ cursor: 'pointer' }}>
      {/* ── Top row: badge + analysis status icon + ext button ── */}
      <div className="pcard-top">
        <span className={`pcard-badge ${badgeClass}`}>
          <span className="pcard-dot" />
          {badgeLabel}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AnalysisStatusIcon status={infringementAnalysisStatus} />
          <button
            className="card-ext"
            aria-label="Open"
            onClick={e => { e.stopPropagation(); handleCardClick(); }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="pcard-title">{title}</div>

      <div className="pcard-num">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {patentNumber}
      </div>

      <div className="pcard-progress">
        <div className="prog-track">
          <div className={`prog-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="prog-dots" style={{ color: dotColor }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="pdot" style={{ opacity: i < filledDots ? 0.35 : 0.1 }} />
          ))}
        </div>
      </div>

      <div className="pcard-foot">
        <div className="pcard-time">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {updatedAt}
        </div>

        {matchesCount > 0 && (
          <div style={{ fontSize: 11, color: 'var(--amber, #B45309)', fontWeight: 600 }}>
            {matchesCount} match{matchesCount !== 1 ? 'es' : ''}
          </div>
        )}

        {/*<div className="pcard-live">
          <div className="live-bars">
            <span /><span /><span /><span />
          </div>
          Live
        </div>*/}
      </div>
    </div>
  );
};

export default ProjectCard;