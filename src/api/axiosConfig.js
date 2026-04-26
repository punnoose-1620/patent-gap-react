import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://backend-dev.patentgap.ai/api',
  timeout: 600000, // 10 minutes
  //withCredentials: true,          // ← add this
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Auth endpoints that should never trigger a redirect on 401
const AUTH_ENDPOINTS = ['/login', '/register', '/forgot-password', '/reset-password'];

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const session = JSON.parse(localStorage.getItem('session') || '{}');

    const token = session?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const userId = session?.user_id || session?.user?.id || null;
    if (userId) {
      config.headers['X-User-ID'] = userId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// Response interceptor
// In axiosConfig.js — update your response error interceptor:
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📦 Raw response:', response.data);
    return response;
  },
  async (error) => {  // ← make this async
    console.error('💥 Response error status :', error?.response?.status);

    // ── BLOB BODY FIX ──────────────────────────────────────────────
    // When responseType is 'blob', error.response.data is a Blob even
    // for error responses. Read it as text so we can log/parse it.
    let errorData = error?.response?.data;
    if (errorData instanceof Blob) {
      try {
        const text = await errorData.text();
        console.error('💥 Response error body (text):', text);
        try {
          errorData = JSON.parse(text);
          console.error('💥 Response error body (parsed):', errorData);
        } catch {
          errorData = { message: text };
        }
        // Patch it back so downstream catch blocks see real data
        if (error.response) error.response.data = errorData;
      } catch (readErr) {
        console.error('💥 Could not read error blob:', readErr.message);
      }
    } else {
      console.error('💥 Response error data   :', errorData);
    }
    // ── END BLOB FIX ───────────────────────────────────────────────

    console.error('💥 Response error headers:', error?.response?.headers);

    const status = error?.response?.status;

    if (status === 401) {
      // your existing 401 handling
    }

    if (status >= 500) {
      console.error('Server Error: Please try again later');
    }

    // Enrich and re-throw
    const enriched = {
      message: error?.message,
      code:    error?.code,
      status,
      data:    errorData,    // ← now contains parsed JSON, not Blob
      isNetwork: !error?.response,
    };
    console.error('🧨 Enriched error being rejected:', enriched);
    return Promise.reject(enriched);
  }
);

export default axiosInstance;
