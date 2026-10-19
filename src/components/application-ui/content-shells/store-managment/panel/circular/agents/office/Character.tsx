'use client';

/** Un robot de la oficina: personaje SVG propio, con su accesorio y el estado sobre la cabeza. */
import { memo } from 'react';
import type { AgentStatus } from '../constants';
import { ART, LOOK, type Accessory } from './palette';

function AccessoryArt({ acc, hair }: { acc: Accessory; hair: string }) {
  switch (acc) {
    case 'wings':
      return (
        <>
          <path
            d="M-12-50 l-7-5 l1 8z"
            fill={ART.wing}
            stroke={ART.wingLine}
          />
          <path
            d="M12-50 l7-5 l-1 8z"
            fill={ART.wing}
            stroke={ART.wingLine}
          />
        </>
      );
    case 'goggles':
      return (
        <>
          <circle
            cx={-4}
            cy={-42}
            r={4}
            fill="none"
            stroke={ART.eye}
            strokeWidth={1.5}
          />
          <circle
            cx={4}
            cy={-42}
            r={4}
            fill="none"
            stroke={ART.eye}
            strokeWidth={1.5}
          />
          <circle
            cx={0}
            cy={-50}
            r={2.2}
            fill={ART.eye}
          />
        </>
      );
    case 'bun':
      return (
        <circle
          cx={0}
          cy={-56}
          r={5}
          fill={hair}
        />
      );
    case 'helmet':
      return (
        <path
          d="M-12-46 Q-12-58 0-58 Q12-58 12-46Z"
          fill={ART.helmet}
          stroke={ART.helmetLine}
        />
      );
    case 'glasses':
      return (
        <>
          <circle
            cx={-4}
            cy={-42}
            r={3.5}
            fill={ART.lens}
            stroke={ART.eye}
            strokeWidth={1.2}
          />
          <circle
            cx={4}
            cy={-42}
            r={3.5}
            fill={ART.lens}
            stroke={ART.eye}
            strokeWidth={1.2}
          />
          <path
            d="M-13-48 Q-8-53 -4-50 M13-48 Q8-53 4-50"
            stroke={ART.brow}
            strokeWidth={1.5}
            fill="none"
          />
        </>
      );
    case 'band':
      // El degradado #rainbow vive en los <defs> del plano de la oficina.
      return (
        <path
          d="M-11-47 Q0-52 11-47"
          stroke="url(#rainbow)"
          strokeWidth={3}
          fill="none"
        />
      );
    case 'wig':
      return (
        <>
          <rect
            x={-13}
            y={-50}
            width={5}
            height={14}
            rx={2.5}
            fill={ART.wig}
          />
          <rect
            x={8}
            y={-50}
            width={5}
            height={14}
            rx={2.5}
            fill={ART.wig}
          />
        </>
      );
    default:
      return null;
  }
}

/** Estado sobre la cabeza: tilde (listo), ! (falló), punto que late (trabaja), z (espera). */
function StatusBadge({ status, ring }: { status: AgentStatus; ring: string }) {
  return (
    <>
      <circle
        cx={10}
        cy={-58}
        r={5.5}
        fill={ring}
      />
      {status === 'done' && (
        <path
          d="M7-58 l2 2 l4-4"
          stroke={ART.paper}
          strokeWidth={1.6}
          fill="none"
        />
      )}
      {(status === 'error' || status === 'waiting') && (
        <text
          x={10}
          y={-55.5}
          textAnchor="middle"
          fontSize={status === 'error' ? 8 : 7}
          fontWeight={800}
          fill={ART.paper}
        >
          {status === 'error' ? '!' : 'z'}
        </text>
      )}
      {status === 'running' && (
        <circle
          cx={10}
          cy={-58}
          r={2}
          fill={ART.paper}
          className="blink"
        />
      )}
    </>
  );
}

function Character({
  k,
  walking,
  typing,
  flip,
  status,
  ring,
}: {
  k: string;
  walking: boolean;
  typing: boolean;
  flip: boolean;
  status: AgentStatus;
  /** Color del estado (del tema). */
  ring: string;
}) {
  const L = LOOK[k] || LOOK.hermes;
  return (
    <g
      className={`ch ${walking ? 'walk' : ''} ${typing ? 'type' : ''}`}
      transform={`scale(${flip ? -1 : 1},1)`}
    >
      <ellipse
        cx={0}
        cy={1}
        rx={11}
        ry={4}
        fill={ART.shade}
      />
      {/* piernas */}
      <g className="leg l">
        <rect
          x={-7}
          y={-15}
          width={6}
          height={15}
          rx={2}
          fill={ART.pants}
        />
        <rect
          x={-8}
          y={-2}
          width={8}
          height={4}
          rx={1.5}
          fill={ART.shoes}
        />
      </g>
      <g className="leg r">
        <rect
          x={1}
          y={-15}
          width={6}
          height={15}
          rx={2}
          fill={ART.pants}
        />
        <rect
          x={0}
          y={-2}
          width={8}
          height={4}
          rx={1.5}
          fill={ART.shoes}
        />
      </g>
      {/* cuerpo */}
      <rect
        x={-10}
        y={-32}
        width={20}
        height={19}
        rx={5}
        fill={L.shirt}
      />
      <rect
        x={-4}
        y={-32}
        width={8}
        height={19}
        fill={ART.shine}
      />
      {/* brazos */}
      <g className="arm l">
        <rect
          x={-14}
          y={-30}
          width={5}
          height={14}
          rx={2.5}
          fill={L.shirt}
        />
        <circle
          cx={-11.5}
          cy={-16}
          r={3}
          fill={L.skin}
        />
      </g>
      <g className="arm r">
        <rect
          x={9}
          y={-30}
          width={5}
          height={14}
          rx={2.5}
          fill={L.shirt}
        />
        <circle
          cx={11.5}
          cy={-16}
          r={3}
          fill={L.skin}
        />
      </g>
      {/* cabeza */}
      <circle
        cx={0}
        cy={-42}
        r={11}
        fill={L.skin}
      />
      <path
        d="M-11-44 Q-10-55 0-55 Q10-55 11-44 Q6-50 0-49 Q-6-50 -11-44Z"
        fill={L.hair}
      />
      <circle
        cx={-4}
        cy={-42}
        r={1.6}
        fill={ART.eye}
      />
      <circle
        cx={4}
        cy={-42}
        r={1.6}
        fill={ART.eye}
      />
      <path
        d="M-3-37 Q0-35 3-37"
        stroke={ART.mouth}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
      <AccessoryArt
        acc={L.acc}
        hair={L.hair}
      />
      {/* estado sobre la cabeza: se des-espeja para que el tilde no salga al revés */}
      <g transform={`scale(${flip ? -1 : 1},1)`}>
        <StatusBadge
          status={status}
          ring={ring}
        />
      </g>
    </g>
  );
}

export default memo(Character);

/** El personaje suelto, quieto, para fichas y listas (fuera del plano). */
export const CharacterThumb = memo(function CharacterThumb({
  k,
  status,
  ring,
  typing = false,
  width,
  height,
}: {
  k: string;
  status: AgentStatus;
  ring: string;
  typing?: boolean;
  width: number;
  height: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="-16 -62 32 66"
      aria-hidden
    >
      <Character
        k={k}
        walking={false}
        typing={typing}
        flip={false}
        status={status}
        ring={ring}
      />
    </svg>
  );
});
