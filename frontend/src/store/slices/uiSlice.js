import { createSlice } from '@reduxjs/toolkit';
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false, notifCount: 0 },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, { payload }) => { state.sidebarOpen = payload; },
    setNotifCount: (state, { payload }) => { state.notifCount = payload; },
  },
});
export const { toggleSidebar, setSidebarOpen, setNotifCount } = uiSlice.actions;
export default uiSlice.reducer;
