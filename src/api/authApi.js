import axiosInstance from './axiosConfig';

export const authApi = {
  login: async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', { email, password: '********' });
      const { data } = await axiosInstance.post('/login', { email, password });
       console.log('✅ Login success response:', data);  // ← add this
      // if (!data.success) {
      //throw { message: data.message || 'Login failed' };
    //}


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

  register: async (name, email, password, company, fullPayload = {}) => {
  try {
    const { data } = await axiosInstance.post('/create-attorney', {
      name, email, password, company,
      ...fullPayload,   // photo, jobTitle, phone, linkedIn, metadata, etc.
    });

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

  /*resetPassword: async (token, newPassword) => {
    try {
      const { data } = await axiosInstance.post('/update-password', { token, newPassword });
      return data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },*/

updateProfile: async (payload) => {
  try {
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    const userId = session.user_id || session.user?.id || session.email;

    const finalPayload = {
      _id: userId,
      ...payload,
    };
    console.log('📤 updateProfile payload:', finalPayload); // ← ADD THIS

    const { data } = await axiosInstance.post('/update-attorney', finalPayload, {
      headers: {
        'X-User-ID': userId,
      }
    });

    console.log('✅ Profile updated:', data);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
},

changePassword: async (currentPassword, newPassword) => {
  try {
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    const userId = session.user_id || session.user?.id || session.email;

    console.log('🔑 changePassword:', { userId, currentPassword, newPassword }); // ← ADD THIS

    const { data } = await axiosInstance.post('/update-password', {
      user_id: userId,
      old_password: currentPassword,
      password: newPassword,
    });

    console.log('✅ Password changed:', data);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to change password' };
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
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    
    // ✅ Get user_id — fall back to email since your backend returns user_id: null
    const userId = session.user_id || session.user?.id || session.email;

    if (!userId) {
      throw { message: 'No session found' };
    }

    console.log('📤 Fetching profile with X-User-ID:', userId);

    const { data } = await axiosInstance.get('/profile', {
      headers: {
        'X-User-ID': userId,   // ✅ backend reads this header
      }
    });

    console.log('📦 Profile response:', data);
    return data;

  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user data' };
  }
},
};
