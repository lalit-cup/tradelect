import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatPrice, formatDate } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

const STATUS_CFG = {
  PENDING:      { bg:'#fef3c7', color:'#92400e' },
  ACCEPTED:     { bg:'#d1fae5', color:'#065f46' },
  REJECTED:     { bg:'#fee2e2', color:'#991b1b' },
  UNDER_REVIEW: { bg:'#e0e7ff', color:'#3730a3' },
  COUNTERED:    { bg:'#ede9fe', color:'#5b21b6' },
  CANCELLED:    { bg:'#f1f5f9', color:'#475569' },
};

export default function MyBids() {
  const toast    = useToast();
  const navigate = useNavigate();
  const { isDealer, isAuthenticated } = useAuth();
  const [bids, setBids]         = useState([]);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');

  // Role guard
  if (isAuthenticated && !isDealer) {
    return (
      <div style={{ padding:32, textAlign:'center', paddingTop:80 }}>
        <div style={{ fontSize:64, marginBottom:16, opacity:0.2 }}>💼</div>
        <h3 style={{ fontSize:20, fontWeight:700, color:'#1e293b', marginBottom:8 }}>Bids are for Dealers Only</h3>
        <p style={{ color:'#64748b', marginBottom:24 }}>
          Only dealer accounts can place and manage bids on products.<br/>
          As a customer, you can add products to your wishlist and send enquiries.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/wishlist')}>♡ My Wishlist</button>
          <button className="btn btn-outline" onClick={() => navigate('/my-enquiries')}>📧 My Enquiries</button>
        </div>
      </div>
    );
  }

  const fetchBids = () => {
    setLoading(true);
    orderService.getMyBids({ page, size: 10 })
      .then(r => {
        setBids(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalElements(r.data?.totalElements || 0);
      })
      .catch(() => toast.error('Failed to load bids'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBids(); }, [page]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this bid?')) return;
    try { await orderService.cancelBid(id); toast.success('Bid cancelled'); fetchBids(); }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot cancel this bid'); }
  };

  const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'UNDER_REVIEW', 'COUNTERED'];
  const displayed = filter === 'ALL' ? bids : bids.filter(b => b.status === filter);

  return (
    <div style={{ padding:32, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:4 }}>💼 My Bids</h2>
          <p style={{ color:'#64748b', fontSize:14 }}>{totalElements} total bid{totalElements !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/products" className="btn btn-primary" style={{ textDecoration:'none' }}>+ Place New Bid</Link>
      </div>

      {/* Status filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {FILTERS.map(f => {
          const sc = STATUS_CFG[f] || { bg:'#f1f5f9', color:'#475569' };
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:20, border:'1.5px solid',
              borderColor: active ? sc.color : '#e2e8f0',
              background: active ? sc.bg : 'white',
              color: active ? sc.color : '#64748b',
              fontWeight: active ? 700 : 500, fontSize:12, cursor:'pointer', transition:'all 0.2s',
            }}>
              {f === 'ALL' ? 'All' : f.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60 }}><Spinner size={36} /></div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:80 }}>
          <div style={{ fontSize:64, marginBottom:16, opacity:0.2 }}>💼</div>
          <h3 style={{ fontSize:20, fontWeight:700, color:'#1e293b', marginBottom:8 }}>
            {filter === 'ALL' ? 'No bids yet' : `No ${filter.toLowerCase()} bids`}
          </h3>
          {filter === 'ALL' ? (
            <>
              <p style={{ color:'#64748b', marginBottom:24 }}>Browse products and place your first bid</p>
              <Link to="/products" className="btn btn-primary" style={{ textDecoration:'none' }}>Browse Products</Link>
            </>
          ) : (
            <button className="btn btn-outline" onClick={() => setFilter('ALL')}>View All Bids</button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {displayed.map(bid => {
              const sc = STATUS_CFG[bid.status] || { bg:'#f1f5f9', color:'#475569' };
              return (
                <div key={bid.id} className="card" style={{ padding:22 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                        <h4 style={{ fontWeight:700, fontSize:15, color:'#1e293b' }}>{bid.productName || 'Product'}</h4>
                        <span style={{ background:sc.bg, color:sc.color, padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700 }}>{bid.status}</span>
                      </div>
                      <div style={{ display:'flex', gap:16, fontSize:12, color:'#64748b', flexWrap:'wrap', marginBottom:8 }}>
                        {bid.partNumber && <span>Part#: <strong>{bid.partNumber}</strong></span>}
                        <span>Your Offer: <strong style={{ color:'#1e40af' }}>{formatPrice(bid.offerPrice)}</strong></span>
                        <span>Qty: <strong>{bid.quantity}</strong></span>
                        <span>📅 {formatDate(bid.createdAt)}</span>
                      </div>
                      {bid.message && <p style={{ fontSize:13, color:'#475569', marginBottom:8, fontStyle:'italic' }}>"{bid.message}"</p>}
                      {bid.adminResponse && (
                        <div style={{ background:'#eff6ff', borderRadius:8, padding:'10px 14px', borderLeft:'3px solid #1e40af', fontSize:13 }}>
                          <strong style={{ color:'#1e40af' }}>Admin Response: </strong>{bid.adminResponse}
                        </div>
                      )}
                    </div>
                    {bid.status === 'PENDING' && (
                      <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#ef4444', border:'none', flexShrink:0 }}
                        onClick={() => handleCancel(bid.id)}>
                        Cancel
                      </button>
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
