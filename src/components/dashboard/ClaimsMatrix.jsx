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

/**
 * True for any infringement record that represents a PATENT match,
 * regardless of which claim-scoring shape it carries:
 *  - legacy: infringements[] rows with { ref_claim, calculated_similarity_score }
 *  - current: similar_claims[] rows with { ref_claim_index, ref_claim_flag, similarity_score }
 */
const isPatentRecord = (inf) =>
  Boolean(inf.case_id) && (
    (Array.isArray(inf.infringements) && inf.infringements.length > 0) ||
    (Array.isArray(inf.similar_claims) && inf.similar_claims.length > 0)
  );

/**
 * Resolves the reference claim TEXT for a single row, regardless of shape.
 * Legacy rows already carry the raw ref_claim string. Current-format rows
 * only carry ref_claim_index, so we look it up in docClaims (the same flat,
 * order-preserving array getClaimRows() already produces).
 */
const resolveRefClaimText = (docClaims, row) => {
  if (row.ref_claim) return row.ref_claim;
  if (row.ref_claim_index !== undefined && row.ref_claim_index !== null) {
    return docClaims[row.ref_claim_index] ?? null;
  }
  return null;
};

/**
 * Normalizes claim text for comparison purposes only (never for display).
 * ref_claim strings and claim rows are supposed to be the same text, but
 * often pick up small drift — extra/irregular whitespace, smart quotes vs
 * straight quotes, trailing newlines — somewhere in the pipeline (e.g. when
 * claim text is re-serialized during an embedding/scoring step). A byte-exact
 * Map lookup treats any of that as "no match" even though a human would call
 * it the same claim. This collapses whitespace, straightens curly quotes,
 * and lowercases before comparing, so real matches aren't silently dropped
 * over formatting noise.
 */
const normalizeClaim = (s = '') =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();


    


// ─── Debug: ref_claim matching diagnostics ─────────────────────────────────

const firstDiffIndex = (a, b) => {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : len;
};
/**
 * Canonical claim-row extraction — the ONLY place this logic lives.
 * PatentMatrix, ProductMatrix, and the debug panel all call this, so
 * they can never silently diverge on which field/format gets compared.
 *
 * - Flat array format: claims ARE just strings — used as-is. There's no
 *   market-language/documented distinction to pick between.
 * - Structured object format: pick documented_claim vs market_language_claim
 *   based on `preference`, since only structured data actually has both.
 */
const getClaimRows = (claimsObj, preference = 'documented') => {
  if (!claimsObj) return [];
  if (Array.isArray(claimsObj)) return claimsObj; // flat format: no preference applies
  return Object.values(claimsObj).map(v => {
    if (typeof v !== 'object' || v === null) return String(v);
    return preference === 'market'
      ? (v.market_language_claim || v.documented_claim || '')
      : (v.documented_claim || v.market_language_claim || '');
  });
};

/**
 * Merges infringement records that share the same key (case_id or
 * product_id) into one, concatenating their `infringements` rows.
 * Prevents the same patent/product from rendering as two separate
 * columns (and double-counting matches) if it appears more than once
 * in rawInfringements.
 */
