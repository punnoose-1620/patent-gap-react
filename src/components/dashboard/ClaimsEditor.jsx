import { useState, useEffect } from 'react';
import { patentApi } from '../../api/patentApi';

// ── Shared style for the up/down/remove control buttons ──
const controlBtnStyle = (disabled) => ({
  background: 'var(--surf)', border: '1px solid var(--rule2)',
  borderRadius: 4, padding: '4px 5px', cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: disabled ? 'var(--rule2)' : 'var(--ink3)',
  transition: 'all 0.15s',
});

// ── Detect whether claims is v2 (object with numeric keys) ──
const isV2Claims = (claims) => {
  if (!claims || Array.isArray(claims)) return false;
  if (typeof claims !== 'object') return false;
  const keys = Object.keys(claims);
  return keys.length > 0 && keys.every(k => !isNaN(Number(k)));
};

// ── Extract sorted entries from v2 object ──
const getV2Entries = (claims) =>
  Object.entries(claims)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([idx, val]) => ({ idx: Number(idx), ...val }));

// ── Derive unique claim types for tab bar ──
const getClaimTypes = (entries) => {
  const seen = new Set();
  const types = [];
  entries.forEach(e => {
    const t = (e.claim_type || 'Other').trim();
    if (!seen.has(t)) { seen.add(t); types.push(t); }
  });
  return types;
};

// ────────────────────────────────────────────────────────────
// V2 — Paired-row read-only grid
// Renders BOTH columns' cells for the same claim as siblings in
// one CSS grid row, so the row height auto-stretches to whichever
// side is taller — the two sides can never drift out of sync.
// ────────────────────────────────────────────────────────────
const V2PairedGrid = ({ entries, onEdit }) => (
  <div>
    {/* ── Header row: labels, same 2-col grid as the rows below ── */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
      marginBottom: 14,
    }}>
      {['Original Claims', 'Market Language Claims'].map((label, i) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: i === 1 ? 'space-between' : 'flex-start',
        }}>
          <span style={{
            display: 'inline-block',
            border: '1.5px solid var(--rule2)',
            borderRadius: 6,
            padding: '4px 12px',
            fontFamily: "'Inconsolata', monospace",
            fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--ink2)',
            background: 'var(--bg)',
          }}>
            {label}
          </span>
          {i === 1 && onEdit && (
            <button
              onClick={onEdit}
              title="Edit claims"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, borderRadius: 5, color: 'var(--ink3)',
                display: 'flex', alignItems: 'center', transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink3)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>

    {/* ── Paired rows ──
        Grid auto-flow places children left-to-right, wrapping into a
        new row every 2 items. Each row's height auto-sizes to its
        tallest cell, so left/right always line up per-claim without
        any JS height measurement. ── */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0 24px',
    }}>
      {entries.flatMap((entry, i) => {
        const isLast = i === entries.length - 1;
        const cellStyle = {
          fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.65,
          padding: '10px 0',
          borderBottom: isLast ? 'none' : '1px solid var(--rule2)',
          margin: 0,
        };
        return [
          <p key={`${entry.idx}-doc`} style={cellStyle}>
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10,
              color: 'var(--ink3)', marginRight: 8,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {entry.idx + 1}.
            </span>
            {entry.documented_claim || <em style={{ color: 'var(--ink3)' }}>—</em>}
          </p>,
          <p key={`${entry.idx}-market`} style={cellStyle}>
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10,
              color: 'var(--ink3)', marginRight: 8,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {entry.idx + 1}.
            </span>
            {entry.market_language_claim || <em style={{ color: 'var(--ink3)' }}>—</em>}
          </p>,
        ];
      })}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// V2 — Paired-row edit grid
// Same row-per-claim structure as V2PairedGrid, but each cell is a
// textarea instead of a <p>. Grid auto-sizing keeps both textareas'
// rows visually aligned, and a single Save commits both fields
// together.
// ────────────────────────────────────────────────────────────
const V2EditPanel = ({ entries, onCancel, onSave, saving }) => {
  const [localEntries, setLocalEntries] = useState(entries.map(e => ({ ...e })));

  const update = (idx, field, value) =>
    setLocalEntries(prev => prev.map(e => e.idx === idx ? { ...e, [field]: value } : e));

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontFamily: "'Inconsolata', monospace", fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.10em',
        color: 'var(--ink3)', marginBottom: 12,
      }}>
        Editing claims
      </div>

      {/* ── Header labels, same 2-col grid as the rows below ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        marginBottom: 10,
      }}>
        {['Original Claims', 'Market Language Claims'].map(label => (
          <span key={label} style={{
            fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink3)',
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* ── Paired rows: doc textarea + market textarea per claim ──
          Emitted as flat siblings (not two nested loops) so grid
          auto-flow keeps them on the same row and the same height. */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px 12px', marginBottom: 12,
      }}>
        {localEntries.flatMap((entry) => {
          const rowStyle = {
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: 'var(--surf2)', borderRadius: 8,
            padding: '10px 12px', border: '1px solid var(--rule2)',
            boxSizing: 'border-box', height: '100%',
          };
          const badge = (
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 700,
              color: 'var(--accent)', background: 'var(--acc-soft)',
              borderRadius: 4, padding: '2px 6px', flexShrink: 0, marginTop: 2,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {entry.idx + 1}
            </span>
          );
          const taStyle = {
            flex: 1, boxSizing: 'border-box',
            padding: '6px 8px', fontSize: 13,
            fontFamily: 'inherit', lineHeight: 1.65,
            color: 'var(--ink)', background: 'var(--bg)',
            border: '1.5px solid var(--rule2)',
            borderRadius: 5, resize: 'vertical', outline: 'none',
            transition: 'border-color 0.15s',
            minHeight: '100%',
          };
          return [
            <div key={`${entry.idx}-doc`} style={rowStyle}>
              {badge}
              <textarea
                value={entry.documented_claim || ''}
                onChange={e => update(entry.idx, 'documented_claim', e.target.value)}
                rows={3}
                style={taStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--rule2)'}
              />
            </div>,
            <div key={`${entry.idx}-market`} style={rowStyle}>
              {badge}
              <textarea
                value={entry.market_language_claim || ''}
                onChange={e => update(entry.idx, 'market_language_claim', e.target.value)}
                rows={3}
                style={taStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--rule2)'}
              />
            </div>,
          ];
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => onSave(localEntries)}
          disabled={saving}
          className="btn-new"
          style={{ opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {saving ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save
            </>
          )}
        </button>
        <button onClick={onCancel} disabled={saving} className="btn-export"
          style={{ opacity: saving ? 0.5 : 1 }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// V2 renderer — tabs + paired grid
// ────────────────────────────────────────────────────────────
const ClaimsEditorV2 = ({ caseId, initialClaims, onSave }) => {
  const [claimsObj, setClaimsObj]       = useState(initialClaims);
  const [activeType, setActiveType]     = useState(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  useEffect(() => { setClaimsObj(initialClaims); }, [initialClaims]);

  const allEntries  = getV2Entries(claimsObj);
  const claimTypes  = getClaimTypes(allEntries);

  // Default to first tab
  const currentType = activeType || claimTypes[0] || null;

  const filteredEntries = currentType
    ? allEntries.filter(e => (e.claim_type || 'Other').trim() === currentType)
    : allEntries;

  const handleSave = async (updatedEntries) => {
    try {
      setSaving(true);
      setSaveError(null);
      // Merge edits back into claimsObj
      const next = { ...claimsObj };
      updatedEntries.forEach(entry => {
        next[entry.idx] = {
          ...next[entry.idx],
          documented_claim: entry.documented_claim,
          market_language_claim: entry.market_language_claim,
        };
      });
      await patentApi.updateCase(caseId, { claims: next });
      setClaimsObj(next);
      onSave(next);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 20,
        borderBottom: '1px solid var(--rule2)',
      }}>
        {claimTypes.map(type => (
          <button
            key={type}
            onClick={() => { setActiveType(type); setIsEditing(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: currentType === type ? 'var(--accent)' : 'var(--ink3)',
              borderBottom: currentType === type ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {/* colored dot per tab */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: currentType === type ? 'var(--accent)' : 'var(--rule2)',
              transition: 'background 0.15s',
            }} />
            {type}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, borderRadius: 99,
              background: currentType === type ? 'var(--acc-soft)' : 'var(--surf2)',
              color: currentType === type ? 'var(--accent)' : 'var(--ink3)',
              fontSize: 10, fontWeight: 700, padding: '0 5px',
              transition: 'background 0.15s, color 0.15s',
            }}>
              {allEntries.filter(e => (e.claim_type || 'Other').trim() === type).length}
            </span>
          </button>
        ))}
      </div>

      {saveError && (
        <p style={{
          fontSize: 12, color: 'var(--red)', margin: '0 0 14px',
          fontFamily: "'Inconsolata', monospace",
        }}>
          ✗ {saveError}
        </p>
      )}

      {/* ── Edit panel (replaces the paired grid when active) ── */}
      {isEditing ? (
        <V2EditPanel
          entries={filteredEntries}
          saving={saving}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      ) : (
        /* ── Paired read view ── */
        <V2PairedGrid
          entries={filteredEntries}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// V1 renderer — original list editor (unchanged)
// ────────────────────────────────────────────────────────────
const ClaimsEditorV1 = ({ caseId, initialClaims, onSave }) => {
  const [editing,   setEditing]   = useState(false);
  const [claims,    setClaims]    = useState(initialClaims || []);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { setClaims(initialClaims || []); }, [initialClaims]);

  const startEdit = () => { setEditing(true); setSaveError(null); };

  const cancel = () => {
    setClaims(initialClaims || []);
    setEditing(false);
    setSaveError(null);
  };

  const updateClaim = (index, value) =>
    setClaims(prev => prev.map((c, i) => i === index ? value : c));

  const addClaim = () => {
    setClaims(prev => [...prev, '']);
    setTimeout(() => {
      const textareas = document.querySelectorAll('.claim-textarea');
      textareas[textareas.length - 1]?.focus();
    }, 0);
  };

  const removeClaim = (index) =>
    setClaims(prev => prev.filter((_, i) => i !== index));

  const moveClaim = (index, direction) => {
    const next = [...claims];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setClaims(next);
  };

  const save = async () => {
    const trimmed = claims.map(c => c.trim()).filter(Boolean);
    if (!trimmed.length) { setSaveError('At least one claim is required.'); return; }
    const orig = (initialClaims || []).map(c => c.trim()).filter(Boolean);
    if (JSON.stringify(trimmed) === JSON.stringify(orig)) { setEditing(false); return; }
    try {
      setSaving(true);
      setSaveError(null);
      await patentApi.updateCase(caseId, { claims: trimmed });
      onSave(trimmed);
      setEditing(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save claims. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Read-only view ──
  if (!editing) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={startEdit}
          title="Edit claims"
          style={{
            position: 'absolute', top: 0, right: 0,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, borderRadius: 5, color: 'var(--ink3)',
            display: 'flex', alignItems: 'center', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink3)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 28 }}>
          {claims.map((claim, index) => {
            const parts        = claim.split('. ');
            const claimIndex   = parseInt(parts[0]);
            const claimContent = parts.slice(1).join('. ');
            const display      = !isNaN(claimIndex) && claimContent
              ? (claimIndex === 1 ? claimContent : `${claimIndex - 1}. ${claimContent}`)
              : claim;
            return (
              <p key={index} style={{
                fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.65,
                padding: '8px 0',
                borderBottom: index < claims.length - 1 ? '1px solid var(--rule2)' : 'none',
                margin: 0,
              }}>
                <span style={{
                  fontFamily: "'Inconsolata', monospace", fontSize: 10,
                  color: 'var(--ink3)', marginRight: 8,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {index + 1}.
                </span>
                {display}
              </p>
            );
          })}
          {claims.length === 0 && (
            <p style={{ fontSize: 13.5, color: 'var(--ink3)', margin: 0, fontStyle: 'italic' }}>
              No claims yet. Click edit to add claims.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Edit view ──
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {claims.map((claim, index) => (
          <div key={index} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: 'var(--surf2)', borderRadius: 8,
            padding: '10px 12px', border: '1px solid var(--rule2)',
          }}>
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 700,
              color: 'var(--accent)', background: 'var(--acc-soft)',
              borderRadius: 4, padding: '2px 6px', flexShrink: 0, marginTop: 2,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {index + 1}
            </span>
            <textarea
              className="claim-textarea"
              value={claim}
              onChange={e => updateClaim(index, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { cancel(); return; }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { save(); return; }
              }}
              rows={3}
              style={{
                flex: 1, boxSizing: 'border-box',
                padding: '6px 8px', fontSize: 13,
                fontFamily: 'inherit', lineHeight: 1.65,
                color: 'var(--ink)', background: 'var(--bg)',
                border: '1.5px solid var(--rule2)',
                borderRadius: 5, resize: 'vertical', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--rule2)'}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              <button onClick={() => moveClaim(index, -1)} disabled={index === 0}
                title="Move up" style={controlBtnStyle(index === 0)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </button>
              <button onClick={() => moveClaim(index, 1)} disabled={index === claims.length - 1}
                title="Move down" style={controlBtnStyle(index === claims.length - 1)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <button onClick={() => removeClaim(index)} title="Remove claim"
                style={{ ...controlBtnStyle(false), color: 'var(--red)', marginTop: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surf)'}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6"  y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addClaim} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: '1.5px dashed var(--rule2)',
        borderRadius: 8, padding: '8px 14px', width: '100%',
        justifyContent: 'center', cursor: 'pointer',
        fontFamily: "'Inconsolata', monospace", fontSize: 11,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--ink3)', marginBottom: 12, transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule2)';  e.currentTarget.style.color = 'var(--ink3)';  }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Claim
      </button>

      {saveError && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 10px',
          fontFamily: "'Inconsolata', monospace" }}>
          ✗ {saveError}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={saving} className="btn-new"
          style={{ opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saving ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save Claims
            </>
          )}
        </button>
        <button onClick={cancel} disabled={saving} className="btn-export"
          style={{ opacity: saving ? 0.5 : 1 }}>
          Cancel
        </button>
        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: 10,
          color: 'var(--ink3)', textTransform: 'uppercase',
          letterSpacing: '0.08em', marginLeft: 'auto',
        }}>
          ⌘↵ save · esc cancel
        </span>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Public export — auto-dispatches to v1 or v2
// ────────────────────────────────────────────────────────────
const ClaimsEditor = ({ caseId, initialClaims, onSave }) => {
  if (isV2Claims(initialClaims)) {
    return (
      <ClaimsEditorV2
        caseId={caseId}
        initialClaims={initialClaims}
        onSave={onSave}
      />
    );
  }
  return (
    <ClaimsEditorV1
      caseId={caseId}
      initialClaims={initialClaims}
      onSave={onSave}
    />
  );
};

export default ClaimsEditor;
