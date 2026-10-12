import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';
import { formatPrice, formatDate, formatDateTime } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

const STATUS_CFG = {
  PENDING:   { bg:'#fef3c7', color:'#92400e', next:['CONFIRMED','CANCELLED'] },
  CONFIRMED: { bg:'#dbeafe', color:'#1e40af', next:['SHIPPED','CANCELLED']   },
  SHIPPED:   { bg:'#ede9fe', color:'#5b21b6', next:['DELIVERED']             },
  DELIVERED: { bg:'#d1fae5', color:'#065f46', next:['REFUNDED']              },
  CANCELLED: { bg:'#fee2e2', color:'#991b1b', next:[]                        },
  REFUNDED:  { bg:'#f1f5f9', color:'#475569', next:[]                        },
};

const PAY_CFG = {
  ONLINE:  { icon:'💳', color:'#059669', label:'Online' },
  COD:     { icon:'💵', color:'#f59e0b', label:'COD'    },
};

const PAY_STATUS_CFG = {
  PAID:        { color:'#059669', label:'Paid'        },
  COD_PENDING: { color:'#f59e0b', label:'COD Pending' },
  FAILED:      { color:'#ef4444', label:'Failed'      },
  REFUNDED:    { color:'#6366f1', label:'Refunded'    },
};

const DELIVERY_PARTNERS = ['Delhivery','Blue Dart','DTDC','Ekart','Xpressbees','FedEx','DHL','India Post'];

