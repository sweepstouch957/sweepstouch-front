'use client';

/** Un agente en el plano: camina (transición CSS), se elige con click/Enter y habla en globos. */
import { memo, type CSSProperties } from 'react';
import type { AgentStatus } from '../constants';
import Character from './Character';
import { iso } from './geometry';
import type { OfficePalette } from './palette';
import type { Pos } from './use-office';

const bubbleBase: CSSProperties = {
  borderRadius: 10,
  padding: '6px 8px',
  fontSize: 10.5,
  lineHeight: 1.25,
  fontFamily: 'inherit',
};

function AgentWalker({
  k,
  name,
  p,
  status,
  line,
  talking,
  reply,
  selected,
  pal,
  onToggle,
}: {
  k: string;
  name: string;
  p: Pos;
  status: AgentStatus;
  /** Lo que dice ahora (también es su aria-label). */
  line: string;
  talking: boolean;
  /** Respuesta al patrón (globo rosa), si la hay. */
  reply?: string;
  selected: boolean;
  pal: OfficePalette;
  onToggle: (k: string) => void;
}) {
  const s = iso(p.x, p.y);
  const border = pal.bubbleBorder(status);
  const isError = status === 'error';
  return (
    <g
      className="walker"
      style={{
        transform: `translate(${s.x}px, ${s.y}px)`,
        transitionDuration: `${p.ms || 600}ms`,
        cursor: 'pointer',
      }}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${line}`}
      aria-pressed={selected}
      onClick={() => onToggle(k)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(k);
        }
      }}
    >
      {selected && (
        <ellipse
          cx={0}
          cy={1}
          rx={18}
          ry={7}
          fill="none"
          stroke={pal.brand}
          strokeWidth={2}
          strokeDasharray="4 3"
          className="blink"
        />
      )}
      <Character
        k={k}
        walking={p.walking}
        typing={status === 'running' && !p.walking}
        flip={p.flip}
        status={status}
        ring={pal.ring[status]}
      />
      <text
        y={12}
        textAnchor="middle"
        fontSize={10}
        fontWeight={800}
        fill={pal.label}
        stroke={pal.labelStroke}
        strokeWidth={3}
        paintOrder="stroke"
      >
        {name}
      </text>
      {talking && (
        <foreignObject
          x={-78}
          y={-128}
          width={156}
          height={66}
          className="bubble"
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              ...bubbleBase,
              position: 'relative',
              background: isError ? pal.bubbleError : pal.bubble,
              color: isError ? pal.bubbleErrorText : pal.bubbleText,
              border: `1.5px solid ${border}`,
              boxShadow: `0 6px 16px ${pal.shadow}`,
              maxHeight: 58,
              overflow: 'hidden',
            }}
          >
            {line}
            <span
              style={{
                position: 'absolute',
                left: 70,
                bottom: -7,
                width: 11,
                height: 11,
                background: 'inherit',
                borderRight: `1.5px solid ${border}`,
                borderBottom: `1.5px solid ${border}`,
                transform: 'rotate(45deg)',
              }}
            />
          </div>
        </foreignObject>
      )}
      {reply && (
        <foreignObject
          x={-90}
          y={-150}
          width={180}
          height={70}
          className="bubble"
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              ...bubbleBase,
              background: pal.brand,
              color: pal.onBrand,
              boxShadow: `0 6px 16px ${pal.shadow}`,
            }}
          >
            {reply}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default memo(AgentWalker);
