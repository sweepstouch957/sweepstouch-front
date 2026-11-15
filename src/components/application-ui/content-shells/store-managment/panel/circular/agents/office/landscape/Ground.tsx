'use client';

import { COLS, iso, poly, ROWS } from '../geometry';
import type { OfficePalette } from '../palette';
import BackPine from './BackPine';
import { GRASS, NIGHT } from './scene';

/** Borde de tierra, pinos del fondo, pasto en damero y el sendero. */
export default function Ground({ pal }: { pal: OfficePalette }) {
  const g = pal.dark ? NIGHT : GRASS;
  const r = iso(COLS, 0);
  const l = iso(0, ROWS);
  const f = iso(COLS, ROWS);
  // Pinos sobre los dos bordes traseros (donde estaban las paredes), de atrás hacia adelante.
  const pines = [
    ...Array.from({ length: 13 }, (_, i) => ({
      ...iso(i * (COLS / 12), -0.25),
      s: 1.25 + (i % 3) * 0.2,
      tone: i,
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      ...iso(-0.25, 0.6 + i * (ROWS / 10)),
      s: 1.3 + (i % 2) * 0.25,
      tone: i + 1,
    })),
  ].sort((a, b) => a.y - b.y);
  return (
    <>
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
      {pines.map((p) => (
        <BackPine
          key={`${p.x}-${p.y}`}
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
    </>
  );
}
