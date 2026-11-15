'use client';

import { iso } from '../geometry';
import { MANA } from './scene';

/** Motas de maná que suben sobre el claro. */
export default function Mana() {
  return (
    <>
      {/* Motas de maná */}
      {MANA.map(([tx, ty, h, col], i) => {
        const p = iso(tx, ty);
        return (
          <circle
            key={`${tx}-${ty}`}
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
