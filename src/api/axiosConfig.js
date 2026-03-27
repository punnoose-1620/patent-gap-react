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
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📦 Raw response:', response.data);
    return response;
  },
  (error) => {
    // ─── 1. Detailed diagnostics ────────────────────────────────────
    if (error.response) {
      // Server replied with a non-2xx status
      console.log('💥 Response error status :', error.response.status);
      console.log('💥 Response error data   :', JSON.stringify(error.response.data, null, 2));
      console.log('💥 Response error headers:', error.response.headers);
    } else if (error.request) {
      // Request left the browser but no response came back (network/CORS/timeout)
      console.error('📡 No response received');
      console.error('   error.code    :', error.code);        // ERR_NETWORK | ECONNABORTED | ERR_CANCELED
      console.error('   error.message :', error.message);
      console.error('   baseURL       :', error.config?.baseURL);
      console.error('   url           :', error.config?.url);
      console.error('   full URL      :', (error.config?.baseURL || '') + (error.config?.url || ''));
      console.error('   method        :', error.config?.method);
      console.error('   timeout       :', error.config?.timeout);
      console.error('   sent data     :', error.config?.data);
    } else {
      // Error was thrown before the request even left (bad config, etc.)
      console.error('⚙️ Request setup error:', error.message);
    }

    // ─── 2. Auth-based redirects (only when server actually replied) ─
    if (error.response) {
      const isAuthEndpoint = AUTH_ENDPOINTS.some(ep =>
        error.config?.url?.includes(ep)
      );
      switch (error.response.status) {
        case 401:
          if (!isAuthEndpoint) {
            localStorage.removeItem('session');
            window.location.href = '/login';
          }
          break;
        case 403: console.error('Forbidden: You do not have permission'); break;
        case 404: console.error('Not Found: Resource does not exist'); break;
        case 500: console.error('Server Error: Please try again later'); break;
        default:  console.error('An error occurred:', error.response?.data?.message);
      }
    }

    // ─── 3. Reject with a RICH error object (never loses context) ───
    const enrichedError = {
      message : error.response?.data?.message || error.message || 'Something went wrong',
      code    : error.code,                        // ERR_NETWORK, ECONNABORTED, etc.
      status  : error.response?.status,            // 404, 500, etc. (undefined if network error)
      data    : error.response?.data,              // full backend payload
      isNetwork: !error.response && !!error.request, // true = backend unreachable
    };

    console.error('🧨 Enriched error being rejected:', enrichedError);
    return Promise.reject(enrichedError);
  }
);

export default axiosInstance;
