'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ConvertPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [task, setTask] = useState<'pdf-to-docx' | 'docx-to-pdf'>('pdf-to-docx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect task based on extension
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setTask('pdf-to-docx');
      else if (ext === 'docx') setTask('docx-to-pdf');
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file to convert.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task', task);

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      router.push(`/download/${data.token}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Document Converter
        </h1>
        <p style={{ opacity: 0.7 }}>
          High-quality conversion between PDF and DOCX. Powered by CloudConvert.
        </p>
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, opacity: 0.7 }}>Select Conversion Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button 
              className={`btn ${task === 'pdf-to-docx' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTask('pdf-to-docx')}
            >
              PDF to DOCX
            </button>
            <button 
              className={`btn ${task === 'docx-to-pdf' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTask('docx-to-pdf')}
            >
              DOCX to PDF
            </button>
          </div>
        </div>

        <div 
          className="dropzone"
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '4rem 2rem' }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            accept={task === 'pdf-to-docx' ? '.pdf' : '.docx'} 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          {file ? (
            <div>
              <h3 style={{ color: 'var(--primary)' }}>{file.name}</h3>
              <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Click to change file</p>
            </div>
          ) : (
            <div>
              <h3>Choose a {task === 'pdf-to-docx' ? 'PDF' : 'DOCX'} file</h3>
              <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Drag and drop or click to browse</p>
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '2.5rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem' }}
            onClick={handleConvert}
            disabled={loading || !file}
          >
            {loading ? 'Processing Conversion...' : 'Convert Now'}
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
