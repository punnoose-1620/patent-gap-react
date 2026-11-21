import axios from 'axios';

const axiosInstance = axios.create({
  //baseURL: 'https://backend.patentgap.ai/api',
  baseURL: 'https://backend-dev.patentgap.ai/api',
  //baseURL: process.env.VITE_API_BASE_URL,
  //baseURL: import.meta.env.VITE_API_BASE_URL,
  //baseURL: 'http://192.168.10.157:5000/api',
  
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

// Response interceptor (async so Blob error bodies can be read when responseType is 'blob')
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📦 Raw response:', response.data);
    return response;
  },
  async (error) => {
    // ── BLOB BODY FIX ──────────────────────────────────────────────
    // When responseType is 'blob', error.response.data is a Blob even for errors.
    let errorData = error?.response?.data;
    if (errorData instanceof Blob) {
      try {
        const text = await errorData.text();
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: text };
        }
        if (error.response) error.response.data = errorData;
      } catch (readErr) {
        console.error('💥 Could not read error blob:', readErr.message);
      }
    }

    // ─── 1. Detailed diagnostics ────────────────────────────────────
    if (error.response) {
      console.log('💥 Response error status :', error.response.status);
      console.log(
        '💥 Response error data   :',
        typeof error.response.data === 'object'
          ? JSON.stringify(error.response.data, null, 2)
          : error.response.data
      );
      console.log('💥 Response error headers:', error.response.headers);
    } else if (error.request) {
      console.error('📡 No response received');
      console.error('   error.code    :', error.code);
      console.error('   error.message :', error.message);
      console.error('   baseURL       :', error.config?.baseURL);
      console.error('   url           :', error.config?.url);
      console.error('   full URL      :', (error.config?.baseURL || '') + (error.config?.url || ''));
      console.error('   method        :', error.config?.method);
      console.error('   timeout       :', error.config?.timeout);
      console.error('   sent data     :', error.config?.data);
    } else {
      console.error('⚙️ Request setup error:', error.message);
    }

    // ─── 2. Auth-based redirects (only when server actually replied) ─
    if (error.response) {
      const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
        error.config?.url?.includes(ep)
      );
      switch (error.response.status) {
        case 401:
          if (!isAuthEndpoint) {
            localStorage.removeItem('session');
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Forbidden: You do not have permission');
          break;
        case 404:
          console.error('Not Found: Resource does not exist');
          break;
        case 500:
          console.error('Server Error: Please try again later');
          break;
        default:
          console.error('An error occurred:', error.response?.data?.message);
      }
    }

    // ─── 3. Reject with a RICH error object ─────────────────────────
    const enrichedError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'Something went wrong',
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      isNetwork: !error.response && !!error.request,
    };

    console.error('🧨 Enriched error being rejected:', enrichedError);
    return Promise.reject(enrichedError);
  }
);

export default axiosInstance;
