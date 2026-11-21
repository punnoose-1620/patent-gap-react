import { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { patentApi } from '../../api/patentApi';


// ── Small inline tooltip, shown right next to the row label. ──
const LabelTooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef(null);

  const supportsHover = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(hover: hover)').matches;

  if (!text) return null;

  useEffect(() => {
    if (!visible) return;
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setVisible(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [visible]);

  const hoverHandlers = supportsHover
    ? {
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
      }
    : {
        onClick: (e) => {
          e.stopPropagation();
          setVisible(v => !v);
        },
      };

  return (
    <span
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      {...hoverHandlers}
    >
      <Info size={13} color="var(--accent)" style={{ cursor: 'help', flexShrink: 0, opacity: 0.85 }} />
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 11.5,
            lineHeight: 1.4,
            padding: '7px 10px',
            borderRadius: 6,
            whiteSpace: 'normal',
            width: 220,
            maxWidth: '60vw',
            textAlign: 'left',
            zIndex: 20,
            boxShadow: '0 4px 14px rgba(46,125,50,0.28)',
            fontFamily: "'Inconsolata', monospace",
            letterSpacing: '0.01em',
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid var(--accent)',
            }}
          />
        </span>
      )}
    </span>
  );
};
// ── Normalize whatever shape `keywords` comes in as (array or
// comma-string) into a clean array of trimmed, non-empty strings. ──
const toArray = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Editable "Keywords" info row — same read/edit toggle pattern as
 * EditableInventorsRow / EditableTitleRow, but for a comma-separated
 * list of keywords instead of a single string.
 *
 * Props:
 *  - caseId: patent case id, forwarded to patentApi.updateCase
 *  - initialValue: raw keywords value from caseData (array or string)
 *  - onSave(newKeywordsArray): called after a successful save so the
 *    parent can update its local caseData state
 *  - icon: optional lucide icon component to render next to the label
 *  - label: row label text (defaults to "Keywords")
 */
const EditableKeywordsRow = ({ caseId, initialValue, onSave, icon: Icon, label = 'Keywords', tooltip }) => {
  const [editing, setEditing]     = useState(false);
  const [keywords, setKeywords]   = useState(toArray(initialValue));
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { setKeywords(toArray(initialValue)); }, [initialValue]);

  const startEdit = () => {
    setInputValue(keywords.join(', '));
    setEditing(true);
    setSaveError(null);
  };

  const cancel = () => {
    setKeywords(toArray(initialValue));
    setEditing(false);
    setSaveError(null);
  };

  const save = async () => {
    const trimmed = inputValue.split(',').map(k => k.trim()).filter(Boolean);
    const deduped = [...new Set(trimmed)];

    const orig = toArray(initialValue);
    if (JSON.stringify(deduped) === JSON.stringify(orig)) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      await patentApi.updateCase(caseId, { keywords: deduped });
      setKeywords(deduped);
      onSave(deduped);
      setEditing(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save keywords. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayValue = keywords.length
    ? keywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')
    : 'No keywords available';

  // ── Read-only view ──
  if (!editing) {
    return (
      <div className="pd-info-row" style={{ position: 'relative' }}>
                <div className="pd-info-label-wrap">
          {Icon && <Icon size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />}
          <span className="pd-info-label">{label}</span>
          <LabelTooltip text={tooltip} />
        </div>
        <span className="pd-info-value" style={{ flex: 1 }}>{displayValue}</span>
        <button
          onClick={startEdit}
          title={`Edit ${label}`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, borderRadius: 5, color: 'var(--ink3)',
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink3)'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    );
  }

  // ── Edit view ──
  const livePreview = inputValue.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="pd-info-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
       <div className="pd-info-label-wrap">
        {Icon && <Icon size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />}
        <span className="pd-info-label">{label}</span>
        <LabelTooltip text={tooltip} />
      </div>

      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') { cancel(); return; }
          if (e.key === 'Enter') { e.preventDefault(); save(); return; }
        }}
        placeholder="Comma-separated keywords (e.g. funnel, blower, partition)"
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '7px 10px', fontSize: 13,
          fontFamily: 'inherit', color: 'var(--ink)',
          background: 'var(--surf2)', border: '1.5px solid var(--rule2)',
          borderRadius: 6, outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e  => e.target.style.borderColor = 'var(--rule2)'}
        autoFocus
      />

      {livePreview.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {livePreview.map((k, i) => (
            <span key={i} className="pcard-num" style={{ margin: 0 }}>{k}</span>
          ))}
        </div>
      )}

      {saveError && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: 0, fontFamily: "'Inconsolata', monospace" }}>
          ✗ {saveError}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={saving} className="btn-new"
          style={{ opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 11 }}>
          {saving ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save
            </>
          )}
        </button>
        <button onClick={cancel} disabled={saving} className="btn-export"
          style={{ opacity: saving ? 0.5 : 1, padding: '5px 12px', fontSize: 11 }}>
          Cancel
        </button>
        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: 10,
          color: 'var(--ink3)', textTransform: 'uppercase',
          letterSpacing: '0.08em', marginLeft: 'auto',
        }}>
          ↵ save · esc cancel
        </span>
      </div>
    </div>
  );
};

export default EditableKeywordsRow;
