import { useNavigate } from 'react-router-dom';

const AnalysisStatusIcon = ({ status }) => {
  const s = String(status || '').toLowerCase();

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
  riskLevel = 'low',
  hasUpdates,
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

            <div className="pcard-top" style={{ flexWrap: 'wrap', gap: 4 }}>
        {/* ── Left: status + risk badges ── */}
        <span className={`pcard-badge ${badgeClass}`}>
          <span className="pcard-dot" />
          {badgeLabel}
        </span>

        {riskLevel === 'high' && (
          <span className="pcard-badge expired">
            <span className="pcard-dot" />
            High Risk
          </span>
        )}
        {riskLevel === 'medium' && (
          <span className="pcard-badge abandoned">
            <span className="pcard-dot" />
            Med Risk
          </span>
        )}

        {/* ── Right: NEW + analysis icon + ext button — always pinned to the right ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <AnalysisStatusIcon status={infringementAnalysisStatus} />

          {hasUpdates && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#fff',
                fontSize: 8,
                fontFamily: "'Inconsolata', monospace",
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                padding: '3px 7px 3px 5px',
                borderRadius: 4,
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(22,163,74,0.35)',
              }}
            >
              <span style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#fff',
                opacity: 0.9,
                animation: 'ia-pulse 1.2s ease-in-out infinite',
                flexShrink: 0,
              }} />
              Updates
            </span>
          )}

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
        {pct > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
            }}>
              Overlap Score
            </span>
            <span style={{
              fontFamily: "'Libre Baskerville', serif", fontSize: 13, fontWeight: 700,
              color: isExpired ? 'var(--red)' : isAbandoned ? 'var(--ink3)' : 'var(--accent)',
            }}>
              {pct}%
            </span>
          </div>
        )}
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
      </div>

    </div>
  );
};

export default ProjectCard;
