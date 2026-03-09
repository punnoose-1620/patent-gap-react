import { useNavigate } from 'react-router-dom';

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

  // Map status → badge class + progress fill color
  const s = String(status || '').toLowerCase();
  const isExpired   = s === 'expired';
  const isAbandoned = s === 'abandoned';
  const isPatented  = s === 'patented' || s === 'active';

  const badgeClass  = isExpired ? 'expired' : isAbandoned ? 'abandoned' : 'patented';
  const fillClass   = isExpired ? 'red' : isAbandoned ? 'grey' : 'green';
  const dotColor    = isExpired
    ? 'var(--red, #B91C1C)'
    : isAbandoned
    ? 'var(--ink3, #8C8C84)'
    : 'var(--accent, #2E7D32)';

  // Progress bar width — clamp between 0-100
  const pct = Math.min(100, Math.max(0, progress || 0));
  // 5 dots: filled based on progress quintiles
  const filledDots = Math.round((pct / 100) * 5);

  // Badge label
  const badgeLabel = isExpired ? 'Expired' : isAbandoned ? 'Abandoned' : 'Patented';

  return (
    <div onClick={handleCardClick} className="pcard" style={{ cursor: 'pointer' }}>
      {/* ── Top row: badge + ext button ── */}
      <div className="pcard-top">
        <span className={`pcard-badge ${badgeClass}`}>
          <span className="pcard-dot" />
          {badgeLabel}
        </span>
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

      {/* ── Title ── */}
      <div className="pcard-title">{title}</div>

      {/* ── Patent number ── */}
      <div className="pcard-num">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {patentNumber}
      </div>

      {/* ── Progress ── */}
      <div className="pcard-progress">
        <div className="prog-track">
          <div className={`prog-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="prog-dots" style={{ color: dotColor }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="pdot"
              style={{ opacity: i < filledDots ? 0.35 : 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
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

        <div className="pcard-live">
          <div className="live-bars">
            <span /><span /><span /><span />
          </div>
          Live
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
