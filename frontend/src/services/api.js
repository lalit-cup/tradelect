import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tradelect_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('tradelect_refresh_token');
      if (refreshToken && !isRefreshing) {
        original._retry = true;
        isRefreshing = true;
        try {
          const res = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/auth/refresh`,
            { refreshToken }
          );
          const { accessToken } = res.data.data;
          localStorage.setItem('tradelect_token', accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          refreshQueue.forEach(cb => cb(accessToken));
          refreshQueue = [];
          return api(original);
        } catch {
          localStorage.removeItem('tradelect_token');
          localStorage.removeItem('tradelect_refresh_token');
          localStorage.removeItem('tradelect_user');
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else if (refreshToken && isRefreshing) {
        return new Promise(resolve => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      } else {
        localStorage.removeItem('tradelect_token');
        localStorage.removeItem('tradelect_refresh_token');
        localStorage.removeItem('tradelect_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
