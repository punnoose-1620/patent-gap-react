import { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const trunc = (s = '', n = 80) =>
  s.length > n ? s.slice(0, n) + '…' : s;

const truncId = (s = '', n = 16) =>
  String(s).length > n ? String(s).slice(0, n) + '…' : String(s);

/** Average calculated_similarity_score from nested patent infringement rows */
const avgPatentScore = (infRows = []) => {
  const scores = infRows
    .map(r => r.calculated_similarity_score ?? r.similarity_score ?? null)
    .filter(v => v !== null && !isNaN(v));
  if (!scores.length) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
};

/** Average similarity_score from product similar_claims rows */
const avgProductScore = (simRows = []) => {
  const scores = simRows
    .map(r => r.similarity_score ?? r.calculated_similarity_score ?? null)
    .filter(v => v !== null && !isNaN(v));
  if (!scores.length) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const CheckIcon = ({ size = 20 }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: size, height: size, borderRadius: '50%',
    background: 'rgba(46,125,50,0.12)', flexShrink: 0,
  }}>
    <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} viewBox="0 0 24 24" fill="none"
      stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

const EmptyDot = () => (
  <span style={{
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: 'var(--rule2)', flexShrink: 0,
  }} />
);

const ScorePill = ({ pct, compact }) => {
  const color =
    pct >= 70 ? 'var(--amber)'
    : pct >= 40 ? 'var(--accent)'
    : 'var(--ink3)';
  const bg =
    pct >= 70 ? 'var(--amber-soft)'
    : pct >= 40 ? 'var(--acc-soft)'
    : 'var(--surf2)';
  return (
    <span style={{
      display: 'inline-block', fontSize: compact ? 8 : 9, fontWeight: 700,
      fontFamily: "'Inconsolata', monospace",
      color, background: bg, borderRadius: 4, padding: compact ? '1px 3px' : '1px 5px',
      letterSpacing: '0.04em', marginBottom: 3,
    }}>
      {pct}%
    </span>
  );
};

// ─── Shared table shell (now responsive + fixed-page pagination) ───────────
//
// Key changes vs the original:
//  - FIXED PAGE SIZE: always shows PAGE_SIZE (10) match columns at a time,
//    regardless of viewport width or density. Prev/Next buttons in the
//    controls bar move a full page (10 columns) at once — no more
//    pixel/scroll-position-based "however many fit" logic.
//  - Density modes (comfortable / compact) still control column width and
//    font size for readability, but no longer affect how many columns
//    are shown per page.
//  - The claim column stays sticky on the left at all densities.
//  - On narrow screens (<640px) it falls back to a per-claim card list so the
//    table never gets clipped or requires horizontal scrolling on mobile.
//  - The outer wrapper constrains itself to `width: 100%` / `max-width: 100%`
//    / `min-width: 0` so it can never force the parent page layout to
//    overflow horizontally.

const DENSITY = {
  comfortable: { claimCol: 260, matchCol: 100, fontSize: 12 },
  compact:     { claimCol: 220, matchCol: 64,  fontSize: 11 },
};

// Always show this many match columns per page. Prev/Next move a full page.
const PAGE_SIZE = 10;

