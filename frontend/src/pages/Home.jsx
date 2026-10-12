import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import { useAuth } from '../hooks/useAuth';
import BidModal from '../components/order/BidModal';
import EnquiryModal from '../components/order/EnquiryModal';
import { orderService } from '../services/orderService';
import { useToast } from '../hooks/useToast';

const BRANDS = [
  { name:'Siemens',   color:'#009999', logo:'⚡' },
  { name:'ABB',       color:'#ff000f', logo:'🔧' },
  { name:'Schneider', color:'#3dcd58', logo:'🔌' },
  { name:'Legrand',   color:'#5c2d82', logo:'💡' },
  { name:'Havells',   color:'#e31e24', logo:'⚙️' },
  { name:'L&T',       color:'#004990', logo:'🏭' },
  { name:'Hager',     color:'#e4002b', logo:'🔩' },
  { name:'Eaton',     color:'#ffd100', logo:'⚡' },
];

const CATEGORIES = [
  { name:'Circuit Breakers',    icon:'⚡', count:'2,400+' },
  { name:'Switchgear',          icon:'🔌', count:'1,800+' },
  { name:'Drives & Automation', icon:'⚙️', count:'3,200+' },
  { name:'Contactors & Relays', icon:'🔧', count:'1,500+' },
  { name:'MCBs & MCCBs',        icon:'💡', count:'900+'   },
  { name:'PLC & HMI',           icon:'🖥', count:'2,100+' },
];

