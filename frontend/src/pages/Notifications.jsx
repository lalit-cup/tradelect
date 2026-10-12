import React, { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useToast } from '../hooks/useToast';
import { formatDate, formatDateTime } from '../utils/formatters';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';

const TYPE_CFG = {
  BID_UPDATE:    { icon:'💼', color:'#7c3aed', bg:'#f3e8ff', label:'Bid Update' },
  ENQUIRY_REPLY: { icon:'📧', color:'#059669', bg:'#dcfce7', label:'Enquiry Reply' },
  ORDER_UPDATE:  { icon:'📦', color:'#0891b2', bg:'#e0f2fe', label:'Order Update' },
  SYSTEM:        { icon:'🔔', color:'#6b7280', bg:'#f3f4f6', label:'System' },
  PRODUCT_ALERT: { icon:'🔌', color:'#1e40af', bg:'#dbeafe', label:'Product Alert' },
};

export default function Notifications() {
  const toast = useToast();
  const [notifs, setNotifs]     = useState([]);
  const [unread, setUnread]     = useState(0);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // 'all' | 'unread'

  const fetchNotifs = useCallback(() => {
    setLoading(true);
    notificationService.getNotifications({ page, size: 15 })
      .then(r => {
        setNotifs(r.data?.data || []);
        setUnread(r.data?.unreadCount || 0);
        setTotal(r.data?.totalElements || 0);
        setTotalPages(r.data?.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifs();
    } catch { toast.error('Failed to mark as read'); }
  };

  const markRead = async (id) => {
    try { await notificationService.markRead(id); fetchNotifs(); } catch {}
  };

  const displayed = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;

  return (
    <div style={{ padding:32, maxWidth:760, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'#1e293b', marginBottom:4 }}>🔔 Notifications</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>
            {total} total {unread > 0 && <span style={{ fontWeight:700, color:'#1e40af' }}>· {unread} unread</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Filter tabs */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:8, padding:3 }}>
            {[['all','All'],['unread','Unread']].map(([f,l])=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                  background:filter===f?'white':'transparent', color:filter===f?'#1e40af':'#64748b',
                  boxShadow:filter===f?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.2s' }}>
                {l}{f==='unread' && unread>0 && <span style={{ marginLeft:6, background:'#ef4444', color:'white', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{unread}</span>}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>✓ Mark All Read</button>
          )}
          <button className="btn btn-outline btn-sm" onClick={fetchNotifs} title="Refresh">↺</button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60 }}><Spinner size={36} /></div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', paddingTop:80 }}>
          <div style={{ fontSize:64, marginBottom:16, opacity:0.2 }}>🔔</div>
          <h3 style={{ fontSize:20, fontWeight:700, color:'#1e293b', marginBottom:8 }}>
            {filter==='unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p style={{ color:'#64748b', fontSize:14 }}>
            {filter==='unread' ? 'You\'re all caught up!' : 'Notifications about bids, enquiries and updates will appear here'}
          </p>
          {filter==='unread' && (
            <button className="btn btn-outline btn-sm" style={{ marginTop:16 }} onClick={()=>setFilter('all')}>View All</button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {displayed.map(n => {
              const cfg = TYPE_CFG[n.type] || TYPE_CFG.SYSTEM;
              return (
                <div key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className="card"
                  style={{ padding:'16px 20px', display:'flex', gap:14, alignItems:'flex-start',
                    background: n.read ? 'white' : '#eff6ff',
                    borderLeft:`4px solid ${n.read ? '#e2e8f0' : cfg.color}`,
                    cursor: n.read ? 'default' : 'pointer',
                    transition:'background 0.2s' }}>

                  {/* Type icon */}
                  <div style={{ width:42, height:42, borderRadius:'50%', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div>
                        <span style={{ fontWeight:n.read?500:700, color:'#1e293b', fontSize:14 }}>{n.title}</span>
                        <span style={{ marginLeft:8, background:cfg.bg, color:cfg.color, padding:'1px 7px', borderRadius:10, fontSize:11, fontWeight:600 }}>{cfg.label}</span>
                      </div>
                      {!n.read && <div style={{ width:8, height:8, background:cfg.color, borderRadius:'50%', flexShrink:0, marginTop:4 }} />}
                    </div>
                    {n.message && <p style={{ color:'#475569', fontSize:13, marginTop:5, lineHeight:1.5 }}>{n.message}</p>}
                    <div style={{ color:'#94a3b8', fontSize:11, marginTop:6, display:'flex', gap:12 }}>
                      <span>🕐 {formatDateTime(n.createdAt)}</span>
                      {!n.read && <span style={{ color:cfg.color, fontWeight:600 }}>Click to mark as read</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filter === 'all' && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
