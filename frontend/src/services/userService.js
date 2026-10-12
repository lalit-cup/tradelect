import api from './api';

export const userService = {
  getMyProfile: () => api.get('/api/users/me'),
  updateProfile: (data) => api.put('/api/users/me', data),
  getAllUsers: (params) => api.get('/api/users', { params }),
  deactivateUser: (id) => api.delete(`/api/users/${id}`),
};
