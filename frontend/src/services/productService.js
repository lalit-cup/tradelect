import api from './api';

export const productService = {
  getProducts:      (params) => api.get('/api/products', { params }),
  getProduct:       (id)     => api.get(`/api/products/${id}`),
  getProductByPart: (pn)     => api.get(`/api/products/part/${pn}`),
  getFeatured:      ()       => api.get('/api/products/featured'),
  getBrands:        ()       => api.get('/api/products/brands'),
  getCategories:    ()       => api.get('/api/products/categories'),
  createProduct:    (data)   => api.post('/api/products', data),
  updateProduct:    (id, data) => api.put(`/api/products/${id}`, data),
  deleteProduct:    (id)     => api.delete(`/api/products/${id}`),
  getMyListings:    (params) => api.get('/api/products/seller/my-listings', { params }),
  importProducts:   (file)   => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/products/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () =>
    api.get('/api/products/import/template', { responseType: 'blob' }),
};
