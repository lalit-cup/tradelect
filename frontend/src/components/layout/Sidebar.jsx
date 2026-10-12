import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_CUSTOMER = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/products', icon: '🔌', label: 'Products' },
  { to: '/my-orders', icon: '🛒', label: 'My Orders' },
  { to: '/wishlist', icon: '♡', label: 'My Wishlist' },
  { to: '/my-enquiries', icon: '📧', label: 'Enquiries' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
];

const NAV_DEALER_USER = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/products', icon: '🔌', label: 'Products' },
  { to: '/my-bids', icon: '💼', label: 'My Bids' },
  { to: '/my-enquiries', icon: '📧', label: 'Enquiries' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/admin/products', icon: '📦', label: 'My Listings' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
];

const NAV_ADMIN = [
  { to: '/admin',            icon: '🛠', label: 'Dashboard'    },
  { to: '/admin/products',   icon: '🔌', label: 'Products'     },
  { to: '/admin/purchases',  icon: '🛒', label: 'Orders'       },
  { to: '/admin/bids',       icon: '💼', label: 'Bids'         },
  { to: '/admin/enquiries',  icon: '📧', label: 'Enquiries'    },
  { to: '/admin/wishlists',  icon: '♡',  label: 'Wishlists'    },
  { to: '/admin/users',      icon: '👥', label: 'Users'        },
  { to: '/notifications',    icon: '🔔', label: 'Notifications'},
];

const NAV_DEALER = [
  { to: '/admin', icon: '🛠', label: 'Dashboard' },
  { to: '/admin/products', icon: '🔌', label: 'My Products' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
];

export default function Sidebar() {
  const { isAdmin, isDealer } = useAuth();
  const location = useLocation();
  const navItems = isAdmin ? NAV_ADMIN : isDealer ? NAV_DEALER_USER : NAV_CUSTOMER;

  return (
    <aside style={{ width: 240, background: 'white', borderRight: '1px solid #e2e8f0', minHeight: '100vh', padding: '24px 12px', flexShrink: 0 }}>
      {navItems.map(({ to, icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            borderRadius: 10, textDecoration: 'none', marginBottom: 4,
            background: active ? '#eff6ff' : 'transparent',
            color: active ? '#1e40af' : '#64748b',
            fontWeight: active ? 700 : 500, fontSize: 14, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            {label}
            {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, background: '#1e40af', borderRadius: '50%' }} />}
          </Link>
        );
      })}

      {/* Quick Add button for admin/dealer */}
      {(isAdmin || isDealer) && (
        <div style={{ marginTop: 16, padding: '0 2px' }}>
          <Link to="/admin/products" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', borderRadius: 10, textDecoration: 'none',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: 'white', fontWeight: 700, fontSize: 13,
            boxShadow: '0 4px 12px rgba(30,64,175,0.3)',
          }}>
            <span style={{ fontSize: 18 }}>+</span> Add Product
          </Link>
        </div>
      )}
    </aside>
  );
}
