import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MergeFlow | PDF & DOCX Merger and Converter",
  description: "Merge and convert PDF and DOCX files with ease. Secure, fast, and auto-deletes files after 15 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MergeFlow
          </a>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="/" className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>Home</a>
          </div>
        </nav>
        <main className="animate-in">
          {children}
        </main>
        <footer style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.5, fontSize: '0.9rem' }}>
          &copy; 2024 MergeFlow. Files are automatically deleted after 15 minutes.
        </footer>
      </body>
    </html>
  );
}
