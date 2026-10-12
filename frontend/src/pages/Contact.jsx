import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [sent, setSent] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Please fill all required fields'); return; }
    // In a real app this would POST to an API
    setSent(true);
    toast.success('Message sent! We\'ll get back to you shortly.');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', marginBottom: 12 }}>Contact Us</h1>
        <p style={{ color: '#64748b', fontSize: 16 }}>Get in touch with the Tradelect team</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 48, alignItems: 'start' }}>
        {/* Contact info */}
        <div>
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 20 }}>Get In Touch</h3>
            {[
              { icon: '📧', label: 'Email', value: 'info@tradelect.com' },
              { icon: '📞', label: 'Phone', value: '+91 98765 43210' },
              { icon: '📍', label: 'Address', value: 'Mumbai, Maharashtra, India' },
              { icon: '⏰', label: 'Hours', value: 'Mon–Sat, 9 AM – 6 PM IST' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', color: 'white' }}>
            <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Need a Demo?</h4>
            <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>See Tradelect in action with a personalised walkthrough for your team.</p>
            <a href="mailto:demo@tradelect.com" style={{ color: '#fbbf24', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>Schedule a Demo →</a>
          </div>
        </div>

        {/* Form */}
        {sent ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Message Sent!</h3>
            <p style={{ color: '#64748b' }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 32 }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 24 }}>Send a Message</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input className="input" placeholder="Your Company" value={form.company} onChange={e => set('company', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea className="input" rows={5} placeholder="How can we help you?" value={form.message} onChange={e => set('message', e.target.value)} style={{ resize: 'vertical' }} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>📨 Send Message</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
