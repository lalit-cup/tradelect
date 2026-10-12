import { createSlice } from '@reduxjs/toolkit';
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], count: 0 },
  reducers: {
    setCart: (state, { payload }) => { state.items = payload; state.count = payload.length; },
    incrementCart: (state) => { state.count += 1; },
    decrementCart: (state) => { state.count = Math.max(0, state.count - 1); },
  },
});
export const { setCart, incrementCart, decrementCart } = cartSlice.actions;
export default cartSlice.reducer;
