import api from './api';

export const notificationService = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAllRead: () => api.put('/api/notifications/read-all'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  sendNotification: (data) => api.post('/api/notifications/send', data),
};
