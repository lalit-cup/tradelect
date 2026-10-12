import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';

export default function ProductFilters({ filters, onChange }) {
  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productService.getBrands().then(r => setBrands(r.data?.data || [])).catch(()=>{});
    productService.getCategories().then(r => setCategories(r.data?.data || [])).catch(()=>{});
  }, []);

  const set = (key, val) => onChange({ ...filters, [key]: val, page: 0 });
  const clear = () => onChange({ search:'', brand:'', category:'', stockStatus:'', minPrice:'', maxPrice:'', sortBy:'newest', page:0, size:20 });

  const activeCount = [filters.brand, filters.category, filters.stockStatus, filters.minPrice, filters.maxPrice, filters.search]
    .filter(v => v && v !== '').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Active filter count */}
      {activeCount > 0 && (
        <div style={{ background:'#eff6ff', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#1e40af', fontWeight:700 }}>{activeCount} filter{activeCount>1?'s':''} active</span>
          <button onClick={clear} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:12, fontWeight:700 }}>Clear all</button>
        </div>
      )}

      <div>
        <label className="label">Search</label>
        <input className="input" placeholder="Product name, part number…"
          value={filters.search || ''} onChange={e=>set('search',e.target.value)} />
      </div>

      <div>
        <label className="label">Brand</label>
        <select className="input" value={filters.brand || ''} onChange={e=>set('brand',e.target.value)}>
          <option value="">All Brands</option>
          {brands.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        {filters.brand && (
          <button onClick={()=>set('brand','')} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer',marginTop:4}}>✕ Clear brand</button>
        )}
      </div>

      <div>
        <label className="label">Category</label>
        <select className="input" value={filters.category || ''} onChange={e=>set('category',e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        {filters.category && (
          <button onClick={()=>set('category','')} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer',marginTop:4}}>✕ Clear category</button>
        )}
      </div>

      <div>
        <label className="label">Availability</label>
        <select className="input" value={filters.stockStatus || ''} onChange={e=>set('stockStatus',e.target.value)}>
          <option value="">All</option>
          <option value="IN_STOCK">● In Stock</option>
          <option value="OUT_OF_STOCK">○ Out of Stock</option>
        </select>
      </div>

      <div>
        <label className="label">Price Range (₹)</label>
        <div style={{display:'flex',gap:8}}>
          <input className="input" placeholder="Min" type="number" min="0"
            value={filters.minPrice || ''} onChange={e=>set('minPrice',e.target.value)} />
          <input className="input" placeholder="Max" type="number" min="0"
            value={filters.maxPrice || ''} onChange={e=>set('maxPrice',e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Sort By</label>
        <select className="input" value={filters.sortBy || 'newest'} onChange={e=>set('sortBy',e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating">Top Rated</option>
          <option value="name_asc">Name A–Z</option>
        </select>
      </div>

      <button className="btn btn-outline btn-sm" onClick={clear}>🗑 Clear All Filters</button>
    </div>
  );
}
