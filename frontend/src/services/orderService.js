import api from './api';

export const orderService = {
  // ── Wishlist (Customer only) ──────────────────────────────────────────────
  addToWishlist:    (data)    => api.post('/api/orders/wishlist', data),
  getWishlist:      (params)  => api.get('/api/orders/wishlist', { params }),
  updateWishlist:   (id,data) => api.put(`/api/orders/wishlist/${id}`, data),
  removeFromWishlist:(id)     => api.delete(`/api/orders/wishlist/${id}`),

  // ── Bids (Dealer only) ────────────────────────────────────────────────────
  placeBid:         (data)    => api.post('/api/orders/bids', data),
  getMyBids:        (params)  => api.get('/api/orders/bids', { params }),
  cancelBid:        (id)      => api.delete(`/api/orders/bids/${id}`),

  // ── Enquiries (Customer + Dealer) ─────────────────────────────────────────
  postEnquiry:      (data)    => api.post('/api/orders/enquiries', data),
  getMyEnquiries:   (params)  => api.get('/api/orders/enquiries', { params }),
  updateEnquiry:    (id,data) => api.put(`/api/orders/enquiries/${id}`, data),
  deleteEnquiry:    (id)      => api.delete(`/api/orders/enquiries/${id}`),

  // ── Purchases / Buy (Customer only) ──────────────────────────────────────
  buyProduct:       (data)    => api.post('/api/orders/purchases', data),
  getMyPurchases:   (params)  => api.get('/api/orders/purchases', { params }),
  cancelPurchase:   (id)      => api.delete(`/api/orders/purchases/${id}`),

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminGetBids:             (params)         => api.get('/api/orders/admin/bids', { params }),
  adminUpdateBid:           (id,status,resp) => api.put(`/api/orders/admin/bids/${id}/status`, null, { params: { status, response: resp } }),
  adminGetEnquiries:        (params)         => api.get('/api/orders/admin/enquiries', { params }),
  adminReplyEnquiry:        (id,reply)       => api.put(`/api/orders/admin/enquiries/${id}/reply`, null, { params: { reply } }),
  adminGetWishlists:        (params)         => api.get('/api/orders/admin/wishlists', { params }),
  adminGetPurchases:        (params)         => api.get('/api/orders/admin/purchases', { params }),
  adminUpdatePurchaseStatus:(id,status)      => api.put(`/api/orders/admin/purchases/${id}/status`, null, { params: { status } }),
  adminUpdateDeliveryInfo:  (id, deliveryPartner, trackingNumber) =>
    api.put(`/api/orders/admin/purchases/${id}/delivery`, null, { params: { deliveryPartner, trackingNumber } }),
};