export default function Home() {
  const [featured, setFeatured]             = useState([]);
  const [bidProduct, setBidProduct]         = useState(null);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [search, setSearch]                 = useState('');
  const { isAuthenticated, isCustomer, isDealer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  useEffect(() => {
    productService.getFeatured().then(r => setFeatured(r.data?.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => { e.preventDefault(); navigate(`/products?search=${search}`); };

  const handleWishlist = async (product) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isCustomer) { toast.error('Only customers can add to wishlist'); return; }
    try {
      await orderService.addToWishlist({ productId: product.id, productName: product.name, partNumber: product.partNumber, brand: product.brand, quantity: 1 });
      toast.success('✅ Added to wishlist!');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add to wishlist'); }
  };

  const handleBid = (product) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isDealer) { toast.error('Only dealers can place bids'); return; }
    setBidProduct(product);
  };

  const handleEnquiry = (product) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setEnquiryProduct(product);
  };

  return (
    <div>
      {/* Hero */}
      <section style={{ background:'linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#2563eb 100%)', color:'white', padding:'80px 20px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.4)', borderRadius:20, padding:'6px 16px', marginBottom:24, fontSize:13, fontWeight:600, color:'#fbbf24' }}>
            ⚡ India's #1 B2B Automation & Switchgear Platform
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,56px)', fontWeight:900, marginBottom:20, lineHeight:1.2 }}>
            Source Automation &<br/>Switchgear Products<br/>
            <span style={{ color:'#fbbf24' }}>Smarter & Faster</span>
          </h1>
          <p style={{ fontSize:18, opacity:0.85, marginBottom:40, maxWidth:600, margin:'0 auto 40px' }}>
            Access 10,000+ products from Siemens, ABB, Schneider, Legrand and more. Compare prices, place bids, and connect with verified dealers.
          </p>
          <form onSubmit={handleSearch} style={{ display:'flex', gap:12, maxWidth:600, margin:'0 auto 40px', flexWrap:'wrap' }}>
            <input style={{ flex:1, padding:'14px 20px', borderRadius:10, border:'none', fontSize:15, minWidth:200, outline:'none' }}
              placeholder="Search by product name, part number, brand..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-secondary btn-lg" style={{ flexShrink:0 }}>🔍 Search</button>
          </form>
          <div style={{ display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap', opacity:0.8 }}>
            {[['10K+','Products'],['500+','Brands'],['2K+','Dealers'],['50K+','Orders']].map(([n,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:900, color:'#fbbf24' }}>{n}</div>
                <div style={{ fontSize:13 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based info banner */}
      {isAuthenticated && !isAdmin && (
        <div style={{ background: isCustomer ? '#eff6ff' : '#f5f3ff', borderBottom: `1px solid ${isCustomer ? '#bfdbfe' : '#ddd6fe'}`, padding:'12px 20px', textAlign:'center', fontSize:13, color: isCustomer ? '#1e40af' : '#5b21b6' }}>
          {isCustomer
            ? '🛒 As a <strong>Customer</strong>, you can add products to your <strong>Wishlist</strong> and send <strong>Enquiries</strong>.'
            : '🔌 As a <strong>Dealer</strong>, you can <strong>Place Bids</strong> on products and send <strong>Enquiries</strong>.'
          }
        </div>
      )}

      {/* Brands */}
      <section style={{ padding:'60px 20px', background:'white' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:28, fontWeight:800, marginBottom:8, color:'#1e293b' }}>Top Brands</h2>
          <p style={{ textAlign:'center', color:'#64748b', marginBottom:40 }}>Authorized products from world-class manufacturers</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:16 }}>
            {BRANDS.map(b => (
              <Link key={b.name} to={`/products?brand=${b.name}`}
                style={{ textDecoration:'none', background:'white', border:'2px solid #f1f5f9', borderRadius:14, padding:'20px 16px', textAlign:'center', transition:'all 0.2s', display:'block' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=b.color; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#f1f5f9'; e.currentTarget.style.transform='none'; }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{b.logo}</div>
                <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>{b.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding:'60px 20px', background:'#f8fafc' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:28, fontWeight:800, marginBottom:8, color:'#1e293b' }}>Product Categories</h2>
          <p style={{ textAlign:'center', color:'#64748b', marginBottom:40 }}>Browse by product type</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
            {CATEGORIES.map(c => (
              <Link key={c.name} to={`/products?category=${c.name}`}
                style={{ textDecoration:'none', background:'white', borderRadius:14, padding:24, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'all 0.2s', display:'block' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(30,64,175,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; }}>
                <div style={{ fontSize:36, marginBottom:10 }}>{c.icon}</div>
                <div style={{ fontWeight:700, color:'#1e293b', fontSize:14, marginBottom:4 }}>{c.name}</div>
                <div style={{ color:'#1e40af', fontSize:13, fontWeight:600 }}>{c.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section style={{ padding:'60px 20px', background:'white' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
              <div>
                <h2 style={{ fontSize:28, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Featured Products</h2>
                <p style={{ color:'#64748b' }}>Hand-picked products for you</p>
              </div>
              <Link to="/products" className="btn btn-outline">View All →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
              {featured.map(p => (
                <ProductCard key={p.id} product={p}
                  onWishlist={handleWishlist}
                  onBid={handleBid}
                  onEnquiry={handleEnquiry}
                  isCustomer={isCustomer}
                  isDealer={isDealer}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding:'60px 20px', background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'white', textAlign:'center' }}>
        <h2 style={{ fontSize:32, fontWeight:800, marginBottom:12 }}>Ready to Transform Your Procurement?</h2>
        <p style={{ fontSize:16, opacity:0.8, marginBottom:32 }}>Join 50,000+ businesses sourcing smarter with Tradelect</p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/register" className="btn btn-secondary btn-lg">Get Started Free</Link>
          <Link to="/products" className="btn btn-outline btn-lg" style={{ borderColor:'rgba(255,255,255,0.5)', color:'white' }}>Browse Products</Link>
        </div>
      </section>

      {bidProduct && <BidModal product={bidProduct} onClose={() => setBidProduct(null)} />}
      {enquiryProduct && <EnquiryModal product={enquiryProduct} onClose={() => setEnquiryProduct(null)} />}
    </div>
  );
}
