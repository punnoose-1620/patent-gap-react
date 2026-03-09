import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://patent-gap-backend.onrender.com/api',
  timeout: 60000,
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
    console.log('💥 Raw error response:', error.response?.data);
    console.log('💥 Error status:', error.response?.status);
    console.log('💥 Error message:', error.response?.data?.message);

    if (error.response) {
      const isAuthEndpoint = AUTH_ENDPOINTS.some(ep =>
        error.config?.url?.includes(ep)
      );

      switch (error.response.status) {
        case 401:
          if (!isAuthEndpoint) {
            // Only redirect on 401 for protected routes, not login/register
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
    } else if (error.request) {
      console.error('Network Error: Please check your connection');
    } else {
      console.error('Error:', error.message);
    }

    return Promise.reject(error.response?.data || { message: 'Something went wrong' });
  }
);

export default axiosInstance;
