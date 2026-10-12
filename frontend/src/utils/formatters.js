export const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN') : '-';

export const statusColor = (status) => {
  const map = {
    PENDING: 'badge-warning', APPROVED: 'badge-success', ACCEPTED: 'badge-success',
    REJECTED: 'badge-danger', RESOLVED: 'badge-success', OPEN: 'badge-info',
    IN_STOCK: 'badge-success', OUT_OF_STOCK: 'badge-danger', LOW_STOCK: 'badge-warning',
    ACTIVE: 'badge-success', INACTIVE: 'badge-gray', SUSPENDED: 'badge-danger',
    UNDER_REVIEW: 'badge-info', COUNTERED: 'badge-warning', FULFILLED: 'badge-success',
  };
  return map[status] || 'badge-gray';
};

export const truncate = (str, len = 80) =>
  str && str.length > len ? str.substring(0, len) + '...' : str;
