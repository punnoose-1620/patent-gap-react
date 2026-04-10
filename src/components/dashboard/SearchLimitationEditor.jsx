// ===========================
// FILE: SearchLimitationEditor.jsx
// Self-contained — imports only what it needs.
// Props:
//   caseId        {string}   — used for the API call
//   initialData   {object}   — { companies: [], terms: [], urls: [] }
//   onSave        {function} — called with the saved payload on success
// ===========================

import { useState, useEffect, useRef } from 'react';
import { patentApi } from '../../api/patentApi';

// ─── URL validation ───────────────────────────────────────────
const URL_REGEX = /^(https?:\/\/)?(www\.)?[\w-]+(\.[\w-]+)+(\/[\w\-./?%&=]*)?$/i;

// ─── Shared inline styles ─────────────────────────────────────
const LABEL_STYLE = {
  fontFamily: "'Inconsolata', monospace",
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  color: 'var(--ink3)',
  marginBottom: 6,
  display: 'block',
};

const wrapStyle = (hasError = false) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
  minHeight: 38,
  padding: '6px 10px',
  border: `1.5px solid ${hasError ? 'var(--red)' : 'var(--rule2)'}`,
  borderRadius: 6,
  background: 'var(--bg)',
  cursor: 'text',
  transition: 'border-color .15s',
  boxSizing: 'border-box',
});

const rawInputStyle = {
  border: 'none',
  outline: 'none',
  fontSize: 12,
  minWidth: 140,
  flex: 1,
  fontFamily: "'Inconsolata', monospace",
  background: 'transparent',
  color: 'var(--ink)',
};

const TAG_BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '2px 8px',
  borderRadius: 4,
  fontFamily: "'Inconsolata', monospace",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
};

const tagStyle = {
  ...TAG_BASE,
  background: 'var(--acc-soft)',
  color: 'var(--accent)',
};

const urlTagStyle = {
  ...TAG_BASE,
  background: 'rgba(15,110,86,0.10)',
  color: '#0f6e56',
};

const tagXStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'inherit',
  opacity: 0.65,
  fontSize: 14,
  lineHeight: 1,
  padding: '0 1px',
  display: 'flex',
  alignItems: 'center',
};
// ─── Generic alphanumeric tag input ──────────────────────────
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9\s\-_.&]+$/;


