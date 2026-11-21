// ===========================
// FILE: patentApi.js
// ===========================

import axiosInstance from './axiosConfig';

// ── Constants ───────────────────────────────────────────────
const TIMEOUT_MS = 5 * 60 * 1000; // 2 minutes


// ── Shared error normaliser ──────────────────────────────────
const apiError = (error, fallback) => {
  const msg =
    error?.response?.data?.message ||
    error?.message ||
    fallback;
  const err = new Error(msg);
  err.response = error?.response || null;
  err.request  = error?.request  || null;
  throw err;
};

const fetchWithTimeout = (promise, ms = TIMEOUT_MS) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
  return Promise.race([promise, timeout]);
};

/** Flat API chart_data rows → map keyed by parent claim index for the Claims Chart UI. */
export const normalizeChartRowsToMap = (rows, parentClaims = []) => {
  const chart = {};
  if (!Array.isArray(rows) || rows.length === 0) return chart;

  const refOrder = [];
  const keyForRef = (ref) => {
    const r = (ref || '').trim();
    if (parentClaims.length) {
      const idx = parentClaims.findIndex(
        (c) => typeof c === 'string' && (c === ref || c.trim() === r)
      );
      if (idx >= 0) return String(idx + 1);
    }
    let i = refOrder.indexOf(r);
    if (i < 0) {
      refOrder.push(r);
      i = refOrder.length - 1;
    }
    return String(i + 1);
  };

  rows.forEach((row) => {
    const key = keyForRef(row.ref_claim);
    if (!chart[key]) chart[key] = [];
    chart[key].push({
      entry_id: row.entry_id || (row.infringing_claim || row.claim || '').slice(0, 32) || '-',
      similarity_score: row.calculated_similarity_score || row.similarity_score || 0,
    });
  });
  return chart;
};


