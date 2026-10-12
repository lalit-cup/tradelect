import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const DEMO = [
  { email:'superadmin@tradelect.com', label:'Super Admin', color:'#dc2626', icon:'👑' },
  { email:'admin@tradelect.com',      label:'Admin',       color:'#7c3aed', icon:'🛠' },
  { email:'dealer@tradelect.com',     label:'Dealer',      color:'#059669', icon:'🔌' },
];

const inputStyle = {
  width:'100%', padding:'12px 16px', borderRadius:10, fontSize:14, boxSizing:'border-box',
  background:'rgba(255,255,255,0.09)', border:'1.5px solid rgba(255,255,255,0.15)',
  color:'white', outline:'none', transition:'border-color 0.2s', fontFamily:'inherit',
};

export default function AdminLogin() {
  const [tab, setTab]         = useState('login');  // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Register form
  const [reg, setReg] = useState({ fullName:'', email:'', password:'', phone:'', companyName:'', role:'ADMIN', inviteKey:'' });
  const [adminExists, setAdminExists] = useState(true); // default true until we know

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast    = useToast();
  const { isAuthenticated, isAdmin, isDealer } = useAuth();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && (isAdmin || isDealer)) {
      navigate(location.state?.from?.pathname || '/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isDealer]);

  // Check if any admin exists (to show/hide invite key field)
  useEffect(() => {
    authService.adminExists()
      .then(r => setAdminExists(r.data?.adminExists === true))
      .catch(() => setAdminExists(true));
  }, []);

  const doLogin = async (e, oEmail, oPw) => {
    if (e) e.preventDefault();
    const loginEmail = oEmail || email;
    const loginPw    = oPw    || password;
    if (!loginEmail || !loginPw) { setError('Email and password are required'); return; }
    setError(''); setLoading(true);
    try {
      const res  = await authService.login({ email: loginEmail, password: loginPw });
      const data = res.data.data;
      const role = data?.user?.role;
      if (!['ADMIN','SUPER_ADMIN','DEALER'].includes(role)) {
        setError('Access denied. This portal is for Admin and Dealer accounts only.');
        return;
      }
      dispatch(setCredentials(data));
      toast.success(`Welcome, ${data.user.fullName}! 🎉`);
      navigate(location.state?.from?.pathname || '/admin', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const doRegister = async (e) => {
    e.preventDefault();
    if (reg.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      const res  = await authService.registerAdmin(reg);
      const data = res.data.data;
      dispatch(setCredentials(data));
      toast.success('Admin account created! 🎉');
      navigate('/admin', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fillDemo = (acc) => { setEmail(acc.email); setPassword('Admin@123'); setError(''); };
  const setR = (k,v) => setReg(r => ({...r, [k]: v}));

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#1e3a8a 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' }}>
      {[[400,400,-120,'auto',-100,'auto',.05],[300,300,'auto',-80,-80,'auto',.06]].map(([w,h,top,bot,right,left,op],i)=>(
        <div key={i} style={{position:'absolute',width:w,height:h,borderRadius:'50%',background:'white',top,bottom:bot,right,left,opacity:op,pointerEvents:'none'}} />
      ))}

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link to="/" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:50,height:50,background:'#f59e0b',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#1e3a8a',fontSize:24,boxShadow:'0 4px 20px rgba(245,158,11,0.4)' }}>T</div>
            <div style={{textAlign:'left'}}>
              <div style={{color:'white',fontWeight:900,fontSize:24,lineHeight:1}}>Tradelect</div>
              <div style={{color:'#93c5fd',fontSize:12,fontWeight:500}}>Admin Portal</div>
            </div>
          </Link>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:20,padding:'4px 14px',fontSize:12,color:'#fca5a5',fontWeight:600}}>
            🔐 Restricted Access — Authorized Personnel Only
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.07)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:20, padding:'32px 36px 28px' }}>

          {/* Tab switcher */}
          <div style={{display:'flex',background:'rgba(0,0,0,0.3)',borderRadius:10,padding:4,marginBottom:24,gap:4}}>
            {[['login','🔐 Sign In'],['register','➕ Register Admin']].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setError('');}}
                style={{flex:1,padding:'9px',borderRadius:7,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,transition:'all 0.2s',
                  background: tab===t ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: tab===t ? 'white' : 'rgba(255,255,255,0.5)'}}>
                {l}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',gap:8}}>
              <span style={{color:'#f87171',flexShrink:0}}>⚠</span>
              <span style={{color:'#fca5a5',fontSize:13,lineHeight:1.5}}>{error}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <>
              <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:18}}>
                <div>
                  <label style={{display:'block',color:'#cbd5e1',fontSize:13,fontWeight:600,marginBottom:8}}>Email Address</label>
                  <input type="email" autoComplete="email" placeholder="admin@tradelect.com" value={email}
                    onChange={e=>{setEmail(e.target.value);setError('');}} required style={inputStyle}
                    onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                </div>
                <div>
                  <label style={{display:'block',color:'#cbd5e1',fontSize:13,fontWeight:600,marginBottom:8}}>Password</label>
                  <div style={{position:'relative'}}>
                    <input type={showPw?'text':'password'} autoComplete="current-password" placeholder="••••••••" value={password}
                      onChange={e=>{setPassword(e.target.value);setError('');}} required
                      style={{...inputStyle,paddingRight:48}}
                      onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                    <button type="button" onClick={()=>setShowPw(p=>!p)}
                      style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:16,padding:0}}>
                      {showPw?'🙈':'👁'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{padding:'14px',borderRadius:10,border:'none',cursor:loading?'not-allowed':'pointer',
                    background:loading?'rgba(30,64,175,0.7)':'linear-gradient(135deg,#1e40af,#3b82f6)',
                    color:'white',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                    boxShadow:loading?'none':'0 4px 20px rgba(59,130,246,0.4)',marginTop:4}}>
                  {loading ? <><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.6s linear infinite'}} />Signing in…</> : '🔐 Sign In to Admin Panel'}
                </button>
              </form>

              <div style={{display:'flex',alignItems:'center',gap:12,margin:'20px 0 14px'}}>
                <div style={{flex:1,height:1,background:'rgba(255,255,255,0.1)'}} />
                <span style={{color:'#475569',fontSize:11,fontWeight:600,letterSpacing:'0.06em'}}>QUICK LOGIN</span>
                <div style={{flex:1,height:1,background:'rgba(255,255,255,0.1)'}} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {DEMO.map(acc=>(
                  <button key={acc.email} onClick={()=>fillDemo(acc)}
                    style={{padding:'11px 8px',borderRadius:10,border:`1.5px solid ${acc.color}50`,background:`${acc.color}18`,cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:5}}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${acc.color}30`;e.currentTarget.style.borderColor=acc.color;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=`${acc.color}18`;e.currentTarget.style.borderColor=`${acc.color}50`;}}>
                    <span style={{fontSize:20}}>{acc.icon}</span>
                    <span style={{color:acc.color,fontSize:11,fontWeight:700}}>{acc.label}</span>
                  </button>
                ))}
              </div>
              <p style={{color:'#334155',fontSize:11,textAlign:'center',marginTop:8}}>
                Demo password: <strong style={{color:'#64748b'}}>Admin@123</strong>
              </p>
            </>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <>
              {!adminExists && (
                <div style={{background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#6ee7b7'}}>
                  🎉 <strong>First-time setup!</strong> No admin exists yet. The account you create will automatically become a <strong>Super Admin</strong>.
                </div>
              )}
              <form onSubmit={doRegister} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Full Name *</label>
                    <input style={inputStyle} placeholder="John Doe" value={reg.fullName} onChange={e=>setR('fullName',e.target.value)} required
                      onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                  </div>
                  <div>
                    <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Phone</label>
                    <input style={inputStyle} placeholder="+91 98765 43210" value={reg.phone} onChange={e=>setR('phone',e.target.value)}
                      onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                  </div>
                </div>
                <div>
                  <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Email Address *</label>
                  <input type="email" style={inputStyle} placeholder="admin@company.com" value={reg.email} onChange={e=>setR('email',e.target.value)} required
                    onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                </div>
                <div>
                  <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Password * (min 8 chars)</label>
                  <input type="password" style={inputStyle} placeholder="••••••••" value={reg.password} onChange={e=>setR('password',e.target.value)} required
                    onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                </div>
                <div>
                  <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Company Name</label>
                  <input style={inputStyle} placeholder="Your company" value={reg.companyName} onChange={e=>setR('companyName',e.target.value)}
                    onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                </div>
                {!adminExists ? (
                  <div style={{background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#94a3b8'}}>
                    Role: <strong style={{color:'#fbbf24'}}>SUPER_ADMIN</strong> (auto-assigned as first admin)
                  </div>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Role</label>
                      <select style={{...inputStyle,cursor:'pointer'}} value={reg.role} onChange={e=>setR('role',e.target.value)}>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="DEALER">Dealer</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',color:'#cbd5e1',fontSize:12,fontWeight:600,marginBottom:6}}>Invite Key *</label>
                      <input style={inputStyle} placeholder="Admin invite key" value={reg.inviteKey} onChange={e=>setR('inviteKey',e.target.value)} required
                        onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'} />
                    </div>
                  </div>
                )}
                <button type="submit" disabled={loading}
                  style={{padding:'13px',borderRadius:10,border:'none',cursor:loading?'not-allowed':'pointer',
                    background:loading?'rgba(5,150,105,0.5)':'linear-gradient(135deg,#059669,#10b981)',
                    color:'white',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4}}>
                  {loading ? <><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.6s linear infinite'}} />Creating…</> : '➕ Create Admin Account'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{textAlign:'center',marginTop:20,display:'flex',justifyContent:'center',gap:20}}>
          <Link to="/" style={{color:'#475569',fontSize:13,textDecoration:'none'}}>← Back to Site</Link>
          <Link to="/login" style={{color:'#475569',fontSize:13,textDecoration:'none'}}>Customer Login</Link>
          <Link to="/register" style={{color:'#475569',fontSize:13,textDecoration:'none'}}>Register</Link>
        </div>
      </div>
    </div>
  );
}
