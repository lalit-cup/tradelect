import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

const ROLE_CFG = {
  SUPER_ADMIN: { bg:'#fee2e2', color:'#991b1b', icon:'👑' },
  ADMIN:       { bg:'#ede9fe', color:'#5b21b6', icon:'🛠' },
  DEALER:      { bg:'#d1fae5', color:'#065f46', icon:'🔌' },
  CUSTOMER:    { bg:'#dbeafe', color:'#1e40af', icon:'🛒' },
};

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers]           = useState([]);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = () => {
    setLoading(true);
    userService.getAllUsers({ page, size: 20 })
      .then(r => {
        setUsers(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalElements(r.data?.totalElements || 0);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user? They will no longer be able to log in.')) return;
    try {
      await userService.deactivateUser(userId);
      toast.success('User deactivated');
      fetchUsers();
    } catch { toast.error('Failed to deactivate user'); }
  };

  // Client-side search + role filter
  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    const matchSearch = !search || [u.fullName, u.email, u.companyName].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchRole && matchSearch;
  });

  // Role summary counts
  const counts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding:32 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:4 }}>👥 Manage Users</h2>
        <p style={{ color:'#64748b' }}>{totalElements} registered users</p>
      </div>

      {/* Role summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:24 }}>
        {Object.entries(ROLE_CFG).map(([role, cfg]) => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role ? 'ALL' : role)}
            style={{ padding:'14px', borderRadius:10, border:`2px solid ${roleFilter===role ? cfg.color : '#e2e8f0'}`,
              background: roleFilter===role ? cfg.bg : 'white', cursor:'pointer', transition:'all 0.2s', textAlign:'left' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{cfg.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:cfg.color }}>{counts[role] || 0}</div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{role.replace('_',' ')}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <input className="input" placeholder="🔍 Search by name, email or company..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:400 }} />
        {roleFilter !== 'ALL' && (
          <button className="btn btn-outline btn-sm" onClick={() => setRoleFilter('ALL')}>✕ Clear filter</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60 }}><Spinner size={36} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:60, color:'#94a3b8' }}>
          <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>👥</div>
          <h3>No users found</h3>
        </div>
      ) : (
        <>
          <div className="card" style={{ overflow:'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const cfg = ROLE_CFG[u.role] || { bg:'#f1f5f9', color:'#475569', icon:'👤' };
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:'50%', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:cfg.color, fontSize:13, flexShrink:0 }}>
                            {(u.fullName || 'U')[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight:600, fontSize:13, color:'#1e293b' }}>{u.fullName || '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize:13, color:'#64748b' }}>{u.email || '—'}</td>
                      <td style={{ fontSize:13 }}>{u.companyName || '—'}</td>
                      <td>
                        <span style={{ background:cfg.bg, color:cfg.color, padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700 }}>
                          {cfg.icon} {u.role?.replace('_',' ') || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{u.phone || '—'}</td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{formatDate(u.createdAt)}</td>
                      <td>
                        <button className="btn btn-sm" style={{ background:'#fee2e2', color:'#ef4444', border:'none', fontSize:12 }}
                          onClick={() => handleDeactivate(u.userId)}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
