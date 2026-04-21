// ===========================
// FILE: MatchCard.jsx
// Standalone component extracted from PatentDetailPage.jsx
// ===========================

import { patentApi } from '../../api/patentApi';

const MatchCard = ({ match, updatedAt, caseId, onSelect, onExclude }) => {
console.log('🃏 MatchCard — full match object:', JSON.stringify(match, null, 2));  // ← ADD THIS


  const isHigh         = match.riskLevel === 'high';
  const isMedium       = match.riskLevel === 'medium';
  const matchCardClass = isHigh ? 'expired' : isMedium ? 'abandoned' : 'patented';
  const isProduct      = match.type === 'product';

  const handleExclude = async (e) => {
    e.stopPropagation();
    const confirmed = window.confirm('Do you really want to exclude this infringement?');
    if (!confirmed) return;

    try {
      console.log(`🚫 Excluding match [${match.type}]:`, match);
      await patentApi.updateCase(caseId, {
        excluded_case_ids: [match.id],
      });
      onExclude?.(match.id);
    } catch (err) {
      console.error('Failed to exclude infringement:', err.message);
      alert('Failed to exclude this infringement. Please try again.');
    }
  };

  return (
    <div
      className={`pcard ${matchCardClass}`}
      onClick={() => {
        console.log(`🔍 Selected match [${match.type}]:`, match);
        onSelect(match);
      }}
    >
      {/* ── Top row: risk badge + type pill + open button ── */}
      <div className="pcard-top">
        <span className={`pcard-badge ${matchCardClass}`}>
          <span className="pcard-dot" />
          {typeof match.badge === 'string'
            ? match.badge.charAt(0).toUpperCase() + match.badge.slice(1)
            : match.badge}{' '}
          Risk
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pd-type-pill" data-type={isProduct ? 'product' : 'patent'}>
            {isProduct ? '🛒 Product' : '📄 Patent'}
          </span>

          <button
            className="card-ext"
            aria-label="Open"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`🔍 Selected match [${match.type}]:`, match);
              onSelect(match);
            }}
          >
            <svg
              width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Title ── */}
      <div className="pcard-title">{match.title}</div>

      {/* ── ID chip ── */}
      <div className="pcard-num">
        <svg
          width="9" height="9" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
        {isProduct ? `Product: ${match.id}` : `Patent: ${match.id}`}
      </div>

      {/* ── Company (patents only) ── */}
      {match.company && (
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
          Company: {match.company}
        </div>
      )}

      {/* ── Claim snippet (products only) ── */}
      {isProduct && match.claims?.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8, fontStyle: 'italic' }}>
          "{match.claims[0].slice(0, 80)}…"
        </div>
      )}

      {/* ── Overlap score bar ── */}
      <div className="pcard-progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: 9, textTransform: 'uppercase',
            letterSpacing: '0.10em', color: 'var(--ink3)',
          }}>
            Overlap Score
          </span>
          <span style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 14, fontWeight: 700,
            color: isHigh ? 'var(--red)' : isMedium ? 'var(--amber)' : 'var(--accent)',
          }}>
            {match.score}%
          </span>
        </div>

        <div className="prog-track">
          <div
            className={`prog-fill ${isHigh ? 'red' : isMedium ? 'grey' : 'green'}`}
            style={{ width: `${match.score}%` }}
          />
        </div>

        {match.matchedClaims && (
          <div style={{
            fontSize: 10, color: 'var(--ink3)',
            marginTop: 5, fontFamily: "'Inconsolata', monospace",
          }}>
            Claims: {match.matchedClaims.join(', ')}
          </div>
        )}
      </div>

      {/* ── Footer: timestamp + live indicator + exclude button ── */}
      <div className="pcard-foot">
        <div className="pcard-time">
          <svg
            width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {updatedAt}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/*<div className="pcard-live">
            <div className="live-bars">
              <span /><span /><span /><span />
            </div>
            Live
          </div>*/}

          {/* ── Exclude / delete button ── */}
          <button
            className="card-exclude-btn"
            aria-label="Exclude infringement"
            title="Exclude this infringement"
            onClick={handleExclude}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              border: '1px solid var(--red, #e53e3e)',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--red, #e53e3e)',
              fontSize: 10,
              fontFamily: "'Inconsolata', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--red, #e53e3e)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--red, #e53e3e)';
            }}
          >
            <svg
              width="9" height="9" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Exclude
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;