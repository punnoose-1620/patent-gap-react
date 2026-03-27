// src/hooks/useUser.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserProfile, setUserLoading, setUserError } from '../store/slices/userSlice';
import { authApi } from '../api/authApi';  // ✅ reuse existing authApi

export const useUser = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.user.profile);
  const userLoading = useSelector((state) => state.user.loading);

  const loadUserProfile = useCallback(async () => {
    try {
      dispatch(setUserLoading(true));
      const data = await authApi.getCurrentUser();  // ✅ calls your existing /me endpoint
      console.log('👤 User profile loaded: db', data);
      // ✅ Extract from data.profile, fall back to data itself
        const profile = data.profile || data.user || data || null;

        if (profile) {
        dispatch(setUserProfile(profile));
        } else {
        console.warn('⚠️ Profile is null — backend may not recognize the session');
        }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      dispatch(setUserError(error.message || 'Failed to load profile'));
    } finally {
      dispatch(setUserLoading(false));
    }
  }, [dispatch]);

  return { loadUserProfile, userProfile, userLoading };
};