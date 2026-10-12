import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import { productService } from '../../services/productService';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';

const GRAFANA_URL = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3001';

const STATUS_COLORS = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  ACCEPTED: { bg: '#d1fae5', text: '#065f46' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  OPEN: { bg: '#dbeafe', text: '#1e40af' },
  RESOLVED: { bg: '#d1fae5', text: '#065f46' },
};

export default function AdminDashboard() {
  const { isAdmin, isDealer, user } = useAuth();
  const [stats, setStats]           = useState({ bids: 0, enquiries: 0, wishlists: 0, users: 0, products: 0, orders: 0 });
  const [recentBids, setRecentBids] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (isDealer && !isAdmin) {
      productService.getMyListings({ page: 0, size: 1 })
        .then(r => setStats(s => ({ ...s, products: r.data?.totalElements || 0 })))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        orderService.adminGetBids({ page: 0, size: 5 }),
        orderService.adminGetEnquiries({ page: 0, size: 5 }),
        orderService.adminGetWishlists({ page: 0, size: 1 }),
        userService.getAllUsers({ page: 0, size: 1 }),
        productService.getMyListings({ page: 0, size: 1 }),
        orderService.adminGetPurchases({ page: 0, size: 1 }),
      ]).then(([b, e, w, u, p, o]) => {
        setStats({ bids: b.data?.totalElements || 0, enquiries: e.data?.totalElements || 0, wishlists: w.data?.totalElements || 0, users: u.data?.totalElements || 0, products: p.data?.totalElements || 0, orders: o.data?.totalElements || 0 });
        setRecentBids(b.data?.data || []);
        setRecentEnquiries(e.data?.data || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isAdmin, isDealer]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={40} /></div>;

  /* ── DEALER dashboard ───────────────────────────────────────────────── */
  if (isDealer && !isAdmin) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>🔌 Dealer Dashboard</h1>
          <p style={{ color: '#64748b' }}>Welcome back, {user?.fullName}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
          <Link to="/admin/products" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, background: '#eff6ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔌</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>{stats.products}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>My Products</div>
              </div>
            </div>
          </Link>
        </div>
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/admin/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>🔌 Manage Products</Link>
            <Link to="/admin/products" className="btn btn-outline" style={{ textDecoration: 'none' }}>+ Add New Product</Link>
          </div>
        </div>
        <GrafanaPanel />
      </div>
    );
  }

  /* ── ADMIN dashboard ────────────────────────────────────────────────── */
  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>🛠 Admin Dashboard</h1>
        <p style={{ color: '#64748b' }}>Welcome back, {user?.fullName} · {user?.role}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Orders',       value: stats.orders,    icon: '🛒', color: '#0891b2', to: '/admin/purchases' },
          { label: 'Total Bids',   value: stats.bids,      icon: '💼', color: '#7c3aed', to: '/admin/bids' },
          { label: 'Enquiries',    value: stats.enquiries,  icon: '📧', color: '#059669', to: '/admin/enquiries' },
          { label: 'Wishlists',    value: stats.wishlists,  icon: '♡',  color: '#dc2626', to: '/admin/wishlists' },
          { label: 'Users',        value: stats.users,      icon: '👥', color: '#0891b2', to: '/admin/users' },
          { label: 'Products',     value: stats.products,   icon: '🔌', color: '#1e40af', to: '/admin/products' },
        ].map(s => (
          <Link key={s.label} to={s.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, background: s.color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, color: '#1e293b' }}>Recent Bids</h3>
            <Link to="/admin/bids" style={{ fontSize: 13, color: '#1e40af', textDecoration: 'none', fontWeight: 600 }}>Manage All →</Link>
          </div>
          {recentBids.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>No bids yet</p>
          ) : recentBids.map(b => {
            const sc = STATUS_COLORS[b.status] || { bg: '#f1f5f9', text: '#475569' };
            return (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{b.productName || 'N/A'}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>₹{b.offerPrice?.toLocaleString('en-IN')} × {b.quantity} · {formatDate(b.createdAt)}</div>
                </div>
                <span style={{ background: sc.bg, color: sc.text, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{b.status}</span>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, color: '#1e293b' }}>Recent Enquiries</h3>
            <Link to="/admin/enquiries" style={{ fontSize: 13, color: '#1e40af', textDecoration: 'none', fontWeight: 600 }}>Manage All →</Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>No enquiries yet</p>
          ) : recentEnquiries.map(e => {
            const sc = STATUS_COLORS[e.status] || { bg: '#f1f5f9', text: '#475569' };
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{e.subject}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{e.contactEmail || '—'} · {formatDate(e.createdAt)}</div>
                </div>
                <span style={{ background: sc.bg, color: sc.text, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{e.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grafana analytics section */}
      <GrafanaPanel />
    </div>
  );
}

function GrafanaPanel() {
  const [grafanaUp, setGrafanaUp] = useState(false);

  useEffect(() => {
    fetch(`${GRAFANA_URL}/api/health`, { mode: 'no-cors' })
      .then(() => setGrafanaUp(true))
      .catch(() => setGrafanaUp(false));
  }, []);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>📊 Analytics & Monitoring</h3>
          <p style={{ color: '#64748b', fontSize: 13 }}>Live platform metrics via Grafana + Prometheus</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`${GRAFANA_URL}/d/tradelect-overview`} target="_blank" rel="noopener noreferrer"
            className="btn btn-outline btn-sm">📊 Platform Overview</a>
          <a href={`${GRAFANA_URL}/d/tradelect-products`} target="_blank" rel="noopener noreferrer"
            className="btn btn-outline btn-sm">🔌 Products & Bids</a>
          <a href={`${GRAFANA_URL}`} target="_blank" rel="noopener noreferrer"
            className="btn btn-primary btn-sm">Open Grafana →</a>
        </div>
      </div>

      {/* Quick links grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Prometheus Metrics', url: 'http://localhost:9090', icon: '🔥', desc: 'Raw metrics & alerts' },
          { label: 'Grafana Dashboards', url: GRAFANA_URL, icon: '📈', desc: 'admin / tradelect123' },
          { label: 'Platform Overview', url: `${GRAFANA_URL}/d/tradelect-overview`, icon: '🌐', desc: 'Services health & HTTP stats' },
          { label: 'Products Dashboard', url: `${GRAFANA_URL}/d/tradelect-products`, icon: '🔌', desc: 'Bids, enquiries, notifications' },
          { label: 'Eureka Registry', url: 'http://localhost:8761', icon: '🗂', desc: 'Service discovery' },
          { label: 'Actuator Health', url: 'http://localhost:8080/actuator/health', icon: '💚', desc: 'Gateway health check' },
        ].map(link => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', transition: 'all 0.2s', display: 'block' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{link.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{link.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{link.desc}</div>
          </a>
        ))}
      </div>

      {!grafanaUp && (
        <div style={{ marginTop: 16, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#c2410c' }}>
          ⚠ Grafana not detected at {GRAFANA_URL}. Run <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>docker-compose up -d prometheus grafana</code> from the project root to start monitoring.
        </div>
      )}
    </div>
  );
}
