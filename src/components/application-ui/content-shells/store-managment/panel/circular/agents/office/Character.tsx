'use client';

/**
 * Un agente de la oficina: mago de estilo anime, diseño propio (no es un personaje de
 * ninguna serie). Capa corta del color del agente, grimorio que flota y brilla mientras
 * trabaja, su accesorio y el estado sobre la cabeza.
 */
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
      {/* aura: sólo mientras trabaja */}
      {typing && (
        <ellipse
          className="aura"
          cx={0}
          cy={-1}
          rx={15}
          ry={5.5}
          fill="none"
          stroke={L.shirt}
          strokeWidth={1.4}
        />
      )}
      {/* piernas: botas altas */}
      <g className="leg l">
        <rect x={-6.5}
y={-13}
width={5.5}
height={11}
rx={2}
fill={ART.pants} />
        <path d="M-7.5-5 h7.5 v5 q0 2 -2 2 h-5.5 q-1.5 0 -1.5-1.5z"
fill={ART.boot} />
        <rect x={-7.5}
y={-5.5}
width={7.5}
height={1.6}
rx={0.8}
fill={ART.trim} />
      </g>
      <g className="leg r">
        <rect x={1}
y={-13}
width={5.5}
height={11}
rx={2}
fill={ART.pants} />
        <path d="M0-5 h7.5 v5.5 q0 1.5 -1.5 1.5 h-5.5 q-2 0 -2-2z"
fill={ART.boot} />
        <rect x={0}
y={-5.5}
width={7.5}
height={1.6}
rx={0.8}
fill={ART.trim} />
      </g>
      {/* túnica */}
      <path d="M-8.5-31 h17 l2 19 q-10.5 3.5 -21 0z"
fill={ART.robe} />
      <path d="M-1.2-31 h2.4 l1 20 h-4.4z"
fill={L.shirt}
opacity={0.9} />
      <rect x={-9.5}
y={-20}
width={19}
height={2.4}
rx={1.2}
fill={ART.trim} />
      <circle cx={0}
cy={-18.8}
r={1.9}
fill={ART.gem}
stroke={ART.trim}
strokeWidth={0.6} />
      {/* brazos */}
      <g className="arm l">
        <rect x={-13.5}
y={-29}
width={5}
height={13}
rx={2.5}
fill={ART.robe} />
        <rect x={-13.8}
y={-19.5}
width={5.6}
height={2}
rx={1}
fill={ART.trim} />
        <circle cx={-11}
cy={-15}
r={2.8}
fill={L.skin} />
      </g>
      <g className="arm r">
        <rect x={8.5}
y={-29}
width={5}
height={13}
rx={2.5}
fill={ART.robe} />
        <rect x={8.2}
y={-19.5}
width={5.6}
height={2}
rx={1}
fill={ART.trim} />
        <circle cx={11}
cy={-15}
r={2.8}
fill={L.skin} />
      </g>
      {/* capa corta del color del agente, con ribete dorado */}
      <path
        d="M-12.5-33 Q0-37.5 12.5-33 L14.5-23.5 Q7-26.5 0-23 Q-7-26.5 -14.5-23.5Z"
        fill={L.shirt}
        stroke={ART.trim}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <path d="M-12.5-33 Q0-37.5 12.5-33 L11.5-30.5 Q0-34.5 -11.5-30.5Z"
fill={ART.shine} />
      {/* grimorio: flota al lado y brilla mientras trabaja */}
      <g className={typing ? 'book on' : 'book'}>
        {typing && <circle cx={18.5}
cy={-27}
r={7}
fill={L.shirt}
opacity={0.28}
className="blink" />}
        <path d="M13.5-31.5 l5 1.6 v9 l-5-1.6z"
fill={ART.page}
stroke={L.hair}
strokeWidth={0.7} />
        <path d="M23.5-31.5 l-5 1.6 v9 l5-1.6z"
fill={ART.page}
stroke={L.hair}
strokeWidth={0.7} />
        <path d="M14.6-28.6 l2.8.9 M14.6-26.4 l2.8.9 M22.4-28.6 l-2.8.9 M22.4-26.4 l-2.8.9"
stroke={L.shirt}
strokeWidth={0.6} />
      </g>
      {/* cabeza */}
      <circle cx={0}
cy={-42}
r={11.5}
fill={L.skin} />
      {/* pelo de punta, atrás y flequillo */}
      <path
        d="M-12.5-41 L-15.5-49 L-11-48 L-12.5-57 L-6.5-52.5 L-4-60.5 L0-53.5 L4.5-61 L6.5-52.5 L12.5-57.5 L11-48 L15.5-49.5 L12.5-41 Q9-50 0-50 Q-9-50 -12.5-41Z"
        fill={L.hair}
      />
      <path d="M-11.5-44.5 Q-8-50.5 -4.5-45.5 L-2.5-49.5 L0-44.5 L2.5-49.5 L4.5-45.5 Q8-50.5 11.5-44.5 Q7-52 0-52 Q-7-52 -11.5-44.5Z"
fill={L.hair} />
      <path d="M-7-55.5 Q-3-58 1-56"
stroke={ART.hairShine}
strokeWidth={1.1}
fill="none"
strokeLinecap="round" />
      {/* ojos grandes de anime: iris del color del agente y dos brillos */}
      <path d="M-7.6-45.6 Q-4.6-47.4 -1.8-45.6"
stroke={ART.eye}
strokeWidth={1.2}
fill="none"
strokeLinecap="round" />
      <path d="M1.8-45.6 Q4.6-47.4 7.6-45.6"
stroke={ART.eye}
strokeWidth={1.2}
fill="none"
strokeLinecap="round" />
      <ellipse cx={-4.6}
cy={-41.8}
rx={2.5}
ry={3.3}
fill={ART.eye} />
      <ellipse cx={4.6}
cy={-41.8}
rx={2.5}
ry={3.3}
fill={ART.eye} />
      <ellipse cx={-4.6}
cy={-41.1}
rx={1.7}
ry={2.3}
fill={L.shirt} />
      <ellipse cx={4.6}
cy={-41.1}
rx={1.7}
ry={2.3}
fill={L.shirt} />
      <circle cx={-5.4}
cy={-43.1}
r={0.95}
fill={ART.paper} />
      <circle cx={3.8}
cy={-43.1}
r={0.95}
fill={ART.paper} />
      <circle cx={-3.8}
cy={-40.3}
r={0.45}
fill={ART.paper} />
      <circle cx={5.4}
cy={-40.3}
r={0.45}
fill={ART.paper} />
      {/* rubor y boca */}
      <ellipse cx={-7.6}
cy={-37.6}
rx={1.9}
ry={1}
fill={ART.blush} />
      <ellipse cx={7.6}
cy={-37.6}
rx={1.9}
ry={1}
fill={ART.blush} />
      <path
        d={typing ? 'M-2-36.6 Q0-33.6 2-36.6Z' : 'M-2.2-36.4 Q0-34.6 2.2-36.4'}
        stroke={ART.mouth}
        strokeWidth={1.1}
        fill={typing ? ART.mouth : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
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
      viewBox="-18 -64 44 68"
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
