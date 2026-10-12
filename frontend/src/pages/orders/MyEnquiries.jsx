import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';
import { formatDate, statusColor } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import EnquiryModal from '../../components/order/EnquiryModal';
import Spinner from '../../components/common/Spinner';

export default function MyEnquiries() {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetch = () => {
    setLoading(true);
    orderService.getMyEnquiries({ page, size: 10 })
      .then(r => { setEnquiries(r.data?.data || []); setTotalPages(r.data?.totalPages || 0); setTotalElements(r.data?.totalElements || 0); })
      .catch(() => toast.error('Failed to load enquiries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await orderService.deleteEnquiry(id); toast.success('Enquiry deleted'); fetch(); }
    catch { toast.error('Failed to delete'); }
  };

  const STATUS_COLORS = { OPEN: '#3b82f6', IN_PROGRESS: '#8b5cf6', RESOLVED: '#10b981', CLOSED: '#94a3b8' };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>📧 My Enquiries</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>{totalElements} enquiries submitted</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewOpen(true)}>+ New Enquiry</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
      : enquiries.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📧</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>No enquiries yet</h3>
          <button className="btn btn-primary" onClick={() => setNewOpen(true)}>Send Your First Enquiry</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {enquiries.map(e => (
              <div key={e.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h4 style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{e.subject}</h4>
                      <span style={{ background: (STATUS_COLORS[e.status] || '#94a3b8') + '20', color: STATUS_COLORS[e.status] || '#64748b', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{e.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Submitted {formatDate(e.createdAt)}</div>
                    {expanded === e.id && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>YOUR MESSAGE</div>
                          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{e.message}</p>
                        </div>
                        {e.adminReply && (
                          <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14, borderLeft: '3px solid #1e40af' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>ADMIN REPLY</div>
                            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{e.adminReply}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ color: '#94a3b8', fontSize: 18 }}>{expanded === e.id ? '▲' : '▼'}</span>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }}
                      onClick={ev => { ev.stopPropagation(); handleDelete(e.id); }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {newOpen && <EnquiryModal product={null} onClose={() => setNewOpen(false)} onSuccess={fetch} />}
    </div>
  );
}
