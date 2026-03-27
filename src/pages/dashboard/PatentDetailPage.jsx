// ===========================
// FILE: PatentDetailPage.jsx
// Fully responsive — mobile (320px+), tablet (768px+), desktop (1024px+)
// ===========================

import { Clock, ArrowLeft, FileText, Calendar, User, Tag, Download, Trash2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import InfringementModal from '../../components/dashboard/InfringementModal';
import DocumentModal from '../../components/dashboard/DocumentModal';    // ← NEW
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import { patentApi } from '../../api/patentApi';
import { deletePatent, updatePatent } from '../../store/slices/patentSlice';

const getStatusShorthand = (status) => {
  status = String(status || '');
  if (status.includes('Expired'))   return 'Expired';
  if (status.includes('Patented'))  return 'Patented';
  if (status.includes('Abandoned')) return 'Abandoned';
  if (status.includes('-')) return status.split('-')[0];
  if (status.includes('_')) return status.split('_')[0];
  return status;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';
  const diffInSeconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diffInSeconds < 60)     return 'Just now';
  if (diffInSeconds < 3600)   return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)  return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
};

const selectMainColor = (score) => {
  if (score >= 0.9) return '#B22222';
  if (score >= 0.7) return '#FFA500';
  return '#2E7D32';
};

const getRiskTerm = (score) => {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
};

const calculateOverallRisk = (similarClaims = []) => {
  if (!similarClaims?.length) return 'low';
  const avg = similarClaims.reduce((sum, c) => sum + c.similarity_score, 0) / similarClaims.length;
  return getRiskTerm(avg);
};

const calculateOverlapScore = (similarClaims = []) => {
  if (!similarClaims?.length) return 0;
  const avg = similarClaims.reduce((sum, c) => sum + c.similarity_score, 0) / similarClaims.length;
  return Math.round(avg * 100 * 100) / 100;
};

const getSourceName = (id = '') => {
  if (id.includes('uspto'))     return 'US Patent Office';
  if (id.includes('google'))    return 'Google';
  if (id.includes('espacenet')) return 'Espacenet';
  return 'Patent Gap';
};

// ─────────────────────────────────────────────────────────────
// Normalise a raw infringement object into a consistent shape
// regardless of whether it came from the patent or product format.
//
// Patent format  → has entry_id, entry_title, entry_url
// Product format → has product_id, product_name, product_url
// ─────────────────────────────────────────────────────────────
const normaliseMatch = (m) => {
  const isProduct = Boolean(m.product_id);

  if (isProduct) {
    return {
      type:          'product',
      title:         m.product_name  || 'Untitled Product',
      id:            m.product_id    || 'N/A',
      url:           m.product_url   || null,
      source:        m.source        || 'unknown',
      score:         calculateOverlapScore(m.similar_claims),
      badge:         calculateOverallRisk(m.similar_claims),
      riskLevel:     calculateOverallRisk(m.similar_claims),
      similarClaims: m.similar_claims || [],
      claims:        m.claims        || m.similar_claims?.map(c => c.claim) || [],
      company:       null,
      matchedClaims: null,
      _entryId:      m.product_id,
    };
  } else {
    return {
      type:          'patent',
      title:         m.entry_title   || m.title || 'Untitled',
      id:            m.entry_id      || m.patent || 'N/A',
      url:           m.entry_url     || null,
      source:        m.source        || 'unknown',
      score:         calculateOverlapScore(m.similar_claims),
      badge:         calculateOverallRisk(m.similar_claims),
      riskLevel:     calculateOverallRisk(m.similar_claims),
      similarClaims: m.similar_claims || [],
      claims:        m.similar_claims?.map(c => c.claim) || [],
      company:       m.company       || null,
      matchedClaims: m.similar_claims?.map(c => c.claim) || null,
      _entryId:      m.entry_id      || m.patent,
    };
  }
};

// ─────────────────────────────────────────────────────────────
// Derive a human-readable label for an in-progress analysis status
// ─────────────────────────────────────────────────────────────
const getAnalysisStatusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'pending')     return 'Analysis pending…';
  if (s === 'processing')  return 'Processing analysis…';
  if (s === 'running')     return 'Running infringement analysis…';
  if (s === 'queued')      return 'Analysis queued…';
  if (s === 'in_progress') return 'Analysis in progress…';
  return `Analysis status: ${status}`;
};

