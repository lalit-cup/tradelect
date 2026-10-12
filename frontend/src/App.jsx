import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import Register from './pages/auth/Register';

// Public pages
import Home from './pages/Home';
import Contact from './pages/Contact';
import Brands from './pages/Brands';
import Products from './pages/products/Products';
import ProductDetail from './pages/products/ProductDetail';

// User pages
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/orders/Wishlist';
import MyBids from './pages/orders/MyBids';
import MyEnquiries from './pages/orders/MyEnquiries';
import MyOrders from './pages/orders/MyOrders';
import Profile from './pages/user/Profile';
import Notifications from './pages/Notifications';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBids from './pages/admin/AdminBids';
import AdminEnquiries from './pages/admin/AdminEnquiries';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPurchases from './pages/admin/AdminPurchases';

function PublicLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function DashboardLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, background: '#f8fafc' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 } }} />
      <Routes>
        {/* Auth routes - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />

        {/* Public routes with Navbar + Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Protected routes with Sidebar dashboard layout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/my-enquiries" element={<MyEnquiries />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Admin + Dealer shared */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'DEALER']} loginPath="/admin/login">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'DEALER']} loginPath="/admin/login">
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/products/new" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'DEALER']} loginPath="/admin/login">
              <AdminProducts openAdd />
            </ProtectedRoute>
          } />

          {/* Admin-only */}
          <Route path="/admin/bids" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} loginPath="/admin/login">
              <AdminBids />
            </ProtectedRoute>
          } />
          <Route path="/admin/enquiries" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} loginPath="/admin/login">
              <AdminEnquiries />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} loginPath="/admin/login">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/wishlists" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} loginPath="/admin/login">
              <Wishlist />
            </ProtectedRoute>
          } />
          <Route path="/admin/purchases" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} loginPath="/admin/login">
              <AdminPurchases />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
