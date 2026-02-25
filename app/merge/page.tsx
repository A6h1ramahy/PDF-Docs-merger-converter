'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SelectedFile {
  file: File;
  order: number;
  id: string;
}

export default function MergePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get('type') as 'pdf' | 'docx') || 'pdf';

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file, idx) => ({
        file,
        order: files.length + idx + 1,
        id: Math.random().toString(36).substring(7),
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const updateOrder = (id: string, newOrder: number) => {
    setFiles(files.map(f => f.id === id ? { ...f, order: newOrder } : f));
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please upload at least 2 files to merge.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('fileType', type);
      
      files.forEach((f, idx) => {
        formData.append(`file_${idx}`, f.file);
        formData.append(`order_${idx}`, f.order.toString());
      });

      const res = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Merge failed');

      router.push(`/download/${data.token}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Merge {type.toUpperCase()} Files
        </h1>
        <p style={{ opacity: 0.7 }}>
          Select files and assign serial numbers to merge them in your preferred order.
        </p>
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <div 
          className="dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept={type === 'pdf' ? '.pdf' : '.docx'} 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
          <h3>Click to upload or drag and drop</h3>
          <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>
            Only {type.toUpperCase()} files are supported
          </p>
        </div>

        {files.length > 0 && (
          <div className="file-grid" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', fontWeight: 600, padding: '0 1rem', opacity: 0.5, fontSize: '0.9rem' }}>
              <div style={{ width: '80px' }}>Order</div>
              <div style={{ flex: 1 }}>File Name</div>
              <div style={{ width: '40px' }}></div>
            </div>
            {files.map((f) => (
              <div key={f.id} className="file-item animate-in">
                <input 
                  type="number" 
                  className="order-input"
                  value={f.order}
                  onChange={(e) => updateOrder(f.id, parseInt(e.target.value, 10))}
                  min="1"
                />
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.file.name}
                </div>
                <button 
                  onClick={() => removeFile(f.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            onClick={handleMerge}
            disabled={loading || files.length < 2}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Processing...
              </>
            ) : (
              `Merge ${files.length} Files`
            )}
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => setFiles([])}
            disabled={loading || files.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      <style jsx>{`
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
