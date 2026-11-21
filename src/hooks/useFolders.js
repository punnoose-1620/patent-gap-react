import { useCallback, useSyncExternalStore } from 'react'
import axiosInstance from '../api/axiosConfig'

export const UNSORTED_ID = '__unsorted__'

// ---- shared module-level store ----------------------------------------
// All components calling useFolders() read/write THIS state, instead of
// each getting its own useState. That's what keeps the sidebar and the
// dashboard folder bar in sync.
let state = {
  createdFolders: [],
  viewerFolders: [],
  editorFolders: [],
  loading: false,
  error: null,
}
let hasLoadedOnce = false
const listeners = new Set()

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

async function loadFoldersShared() {
  setState({ loading: true, error: null })
  try {
    const { data } = await axiosInstance.get('/folders/list')
    const f = data?.folders || {}
    setState({
      createdFolders: f.created_folders || [],
      viewerFolders: f.viewer_folders || [],
      editorFolders: f.editor_folders || [],
      loading: false,
    })
  } catch (e) {
    setState({ error: e.message, loading: false })
  } finally {
    hasLoadedOnce = true
  }
}
// -------------------------------------------------------------------------

export function useFolders() {
  const snap = useSyncExternalStore(subscribe, getSnapshot)

  // Kick off the initial load once, no matter which component mounts first.
  if (!hasLoadedOnce) {
    hasLoadedOnce = true // set synchronously to avoid duplicate kicks on double-mount
    loadFoldersShared()
  }

  const { createdFolders, viewerFolders, editorFolders, loading, error } = snap

  const folders = [
    ...createdFolders.map((f) => ({ ...f, role: 'creator' })),
    ...editorFolders.map((f) => ({ ...f, role: 'editor' })),
    ...viewerFolders.map((f) => ({ ...f, role: 'viewer' })),
  ].reduce((acc, f) => {
    if (!acc.find((x) => x._id === f._id)) acc.push(f)
    return acc
  }, [])

  const loadFolders = useCallback(() => loadFoldersShared(), [])

  const createFolder = useCallback(async ({ folder_name, viewers = [], editors = [], cases = [] }) => {
    const { data } = await axiosInstance.post('/folders/create', { folder_name, viewers, editors, cases })
    await loadFoldersShared()
    return data
  }, [])

  const renameFolder = useCallback(async (folderId, folder_name) => {
    const { data } = await axiosInstance.post(`/folders/rename/${folderId}`, { new_name: folder_name })
    await loadFoldersShared()
    return data
  }, [])

  const deleteFolder = useCallback(async (folderId) => {
    const { data } = await axiosInstance.post(`/folders/delete/${folderId}`)
    await loadFoldersShared()
    return data
  }, [])

  const addCaseToFolder = useCallback(async (folderId, caseId) => {
    const { data } = await axiosInstance.post(`/folders/add-case/${folderId}`, { case_id: caseId })
    await loadFoldersShared()
    return data
  }, [])

  const removeCaseFromFolder = useCallback(async (folderId, caseId) => {
    const { data } = await axiosInstance.post(`/folders/remove-case/${folderId}`, { case_id: caseId })
    await loadFoldersShared()
    return data
  }, [])

  const addViewer = useCallback(async (folderId, viewerId) => {
    const { data } = await axiosInstance.post(`/folders/add-viewer/${folderId}`, { viewer_id: viewerId })
    await loadFoldersShared()
    return data
  }, [])

  const removeViewer = useCallback(async (folderId, viewerId) => {
    const { data } = await axiosInstance.post(`/folders/remove-viewer/${folderId}`, { viewer_id: viewerId })
    await loadFoldersShared()
    return data
  }, [])

  const addEditor = useCallback(async (folderId, editorId) => {
    const { data } = await axiosInstance.post(`/folders/add-editor/${folderId}`, { editor_id: editorId })
    await loadFoldersShared()
    return data
  }, [])

  const removeEditor = useCallback(async (folderId, editorId) => {
    const { data } = await axiosInstance.post(`/folders/remove-editor/${folderId}`, { editor_id: editorId })
    await loadFoldersShared()
    return data
  }, [])

  return {
    folders,
    createdFolders, viewerFolders, editorFolders,
    loading, error,
    loadFolders, createFolder, renameFolder, deleteFolder,
    addCaseToFolder, removeCaseFromFolder,
    addViewer, removeViewer, addEditor, removeEditor,
  }
}

export function getFolderIdsForCase(item) {
  const raw = item?.folders ?? item?.folder_ids ?? []
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

export function bucketCasesByFolder(cases, folders) {
  const buckets = { [UNSORTED_ID]: [] }
  folders.forEach((f) => { buckets[f._id] = [] })
  cases.forEach((item) => {
    const ids = getFolderIdsForCase(item).filter((id) => buckets[id])
    if (ids.length === 0) {
      buckets[UNSORTED_ID].push(item)
    } else {
      ids.forEach((id) => buckets[id].push(item))
    }
  })
  return buckets
}