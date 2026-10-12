import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin, isDealer, isCustomer } = useAuth();
  const { count: cartCount } = useSelector((s) => s.cart);
  const [notifCount, setNotifCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const pollRef   = useRef(null);
  const failCount = useRef(0);        // track consecutive failures
  const MAX_FAILS = 3;                // stop polling after 3 consecutive 503s
  const POLL_MS   = 30000;            // poll every 30 seconds, not every route change

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    if (failCount.current >= MAX_FAILS) return;   // service is down, skip
    try {
      const res = await notificationService.getNotifications({ page: 0, size: 1 });
      setNotifCount(res.data?.unreadCount || 0);
      failCount.current = 0;                       // reset on success
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503 || status === 502 || !status) {
        failCount.current += 1;
        // After MAX_FAILS consecutive failures, stop silent polling
        if (failCount.current >= MAX_FAILS) {
          console.warn('[Navbar] Notification service unavailable — polling paused');
        }
      }
      // Never show an error toast here — it's a background poll
    }
  }, [isAuthenticated]);

  // Start/stop polling based on auth state
  useEffect(() => {
    if (!isAuthenticated) { setNotifCount(0); failCount.current = 0; return; }
    fetchCount();                               // immediate first fetch
    pollRef.current = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [isAuthenticated, fetchCount]);

  // Reset fail counter and re-poll once when user navigates to /notifications
  useEffect(() => {
    if (location.pathname === '/notifications' && isAuthenticated) {
      failCount.current = 0;
      fetchCount();
    }
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userMenuOpen]);

  const isOnAdminLogin = location.pathname === '/admin/login';

  return (
    <nav style={{ background:'linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)', boxShadow:'0 2px 20px rgba(0,0,0,0.15)', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'#f59e0b', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#1e3a8a', fontSize:18 }}>T</div>
          <span style={{ color:'white', fontWeight:800, fontSize:22, letterSpacing:'-0.5px' }}>Tradelect</span>
          <span style={{ color:'#93c5fd', fontSize:11, fontWeight:500, background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:12 }}>B2B</span>
        </Link>

        {/* Center nav */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }} className="nav-links">
          {[['/', 'Home'], ['/products', 'Products'], ['/brands', 'Brands'], ['/contact', 'Contact']].map(([to, label]) => (
            <Link key={to} to={to} style={{
              color: location.pathname === to ? '#fbbf24' : 'rgba(255,255,255,0.85)',
              textDecoration:'none', padding:'8px 14px', borderRadius:8, fontSize:14, fontWeight:500,
              background: location.pathname === to ? 'rgba(255,255,255,0.1)' : 'transparent', transition:'all 0.2s' }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isAuthenticated ? (
            <>
              {/* Wishlist */}
              <Link to="/wishlist" title="Wishlist"
                style={{ position:'relative', color:'white', textDecoration:'none', padding:'8px 10px', borderRadius:8, fontSize:20 }}>
                ♡
                {cartCount > 0 && (
                  <span style={{ position:'absolute', top:2, right:2, background:'#f59e0b', color:'#1e3a8a', borderRadius:'50%', width:16, height:16, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{cartCount}</span>
                )}
              </Link>

              {/* Notification bell */}
              <Link to="/notifications" title="Notifications"
                style={{ position:'relative', color:'white', textDecoration:'none', padding:'8px 10px', borderRadius:8, fontSize:18 }}>
                🔔
                {notifCount > 0 && (
                  <span style={{ position:'absolute', top:2, right:2, background:'#ef4444', color:'white', borderRadius:'50%', width:16, height:16, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Link>

              {/* User dropdown */}
              <div style={{ position:'relative' }} onMouseDown={e => e.stopPropagation()}>
                <button onClick={() => setUserMenuOpen(o => !o)}
                  style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer', color:'white', fontSize:14, fontWeight:500 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#1e3a8a', fontSize:12 }}>
                    {user?.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="nav-links">{user?.fullName?.split(' ')[0] || 'User'}</span>
                  <span style={{ fontSize:10, opacity:0.7 }}>▾</span>
                </button>

                {userMenuOpen && (
                  <div style={{ position:'absolute', right:0, top:'110%', background:'white', borderRadius:14, boxShadow:'0 12px 48px rgba(0,0,0,0.18)', minWidth:220, zIndex:999, overflow:'hidden', border:'1px solid #f1f5f9' }}>
                    <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc' }}>
                      <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>{user?.fullName}</div>
                      <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>{user?.email}</div>
                      <div style={{ marginTop:6 }}>
                        <span className="badge badge-info" style={{ fontSize:10 }}>{user?.role}</span>
                      </div>
                    </div>
                    {[
                      ['/profile',       '👤', 'My Profile'],
                      ...(isCustomer ? [
                        ['/my-orders',   '🛒', 'My Orders'],
                        ['/wishlist',    '♡',  'My Wishlist'],
                      ] : []),
                      ...(isDealer ? [
                        ['/my-bids',     '💼', 'My Bids'],
                        ['/admin/products','📦','My Listings'],
                      ] : []),
                      ['/my-enquiries', '📧', 'My Enquiries'],
                      ['/notifications', '🔔', `Notifications${notifCount > 0 ? ` (${notifCount})` : ''}`],
                      ...(isAdmin || isDealer ? [['/admin', '🛠', 'Admin Panel']] : []),
                    ].map(([to, icon, label]) => (
                      <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 18px', color:'#374151', textDecoration:'none', fontSize:14, transition:'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <span style={{ fontSize:16, width:22, textAlign:'center' }}>{icon}</span>
                        {label}
                      </Link>
                    ))}
                    <button onClick={() => { setUserMenuOpen(false); logout(); }}
                      style={{ width:'100%', textAlign:'left', padding:'10px 18px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:14, borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:16, width:22, textAlign:'center' }}>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                style={{ color:'rgba(255,255,255,0.85)', textDecoration:'none', padding:'8px 16px', borderRadius:8, fontSize:14, fontWeight:500 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                Login
              </Link>
              {!isOnAdminLogin && (
                <Link to="/admin/login"
                  style={{ color:'rgba(255,255,255,0.75)', textDecoration:'none', padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500, border:'1px solid rgba(255,255,255,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}>
                  🛠 Admin
                </Link>
              )}
              <Link to="/register"
                style={{ background:'#f59e0b', color:'#1e3a8a', textDecoration:'none', padding:'8px 18px', borderRadius:8, fontSize:14, fontWeight:700 }}
                onMouseEnter={e => e.currentTarget.style.background='#d97706'}
                onMouseLeave={e => e.currentTarget.style.background='#f59e0b'}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
