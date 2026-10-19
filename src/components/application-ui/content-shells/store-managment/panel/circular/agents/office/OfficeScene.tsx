'use client';

/** El plano SVG de la oficina: sala fija + muebles y personajes ordenados por profundidad. */
import type { Pipeline } from '@/services/circular.service';
import type { ReactElement } from 'react';
import type { AgentStatus } from '../constants';
import AgentWalker from './AgentWalker';
import { Coffee, Desk, Plant, Printer } from './Furniture';
import { COFFEE, DESK, PLANTS, PRINTER, VIEWBOX } from './geometry';
import OfficeRoom from './OfficeRoom';
import type { OfficePalette } from './palette';
import type { Pos } from './use-office';

export default function OfficeScene({
  keys,
  agents,
  statuses,
  pos,
  lines,
  talking,
  reply,
  selected,
  pal,
  onToggle,
}: {
  keys: string[];
  agents: Pipeline['agents'];
  statuses: Record<string, AgentStatus>;
  pos: Record<string, Pos>;
  lines: Record<string, string>;
  talking: Set<string>;
  reply: Record<string, string>;
  selected: string | null;
  pal: OfficePalette;
  onToggle: (k: string) => void;
}) {
  // Muebles y personajes, pintados por profundidad (x+y) para que se tapen bien.
  const scene: { z: number; el: ReactElement }[] = [
    ...keys.map((k) => ({
      z: DESK[k].x + DESK[k].y + 1,
      el: (
        <Desk
          key={`d-${k}`}
          x={DESK[k].x}
          y={DESK[k].y}
          on={statuses[k] === 'running'}
          pal={pal}
        />
      ),
    })),
    ...PLANTS.map((p, i) => ({
      z: p.x + p.y,
      el: (
        <Plant
          key={`p-${i}`}
          x={p.x}
          y={p.y}
        />
      ),
    })),
    {
      z: 0.4 + 8.5 + 0.5,
      el: (
        <Coffee
          key="coffee"
          {...COFFEE}
          pal={pal}
        />
      ),
    },
    {
      z: 4 + 8.8 + 0.5,
      el: (
        <Printer
          key="printer"
          {...PRINTER}
          pal={pal}
        />
      ),
    },
    ...keys.map((k) => ({
      z: pos[k].x + pos[k].y + 0.6,
      el: (
        <AgentWalker
          key={`c-${k}`}
          k={k}
          name={agents[k].name}
          p={pos[k]}
          status={statuses[k]}
          line={lines[k]}
          talking={talking.has(k)}
          reply={reply[k]}
          selected={selected === k}
          pal={pal}
          onToggle={onToggle}
        />
      ),
    })),
  ];
  scene.sort((a, b) => a.z - b.z);

  return (
    <svg
      viewBox={VIEWBOX}
      width="100%"
      style={{ display: 'block', maxHeight: 560 }}
      role="img"
      aria-label="Oficina de los agentes"
    >
      <OfficeRoom pal={pal} />
      {scene.map((it) => it.el)}
    </svg>
  );
}
