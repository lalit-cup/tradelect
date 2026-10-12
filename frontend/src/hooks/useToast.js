import toast from 'react-hot-toast';

export const useToast = () => ({
  success: (msg) => toast.success(msg, { duration: 3000, position: 'top-right' }),
  error: (msg) => toast.error(msg, { duration: 4000, position: 'top-right' }),
  info: (msg) => toast(msg, { icon: 'ℹ️', position: 'top-right' }),
  loading: (msg) => toast.loading(msg, { position: 'top-right' }),
  dismiss: (id) => toast.dismiss(id),
});
