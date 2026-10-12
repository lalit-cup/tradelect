import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 20px 24px', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: '#f59e0b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#0f172a', fontSize: 16 }}>T</div>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>Tradelect</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8 }}>India's premier B2B marketplace for Automation & Switchgear products. Connecting buyers and dealers across all major brands.</p>
          </div>
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Quick Links</h4>
            {[['/', 'Home'], ['/products', 'Products'], ['/brands', 'Brands'], ['/contact', 'Contact Us']].map(([to, label]) => (
              <Link key={to} to={to} style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', fontSize: 13, marginBottom: 8 }}>{label}</Link>
            ))}
          </div>
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Brands</h4>
            {['Siemens', 'ABB', 'Schneider Electric', 'Legrand', 'Havells', 'L&T'].map(b => (
              <Link key={b} to={`/products?brand=${b}`} style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', fontSize: 13, marginBottom: 8 }}>{b}</Link>
            ))}
          </div>
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Contact</h4>
            <p style={{ fontSize: 13, marginBottom: 8 }}>📧 info@tradelect.com</p>
            <p style={{ fontSize: 13, marginBottom: 8 }}>📞 +91 98765 43210</p>
            <p style={{ fontSize: 13 }}>📍 Mumbai, Maharashtra, India</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12 }}>© 2025 Tradelect. All rights reserved.</p>
          <p style={{ fontSize: 12 }}>Made with ❤️ for India's Industrial Sector</p>
        </div>
      </div>
    </footer>
  );
}
