import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../hooks/useToast';
import { formatPrice, formatDate } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

export default function AdminBids() {
  const toast = useToast();
  const [bids, setBids] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('ACCEPTED');

  const fetch = () => {
    setLoading(true);
    orderService.adminGetBids({ page, size: 15 })
      .then(r => { setBids(r.data?.data || []); setTotalPages(r.data?.totalPages || 0); setTotalElements(r.data?.totalElements || 0); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const handleUpdate = async () => {
    let notifSent = false;
    try {
      await orderService.adminUpdateBid(replyModal.id, replyStatus, replyText);
      try {
        await notificationService.sendNotification({ userId: String(replyModal.userId), title: 'Bid Update', message: `Your bid for ${replyModal.productName} has been ${replyStatus.toLowerCase()}`, type: 'BID_UPDATE' });
        notifSent = true;
      } catch { }
      toast.success(notifSent ? 'Bid updated! User has been notified.' : 'Bid updated!');
      setReplyModal(null); setReplyText(''); fetch();
    } catch { toast.error('Failed to update bid'); }
  };

  const STATUS_CONFIG = {
    PENDING: { bg: '#fef3c7', color: '#92400e' }, ACCEPTED: { bg: '#d1fae5', color: '#065f46' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b' }, UNDER_REVIEW: { bg: '#e0e7ff', color: '#3730a3' },
    COUNTERED: { bg: '#ede9fe', color: '#5b21b6' },
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>💼 Manage Bids</h2>
        <p style={{ color: '#64748b' }}>{totalElements} total bids</p>
      </div>

      {loading ? <div style={{ textAlign: 'center', paddingTop: 60 }}><Spinner size={36} /></div> : (
        <>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th><th>Offer Price</th><th>Qty</th><th>Bidder Type</th><th>Status</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(b => {
                  const sc = STATUS_CONFIG[b.status] || { bg: '#f1f5f9', color: '#475569' };
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{b.productName || '—'}</div>
                        {b.partNumber && <div style={{ fontSize: 11, color: '#64748b' }}>#{b.partNumber}</div>}
                        {b.message && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>"{b.message}"</div>}
                      </td>
                      <td style={{ fontWeight: 700, color: '#1e40af' }}>{formatPrice(b.offerPrice)}</td>
                      <td>{b.quantity}</td>
                      <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{b.bidderType || 'N/A'}</span></td>
                      <td><span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{b.status}</span></td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{formatDate(b.createdAt)}</td>
                      <td>
                        {b.status === 'PENDING' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setReplyModal(b); setReplyText(''); setReplyStatus('ACCEPTED'); }}>Review</button>
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

      {/* Reply Modal */}
      {replyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 20 }}>Review Bid: {replyModal.productName}</h3>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
              <div>Offer: <strong>{formatPrice(replyModal.offerPrice)}</strong> × {replyModal.quantity}</div>
              {replyModal.message && <div style={{ marginTop: 6, color: '#64748b' }}>Message: {replyModal.message}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Action</label>
                <select className="input" value={replyStatus} onChange={e => setReplyStatus(e.target.value)}>
                  <option value="ACCEPTED">Accept</option>
                  <option value="REJECTED">Reject</option>
                  <option value="UNDER_REVIEW">Mark Under Review</option>
                  <option value="COUNTERED">Counter Offer</option>
                </select>
              </div>
              <div>
                <label className="label">Response to Buyer</label>
                <textarea className="input" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Optional message to buyer..." />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setReplyModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdate}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