const mergeByKey = (list, keyField) => {
  const map = new Map();
  list.forEach(inf => {
    const key = inf[keyField];
    if (!key) return;
    if (!map.has(key)) {
      //map.set(key, { ...inf, infringements: [...(inf.infringements || [])] });
      map.set(key, {
        ...inf,
        infringements: [...(inf.infringements || [])],
        similar_claims: [...(inf.similar_claims || [])],   // ← added
      });
    } else {
      map.get(key).infringements.push(...(inf.infringements || []));
      map.get(key).similar_claims.push(...(inf.similar_claims || []));  // ← added
    }
  });
  return [...map.values()];
};
const debugRefClaimMatching = (claims, infringements) => {
  const normClaims = claims.map(c => ({ raw: c, norm: normalizeClaim(c) }));
  const rows = infringements.flatMap(inf => {
    const arr = inf.infringements || inf.similar_claims || [];
    const entryId = inf.product_id || inf.case_id || inf.entry_id || 'unknown';
    return arr.map(r => ({ ...r, _entryId: entryId }));
  });

  let matched = 0;
  const unmatched = [];

  rows.forEach(row => {
    const ref = row.ref_claim;
    if (!ref) return;
    const normRef = normalizeClaim(ref);
    const hit = normClaims.find(c => c.norm === normRef);
    if (hit) { matched++; return; }

    let best = null, bestScore = -1;
    normClaims.forEach(c => {
      const d = firstDiffIndex(c.norm, normRef);
      const score = d === -1 ? Math.max(c.norm.length, normRef.length) : d;
      if (score > bestScore) { bestScore = score; best = c; }
    });
    unmatched.push({ entryId: row._entryId, ref, normRef, best, diffIndex: bestScore });
  });

  console.log(`✅ Matched: ${matched} / ${rows.length}`);
  console.log(`❌ Unmatched: ${unmatched.length}`);
  unmatched.forEach((u, i) => {
    console.group(`Unmatched #${i + 1} — entry: ${u.entryId}`);
    console.log('ref_claim (raw):        ', JSON.stringify(u.ref));
    console.log('closest claim (raw):    ', JSON.stringify(u.best?.raw));
    console.log('diverge at char index:  ', u.diffIndex);
    if (u.best) {
      const start = Math.max(0, u.diffIndex - 20);
      console.log('ref  around divergence: ', JSON.stringify(u.normRef.slice(start, u.diffIndex + 30)));
      console.log('claim around divergence:', JSON.stringify(u.best.norm.slice(start, u.diffIndex + 30)));
    }
    console.groupEnd();
  });

  return unmatched;
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

// ─── Shared table shell (responsive: cards <640, auto-compact <1024) ───────

const DENSITY = {
  comfortable: { claimCol: 260, matchCol: 100, fontSize: 12 },
  compact:     { claimCol: 180, matchCol: 60,  fontSize: 11 },
};

const PAGE_SIZE = 10;

// Simple hook: tracks viewport width bucket so table + controls can react.
const useViewportBucket = () => {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  useEffect(() => {
    let raf;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return width;
};

const MatrixTable = ({ claimRows, matches, getMatchSet, getScore, showScorePerCell = false }) => {
  const width = useViewportBucket();

  const isCards   = width < 640;                 // phones: card list, no table
  const isNarrow  = width >= 640 && width < 1024; // tablets/small laptops
  const isTiny    = width < 420;                  // very small phones

  const [densityOverride, setDensityOverride] = useState(null); // user manual choice
  const autoDensity = isNarrow ? 'compact' : 'comfortable';
  const density = densityOverride || autoDensity;

  const [viewMode, setViewMode] = useState(isCards ? 'cards' : 'table');
  const [page, setPage] = useState(0);
  const [jumpValue, setJumpValue] = useState('');
  const scrollRef = useRef(null);

  const cfg = DENSITY[density];
  const compact = density === 'compact';

  useEffect(() => {
    setViewMode(isCards ? 'cards' : 'table');
  }, [isCards]);

  const totalCols = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCols / PAGE_SIZE));

  useEffect(() => {
    setPage(p => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const firstVisible = page * PAGE_SIZE;
  const lastVisible = Math.min(totalCols - 1, firstVisible + PAGE_SIZE - 1);

  const visibleMatches = useMemo(
    () => matches.slice(firstVisible, lastVisible + 1),
    [matches, firstVisible, lastVisible]
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [page, density]);

  const goToPage = (p) => setPage(Math.max(0, Math.min(p, totalPages - 1)));
  const goToColumn = (idx) => goToPage(Math.floor(idx / PAGE_SIZE));

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalCols) goToColumn(n - 1);
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

  const thumbWidthPct = Math.max(6, (1 / totalPages) * 100);
  const maxThumbTravelPct = 100 - thumbWidthPct;
  const thumbLeftPct = totalPages > 1 ? (page / (totalPages - 1)) * maxThumbTravelPct : 0;

  // ── Mobile: per-claim card list ──
  if (viewMode === 'cards') {
    return (
      <div className="pd-card-body" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: '1px solid var(--rule2)',
          background: 'var(--surf2)', flexWrap: 'wrap', gap: 6,
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
              width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box',
              overflow: 'hidden',
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
                <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5, minWidth: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{claim}</span>
              </div>
              {rowMatches.length > 0 ? (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6,
                  paddingLeft: 26, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box',
                }}>
                  {rowMatches.map(({ m, score }, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: "'Inconsolata', monospace", fontSize: 10,
                      background: 'rgba(46,125,50,0.10)', color: '#1b5e20',
                      borderRadius: 4, padding: '3px 7px', fontWeight: 600,
                      maxWidth: '100%', minWidth: 0, boxSizing: 'border-box',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      <CheckIcon size={14} />
                      {truncId(m._colId, 12)}
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

  // ── Tablet / desktop: paginated table ──
  return (
    <div className="pd-card-body" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>

      {/* ── Controls bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
        padding: isTiny ? '8px' : '8px 12px', borderBottom: '1px solid var(--rule2)',
        background: 'var(--surf2)',
      }}>
        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
          whiteSpace: 'nowrap',
        }}>
          {totalCols > 0
            ? isTiny
              ? `${firstVisible + 1}–${lastVisible + 1}/${totalCols}`
              : `Showing ${firstVisible + 1}–${lastVisible + 1} of ${totalCols} columns`
            : 'No columns'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 6 }}>
          {showNav && (
            <>
              {!isTiny && (
                <button onClick={() => goToPage(0)} disabled={atStart} aria-label="Jump to first page" style={navBtnStyle(atStart)}>«</button>
              )}
              <button onClick={() => goToPage(page - 1)} disabled={atStart} aria-label="Previous 10 columns" style={navBtnStyle(atStart)}>
                <ChevronLeft size={13} />
                {!isTiny && <span style={{ fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600 }}>Prev</span>}
              </button>

              <span style={{
                fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600,
                color: 'var(--ink3)', padding: '0 4px', whiteSpace: 'nowrap',
              }}>
                {page + 1}/{totalPages}
              </span>

              <button onClick={() => goToPage(page + 1)} disabled={atEnd} aria-label="Next 10 columns" style={navBtnStyle(atEnd)}>
                {!isTiny && <span style={{ fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600 }}>Next</span>}
                <ChevronRight size={13} />
              </button>
              {!isTiny && (
                <button onClick={() => goToPage(totalPages - 1)} disabled={atEnd} aria-label="Jump to last page" style={navBtnStyle(atEnd)}>»</button>
              )}

              {!isNarrow && !isTiny && (
                <>
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
                </>
              )}

              <div style={{ width: 1, height: 18, background: 'var(--rule2)', margin: '0 4px' }} />
            </>
          )}

          <button
            onClick={() => setDensityOverride(d => (d === 'compact' ? 'comfortable' : 'compact'))}
            title={compact ? 'Switch to comfortable view' : 'Switch to compact view'}
            style={navBtnStyle(false)}
          >
            {compact ? <ZoomIn size={13} /> : <ZoomOut size={13} />}
            {!isTiny && (
              <span style={{ fontSize: 10, fontFamily: "'Inconsolata', monospace", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {compact ? 'Comfort' : 'Compact'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        ref={scrollRef}
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%', minWidth: 0 }}
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
                  <th key={m._colKey ?? `${m._colId}-${firstVisible + mIdx}`} style={{
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
                        {truncId(m._colId, compact ? 6 : 11)}
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
                      <span title={claim}>{trunc(claim, compact ? 40 : 70)}</span>
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
                      <td key={m._colKey ?? `${m._colId}-${firstVisible + mIdx}`} style={{
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

      {showNav && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--rule2)', background: 'var(--surf2)' }}>
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
// NOTE: The "Coverage" tab that renders this component has been commented out
// below (see the `tabs` array and the tab-content section in ClaimsMatrix).
// LegacyMatrix itself is left intact/unused so it can be re-enabled easily.

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
  const docClaims = getClaimRows(claimsObj, 'documented');

  /*const patentMatches = infringements.filter(
    inf => inf.case_id && Array.isArray(inf.infringements) && inf.infringements.length > 0
  );*/
  /*const patentMatches = mergeByKey(                       // ← wrap here
    infringements.filter(
      inf => inf.case_id && Array.isArray(inf.infringements) && inf.infringements.length > 0
    ),
    'case_id'
  );*/
  const patentMatches = mergeByKey(
    infringements.filter(isPatentRecord),   // ← was the inline case_id/infringements check
    'case_id'
  );

  if (!patentMatches.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>
        No patent infringement matches with embedding scores found yet. Run analysis to populate this view.
      </p>
    );
  }

  // Build a Map<normalized ref_claim → calculated_similarity_score> per match.
  // Keyed on normalizeClaim() rather than the raw string so minor whitespace/
  // quote drift between ref_claim and the claim row doesn't cause a silent
  // "no match" (see normalizeClaim's comment above for why this matters).
  const buildScoreMap = (inf) => {
    const map = new Map();
    (inf.infringements || []).forEach(row => {
      if (row.ref_claim) {
        const key = normalizeClaim(row.ref_claim);
        const existing = map.get(key) ?? 0;
        map.set(key, Math.max(existing, row.calculated_similarity_score ?? 0));
      }
    });
    // ← added: current-format rows
    (inf.similar_claims || []).forEach(row => {
      const refText = resolveRefClaimText(docClaims, row);
      if (!refText) return;
      const key = normalizeClaim(refText);
      const score = row.similarity_score ?? row.calculated_similarity_score ?? 0;
      const existing = map.get(key) ?? 0;
      map.set(key, Math.max(existing, score));
    });
    return map;
  };

  /*const enriched = patentMatches.map((inf, idx) => ({
    ...inf,
    _colId: inf.case_id ? `${inf.case_id}-${idx}` : `patent-${idx}`,
    _colIdLabel: inf.case_id || `patent-${idx}`,
    _colLabel: inf.entry_title || inf.title || inf.case_id,
    _colSub: (inf.source || '').toUpperCase(),
    _scoreMap: buildScoreMap(inf),
  })).map(m => ({ ...m, _colId: m._colIdLabel })); // keep display id readable; uniqueness handled via row index in keys
*/
const enriched = patentMatches.map((inf, idx) => ({
  ...inf,
  _colId: inf.case_id || `patent-${idx}`,     // display label (can repeat)
  _colKey: inf.case_id ? `${inf.case_id}-${idx}` : `patent-${idx}`, // always unique
  _colLabel: inf.entry_title || inf.title || inf.case_id,
  _colSub: (inf.source || '').toUpperCase(),
  _scoreMap: buildScoreMap(inf),
}));
  // getMatchSet returns a normalization-aware wrapper: MatrixTable calls
  // .has(claim) / .get(claim) with the RAW claim row text, so this normalizes
  // that query the same way the map's keys were normalized when built.
  const getMatchSet = (m) => ({
    has: (claim) => m._scoreMap.has(normalizeClaim(claim)),
    get: (claim) => m._scoreMap.get(normalizeClaim(claim)),
  });

  const getScore = (m) => avgPatentScore([...(m.infringements || []), ...(m.similar_claims || [])]);

  const totalMatches = docClaims.reduce((count, claim) =>
    count + enriched.filter(m => m._scoreMap.has(normalizeClaim(claim))).length, 0);

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <MatrixTable
        claimRows={docClaims}
        matches={enriched}
        getMatchSet={getMatchSet}
        getScore={getScore}
        showScorePerCell
      />
      {/*<p style={{
        fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace",
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: 8, paddingLeft: 4, paddingRight: 4,
        whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere',
      }}>
        Cell scores = embedding cosine similarity · {totalMatches} claim-match pair{totalMatches !== 1 ? 's' : ''} across {patentMatches.length} patent{patentMatches.length !== 1 ? 's' : ''}
      </p>*/}

      <p style={{
  fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace",
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginTop: 8, paddingLeft: 4, paddingRight: 4,
  whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere',
  display: 'flex', alignItems: 'center', gap: 5,
}}>
  <span>
    Cell scores = similarity strength · {totalMatches} claim match{totalMatches !== 1 ? 'es' : ''} found across {patentMatches.length} patent{patentMatches.length !== 1 ? 's' : ''}
  </span>
  <span
    title="Each row is a claim from your patent. A checkmark in a column means our analysis found that claim's language closely matching a claim in that competing patent. The percentage shows how similar the two claims are, scored by AI comparison of their wording — the higher the percentage, the closer the overlap."
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 12, height: 12, borderRadius: '50%',
      border: '1px solid var(--ink3)', color: 'var(--ink3)',
      fontSize: 8, fontWeight: 700, cursor: 'help', flexShrink: 0,
      fontFamily: "'Inconsolata', monospace",
    }}
  >
    ?
  </span>
</p>
    </div>
  );
};

// ─── Tab: Product matrix ─────────────────────────────────────────────────────
// Uses market_language_claim vs product infringements similar_claims[].ref_claim.
// NOTE: now that product similar_claims rows carry a ref_claim (the exact
// claim text they were compared against), we match claim-to-claim exactly
// the same way PatentMatrix does — no more rank/index guessing.
//
// FALLBACK FOR OLD/FLAT CLAIMS FORMAT: when claims come in as a plain array
// of strings (the old format — no market_language_claim/documented_claim
// object structure), there's no "market language" to extract. Rather than
// blocking the whole tab with a "not available" message even when real
// product matches exist, we fall back to matching ref_claim directly against
// that flat claim-string array — identical in spirit to how the very first
// ClaimsMatrix version (and PatentMatrix's docClaims) always worked: direct
// ref_claim → claim-string matching, no market-language distinction needed.

const ProductMatrix = ({ claimsObj, infringements }) => {
  const isObjClaims = !Array.isArray(claimsObj) && typeof claimsObj === 'object' && claimsObj !== null;

  // Structured object form → prefer market_language_claim (falls back to
  // documented_claim per-entry if that specific entry lacks it).
  // Flat array form (old format) → use the claim strings as-is, same as
  // PatentMatrix's docClaims fallback.
  const claimRows = getClaimRows(claimsObj, 'market');

  const usingMarketLanguage = isObjClaims;

  /*const productMatches = infringements.filter(
    inf => inf.product_id && Array.isArray(inf.similar_claims)
  );*/
  /*const productMatches = infringements.filter(
  inf => inf.product_id && Array.isArray(inf.infringements)
);*/
const productMatches = mergeByKey(                      // ← wrap here
    infringements.filter(
      inf => inf.product_id && Array.isArray(inf.infringements)
    ),
    'product_id'
  );

  if (!claimRows.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>
        No claims available to match against.
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

  // Build a Map<normalized ref_claim → similarity_score> per product, same
  // normalization approach as PatentMatrix's buildScoreMap — keyed on
  // normalizeClaim() so minor whitespace/quote drift between ref_claim and
  // the claim row (very common with old flat-format claims run through a
  // scoring pipeline) doesn't cause a silent "no match".
  /*const buildProductScoreMap = (inf) => {
    const map = new Map();
    (inf.similar_claims || []).forEach(row => {
      if (row.ref_claim) {
        const key = normalizeClaim(row.ref_claim);
        const score = row.similarity_score ?? row.calculated_similarity_score ?? 0;
        const existing = map.get(key) ?? 0;
        map.set(key, Math.max(existing, score));
      }
    });
    return map;
  };*/

  const buildProductScoreMap = (inf) => {
  const map = new Map();
  (inf.infringements || []).forEach(row => {
    if (row.ref_claim) {
      const key = normalizeClaim(row.ref_claim);
      const score = row.calculated_similarity_score ?? row.similarity_score ?? 0;
      const existing = map.get(key) ?? 0;
      map.set(key, Math.max(existing, score));
    }
  });
  return map;
};

  const enriched = productMatches.map((inf, idx) => ({
    ...inf,
    _colId: inf.product_id || `product-${idx}`,          // display
    _colKey: inf.product_id ? `${inf.product_id}-${idx}` : `product-${idx}`, // unique key
    _colLabel: inf.product_name || inf.product_id,
    _colSub: (inf.source || '').toUpperCase(),
    _scoreMap: buildProductScoreMap(inf),
  }));

  // Normalization-aware wrapper, same reasoning as PatentMatrix's getMatchSet.
  const getMatchSet = (m) => ({
    has: (claim) => m._scoreMap.has(normalizeClaim(claim)),
    get: (claim) => m._scoreMap.get(normalizeClaim(claim)),
  });

  //const getScore = (m) => avgProductScore(m.similar_claims || []);
  const getScore = (m) => avgProductScore(m.infringements || []);

  const totalMatches = claimRows.reduce((count, c) =>
    count + enriched.filter(m => m._scoreMap.has(normalizeClaim(c))).length, 0);

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <MatrixTable
        claimRows={claimRows}
        matches={enriched}
        getMatchSet={getMatchSet}
        getScore={getScore}
        showScorePerCell
      />
    {/* <p style={{
        fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace",
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: 8, paddingLeft: 4, paddingRight: 4,
        whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere',
      }}>
        Rows = {usingMarketLanguage ? 'market language' : 'patent claims (flat format)'} · matched to product claims via ref_claim · {totalMatches} pair{totalMatches !== 1 ? 's' : ''} across {productMatches.length} product{productMatches.length !== 1 ? 's' : ''}
      </p>
*/}
      <p style={{
        fontSize: 10, color: 'var(--ink3)', fontFamily: "'Inconsolata', monospace",
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: 8, paddingLeft: 4, paddingRight: 4,
        whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span>
          Rows = {usingMarketLanguage ? 'market language' : 'patent claims'} · {totalMatches} claim match{totalMatches !== 1 ? 'es' : ''} found across {productMatches.length} product{productMatches.length !== 1 ? 's' : ''}
        </span>
        <span
          title="Each row is a claim from your patent. A checkmark in a product's column means our analysis found that exact claim text referenced in that product's source material — this is what we internally call a ref_claim match."
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 12, height: 12, borderRadius: '50%',
            border: '1px solid var(--ink3)', color: 'var(--ink3)',
            fontSize: 8, fontWeight: 700, cursor: 'help', flexShrink: 0,
            fontFamily: "'Inconsolata', monospace",
          }}
        >
          ?
        </span>
      </p>

    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ClaimsMatrix = ({ displayClaims, potentialMatches, rawClaimsObj, rawInfringements = [] }) => {
  // Coverage (legacy) tab commented out. No hardcoded default tab anymore —
  // whichever tab(s) actually have data drive what's shown (see resolvedTab
  // below), so a case with ONLY product matches shows Product matrix straight
  // away, and a case with ONLY patent matches shows Patent matrix straight
  // away, with no tab bar and no manual switching needed.
  const [activeTab, setActiveTab] = useState(null);

 // ── Debug: log ref_claim match/mismatch diagnostics whenever data changes ──
  // Runs the SAME extraction (getClaimRows) that each real tab uses, split
  // by tab, so this can never silently disagree with what's on screen.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

   /* const patentInf = rawInfringements.filter(
      inf => inf.case_id && Array.isArray(inf.infringements) && inf.infringements.length > 0
    );*/
    const patentInf = rawInfringements.filter(isPatentRecord);
   /* const productInf = rawInfringements.filter(
      inf => inf.product_id && Array.isArray(inf.similar_claims)
    );*/

    const productInf = rawInfringements.filter(
      inf => inf.product_id && Array.isArray(inf.infringements)
    );

    if (patentInf.length) {
      console.log('── Patent tab ──');
      debugRefClaimMatching(getClaimRows(rawClaimsObj ?? displayClaims, 'documented'), patentInf);
    }
    if (productInf.length) {
      console.log('── Product tab ──');
      debugRefClaimMatching(getClaimRows(rawClaimsObj ?? displayClaims, 'market'), productInf);
    }
  }, [rawClaimsObj, displayClaims, rawInfringements]);


  // Determine which tabs have data
  const hasLegacy = potentialMatches?.length > 0 && displayClaims?.length > 0;

  /*const hasPatentTab = rawInfringements.some(
    inf => inf.case_id && Array.isArray(inf.infringements) && inf.infringements.length > 0
  );*/

  const hasPatentTab = rawInfringements.some(isPatentRecord);

  //const hasProductTab = rawInfringements.some(inf => inf.product_id && Array.isArray(inf.similar_claims));
  const hasProductTab = rawInfringements.some(inf => inf.product_id && Array.isArray(inf.infringements));
  // NOTE: hasObjClaims is no longer required to *show* the Product tab —
  // ProductMatrix already renders its own "market language only available…"
  // message internally when claims aren't in structured object form. Gating
  // tab visibility on it too meant a product-only case with flat claims fell
  // through to the Patent tab's "no patent matches" message instead, which
  // was confusing and hid the real (product) data.
  const hasObjClaims = rawClaimsObj && !Array.isArray(rawClaimsObj) && typeof rawClaimsObj === 'object';

  // Total count for header badge
  /*const totalMatches = (() => {
    if (!displayClaims?.length || !potentialMatches?.length) return 0;
    const refClaimSets = potentialMatches.reduce((acc, m) => {
      acc[m.id] = new Set((m.similarClaims || []).map(sc => sc.ref_claim).filter(Boolean));
      return acc;
    }, {});
    return displayClaims.reduce((count, c) =>
      count + potentialMatches.filter(m => refClaimSets[m.id]?.has(c)).length, 0);
  })();*/

  if (!hasLegacy && !hasPatentTab && !hasProductTab) return null;

  const tabs = [
  // Coverage tab (ref_claim match) — commented out per request.
  // hasLegacy   && { key: 'legacy',   label: 'Coverage',        sub: 'ref_claim match' },
  hasProductTab && {
    key: 'product',
    label: 'Product matrix',
    sub: hasObjClaims ? 'market language' : 'original language',
  },
  hasPatentTab  && { key: 'patent',  label: 'Patent matrix',  sub: 'original language' },
].filter(Boolean);

  // Pick whichever tab actually has data: prefer the user's manual selection
  // if it's still valid, otherwise fall back to the first (only) available
  // tab. This is what makes a patent-only or product-only case render its
  // single matrix directly, with no tab bar shown (see tabs.length > 1 below).
  const resolvedTab = tabs.find(t => t.key === activeTab)?.key || tabs[0]?.key || null;

  // Total count for header badge — now reflects the ACTUAL resolved tab's
// real match data (rawInfringements), not the unrelated legacy
// potentialMatches/displayClaims props.
const totalMatches = useMemo(() => {
  if (resolvedTab === 'patent') {
    const docClaims = getClaimRows(rawClaimsObj ?? displayClaims, 'documented');
    const patentInf = mergeByKey(                              // ← was a plain filter
      rawInfringements.filter(isPatentRecord),
      'case_id'
    );
    const maps = patentInf.map(inf => {
      const set = new Set();
      (inf.infringements || []).forEach(row => {
        if (row.ref_claim) set.add(normalizeClaim(row.ref_claim));
      });
      // ← added: current-format rows
    (inf.similar_claims || []).forEach(row => {
      const refText = resolveRefClaimText(docClaims, row);
      if (refText) set.add(normalizeClaim(refText));
    });
      return set;
    });
    return docClaims.reduce((count, c) =>
      count + maps.filter(s => s.has(normalizeClaim(c))).length, 0);
  }

  if (resolvedTab === 'product') {
    const claimRows = getClaimRows(rawClaimsObj ?? displayClaims, 'market');
    const productInf = mergeByKey(                             // ← was a plain filter
      rawInfringements.filter(
        inf => inf.product_id && Array.isArray(inf.infringements)
      ),
      'product_id'
    );
    const maps = productInf.map(inf => {
      const set = new Set();
      (inf.infringements || []).forEach(row => {
        if (row.ref_claim) set.add(normalizeClaim(row.ref_claim));
      });
      return set;
    });
    return claimRows.reduce((count, c) =>
      count + maps.filter(s => s.has(normalizeClaim(c))).length, 0);
  }

  return 0;
}, [resolvedTab, rawClaimsObj, displayClaims, rawInfringements]);

  return (
    <div style={{ marginBottom: 20, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* ── Section header ── */}
      <div className="sec-hd" style={{ marginBottom: 12, minWidth: 0, maxWidth: '100%', flexWrap: 'wrap' }}>
        <div className="sec-hd-left" style={{ minWidth: 0 }}>
          <div className="sec-ico">
            <FileText size={16} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <div style={{ minWidth: 0 }}>
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

      {/* ── Tab bar ──
          Always rendered, even when there's only one tab. With a single
          matrix type available (e.g. products only, as in the case that
          prompted this), the "tab" still shows as a label so the user can
          see which matrix ("Patent matrix" / "Product matrix") they're
          looking at — it just won't be clickable-away-from since there's
          nothing else to switch to. Previously this was hidden whenever
          tabs.length <= 1, which left a product-only or patent-only matrix
          rendering with no indication of what it was. */}
      {tabs.length > 0 && (
  <div style={{
    display: 'flex', gap: 0, marginBottom: 14, flexWrap: 'wrap',
    borderBottom: '1px solid var(--rule2)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box',
  }}>
    {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              padding: '7px 14px',
              background: 'none', border: 'none',
              cursor: tabs.length > 1 ? 'pointer' : 'default',
              fontFamily: "'Inconsolata', monospace",
              color: resolvedTab === tab.key ? 'var(--accent)' : 'var(--ink3)',
              borderBottom: resolvedTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s',
              flexShrink: 0,
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
      {/* Coverage (legacy) tab content — commented out per request.
      {resolvedTab === 'legacy' && (
        <LegacyMatrix
          displayClaims={displayClaims}
          potentialMatches={potentialMatches}
        />
      )}
      */}

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

        /* ── Defensive mobile overflow guards ── */
        .sec-hd { min-width: 0; max-width: 100%; box-sizing: border-box; }
        .sec-hd-left { min-width: 0; }
        .sec-hd-left > div:last-child { min-width: 0; overflow-wrap: anywhere; }
      `}</style>
    </div>
  );
};

export default ClaimsMatrix;
