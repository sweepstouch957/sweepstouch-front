'use client';

import { iso } from '../geometry';
import type { OfficePalette } from '../palette';
import { CLOVERS, LEAVES_4, LEAVES_5 } from './scene';

/** Tréboles de cuatro hojas sobre el pasto (y el negro de cinco). */
export default function Clovers({ pal }: { pal: OfficePalette }) {
  return (
    <>
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
            {(black ? LEAVES_5 : LEAVES_4).map((ang) => {
              return (
                <circle
                  key={ang}
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
    </>
  );
}
