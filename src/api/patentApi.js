// ===========================
// FILE: patentApi.js
// ===========================

import axiosInstance from './axiosConfig';

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

export const patentApi = {

  getAllCases: async () => {
    try {
      const { data } = await axiosInstance.get('/all-cases');
      return data.cases || [];
    } catch (error) {
      apiError(error, 'Failed to fetch cases');
    }
  },

  getMyCases: async () => {
    try {
      const { data } = await axiosInstance.get('/my-cases');
      return data.cases || [];
    } catch (error) {
      apiError(error, 'Failed to fetch cases');
    }
  },

  getCaseById: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/cases/${caseId}`);
      return data.case;
    } catch (error) {
      apiError(error, 'Failed to fetch case');
    }
  },

  getInfringementChart: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/infringement-chart/${caseId}`);
      return data.infringement_chart || null;
    } catch (error) {
      apiError(error, 'Failed to fetch infringement chart');
    }
  },

  getStats: async (userId) => {
    try {
      const { data } = await axiosInstance.get(`/stats?user_id=${userId}`);
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
      const { data } = await axiosInstance.get(url, { responseType: 'blob' });
      return data;
    } catch (error) {
      apiError(error, 'Failed to stream document');
    }
  },
};
