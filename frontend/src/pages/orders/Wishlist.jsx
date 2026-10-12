import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatPrice, formatDate, statusColor } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import EnquiryModal from '../../components/order/EnquiryModal';
import Spinner from '../../components/common/Spinner';

const STATUS_CFG = {
  PENDING:    { bg: '#fef3c7', color: '#92400e' },
  FULFILLED:  { bg: '#d1fae5', color: '#065f46' },
  CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
};

export default function Wishlist() {
  const toast     = useToast();
  const navigate  = useNavigate();
  const { isCustomer, isAuthenticated } = useAuth();
  const [items, setItems]             = useState([]);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [enquiryProduct, setEnquiryProduct] = useState(null);

  // Role guard — dealers / admins should not see this page
  if (isAuthenticated && !isCustomer) {
    return (
      <div style={{ padding: 32, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }}>♡</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          Wishlist is for Customers Only
        </h3>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Dealer and admin accounts use bids to manage product interest.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/my-bids')}>
          💼 Go to My Bids
        </button>
      </div>
    );
  }

  const fetchWishlist = () => {
    setLoading(true);
    orderService.getWishlist({ page, size: 10 })
      .then(r => {
        setItems(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalElements(r.data?.totalElements || 0);
      })
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, [page]);

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this item from your wishlist?')) return;
    try {
      await orderService.removeFromWishlist(id);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>♡ My Wishlist</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>{totalElements} item{totalElements !== 1 ? 's' : ''} saved</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>+ Browse Products</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }}>♡</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Your wishlist is empty</h3>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Save products you're interested in to your wishlist</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>Browse Products</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => {
              const sc = STATUS_CFG[item.status] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <div key={item.id} className="card" style={{ padding: 20, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ width: 68, height: 68, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, border: '1px solid #e2e8f0' }}>
                    🔌
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6, fontSize: 15 }}>{item.productName || 'Product'}</h4>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#64748b', flexWrap: 'wrap', alignItems: 'center' }}>
                          {item.brand && <span className="badge badge-info" style={{ fontSize: 11 }}>{item.brand}</span>}
                          {item.partNumber && <span>Part#: <strong>{item.partNumber}</strong></span>}
                          <span>Qty: <strong>{item.quantity}</strong></span>
                          <span>Saved: {formatDate(item.createdAt)}</span>
                        </div>
                        {item.notes && (
                          <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                            📝 {item.notes}
                          </p>
                        )}
                        {item.deliveryAddress && (
                          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>📍 {item.deliveryAddress}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        {item.price && (
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e40af' }}>{formatPrice(item.price)}</div>
                        )}
                        <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      {item.productId && (
                        <Link to={`/products/${item.productId}`} className="btn btn-primary btn-sm" style={{ textDecoration:'none' }}>
                          🛒 View & Buy
                        </Link>
                      )}
                      <button className="btn btn-outline btn-sm"
                        onClick={() => setEnquiryProduct({ id: item.productId, name: item.productName, partNumber: item.partNumber })}>
                        📧 Enquire About This
                      </button>
                      <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }}
                        onClick={() => handleRemove(item.id)}>
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {enquiryProduct && (
        <EnquiryModal product={enquiryProduct} onClose={() => setEnquiryProduct(null)} onSuccess={fetchWishlist} />
      )}
    </div>
  );
}
