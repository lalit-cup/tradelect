import api from './api';

export const authService = {
  login:          (data)  => api.post('/api/auth/login', data),
  register:       (data)  => api.post('/api/auth/register', data),
  registerAdmin:  (data)  => api.post('/api/auth/register-admin', data),
  adminExists:    ()      => api.get('/api/auth/admin-exists'),
  sendOtp:        (email) => api.post('/api/auth/otp/send', { email }),
  refreshToken:   (token) => api.post('/api/auth/refresh', { refreshToken: token }),
  changePassword: (data)  => api.post('/api/auth/change-password', data),
};
