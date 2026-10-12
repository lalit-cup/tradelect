import React from 'react';
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
      <button className="btn btn-outline btn-sm" onClick={() => onChange(page - 1)} disabled={page === 0}>← Prev</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = page <= 3 ? i : page - 3 + i;
        if (p >= totalPages) return null;
        return (
          <button key={p} onClick={() => onChange(p)} className="btn btn-sm"
            style={{ background: p === page ? '#1e40af' : 'white', color: p === page ? 'white' : '#374151', border: '1px solid #e2e8f0' }}>
            {p + 1}
          </button>
        );
      })}
      <button className="btn btn-outline btn-sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>Next →</button>
    </div>
  );
}
