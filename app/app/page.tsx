import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '2rem 0', textAlign: 'center' }}>
      <header style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          The Ultimate <span style={{ color: '#7c3aed' }}>Document</span> <br /> 
          Management Suite
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
          Merge, convert, and manage your PDFs and DOCX files in seconds. 
          Everything is processed securely and deleted automatically after 15 minutes.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* PDF Merger */}
        <div className="glass" style={{ padding: '2.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }}>
          <div style={{ width: '50px', height: '50px', background: 'rgba(124, 58, 237, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#7c3aed', fontSize: '1.5rem' }}>
            📄
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Merge PDFs</h2>
          <p style={{ opacity: 0.7, marginBottom: '2rem', flex: 1 }}>
            Combine multiple PDF files into a single document. Assign serial numbers to control the exact order of pages.
          </p>
          <Link href="/merge?type=pdf" className="btn btn-primary" style={{ width: '100%' }}>
            Get Started
          </Link>
        </div>

        {/* DOCX Merger */}
        <div className="glass" style={{ padding: '2.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '50px', height: '50px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#3b82f6', fontSize: '1.5rem' }}>
            📝
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Merge DOCXs</h2>
          <p style={{ opacity: 0.7, marginBottom: '2rem', flex: 1 }}>
            Join Word documents seamlessly. Maintain structure and order by assigning serial numbers to each upload.
          </p>
          <Link href="/merge?type=docx" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
            Get Started
          </Link>
        </div>

        {/* Converter */}
        <div className="glass" style={{ padding: '2.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '50px', height: '50px', background: 'rgba(244, 114, 182, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#f472b6', fontSize: '1.5rem' }}>
            🔄
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Converter</h2>
          <p style={{ opacity: 0.7, marginBottom: '2rem', flex: 1 }}>
            Quickly convert PDF to DOCX or DOCX to PDF. High-quality conversion powered by CloudConvert.
          </p>
          <Link href="/convert" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #f472b6, #fb923c)' }}>
            Convert Now
          </Link>
        </div>
      </div>

      <div className="glass" style={{ marginTop: '4rem', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
        <span style={{ fontSize: '1.5rem' }}>⏱️</span>
        <p style={{ fontWeight: 500 }}>Privacy first: Every file is automatically deleted 15 minutes after processing.</p>
      </div>
    </div>
  );
}
