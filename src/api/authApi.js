import axiosInstance from './axiosConfig';

export const authApi = {
  login: async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', { email, password: '********' });
      const { data } = await axiosInstance.post('/login', { email, password });
       console.log('✅ Login success response:', data);  // ← add this
       if (!data.success) {
      throw { message: data.message || 'Login failed' };
    }


      const session = {
        user_id: data.user_id || data.user?.id || data.id,
        email: data.email || email,
        user: data.user || { id: data.user_id || data.id, email: data.email || email },
        token: data.token || data.sessionToken || null,
      };
      localStorage.setItem('session', JSON.stringify(session));

      return data;
    } catch (error) {
      console.log('❌ Login error object:', error);         // ← add this
    console.log('❌ Login error message:', error.message); // ← add this
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  register: async (name, email, password, company) => {
    try {
      const { data } = await axiosInstance.post('/register', { name, email, password, company });

      const session = {
        user_id: data.user_id || data.user?.id,
        email: data.email || email,
        user: data.user || { id: data.user_id, email: data.email || email },
        token: data.token || null,
      };
      localStorage.setItem('session', JSON.stringify(session));

      return data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const { data } = await axiosInstance.post('/forgot-password', { email });
      return data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset link' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const { data } = await axiosInstance.post('/reset-password', { token, newPassword });
      return data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('session');
    }
  },

  getCurrentUser: async () => {
    try {
      const { data } = await axiosInstance.get('/me');
      return data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user data' };
    }
  },
};