// ─── Generic alphanumeric tag input ──────────────────────────
const TagInput = ({ tags, onAdd, onRemove, placeholder }) => {
  const [raw, setRaw] = useState('');
  const [tagError, setTagError] = useState('');
  const inputRef = useRef();

  const commit = () => {
    const v = raw.replace(/,$/, '').trim();
    if (!v) return;

    // ── Alphanumeric validation ──────────────────────────────
    if (!ALPHANUMERIC_REGEX.test(v)) {
      setTagError(`"${v}" — only letters, numbers, spaces, and - _ . & are allowed`);
      setTimeout(() => setTagError(''), 3200);
      return;
    }
    // ────────────────────────────────────────────────────────

    onAdd(v);
    setRaw('');
    setTagError('');
  };


  return (
    <div style={wrapStyle()} onClick={() => inputRef.current?.focus()}>
      {tags.map((v, i) => (
        <span key={i} style={tagStyle}>
          {v}
          <button
            style={tagXStyle}
            onClick={e => { e.stopPropagation(); onRemove(i); }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.65'}
          >×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
          if (e.key === 'Backspace' && !raw && tags.length) onRemove(tags.length - 1);
        }}
        onBlur={commit}
        placeholder={tags.length ? '' : placeholder}
        autoComplete="off"
        style={rawInputStyle}
      />
    </div>
  );
};

// ─── URL tag input with validation ───────────────────────────
const UrlTagInput = ({ tags, onAdd, onRemove }) => {
  const [raw,      setRaw]      = useState('');
  const [urlError, setUrlError] = useState('');
  const inputRef = useRef();

  const commit = () => {
    const v = raw.replace(/,$/, '').trim();
    if (!v) return;
    if (!URL_REGEX.test(v)) {
      setUrlError(`"${v}" is not a valid URL — try www.example.org or https://example.org`);
      setTimeout(() => setUrlError(''), 3200);
      return;
    }
    onAdd(v);
    setRaw('');
    setUrlError('');
  };

  return (
    <>
      <div style={wrapStyle(!!urlError)} onClick={() => inputRef.current?.focus()}>
        {tags.map((v, i) => (
          <span key={i} style={urlTagStyle}>
            {v}
            <button
              style={tagXStyle}
              onClick={e => { e.stopPropagation(); onRemove(i); }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.65'}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={raw}
          onChange={e => { setRaw(e.target.value); if (urlError) setUrlError(''); }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
            if (e.key === 'Backspace' && !raw && tags.length) onRemove(tags.length - 1);
          }}
          onBlur={commit}
          placeholder={tags.length ? '' : 'www.example.org — press Enter or comma'}
          autoComplete="off"
          style={rawInputStyle}
        />
      </div>

      {urlError
        ? <p style={{ fontSize: 11, color: 'var(--red)', margin: '5px 0 0', fontFamily: "'Inconsolata', monospace" }}>
            ✗ {urlError}
          </p>
        : <p style={{ fontSize: 10, color: 'var(--ink3)', margin: '5px 0 0', fontFamily: "'Inconsolata', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Accepts www.domain.tld · https://domain.tld · domain.tld
          </p>
      }
    </>
  );
};

// ─── Field wrapper ────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <span style={LABEL_STYLE}>{label}</span>
    {children}
  </div>
);

// ─── Main export ──────────────────────────────────────────────
const SearchLimitationEditor = ({ caseId, initialData, onSave }) => {
  const [companies, setCompanies] = useState(initialData?.companies || []);
  const [terms,     setTerms]     = useState(initialData?.terms     || []);
  const [urls,      setUrls]      = useState(initialData?.urls      || []);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved,     setSaved]     = useState(false);

  // Sync if parent re-fetches data
  useEffect(() => {
    setCompanies(initialData?.companies || []);
    setTerms(initialData?.terms         || []);
    setUrls(initialData?.urls           || []);
  }, [initialData]);

  const addTo    = setter => v  => setter(prev => prev.includes(v) ? prev : [...prev, v]);
  const removeAt = setter => i  => setter(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!companies.length && !terms.length && !urls.length) {
      setSaveError('Add at least one value before saving.');
      return;
    }
    try {
      //alert('This will save the search limitations to the case. The infringement analysis will then exclude any patents matching these companies, keywords, or URLs.');
      setSaving(true);
      setSaveError(null);
      console.log('💾 Saving search limitations payload', caseId, { companies, terms, urls });
      await patentApi.updateCase(caseId, {
        searchLimitations: { companies, terms, urls },
      });
      onSave?.({ companies, terms, urls });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      //alert('Failed to save search limitations. Please try again.');
      setSaveError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    
    setCompanies(initialData?.companies || []);
    setTerms(initialData?.terms         || []);
    setUrls(initialData?.urls           || []);
    setSaveError(null);
  };

  return (
    <div>
      <Field label="Companies">
        <TagInput
          tags={companies}
          onAdd={addTo(setCompanies)}
          onRemove={removeAt(setCompanies)}
          placeholder="Type a company name and press Enter or comma…"
        />
      </Field>

      <Field label="Keywords / Terms">
        <TagInput
          tags={terms}
          onAdd={addTo(setTerms)}
          onRemove={removeAt(setTerms)}
          placeholder="Type a keyword and press Enter or comma…"
        />
      </Field>

      <Field label="Reference URLs">
        <UrlTagInput
          tags={urls}
          onAdd={addTo(setUrls)}
          onRemove={removeAt(setUrls)}
        />
      </Field>

      {saveError && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 10px', fontFamily: "'Inconsolata', monospace" }}>
          ✗ {saveError}
        </p>
      )}

      {/* ── Action row ── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        paddingTop: 14, borderTop: '1px solid var(--rule2)',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-new"
          style={{ opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {saving ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save
            </>
          )}
        </button>

        <button
          onClick={handleCancel}
          disabled={saving}
          className="btn-export"
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          Cancel
        </button>


        {saved && (
          <span style={{
            fontFamily: "'Inconsolata', monospace", fontSize: 11,
            color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Saved
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchLimitationEditor;