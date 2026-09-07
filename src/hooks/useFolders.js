import { useState, useCallback, useEffect } from 'react'
import axiosInstance from '../api/axiosConfig'

export const UNSORTED_ID = '__unsorted__'

export function useFolders() {
  const [createdFolders, setCreatedFolders] = useState([])
  const [viewerFolders, setViewerFolders] = useState([])
  const [editorFolders, setEditorFolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const folders = [
    ...createdFolders.map(f => ({ ...f, role: 'creator' })),
    ...editorFolders.map(f => ({ ...f, role: 'editor' })),
    ...viewerFolders.map(f => ({ ...f, role: 'viewer' })),
  ].reduce((acc, f) => {
    if (!acc.find(x => x._id === f._id)) acc.push(f)
    return acc
  }, [])

  const loadFolders = useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
    const { data } = await axiosInstance.get('/folders/list')
    const f = data?.folders || {}
    setCreatedFolders(f.created_folders || [])
    setViewerFolders(f.viewer_folders || [])
    setEditorFolders(f.editor_folders || [])
  } catch (e) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
}, [])

  const createFolder = useCallback(async ({ folder_name, viewers = [], editors = [], cases = [] }) => {
    const { data } = await axiosInstance.post('/folders/create', { folder_name, viewers, editors, cases })
    await loadFolders()
    return data
  }, [loadFolders])

  const renameFolder = useCallback(async (folderId, folder_name) => {
    const { data } = await axiosInstance.post(`/folders/rename/${folderId}`, { folder_name })
    await loadFolders()
    return data
  }, [loadFolders])

  

  const deleteFolder = useCallback(async (folderId) => {
    const { data } = await axiosInstance.post(`/folders/delete/${folderId}`)
    await loadFolders()
    return data
  }, [loadFolders])

  const addCaseToFolder = useCallback(async (folderId, caseId) => {
    const { data } = await axiosInstance.post(`/folders/add-case/${folderId}`, { case_id: caseId })
    await loadFolders()
    return data
  }, [loadFolders])

  const removeCaseFromFolder = useCallback(async (folderId, caseId) => {
    const { data } = await axiosInstance.post(`/folders/remove-case/${folderId}`, { case_id: caseId })
    await loadFolders()
    return data
  }, [loadFolders])

  const addViewer = useCallback(async (folderId, viewerId) => {
    const { data } = await axiosInstance.post(`/folders/add-viewer/${folderId}`, { viewer_id: viewerId })
    await loadFolders()
    return data
  }, [loadFolders])

  const removeViewer = useCallback(async (folderId, viewerId) => {
    const { data } = await axiosInstance.post(`/folders/remove-viewer/${folderId}`, { viewer_id: viewerId })
    await loadFolders()
    return data
  }, [loadFolders])

  const addEditor = useCallback(async (folderId, editorId) => {
    const { data } = await axiosInstance.post(`/folders/add-editor/${folderId}`, { editor_id: editorId })
    await loadFolders()
    return data
  }, [loadFolders])

  const removeEditor = useCallback(async (folderId, editorId) => {
    const { data } = await axiosInstance.post(`/folders/remove-editor/${folderId}`, { editor_id: editorId })
    await loadFolders()
    return data
  }, [loadFolders])

  useEffect(() => { loadFolders() }, [loadFolders])

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
  folders.forEach(f => { buckets[f._id] = [] })
  cases.forEach(item => {
    const ids = getFolderIdsForCase(item).filter(id => buckets[id])
    if (ids.length === 0) {
      buckets[UNSORTED_ID].push(item)
    } else {
      ids.forEach(id => buckets[id].push(item))
    }
  })
  return buckets
}