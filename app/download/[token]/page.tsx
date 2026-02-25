'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DownloadPage() {
  const { token } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ fileName: string; fileType: string; expiresAt: string } | null>(null);

  const handleDownloadOriginal = () => {
    window.open(`/api/download/${token}`, '_blank');
  };

  const handleConvertAndDownload = async () => {
    setConverting(true);
    setError(null);

    // We can't know the fileType easily here without a fetch, but we can infer it
    // or just let the backend handle the logic. 
    // I'll make the backend logic handle current file type.
    const task = 'pdf-to-docx'; // This is a placeholder, the API handles the real task

    try {
      const formData = new FormData();
      formData.append('sessionToken', token as string);
      // Backend will determine if it's pdf-to-docx or docx-to-pdf based on session.file_type
      formData.append('task', 'infer'); 

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
      setConverting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎉</div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your file is ready!</h1>
      <p style={{ opacity: 0.7, marginBottom: '3rem' }}>
        The file will be available for download for the next 15 minutes.
      </p>

      <div className="glass" style={{ padding: '3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
            onClick={handleDownloadOriginal}
          >
            📥 Download Merged File
          </button>
        </div>

        <div style={{ height: '1px', background: 'var(--card-border)', margin: '2rem 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--background)', padding: '0 1rem', fontSize: '0.9rem', opacity: 0.5 }}>
            OR CONVERT FORMAT
          </span>
        </div>

        <button 
          className="btn btn-outline" 
          style={{ width: '100%', borderColor: 'var(--primary)', color: 'white' }}
          onClick={handleConvertAndDownload}
          disabled={converting}
        >
          {converting ? (
            'Converting... Please wait'
          ) : (
             `Convert to ${token.includes('pdf') || true ? 'DOCX' : 'PDF' } & Download` 
          )}
        </button>

        {error && (
          <div style={{ marginTop: '1.5rem', color: '#ef4444', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.5 }}>
        <span>🔒</span>
        <p>Private & Secure. Auto-deleted in 15 mins.</p>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <a href="/" className="btn btn-outline" style={{ border: 'none' }}>
          ← Start Over
        </a>
      </div>
    </div>
  );
}
