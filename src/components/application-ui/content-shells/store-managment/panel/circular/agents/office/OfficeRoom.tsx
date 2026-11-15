'use client';

/**
 * El claro donde trabajan los magos, ambientado en el Reino del Trébol: atardecer violeta,
 * la calavera del demonio, el castillo real a lo lejos y la base de los Toros Negros; pinos
 * al fondo, pasto en damero con tréboles y un sendero de tierra. No se mueve (salvo brillos).
 * (El archivo conserva el nombre de cuando era una oficina; la geometría es la misma.)
 */
import { memo } from 'react';
import { COLS, iso, poly, ROWS } from './geometry';
import type { OfficePalette } from './palette';

const GRASS = { a: '#86C76B', b: '#79BD5F', line: 'rgba(22,101,52,.14)', edge: '#4D8B3A', dirt: '#8B6B45' };
const NIGHT = { a: '#2F5A33', b: '#2A5230', line: 'rgba(0,0,0,.2)', edge: '#1D3A22', dirt: '#5A4530' };
const TREES = ['#0F4C3A', '#14603F', '#1A7A4C'];

/** Colores fijos de la ilustración del fondo (como los personajes: son su identidad). */
const SCENE = {
  light: {
    sky: ['#312E81', '#7C3AED', '#F472B6', '#FDBA74'],
    far: '#6D5BA8',
    castle: '#4C3F8F',
    skull: '#8E86B5',
    skullDark: '#655D8C',
    socket: '#2A2347',
    base: '#2A2440',
    baseLight: '#3A3357',
    roof: '#9F1239',
    gold: '#F5C84B',
  },
  dark: {
    sky: ['#05040F', '#1E1B4B', '#5B21B6', '#9D4EDD'],
    far: '#2B2552',
    castle: '#1D1840',
    skull: '#4B4570',
    skullDark: '#342F55',
    socket: '#120E24',
    base: '#15111F',
    baseLight: '#211B33',
    roof: '#6B0F2A',
    gold: '#E0B040',
  },
};

// [x, y, radio]
const STARS = [
  [-296, -124, 1.1],
  [-250, -100, 0.8],
  [-205, -128, 1.3],
  [-160, -92, 0.9],
  [-128, -122, 0.8],
  [-20, -128, 1.2],
  [18, -104, 0.8],
  [62, -126, 1],
  [104, -110, 0.8],
  [226, -122, 1.2],
  [262, -96, 0.9],
  [300, -130, 1],
  [344, -108, 1.3],
  [388, -126, 0.9],
  [396, -70, 0.8],
  [-300, -60, 0.9],
  [232, -62, 0.8],
  [-110, -70, 0.7],
];

// Ventanas encendidas de la base: [x, y]
const WINDOWS = [
  [264, 14],
  [264, 44],
  [298, 6],
  [309, 6],
  [282, 48],
  [300, 48],
  [318, 48],
  [341, 10],
  [342, 46],
  [291, 74],
  [311, 74],
];

// Tréboles sobre el pasto: [tile x, tile y, hojas]. El de cinco hojas es negro, el de Asta.
const CLOVERS = [
  [1.2, 1.1, 4],
  [6.6, 7.4, 4],
  [9.6, 1.4, 4],
  [3.2, 6.9, 5],
  [11.2, 6.2, 4],
  [7.4, 3.1, 4],
  [0.7, 3.4, 4],
  [10.2, 8.3, 4],
];

