import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import { formatPrice, formatDate } from '../utils/formatters';
import Spinner from '../components/common/Spinner';

const STATUS_COLORS = {
  PENDING:'#f59e0b', CONFIRMED:'#3b82f6', SHIPPED:'#8b5cf6',
  DELIVERED:'#10b981', CANCELLED:'#ef4444', REFUNDED:'#94a3b8',
  ACCEPTED:'#10b981', REJECTED:'#ef4444', UNDER_REVIEW:'#6366f1',
  OPEN:'#3b82f6', RESOLVED:'#10b981',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isCustomer, isDealer } = useAuth();
  const [stats, setStats]             = useState({ wishlist:0, bids:0, enquiries:0, orders:0 });
  const [recentOrders, setRecentOrders]         = useState([]);
  const [recentBids, setRecentBids]             = useState([]);
  const [recentEnquiries, setRecentEnquiries]   = useState([]);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    const calls = [];
    if (isCustomer) {
      calls.push(
        orderService.getWishlist({ page:0, size:1 })
          .then(r => ({ type:'wishlist', total:r.data?.totalElements||0 }))
          .catch(()=>({ type:'wishlist', total:0 }))
      );
      calls.push(
        orderService.getMyPurchases({ page:0, size:5 })
          .then(r => ({ type:'orders', total:r.data?.totalElements||0, data:r.data?.data||[] }))
          .catch(()=>({ type:'orders', total:0, data:[] }))
      );
    }
    if (isDealer) {
      calls.push(
        orderService.getMyBids({ page:0, size:5 })
          .then(r => ({ type:'bids', total:r.data?.totalElements||0, data:r.data?.data||[] }))
          .catch(()=>({ type:'bids', total:0, data:[] }))
      );
    }
    calls.push(
      orderService.getMyEnquiries({ page:0, size:5 })
        .then(r => ({ type:'enquiries', total:r.data?.totalElements||0, data:r.data?.data||[] }))
        .catch(()=>({ type:'enquiries', total:0, data:[] }))
    );

    Promise.all(calls).then(results => {
      const s = { wishlist:0, bids:0, enquiries:0, orders:0 };
      let orders=[], bids=[], enquiries=[];
      results.forEach(r => {
        if (r.type==='wishlist')   s.wishlist   = r.total;
        if (r.type==='orders')     { s.orders   = r.total; orders   = r.data; }
        if (r.type==='bids')       { s.bids     = r.total; bids     = r.data; }
        if (r.type==='enquiries')  { s.enquiries= r.total; enquiries= r.data; }
      });
      setStats(s);
      setRecentOrders(orders);
      setRecentBids(bids);
      setRecentEnquiries(enquiries);
    }).finally(() => setLoading(false));
  }, [isCustomer, isDealer]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Spinner size={40} /></div>
  );

  const statCards = [
    isCustomer && { label:'My Orders',     value:stats.orders,    icon:'🛒', color:'#1e40af', to:'/my-orders'     },
    isCustomer && { label:'Wishlist',       value:stats.wishlist,  icon:'♡',  color:'#dc2626', to:'/wishlist'       },
    isDealer   && { label:'My Bids',        value:stats.bids,      icon:'💼', color:'#7c3aed', to:'/my-bids'        },
    {              label:'Enquiries',       value:stats.enquiries, icon:'📧', color:'#059669', to:'/my-enquiries'   },
  ].filter(Boolean);

  const quickActions = [
    { label:'🔌 Browse Products', to:'/products',      cls:'btn-primary'  },
    isCustomer && { label:'🛒 My Orders',   to:'/my-orders',    cls:'btn-outline'  },
    isCustomer && { label:'♡ Wishlist',     to:'/wishlist',     cls:'btn-outline'  },
    isDealer   && { label:'💼 My Bids',     to:'/my-bids',      cls:'btn-secondary'},
    isDealer   && { label:'📦 My Listings', to:'/admin/products',cls:'btn-outline' },
    { label:'📧 Enquiries', to:'/my-enquiries', cls:'btn-outline' },
    { label:'🔔 Notifications', to:'/notifications', cls:'btn-outline' },
  ].filter(Boolean);

  const ORDER_STATUS_ICONS = { PENDING:'⏳', CONFIRMED:'✅', SHIPPED:'🚚', DELIVERED:'📦', CANCELLED:'❌' };

  return (
    <div style={{ padding:32, maxWidth:1100, margin:'0 auto' }}>

      {/* Welcome */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:'#1e293b', marginBottom:4 }}>
          👋 Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p style={{ color:'#64748b' }}>
          {user?.companyName || 'Tradelect'} ·{' '}
          <span style={{ fontWeight:700, color:isCustomer?'#059669':isDealer?'#7c3aed':'#1e40af' }}>
            {isCustomer?'Customer':isDealer?'Dealer':'Admin'}
          </span>
        </p>
      </div>

      {/* Role banner */}
      {isCustomer && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 18px', marginBottom:24, fontSize:13, color:'#1e40af', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>ℹ️</span>
          As a <strong>Customer</strong>, you can <strong>Buy</strong> products, add them to your <strong>Wishlist</strong>, and send <strong>Enquiries</strong>.
        </div>
      )}
      {isDealer && (
        <div style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:10, padding:'12px 18px', marginBottom:24, fontSize:13, color:'#5b21b6', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>ℹ️</span>
          As a <strong>Dealer</strong>, you can <strong>Place Bids</strong>, manage your <strong>Product Listings</strong>, and send <strong>Enquiries</strong>.
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:20, marginBottom:32 }}>
        {statCards.map(s => (
          <Link key={s.label} to={s.to} style={{ textDecoration:'none' }}>
            <div className="card" style={{ padding:22, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:48, height:48, background:s.color+'18', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding:24, marginBottom:28 }}>
        <h3 style={{ fontWeight:700, marginBottom:14, color:'#1e293b' }}>Quick Actions</h3>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {quickActions.map(a => (
            <Link key={a.label} to={a.to} className={`btn ${a.cls}`} style={{ textDecoration:'none' }}>{a.label}</Link>
          ))}
        </div>
      </div>

      {/* Recent activity grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

        {/* Recent Orders — customers */}
        {isCustomer && (
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:700, color:'#1e293b' }}>🛒 Recent Orders</h3>
              <Link to="/my-orders" style={{ fontSize:13, color:'#1e40af', textDecoration:'none', fontWeight:600 }}>View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:13 }}>
                No orders yet.{' '}
                <Link to="/products" style={{ color:'#1e40af' }}>Browse products</Link>
              </div>
            ) : recentOrders.map(o => (
              <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', marginBottom:2 }}>{o.productName}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{formatDate(o.createdAt)} · {o.quantity} × {formatPrice(o.unitPrice)}</div>
                </div>
                <span style={{ background:(STATUS_COLORS[o.status]||'#94a3b8')+'20', color:STATUS_COLORS[o.status]||'#64748b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>
                  {ORDER_STATUS_ICONS[o.status]||''} {o.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Wishlist — customers */}
        {isCustomer && (
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:700, color:'#1e293b' }}>♡ Wishlist</h3>
              <Link to="/wishlist" style={{ fontSize:13, color:'#1e40af', textDecoration:'none', fontWeight:600 }}>View All →</Link>
            </div>
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:44, fontWeight:900, color:'#dc2626', marginBottom:6 }}>{stats.wishlist}</div>
              <div style={{ color:'#64748b', fontSize:13 }}>products saved</div>
              <Link to="/products" className="btn btn-outline btn-sm" style={{ marginTop:14, textDecoration:'none', display:'inline-block' }}>+ Add More</Link>
            </div>
          </div>
        )}

        {/* Recent Bids — dealers */}
        {isDealer && (
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:700, color:'#1e293b' }}>💼 Recent Bids</h3>
              <Link to="/my-bids" style={{ fontSize:13, color:'#1e40af', textDecoration:'none', fontWeight:600 }}>View All →</Link>
            </div>
            {recentBids.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:13 }}>
                No bids yet.{' '}<Link to="/products" style={{ color:'#1e40af' }}>Browse products</Link>
              </div>
            ) : recentBids.map(b => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', marginBottom:2 }}>{b.productName||'Product'}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{formatDate(b.createdAt)} · {formatPrice(b.offerPrice)}</div>
                </div>
                <span style={{ background:(STATUS_COLORS[b.status]||'#94a3b8')+'20', color:STATUS_COLORS[b.status]||'#64748b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>{b.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent Enquiries */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h3 style={{ fontWeight:700, color:'#1e293b' }}>📧 Recent Enquiries</h3>
            <Link to="/my-enquiries" style={{ fontSize:13, color:'#1e40af', textDecoration:'none', fontWeight:600 }}>View All →</Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:13 }}>No enquiries yet.</div>
          ) : recentEnquiries.map(e => (
            <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{e.subject}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{formatDate(e.createdAt)}</div>
              </div>
              <span style={{ background:(STATUS_COLORS[e.status]||'#94a3b8')+'20', color:STATUS_COLORS[e.status]||'#64748b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, marginLeft:8 }}>{e.status}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
