import { useDispatch } from "react-redux";
import { login, register, logout } from "../store/slices/authSlice";
import { usePatents } from "./usePatents";
import { useUI } from "./useUI";
import { authApi } from "../api/authApi";           // ← use authApi again

export const useAuth = () => {
  const dispatch = useDispatch();
  const { loadPatents } = usePatents();
  const { setLoading, setError } = useUI();

  const initializeAuth = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      if (session.user_id || session.user?.id) {
        const user = session.user || { id: session.user_id, email: session.email };
        dispatch(login(user));
        await loadPatents();
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const data = await authApi.login(email, password);  // ← clean
      const session = JSON.parse(localStorage.getItem('session'));
      dispatch(login(session.user));
      await loadPatents();
      return { success: true };
    } catch (error) {
      setError(error.message || 'Login failed');
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password, company, payload) => {
    try {
      setLoading(true);

    console.log('📋 Registration payload:', {
      name,
      email,
      password,
      company,
      fullPayload: payload,
    });
      await authApi.register(name, email, password, company, payload);  // ← clean
      const session = JSON.parse(localStorage.getItem('session'));
      dispatch(register(session.user));
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
      await authApi.logout();                              // ← clean
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    initializeAuth,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};

