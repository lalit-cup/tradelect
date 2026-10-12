import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';
import { formatPrice } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_YourKeyHere';
const RAZORPAY_CONFIGURED = !!RAZORPAY_KEY && RAZORPAY_KEY !== 'rzp_test_YourKeyHere' && /^rzp_(test|live)_/.test(RAZORPAY_KEY);

// Calculate expected delivery (5 business days)
function calcExpectedDelivery() {
  let date = new Date();
  let days = 0;
  while (days < 5) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) days++; // skip Sun=0, Sat=6
  }
  return date;
}

function formatDeliveryDate(date) {
  return date.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BuyModal({ product, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useAuth();
  const [step, setStep]           = useState(1); // 1=Details, 2=Payment, 3=Success
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [form, setForm] = useState({
    quantity: 1,
    deliveryAddress: '',
    contactName: user?.fullName || '',
    contactPhone: '',
    notes: '',
  });
  const [loading, setLoading]     = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const price = product.discountPrice || product.price;
  const total = parseFloat(price) * form.quantity;
  const expectedDelivery = calcExpectedDelivery();

  useEffect(() => {
    loadRazorpay().then(setRazorpayLoaded);
  }, []);

  // Validate details
  const validateDetails = () => {
    if (!form.deliveryAddress.trim()) { toast.error('Delivery address is required'); return false; }
    if (!form.contactPhone.trim()) { toast.error('Contact phone is required'); return false; }
    if (form.quantity < 1) { toast.error('Quantity must be at least 1'); return false; }
    if (product.stockQuantity !== undefined && form.quantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} units available`); return false;
    }
    return true;
  };

  // Place COD order
  const placeCodOrder = async () => {
    setLoading(true);
    try {
      const res = await orderService.buyProduct({
        productId: product.id, productName: product.name,
        partNumber: product.partNumber, brand: product.brand,
        quantity: form.quantity, unitPrice: parseFloat(price),
        deliveryAddress: form.deliveryAddress, contactName: form.contactName,
        contactPhone: form.contactPhone, notes: form.notes,
        paymentMethod: 'COD',
      });
      setOrderResult(res.data?.data);
      setStep(3);
      onSuccess?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  // Pay online via Razorpay
  const payOnline = async () => {
    if (!razorpayLoaded) { toast.error('Payment system loading, please wait...'); return; }

    // Catch unconfigured/placeholder keys before opening checkout — Razorpay
    // rejects these server-side with a generic "Payment Failed" popup that
    // gives the user no way to recover, so we intercept it here instead.
    if (!RAZORPAY_CONFIGURED) {
      toast.error('Online payment is not configured yet. Please use Cash on Delivery, or set REACT_APP_RAZORPAY_KEY to a real Razorpay key.');
      return;
    }

    setLoading(true);
    try {
      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(total * 100), // paise
        currency: 'INR',
        name: 'Tradelect',
        description: `${product.name} × ${form.quantity}`,
        image: '/logo.png',
        prefill: {
          name:  form.contactName || user?.fullName,
          email: user?.email || '',
          contact: form.contactPhone,
        },
        notes: {
          productId:   String(product.id),
          productName: product.name,
          quantity:    String(form.quantity),
        },
        theme: { color: '#1e40af' },
        handler: async (response) => {
          // Payment success — save order with payment ID
          try {
            const res = await orderService.buyProduct({
              productId: product.id, productName: product.name,
              partNumber: product.partNumber, brand: product.brand,
              quantity: form.quantity, unitPrice: parseFloat(price),
              deliveryAddress: form.deliveryAddress, contactName: form.contactName,
              contactPhone: form.contactPhone, notes: form.notes,
              paymentMethod: 'ONLINE',
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || '',
            });
            setOrderResult(res.data?.data);
            setStep(3);
            onSuccess?.();
          } catch (e) {
            toast.error('Payment received but order saving failed. Contact support with Payment ID: ' + response.razorpay_payment_id);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User closed the checkout without paying — let them retry or switch to COD
          ondismiss: () => { setLoading(false); },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        // Stay on the payment step so the user can retry or switch to COD,
        // instead of leaving them on a dead-end native alert.
        toast.error('Payment failed: ' + (response.error?.description || 'Card declined or payment cancelled. Please try again or use Cash on Delivery.'));
        setLoading(false);
      });
      rzp.open();
    } catch (e) {
      toast.error('Could not initiate payment. Please try Cash on Delivery instead.');
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!validateDetails()) return;
    if (paymentMethod === 'COD') placeCodOrder();
    else payOnline();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget && step !== 3) onClose(); }}>
      <div className="card" style={{ width:'100%', maxWidth:540, padding:0, maxHeight:'92vh', overflowY:'auto', borderRadius:16 }}>

        {/* ── Step indicator ── */}
        {step !== 3 && (
          <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1e40af)', padding:'20px 24px', borderRadius:'16px 16px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ color:'white', fontWeight:800, fontSize:18 }}>🛒 Place Order</h3>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {[['1','Details'],['2','Payment']].map(([s,l]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12,
                    background: String(step) >= s ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                    color: String(step) >= s ? '#1e3a8a' : 'rgba(255,255,255,0.6)' }}>{s}</div>
                  <span style={{ color: String(step) >= s ? 'white' : 'rgba(255,255,255,0.5)', fontSize:12, fontWeight: String(step) === s ? 700 : 400 }}>{l}</span>
                  {s === '1' && <span style={{ color:'rgba(255,255,255,0.3)', margin:'0 4px' }}>›</span>}
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'white', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        )}

        {/* ══ STEP 1: Order Details ══ */}
        {step === 1 && (
          <div style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
            {/* Product summary */}
            <div style={{ background:'#f8fafc', borderRadius:12, padding:14, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#1e293b' }}>{product.name}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>
                  {product.brand && <span>{product.brand} · </span>}
                  Part# {product.partNumber}
                  {product.stockQuantity !== undefined && (
                    <span style={{ color:'#059669', marginLeft:8 }}>✓ {product.stockQuantity} in stock</span>
                  )}
                </div>
                {product.discountPrice && (
                  <div style={{ marginTop:4, fontSize:11, color:'#94a3b8' }}>
                    <span style={{ textDecoration:'line-through' }}>{formatPrice(product.price)}</span>
                    <span style={{ background:'#fef3c7', color:'#92400e', padding:'1px 5px', borderRadius:4, marginLeft:6, fontWeight:700 }}>
                      {Math.round(((product.price-product.discountPrice)/product.price)*100)}% OFF
                    </span>
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#1e40af' }}>{formatPrice(price)}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>per unit</div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="label">Quantity <span style={{color:'#ef4444'}}>*</span></label>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button type="button" onClick={() => set('quantity', Math.max(1, form.quantity-1))}
                  style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:300 }}>−</button>
                <input className="input" type="number" min="1" value={form.quantity}
                  onChange={e => set('quantity', Math.max(1, parseInt(e.target.value)||1))}
                  style={{ width:70, textAlign:'center' }} />
                <button type="button" onClick={() => set('quantity', form.quantity+1)}
                  style={{ width:36, height:36, borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:300 }}>+</button>
                <div style={{ flex:1, textAlign:'right', fontWeight:800, color:'#1e40af', fontSize:18 }}>
                  = {formatPrice(total)}
                </div>
              </div>
            </div>

            {/* Expected delivery */}
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:22 }}>🚚</span>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#065f46' }}>Expected Delivery</div>
                <div style={{ fontSize:14, color:'#059669', fontWeight:600 }}>{formatDeliveryDate(expectedDelivery)}</div>
                <div style={{ fontSize:11, color:'#6ee7b7' }}>by 6:00 PM · 5 business days</div>
              </div>
            </div>

            {/* Delivery address */}
            <div>
              <label className="label">Delivery Address <span style={{color:'#ef4444'}}>*</span></label>
              <textarea className="input" rows={3} placeholder="Flat/Plot No., Street, Area, City, State — Pincode"
                value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)}
                style={{ resize:'vertical' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="label">Contact Name</label>
                <input className="input" placeholder="Your name" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact Phone <span style={{color:'#ef4444'}}>*</span></label>
                <input className="input" placeholder="+91 98765 43210" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Order Notes</label>
              <textarea className="input" rows={2} placeholder="Special instructions, landmark, preferred timing..."
                value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize:'vertical' }} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={() => { if (validateDetails()) setStep(2); }}>
                Continue → Payment
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Payment ══ */}
        {step === 2 && (
          <div style={{ padding:24, display:'flex', flexDirection:'column', gap:18 }}>
            {/* Order summary */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:14, border:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ color:'#64748b', fontSize:13 }}>{product.name} × {form.quantity}</span>
                <span style={{ fontWeight:700, color:'#1e293b' }}>{formatPrice(total)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #e2e8f0' }}>
                <span style={{ fontWeight:700, color:'#1e293b' }}>Total Payable</span>
                <span style={{ fontWeight:900, fontSize:18, color:'#1e40af' }}>{formatPrice(total)}</span>
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>
                📍 Deliver to: {form.deliveryAddress.slice(0, 60)}{form.deliveryAddress.length > 60 ? '...' : ''}
              </div>
              <div style={{ fontSize:12, color:'#059669', fontWeight:600, marginTop:4 }}>
                🚚 Expected by {formatDeliveryDate(expectedDelivery)}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="label" style={{ marginBottom:12 }}>Select Payment Method</label>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

                {/* Online payment */}
                <div onClick={() => setPaymentMethod('ONLINE')}
                  style={{ border:`2px solid ${paymentMethod==='ONLINE'?'#1e40af':'#e2e8f0'}`, borderRadius:12, padding:16, cursor:'pointer',
                    background: paymentMethod==='ONLINE' ? '#eff6ff' : 'white', transition:'all 0.2s', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${paymentMethod==='ONLINE'?'#1e40af':'#d1d5db'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {paymentMethod==='ONLINE' && <div style={{ width:12, height:12, borderRadius:'50%', background:'#1e40af' }} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>💳 Pay Online</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Credit/Debit card, UPI, Net Banking, Wallets</div>
                    <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                      {['UPI','Visa','Mastercard','RuPay','Paytm','PhonePe'].map(m => (
                        <span key={m} style={{ background:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:'#1e40af', color:'white', padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, flexShrink:0 }}>Razorpay</div>
                </div>

                {!RAZORPAY_CONFIGURED && (
                  <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'8px 12px', fontSize:11.5, color:'#92400e', display:'flex', gap:6, alignItems:'flex-start' }}>
                    <span>⚠️</span>
                    <span>Online payment isn't set up in this environment (demo key in use). Choose <strong>Cash on Delivery</strong> below to complete checkout.</span>
                  </div>
                )}

                {/* COD */}
                <div onClick={() => setPaymentMethod('COD')}
                  style={{ border:`2px solid ${paymentMethod==='COD'?'#059669':'#e2e8f0'}`, borderRadius:12, padding:16, cursor:'pointer',
                    background: paymentMethod==='COD' ? '#f0fdf4' : 'white', transition:'all 0.2s', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${paymentMethod==='COD'?'#059669':'#d1d5db'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {paymentMethod==='COD' && <div style={{ width:12, height:12, borderRadius:'50%', background:'#059669' }} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>💵 Cash on Delivery</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Pay when your order arrives at your doorstep</div>
                    <div style={{ fontSize:11, color:'#059669', marginTop:4, fontWeight:600 }}>✓ No advance payment required · Order confirmed instantly</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery partners info */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:14, border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Our Delivery Partners</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  { name:'Delhivery',   icon:'🚀', color:'#e31e24' },
                  { name:'Blue Dart',   icon:'✈️', color:'#003594' },
                  { name:'DTDC',        icon:'📦', color:'#f5a623' },
                  { name:'Ekart',       icon:'🛒', color:'#2874f0' },
                  { name:'Xpressbees', icon:'🐝', color:'#f7a731' },
                ].map(p => (
                  <span key={p.name} style={{ display:'flex', alignItems:'center', gap:4, background:'white', border:'1px solid #e2e8f0', borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:600, color:'#475569' }}>
                    {p.icon} {p.name}
                  </span>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>
                Delivery partner assigned after order confirmation based on your location
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:2, justifyContent:'center', background: paymentMethod==='COD' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)' }}
                onClick={handlePayNow} disabled={loading || (paymentMethod === 'ONLINE' && !RAZORPAY_CONFIGURED)}>
                {loading ? '⏳ Processing...' :
                  paymentMethod === 'COD'
                    ? `💵 Place COD Order — ${formatPrice(total)}`
                    : RAZORPAY_CONFIGURED
                      ? `💳 Pay Online — ${formatPrice(total)}`
                      : '💳 Pay Online (Unavailable — use COD)'
                }
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Success ══ */}
        {step === 3 && (
          <div style={{ padding:36, textAlign:'center' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'#f0fdf4', border:'3px solid #10b981',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px' }}>
              🎉
            </div>
            <h3 style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginBottom:8 }}>Order Placed Successfully!</h3>
            <div style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>
              {orderResult?.paymentMethod === 'ONLINE'
                ? '✅ Payment confirmed. Your order is being processed.'
                : '📦 COD order confirmed. Pay on delivery.'}
            </div>

            {/* Order confirmation card */}
            <div style={{ background:'#f8fafc', borderRadius:14, padding:20, textAlign:'left', marginBottom:20, border:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ color:'#64748b', fontSize:13 }}>Order ID</span>
                <span style={{ fontWeight:700, color:'#1e40af' }}>#{orderResult?.id}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ color:'#64748b', fontSize:13 }}>Product</span>
                <span style={{ fontWeight:600, color:'#1e293b', fontSize:13, maxWidth:200, textAlign:'right' }}>{orderResult?.productName}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ color:'#64748b', fontSize:13 }}>Total Amount</span>
                <span style={{ fontWeight:900, color:'#1e40af', fontSize:16 }}>{formatPrice(orderResult?.totalAmount)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ color:'#64748b', fontSize:13 }}>Payment</span>
                <span style={{ fontWeight:600, color: orderResult?.paymentMethod==='ONLINE' ? '#059669' : '#f59e0b' }}>
                  {orderResult?.paymentMethod === 'ONLINE' ? '✅ Paid Online' : '💵 Cash on Delivery'}
                </span>
              </div>
              <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:12, marginTop:4 }}>
                <div style={{ color:'#64748b', fontSize:12, marginBottom:4 }}>🚚 Expected Delivery</div>
                <div style={{ fontWeight:700, color:'#059669', fontSize:14 }}>{formatDeliveryDate(expectedDelivery)}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Tracking details will be sent once shipped</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-outline" onClick={onClose} style={{ flex:1 }}>Close</button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={() => { onClose(); window.location.href = '/my-orders'; }}>
                📦 Track Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
