import type { ReactNode } from 'react';
import PricingCalculator from './pricing-calculator';

const P = '#ef0f82';
const FG = '#404040';
const MUTED = '#999999';
const BDR = '#bfbfbf';
const SEC_BG = '#f8f9f9';

const LOGO =
  'https://d2xsxph8kpxj0f.cloudfront.net/95351868/aakP4E8LnKXsf39VfmgjXt/sweepstouch-logo-FqRg68PDhockZbf6L9EcXM.webp';
const HERO_BG =
  'https://d2xsxph8kpxj0f.cloudfront.net/95351868/aakP4E8LnKXsf39VfmgjXt/hero-background-j8CP7F5BbjpiK7W5nGmQE6.webp';
const CHANNELS_IMG =
  'https://d2xsxph8kpxj0f.cloudfront.net/95351868/aakP4E8LnKXsf39VfmgjXt/channels-comparison-visual-GbrLttcRhVpyc63q4osgGh.webp';

// ─── Shared atoms ────────────────────────────────────────────────────────────

function Btn({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: 'primary' | 'outline';
  children: ReactNode;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    fontSize: 15,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'opacity .15s',
    lineHeight: 1,
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: P, color: '#fff', border: 'none' },
    outline: { ...base, background: 'transparent', color: P, border: `1.5px solid ${P}` },
  };
  return (
    <a href={href} style={styles[variant]}>
      {children}
    </a>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill={P} fillOpacity="0.12" />
      <path d="M5 9.5l3 3 5-6" stroke={P} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function X() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#f0f0f0" />
      <path d="M6 12l6-6M12 12L6 6" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fff',
        borderBottom: `1px solid ${BDR}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={LOGO} alt="Sweepstouch" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span
            style={{
              fontFamily: 'Montserrat, system-ui, sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: FG,
              display: 'none',
            }}
            className="demo-brand-name"
          >
            Sweepstouch
          </span>
        </a>

        <nav
          className="demo-nav-links"
          style={{ display: 'flex', alignItems: 'center', gap: 32 }}
        >
          {[
            { href: '#por-que', label: 'Por qué importa' },
            { href: '#comparativa', label: 'Comparativa' },
            { href: '#precios', label: 'Precios' },
            { href: '#roi', label: 'ROI' },
          ].map((n) => (
            <a
              key={n.href}
              href={n.href}
              style={{ fontSize: 14, fontWeight: 500, color: FG, textDecoration: 'none' }}
            >
              {n.label}
            </a>
          ))}
          <a
            href="mailto:jcvillamar@touchmile.com"
            style={{
              padding: '8px 18px',
              background: P,
              color: '#fff',
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Contacto
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#fff', paddingTop: 80, paddingBottom: 100 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('${HERO_BG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >
        <div
          className="demo-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1
                style={{
                  fontSize: 'clamp(36px, 5vw, 60px)',
                  fontWeight: 800,
                  color: FG,
                  lineHeight: 1.12,
                  margin: 0,
                }}
              >
                Plataforma de Mensajería{' '}
                <span style={{ display: 'block', color: P }}>Multicanal</span>
              </h1>
              <p style={{ fontSize: 20, color: MUTED, margin: 0 }}>SMS · MMS · RCS · WhatsApp</p>
            </div>

            <p style={{ fontSize: 17, color: FG, margin: 0, maxWidth: 440, lineHeight: 1.65 }}>
              El único servicio en el mercado hispano que mide el ROI de cada campaña. Comunica, conecta y vende más con datos reales.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Btn href="#comparativa" variant="primary">
                Ver Comparativa <ArrowRight />
              </Btn>
              <Btn href="mailto:jcvillamar@touchmile.com" variant="outline">
                Contactar
              </Btn>
            </div>

            <div
              className="demo-hero-stats"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                paddingTop: 28,
                borderTop: `1px solid ${BDR}`,
              }}
            >
              {[
                { val: '98%', label: 'Apertura SMS/MMS' },
                { val: '22.5%', label: 'Conversión WhatsApp' },
                { val: '150x', label: 'ROI WhatsApp' },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: P, margin: '0 0 4px' }}>{s.val}</p>
                  <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="demo-hero-right">
            <img
              src={CHANNELS_IMG}
              alt="Canales de mensajería"
              style={{ width: '100%', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyMatters() {
  const metrics = [
    { val: '98%', label: 'Apertura SMS/MMS', desc: 'Tasa de lectura confirmada — no estimada' },
    { val: '30%', label: 'Conversión WhatsApp', desc: 'vs 5% del SMS estándar' },
    { val: '25%', label: 'Conversión RCS', desc: 'Botones + carrusel interactivo' },
    { val: '100%', label: 'Tracking Sweepstouch', desc: 'ROI medible por campaña' },
  ];

  return (
    <section id="por-que" style={{ padding: '88px 0', background: SEC_BG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: FG, margin: '0 0 16px' }}>
            ¿Por qué importa el canal?
          </h2>
          <p style={{ fontSize: 17, color: MUTED, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Cada canal ofrece diferentes capacidades, tasas de apertura y conversión. Elige el que mejor se alinea con tus objetivos.
          </p>
        </div>

        <div
          className="demo-why-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: '36px 28px',
                textAlign: 'center',
                border: `1.5px solid ${BDR}`,
                transition: 'border-color .2s, box-shadow .2s',
              }}
            >
              <p style={{ fontSize: 52, fontWeight: 800, color: P, margin: '0 0 12px' }}>{m.val}</p>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: FG, margin: '0 0 8px' }}>{m.label}</h3>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparativa() {
  const channels = ['SMS', 'MMS', 'RCS', 'WhatsApp'];
  const rows: { label: string; vals: ReactNode[] }[] = [
    {
      label: 'Tasa de apertura',
      vals: ['95–98%', '95–98%', '70–80%', '90–95%'],
    },
    {
      label: 'Tasa de conversión',
      vals: ['5%', '8%', '25%', '30%'],
    },
    {
      label: 'Imágenes / vídeo',
      vals: [<X key="s" />, <Check key="m" />, <Check key="r" />, <Check key="w" />],
    },
    {
      label: 'Botones interactivos',
      vals: [<X key="s" />, <X key="m" />, <Check key="r" />, <Check key="w" />],
    },
    {
      label: 'Carrusel de productos',
      vals: [<X key="s" />, <X key="m" />, <Check key="r" />, <Check key="w" />],
    },
    {
      label: 'Seguimiento de entrega',
      vals: [<Check key="s" />, <Check key="m" />, <Check key="r" />, <Check key="w" />],
    },
    {
      label: 'ROI medible (Sweepstouch)',
      vals: [<Check key="s" />, <Check key="m" />, <Check key="r" />, <Check key="w" />],
    },
    {
      label: 'Costo por mensaje',
      vals: ['$0.01–0.03', '$0.03–0.06', '$0.03–0.07', '$0.05–0.12'],
    },
  ];

  const thStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontWeight: 700,
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '13px 16px',
    textAlign: 'center',
    fontSize: 13,
    color: FG,
    borderBottom: `1px solid ${BDR}`,
  };
  const tdLabelStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'left',
    fontWeight: 500,
    color: FG,
  };

  return (
    <section id="comparativa" style={{ padding: '88px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: FG, margin: '0 0 14px' }}>
            Comparativa de canales
          </h2>
          <p style={{ fontSize: 17, color: MUTED, maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            No todos los mensajes son iguales. Conoce las capacidades reales de cada canal.
          </p>
        </div>

        <div className="demo-compare-scroll">
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              minWidth: 600,
            }}
          >
            <thead>
              <tr style={{ background: FG }}>
                <th style={{ ...thStyle, textAlign: 'left', background: '#2a2a2a', minWidth: 160 }}>
                  Capacidad
                </th>
                {channels.map((ch) => (
                  <th
                    key={ch}
                    style={{
                      ...thStyle,
                      background: ch === 'WhatsApp' ? P : '#333',
                    }}
                  >
                    {ch}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={tdLabelStyle}>{row.label}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...tdStyle, verticalAlign: 'middle' }}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


function ROI() {
  const stats = [
    { val: '$100', label: 'Compra promedio / familia', sub: 'Por visita generada por campaña' },
    { val: '4×', label: 'Campañas por mes', sub: 'Frecuencia recomendada' },
    { val: '150×', label: 'ROI WhatsApp', sub: 'Retorno sobre inversión mensual' },
    { val: '1,000', label: 'Msgs / campaña activa', sub: 'Por supermercado participante' },
  ];

  return (
    <section id="roi" style={{ padding: '88px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: FG, margin: '0 0 14px' }}>
            ROI medible, no estimado
          </h2>
          <p style={{ fontSize: 17, color: MUTED, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Sweepstouch es el único proveedor que conecta cada mensaje con una visita real a la tienda. Sin suposiciones.
          </p>
        </div>

        <div
          className="demo-roi-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: SEC_BG,
                borderRadius: 14,
                padding: '28px 20px',
                textAlign: 'center',
                border: `1px solid ${BDR}`,
              }}
            >
              <p style={{ fontSize: 40, fontWeight: 800, color: P, margin: '0 0 8px' }}>{s.val}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: FG, margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.5 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* CTA block */}
        <div
          style={{
            background: FG,
            borderRadius: 18,
            padding: '48px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, maxWidth: 480 }}>
            ¿Listo para medir el retorno real de tus campañas?
          </h3>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 420, lineHeight: 1.65 }}>
            Actualmente trabajamos con 112 supermercados hispanos en EE.UU. Únete a la red.
          </p>
          <a
            href="mailto:jcvillamar@touchmile.com"
            style={{
              padding: '14px 32px',
              background: P,
              color: '#fff',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Hablar con el equipo <ArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: FG, color: '#fff', padding: '56px 0 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <div
          className="demo-footer-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginBottom: 40 }}
        >
          <div>
            <img src={LOGO} alt="Sweepstouch" style={{ width: 40, height: 40, marginBottom: 14, filter: 'invert(1)' }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>Sweepstouch</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.65, maxWidth: 220 }}>
              Plataforma de mensajería multicanal para supermercados hispanos.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Navegación</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Por qué importa', 'Comparativa', 'Precios', 'ROI'].map((label, i) => (
                <li key={label}>
                  <a
                    href={`#${['por-que', 'comparativa', 'precios', 'roi'][i]}`}
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Contacto</h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 10px', lineHeight: 1.55 }}>
              Email:{' '}
              <a
                href="mailto:jcvillamar@touchmile.com"
                style={{ color: P, textDecoration: 'none' }}
              >
                jcvillamar@touchmile.com
              </a>
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Web:{' '}
              <a
                href="https://sweepstouch.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#fff', textDecoration: 'none' }}
              >
                sweepstouch.com
              </a>
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 24 }}>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>
            © 2026 Sweepstouch LLC. Todos los derechos reservados.
          </p>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Base: 1,000 msgs/campaña · $100 compra/familia · 4 campañas/mes · 112 supermercados activos
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams?: Promise<{ t?: string }> | { t?: string };
}

export default async function DemoPage({ searchParams }: PageProps) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const hasToken = Boolean(params?.t);

  return (
    <div id="demo-root">
      {hasToken && (
        <div
          style={{
            background: '#ef0f82',
            color: '#fff',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          Modo Demo · Sweepstouch — Presentación interna
        </div>
      )}
      <Header />
      <Hero />
      <WhyMatters />
      <Comparativa />
      <PricingCalculator />
      <ROI />
      <Footer />
    </div>
  );
}
