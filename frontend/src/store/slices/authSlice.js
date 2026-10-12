import { createSlice } from '@reduxjs/toolkit';

const savedUser = JSON.parse(localStorage.getItem('tradelect_user') || 'null');
const savedToken = localStorage.getItem('tradelect_token') || null;
const savedRefresh = localStorage.getItem('tradelect_refresh_token') || null;

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: savedUser, token: savedToken, refreshToken: savedRefresh, isAuthenticated: !!savedToken, loading: false },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user; state.token = payload.accessToken; state.refreshToken = payload.refreshToken; state.isAuthenticated = true;
      localStorage.setItem('tradelect_token', payload.accessToken);
      if (payload.refreshToken) localStorage.setItem('tradelect_refresh_token', payload.refreshToken);
      localStorage.setItem('tradelect_user', JSON.stringify(payload.user));
    },
    logout: (state) => {
      state.user = null; state.token = null; state.refreshToken = null; state.isAuthenticated = false;
      localStorage.removeItem('tradelect_token'); localStorage.removeItem('tradelect_refresh_token'); localStorage.removeItem('tradelect_user');
    },
    setLoading: (state, { payload }) => { state.loading = payload; },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
      localStorage.setItem('tradelect_user', JSON.stringify(state.user));
    },
  },
});
export const { setCredentials, logout, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
