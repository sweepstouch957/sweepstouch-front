'use client';

import { TREES } from './scene';

/** Pino del fondo, parado sobre el borde trasero del claro. */
export default function BackPine({
  x,
  y,
  s,
  tone,
}: {
  x: number;
  y: number;
  s: number;
  tone: number;
}) {
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
