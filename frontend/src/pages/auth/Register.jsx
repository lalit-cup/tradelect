import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { useToast } from '../../hooks/useToast';

export default function Register() {
  const [form, setForm]     = useState({ fullName:'', email:'', password:'', phone:'', companyName:'', role:'CUSTOMER' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast    = useToast();

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())  e.fullName = 'Full name is required';
    if (!form.email.trim())     e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim())     e.phone    = 'Phone is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const pwStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label:'Weak',   color:'#ef4444' };
    if (score <= 3) return { score, label:'Medium', color:'#f59e0b' };
    return           { score, label:'Strong', color:'#10b981' };
  };

  const strength = pwStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res  = await authService.register(form);
      const data = res.data.data;
      dispatch(setCredentials(data));
      toast.success('Account created successfully! 🎉');
      const role = data?.user?.role;
      navigate(['ADMIN','SUPER_ADMIN','DEALER'].includes(role) ? '/admin' : '/dashboard', { replace: true });
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors(v=>({...v, email: msg}));
    } finally { setLoading(false); }
  };

  const inp = (k) => ({ className:'input', value:form[k], onChange:e=>set(k,e.target.value), style: errors[k] ? { border:'2px solid #ef4444' } : {} });

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', padding:20 }}>
      <div className="card" style={{ width:'100%', maxWidth:520, padding:40 }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🔌</div>
          <h2 style={{ fontSize:26, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Create Account</h2>
          <p style={{ color:'#64748b', fontSize:14 }}>Join Tradelect's B2B marketplace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">Full Name <span style={{color:'#ef4444'}}>*</span></label>
              <input {...inp('fullName')} placeholder="John Doe" required />
              {errors.fullName && <div style={{color:'#ef4444',fontSize:12,marginTop:3}}>⚠ {errors.fullName}</div>}
            </div>
            <div>
              <label className="label">Phone <span style={{color:'#ef4444'}}>*</span></label>
              <input {...inp('phone')} placeholder="+91 98765 43210" required />
              {errors.phone && <div style={{color:'#ef4444',fontSize:12,marginTop:3}}>⚠ {errors.phone}</div>}
            </div>
          </div>

          <div>
            <label className="label">Email Address <span style={{color:'#ef4444'}}>*</span></label>
            <input {...inp('email')} type="email" placeholder="you@company.com" required autoComplete="email" />
            {errors.email && <div style={{color:'#ef4444',fontSize:12,marginTop:3}}>⚠ {errors.email}</div>}
          </div>

          <div>
            <label className="label">Password <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{position:'relative'}}>
              <input {...inp('password')} type={showPw?'text':'password'} placeholder="Min 8 characters" style={{...inp('password').style, paddingRight:44}} autoComplete="new-password" />
              <button type="button" onClick={()=>setShowPw(p=>!p)}
                style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:16}}>
                {showPw?'🙈':'👁'}
              </button>
            </div>
            {form.password && (
              <div style={{marginTop:6}}>
                <div style={{display:'flex',gap:4,marginBottom:4}}>
                  {[1,2,3,4,5].map(i=>(
                    <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=strength.score?strength.color:'#e2e8f0',transition:'background 0.3s'}} />
                  ))}
                </div>
                <div style={{fontSize:11,color:strength.color,fontWeight:600}}>{strength.label} password</div>
              </div>
            )}
            {errors.password && <div style={{color:'#ef4444',fontSize:12,marginTop:3}}>⚠ {errors.password}</div>}
          </div>

          <div>
            <label className="label">Company Name</label>
            <input {...inp('companyName')} placeholder="Your company name" />
          </div>

          <div>
            <label className="label">Account Type</label>
            <select className="input" value={form.role} onChange={e=>set('role',e.target.value)}>
              <option value="CUSTOMER">🛒 Buyer / Customer</option>
              <option value="DEALER">🔌 Dealer / Supplier</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
            {loading ? <span className="spinner" style={{borderTopColor:'white'}} /> : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20, color:'#64748b', fontSize:14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{color:'#1e40af',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
          <span style={{margin:'0 8px'}}>·</span>
          <Link to="/admin/login" style={{color:'#7c3aed',fontWeight:600,textDecoration:'none',fontSize:13}}>Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
