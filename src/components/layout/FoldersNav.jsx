import { useState, useRef, useEffect } from 'react'
import { Folder, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useFolders, UNSORTED_ID } from '../../hooks/useFolders'

/**
 * Sidebar "FOLDERS" section, styled to match the existing sb-* classes in
 * DashboardSidebar.jsx. Drop it in as its own section between NAV_ITEMS
 * groups (folders are dynamic/per-user, so they can't live in the static
 * NAV_ITEMS array).
 *
 * Usage inside DashboardSidebar.jsx:
 *   <div className="sb-hr" />
 *   <FoldersNav activeFolderId={activeFolderId} onSelectFolder={(id) => {
 *     onSelectFolder(id)          // lift this up to DashboardPage
 *     navigate('/dashboard')
 *   }} />
 */
export default function FoldersNav({ activeFolderId, onSelectFolder }) {
  const { folders, loading, error, createFolder, renameFolder, deleteFolder } = useFolders()

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const containerRef = useRef(null)

  const renameHandledRef = useRef(false)   

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      await createFolder({ folder_name: name })
      setNewName('')
      setIsCreating(false)
    } catch (e) {
      alert(e.message || 'Could not create folder')
    } finally {
      setBusy(false)
    }
  }

  const startRename = (folder) => {
    renameHandledRef.current = false   
    setRenamingId(folder._id)
    setRenameValue(folder.folder_name || folder.name || '')
    setMenuOpenId(null)
  }

  const commitRename = async (folder) => {
    if (renameHandledRef.current) return
    renameHandledRef.current = true

    const name = renameValue.trim()
    setRenamingId(null)
    if (!name || name === (folder.folder_name || folder.name)) return
    try {
      await renameFolder(folder._id, name)
    } catch (e) {
      alert(e.message || 'Could not rename folder')
    }
  }

  const cancelRename = () => {
    renameHandledRef.current = true
    setRenamingId(null)
  }
  const handleDelete = async (folder) => {
    setConfirmDeleteId(null)
    try {
      await deleteFolder(folder._id)
      if (activeFolderId === folder._id) onSelectFolder?.(UNSORTED_ID)
    } catch (e) {
      alert(e.message || 'Could not remove folder')
    }
  }

  return (
    <div ref={containerRef}>
      <div className="sb-label-row">
        <span className="sb-label">FOLDERS</span>
        <button
          className="sb-folder-add"
          onClick={() => { setIsCreating(v => !v); setNewName('') }}
          aria-label="New folder"
          title="New folder"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      {isCreating && (
        <div className="sb-folder-create">
          <input
            autoFocus
            value={newName}
            placeholder="Folder name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setIsCreating(false); setNewName('') }
            }}
          />
          <div className="sb-folder-create-actions">
            <button className="sb-folder-btn ghost" onClick={() => { setIsCreating(false); setNewName('') }}>
              Cancel
            </button>
            <button className="sb-folder-btn primary" disabled={!newName.trim() || busy} onClick={handleCreate}>
              {busy ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <button
        className={`sb-link sb-folder-link${(activeFolderId === UNSORTED_ID || !activeFolderId) ? ' active' : ''}`}
        onClick={() => onSelectFolder?.(UNSORTED_ID)}
      >
        <Folder className="sb-icon" strokeWidth={1.5} />
        Unsorted
      </button>

      {loading && <div className="sb-folder-empty">Loading folders…</div>}
      {error && <div className="sb-folder-empty error">{error}</div>}
      {!loading && !error && folders.length === 0 && (
        <div className="sb-folder-empty">No folders yet</div>
      )}

      {folders.map((folder) => (
        <div key={folder._id} className="sb-folder-row">
          {renamingId === folder._id ? (
            <input
              autoFocus
              className="sb-folder-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(folder)
                if (e.key === 'Escape') cancelRename()  
              }}
              onBlur={() => commitRename(folder)}
            />
          ) : (
            <button
              className={`sb-link sb-folder-link${activeFolderId === folder._id ? ' active' : ''}`}
              onClick={() => onSelectFolder?.(folder._id)}
            >
              <Folder className="sb-icon" strokeWidth={1.5} />
              <span className="sb-folder-name">{folder.folder_name || folder.name}</span>
            </button>
          )}

          {folder.role !== 'viewer' && renamingId !== folder._id && (
            <div className="sb-folder-menu-wrap">
              <button
                className="sb-folder-more"
                onClick={() => setMenuOpenId(menuOpenId === folder._id ? null : folder._id)}
                aria-label="Folder options"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpenId === folder._id && (
                <div className="sb-folder-menu">
                  <button onClick={() => startRename(folder)}>
                    <Pencil size={13} /> Rename
                  </button>
                  <button className="danger" onClick={() => { setConfirmDeleteId(folder._id); setMenuOpenId(null) }}>
                    <Trash2 size={13} /> Remove folder
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {confirmDeleteId && (
        <div className="sb-folder-confirm-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="sb-folder-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="sb-folder-confirm-title">Remove this folder?</div>
            <p>Cases inside it won't be deleted — they'll move back to Unsorted.</p>
            <div className="sb-folder-confirm-actions">
              <button className="sb-folder-btn ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className="sb-folder-btn danger"
                onClick={() => handleDelete(folders.find(f => f._id === confirmDeleteId))}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sb-label-row { display: flex; align-items: center; justify-content: space-between; padding-right: 6px; }
        .sb-folder-add {
          display: flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 5px; border: none;
          background: transparent; color: var(--ink3); cursor: pointer;
        }
        .sb-folder-add:hover { background: var(--rule2); color: var(--ink1); }

        .sb-folder-create { padding: 6px 12px 10px; }
        .sb-folder-create input {
          width: 100%; box-sizing: border-box; padding: 7px 9px; font-size: 13px;
          border: 1px solid var(--rule); border-radius: 6px; background: var(--panel, #fff);
          color: var(--ink1);
        }
        .sb-folder-create-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; }
        .sb-folder-btn { font-size: 12px; padding: 5px 10px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; }
        .sb-folder-btn.ghost { background: transparent; color: var(--ink3); border-color: var(--rule); }
        .sb-folder-btn.primary { background: var(--accent); color: #fff; }
        .sb-folder-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .sb-folder-btn.danger { background: #d64545; color: #fff; }

        .sb-folder-row { position: relative; display: flex; align-items: center; }
        .sb-folder-link { flex: 1; min-width: 0; }
        .sb-folder-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sb-folder-menu-wrap { position: relative; }
        .sb-folder-more {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border: none; background: transparent;
          color: var(--ink3); border-radius: 5px; cursor: pointer; margin-right: 6px;
        }
        .sb-folder-more:hover { background: var(--rule2); color: var(--ink1); }

        .sb-folder-menu {
          position: absolute; right: 0; top: 26px; z-index: 40;
          background: var(--panel, #fff); border: 1px solid var(--rule);
          border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          min-width: 150px; overflow: hidden;
        }
        .sb-folder-menu button {
          display: flex; align-items: center; gap: 8px; width: 100%;
          text-align: left; padding: 8px 10px; font-size: 12.5px;
          background: none; border: none; cursor: pointer; color: var(--ink1);
        }
        .sb-folder-menu button:hover { background: var(--rule2); }
        .sb-folder-menu button.danger { color: #d64545; }

        .sb-folder-rename-input {
          flex: 1; margin: 2px 12px; padding: 6px 8px; font-size: 13px;
          border: 1px solid var(--accent); border-radius: 6px;
          background: #1f2a24;   /* dark input background matching sidebar */
          color: #ffffff;        /* white text so it's visible */
        }
        .sb-folder-rename-input::placeholder {
          color: rgba(255,255,255,0.5);
}

        .sb-folder-empty { padding: 6px 12px 10px; font-size: 12px; color: var(--ink3); }
        .sb-folder-empty.error { color: #d64545; }

        .sb-folder-confirm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .sb-folder-confirm {
          background: var(--panel, #fff); border-radius: 10px; padding: 18px 20px;
          width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
        .sb-folder-confirm-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--ink1); }
        .sb-folder-confirm p { font-size: 12.5px; color: var(--ink3); margin: 0 0 14px; line-height: 1.5; }
        .sb-folder-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
    </div>
  )
}
