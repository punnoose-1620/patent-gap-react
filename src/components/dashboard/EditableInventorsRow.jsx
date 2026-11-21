import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { patentApi } from '../../api/patentApi';

const EditableInventorsRow = ({ caseId, initialValue, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(initialValue || '');
  const [saving,  setSaving]  = useState(false);

  // Keep in sync if parent reloads caseData
  useEffect(() => { setValue(initialValue || ''); }, [initialValue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const asArray = value.split(',').map(s => s.trim()).filter(Boolean);
      await patentApi.updateCase(caseId, { inventors: asArray });
      onSave(asArray);
      setEditing(false);
    } catch (err) {
      alert(`Failed to save inventors: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="pd-info-row" style={{ alignItems: 'center' }}>
        <div className="pd-info-label-wrap">
          <User size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />
          <span className="pd-info-label">Inventors</span>
        </div>
        <span className="pd-info-value" style={{ flex: 1 }}>{value || 'Not specified'}</span>
        <button
          onClick={() => setEditing(true)}
          title="Edit inventors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                   color: 'var(--ink3)', opacity: 0.5, borderRadius: 4, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="pd-info-row" style={{ flexDirection: 'column', gap: 8 }}>
      <div className="pd-info-label-wrap">
        <User size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />
        <span className="pd-info-label">Inventors</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        placeholder="Jane Smith, John Doe"
        style={{ fontSize: 13.5, padding: '5px 9px', border: '1px solid var(--rule2)',
                 borderRadius: 6, background: 'var(--surf)', color: 'var(--ink)',
                 width: '100%', boxSizing: 'border-box', outline: 'none' }}
        autoFocus
      />
      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Separate multiple inventors with commas</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-new" onClick={handleSave} disabled={saving}
                style={{ fontSize: 11, padding: '4px 12px', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn-export" onClick={() => setEditing(false)} disabled={saving}
                style={{ fontSize: 11, padding: '4px 12px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
};
export default EditableInventorsRow;