const MatrixTable = ({ claimRows, matches, getMatchSet, getScore, showScorePerCell = false }) => {
  const [density, setDensity] = useState('comfortable');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [page, setPage] = useState(0); // 0-indexed page number
  const [jumpValue, setJumpValue] = useState('');
  const scrollRef = useRef(null);

  const cfg = DENSITY[density];
  const compact = density === 'compact';

  useEffect(() => {
    const check = () => setViewMode(window.innerWidth < 640 ? 'cards' : 'table');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const totalCols = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCols / PAGE_SIZE));

  // Clamp page if the dataset shrinks (e.g. switching tabs/filters)
  useEffect(() => {
    setPage(p => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const firstVisible = page * PAGE_SIZE;
  const lastVisible = Math.min(totalCols - 1, firstVisible + PAGE_SIZE - 1);

  const visibleMatches = useMemo(
    () => matches.slice(firstVisible, lastVisible + 1),
    [matches, firstVisible, lastVisible]
  );

  // Reset any leftover horizontal scroll offset whenever the page or
  // density changes, so the new page always starts fully visible from
  // the claim column.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [page, density]);

  const goToPage = (p) => setPage(Math.max(0, Math.min(p, totalPages - 1)));
  const goToColumn = (idx) => goToPage(Math.floor(idx / PAGE_SIZE));

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalCols) {
      goToColumn(n - 1);
    }
    setJumpValue('');
  };

  if (!matches.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic', padding: '16px 0' }}>
        No matches available for this view.
      </p>
    );
  }

  const atStart = page <= 0;
  const atEnd = page >= totalPages - 1;
  const showNav = totalPages > 1;

  // Minimap thumb: width = fraction of one page, position = fraction through pages
  const thumbWidthPct = Math.max(6, (1 / totalPages) * 100);
  const maxThumbTravelPct = 100 - thumbWidthPct;
  const thumbLeftPct = totalPages > 1 ? (page / (totalPages - 1)) * maxThumbTravelPct : 0;

  // ── Mobile / narrow viewport: per-claim card list instead of a wide table ──
  // (Cards view still shows ALL matches per claim, not just the current page,
  // since there's no horizontal column concept on mobile.)
  if (viewMode === 'cards') {
    return (
      <div className="pd-card-body" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: '1px solid var(--rule2)',
          background: 'var(--surf2)',
        }}>
          <span style={{
            fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
          }}>
            {matches.length} match{matches.length !== 1 ? 'es' : ''} per claim
          </span>
        </div>
        {claimRows.map((claim, rowIdx) => {
          const rowMatches = matches
            .map((m) => {
              const set = getMatchSet(m);
              if (!set.has(claim)) return null;
              const score = showScorePerCell && set.get ? set.get(claim) : null;
              return { m, score };
            })
            .filter(Boolean);

          return (
            <div key={rowIdx} style={{
              padding: '12px 14px',
              borderBottom: rowIdx < claimRows.length - 1 ? '1px solid var(--rule2)' : 'none',
              background: rowIdx % 2 === 0 ? 'var(--surf)' : 'var(--surf2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: rowMatches.length ? 8 : 0 }}>
                <span style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 9,
                  color: 'var(--accent)', background: 'var(--acc-soft)',
                  borderRadius: 3, padding: '1px 4px', fontWeight: 700,
                  flexShrink: 0, marginTop: 2,
                }}>
                  {rowIdx + 1}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>{claim}</span>
              </div>
              {rowMatches.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 26 }}>
                  {rowMatches.map(({ m, score }, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: "'Inconsolata', monospace", fontSize: 10,
                      background: 'rgba(46,125,50,0.10)', color: '#1b5e20',
                      borderRadius: 4, padding: '3px 7px', fontWeight: 600,
                    }}>
                      <CheckIcon size={14} />
                      {truncId(m._colId, 14)}
                      {score !== null && score !== undefined && ` · ${Math.round(score * 100)}%`}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '0 0 0 26px', fontStyle: 'italic' }}>
                  No matches
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Desktop / tablet: paginated table (10 columns per page) ──
  return (
    <div className="pd-card-body" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>

      {/* ── Controls bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
        padding: '8px 12px', borderBottom: '1px solid var(--rule2)',
        background: 'var(--surf2)',
      }}>
        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
        }}>
          {totalCols > 0
            ? `Showing ${firstVisible + 1}–${lastVisible + 1} of ${totalCols} columns`
            : 'No columns'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {showNav && (
            <>
              <button
                onClick={() => goToPage(0)}
                disabled={atStart}
                aria-label="Jump to first page"
                style={navBtnStyle(atStart)}
              >
                «
              </button>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={atStart}
                aria-label="Previous 10 columns"
                style={navBtnStyle(atStart)}
              >
                <ChevronLeft size={13} />
                <span style={{ fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600 }}>Prev</span>
              </button>

              <span style={{
                fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600,
                color: 'var(--ink3)', padding: '0 4px', whiteSpace: 'nowrap',
              }}>
                Page {page + 1} / {totalPages}
              </span>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={atEnd}
                aria-label="Next 10 columns"
                style={navBtnStyle(atEnd)}
              >
                <span style={{ fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600 }}>Next</span>
                <ChevronRight size={13} />
              </button>
              <button
                onClick={() => goToPage(totalPages - 1)}
                disabled={atEnd}
                aria-label="Jump to last page"
                style={navBtnStyle(atEnd)}
              >
                »
              </button>

              <div style={{ width: 1, height: 18, background: 'var(--rule2)', margin: '0 4px' }} />

              <form onSubmit={handleJumpSubmit} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace" }}>Go to</span>
                <input
                  type="number"
                  min={1}
                  max={totalCols}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  placeholder={String(firstVisible + 1)}
                  style={{
                    width: 48, padding: '3px 6px', borderRadius: 4,
                    border: '1px solid var(--rule2)', background: 'var(--surf)',
                    color: 'var(--ink2)', fontSize: 11, fontFamily: "'Inconsolata', monospace",
                  }}
                />
                <button type="submit" style={navBtnStyle(false)}>Go</button>
              </form>

              <div style={{ width: 1, height: 18, background: 'var(--rule2)', margin: '0 4px' }} />
            </>
          )}

          <button
            onClick={() => setDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
            title={compact ? 'Switch to comfortable view' : 'Switch to compact view'}
            style={navBtnStyle(false)}
          >
            {compact ? <ZoomIn size={13} /> : <ZoomOut size={13} />}
            <span style={{ fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {compact ? 'Comfort' : 'Compact'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Table (only the current page's columns are rendered) ── */}
      <div
        ref={scrollRef}
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}
      >
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: cfg.fontSize,
          tableLayout: 'fixed',
          minWidth: `${cfg.claimCol + visibleMatches.length * cfg.matchCol}px`,
        }}>
          <colgroup>
            <col style={{ width: cfg.claimCol }} />
            {visibleMatches.map((_, i) => <col key={i} style={{ width: cfg.matchCol }} />)}
          </colgroup>

          <thead>
            <tr style={{ background: 'var(--surf2)' }}>
              <th style={{
                padding: compact ? '8px 10px' : '10px 14px', textAlign: 'left',
                fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
                borderBottom: '1px solid var(--rule2)', borderRight: '1px solid var(--rule2)',
                position: 'sticky', left: 0, background: 'var(--surf2)', zIndex: 2,
              }}>
                Claim
              </th>

              {visibleMatches.map((m, mIdx) => {
                const pct = getScore(m);
                return (
                  <th key={`${m._colId}-${firstVisible + mIdx}`} style={{
                    padding: compact ? '6px 3px' : '8px 6px', textAlign: 'center',
                    fontFamily: "'Inconsolata', monospace", fontSize: compact ? 8 : 9, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)',
                    borderBottom: '1px solid var(--rule2)', borderRight: '1px solid var(--rule2)',
                    verticalAlign: 'bottom',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <ScorePill pct={pct} compact={compact} />
                      <span title={m._colLabel} style={{
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', maxWidth: cfg.matchCol - 14,
                      }}>
                        {truncId(m._colId, compact ? 8 : 11)}
                      </span>
                      {m._colSub && !compact && (
                        <span style={{
                          fontSize: 8, color: 'var(--ink3)', textTransform: 'uppercase',
                          letterSpacing: '0.06em', whiteSpace: 'nowrap',
                        }}>
                          {m._colSub}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {claimRows.map((claim, rowIdx) => {
              const isEven = rowIdx % 2 === 0;
              // Match-count badge still reflects ALL matches (not just this page)
              const rowMatchCount = matches.filter(m => getMatchSet(m).has(claim)).length;
              return (
                <tr key={rowIdx} style={{ background: isEven ? 'var(--surf)' : 'var(--surf2)' }}>
                  <td style={{
                    padding: compact ? '6px 10px' : '8px 12px', color: 'var(--ink2)',
                    fontSize: cfg.fontSize, lineHeight: 1.5,
                    borderBottom: '1px solid var(--rule2)', borderRight: '1px solid var(--rule2)',
                    position: 'sticky', left: 0, zIndex: 1,
                    background: isEven ? 'var(--surf)' : 'var(--surf2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{
                        fontFamily: "'Inconsolata', monospace", fontSize: 9,
                        color: 'var(--accent)', background: 'var(--acc-soft)',
                        borderRadius: 3, padding: '1px 4px', fontWeight: 700,
                        flexShrink: 0, marginTop: 2,
                      }}>
                        {rowIdx + 1}
                      </span>
                      <span title={claim}>{trunc(claim, compact ? 50 : 70)}</span>
                      {rowMatchCount > 0 && (
                        <span style={{
                          marginLeft: 'auto', flexShrink: 0, fontSize: 9, fontWeight: 700,
                          color: 'var(--amber)', background: 'var(--amber-soft)',
                          borderRadius: 3, padding: '1px 4px',
                          fontFamily: "'Inconsolata', monospace",
                        }}>
                          {rowMatchCount}✓
                        </span>
                      )}
                    </div>
                  </td>

                  {visibleMatches.map((m, mIdx) => {
                    const set = getMatchSet(m);
                    const isMatched = set.has(claim);
                    const cellScore = showScorePerCell && isMatched ? (set.get ? set.get(claim) : null) : null;
                    return (
                      <td key={`${m._colId}-${firstVisible + mIdx}`} style={{
                        padding: compact ? '6px 3px' : '8px 6px', textAlign: 'center',
                        borderBottom: '1px solid var(--rule2)', borderRight: '1px solid var(--rule2)',
                        verticalAlign: 'middle',
                      }}>
                        {isMatched ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CheckIcon size={compact ? 16 : 20} />
                            {cellScore !== null && (
                              <span style={{
                                fontSize: compact ? 8 : 9, fontWeight: 600, color: '#2E7D32',
                                fontFamily: "'Inconsolata', monospace",
                              }}>
                                {Math.round(cellScore * 100)}%
                              </span>
                            )}
                          </div>
                        ) : <EmptyDot />}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Bottom minimap showing position across all pages ── */}
      {showNav && (
        <div style={{
          padding: '8px 14px', borderTop: '1px solid var(--rule2)',
          background: 'var(--surf2)',
        }}>
          <div
            style={{
              position: 'relative', height: 6, borderRadius: 3,
              background: 'var(--rule2)', cursor: 'pointer', overflow: 'hidden',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const targetPage = Math.round(ratio * (totalPages - 1));
              goToPage(targetPage);
            }}
          >
            <div style={{
              position: 'absolute', top: 0, height: '100%',
              borderRadius: 3, background: 'var(--accent)',
              width: `${thumbWidthPct}%`,
              left: `${thumbLeftPct}%`,
              transition: 'left 0.08s linear',
            }} />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .cm-scroll-hint { display: block !important; }
        }
      `}</style>
    </div>
  );
};

const navBtnStyle = (disabled) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 8px', borderRadius: 5,
  border: '1px solid var(--rule2)', background: disabled ? 'var(--surf2)' : 'var(--surf)',
  color: disabled ? 'var(--ink3)' : 'var(--ink2)',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});

// ─── Tab: Legacy (original ClaimsMatrix behaviour) ───────────────────────────
// Matches ref_claim strings from either format against displayClaims strings.

const LegacyMatrix = ({ displayClaims, potentialMatches }) => {
  const refClaimSets = potentialMatches.reduce((acc, match) => {
    const refs = (match.similarClaims || [])
      .map(sc => sc.ref_claim)
      .filter(Boolean);
    acc[match.id] = new Set(refs);
    return acc;
  }, {});

  const getMatchScore = (match) => {
    const matched = displayClaims.filter(c => refClaimSets[match.id]?.has(c)).length;
    return displayClaims.length ? Math.round((matched / displayClaims.length) * 100) : 0;
  };

  if (!potentialMatches.length || !displayClaims.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>
        No legacy match data available.
      </p>
    );
  }

  const enriched = potentialMatches.map((m, idx) => ({
    ...m,
    _colId: m.id || m.title || `match-${idx}`,
    _colLabel: m.title,
    _colSub: m.type?.toUpperCase(),
  }));

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <MatrixTable
        claimRows={displayClaims}
        matches={enriched}
        getMatchSet={(m) => refClaimSets[m.id] || new Set()}
        getScore={(m) => getMatchScore(potentialMatches.find(pm => pm.id === m.id) || m)}
      />
    </div>
  );
};

// ─── Tab: Patent matrix ──────────────────────────────────────────────────────
// Uses documented_claim (original patent language) vs patent infringements
// that carry infringements[].ref_claim + calculated_similarity_score.

const PatentMatrix = ({ claimsObj, infringements }) => {
  // claimsObj may be array of strings OR object {"0":{documented_claim,...}}
  const docClaims = Array.isArray(claimsObj)
    ? claimsObj
    : Object.values(claimsObj || {}).map(v =>
        typeof v === 'object' ? v.documented_claim || v : String(v)
      );

  const patentMatches = infringements.filter(
    inf => inf.case_id && Array.isArray(inf.infringements) && inf.infringements.length > 0
  );

  if (!patentMatches.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>
        No patent infringement matches with embedding scores found yet. Run analysis to populate this view.
      </p>
    );
  }

  // Build a Map<ref_claim → calculated_similarity_score> per match
  const buildScoreMap = (inf) => {
    const map = new Map();
    (inf.infringements || []).forEach(row => {
      if (row.ref_claim) {
        const existing = map.get(row.ref_claim) ?? 0;
        map.set(row.ref_claim, Math.max(existing, row.calculated_similarity_score ?? 0));
      }
    });
    return map;
  };

  const enriched = patentMatches.map((inf, idx) => ({
    ...inf,
    _colId: inf.case_id ? `${inf.case_id}-${idx}` : `patent-${idx}`,
    _colIdLabel: inf.case_id || `patent-${idx}`,
    _colLabel: inf.entry_title || inf.title || inf.case_id,
    _colSub: (inf.source || '').toUpperCase(),
    _scoreMap: buildScoreMap(inf),
  })).map(m => ({ ...m, _colId: m._colIdLabel })); // keep display id readable; uniqueness handled via row index in keys

  // getMatchSet returns a Map<claim→score> so the cell can render score inline
  const getMatchSet = (m) => m._scoreMap;

  const getScore = (m) => avgPatentScore(m.infringements || []);

  const totalMatches = docClaims.reduce((count, claim) =>
    count + enriched.filter(m => m._scoreMap.has(claim)).length, 0);

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <MatrixTable
        claimRows={docClaims}
        matches={enriched}
        getMatchSet={getMatchSet}
        getScore={getScore}
        showScorePerCell
      />
      <p style={{
        fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace",
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: 8, paddingLeft: 4, paddingRight: 4,
        whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere',
      }}>
        Cell scores = embedding cosine similarity · {totalMatches} claim-match pair{totalMatches !== 1 ? 's' : ''} across {patentMatches.length} patent{patentMatches.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

// ─── Tab: Product matrix ─────────────────────────────────────────────────────
// Uses market_language_claim vs product infringements similar_claims[].claim.

const ProductMatrix = ({ claimsObj, infringements }) => {
  const isObjClaims = !Array.isArray(claimsObj) && typeof claimsObj === 'object' && claimsObj !== null;

  const mktClaims = isObjClaims
    ? Object.values(claimsObj).map(v =>
        typeof v === 'object' ? v.market_language_claim || v.documented_claim || '' : String(v)
      )
    : []; // no market language if claims is a plain string array

  const productMatches = infringements.filter(
    inf => inf.product_id && Array.isArray(inf.similar_claims)
  );

  if (!isObjClaims || !mktClaims.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>
        Market language claims are only available when the patent has structured claims with <code>market_language_claim</code> fields.
      </p>
    );
  }

  if (!productMatches.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>
        No product matches found. Run infringement analysis to populate this view.
      </p>
    );
  }

  // For each product match, build a Set of product-claim strings that scored ≥ 0.5
  // Then map each market_language_claim row by its index rank to the top product claims
  const enriched = productMatches.map((inf, idx) => {
    const topClaims = (inf.similar_claims || [])
      .filter(sc => (sc.similarity_score ?? 0) >= 0.5)
      .sort((a, b) => (b.similarity_score ?? 0) - (a.similarity_score ?? 0));

    const indexScoreMap = new Map();
    topClaims.forEach((sc, i) => {
      if (i < mktClaims.length) {
        indexScoreMap.set(mktClaims[i], sc.similarity_score ?? 0);
      }
    });

    return {
      ...inf,
      _colId: inf.product_id || `product-${idx}`,
      _colLabel: inf.product_name || inf.product_id,
      _colSub: (inf.source || '').toUpperCase(),
      _indexScoreMap: indexScoreMap,
    };
  });

  const getMatchSet = (m) => m._indexScoreMap;
  const getScore = (m) => avgProductScore(m.similar_claims || []);

  const totalMatches = mktClaims.reduce((count, mkt) =>
    count + enriched.filter(m => m._indexScoreMap.has(mkt)).length, 0);

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <MatrixTable
        claimRows={mktClaims}
        matches={enriched}
        getMatchSet={getMatchSet}
        getScore={getScore}
        showScorePerCell
      />
      <p style={{
        fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace",
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: 8, paddingLeft: 4, paddingRight: 4,
        whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere',
      }}>
        Rows = market language · product claims matched by score rank (≥50%) · {totalMatches} pair{totalMatches !== 1 ? 's' : ''} across {productMatches.length} product{productMatches.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ClaimsMatrix = ({ displayClaims, potentialMatches, rawClaimsObj, rawInfringements = [] }) => {
  const [activeTab, setActiveTab] = useState('legacy');

  // Determine which tabs have data
  const hasLegacy = potentialMatches?.length > 0 && displayClaims?.length > 0;

  const hasPatentTab = rawInfringements.some(
    inf => inf.case_id && Array.isArray(inf.infringements) && inf.infringements.length > 0
  );

  const hasProductTab = rawInfringements.some(inf => inf.product_id && Array.isArray(inf.similar_claims));
  const hasObjClaims  = rawClaimsObj && !Array.isArray(rawClaimsObj) && typeof rawClaimsObj === 'object';

  // Total count for header badge
  const totalMatches = (() => {
    if (!displayClaims?.length || !potentialMatches?.length) return 0;
    const refClaimSets = potentialMatches.reduce((acc, m) => {
      acc[m.id] = new Set((m.similarClaims || []).map(sc => sc.ref_claim).filter(Boolean));
      return acc;
    }, {});
    return displayClaims.reduce((count, c) =>
      count + potentialMatches.filter(m => refClaimSets[m.id]?.has(c)).length, 0);
  })();

  if (!hasLegacy && !hasPatentTab && !hasProductTab) return null;

  const tabs = [
    hasLegacy   && { key: 'legacy',   label: 'Coverage',        sub: 'ref_claim match' },
    hasPatentTab && { key: 'patent',   label: 'Patent matrix',   sub: 'original language' },
    (hasProductTab && hasObjClaims) && { key: 'product', label: 'Product matrix', sub: 'market language' },
  ].filter(Boolean);

  // If activeTab got removed (e.g. no data), fall back to first available
  const resolvedTab = tabs.find(t => t.key === activeTab)?.key || tabs[0]?.key || 'legacy';

  return (
    <div style={{ marginBottom: 20, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* ── Section header ── */}
      <div className="sec-hd" style={{ marginBottom: 12 }}>
        <div className="sec-hd-left">
          <div className="sec-ico">
            <FileText size={16} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <div>
            <div className="sec-eye"><div className="live-dot" />Coverage</div>
            <div className="sec-title">Claims Coverage Matrix</div>
          </div>
        </div>

        <div className="sec-hd-right" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="pcard-num" style={{
            margin: 0,
            color: totalMatches > 0 ? 'var(--amber)' : 'var(--ink3)',
            background: totalMatches > 0 ? 'var(--amber-soft)' : 'var(--surf2)',
          }}>
            {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* ── Tab bar ── */}
      {tabs.length > 1 && (
        <div style={{
          display: 'flex', gap: 0, marginBottom: 14, flexWrap: 'wrap',
          borderBottom: '1px solid var(--rule2)',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '7px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inconsolata', monospace",
                color: resolvedTab === tab.key ? 'var(--accent)' : 'var(--ink3)',
                borderBottom: resolvedTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {tab.label}
              </span>
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
                {tab.sub}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Tab content ── */}
      {resolvedTab === 'legacy' && (
        <LegacyMatrix
          displayClaims={displayClaims}
          potentialMatches={potentialMatches}
        />
      )}

      {resolvedTab === 'patent' && (
        <PatentMatrix
          claimsObj={rawClaimsObj ?? displayClaims}
          infringements={rawInfringements}
        />
      )}

      {resolvedTab === 'product' && (
        <ProductMatrix
          claimsObj={rawClaimsObj ?? displayClaims}
          infringements={rawInfringements}
        />
      )}

      <style>{`
        @media (max-width: 900px) { .cm-scroll-hint { display: block !important; } }
      `}</style>
    </div>
  );
};

export default ClaimsMatrix;
