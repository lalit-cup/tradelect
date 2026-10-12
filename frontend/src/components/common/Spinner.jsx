import React from 'react';
export default function Spinner({ size = 24, color = '#1e40af' }) {
  return (
    <div style={{
      width: size, height: size, border: `3px solid #e2e8f0`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.6s linear infinite', display: 'inline-block',
    }} />
  );
}
