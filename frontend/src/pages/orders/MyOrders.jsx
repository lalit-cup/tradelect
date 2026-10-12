import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatPrice, formatDate, formatDateTime } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

const STATUS_CFG = {
  PENDING:   { bg:'#fef3c7', color:'#92400e', icon:'⏳', label:'Pending Confirmation' },
  CONFIRMED: { bg:'#dbeafe', color:'#1e40af', icon:'✅', label:'Confirmed' },
  SHIPPED:   { bg:'#ede9fe', color:'#5b21b6', icon:'🚚', label:'Shipped' },
  DELIVERED: { bg:'#d1fae5', color:'#065f46', icon:'📦', label:'Delivered' },
  CANCELLED: { bg:'#fee2e2', color:'#991b1b', icon:'❌', label:'Cancelled' },
  REFUNDED:  { bg:'#f1f5f9', color:'#475569', icon:'↩️', label:'Refunded' },
};

const PAY_CFG = {
  ONLINE:  { bg:'#d1fae5', color:'#065f46', icon:'💳', label:'Paid Online' },
  COD:     { bg:'#fff7ed', color:'#92400e', icon:'💵', label:'Cash on Delivery' },
};

const PAY_STATUS_CFG = {
  PAID:        { color:'#059669', icon:'✅' },
  COD_PENDING: { color:'#f59e0b', icon:'⏳' },
  FAILED:      { color:'#ef4444', icon:'❌' },
  REFUNDED:    { color:'#6366f1', icon:'↩️' },
};

const STEPS = ['PENDING','CONFIRMED','SHIPPED','DELIVERED'];

function calcBusinessDays(fromDate, toDate) {
  if (!fromDate || !toDate) return null;
  const from = new Date(fromDate);
  const to   = new Date(toDate);
  let days = 0;
  const cur = new Date(from);
  while (cur < to) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days++;
  }
  return days;
}

