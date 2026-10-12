import React, { useState } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';

export default function EnquiryModal({ product, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ subject: product ? `Enquiry about ${product.name}` : '', message: '', contactName: '', contactEmail: '', contactPhone: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.subject || !form.message) { toast.error('Subject and message are required'); return; }
    setLoading(true);
    try {
      await orderService.postEnquiry({ ...form, productId: product?.id });
      toast.success('Enquiry submitted successfully!');
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit enquiry');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 500, padding: 28, animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>📧 Send Enquiry</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Subject*', key: 'subject', type: 'text' },
            { label: 'Message*', key: 'message', type: 'textarea' },
            { label: 'Your Name', key: 'contactName', type: 'text' },
            { label: 'Email', key: 'contactEmail', type: 'email' },
            { label: 'Phone', key: 'contactPhone', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="label">{label}</label>
              {type === 'textarea'
                ? <textarea className="input" rows={4} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                : <input className="input" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              }
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ flex: 1 }}>{loading ? '...' : '📤 Send Enquiry'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
