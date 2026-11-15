'use client';

/**
 * El claro del bosque donde trabajan los magos: cielo, montañas y una hilera de pinos al
 * fondo, pasto en damero suave y un sendero de tierra. No se mueve. (El archivo conserva el
 * nombre de cuando era una oficina; la escena y la geometría son las mismas.)
 */
import { memo } from 'react';
import { COLS, iso, poly, ROWS } from './geometry';
import { ART, type OfficePalette } from './palette';

const GRASS = { a: '#86C76B', b: '#79BD5F', line: 'rgba(22,101,52,.14)', edge: '#4D8B3A', dirt: '#8B6B45' };
const NIGHT = { a: '#2F5A33', b: '#2A5230', line: 'rgba(0,0,0,.2)', edge: '#1D3A22', dirt: '#5A4530' };
const TREES = ['#14532D', '#166534', '#15803D'];

/** Pino del fondo, parado sobre el borde trasero del claro. */
function BackPine({ x, y, s, tone }: { x: number; y: number; s: number; tone: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect
        x={-2.5}
        y={-10}
        width={5}
        height={12}
        fill="#4A2E17"
      />
      <path
        d="M-16-8 L0-34 L16-8z"
        fill={TREES[tone % 3]}
      />
      <path
        d="M-12-24 L0-46 L12-24z"
        fill={TREES[(tone + 1) % 3]}
      />
      <path
        d="M-8-38 L0-56 L8-38z"
        fill={TREES[(tone + 2) % 3]}
      />
    </g>
  );
}

function OfficeRoom({ pal }: { pal: OfficePalette }) {
  const g = pal.dark ? NIGHT : GRASS;
  const o = iso(0, 0);
  const r = iso(COLS, 0);
  const l = iso(0, ROWS);
  const f = iso(COLS, ROWS);
  // Pinos sobre los dos bordes traseros (donde estaban las paredes), de atrás hacia adelante.
  const pines = [
    ...Array.from({ length: 13 }, (_, i) => ({ ...iso(i * (COLS / 12), -0.25), s: 1.25 + (i % 3) * 0.2, tone: i })),
    ...Array.from({ length: 10 }, (_, i) => ({ ...iso(-0.25, 0.6 + i * (ROWS / 10)), s: 1.3 + (i % 2) * 0.25, tone: i + 1 })),
  ].sort((a, b) => a.y - b.y);

  return (
    <>
      <defs>
        {/* Lo usa la banda de Iris (accesorio del personaje). */}
        <linearGradient
          id="rainbow"
          x1="0"
          x2="1"
        >
          <stop
            offset="0"
            stopColor={ART.rainbow[0]}
          />
          <stop
            offset=".5"
            stopColor={ART.rainbow[1]}
          />
          <stop
            offset="1"
            stopColor={ART.rainbow[2]}
          />
        </linearGradient>
        <linearGradient
          id="sky"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            stopColor={pal.dark ? '#0B1B33' : '#BAE6FD'}
          />
          <stop
            offset="1"
            stopColor={pal.dark ? '#1E3A4C' : '#ECFCCB'}
          />
        </linearGradient>
      </defs>

      {/* Cielo */}
      <rect
        x={l.x - 30}
        y={-140}
        width={r.x - l.x + 60}
        height={140 + l.y}
        fill="url(#sky)"
        rx={18}
      />
      {/* sol o luna */}
      <circle
        cx={r.x - 60}
        cy={-104}
        r={15}
        fill={pal.dark ? '#E2E8F0' : '#FDE68A'}
        opacity={0.9}
      />
      {/* montañas lejanas */}
      <path
        d={`M${l.x - 30} ${o.y + 30} L${l.x + 70} -62 L${l.x + 150} ${o.y - 10} L${o.x - 40} -96 L${o.x + 70} ${o.y - 20} L${o.x + 170} -74 L${r.x - 40} ${o.y + 10} L${r.x + 30} -40 L${r.x + 30} ${r.y + 40} L${l.x - 30} ${l.y}z`}
        fill={pal.dark ? '#16324A' : '#93C5B4'}
        opacity={0.55}
      />
      {/* nubes */}
      {!pal.dark &&
        [
          [o.x - 150, -112, 1],
          [o.x + 40, -124, 0.8],
        ].map(([cx, cy, s]) => (
          <g
            key={cx}
            transform={`translate(${cx},${cy}) scale(${s})`}
            fill="#fff"
            opacity={0.85}
          >
            <ellipse
              cx={0}
              cy={0}
              rx={22}
              ry={8}
            />
            <ellipse
              cx={-10}
              cy={-6}
              rx={11}
              ry={8}
            />
            <ellipse
              cx={8}
              cy={-8}
              rx={13}
              ry={9}
            />
          </g>
        ))}

      {/* Borde de tierra del claro (da grosor al piso) */}
      <polygon
        points={poly([l, f, { ...f, dy: -12 }, { ...l, dy: -12 }])}
        fill={g.dirt}
      />
      <polygon
        points={poly([f, r, { ...r, dy: -12 }, { ...f, dy: -12 }])}
        fill={g.edge}
      />

      {/* Hilera de pinos del fondo */}
      {pines.map((p, i) => (
        <BackPine
          key={i}
          x={p.x}
          y={p.y}
          s={p.s}
          tone={p.tone}
        />
      ))}

      {/* Pasto */}
      {Array.from({ length: ROWS }).flatMap((_, y) =>
        Array.from({ length: COLS }).map((__, x) => (
          <polygon
            key={`${x}-${y}`}
            points={poly([iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)])}
            fill={(x + y) % 2 ? g.a : g.b}
            stroke={g.line}
            strokeWidth={1}
          />
        ))
      )}
      {/* Sendero de tierra que cruza el claro */}
      <polygon
        points={poly([iso(0, 3.9), iso(COLS, 3.9), iso(COLS, 4.9), iso(0, 4.9)])}
        fill={g.dirt}
        opacity={0.45}
      />
      {/* Matas y flores sueltas */}
      {[
        [1.2, 1.1, '#F472B6'],
        [6.6, 7.4, '#FDE047'],
        [9.6, 1.4, '#fff'],
        [3.2, 6.9, '#fff'],
        [11.2, 6.2, '#F472B6'],
        [7.4, 3.1, '#FDE047'],
      ].map(([tx, ty, c]) => {
        const p = iso(tx as number, ty as number);
        return (
          <g
            key={`${tx}-${ty}`}
            transform={`translate(${p.x},${p.y})`}
          >
            <path
              d="M-4 0 q1-6 2-7 M0 0 v-8 M4 0 q-1-6 -2-7"
              stroke={pal.dark ? '#3F7A45' : '#3F8F3A'}
              strokeWidth={1.4}
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx={0}
              cy={-9}
              r={1.8}
              fill={c as string}
            />
          </g>
        );
      })}
    </>
  );
}

export default memo(OfficeRoom);
