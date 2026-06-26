// FILE: src/components/dashboard/EditableTitleRow.jsx

import { useState } from 'react';
import { patentApi } from '../../api/patentApi';
import { useDispatch } from 'react-redux';
import { updatePatent } from '../../store/slices/patentSlice';

const EditableTitleRow = ({ caseId, initialValue, onSave }) => {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === initialValue) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await patentApi.updateCase(caseId, { title: draft.trim() });
      dispatch(updatePatent({ _id: caseId, title: draft.trim() }));
      onSave?.(draft.trim());
    } catch (err) {
      alert(`Failed to save title: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%' }}>
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
        style={{
          fontFamily: "'Libre Baskerville', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 400,
          color: 'inherit',
          background: 'transparent',           // ← matches page background
          border: 'none',                       // ← no box
          borderBottom: '2px solid var(--accent)', // ← just an underline
          borderRadius: 0,
          padding: '2px 0',
          outline: 'none',
          width: '100%',
          minWidth: 200,
          opacity: saving ? 0.6 : 1,
          transition: 'border-color 0.15s',
          letterSpacing: '-0.01em',            // matches your page-title style
          lineHeight: 1.2,
        }}
        onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderBottomColor = 'var(--rule2)'}
      />
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          className="btn-new"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '5px 14px', fontSize: 11, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="btn-export"
          onClick={() => setEditing(false)}
          disabled={saving}
          style={{ padding: '5px 14px', fontSize: 11 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

  return (
    <div
      onClick={() => { setDraft(initialValue); setEditing(true); }}
      title="Click to edit title"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
    >
      <em>{initialValue || 'Untitled Case'}</em>
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="var(--ink3)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, opacity: 0.45 }}
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </div>
  );
};

export default EditableTitleRow;