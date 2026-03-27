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
      return data;
    } catch (error) {
      apiError(error, 'Failed to create patent');
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

  // ── FIX: documentUrls param added back — was missing, causing
  //         all subsequent args (context, country, claims, owners)
  //         to silently receive the wrong values.
  // ────────────────────────────────────────────────────────────
  /*getInfringementAnalysis: async (
    caseId,
    keywords,
    documentUrls,   // ← was missing in the broken version
    context,
    country,
    claims,
    owners
  ) => {
    const payload = {
      keywords:      keywords     || [],
      document_urls: documentUrls || [],   // ← was being skipped entirely
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
        payload
      );
      return data;
    } catch (error) {
      apiError(error, 'Failed to get infringement analysis');
    }
  },*/
  getInfringementAnalysis: async (
  caseId,
  keywords,
  documentUrls,
  context,
  country,
  claims,
  owners,
  signal        // ← add this
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
      { signal }   // ← add this (axios supports AbortSignal since v0.22)
    );
    return data;
  } catch (error) {
    apiError(error, 'Failed to get infringement analysis');
  }
},

  // ── FIX: POST → PUT for semantic correctness.
  //         If your backend only accepts POST for updates,
  //         revert this one line back to .post()
  // ────────────────────────────────────────────────────────────
  updateCase: async (caseId, updateData) => {
  try {
    const payload = { _id: caseId, ...updateData };  // ← ADD THIS
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
      const { data } = await axiosInstance.post(
        '/proxy-document',
        { document_url: documentUrl },
        { responseType: 'blob' }
      );
      return data;
    } catch (error) {
      apiError(error, 'Failed to open document');
    }
  },
};