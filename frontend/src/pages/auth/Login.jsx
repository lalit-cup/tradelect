import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { useToast } from '../../hooks/useToast';

export default function Login() {
  const [mode, setMode]       = useState('password');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]         = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);   // seconds before resend allowed
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const timerRef = useRef(null);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();
  const from      = location.state?.from?.pathname || null;

  // Reset OTP state when switching modes
  const switchMode = (m) => {
    setMode(m);
    setOtpSent(false);
    setOtp('');
    setCountdown(0);
    clearInterval(timerRef.current);
  };

  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSendOtp = async () => {
    if (!email.trim()) { toast.error('Enter your email address first'); return; }
    setSendingOtp(true);
    try {
      await authService.sendOtp(email.trim());
      setOtpSent(true);
      startCountdown(60);
      toast.success('OTP sent! Check your inbox.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send OTP');
    } finally { setSendingOtp(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (mode === 'otp' && !otpSent) { toast.error('Please request an OTP first'); return; }
    if (mode === 'otp' && otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const payload = mode === 'password' ? { email, password } : { email, otp };
      const res  = await authService.login(payload);
      const data = res.data.data;
      dispatch(setCredentials(data));
      toast.success('Welcome back!');
      const role = data?.user?.role;
      if (from) navigate(from, { replace: true });
      else if (['ADMIN','SUPER_ADMIN','DEALER'].includes(role)) navigate('/admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)' }}>

      {/* Left branding */}
      <div className="hidden-mobile" style={{ flex:1, background:'linear-gradient(135deg,#1e3a8a,#1e40af)', display:'flex', flexDirection:'column', justifyContent:'center', padding:60, color:'white', minWidth:0 }}>
        <div style={{ fontSize:48, fontWeight:900, marginBottom:8 }}>Tradelect</div>
        <div style={{ fontSize:18, opacity:0.8, marginBottom:40 }}>B2B Automation & Switchgear Marketplace</div>
        {['10,000+ products from top brands','Compare prices & place bids','Direct dealer connections','Real-time enquiry management'].map(f=>(
          <div key={f} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, fontSize:14 }}>
            <span style={{ background:'#f59e0b', color:'#1e3a8a', width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0, fontSize:12 }}>✓</span>
            {f}
          </div>
        ))}
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40, minWidth:0 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:'#1e293b', marginBottom:6 }}>Welcome Back</h2>
            <p style={{ color:'#64748b', fontSize:14 }}>Sign in to your Tradelect account</p>
          </div>

          {/* Mode tabs */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:28 }}>
            {[['password','🔒 Password'],['otp','📱 OTP Login']].map(([m,label])=>(
              <button key={m} onClick={()=>switchMode(m)}
                style={{ flex:1, padding:'10px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
                  transition:'all 0.2s', background:mode===m?'white':'transparent',
                  color:mode===m?'#1e40af':'#64748b', boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@company.com"
                value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" />
            </div>

            {mode === 'password' ? (
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
            ) : (
              <div>
                <label className="label">One-Time Password</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input className="input" placeholder="6-digit OTP" value={otp}
                    onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                    maxLength={6} style={{ flex:1 }} inputMode="numeric" autoComplete="one-time-code" />
                  <button type="button" className="btn btn-outline"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || countdown > 0}
                    style={{ whiteSpace:'nowrap', minWidth:110 }}>
                    {sendingOtp ? '...' : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? '↺ Resend' : 'Send OTP'}
                  </button>
                </div>
                {otpSent && (
                  <div style={{ marginTop:6, fontSize:12, color:'#059669', fontWeight:500 }}>
                    ✓ OTP sent to {email} — check your inbox and spam folder
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ width:'100%', marginTop:8, justifyContent:'center' }}>
              {loading ? <span className="spinner" style={{ borderTopColor:'white' }} /> : 'Sign In →'}
            </button>
          </form>

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:20, fontSize:14, color:'#64748b', flexWrap:'wrap', gap:8 }}>
            <span>Don't have an account?{' '}
              <Link to="/register" style={{ color:'#1e40af', fontWeight:600, textDecoration:'none' }}>Register</Link>
            </span>
            <Link to="/admin/login" style={{ color:'#7c3aed', fontWeight:600, textDecoration:'none', fontSize:13 }}>🛠 Admin Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
