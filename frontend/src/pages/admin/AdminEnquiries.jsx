import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

const STATUS_CFG = {
  OPEN:        { bg: '#dbeafe', color: '#1e40af' },
  RESOLVED:    { bg: '#d1fae5', color: '#065f46' },
  IN_PROGRESS: { bg: '#ede9fe', color: '#5b21b6' },
  CLOSED:      { bg: '#f1f5f9', color: '#475569' },
};

export default function AdminEnquiries() {
  const toast = useToast();
  const [enquiries, setEnquiries]   = useState([]);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [sending, setSending]       = useState(false);

  const fetchData = () => {
    setLoading(true);
    orderService.adminGetEnquiries({ page, size: 15 })
      .then(r => {
        setEnquiries(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalElements(r.data?.totalElements || 0);
      })
      .catch(() => toast.error('Failed to load enquiries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleReply = async () => {
    if (!replyText.trim()) { toast.error('Enter a reply message'); return; }
    setSending(true);
    try {
      await orderService.adminReplyEnquiry(selected.id, replyText);
      // Send notification to the user who made the enquiry
      if (selected.userId) {
        try {
          await notificationService.sendNotification({
            userId: String(selected.userId),
            title:  'Enquiry Reply',
            message: `Your enquiry "${selected.subject}" has received a reply.`,
            type:   'ENQUIRY_REPLY',
          });
        } catch { /* Kafka also fires — silent HTTP fallback failure ok */ }
      }
      toast.success('✅ Reply sent! User has been notified.');
      setSelected(null);
      setReplyText('');
      fetchData();
    } catch { toast.error('Failed to send reply'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>📧 Manage Enquiries</h2>
        <p style={{ color: '#64748b' }}>{totalElements} total enquiries</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
      ) : enquiries.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📧</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>No enquiries yet</h3>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enquiries.map(e => {
              const sc = STATUS_CFG[e.status] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <div key={e.id} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <h4 style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{e.subject}</h4>
                        <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{e.status}</span>
                      </div>
                      <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{e.message}</p>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                        {e.contactName  && <span>👤 {e.contactName}</span>}
                        {e.contactEmail && <span>✉️ {e.contactEmail}</span>}
                        {e.contactPhone && <span>📞 {e.contactPhone}</span>}
                        <span>📅 {formatDate(e.createdAt)}</span>
                      </div>
                      {e.adminReply && (
                        <div style={{ marginTop: 12, background: '#eff6ff', borderRadius: 8, padding: 12, borderLeft: '3px solid #1e40af', fontSize: 13 }}>
                          <strong style={{ color: '#1e40af' }}>Your Reply: </strong>{e.adminReply}
                        </div>
                      )}
                    </div>
                    {e.status !== 'RESOLVED' && (
                      <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}
                        onClick={() => { setSelected(e); setReplyText(''); }}>
                        Reply
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

      {/* Reply Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 28 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 16 }}>Reply to Enquiry</h3>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
              <strong>{selected.subject}</strong>
              <p style={{ color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>{selected.message}</p>
            </div>
            <div>
              <label className="label">Your Reply</label>
              <textarea className="input" rows={5} value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write your reply here..." />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReply} disabled={sending}>
                {sending ? '...' : '📨 Send Reply & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
