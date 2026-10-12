import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../../services/productService';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import ImportProductsModal from '../../components/product/ImportProductsModal';

// ─── Default brand / category lists (used when backend returns nothing) ──────
const DEFAULT_BRANDS = ['ABB','Siemens','Schneider Electric','Legrand','Havells','L&T','Hager','Eaton','Rockwell Automation','Honeywell','Phoenix Contact','Omron','Mitsubishi Electric','Delta','Fuji Electric'];
const DEFAULT_CATEGORIES = ['Circuit Breakers','Switchgear','Contactors & Relays','MCBs & MCCBs','Drives & VFDs','PLCs & HMIs','Sensors & Switches','Power Supplies','Cables & Wires','Distribution Boards','Motor Control','Automation Components','Safety Equipment','Lighting Controls','Energy Meters'];

const EMPTY_FORM = {
  name:'', partNumber:'', brand:'', category:'', subCategory:'',
  modelNumber:'', description:'', price:'', discountPrice:'',
  stockQuantity:'0', dataSheetUrl:'',
  imageUrls:[''], specifications:[{ key:'', value:'' }],
};

const STEPS = [
  { label:'Basic Info',      icon:'📋' },
  { label:'Pricing & Stock', icon:'💰' },
  { label:'Images & Specs',  icon:'🖼' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            <div style={{
              width:34, height:34, borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:13, transition:'all 0.25s',
              background: i < step ? '#10b981' : i === step ? '#1e40af' : '#e2e8f0',
              color: i <= step ? 'white' : '#94a3b8',
              boxShadow: i === step ? '0 0 0 4px rgba(30,64,175,0.18)' : 'none',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize:11, whiteSpace:'nowrap', fontWeight: i === step ? 700 : 500,
              color: i === step ? '#1e40af' : i < step ? '#10b981' : '#94a3b8' }}>
              {s.icon} {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex:1, height:2, margin:'0 8px', marginBottom:20,
              background: i < step ? '#10b981' : '#e2e8f0', transition:'background 0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Err({ msg }) {
  return msg ? <div style={{ color:'#ef4444', fontSize:12, marginTop:4, fontWeight:500 }}>⚠ {msg}</div> : null;
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{ display:'block', fontWeight:600, fontSize:13, color:'#374151', marginBottom:6 }}>
        {label}{required && <span style={{ color:'#ef4444' }}> *</span>}
      </label>
      {children}
      <Err msg={error} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminProducts({ openAdd: autoOpenAdd }) {
  const toast = useToast();

  const [products, setProducts]         = useState([]);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [brandOptions, setBrandOptions] = useState(DEFAULT_BRANDS);
  const [catOptions, setCatOptions]     = useState(DEFAULT_CATEGORIES);

  // Modal state
  const [modal, setModal]   = useState(null);   // null | 'add' | product-object
  const [form, setForm]     = useState(EMPTY_FORM);
  const [step, setStep]     = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Load brands / categories from backend (fall back to defaults if empty)
  useEffect(() => {
    productService.getBrands().then(r => { const d = r.data?.data; if (d?.length) setBrandOptions(d); }).catch(() => {});
    productService.getCategories().then(r => { const d = r.data?.data; if (d?.length) setCatOptions(d); }).catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productService.getMyListings({ page, size: 15 })
      .then(r => { setProducts(r.data?.data || []); setTotalPages(r.data?.totalPages || 0); setTotalElements(r.data?.totalElements || 0); })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Auto-open add modal if /admin/products/new
  useEffect(() => { if (autoOpenAdd) openAdd(); }, [autoOpenAdd]);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setStep(0); setErrors({}); setModal('add'); };

  const openEdit = (p) => {
    setForm({
      name:         p.name         || '',
      partNumber:   p.partNumber   || '',
      brand:        p.brand        || '',
      category:     p.category     || '',
      subCategory:  p.subCategory  || '',
      modelNumber:  p.modelNumber  || '',
      description:  p.description  || '',
      dataSheetUrl: p.dataSheetUrl || '',
      price:        p.price?.toString()        || '',
      discountPrice:p.discountPrice?.toString()|| '',
      stockQuantity:p.stockQuantity?.toString()|| '0',
      imageUrls:    p.imageUrls?.length ? p.imageUrls : [''],
      specifications: p.specifications
        ? Object.entries(p.specifications).map(([key, value]) => ({ key, value: value || '' }))
        : [{ key:'', value:'' }],
    });
    setStep(0); setErrors({}); setModal(p);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setImg  = (i, v) => setForm(f => { const a=[...f.imageUrls]; a[i]=v; return {...f,imageUrls:a}; });
  const addImg  = ()    => setForm(f => ({ ...f, imageUrls:[...f.imageUrls,''] }));
  const delImg  = (i)   => setForm(f => ({ ...f, imageUrls: f.imageUrls.length>1 ? f.imageUrls.filter((_,j)=>j!==i) : [''] }));
  const setSpec = (i,k,v) => setForm(f => { const a=[...f.specifications]; a[i]={...a[i],[k]:v}; return {...f,specifications:a}; });
  const addSpec = ()    => setForm(f => ({ ...f, specifications:[...f.specifications,{key:'',value:''}] }));
  const delSpec = (i)   => setForm(f => ({ ...f, specifications: f.specifications.length>1 ? f.specifications.filter((_,j)=>j!==i) : [{key:'',value:''}] }));

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.name.trim())       e.name       = 'Product name is required';
      if (!form.partNumber.trim()) e.partNumber  = 'Part number is required';
      if (!form.brand.trim())      e.brand       = 'Brand is required';
      if (!form.category.trim())   e.category    = 'Category is required';
    }
    if (s === 1) {
      if (!form.price || isNaN(+form.price) || +form.price <= 0)
        e.price = 'Valid price is required';
      if (form.discountPrice && +form.discountPrice >= +form.price)
        e.discountPrice = 'Discount price must be less than MRP';
      if (form.stockQuantity !== '' && (isNaN(+form.stockQuantity) || +form.stockQuantity < 0))
        e.stockQuantity = 'Must be 0 or more';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate(step)) return;
    setSaving(true);
    try {
      const specsMap = {};
      form.specifications.forEach(({ key, value }) => { if (key.trim() && value.trim()) specsMap[key.trim()] = value.trim(); });
      const images = form.imageUrls.map(u => u.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(), partNumber: form.partNumber.trim(),
        brand: form.brand.trim(), category: form.category.trim(),
        subCategory: form.subCategory.trim() || null,
        modelNumber: form.modelNumber.trim() || null,
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        dataSheetUrl: form.dataSheetUrl.trim() || null,
        imageUrls: images.length ? images : null,
        specifications: Object.keys(specsMap).length ? specsMap : null,
      };
      if (modal === 'add') {
        await productService.createProduct(payload);
        toast.success('✅ Product created successfully!');
      } else {
        await productService.updateProduct(modal.id, payload);
        toast.success('✅ Product updated successfully!');
      }
      setModal(null);
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return;
    try { await productService.deleteProduct(id); toast.success('Product deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete product'); }
  };

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = search
    ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()))
    : products;

  // ── Input style helper ───────────────────────────────────────────────────────
  const inp = (err) => ({
    width:'100%', padding:'10px 14px', fontSize:14, outline:'none',
    border:`2px solid ${err ? '#ef4444' : '#e2e8f0'}`,
    borderRadius:8, background:'white', fontFamily:'inherit', transition:'border-color 0.2s', boxSizing:'border-box',
  });

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding:32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:4 }}>🔌 Product Listings</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>{totalElements} product{totalElements !== 1 ? 's' : ''} listed</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-outline" onClick={() => setImportOpen(true)} style={{ gap:8 }}>📊 Import Excel</button>
          <button className="btn btn-primary" onClick={openAdd} style={{ gap:8, fontSize:15, padding:'10px 22px' }}>
            <span style={{ fontSize:20, lineHeight:1, fontWeight:300 }}>+</span> Add Product
          </button>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <input className="input" placeholder="🔍  Search by name, part number or brand…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ maxWidth:420, marginBottom:20 }} />

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60 }}><Spinner size={36} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:80 }}>
          <div style={{ fontSize:72, marginBottom:16, opacity:0.2 }}>🔌</div>
          <h3 style={{ fontSize:20, fontWeight:700, color:'#1e293b', marginBottom:8 }}>
            {search ? 'No products match your search' : 'No products yet'}
          </h3>
          {!search && (
            <>
              <p style={{ color:'#64748b', marginBottom:24 }}>Add your first product listing to get started</p>
              <button className="btn btn-primary btn-lg" onClick={openAdd}>+ Add Your First Product</button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ overflow:'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Part #</th>
                  <th>Brand / Category</th>
                  <th>MRP</th>
                  <th>Discount Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {p.imageUrls?.[0] ? (
                          <img src={p.imageUrls[0]} alt="" style={{ width:38, height:38, borderRadius:7, objectFit:'cover', background:'#f1f5f9', flexShrink:0, border:'1px solid #e2e8f0' }} onError={e => { e.target.style.display='none'; }} />
                        ) : (
                          <div style={{ width:38, height:38, borderRadius:7, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🔌</div>
                        )}
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                          {p.modelNumber && <div style={{ fontSize:11, color:'#94a3b8' }}>Model: {p.modelNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'#475569' }}>{p.partNumber}</td>
                    <td>
                      <div><span className="badge badge-info" style={{ fontSize:10 }}>{p.brand}</span></div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{p.category}</div>
                    </td>
                    <td style={{ fontWeight:700, color:'#1e293b', fontSize:13 }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight:700, color: p.discountPrice ? '#059669' : '#cbd5e1', fontSize:13 }}>
                      {p.discountPrice ? `₹${Number(p.discountPrice).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ fontSize:13, fontWeight:600 }}>{p.stockQuantity ?? '—'}</td>
                    <td>
                      <span className={`badge ${p.stockStatus === 'IN_STOCK' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize:10 }}>
                        {p.stockStatus === 'IN_STOCK' ? '● In Stock' : '○ Out of Stock'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'#94a3b8' }}>{formatDate(p.createdAt)}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)} title="Edit">✏️</button>
                        <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#ef4444', border:'none' }} onClick={() => handleDelete(p.id)} title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {/* ══ Add / Edit Modal ══════════════════════════════════════════════════ */}
      {modal !== null && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', zIndex:9999,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:16, overflowY:'auto', backdropFilter:'blur(3px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="card"
            style={{ width:'100%', maxWidth:660, padding:'36px 40px', margin:'auto',
              animation:'fadeIn 0.2s ease', maxHeight:'90vh', overflowY:'auto' }}>

            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <h3 style={{ fontWeight:800, fontSize:21, color:'#1e293b' }}>
                  {modal === 'add' ? '➕ Add New Product' : `✏️ Edit: ${modal.name}`}
                </h3>
                <p style={{ color:'#64748b', fontSize:13, marginTop:3 }}>
                  {modal === 'add' ? 'Fill in all required fields to list your product' : 'Update product details below'}
                </p>
              </div>
              <button onClick={() => setModal(null)}
                style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer',
                  fontSize:16, color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
            </div>

            <StepBar step={step} />

            {/* ── Step 0: Basic Info ─────────────────────────────────────── */}
            {step === 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <Field label="Product Name" required error={errors.name}>
                  <input style={inp(errors.name)} placeholder="e.g. Siemens 3RT2 Contactor 9A 4kW"
                    value={form.name} onChange={e => setF('name', e.target.value)}
                    onFocus={e => e.target.style.borderColor='#1e40af'}
                    onBlur={e => e.target.style.borderColor = errors.name ? '#ef4444' : '#e2e8f0'} />
                </Field>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <Field label="Part Number" required error={errors.partNumber}>
                    <input style={inp(errors.partNumber)} placeholder="e.g. 3RT2015-1BB41"
                      value={form.partNumber} onChange={e => setF('partNumber', e.target.value)} />
                  </Field>
                  <Field label="Model Number">
                    <input style={inp()} placeholder="e.g. 3RT2015"
                      value={form.modelNumber} onChange={e => setF('modelNumber', e.target.value)} />
                  </Field>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <Field label="Brand" required error={errors.brand}>
                    <input list="brand-dl" style={inp(errors.brand)} placeholder="e.g. Siemens"
                      value={form.brand} onChange={e => setF('brand', e.target.value)} />
                    <datalist id="brand-dl">{brandOptions.map(b => <option key={b} value={b} />)}</datalist>
                  </Field>
                  <Field label="Category" required error={errors.category}>
                    <input list="cat-dl" style={inp(errors.category)} placeholder="e.g. Contactors & Relays"
                      value={form.category} onChange={e => setF('category', e.target.value)} />
                    <datalist id="cat-dl">{catOptions.map(c => <option key={c} value={c} />)}</datalist>
                  </Field>
                </div>

                <Field label="Sub-Category">
                  <input style={inp()} placeholder="e.g. Power Contactors"
                    value={form.subCategory} onChange={e => setF('subCategory', e.target.value)} />
                </Field>

                <Field label="Description">
                  <textarea style={{ ...inp(), resize:'vertical', minHeight:90 }} rows={4}
                    placeholder="Features, certifications, applications…"
                    value={form.description} onChange={e => setF('description', e.target.value)} />
                  <div style={{ textAlign:'right', fontSize:11, color:'#94a3b8', marginTop:3 }}>{form.description.length}/2000</div>
                </Field>
              </div>
            )}

            {/* ── Step 1: Pricing & Stock ────────────────────────────────── */}
            {step === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <Field label="MRP / List Price (₹)" required error={errors.price}>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#64748b', fontWeight:700 }}>₹</span>
                      <input style={{ ...inp(errors.price), paddingLeft:28 }} type="number" min="0" step="0.01" placeholder="0.00"
                        value={form.price} onChange={e => setF('price', e.target.value)} />
                    </div>
                  </Field>
                  <Field label="Discount / Selling Price (₹)" error={errors.discountPrice}>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#64748b', fontWeight:700 }}>₹</span>
                      <input style={{ ...inp(errors.discountPrice), paddingLeft:28 }} type="number" min="0" step="0.01" placeholder="0.00"
                        value={form.discountPrice} onChange={e => setF('discountPrice', e.target.value)} />
                    </div>
                    {form.price && form.discountPrice && !errors.discountPrice && +form.discountPrice < +form.price && (
                      <div style={{ marginTop:4, fontSize:12, color:'#059669', fontWeight:600 }}>
                        💚 {Math.round((1 - +form.discountPrice / +form.price) * 100)}% discount
                      </div>
                    )}
                  </Field>
                </div>

                {/* Price preview */}
                {form.price && +form.price > 0 && (
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:16, border:'1px solid #e2e8f0', display:'flex', gap:28, alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', marginBottom:3 }}>List Price</div>
                      <div style={{ fontSize:22, fontWeight:900, color: form.discountPrice && +form.discountPrice < +form.price ? '#94a3b8' : '#1e40af', textDecoration: form.discountPrice && +form.discountPrice < +form.price ? 'line-through' : 'none' }}>
                        ₹{parseFloat(form.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    {form.discountPrice && +form.discountPrice < +form.price && (
                      <>
                        <div style={{ fontSize:22, color:'#e2e8f0' }}>→</div>
                        <div>
                          <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', marginBottom:3 }}>Selling Price</div>
                          <div style={{ fontSize:22, fontWeight:900, color:'#059669' }}>₹{parseFloat(form.discountPrice).toLocaleString('en-IN')}</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <Field label="Stock Quantity" error={errors.stockQuantity}>
                    <input style={inp(errors.stockQuantity)} type="number" min="0" placeholder="0"
                      value={form.stockQuantity} onChange={e => setF('stockQuantity', e.target.value)} />
                  </Field>
                  <div>
                    <label style={{ display:'block', fontWeight:600, fontSize:13, color:'#374151', marginBottom:6 }}>Stock Status (auto)</label>
                    <div style={{ padding:'10px 14px', borderRadius:8, border:'2px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
                      {parseInt(form.stockQuantity) > 0
                        ? <><span style={{ color:'#059669', fontSize:18 }}>●</span><span style={{ color:'#059669', fontWeight:700 }}>In Stock</span></>
                        : <><span style={{ color:'#ef4444', fontSize:18 }}>○</span><span style={{ color:'#ef4444', fontWeight:700 }}>Out of Stock</span></>
                      }
                    </div>
                  </div>
                </div>

                <Field label="Data Sheet / Document URL">
                  <input style={inp()} placeholder="https://example.com/datasheet.pdf"
                    value={form.dataSheetUrl} onChange={e => setF('dataSheetUrl', e.target.value)} />
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Optional PDF link for technical datasheet</div>
                </Field>
              </div>
            )}

            {/* ── Step 2: Images & Specs ─────────────────────────────────── */}
            {step === 2 && (
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

                {/* Image URLs */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <label style={{ fontWeight:600, fontSize:13, color:'#374151' }}>Product Images</label>
                    <button type="button" onClick={addImg}
                      style={{ background:'#eff6ff', color:'#1e40af', border:'none', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      + Add URL
                    </button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {form.imageUrls.map((url, i) => (
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{ width:42, height:42, borderRadius:7, border:'1px solid #e2e8f0', overflow:'hidden', flexShrink:0, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {url
                            ? <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} />
                            : <span style={{ fontSize:18, opacity:0.4 }}>🖼</span>
                          }
                        </div>
                        <input style={{ ...inp(), flex:1 }} placeholder={`Image ${i+1} URL — https://…`}
                          value={url} onChange={e => setImg(i, e.target.value)} />
                        <button type="button" onClick={() => delImg(i)}
                          style={{ background:'#fee2e2', border:'none', borderRadius:6, width:34, height:34, cursor:'pointer', color:'#ef4444', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                    Paste direct HTTPS image URLs. First image is used as thumbnail.
                  </div>
                </div>

                <hr style={{ border:'none', borderTop:'1px solid #f1f5f9' }} />

                {/* Technical Specifications */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div>
                      <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block' }}>Technical Specifications</label>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Key–value pairs e.g. "Rated Current" → "9A"</div>
                    </div>
                    <button type="button" onClick={addSpec}
                      style={{ background:'#eff6ff', color:'#1e40af', border:'none', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      + Add Spec
                    </button>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 34px', gap:8, padding:'0 0 4px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', paddingLeft:4 }}>Parameter</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', paddingLeft:4 }}>Value</div>
                      <div />
                    </div>
                    {form.specifications.map((spec, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 34px', gap:8, alignItems:'center' }}>
                        <input style={inp()} placeholder="e.g. Rated Current"
                          value={spec.key} onChange={e => setSpec(i,'key',e.target.value)} />
                        <input style={inp()} placeholder="e.g. 9A"
                          value={spec.value} onChange={e => setSpec(i,'value',e.target.value)} />
                        <button type="button" onClick={() => delSpec(i)}
                          style={{ background:'#fee2e2', border:'none', borderRadius:6, width:34, height:34, cursor:'pointer', color:'#ef4444', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Spec preview pills */}
                  {form.specifications.some(s => s.key && s.value) && (
                    <div style={{ marginTop:14, background:'#f8fafc', borderRadius:8, padding:12, border:'1px solid #e2e8f0' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:8, letterSpacing:'0.04em' }}>Preview</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {form.specifications.filter(s => s.key && s.value).map((s, i) => (
                          <div key={i} style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:6, padding:'4px 10px', fontSize:12 }}>
                            <span style={{ color:'#64748b' }}>{s.key}:</span>
                            <strong style={{ color:'#1e293b', marginLeft:4 }}>{s.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Navigation buttons ─────────────────────────────────────── */}
            <div style={{ display:'flex', gap:10, marginTop:28, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
              {step > 0 ? (
                <button className="btn btn-outline" style={{ flex:1 }} onClick={prev}>← Back</button>
              ) : (
                <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setModal(null)}>Cancel</button>
              )}
              {step < STEPS.length - 1 ? (
                <button className="btn btn-primary" style={{ flex:2 }} onClick={next}>
                  Continue → {STEPS[step+1].label}
                </button>
              ) : (
                <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><Spinner size={16} color="white" /> Saving…</>
                    : modal === 'add' ? '💾 Create Product' : '💾 Save Changes'
                  }
                </button>
              )}
            </div>
            <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#94a3b8' }}>
              Step {step + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      )}
      {importOpen && <ImportProductsModal onClose={() => setImportOpen(false)} onSuccess={() => { setImportOpen(false); fetchProducts(); }} />}
    </div>
  );
}
