import React, { useState } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';
import { formatPrice } from '../../utils/formatters';

export default function BidModal({ product, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ offerPrice: '', quantity: 1, message: '', deliveryAddress: '', contactPerson: '', contactPhone: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.offerPrice || !form.quantity) { toast.error('Price and quantity are required'); return; }
    setLoading(true);
    try {
      await orderService.placeBid({ ...form, productId: product.id, productName: product.name, partNumber: product.partNumber });
      toast.success('Bid submitted successfully!');
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit bid');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 500, padding: 28, animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>💼 Place a Bid</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{product.name}</div>
          <div style={{ color: '#64748b' }}>Part#: {product.partNumber} | Listed: {formatPrice(product.price)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Your Offer Price (₹)*', key: 'offerPrice', type: 'number', placeholder: 'Enter your offer price' },
            { label: 'Quantity*', key: 'quantity', type: 'number', placeholder: '1' },
            { label: 'Message to Seller', key: 'message', type: 'textarea', placeholder: 'Any special requirements...' },
            { label: 'Delivery Address', key: 'deliveryAddress', type: 'text', placeholder: 'Shipping address' },
            { label: 'Contact Person', key: 'contactPerson', type: 'text', placeholder: 'Name' },
            { label: 'Contact Phone', key: 'contactPhone', type: 'text', placeholder: '+91 XXXXX XXXXX' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              {type === 'textarea'
                ? <textarea className="input" rows={2} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ resize: 'vertical' }} />
                : <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              }
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ flex: 1 }}>
              {loading ? '...' : '🚀 Submit Bid'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
