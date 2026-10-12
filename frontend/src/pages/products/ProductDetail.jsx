import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import BidModal from '../../components/order/BidModal';
import EnquiryModal from '../../components/order/EnquiryModal';
import BuyModal from '../../components/order/BuyModal';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatPrice } from '../../utils/formatters';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer, isDealer, isAdmin } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [bidOpen, setBidOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [tab, setTab] = useState('specs');

  useEffect(() => {
    productService.getProduct(id)
      .then(r => setProduct(r.data?.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isCustomer) { toast.error('Only customers can add to wishlist'); return; }
    try {
      await orderService.addToWishlist({ productId: product.id, productName: product.name, partNumber: product.partNumber, brand: product.brand, quantity: 1 });
      toast.success('✅ Added to wishlist!');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add to wishlist'); }
  };

  const handleBuy = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isCustomer) { toast.error('Only customers can purchase products'); return; }
    setBuyOpen(true);
  };

  const handleBid = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isDealer) { toast.error('Only dealers can place bids'); return; }
    setBidOpen(true);
  };

  const handleEnquiry = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setEnquiryOpen(true);
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:100 }}><Spinner size={48} /></div>;
  if (!product) return <div style={{ textAlign:'center', paddingTop:80 }}><h2>Product not found</h2></div>;

  const images = product.imageUrls?.length ? product.imageUrls : [null];
  const inStock = product.stockStatus === 'IN_STOCK';

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:24, fontSize:13, color:'#64748b' }}>
        <span onClick={() => navigate('/products')} style={{ cursor:'pointer', color:'#1e40af' }}>Products</span>
        <span>›</span><span>{product.category}</span><span>›</span>
        <span style={{ color:'#1e293b', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300 }}>{product.name}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:40, marginBottom:40 }}>
        {/* Images */}
        <div>
          <div style={{ background:'white', borderRadius:16, padding:24, border:'1px solid #e2e8f0', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', minHeight:320 }}>
            {images[activeImg]
              ? <img src={images[activeImg]} alt={product.name} style={{ maxHeight:300, maxWidth:'100%', objectFit:'contain' }} onError={e => { e.target.style.display='none'; }} />
              : <div style={{ fontSize:100, opacity:0.15 }}>🔌</div>}
          </div>
          {images.length > 1 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width:64, height:64, border:`2px solid ${i===activeImg?'#1e40af':'#e2e8f0'}`, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'white', overflow:'hidden' }}>
                  {img ? <img src={img} alt="" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:20, opacity:0.3 }}>🔌</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <span className="badge badge-info">{product.brand}</span>
            <span className="badge badge-gray">{product.category}</span>
            <span className={`badge ${inStock ? 'badge-success' : 'badge-danger'}`}>
              {inStock ? '✓ In Stock' : '✗ Out of Stock'}
            </span>
          </div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:12, lineHeight:1.3 }}>{product.name}</h1>

          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20, color:'#64748b', fontSize:14 }}>
            <div>Part Number: <strong style={{ color:'#1e293b' }}>{product.partNumber}</strong></div>
            {product.modelNumber && <div>Model: <strong style={{ color:'#1e293b' }}>{product.modelNumber}</strong></div>}
            {product.subCategory && <div>Sub-Category: <strong style={{ color:'#1e293b' }}>{product.subCategory}</strong></div>}
            {product.stockQuantity !== undefined && inStock && (
              <div>Stock: <strong style={{ color:'#059669' }}>{product.stockQuantity} units available</strong></div>
            )}
          </div>

          {/* Price */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:20, marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
              <span style={{ fontSize:32, fontWeight:900, color:'#1e40af' }}>{formatPrice(product.discountPrice || product.price)}</span>
              {product.discountPrice && (
                <>
                  <span style={{ fontSize:18, color:'#94a3b8', textDecoration:'line-through' }}>{formatPrice(product.price)}</span>
                  <span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:700 }}>
                    {Math.round(((product.price-product.discountPrice)/product.price)*100)}% OFF
                  </span>
                </>
              )}
            </div>
            {product.rating && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
                <span style={{ color:'#f59e0b' }}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5-Math.round(product.rating))}</span>
                <span style={{ color:'#64748b', fontSize:13 }}>{product.rating} ({product.reviewCount} reviews)</span>
              </div>
            )}
          </div>

          {product.description && <p style={{ color:'#475569', fontSize:14, lineHeight:1.7, marginBottom:24 }}>{product.description}</p>}

          {/* ── Action buttons ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

            {/* CUSTOMER actions */}
            {isCustomer && (
              <>
                <button className="btn btn-primary btn-lg" style={{ justifyContent:'center' }}
                  onClick={handleBuy} disabled={!inStock}>
                  🛒 {inStock ? 'Buy Now' : 'Out of Stock'}
                </button>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={handleWishlist}>♡ Add to Wishlist</button>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={handleEnquiry}>📧 Enquire</button>
                </div>
              </>
            )}

            {/* DEALER actions */}
            {isDealer && (
              <>
                <button className="btn btn-secondary btn-lg" style={{ justifyContent:'center' }} onClick={handleBid}>
                  💼 Place Bid
                </button>
                <button className="btn btn-outline" style={{ justifyContent:'center' }} onClick={handleEnquiry}>
                  📧 Send Enquiry
                </button>
              </>
            )}

            {/* Not logged in */}
            {!isAuthenticated && (
              <>
                <button className="btn btn-primary btn-lg" style={{ justifyContent:'center' }} onClick={() => navigate('/login')}>
                  🛒 Buy Now — Login Required
                </button>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={() => navigate('/login')}>♡ Wishlist</button>
                  <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => navigate('/login')}>💼 Bid</button>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={() => navigate('/login')}>📧 Enquire</button>
                </div>
              </>
            )}

            {product.dataSheetUrl && (
              <a href={product.dataSheetUrl} target="_blank" rel="noreferrer"
                className="btn btn-outline btn-sm" style={{ justifyContent:'center' }}>
                📄 Download Datasheet
              </a>
            )}
          </div>

          {/* Role badge */}
          {isAuthenticated && (
            <div style={{ marginTop:12, fontSize:12, color:'#94a3b8', textAlign:'center' }}>
              Logged in as <span style={{ fontWeight:700, color:isCustomer?'#059669':isDealer?'#7c3aed':'#1e40af' }}>
                {isCustomer?'Customer':isDealer?'Dealer':'Admin'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0' }}>
          {[['specs','📋 Specifications'],['about','ℹ️ About']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'14px 24px', background:'none', border:'none', borderBottom:tab===t?'2px solid #1e40af':'2px solid transparent', fontWeight:tab===t?700:500, color:tab===t?'#1e40af':'#64748b', cursor:'pointer', fontSize:14 }}>{l}</button>
          ))}
        </div>
        <div style={{ padding:24 }}>
          {tab==='specs'
            ? product.specifications && Object.keys(product.specifications).length > 0
              ? <table className="table"><tbody>{Object.entries(product.specifications).map(([k,v]) => (
                  <tr key={k}><td style={{ fontWeight:600, width:'35%', color:'#374151' }}>{k}</td><td style={{ color:'#475569' }}>{v}</td></tr>
                ))}</tbody></table>
              : <p style={{ color:'#94a3b8' }}>No specifications available.</p>
            : <p style={{ color:'#475569', lineHeight:1.8 }}>{product.description || 'No description available.'}</p>
          }
        </div>
      </div>

      {buyOpen     && <BuyModal product={product} onClose={() => setBuyOpen(false)} onSuccess={() => navigate('/my-orders')} />}
      {bidOpen     && <BidModal product={product} onClose={() => setBidOpen(false)} />}
      {enquiryOpen && <EnquiryModal product={product} onClose={() => setEnquiryOpen(false)} />}
    </div>
  );
}
