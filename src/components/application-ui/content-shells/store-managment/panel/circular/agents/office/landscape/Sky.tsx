'use client';

import { COLS, iso, ROWS } from '../geometry';
import { STARS, type Colors } from './scene';

const WIDE = 2000;

/** Cielo del atardecer, estrellas, luna, montañas y el castillo real. */
export default function Sky({ c, dark }: { c: Colors; dark: boolean }) {
  const o = iso(0, 0);
  const r = iso(COLS, 0);
  const l = iso(0, ROWS);
  return (
    <>
      <defs>
        {/* En coordenadas del dibujo: el degradado no cambia aunque el rect se estire. */}
        <linearGradient
          id="sky"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={-140}
          x2="0"
          y2={l.y}
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
        <linearGradient
          id="field"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={o.y + 100}
          x2="0"
          y2={l.y + 220}
        >
          <stop
            offset="0"
            stopColor={c.field[0]}
          />
          <stop
            offset="1"
            stopColor={c.field[1]}
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

      {/* Cielo y valle: más anchos que el dibujo para tapar las franjas cuando la tarjeta es
          más ancha; los bordes redondeados los pone la tarjeta (overflow hidden). */}
      <rect
        x={-WIDE}
        y={-140}
        width={WIDE * 2}
        height={140 + l.y}
        fill="url(#sky)"
      />
      <rect
        x={-WIDE}
        y={o.y + 100}
        width={WIDE * 2}
        height={WIDE}
        fill="url(#field)"
      />
      {STARS.map(([sx, sy, sr], i) => (
        <circle
          key={`${sx},${sy}`}
          cx={sx}
          cy={sy}
          r={sr}
          fill="#fff"
          opacity={dark ? 0.9 : 0.75}
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
        // Sigue hasta los bordes (±WIDE) con laderas suaves: sin cortes cuando la tarjeta es ancha.
        d={`M${-WIDE} ${o.y + 40} L${l.x - 120} ${o.y + 20} L${l.x - 30} ${o.y + 30} L${
          l.x + 70
        } -62 L${l.x + 150} ${o.y - 10} L${o.x - 40} -96 L${o.x + 70} ${o.y - 20} L${
          o.x + 170
        } -74 L${r.x - 40} ${o.y + 10} L${r.x + 30} -40 L${r.x + 130} ${o.y + 10} L${WIDE} ${
          o.y + 40
        } L${WIDE} ${r.y + 40} L${-WIDE} ${r.y + 40}z`}
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
    </>
  );
}
