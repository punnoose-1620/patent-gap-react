import { UNSORTED_ID } from '../../hooks/useFolders'

/**
 * Horizontal folder bar (Gmail's Primary/Promotions/Updates row) that sits
 * above the patents/cases grid. "Unsorted" is always first and always
 * present, matching FoldersNav in the sidebar.
 *
 * Usage inside DashboardPage.jsx, right above the patents grid:
 *   <FolderTabsBar
 *     folders={folders}
 *     activeFolderId={activeFolderId}
 *     onSelectFolder={setActiveFolderId}
 *     counts={bucketCasesByFolder(mappedPatents, folders)}
 *   />
 */
export default function FolderTabsBar({ folders, activeFolderId, onSelectFolder, counts }) {
  const tabs = [{ _id: UNSORTED_ID, folder_name: 'Unsorted' }, ...folders]

  return (
    <div className="folder-tabs">
      {tabs.map((f) => {
        const isActive = activeFolderId === f._id || (!activeFolderId && f._id === UNSORTED_ID)
        const count = counts?.[f._id]?.length ?? 0
        return (
          <button
            key={f._id}
            className={`folder-tab${isActive ? ' active' : ''}`}
            onClick={() => onSelectFolder?.(f._id)}
          >
            <span className="folder-tab-name">{f.folder_name || f.name}</span>
            <span className="folder-tab-count">{count}</span>
          </button>
        )
      })}

      <style>{`
        .folder-tabs {
          display: flex; align-items: center; gap: 4px;
          border-bottom: 1px solid var(--rule2);
          overflow-x: auto; margin-bottom: 20px;
          scrollbar-width: thin;
        }
        .folder-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 14px; font-size: 13px; font-weight: 500;
          color: var(--ink3); background: none; border: none;
          border-bottom: 2px solid transparent; cursor: pointer;
          white-space: nowrap; transition: color 0.15s, border-color 0.15s;
        }
        .folder-tab:hover { color: var(--ink1); }
        .folder-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .folder-tab-count {
          font-size: 11px; padding: 1px 6px; border-radius: 20px;
          background: var(--rule2); color: var(--ink3);
        }
        .folder-tab.active .folder-tab-count {
          background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent);
        }

        @media (max-width: 599px) {
          .folder-tabs { gap: 2px; }
          .folder-tab { padding: 8px 10px; font-size: 12px; }
        }
      `}</style>
    </div>
  )
}