export default function AdminPurchases() {
  const toast = useToast();
  const [purchases, setPurchases]     = useState([]);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('ALL');
  const [updating, setUpdating]       = useState(null);
  // Delivery assignment modal
  const [deliveryModal, setDeliveryModal] = useState(null);
  const [dpForm, setDpForm]           = useState({ deliveryPartner:'', trackingNumber:'' });
  const [savingDelivery, setSavingDelivery] = useState(false);

  const fetchData = () => {
    setLoading(true);
    orderService.adminGetPurchases({ page, size: 20 })
      .then(r => { setPurchases(r.data?.data||[]); setTotalPages(r.data?.totalPages||0); setTotalElements(r.data?.totalElements||0); })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const updateStatus = async (id, status) => {
    setUpdating(id + status);
    try { await orderService.adminUpdatePurchaseStatus(id, status); toast.success(`Order #${id} → ${status}`); fetchData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setUpdating(null); }
  };

  const assignDelivery = async () => {
    if (!dpForm.deliveryPartner && !dpForm.trackingNumber) { toast.error('Enter at least one field'); return; }
    setSavingDelivery(true);
    try {
      await orderService.adminUpdateDeliveryInfo(deliveryModal.id, dpForm.deliveryPartner, dpForm.trackingNumber);
      toast.success(`Delivery info saved for Order #${deliveryModal.id}${dpForm.trackingNumber ? ' — auto-advanced to SHIPPED' : ''}`);
      setDeliveryModal(null);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update delivery info'); }
    finally { setSavingDelivery(false); }
  };

  const counts = purchases.reduce((a, p) => { a[p.status] = (a[p.status]||0)+1; return a; }, {});
  const displayed = filter === 'ALL' ? purchases : purchases.filter(p => p.status === filter);

  const totalRevenue    = purchases.filter(p => !['CANCELLED','REFUNDED'].includes(p.status)).reduce((s,p)=>s+parseFloat(p.totalAmount||0),0);
  const pendingRevenue  = purchases.filter(p => p.status==='PENDING').reduce((s,p)=>s+parseFloat(p.totalAmount||0),0);
  const onlinePayments  = purchases.filter(p => p.paymentMethod==='ONLINE').length;
  const codOrders       = purchases.filter(p => p.paymentMethod==='COD').length;

  return (
    <div style={{ padding:32 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:4 }}>🛒 Manage Customer Orders</h2>
        <p style={{ color:'#64748b' }}>{totalElements} total orders</p>
      </div>

      {/* Revenue + payment stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Revenue',    value:formatPrice(totalRevenue),  icon:'💰', color:'#059669' },
          { label:'Pending Revenue',  value:formatPrice(pendingRevenue),icon:'⏳', color:'#f59e0b' },
          { label:'Total Orders',     value:totalElements,              icon:'📦', color:'#1e40af' },
          { label:'Delivered',        value:counts['DELIVERED']||0,     icon:'✅', color:'#059669' },
          { label:'Online Payments',  value:onlinePayments,             icon:'💳', color:'#7c3aed' },
          { label:'COD Orders',       value:codOrders,                  icon:'💵', color:'#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, background:s.color+'18', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['ALL',...Object.keys(STATUS_CFG)].map(s => {
          const cfg = STATUS_CFG[s] || { bg:'#f1f5f9', color:'#64748b' };
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding:'6px 14px', borderRadius:20, border:`1.5px solid ${active?cfg.color:'#e2e8f0'}`,
              background: active?cfg.bg:'white', color: active?cfg.color:'#64748b',
              fontWeight: active?700:500, fontSize:12, cursor:'pointer',
            }}>
              {s==='ALL' ? `All (${totalElements})` : `${s} (${counts[s]||0})`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60 }}><Spinner size={36} /></div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:60, color:'#94a3b8' }}>
          <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>🛒</div>
          <h3>No orders found</h3>
        </div>
      ) : (
        <>
          <div className="card" style={{ overflow:'auto' }}>
            <table className="table" style={{ minWidth:1100 }}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Qty / Total</th>
                  <th>Payment</th>
                  <th>Expected Delivery</th>
                  <th>Delivery Partner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(p => {
                  const sc  = STATUS_CFG[p.status]  || { bg:'#f1f5f9', color:'#64748b', next:[] };
                  const pc  = PAY_CFG[p.paymentMethod]  || PAY_CFG.COD;
                  const psc = PAY_STATUS_CFG[p.paymentStatus] || { color:'#94a3b8', label:'—' };
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight:800, color:'#1e40af', fontSize:14 }}>#{p.id}</div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{formatDate(p.createdAt)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.productName}</div>
                        {p.partNumber && <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>{p.partNumber}</div>}
                        {p.brand && <span className="badge badge-info" style={{ fontSize:10 }}>{p.brand}</span>}
                      </td>
                      <td>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{p.contactName||'—'}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>{p.contactPhone||''}</div>
                        <div style={{ fontSize:11, color:'#94a3b8', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.deliveryAddress||''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.quantity} unit{p.quantity>1?'s':''}</div>
                        <div style={{ fontWeight:800, color:'#1e40af' }}>{formatPrice(p.totalAmount)}</div>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:14 }}>{pc.icon}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:pc.color }}>{pc.label}</span>
                        </div>
                        <div style={{ fontSize:11, fontWeight:600, color:psc.color }}>{psc.label}</div>
                        {p.paymentId && <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>{p.paymentId}</div>}
                      </td>
                      <td>
                        {p.expectedDeliveryDate ? (
                          <>
                            <div style={{ fontSize:12, fontWeight:600, color:'#059669' }}>
                              {new Date(p.expectedDeliveryDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                            </div>
                            <div style={{ fontSize:10, color:'#94a3b8' }}>
                              by {new Date(p.expectedDeliveryDate).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                            </div>
                          </>
                        ) : <span style={{ color:'#94a3b8', fontSize:12 }}>—</span>}
                      </td>
                      <td>
                        {p.deliveryPartner || p.trackingNumber ? (
                          <div>
                            {p.deliveryPartner && <div style={{ fontWeight:600, fontSize:12, color:'#1e293b' }}>🚚 {p.deliveryPartner}</div>}
                            {p.trackingNumber  && <div style={{ fontSize:11, color:'#1e40af', fontFamily:'monospace' }}>{p.trackingNumber}</div>}
                          </div>
                        ) : (
                          <span style={{ color:'#94a3b8', fontSize:12 }}>Not assigned</span>
                        )}
                        {['CONFIRMED','SHIPPED'].includes(p.status) && (
                          <button className="btn btn-sm" style={{ marginTop:4, background:'#eff6ff', color:'#1e40af', border:'none', fontSize:10 }}
                            onClick={() => { setDeliveryModal(p); setDpForm({ deliveryPartner: p.deliveryPartner||'', trackingNumber: p.trackingNumber||'' }); }}>
                            ✏️ {p.deliveryPartner ? 'Update' : 'Assign'}
                          </button>
                        )}
                      </td>
                      <td>
                        <span style={{ background:sc.bg, color:sc.color, padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700, display:'block', marginBottom:6 }}>{p.status}</span>
                        {sc.next.length > 0 && (
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            {sc.next.map(next => (
                              <button key={next} className="btn btn-sm" disabled={updating===p.id+next}
                                onClick={() => updateStatus(p.id, next)}
                                style={{ fontSize:10, padding:'3px 8px',
                                  background: ['CANCELLED','REFUNDED'].includes(next) ? '#fee2e2' : '#eff6ff',
                                  color:      ['CANCELLED','REFUNDED'].includes(next) ? '#ef4444' : '#1e40af',
                                  border:'none' }}>
                                {updating===p.id+next ? '...' : `→ ${next}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {/* ── Delivery Assignment Modal ── */}
      {deliveryModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if (e.target===e.currentTarget) setDeliveryModal(null); }}>
          <div className="card" style={{ width:'100%', maxWidth:480, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontWeight:800, fontSize:18, color:'#1e293b' }}>🚚 Assign Delivery Info</h3>
              <button onClick={() => setDeliveryModal(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16, color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            {/* Order summary */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:12, marginBottom:20, fontSize:13 }}>
              <div style={{ fontWeight:700, color:'#1e293b' }}>Order #{deliveryModal.id}</div>
              <div style={{ color:'#64748b', marginTop:2 }}>{deliveryModal.productName} · {deliveryModal.contactName}</div>
              <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>📍 {deliveryModal.deliveryAddress}</div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label className="label">Delivery Partner</label>
                <select className="input" value={dpForm.deliveryPartner} onChange={e => setDpForm(f=>({...f, deliveryPartner:e.target.value}))}>
                  <option value="">Select delivery partner...</option>
                  {DELIVERY_PARTNERS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tracking Number</label>
                <input className="input" placeholder="e.g. DLVR123456789IN" value={dpForm.trackingNumber}
                  onChange={e => setDpForm(f=>({...f, trackingNumber:e.target.value}))} />
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>
                  ℹ️ Assigning a tracking number will auto-advance the order to <strong>SHIPPED</strong> and notify the customer.
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setDeliveryModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={assignDelivery} disabled={savingDelivery}>
                  {savingDelivery ? '...' : '💾 Save & Notify Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