const StatusPill = ({ status }) => {
  const s   = String(status || '').toLowerCase();
  const cls = s === 'expired' ? 'expired' : s === 'abandoned' ? 'abandoned' : 'patented';
  return (
    <span className={`pd-badge ${cls}`}>
      <span className="pd-badge-dot" />
      {status || 'Patented'}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="pd-info-row">
    <div className="pd-info-label-wrap">
      <Icon size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />
      <span className="pd-info-label">{label}</span>
    </div>
    <span className="pd-info-value">{value}</span>
  </div>
);

// ─── Inline editable claims list ─────────────────────────────────────────────
const ClaimsEditor = ({ caseId, initialClaims, onSave }) => {
  const [editing,   setEditing]   = useState(false)
  const [claims,    setClaims]    = useState(initialClaims || [])
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => { setClaims(initialClaims || []) }, [initialClaims])

  const startEdit = () => { setEditing(true); setSaveError(null) }

  const cancel = () => {
    setClaims(initialClaims || [])
    setEditing(false)
    setSaveError(null)
  }

  const updateClaim = (index, value) => {
    setClaims(prev => prev.map((c, i) => i === index ? value : c))
  }

  const addClaim = () => {
    setClaims(prev => [...prev, ''])
    setTimeout(() => {
      const textareas = document.querySelectorAll('.claim-textarea')
      textareas[textareas.length - 1]?.focus()
    }, 0)
  }

  const removeClaim = (index) => {
    setClaims(prev => prev.filter((_, i) => i !== index))
  }

  const moveClaim = (index, direction) => {
    const next = [...claims]
    const swap = index + direction
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setClaims(next)
  }

  const save = async () => {
    const trimmed = claims.map(c => c.trim()).filter(Boolean)
    if (!trimmed.length) { setSaveError('At least one claim is required.'); return }

    const orig = (initialClaims || []).map(c => c.trim()).filter(Boolean)
    if (JSON.stringify(trimmed) === JSON.stringify(orig)) { setEditing(false); return }

    try {
      setSaving(true)
      setSaveError(null)
      await patentApi.updateCase(caseId, { claims: trimmed })
      onSave(trimmed)
      setEditing(false)
    } catch (err) {
      setSaveError(err?.message || 'Failed to save claims. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
            const parts        = claim.split('. ')
            const claimIndex   = parseInt(parts[0])
            const claimContent = parts.slice(1).join('. ')
            const display      = !isNaN(claimIndex) && claimContent
              ? (claimIndex === 1 ? claimContent : `${claimIndex - 1}. ${claimContent}`)
              : claim
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
            )
          })}
          {claims.length === 0 && (
            <p style={{ fontSize: 13.5, color: 'var(--ink3)', margin: 0, fontStyle: 'italic' }}>
              No claims yet. Click edit to add claims.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Edit view ──
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {claims.map((claim, index) => (
          <div key={index} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: 'var(--surf2)', borderRadius: 8,
            padding: '10px 12px',
            border: '1px solid var(--rule2)',
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
                if (e.key === 'Escape') { cancel(); return }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { save(); return }
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
              <button
                onClick={() => moveClaim(index, -1)}
                disabled={index === 0}
                title="Move up"
                style={controlBtnStyle(index === 0)}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </button>
              <button
                onClick={() => moveClaim(index, 1)}
                disabled={index === claims.length - 1}
                title="Move down"
                style={controlBtnStyle(index === claims.length - 1)}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <button
                onClick={() => removeClaim(index)}
                title="Remove claim"
                style={{ ...controlBtnStyle(false), color: 'var(--red)', marginTop: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surf)'}
              >
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

      <button
        onClick={addClaim}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: '1.5px dashed var(--rule2)',
          borderRadius: 8, padding: '8px 14px', width: '100%',
          justifyContent: 'center', cursor: 'pointer',
          fontFamily: "'Inconsolata', monospace", fontSize: 11,
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--ink3)', marginBottom: 12, transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--rule2)'
          e.currentTarget.style.color = 'var(--ink3)'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Claim
      </button>

      {saveError && (
        <p style={{
          fontSize: 12, color: 'var(--red)', margin: '0 0 10px',
          fontFamily: "'Inconsolata', monospace",
        }}>
          ✗ {saveError}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={save}
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
              Save Claims
            </>
          )}
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="btn-export"
          style={{ opacity: saving ? 0.5 : 1 }}
        >
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
  )
}

// ── Shared style for the up/down/remove control buttons ──
const controlBtnStyle = (disabled) => ({
  background: 'var(--surf)', border: '1px solid var(--rule2)',
  borderRadius: 4, padding: '4px 5px', cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: disabled ? 'var(--rule2)' : 'var(--ink3)',
  transition: 'all 0.15s',
})

// ─── Inline editable context/description ─────────────────────────────────────
const ContextEditor = ({ caseId, initialValue, onSave }) => {
  const [editing, setEditing]     = useState(false)
  const [value, setValue]         = useState(initialValue || '')
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState(null)
  const textareaRef               = useRef()

  useEffect(() => { setValue(initialValue || '') }, [initialValue])

  const startEdit = () => {
    setEditing(true)
    setSaveError(null)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = textareaRef.current.value.length
      }
    }, 0)
  }

  const cancel = () => {
    setValue(initialValue || '')
    setEditing(false)
    setSaveError(null)
  }

  const save = async () => {
    const trimmed = value.trim()
    if (!trimmed) { setSaveError('Description cannot be empty.'); return }
    if (trimmed === (initialValue || '').trim()) { setEditing(false); return }

    try {
      setSaving(true)
      setSaveError(null)
      await patentApi.updateCase(caseId, { context: trimmed })
      onSave(trimmed)
      setEditing(false)
    } catch (err) {
      setSaveError(err?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape')                           { cancel(); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { save();   return }
  }

  if (!editing) {
    return (
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, margin: 0, paddingRight: 32 }}>
          {value || 'No description available.'}
        </p>
        <button
          onClick={startEdit}
          title="Edit description"
          style={{
            position: 'absolute', top: 0, right: 0,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, borderRadius: 5, color: 'var(--ink3)',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
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
      </div>
    )
  }

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={6}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', fontSize: 13.5,
          fontFamily: 'inherit', lineHeight: 1.7,
          color: 'var(--ink)', background: 'var(--bg)',
          border: '1.5px solid var(--accent)',
          borderRadius: 6, resize: 'vertical',
          outline: 'none', marginBottom: 10,
          boxShadow: '0 0 0 3px var(--acc-soft)',
        }}
      />

      {saveError && (
        <p style={{
          fontSize: 12, color: 'var(--red)',
          marginBottom: 8, margin: '0 0 8px',
          fontFamily: "'Inconsolata', monospace",
        }}>
          ✗ {saveError}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={save}
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

        <button
          onClick={cancel}
          disabled={saving}
          className="btn-export"
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          Cancel
        </button>

        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: 10,
          color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em',
          marginLeft: 'auto',
        }}>
          ⌘↵ save · esc cancel
        </span>
      </div>
    </div>
  )
}

