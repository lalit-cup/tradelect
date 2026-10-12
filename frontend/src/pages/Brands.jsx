import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import Spinner from '../components/common/Spinner';

// Known brand styling (logo + color). Falls back to a generic plug icon for any
// brand returned by the backend that isn't in this list.
const BRAND_STYLE = {
  Siemens:              { color:'#009999', logo:'⚡' },
  ABB:                  { color:'#ff000f', logo:'🔧' },
  'Schneider Electric':  { color:'#3dcd58', logo:'🔌' },
  Schneider:            { color:'#3dcd58', logo:'🔌' },
  Legrand:              { color:'#5c2d82', logo:'💡' },
  Havells:              { color:'#e31e24', logo:'⚙️' },
  'L&T':                { color:'#004990', logo:'🏭' },
  Hager:                { color:'#e4002b', logo:'🔩' },
  Eaton:                { color:'#ffd100', logo:'⚡' },
  'Rockwell Automation': { color:'#cc0000', logo:'🤖' },
  Honeywell:            { color:'#ee3124', logo:'🌀' },
  'Phoenix Contact':    { color:'#0066b3', logo:'🔗' },
  Omron:                { color:'#00a0e3', logo:'🛠' },
  'Mitsubishi Electric': { color:'#e60012', logo:'⚙️' },
  Delta:                { color:'#0066b3', logo:'⚡' },
  'Fuji Electric':      { color:'#e2001a', logo:'🔋' },
};
const FALLBACK_STYLE = { color:'#1e40af', logo:'🔌' };

export default function Brands() {
  const [brands, setBrands]   = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getBrands()
      .then(r => setBrands(r.data?.data || []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter(b => b.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>Shop by Brand</h1>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Authorized automation & switchgear products from {brands.length || ''} trusted manufacturers
        </p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
        <input
          className="input"
          placeholder="🔍 Search brands..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 420 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={40} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }}>🔌</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            {search ? 'No brands match your search' : 'No brands available yet'}
          </h3>
          {!search && <p style={{ color: '#64748b' }}>Brands will appear here once products are listed</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 18 }}>
          {filtered.map(name => {
            const style = BRAND_STYLE[name] || FALLBACK_STYLE;
            return (
              <Link
                key={name}
                to={`/products?brand=${encodeURIComponent(name)}`}
                style={{
                  textDecoration: 'none', background: 'white', border: '2px solid #f1f5f9',
                  borderRadius: 16, padding: '28px 16px', textAlign: 'center',
                  transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = style.color;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 10px 25px ${style.color}25`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#f1f5f9';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14, background: style.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                }}>
                  {style.logo}
                </div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 12, color: style.color, fontWeight: 600 }}>View Products →</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
