'use client';

import { useState } from 'react';

const P = '#ef0f82';
const FG = '#404040';
const MUTED = '#999999';
const BDR = '#e0e0e0';

const TIERS = [
  { label: '1,000 contactos', count: 1_000 },
  { label: '5,000 contactos', count: 5_000 },
  { label: '10,000 contactos', count: 10_000 },
  { label: '30,000 contactos', count: 30_000 },
];

const CHANNELS = [
  { name: 'SMS',       pricesPerMsg: [0.025,   0.022,   0.020,   0.019  ], highlight: false },
  { name: 'MMS',       pricesPerMsg: [0.078,   0.068,   0.062,   0.0585 ], highlight: false },
  { name: 'RCS',       pricesPerMsg: [0.130,   0.114,   0.103,   0.100  ], highlight: false },
  { name: 'WhatsApp',  pricesPerMsg: [0.200,   0.175,   0.160,   0.150  ], highlight: true  },
];

function fmt(n: number, decimals = 4) {
  return n.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function PricingCalculator() {
  const [tier, setTier] = useState(3); // default 30,000

  const count = TIERS[tier].count;
  const smsPrice = CHANNELS[0].pricesPerMsg[tier];

  return (
    <section id="precios" style={{ padding: '88px 0', background: '#f8f9f9' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: FG, margin: '0 0 14px', fontFamily: 'Montserrat, system-ui, sans-serif', fontWeight: 800 }}>
            Precios transparentes
          </h2>
          <p style={{ fontSize: 17, color: MUTED, maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Sin contratos forzosos. Paga solo por lo que usas.
          </p>
        </div>

        {/* Tier selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              background: '#e9e9e9',
              borderRadius: 40,
              padding: 4,
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {TIERS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTier(i)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 36,
                  border: tier === i ? '1.5px solid #c0c0c0' : 'none',
                  background: tier === i ? '#fff' : 'transparent',
                  color: tier === i ? FG : MUTED,
                  fontWeight: tier === i ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channel cards */}
        <div
          className="demo-pricing-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        >
          {CHANNELS.map((ch) => {
            const price = ch.pricesPerMsg[tier];
            const total = price * count;
            const mult = price / smsPrice;
            const isBase = ch.name === 'SMS';

            return (
              <div
                key={ch.name}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '28px 24px',
                  border: `2px solid ${ch.highlight ? P : BDR}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: ch.highlight ? '0 4px 24px rgba(239,15,130,0.12)' : '0 1px 6px rgba(0,0,0,0.04)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: FG,
                    margin: 0,
                    fontFamily: 'Montserrat, system-ui, sans-serif',
                  }}
                >
                  {ch.name}
                </h3>

                <p style={{ fontSize: 13, color: ch.highlight ? P : MUTED, margin: 0, fontWeight: ch.highlight ? 600 : 400 }}>
                  por mensaje
                </p>

                <div>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: ch.highlight ? P : FG,
                      fontFamily: 'Montserrat, system-ui, sans-serif',
                    }}
                  >
                    ${fmt(price, 4)}
                  </span>
                  <p style={{ fontSize: 12, color: MUTED, margin: '4px 0 0', lineHeight: 1.4 }}>
                    por cada 1,000 mensajes
                  </p>
                </div>

                <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: MUTED }}>
                      {count.toLocaleString('en-US')} msgs:
                    </span>
                    <span style={{ fontWeight: 700, color: FG }}>{fmtUSD(total)}</span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: ch.highlight ? P : MUTED,
                    margin: 0,
                  }}
                >
                  {isBase ? 'Base' : `${mult.toFixed(1)}x el SMS`}
                </p>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: MUTED, marginTop: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Precios por mensaje enviado. Sin costos de setup ni contratos mínimos.
        </p>
      </div>
    </section>
  );
}
