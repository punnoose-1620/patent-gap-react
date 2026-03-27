import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { login, register, logout } from "../store/slices/authSlice";
import { usePatents } from "./usePatents";
import { useUI } from "./useUI";
import { authApi } from "../api/authApi";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { loadPatents } = usePatents();
  const { setLoading, setError } = useUI();

  const initializeAuth = useCallback(async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // ✅ Now checks email too, since backend returns no user_id
      const hasSession = session.user_id || session.user?.id || session.email || session.user?.email;

      if (hasSession) {
        const user = session.user || {
          id: session.user_id || session.email, // email as fallback ID
          email: session.email,
        };
        dispatch(login(user));
        await loadPatents();
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }, [dispatch]);

  const handleLogin = async (email, password) => {
  try {
    const data = await authApi.login(email, password);

    console.log('🔍 Full login data:', JSON.stringify(data, null, 2));
    console.log('🔍 user_id:', data.user_id);
    console.log('🔍 data.user:', data.user);
    console.log('🔍 data.id:', data.id);
    console.log('🔍 data._id:', data._id);


    const user = {
      id: data.user_id || data.user?.id || email,
      email: data.user?.email || email,
    };

    console.log('👤 Resolved user object:', user); // ✅ check what id resolves to


    const existingSession = JSON.parse(localStorage.getItem('session') || '{}');
    localStorage.setItem('session', JSON.stringify({
      ...existingSession,
      user,
      email: user.email,
    }));

    console.log('💾 Session saved:', localStorage.getItem('session'));

    dispatch(login(user));
    await loadPatents();
    return { success: true };

  } catch (error) {
    setError(error.message || 'Login failed');
    return { success: false, error: error.message || 'Login failed' };
  }
};

  const handleRegister = async (name, email, password, company, payload) => {
    try {
      setLoading(true);
      await authApi.register(name, email, password, company, payload);

      // ✅ Same pattern as handleLogin
      const existingSession = JSON.parse(localStorage.getItem('session') || '{}');
      const user = existingSession.user || { email, id: email };

      localStorage.setItem('session', JSON.stringify({
        ...existingSession,
        user,
        email: user.email,
      }));

      dispatch(register(user));
      await loadPatents();
      return { success: true };

    } catch (error) {
      setError(error.message || 'Registration failed');
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('session'); // ✅ clear session on logout
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('session'); // ✅ clear even if API fails
      dispatch(logout());
    }
  };

  const updateProfile = async (payload) => {
  try {
    const data = await authApi.updateProfile(payload);
    // Update session with new info if needed
    const existingSession = JSON.parse(localStorage.getItem('session') || '{}');
    localStorage.setItem('session', JSON.stringify({
      ...existingSession,
      user: { ...existingSession.user, ...payload },
    }));
    return data;
  } catch (error) {
    console.error('Profile update failed:', error);
    throw error;
  }
};

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      return data;
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  return {
    initializeAuth,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile,      
    changePassword,
  };
};