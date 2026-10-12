import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/common/Spinner';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    userService.getMyProfile()
      .then(r => setProfile(r.data?.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(profile);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={40} /></div>;

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 28 }}>👤 My Profile</h2>

      {/* Profile header */}
      <div className="card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'white', flexShrink: 0 }}>
          {user?.fullName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{user?.fullName}</div>
          <div style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className="badge badge-info">{user?.role}</span>
            {user?.companyName && <span className="badge badge-gray">{user.companyName}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        {[['profile', '📋 Profile Details'], ['password', '🔒 Change Password']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #1e40af' : '2px solid transparent', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#1e40af' : '#64748b', cursor: 'pointer', fontSize: 14 }}>{l}</button>
        ))}
      </div>

      {tab === 'profile' && profile && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: 'Full Name', key: 'fullName', type: 'text' },
              { label: 'Phone', key: 'phone', type: 'text' },
              { label: 'Company Name', key: 'companyName', type: 'text' },
              { label: 'GST Number', key: 'gstNumber', type: 'text' },
              { label: 'PAN Number', key: 'panNumber', type: 'text' },
              { label: 'City', key: 'city', type: 'text' },
              { label: 'State', key: 'state', type: 'text' },
              { label: 'Pincode', key: 'pincode', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" type={type} value={profile[key] || ''} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Address</label>
              <textarea className="input" rows={2} value={profile.address || ''} onChange={e => set('address', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding: 28, maxWidth: 440 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={handlePasswordChange} disabled={saving}>
              {saving ? '...' : '🔒 Update Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
