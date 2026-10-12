import React, { useState, useRef } from 'react';
import { productService } from '../../services/productService';
import { useToast } from '../../hooks/useToast';
import Spinner from '../common/Spinner';

export default function ImportProductsModal({ onClose, onSuccess }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls'].includes(ext)) { toast.error('Only .xlsx and .xls files are supported'); return; }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const downloadTemplate = async () => {
    try {
      const res = await productService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'tradelect_product_import_template.xlsx';
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Template downloaded!');
    } catch { toast.error('Failed to download template'); }
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first'); return; }
    setUploading(true);
    try {
      const res = await productService.importProducts(file);
      setResult(res.data);
      if (res.data.imported > 0) {
        toast.success(`✅ ${res.data.imported} product(s) imported!`);
        onSuccess?.();
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Import failed';
      toast.error(msg);
      setResult({ imported: 0, errors: 1, errorDetails: [msg] });
    } finally { setUploading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', zIndex:10000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="card" style={{ width:'100%', maxWidth:560, padding:32, animation:'fadeIn 0.2s ease' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h3 style={{ fontWeight:800, fontSize:20, color:'#1e293b', marginBottom:4 }}>📊 Import Products via Excel</h3>
            <p style={{ color:'#64748b', fontSize:13 }}>Bulk upload products using a structured Excel file</p>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', fontSize:16, color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
        </div>

        {/* Step 1: Download template */}
        <div style={{ background:'#f8fafc', borderRadius:12, padding:18, marginBottom:20, border:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#1e293b', marginBottom:4 }}>Step 1 — Download Template</div>
              <div style={{ fontSize:12, color:'#64748b' }}>Fill in the template with your product data (columns A–K)</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                {['Name*','Part #*','Brand*','Category*','Sub-Cat','Model #','Description','Price*','Discount','Stock','Datasheet URL'].map((col,i) => (
                  <span key={i} style={{ background: col.endsWith('*') ? '#dbeafe' : '#f1f5f9', color: col.endsWith('*') ? '#1e40af' : '#64748b', padding:'2px 7px', borderRadius:6, fontSize:11, fontWeight:600 }}>{col}</span>
                ))}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={downloadTemplate} style={{ flexShrink:0, marginLeft:12 }}>
              ⬇ Download
            </button>
          </div>
        </div>

        {/* Step 2: Upload file */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#1e293b', marginBottom:12 }}>Step 2 — Upload Filled File</div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ border:`2px dashed ${dragOver ? '#1e40af' : file ? '#10b981' : '#cbd5e1'}`,
              borderRadius:12, padding:'28px 20px', textAlign:'center', cursor:'pointer',
              background: dragOver ? '#eff6ff' : file ? '#f0fdf4' : '#f8fafc',
              transition:'all 0.2s' }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <>
                <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>{file.name}</div>
                <div style={{ color:'#64748b', fontSize:12, marginTop:4 }}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize:36, marginBottom:8, opacity:0.5 }}>📂</div>
                <div style={{ fontWeight:600, color:'#475569', fontSize:14 }}>Drag & drop your .xlsx file here</div>
                <div style={{ color:'#94a3b8', fontSize:12, marginTop:4 }}>or click to browse</div>
              </>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{ marginBottom:20, borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', gap:24, padding:'14px 18px', background: result.imported > 0 ? '#f0fdf4' : '#fff7ed' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:900, color:'#059669' }}>{result.imported}</div>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>IMPORTED</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:900, color: result.errors > 0 ? '#ef4444' : '#94a3b8' }}>{result.errors}</div>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>SKIPPED</div>
              </div>
              <div style={{ flex:1, display:'flex', alignItems:'center', paddingLeft:12, borderLeft:'1px solid #e2e8f0' }}>
                <span style={{ fontSize:13, color:'#475569' }}>{result.message || (result.imported > 0 ? 'Import successful' : 'No products imported')}</span>
              </div>
            </div>
            {result.errorDetails?.length > 0 && (
              <div style={{ padding:14, background:'#fff7ed' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:8 }}>⚠ Skipped rows:</div>
                {result.errorDetails.map((err, i) => (
                  <div key={i} style={{ fontSize:12, color:'#b45309', padding:'3px 0', borderBottom:'1px solid #fde68a' }}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>
            {result?.imported > 0 ? '✓ Done' : 'Cancel'}
          </button>
          <button className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <><Spinner size={16} color="white" /> Importing…</> : '📤 Import Products'}
          </button>
        </div>
      </div>
    </div>
  );
}
