import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDealer = user?.role === 'DEALER';
  const isCustomer = user?.role === 'CUSTOMER';

  return { user, token, isAuthenticated, loading, logout: handleLogout, isAdmin, isDealer, isCustomer };
};
