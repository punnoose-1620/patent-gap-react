import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import patentReducer from "./slices/patentSlice";
import uiReducer from "./slices/uiSlice";
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,       // → state.auth
    patents: patentReducer,  // → state.patents
    ui: uiReducer,           // → state.ui
    user:  userReducer,     // → state.user (for profile details, separate from auth)
  },
});

export default store;