// Motas de maná que suben sobre el claro: [tile x, tile y, alto, color]
const MANA: Array<[number, number, number, string]> = [
  [1.5, 3, 26, '#C4B5FD'],
  [4.2, 1.2, 40, '#FDE68A'],
  [7.2, 4.4, 30, '#C4B5FD'],
  [9.8, 2.6, 44, '#A7F3D0'],
  [3.4, 7.2, 34, '#FDE68A'],
  [10.6, 6.4, 28, '#C4B5FD'],
  [6.2, 7.8, 46, '#A7F3D0'],
  [0.8, 5.6, 38, '#FDE68A'],
];

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
  const c = pal.dark ? SCENE.dark : SCENE.light;
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
        <linearGradient
          id="sky"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            stopColor={c.sky[0]}
          />
          <stop
            offset=".2"
            stopColor={c.sky[1]}
          />
          <stop
            offset=".36"
            stopColor={c.sky[2]}
          />
          <stop
            offset=".48"
            stopColor={c.sky[3]}
          />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop
            offset="0"
            stopColor="#FEF3C7"
            stopOpacity={0.55}
          />
          <stop
            offset="1"
            stopColor="#FEF3C7"
            stopOpacity={0}
          />
        </radialGradient>
      </defs>

      {/* Cielo del atardecer */}
      <rect
        x={l.x - 30}
        y={-140}
        width={r.x - l.x + 60}
        height={140 + l.y}
        fill="url(#sky)"
        rx={18}
      />
      {STARS.map(([sx, sy, sr], i) => (
        <circle
          key={`s${i}`}
          cx={sx}
          cy={sy}
          r={sr}
          fill="#fff"
          opacity={pal.dark ? 0.9 : 0.75}
          className={i % 3 === 0 ? 'blink' : undefined}
        />
      ))}
      {/* luna con halo */}
      <circle
        cx={-78}
        cy={-98}
        r={36}
        fill="url(#moonGlow)"
      />
      <circle
        cx={-78}
        cy={-98}
        r={17}
        fill="#FDF4D7"
      />
      <circle
        cx={-73}
        cy={-102}
        r={12}
        fill="#FFFBEB"
        opacity={0.8}
      />
      {/* montañas lejanas */}
      <path
        d={`M${l.x - 30} ${o.y + 30} L${l.x + 70} -62 L${l.x + 150} ${o.y - 10} L${o.x - 40} -96 L${o.x + 70} ${o.y - 20} L${o.x + 170} -74 L${r.x - 40} ${o.y + 10} L${r.x + 30} -40 L${r.x + 30} ${r.y + 40} L${l.x - 30} ${l.y}z`}
        fill={c.far}
      />
      {/* castillo real, lejos, sobre la cima */}
      <g fill={c.castle}>
        <path d="M146-90 h10 v22 h-10z M144-90 l7-14 l7 14z" />
        <path d="M184-90 h10 v22 h-10z M182-90 l7-14 l7 14z" />
        <path d="M160-100 h20 v32 h-20z M157-100 l13-24 l13 24z" />
        <path d="M140-74 h60 v12 h-60z" />
      </g>
      <path
        d="M170-124 v-9 l7 3 l-7 3z"
        stroke={c.gold}
        strokeWidth={1}
        fill={c.gold}
      />

      {/* la calavera gigante del demonio, con la estatua del primer Rey Mago encima */}
      <path
        d="M-262-12 Q-294-30 -287-74 Q-270-44 -249-35z M-188-12 Q-156-30 -163-74 Q-180-44 -201-35z"
        fill={c.skullDark}
      />
      <path
        d="M-270 70 V8 Q-270-46 -225-46 Q-180-46 -180 8 V70z"
        fill={c.skull}
      />
      <path
        d="M-225-46 Q-180-46 -180 8 V70 h-14 V8 Q-194-30 -225-46z"
        fill={c.skullDark}
        opacity={0.55}
      />
      {[-244, -207].map((ex) => (
        <g key={ex}>
          <ellipse
            cx={ex}
            cy={6}
            rx={11}
            ry={13}
            fill={c.socket}
          />
          <circle
            className="blink"
            cx={ex}
            cy={8}
            r={3}
            fill="#F87171"
          />
        </g>
      ))}
      <path
        d="M-225 20 l-5 12 h10z"
        fill={c.socket}
      />
      <path
        d="M-252 44 V70 M-241 44 V70 M-230 44 V70 M-219 44 V70 M-208 44 V70 M-197 44 V70 M-258 44 H-192"
        stroke={c.socket}
        strokeWidth={1.6}
        fill="none"
      />
      <path
        d="M-225-46 v-11 M-229-53 h8 M-221-55 l5-9"
        stroke={c.skullDark}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />

      {/* la base de los Toros Negros: torres torcidas, ventanas encendidas y su estandarte */}
      <path
        d="M258 104 V0 h24 V104z M330 104 L334-8 L356-6 V104z"
        fill={c.base}
      />
      <path
        d="M270 104 V30 h70 V104z"
        fill={c.baseLight}
      />
      <path
        d="M284 30 L288-2 L322-6 L324 30z"
        fill={c.base}
      />
      <rect
        x={312}
        y={-24}
        width={6}
        height={14}
        fill={c.base}
      />
      <path
        d="M254 0 L270-28 L286 0z M329-8 L346-40 L361-6z M282-2 L306-26 L328-7z"
        fill={c.roof}
      />
      <path
        d="M270-28 L286 0 h-8z M346-40 L361-6 l-8-.5z M306-26 L328-7 l-9 .5z"
        fill="rgba(0,0,0,.22)"
      />
      {WINDOWS.map(([wx, wy], i) => (
        <rect
          key={`w${i}`}
          x={wx}
          y={wy}
          width={6}
          height={9}
          rx={3}
          fill="#FDE68A"
          className={i % 4 === 1 ? 'blink' : undefined}
        />
      ))}
      <path
        d="M270-28 v-20"
        stroke={c.gold}
        strokeWidth={1.4}
      />
      <path
        d="M270-48 h16 l-4 5 l4 5 h-16z"
        fill="#0B0B12"
        stroke={c.gold}
        strokeWidth={1}
      />
      <path
        className="steam"
        d="M315-27 q-4-4 0-8 q4-4 0-8"
        fill="none"
        stroke="rgba(226,232,240,.7)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />

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
      {/* Tréboles */}
      {CLOVERS.map(([tx, ty, n]) => {
        const p = iso(tx, ty);
        const black = n === 5;
        return (
          <g
            key={`${tx}-${ty}`}
            transform={`translate(${p.x},${p.y})`}
          >
            <path
              d="M0 0 q-1-4 0-7"
              stroke={pal.dark ? '#3F7A45' : '#2F7D32'}
              strokeWidth={1.3}
              strokeLinecap="round"
              fill="none"
            />
            {Array.from({ length: n }, (_, i) => {
              const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
              return (
                <circle
                  key={i}
                  cx={Math.cos(ang) * 2.6}
                  cy={-9 + Math.sin(ang) * 2.6}
                  r={2.3}
                  fill={black ? '#18181B' : pal.dark ? '#4ADE80' : '#16A34A'}
                  stroke={black ? '#DC2626' : 'rgba(255,255,255,.4)'}
                  strokeWidth={0.5}
                />
              );
            })}
          </g>
        );
      })}
      {/* Motas de maná */}
      {MANA.map(([tx, ty, h, col], i) => {
        const p = iso(tx, ty);
        return (
          <circle
            key={`m${i}`}
            className="steam"
            style={{
              animationDelay: `${(i * 0.37) % 2.2}s`,
              animationDuration: `${2.4 + (i % 3) * 0.7}s`,
            }}
            cx={p.x}
            cy={p.y - h}
            r={1.6 + (i % 2) * 0.6}
            fill={col}
          />
        );
      })}
    </>
  );
}

export default memo(OfficeRoom);
