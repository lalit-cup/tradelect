import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatters';

export default function ProductCard({ product, onWishlist, onBid, onEnquiry, isCustomer, isDealer, isAdmin }) {
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div className="card" style={{ overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Image */}
      <div style={{ position:'relative', background:'#f8fafc', padding:16, minHeight:180, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {product.imageUrls?.[0]
          ? <img src={product.imageUrls[0]} alt={product.name} style={{ maxHeight:160, maxWidth:'100%', objectFit:'contain' }} onError={e => { e.target.style.display='none'; }} />
          : <div style={{ fontSize:64, opacity:0.2 }}>🔌</div>
        }
        {discount > 0 && <span style={{ position:'absolute', top:10, left:10, background:'#ef4444', color:'white', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>{discount}% OFF</span>}
        <span className={`badge ${product.stockStatus==='IN_STOCK'?'badge-success':'badge-danger'}`}
          style={{ position:'absolute', top:10, right:10, fontSize:11 }}>
          {product.stockStatus==='IN_STOCK'?'In Stock':'Out of Stock'}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding:16, flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <span className="badge badge-info" style={{ fontSize:11 }}>{product.brand}</span>
          <span style={{ color:'#94a3b8', fontSize:11 }}>{product.category}</span>
        </div>
        <Link to={`/products/${product.id}`} style={{ textDecoration:'none', color:'#1e293b', fontWeight:600, fontSize:14, lineHeight:1.4 }}>
          {product.name}
        </Link>
        <div style={{ fontSize:12, color:'#94a3b8' }}>Part#: {product.partNumber}</div>

        {/* Price */}
        <div style={{ marginTop:'auto', paddingTop:8 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontSize:18, fontWeight:800, color:'#1e40af' }}>
              {formatPrice(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && (
              <span style={{ fontSize:13, color:'#94a3b8', textDecoration:'line-through' }}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {product.rating && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
              <span style={{ color:'#f59e0b', fontSize:12 }}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5-Math.round(product.rating))}</span>
              <span style={{ color:'#94a3b8', fontSize:11 }}>({product.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Action buttons — role-aware */}
        <div style={{ display:'flex', gap:6, marginTop:8 }}>
          {/* Wishlist — only for customers (or unauthenticated → redirect to login) */}
          {(isCustomer || (!isDealer && !isAdmin)) && (
            <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => onWishlist?.(product)}>
              ♡ Wishlist
            </button>
          )}
          {/* Bid — only for dealers */}
          {(isDealer || (!isCustomer && !isAdmin)) && (
            <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={() => onBid?.(product)}>
              💼 Bid
            </button>
          )}
        </div>
        {/* Enquiry — everyone except admin */}
        {!isAdmin && (
          <button className="btn btn-outline btn-sm" style={{ width:'100%' }} onClick={() => onEnquiry?.(product)}>
            📧 Enquire
          </button>
        )}
      </div>
    </div>
  );
}
