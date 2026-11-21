import { useState, useEffect, useRef } from 'react';
import { patentApi } from '../../api/patentApi';


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

export default ContextEditor;