const SectionCard = ({ title, eyebrow, icon: Icon, children, actions }) => (
  <div style={{ marginBottom: 20 }}>
    <div className="sec-hd" style={{ marginBottom: 12 }}>
      <div className="sec-hd-left">
        <div className="sec-ico">
          {Icon && <Icon size={16} color="var(--accent)" strokeWidth={1.5} />}
        </div>
        <div>
          {eyebrow && (
            <div className="sec-eye">
              <div className="live-dot" />
              {eyebrow}
            </div>
          )}
          <div className="sec-title">{title}</div>
        </div>
      </div>
      {actions && <div className="sec-hd-right">{actions}</div>}
    </div>
    <div className="pd-card-body">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MatchCard — reused in both the "previous results" strip and
// the normal completed-results grid.
// ─────────────────────────────────────────────────────────────
const MatchCard = ({ match, updatedAt, onSelect }) => {
  const isHigh         = match.riskLevel === 'high';
  const isMedium       = match.riskLevel === 'medium';
  const matchCardClass = isHigh ? 'expired' : isMedium ? 'abandoned' : 'patented';
  const isProduct      = match.type === 'product';

  return (
    <div
      className={`pcard ${matchCardClass}`}
      onClick={() => {
        console.log(`🔍 Selected match [${match.type}]:`, match);
        onSelect(match);
      }}
    >
      <div className="pcard-top">
        <span className={`pcard-badge ${matchCardClass}`}>
          <span className="pcard-dot" />
          {typeof match.badge === 'string' ? match.badge.charAt(0).toUpperCase() + match.badge.slice(1) : match.badge} Risk
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pd-type-pill" data-type={isProduct ? 'product' : 'patent'}>
            {isProduct ? '🛒 Product' : '📄 Patent'}
          </span>
          <button
            className="card-ext"
            aria-label="Open"
            onClick={e => {
              e.stopPropagation();
              console.log(`🔍 Selected match [${match.type}]:`, match);
              onSelect(match);
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="pcard-title">{match.title}</div>

      <div className="pcard-num">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
        {isProduct ? `Product: ${match.id}` : `Patent: ${match.id}`}
      </div>

      {match.company && (
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>
          Company: {match.company}
        </div>
      )}

      {isProduct && match.claims?.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8, fontStyle: 'italic' }}>
          "{match.claims[0].slice(0, 80)}…"
        </div>
      )}

      <div className="pcard-progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)' }}>Overlap Score</span>
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 14, fontWeight: 700, color: isHigh ? 'var(--red)' : isMedium ? 'var(--amber)' : 'var(--accent)' }}>{match.score}%</span>
        </div>
        <div className="prog-track">
          <div className={`prog-fill ${isHigh ? 'red' : isMedium ? 'grey' : 'green'}`} style={{ width: `${match.score}%` }} />
        </div>
        {match.matchedClaims && (
          <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 5, fontFamily: "'Inconsolata', monospace" }}>
            Claims: {match.matchedClaims.join(', ')}
          </div>
        )}
      </div>

      <div className="pcard-foot">
        <div className="pcard-time">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {updatedAt}
        </div>
        <div className="pcard-live">
          <div className="live-bars"><span /><span /><span /><span /></div>
          Live
        </div>
      </div>
    </div>
  );
};

const PatentDetailPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();

  const caseIdFromUrl = searchParams.get('id');
  const projectData   = location.state || {};
  const caseId        = caseIdFromUrl || projectData.id;

  const [caseData,        setCaseData]        = useState(null);
  const [pageLoading,     setPageLoading]     = useState(true);
  const [pageError,       setPageError]       = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStatus,  setAnalysisStatus]  = useState('idle');
  const [selectedMatch,   setSelectedMatch]   = useState(null);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [activeItem,      setActiveItem]      = useState('projects');
  // ── CHANGED: replaced loadingDocIndex with docModalIndex ──────────────── //
  const [docModalIndex,   setDocModalIndex]   = useState(null); // null = closed

  // ── Ref for the background polling interval ──
  const pollIntervalRef = useRef(null);

  const title          = caseData?.title    || projectData.title        || 'Untitled Case';
  const patentNumber   = caseData?.patentId || projectData.patentNumber || caseData?._id?.split('_')[1] || 'N/A';
  const status         = getStatusShorthand(caseData?.status || projectData.status || 'draft');
  const updatedAt      = caseData ? formatTimeAgo(caseData.updated_date || caseData.created_date) : (projectData.updatedAt || '—');
  const inventors      = caseData?.inventors?.join(', ') || projectData.inventors || 'Not specified';
  const filedDate      = formatDate(caseData?.filing_date || caseData?.filedAt) || projectData.filedDate || '—';
  const keywords       = caseData?.keywords?.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ') || projectData.keywords || 'No keywords available';
  const description    = caseData?.context || caseData?.description || projectData.description || 'No description available';
  const matchesCount   = caseData?.infringements?.length ?? projectData.matchesCount ?? 0;
  const documentsCount = caseData?.documents?.length || projectData.documentsCount || 1;
  const isProcessing   = (caseData?.status || '').toLowerCase().includes('processing');
  const claimsChart    = caseData?.claimsChart || {};
  //const infringementAnalysisStatus = caseData?.infringementAnalysisStatus || 'unknown';
  const infringementAnalysisStatus = caseData?.infringement_analysis_status || 'unknown';

  const displayClaims = caseData?.claims || [];

  const realMatches = caseData?.infringements || [];
  console.log('📋 Raw infringements from API:', realMatches);

  const potentialMatches = realMatches.length > 0
    ? realMatches.map(m => {
        const normalised = normaliseMatch(m);
        console.log(`🔍 [${normalised.type.toUpperCase()}] Normalised match:`, normalised);
        return normalised;
      })
    : [];

  /*const iaStatus      = String(infringementAnalysisStatus || '').toLowerCase();
  const iaIsCompleted = iaStatus === 'completed';
  const iaIsUnknown   = iaStatus === 'unknown' || iaStatus === 'none' || iaStatus === '';
  const iaIsInFlight  = !iaIsCompleted && !iaIsUnknown;

  const shouldShowMatches =
    (iaIsCompleted && realMatches.length > 0) ||
    (iaIsUnknown   && realMatches.length > 0);

  const shouldShowEmpty =
    (iaIsCompleted && realMatches.length === 0) ||
    (iaIsUnknown   && realMatches.length === 0);*/
    // ✅ REPLACE with this — simple, always shows matches if they exist
    const shouldShowMatches = realMatches.length > 0;
    const shouldShowEmpty   = !analysisLoading && realMatches.length === 0;
    // iaIsInFlight is only used for the polling — keep it for that
    const iaStatus     = String(infringementAnalysisStatus || '').toLowerCase();
    const iaIsCompleted = iaStatus === 'completed';
    const iaIsUnknown  = iaStatus === 'unknown' || iaStatus === 'none' || iaStatus === '';
    const iaIsInFlight = !iaIsCompleted && !iaIsUnknown;

  const loadCase = useCallback(async () => {
    const c = await patentApi.getCaseById(caseId);
    try {
      const chart = await patentApi.getInfringementChart(caseId);
      if (chart && Object.keys(chart).length > 0) c.claimsChart = chart;
    } catch (e) { console.warn('Claims chart unavailable', e); }
    return c;
  }, [caseId]);

  const fetchCaseDetails = useCallback(async () => {
    if (!caseId) { setPageLoading(false); return; }
    try {
      setPageLoading(true);
      const c = await loadCase();
      setCaseData(c);

        console.log('🗂️ FULL caseData:', JSON.stringify(c, null, 2));


      console.log('🗂️ caseData keys:', Object.keys(c));
      console.log('🗂️ caseData.claims:', c?.claims);
      console.log('🗂️ caseData.infringements:', c?.infringements);
      console.log('🗂️ caseData.documents:', c?.documents);
      console.log('🗂️ caseData.infringementAnalysisStatus:', c?.infringement_analysis_status);
      console.log('🗂️ FULL caseData:', JSON.stringify(c, null, 2));


      // ✅ Add these specific ones for infringement analysis
    console.log('🔍 status:', c?.status);
    console.log('🔍 infringementAnalysisStatus:', c?.infringement_analysis_status);
    console.log('🔍 infringements count:', c?.infringements?.length);
    console.log('🔍 infringements sample:', c?.infringements?.[0]);



    } catch (err) {
      console.error('Error fetching case details:', err);
      setPageError(err?.message || 'Failed to load case');
    } finally {
      setPageLoading(false);
    }
  }, [caseId, loadCase]);

  const pollCaseDetails = useCallback(async () => {
    if (!caseId) return;
    try {
      const c = await loadCase();
      console.log('🔄 Poll — infringementAnalysisStatus:', c?.infringement_analysis_status);
      setCaseData(c);

      const polledStatus = String(c?.infringement_analysis_status || '').toLowerCase();
      if (polledStatus === 'completed') {
        console.log('✅ Poll: analysis completed — stopping interval');
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    } catch (err) {
      console.warn('Poll error (non-fatal):', err?.message);
    }
  }, [caseId, loadCase]);

 // ✅ Replace the polling useEffect
useEffect(() => {
  // Only poll when USER triggered analysis, not on page load
  const shouldPoll = analysisLoading;   // ← removed iaIsInFlight

  if (shouldPoll && !pollIntervalRef.current) {
    pollIntervalRef.current = setInterval(pollCaseDetails, 15 * 1000); // 15s not 2min
  }

  if (!shouldPoll && pollIntervalRef.current) {
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = null;
  }

  return () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };
}, [analysisLoading, pollCaseDetails]);  // ← removed iaIsInFlight

  useEffect(() => { fetchCaseDetails(); }, [fetchCaseDetails]);

  const beginSimilarityAnalysis = async () => {
    const keywords = caseData?.keywords       || [];
    const urls     = caseData?.documents?.map(d => d.url) || [];
    const context  = caseData?.context        || caseData?.description || '';
    const country  = caseData?.countries?.[0] || 'US';
    const claims   = (caseData?.claims?.length > 0) ? caseData.claims : ['No claims available'];
    const owners   = caseData?.inventors || caseData?.companies || [];

    console.log('🔍 Analysis payload:', { keywords, document_urls: urls, context, country, claims, owners });

    if (!keywords?.length || !urls?.length) {
      alert('Cannot run analysis: missing keywords or documents.');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisStatus('infringement');

    try {
      const analysisData  = await patentApi.getInfringementAnalysis(
        caseId, keywords, urls, context, country, claims, owners
      );

      // ── ADD THIS GUARD ──
      if (!analysisData) {
        console.error('❌ getInfringementAnalysis returned undefined/null');
        alert('Analysis returned no data. Please check the API.');
        return;
      }

      console.log('✅ Raw analysisData:', JSON.stringify(analysisData, null, 2));
      // ── END GUARD ──


      const infringements = analysisData.similar_infringements || [];
      const newClaims     = analysisData.claims || [];

      await patentApi.updateCase(caseId, { infringements, claims: newClaims });

      let claimsChart = {};
      if (newClaims.length > 0) {
        try {
          claimsChart = await patentApi.getInfringementChart(caseId) || {};
        } catch (e) { console.warn('Claims chart unavailable', e); }
      }

      setCaseData(prev => ({ ...prev, infringements, claims: newClaims, claimsChart }));
      dispatch(updatePatent({ _id: caseId, infringements, claims: newClaims }));

    } catch (err) {
      console.error('Analysis failed:', err);

      if (err?.response) {
        console.error('❌ Response error:', {
          status:     err.response.status,
          statusText: err.response.statusText,
          data:       err.response.data,
          headers:    err.response.headers,
        });
      } else if (err?.request) {
        console.error('📡 No response received:', {
          message:     err.message,
          code:        err.code,
          url:         err.config?.url,
          method:      err.config?.method,
          baseURL:     err.config?.baseURL,
          timeout:     err.config?.timeout,
          requestData: err.config?.data,
        });
      } else {
        console.error('⚙️ Request setup error:', err.message);
      }

      const msg         = err?.response?.data?.message || err?.message || 'Unknown error';
      const isRateLimit = msg.toLowerCase().includes('rate') || msg.includes('429');
      alert(isRateLimit ? 'Rate limit hit, please wait.' : `Analysis failed: ${msg}`);
    } finally {
      setAnalysisLoading(false);
      setAnalysisStatus('idle');
    }
  };

  const exportCase = () => alert(`Exporting case for ${title}`);

  const deleteCase = async () => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) return;
    try {
      await patentApi.deleteCase(caseId);
      dispatch(deletePatent(caseId));
      navigate('/dashboard');
    } catch (err) { alert(`Error: ${err?.message}`); }
  };

  // ── CHANGED: just sets the modal index — no blob fetch ────────────────── //
  const openDocument = (index) => {
    setDocModalIndex(index);
  };

  if (pageLoading) {
    return (
      <div className="dash-shell">
        <DashboardSidebar activeItem={activeItem} onItemClick={setActiveItem} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dash-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--rule2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Loading case details...</p>
            </div>
          </div>
        </main>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (pageError && !projectData.title) {
    return (
      <div className="dash-shell">
        <DashboardSidebar activeItem={activeItem} onItemClick={setActiveItem} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dash-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: '0 20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>No Patent Data Found</h2>
            <p style={{ color: 'var(--ink3)', fontSize: 14 }}>Please select a patent from the dashboard.</p>
            <button className="btn-new" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          </div>
        </main>
      </div>
    );
  }

  const sLower      = String(status).toLowerCase();
  const fillClass   = sLower === 'expired' ? 'red' : sLower === 'abandoned' ? 'grey' : 'green';
  const dotColor    = sLower === 'expired' ? 'var(--red)' : sLower === 'abandoned' ? 'var(--ink3)' : 'var(--accent)';
  const progressPct = Math.min(100, Math.max(0, projectData.progress || caseData?.progress || 0));
  const filledDots  = Math.round((progressPct / 100) * 5);

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
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="tn-title">Patent Gap AI</span>
            <div className="tn-sep pd-tn-sep" />
            <span className="tn-sub pd-tn-sub">Patent Detail</span>
          </div>

          <div className="tn-right">
            <button className="tn-icon" aria-label="Notifications">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="tn-vsep" />
            <Link to="/dashboard" className="tn-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="pd-tn-label">Dashboard</span>
            </Link>
            <button className="tn-btn" onClick={() => logout()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="pd-tn-label">Log out</span>
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="dash-content">

          {/* ── Page Header ── */}
          <div className="page-hd pd-page-hd">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="page-eyebrow">Patent Detail</div>
              <h1 className="page-title pd-page-title">
                <em>{title}</em>
              </h1>
            </div>
            <div className="hd-actions pd-hd-actions">
              <button className="tn-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <button className="btn-export" onClick={exportCase}>
                <Download size={14} />
                <span className="pd-btn-label">Export</span>
              </button>
              <button
                className="btn-new"
                onClick={beginSimilarityAnalysis}
                disabled={analysisLoading}
                style={{ opacity: analysisLoading ? 0.7 : 1 }}
              >
                {analysisLoading ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span className="pd-btn-label">
                      {analysisStatus === 'claims' ? 'Isolating…' : 'Matching…'}
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span className="pd-btn-label">Run Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Hero patent card ── */}
          <div
            className={`pcard ${sLower === 'expired' ? 'expired' : sLower === 'abandoned' ? 'abandoned' : 'patented'}`}
            style={{ marginBottom: 20, cursor: 'default' }}
          >
            <div className="pcard-top">
              <StatusPill status={status} />
              <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: 'var(--ink3)' }}>
                {getSourceName(caseData?._id || '')}
              </span>
            </div>
            <div className="pcard-title" style={{ fontSize: 13, textTransform: 'none', letterSpacing: 0 }}>{title}</div>
            <div className="pd-chips">
              <div className="pcard-num">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                {patentNumber}
              </div>
              <div className="pcard-num">
                <Clock size={9} />
                {updatedAt}
              </div>
              {matchesCount > 0 && (
                <div className="pcard-num" style={{ color: 'var(--amber)', background: 'var(--amber-soft)' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  </svg>
                  {matchesCount} match{matchesCount !== 1 ? 'es' : ''}
                </div>
              )}
            </div>
            {/*<div className="pcard-progress">
              <div className="prog-track">
                <div className={`prog-fill ${fillClass}`} style={{ width: `${progressPct}%` }} />
              </div>
              <div className="prog-dots" style={{ color: dotColor }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="pdot" style={{ opacity: i < filledDots ? 0.35 : 0.1 }} />
                ))}
              </div>
            </div>
            <div className="pcard-foot">
              <div className="pcard-time">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {updatedAt}
              </div>
              <div className="pcard-live">
                <div className="live-bars"><span /><span /><span /><span /></div>
                Live
              </div>
            </div>*/}
          </div>

          {/* ── Processing progress ── */}
          {isProcessing && caseData?.progress !== undefined && (
            <div className="pd-card-body" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)' }}>Analysis Progress</span>
                <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{caseData.progress}%</span>
              </div>
              <div className="prog-track" style={{ height: 6 }}>
                <div className="prog-fill green" style={{ width: `${caseData.progress}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* ── Two-column info grid ── */}
          <div className="pd-two-col">
            <SectionCard title="Case Information" eyebrow="Patent Data" icon={FileText}>
              <InfoRow icon={Calendar} label="Created"      value={formatDate(caseData?.created_date || caseData?.createdAt) || updatedAt} />
              <InfoRow icon={FileText} label="Filed"        value={filedDate} />
              <InfoRow icon={Clock}    label="Last Updated" value={updatedAt} />
              <InfoRow icon={User}     label="Inventors"    value={inventors} />
              <InfoRow icon={Tag}      label="Keywords"     value={keywords} />
            </SectionCard>

            {/* Context & Description — editable */}
            <SectionCard title="Context & Description" eyebrow="Overview" icon={FileText}>
              <ContextEditor
                caseId={caseId}
                initialValue={description}
                onSave={(newDesc) => setCaseData(prev => ({ ...prev, context: newDesc }))}
              />

              {(caseData?.companies?.length > 0 || caseData?.countries?.length > 0 || caseData?.terms?.length > 0) && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule2)' }}>
                  <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: 10 }}>Search Strategy</div>
                  {caseData.companies?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 5 }}>Target Companies</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {caseData.companies.map((c, i) => <span key={i} className="pcard-num" style={{ margin: 0 }}>{c}</span>)}
                      </div>
                    </div>
                  )}
                  {caseData.terms?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 5 }}>Search Terms</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {caseData.terms.map((t, i) => <span key={i} className="pcard-num" style={{ margin: 0 }}>{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Documents ── */}
          <SectionCard
            title="Documents"
            eyebrow="Files"
            icon={FileText}
            actions={
              <span className="pcard-num" style={{ margin: 0, color: 'var(--accent)' }}>
                {documentsCount} doc{documentsCount !== 1 ? 's' : ''}
              </span>
            }
          >
            <div className="pd-docs-grid">
              {caseData?.documents?.length > 0
                ? caseData.documents.map((doc, i) => {
                    // ── Thumbnail visuals are 100% unchanged ──────────────── //
                    const url            = doc.url || '';
                    const ext            = url.split('.').pop();
                    const src            = doc.source || '';
                    const bgImg          = src === 'uspto' ? 'uspto.jpg' : 'local.png';
                    return (
                      <div key={i} onClick={() => openDocument(i)} className="pd-doc-thumb">
                        <div
                          className="pd-doc-inner"
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* original image — untouched */}
                          <img src={`/images/${bgImg}`} alt={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div className="pd-doc-blur" />
                          <div className="pd-doc-label">{i + 1}.{ext}</div>
                        </div>
                      </div>
                    );
                  })
                : Array.from({ length: documentsCount }, (_, i) => (
                    <div key={i} className="pd-doc-thumb">
                      <div className="pd-doc-inner pd-doc-placeholder">
                        <FileText size={28} color="var(--accent)" strokeWidth={1.5} />
                        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>{i + 1}.xml</span>
                      </div>
                    </div>
                  ))
              }
            </div>
          </SectionCard>

          {/* ── Claims — only shown when real claims exist from the API ── */}
          {displayClaims.length > 0 && (
           <SectionCard title="Claims for Analysis" eyebrow="Patent Claims" icon={FileText}>
            <ClaimsEditor
              caseId={caseId}
              initialClaims={displayClaims}
              onSave={(newClaims) => setCaseData(prev => ({ ...prev, claims: newClaims }))}
            />
          </SectionCard>
          )}

          {/* ── Claims Chart — only shown when chart data exists ── */}
          {Object.keys(claimsChart).length > 0 && (
            <SectionCard title="Claims Chart" eyebrow="Analysis" icon={FileText}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(claimsChart).map(([key, items]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 600, color: 'var(--ink2)', minWidth: 64 }}>Claim {key}</span>
                    {(items || []).map((item, idx) => (
                      <div key={idx} style={{ border: `1.5px solid ${selectMainColor(item.similarity_score)}`, borderRadius: 5, padding: '2px 8px', color: selectMainColor(item.similarity_score), fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 600 }}>
                        {item.entry_id}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── Potential Matches ── */}
          <div style={{ marginBottom: 20 }}>
            <div className="sec-hd" style={{ marginBottom: 12 }}>
              <div className="sec-hd-left">
                <div className="sec-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div className="sec-eye"><div className="live-dot" />Infringement Analysis</div>
                  <div className="sec-title">Potential Matches</div>
                </div>
              </div>
              <div className="sec-hd-right">
                <button className="btn-refresh" onClick={beginSimilarityAnalysis} title="Re-run analysis">
                  <RefreshCw size={13} style={{ animation: analysisLoading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                <span className="pcard-num" style={{ margin: 0, color: matchesCount > 0 ? 'var(--amber)' : 'var(--accent)', background: matchesCount > 0 ? 'var(--amber-soft)' : 'var(--acc-soft)' }}>
                  {matchesCount} match{matchesCount !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>

           
                  {/* ── CASE 1: user clicked Run Analysis ── */}
      {analysisLoading && (
        <div className="pd-card-body" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--rule2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '0 0 4px' }}>
            {analysisStatus === 'claims' ? 'Isolating Claims…' : 'Finding Infringements…'}
          </p>
        </div>
      )}

      {/* ✅ REMOVE CASE 2 entirely — delete this whole block */}
      {/* {!analysisLoading && iaIsInFlight && ( ... )} */}

      {/* ── CASE 3: no matches, not loading ── */}
      {shouldShowEmpty && (
        <div className="pd-card-body pd-no-matches">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <p style={{ fontSize: 13.5, color: 'var(--ink2)', margin: 0 }}>No potential infringement matches found.</p>
          </div>
          <button className="btn-new" onClick={beginSimilarityAnalysis}>Start Analysis</button>
        </div>
      )}

      {/* ── CASE 4: show matches — always, regardless of analysis status ── */}
      {shouldShowMatches && (
        <div className="cards-grid">
          {potentialMatches.map((match, index) => (
            <MatchCard
              key={index}
              match={match}
              updatedAt={updatedAt}
              onSelect={setSelectedMatch}
            />
          ))}
        </div>
      )}

            <div className="pd-action-btns">
              <button className="btn-export" onClick={exportCase}>
                <Download size={14} /> Export Case
              </button>
              <button
                className="btn-export"
                onClick={deleteCase}
                style={{ color: 'var(--red)', borderColor: 'rgba(185,28,28,0.22)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <Trash2 size={14} /> Delete Case
              </button>
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        /* ── Type pill ── */
        .pd-type-pill {
          font-family: 'Inconsolata', monospace;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--surf2);
          color: var(--ink3);
        }
        .pd-type-pill[data-type="product"] {
          background: var(--amber-soft);
          color: var(--amber, #b45309);
        }
        .pd-type-pill[data-type="patent"] {
          background: var(--acc-soft);
          color: var(--accent);
        }

        /* ── Badges ── */
        .pd-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inconsolata', monospace; font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.10em; padding: 4px 9px; border-radius: 5px;
        }
        .pd-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .pd-badge.patented  { background: rgba(46,125,50,0.10); color: #1b5e20; }
        .pd-badge.abandoned { background: var(--acc-soft);  color: var(--accent); }
        .pd-badge.expired   { background: var(--red-soft);  color: var(--red); }

        /* ── Shared card body ── */
        .pd-card-body {
          background: var(--surf);
          border-radius: var(--radius);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: var(--shadow-sm);
          padding: 20px 24px;
        }

        /* ── Info row ── */
        .pd-info-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid var(--rule2);
        }
        .pd-info-label-wrap {
          display: flex; align-items: center; gap: 7px;
          width: 130px; flex-shrink: 0;
        }
        .pd-info-label {
          font-family: 'Inconsolata', monospace; font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.10em; color: var(--ink3);
        }
        .pd-info-value {
          font-size: 13.5px; color: var(--ink); line-height: 1.55; word-break: break-word;
        }

        /* ── Chips ── */
        .pd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

        /* ── Page header ── */
        .pd-page-hd { align-items: flex-start !important; flex-wrap: wrap; gap: 12px; }
        .pd-page-title { word-break: break-word; }
        .pd-hd-actions { flex-shrink: 0; }

        /* ── Two-column grid ── */
        .pd-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px; margin-bottom: 20px;
        }

        /* ── Docs ── */
        .pd-docs-grid { display: flex; flex-wrap: wrap; gap: 14px; }
        .pd-doc-thumb { cursor: pointer; }
        .pd-doc-inner {
          position: relative; width: 8rem; height: 10.5rem;
          border: 2px solid var(--surf2); border-radius: 10px;
          overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.2s;
        }
        .pd-doc-blur {
          position: absolute; inset: 0;
          backdrop-filter: blur(3px); background: rgba(250,250,247,0.3); z-index: 1;
        }
        .pd-doc-label {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Inconsolata', monospace; font-weight: 600; font-size: 1.1rem;
          color: var(--ink); z-index: 2;
        }
        .pd-doc-placeholder {
          background: linear-gradient(135deg, var(--acc-soft), var(--surf2));
          border-color: var(--acc-border);
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 8px;
        }
        .pd-doc-placeholder .pd-doc-label { position: static; font-size: 13px; }

        /* ── No-matches ── */
        .pd-no-matches {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }

        /* ── In-flight analysis status loader ── */
        .pd-ia-status-loader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 24px !important;
        }
        .pd-ia-spinner-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pd-ia-status-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 3px;
        }
        .pd-ia-status-sub {
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          color: var(--ink3);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .pd-ia-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          padding: 4px 10px;
          border-radius: 5px;
          background: var(--amber-soft, rgba(251,191,36,0.12));
          color: var(--amber, #b45309);
          flex-shrink: 0;
        }
        .pd-ia-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--amber, #b45309);
          animation: ia-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ia-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            align-items: start;  /* ← ADD THIS */
          }

        /* ── Action buttons ── */
        .pd-action-btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }

        /* ══════════════════════════════
           TABLET  ≤ 900px
        ══════════════════════════════ */
        @media (max-width: 900px) {
          .pd-two-col { grid-template-columns: 1fr; }
          .pd-tn-sep, .pd-tn-sub { display: none; }
        }

        /* ══════════════════════════════
           MOBILE  ≤ 640px
        ══════════════════════════════ */
        @media (max-width: 640px) {
          .dash-content { padding: 14px 14px 32px !important; }
          .pd-page-hd { flex-direction: column !important; align-items: stretch !important; }
          .pd-hd-actions { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
          .pd-hd-actions > * { flex: 1; justify-content: center; min-width: 80px; }
          .pd-card-body { padding: 14px 16px; }
          .pd-info-row { flex-direction: column; gap: 4px; }
          .pd-info-label-wrap { width: auto; }
          .pd-doc-inner { width: 6.5rem; height: 8.5rem; }
          
          .cards-grid { grid-template-columns: 1fr !important; }
          .pd-action-btns { flex-direction: column; }
          .pd-action-btns .btn-export { width: 100%; justify-content: center; }
          .pd-tn-label { display: none; }
          .tn-title { font-size: 13px; }
          .pd-tn-center { display: none; }
          .pd-ia-status-loader { flex-direction: column; align-items: flex-start; }
        }

        /* ══════════════════════════════
           VERY SMALL  ≤ 380px
        ══════════════════════════════ */
        @media (max-width: 380px) {
          .dash-content { padding: 10px 10px 24px !important; }
          .pd-doc-inner { width: 5.5rem; height: 7rem; }
          .page-title { font-size: clamp(15px, 5vw, 24px) !important; }
        }
      `}</style>

      {/* ── Infringement match modal (unchanged) ── */}
      {selectedMatch && (
        <InfringementModal
          match={selectedMatch}
          patentTitle={title}
          patentNumber={patentNumber}
          caseId={caseId}
          infringementId={selectedMatch._entryId || null}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* ── Document modal — mounts when a thumbnail is clicked ── */}
      {docModalIndex !== null && caseData?.documents?.[docModalIndex] && (
        <DocumentModal
          document={caseData.documents[docModalIndex]}
          index={docModalIndex}
          total={caseData.documents.length}
          onClose={() => setDocModalIndex(null)}
          onNext={() => setDocModalIndex(i => Math.min(i + 1, caseData.documents.length - 1))}
          onPrev={() => setDocModalIndex(i => Math.max(i - 1, 0))}
          fetchBlob={patentApi.proxyDocument}
        />
      )}

    </div>
  );
};

export default PatentDetailPage;
