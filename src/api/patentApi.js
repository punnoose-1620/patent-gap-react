import axiosInstance from './axiosConfig';

export const patentApi = {

  getAllCases: async () => {
    try {
      const { data } = await axiosInstance.get('/all-cases');
      return data.cases || [];
    } catch (error) {
      throw { message: error.message || 'Failed to fetch cases' };
    }
  },

  getCaseById: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/cases/${caseId}`);
      return data.case;
    } catch (error) {
      throw { message: error.message || 'Failed to fetch case' };
    }
  },

  getInfringementChart: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/infringement-chart/${caseId}`);
      return data.infringement_chart || null;
    } catch (error) {
      throw { message: error.message || 'Failed to fetch infringement chart' };
    }
  },

  getStats: async (userId) => {
    try {
      const { data } = await axiosInstance.get(`/stats?user_id=${userId}`);
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to fetch stats' };
    }
  },

  fetchFromUspto: async (patentNumber) => {
    try {
      const { data } = await axiosInstance.post('/fetch-patent-from-uspto', { patentId: patentNumber });
      if (!data.success) throw { message: data.message || 'Failed to fetch from USPTO' };
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to fetch from USPTO' };
    }
  },

  createPatent: async (caseDetails) => {
    try {
      const { data } = await axiosInstance.post('/create-patent', caseDetails);
      if (!data.case_id) throw { message: 'Failed to create case' };
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to create patent' };
    }
  },

  generateDescription: async (caseId) => {
    try {
      const { data } = await axiosInstance.post(`/generate-patent-description/${caseId}`);
      if (!data.success) throw { message: data.message || 'Failed to generate description' };
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to generate description' };
    }
  },

  getClaims: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/get-claims/${caseId}`);
      if (!data.claims) throw { message: data.message || 'Failed to get claims' };
      return data.claims;
    } catch (error) {
      throw { message: error.message || 'Failed to get claims' };
    }
  },

  /*getInfringementAnalysis: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/gemini-infringement-analysis/${caseId}`);
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to get infringement analysis' };
    }
  },

  getInfringementAnalysisLive: async (caseId) => {
    try {
      const { data } = await axiosInstance.get(`/similarity-analysis-live/${caseId}`);
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to get infringement analysis' };
    }
  },*/

/*getInfringementAnalysis: async (caseId, keywords, documentUrls, context, country, claims, owners) => {
  try {
    // ── Debug: verify all args arrive ──
    console.log('🔧 Raw args received:', { caseId, keywords, documentUrls, context, country, claims, owners });

    const payload = {
      keywords:      keywords      || [],
      document_urls: documentUrls  || [],
      country:       country       || 'US',
      context:       context       || '',
      claims:        claims        || [],
      owners:        owners        || [],
    };
    console.log('📤 Final payload keys:', Object.keys(payload));
    console.log('📤 Sending to /similarity-analysis-live', JSON.stringify(payload, null, 2));
    const { data } = await axiosInstance.post('/similarity-analysis-live', payload);
    return data;
  } catch (error) {
    console.error('📛 Full error object:', error);
    throw { message: error.message || 'Failed to get infringement analysis' };
  }
},*/
getInfringementAnalysis: async (caseId, keywords, context, country, claims, owners) => {
  const payload = {};
  payload['caseId']        = caseId     || [];
  payload['keywords']      = keywords     || [];
  payload['country']       = country      || 'US';
  payload['context']       = context      || '';
  payload['claims']        = claims       || [];
  payload['owners']        = owners       || [];

  console.log('📤 Payload beeing sent:', JSON.stringify(payload));

    try {
      const { data } = await axiosInstance.post(`/similarity-analysis-live/${caseId}`, payload);
      return data;
    } catch (error) {
      console.error('📛 Error:', error);
      throw { message: error.message || 'Failed to get infringement analysis' };
    }
  },
  updateCase: async (caseId, updateData) => {
    try {
      const { data } = await axiosInstance.post(`/cases/${caseId}`, updateData);
      if (!data.success) throw { message: data.message || 'Failed to update case' };
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to update case' };
    }
  },

  deleteCase: async (caseId) => {
    try {
      const { data } = await axiosInstance.delete(`/cases/${caseId}`);
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to delete case' };
    }
  },

  // ✅ From HTML: checkSamePatent() — POST /api/check-same-patent
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

  // ✅ From HTML: openDocument() — POST /api/proxy-document, returns blob
  proxyDocument: async (documentUrl) => {
    try {
      const { data } = await axiosInstance.post(
        '/proxy-document',
        { document_url: documentUrl },
        { responseType: 'blob' }
      );
      return data;
    } catch (error) {
      throw { message: error.message || 'Failed to open document' };
    }
  },
};