export const patentApi = {

  getAllCases: async (page = 1) => {
    try {
      const { data } = await axiosInstance.get('/all-cases', { params: { page } });
      return {
        items: data.items || [],
        pagination: data.pagination || {},
      };
    } catch (error) {
      apiError(error, 'Failed to fetch cases');
    }
  },

  /*getMyCases: async (page = 1) => {
    try {

      const { data } = await axiosInstance.get('/my-cases', { params: { page } });
      return {
        items: data.items || [],
        pagination: data.pagination || {},
      };

    } catch (error) {

      console.error('❌ getMyCases error:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      apiError(error, 'Failed to fetch cases');
    }
  },*/

  getMyCases: async (page = 1) => {
  try {
    const { data } = await fetchWithTimeout(
      axiosInstance.get('/my-cases', { params: { page } }),
      TIMEOUT_MS
    );
    return {
      items: data.items || [],
      pagination: data.pagination || {},
    };
  } catch (error) {
    console.error('❌ getMyCases error:', error.message);
    apiError(error, 'Failed to fetch cases');
  }
},

  /*getCaseById: async (caseId) => {
    try {
      console.log('📤 Fetching case with ID:', caseId);
      const { data } = await axiosInstance.get(`/cases/${caseId}`);
      return data.case;
    } catch (error) {
      apiError(error, 'Failed to fetch case');
    }
  },*/

  getCaseById: async (caseId) => {
  try {
    const { data } = await fetchWithTimeout(
      axiosInstance.get(`/cases/${caseId}`),
      TIMEOUT_MS  // 2 minutes
    );
    return data.case;
  } catch (error) {
    if (error.message === 'Request timed out') {
      console.warn('⏱️ getCaseById timed out');
      return null; // ← return null instead of throwing
    }
    apiError(error, 'Failed to fetch case');
  }
},
  

  /*getInfringementChart: async (caseId, parentClaims = []) => {
    try {
      const { data } = await axiosInstance.get(`/infringement-chart/${caseId}`);
      console.log('📊 Infringement chart data received:', data);
      const raw = data.chart_data || data.infringement_chart || null;
      if (raw == null) return null;
      if (Array.isArray(raw)) return normalizeChartRowsToMap(raw, parentClaims);
      return typeof raw === 'object' ? raw : null;
    } catch (error) {
      apiError(error, 'Failed to fetch infringement chart');
    }
  },*/

  getInfringementChart: async (caseId, parentClaims = []) => {
    try {
      const { data } = await fetchWithTimeout(
        axiosInstance.get(`/infringement-chart/${caseId}`),
        TIMEOUT_MS
      );
      console.log('📊 Infringement chart data received:', data);
      const raw = data.chart_data || data.infringement_chart || null;
      if (raw == null) return null;
      if (Array.isArray(raw)) return normalizeChartRowsToMap(raw, parentClaims);
      return typeof raw === 'object' ? raw : null;
    } catch (error) {
      apiError(error, 'Failed to fetch infringement chart');
    }
  },


  /*getStats: async (userId) => {
    try {
      const { data } = await axiosInstance.get(`/stats?user_id=${userId}`);
      return data;
    } catch (error) {
      apiError(error, 'Failed to fetch stats');
    }
  },*/

  getStats: async (userId) => {
  try {
    const { data } = await fetchWithTimeout(
      axiosInstance.get(`/stats?user_id=${userId}`),
      TIMEOUT_MS
    );
    return data;
  } catch (error) {
    apiError(error, 'Failed to fetch stats');
  }
},


  fetchFromUspto: async (patentNumber) => {
    try {
      const { data } = await axiosInstance.post('/fetch-patent-from-uspto', {
        patentId: patentNumber,
      });
      if (!data.success) throw new Error(data.message || 'Failed to fetch from USPTO');
      return data;
    } catch (error) {
      apiError(error, 'Failed to fetch from USPTO');
    }
  },

  createPatent: async (caseDetails) => {
  try {
    const { data } = await axiosInstance.post('/create-patent', caseDetails);
    if (!data.case_id) throw new Error('Failed to create case');
    return data; // no file_uploaded flag needed anymore
  } catch (error) {
    apiError(error, 'Failed to create patent');
  }
},

  // ── BUG 4 FIX ─────────────────────────────────────────────────────────────
  // Previously the file was appended under the key 'documents', but the server
  // endpoint /upload-file-to-local-storage reads req.files['file']. Changed the
  // FormData field name from 'documents' to 'file' to match the server expectation.
  uploadFileToCase: async (caseId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file); 
      const { data } = await axiosInstance.post(
        `/upload-file-to-local-storage/${caseId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (error) {
      console.warn('File upload to local storage failed:', error.message);
      throw error;
    }
  },

  /*uploadFileToCase: async (caseId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
      `/upload-file-to-local-storage/${encodeURIComponent(caseId)}`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || res.statusText || 'Upload failed');
    }
    return data;
  } catch (error) {
    console.warn('File upload failed:', error.message);
    throw error;
  }
},*/



batchUploadFile: async (formData) => {
  try {
    const { data } = await axiosInstance.post(
      '/bulk-fetch',           // receives one file per request
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  } catch (error) {
    console.warn('Batch file upload failed:', error.message);
    throw error;
  }
},

  triggerSimilarityAnalysis: async (caseId, keywords) => {
    try {
      const { data } = await axiosInstance.post('/trigger-similarity-analysis', {
        case_id: caseId,
        keywords: keywords || [],
      });
      return data;
    } catch (error) {
      console.warn('Similarity analysis trigger failed (non-blocking):', error.message);
    }
  },

  generateDescription: async (caseId) => {
    try {
      const { data } = await axiosInstance.post(`/generate-patent-description/${caseId}`);
      if (!data.success) throw new Error(data.message || 'Failed to generate description');
      return data;
    } catch (error) {
      apiError(error, 'Failed to generate description');
    }
  },

  getClaims: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/get-claims/${caseId}`);
      if (!data.claims) throw new Error(data.message || 'Failed to get claims');
      return data.claims;
    } catch (error) {
      apiError(error, 'Failed to get claims');
    }
  },

  getInfringementAnalysis: async (
    caseId,
    keywords,
    documentUrls,
    context,
    country,
    claims,
    owners,
    signal
  ) => {
    const payload = {
      keywords:      keywords     || [],
      document_urls: documentUrls || [],
      context:       context      || '',
      country:       country      || 'US',
      claims:        claims       || [],
      owners:        owners       || [],
    };

    console.log('📤 Payload being sent to /similarity-analysis-live:',
      JSON.stringify(payload, null, 2));

    try {
      const { data } = await axiosInstance.post(
        `/similarity-analysis-live/${caseId}`,
        payload,
        { signal }
      );
      return data;
    } catch (error) {
      apiError(error, 'Failed to get infringement analysis');
    }
  },

  updateCase: async (caseId, updateData) => {

    try {
      console.log('📝 updateCase called with:', { caseId, updateData });
      const payload = { _id: caseId, ...updateData };
      console.log('📝 updateCase called:', { caseId, payload });
      const { data } = await axiosInstance.post(`/update-patent`, payload);
      if (!data.success) throw new Error(data.message || 'Failed to update case');
      return data;
    } catch (error) {
      apiError(error, 'Failed to update case');
    }
  },

  deleteCase: async (caseId) => {
    try {
      const { data } = await axiosInstance.delete(`/cases/${caseId}`);
      return data;
    } catch (error) {
      apiError(error, 'Failed to delete case');
    }
  },

  checkSamePatent: async (caseTitle, infringementTitle) => {
    try {
      const { data } = await axiosInstance.post('/check-same-patent', {
        case_title:         caseTitle,
        infringement_title: infringementTitle,
      });
      if (!data.success) return false;
      return data.same_as_patent || false;
    } catch (error) {
      console.warn('Same patent check failed:', error.message);
      return false;
    }
  },

  proxyDocument: async (documentUrl) => {
    try {
      const { body } = { document_url: documentUrl }
      const { responseParams } = { responseType: 'blob' }
      console.log('Proxying document URL:', documentUrl);  
      console.log('Proxying document Body:', body);
      const { data } = await axiosInstance.post(
        '/proxy-document',
        body,
        responseParams
      );
      return data;
    } catch (error) {
       console.warn('Proxy document failed:', error.message);
       console.warn('Complete Error Message:', error);
      apiError(error, 'Failed to open document');
    }
  },

  /*getDocumentById: async (documentId) => {
  try {
    const { data } = await axiosInstance.get(`/document/${documentId}`, {
      responseType: 'blob'
    });
    return data;
  } catch (error) {
    apiError(error, 'Failed to fetch local document');
  }
},*/

  getDocumentStream: async (url) => {
    try {
      console.log('Streaming document from URL:', url);
      const { data } = await axiosInstance.get(url, { responseType: 'blob' });
      return data;
    } catch (error) {
      apiError(error, 'Failed to stream document');
    }
  },
};
