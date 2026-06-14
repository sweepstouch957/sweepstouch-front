import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sweepstouch — Plataforma de Mensajería Multicanal',
  description:
    'SMS · MMS · RCS · WhatsApp. El único servicio en el mercado hispano que mide el ROI de cada campaña.',
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
      />
      <style>{`
        #demo-root * { box-sizing: border-box; }
        #demo-root { font-family: 'Inter', system-ui, sans-serif; color: #404040; background: #fff; }
        #demo-root h1, #demo-root h2, #demo-root h3, #demo-root h4 {
          font-family: 'Montserrat', system-ui, sans-serif;
          font-weight: 700;
        }
        @media (max-width: 1024px) {
          .demo-hero-right { display: none !important; }
          .demo-hero-grid { grid-template-columns: 1fr !important; }
        }
        .demo-brand-name { display: inline !important; }
        @media (max-width: 768px) {
          .demo-nav-links { display: none !important; }
          .demo-brand-name { display: none !important; }
          .demo-why-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .demo-compare-scroll { overflow-x: auto; }
          .demo-pricing-grid { grid-template-columns: 1fr !important; }
          .demo-footer-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .demo-roi-grid { grid-template-columns: 1fr !important; }
          .demo-stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .demo-why-grid { grid-template-columns: 1fr !important; }
          .demo-hero-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {children}
    </>
  );
}