export default function MyOrders() {
  const toast  = useToast();
  const { isCustomer, isAuthenticated } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');

  // Role guard
  if (isAuthenticated && !isCustomer) {
    return (
      <div style={{ padding:32, textAlign:'center', paddingTop:80 }}>
        <div style={{ fontSize:64, marginBottom:16, opacity:0.2 }}>🛒</div>
        <h3 style={{ fontSize:20, fontWeight:700, color:'#1e293b', marginBottom:8 }}>Orders are for Customers</h3>
        <p style={{ color:'#64748b', marginBottom:24 }}>Dealer accounts manage bids instead of direct orders.</p>
        <Link to="/my-bids" className="btn btn-primary" style={{ textDecoration:'none' }}>💼 Go to My Bids</Link>
      </div>
    );
  }

  const fetchOrders = () => {
    setLoading(true);
    orderService.getMyPurchases({ page, size: 10 })
      .then(r => {
        setOrders(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalElements(r.data?.totalElements || 0);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [page]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order? This action cannot be undone.')) return;
    try { await orderService.cancelPurchase(id); toast.success('Order cancelled'); fetchOrders(); }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot cancel this order'); }
  };

  const displayed = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);
  const counts    = orders.reduce((a, o) => { a[o.status] = (a[o.status]||0)+1; return a; }, {});

  return (
    <div style={{ padding:32, maxWidth:1000, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:4 }}>🛒 My Orders</h2>
          <p style={{ color:'#64748b' }}>{totalElements} total order{totalElements !== 1?'s':''}</p>
        </div>
        <Link to="/products" className="btn btn-primary" style={{ textDecoration:'none' }}>+ Shop More</Link>
      </div>

      {/* Status filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['ALL',...Object.keys(STATUS_CFG)].map(s => {
          const cfg = STATUS_CFG[s] || { bg:'#f1f5f9', color:'#475569', icon:'📋', label:'All' };
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'6px 14px', borderRadius:20, border:`1.5px solid ${active?cfg.color:'#e2e8f0'}`,
              background: active ? cfg.bg : 'white', color: active ? cfg.color : '#64748b',
              fontWeight: active?700:500, fontSize:12, cursor:'pointer', transition:'all 0.2s',
            }}>
              {s==='ALL' ? '📋 All' : `${cfg.icon} ${cfg.label}`}
              {s!=='ALL' && counts[s] ? ` (${counts[s]})` : ''}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60 }}><Spinner size={36} /></div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:80 }}>
          <div style={{ fontSize:64, marginBottom:16, opacity:0.2 }}>🛒</div>
          <h3 style={{ fontSize:20, fontWeight:700, color:'#1e293b', marginBottom:8 }}>
            {filter==='ALL' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
          </h3>
          {filter==='ALL'
            ? <><p style={{ color:'#64748b', marginBottom:24 }}>Start shopping to place your first order</p>
                <Link to="/products" className="btn btn-primary" style={{ textDecoration:'none' }}>🔌 Browse Products</Link></>
            : <button className="btn btn-outline" onClick={()=>setFilter('ALL')}>View All Orders</button>
          }
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {displayed.map(order => {
              const sc = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
              const pc = PAY_CFG[order.paymentMethod] || PAY_CFG.COD;
              const psc = PAY_STATUS_CFG[order.paymentStatus] || { color:'#94a3b8', icon:'⏳' };
              const stepIdx = STEPS.indexOf(order.status);
              const daysLeft = order.expectedDeliveryDate && order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
                ? calcBusinessDays(new Date(), order.expectedDeliveryDate) : null;

              return (
                <div key={order.id} className="card" style={{ padding:0, overflow:'hidden' }}>

                  {/* Card top strip */}
                  <div style={{ background: sc.bg, borderBottom:`2px solid ${sc.color}20`, padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{sc.icon}</span>
                      <div>
                        <span style={{ fontWeight:800, fontSize:15, color:'#1e293b' }}>{order.productName}</span>
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Order #{order.id} · {formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ background:sc.bg, color:sc.color, padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, border:`1px solid ${sc.color}40` }}>
                        {sc.icon} {sc.label}
                      </span>
                      <span style={{ background:pc.bg, color:pc.color, padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600 }}>
                        {pc.icon} {pc.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding:20 }}>

                    {/* Price + payment status */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                      <div style={{ display:'flex', gap:20, fontSize:13, color:'#64748b', flexWrap:'wrap' }}>
                        {order.partNumber && <span>Part#: <strong style={{ color:'#1e293b' }}>{order.partNumber}</strong></span>}
                        {order.brand && <span className="badge badge-info" style={{ fontSize:11 }}>{order.brand}</span>}
                        <span>{order.quantity} unit{order.quantity>1?'s':''} × {formatPrice(order.unitPrice)}</span>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:24, fontWeight:900, color:'#1e40af' }}>{formatPrice(order.totalAmount)}</div>
                        <div style={{ fontSize:12, color:psc.color, fontWeight:600 }}>{psc.icon} Payment: {order.paymentStatus?.replace('_',' ')}</div>
                      </div>
                    </div>

                    {/* Order progress bar */}
                    {stepIdx >= 0 && !['CANCELLED','REFUNDED'].includes(order.status) && (
                      <div style={{ marginBottom:20 }}>
                        <div style={{ display:'flex', alignItems:'flex-start' }}>
                          {STEPS.map((step, i) => {
                            const passed = i <= stepIdx;
                            const stepCfg = STATUS_CFG[step];
                            return (
                              <React.Fragment key={step}>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:60 }}>
                                  <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                                    background: passed ? '#1e40af' : '#f1f5f9', color: passed ? 'white' : '#94a3b8',
                                    border: i===stepIdx ? '3px solid #93c5fd' : 'none', transition:'all 0.3s' }}>
                                    {passed ? (i===stepIdx ? stepCfg.icon : '✓') : i+1}
                                  </div>
                                  <span style={{ fontSize:10, textAlign:'center', fontWeight: i===stepIdx?700:500,
                                    color: passed ? '#1e40af' : '#94a3b8', lineHeight:1.3 }}>
                                    {stepCfg.label}
                                  </span>
                                </div>
                                {i < STEPS.length-1 && (
                                  <div style={{ flex:1, height:3, margin:'14px 4px 0', borderRadius:2,
                                    background: i < stepIdx ? '#1e40af' : '#f1f5f9', transition:'background 0.4s' }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Delivery info grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:16 }}>

                      {/* Expected delivery */}
                      <div style={{ background:'#f0fdf4', borderRadius:10, padding:12, border:'1px solid #bbf7d0' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#065f46', textTransform:'uppercase', marginBottom:4 }}>📅 Expected Delivery</div>
                        {order.expectedDeliveryDate ? (
                          <>
                            <div style={{ fontWeight:700, color:'#059669', fontSize:14 }}>
                              {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long' })}
                            </div>
                            <div style={{ fontSize:11, color:'#6ee7b7', marginTop:2 }}>
                              by {new Date(order.expectedDeliveryDate).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                              {daysLeft !== null && daysLeft > 0 && <span style={{ marginLeft:6, color:'#059669' }}>({daysLeft} business day{daysLeft>1?'s':''} left)</span>}
                              {daysLeft === 0 && <span style={{ marginLeft:6, color:'#f59e0b', fontWeight:700 }}> — Due Today!</span>}
                            </div>
                          </>
                        ) : (
                          <div style={{ color:'#94a3b8', fontSize:12 }}>To be assigned</div>
                        )}
                      </div>

                      {/* Delivery address */}
                      <div style={{ background:'#f8fafc', borderRadius:10, padding:12, border:'1px solid #e2e8f0' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:4 }}>📍 Delivery Address</div>
                        <div style={{ color:'#475569', fontSize:13, lineHeight:1.4 }}>{order.deliveryAddress || '—'}</div>
                        {(order.contactName || order.contactPhone) && (
                          <div style={{ color:'#94a3b8', fontSize:11, marginTop:4 }}>
                            👤 {order.contactName} {order.contactPhone && `· ${order.contactPhone}`}
                          </div>
                        )}
                      </div>

                      {/* Delivery partner + tracking */}
                      {(order.deliveryPartner || order.trackingNumber) && (
                        <div style={{ background:'#eff6ff', borderRadius:10, padding:12, border:'1px solid #bfdbfe' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#1e40af', textTransform:'uppercase', marginBottom:4 }}>🚚 Delivery Partner</div>
                          {order.deliveryPartner && (
                            <div style={{ fontWeight:700, color:'#1e293b', fontSize:14, marginBottom:4 }}>
                              {order.deliveryPartner}
                            </div>
                          )}
                          {order.trackingNumber && (
                            <div style={{ fontSize:12 }}>
                              <span style={{ color:'#64748b' }}>Tracking: </span>
                              <strong style={{ color:'#1e40af', fontFamily:'monospace' }}>{order.trackingNumber}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {order.notes && (
                      <div style={{ background:'#f8fafc', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#64748b', marginBottom:14, fontStyle:'italic' }}>
                        📝 {order.notes}
                      </div>
                    )}

                    {/* Actions */}
                    {order.status === 'PENDING' && (
                      <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#ef4444', border:'none' }}
                        onClick={() => handleCancel(order.id)}>
                        ❌ Cancel Order
                      </button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, color:'#059669', fontSize:13, fontWeight:600 }}>
                        <span>✅ Delivered on {order.actualDeliveryDate ? formatDate(order.actualDeliveryDate) : '—'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
