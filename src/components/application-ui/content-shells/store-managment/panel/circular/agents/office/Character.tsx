'use client';

/**
 * Un agente de la oficina: mago chibi de dibujo propio, con colores y accesorio inspirados
 * en los Toros Negros de Black Clover (ver LOOK). Capa corta del color del agente, grimorio que flota y brilla mientras
 * trabaja, su accesorio y el estado sobre la cabeza.
 */
import { memo } from 'react';
import type { AgentStatus } from '../constants';
import { ART, LOOK, type Accessory } from './palette';

function AccessoryArt({ acc, hair, tint }: { acc: Accessory; hair: string; tint: string }) {
  switch (acc) {
    case 'portal':
      // Portal de magia espacial flotando junto a la mano.
      return (
        <g className="book">
          <ellipse
            cx={-18.5}
            cy={-25}
            rx={3.6}
            ry={6}
            fill="#0B1020"
            stroke={tint}
            strokeWidth={1.3}
          />
          <ellipse
            cx={-18.5}
            cy={-25}
            rx={1.6}
            ry={3}
            fill="none"
            stroke="#A7F3D0"
            strokeWidth={0.7}
          />
        </g>
      );
    case 'pendant':
      // Colgante de piedra azul.
      return (
        <>
          <path
            d="M-5-31.5 Q0-26.5 5-31.5"
            stroke={ART.trim}
            strokeWidth={0.8}
            fill="none"
          />
          <path
            d="M0-30.2 l2 2.6 l-2 3 l-2-3z"
            fill={ART.gem}
            stroke={ART.trim}
            strokeWidth={0.5}
          />
        </>
      );
    case 'twintails':
      // Dos coletas largas con lazo.
      return (
        <>
          <path
            d="M-12-49 Q-21-44 -18-30 Q-17-25 -19.5-21 Q-13-25 -13.5-33 Q-14-42 -10.5-46z"
            fill={hair}
          />
          <path
            d="M12-49 Q21-44 18-30 Q17-25 19.5-21 Q13-25 13.5-33 Q14-42 10.5-46z"
            fill={hair}
          />
          <circle
            cx={-12.5}
            cy={-48.5}
            r={1.9}
            fill={tint}
          />
          <circle
            cx={12.5}
            cy={-48.5}
            r={1.9}
            fill={tint}
          />
        </>
      );
    case 'headband':
      // Cinta negra con el emblema dorado.
      return (
        <>
          <path
            d="M-11.6-47.6 Q0-52.6 11.6-47.6 L11.4-44.8 Q0-49.8 -11.4-44.8Z"
            fill="#111827"
          />
          <path
            d="M0-50.6 l1.5 1.5 l-1.5 1.5 l-1.5-1.5z"
            fill={ART.trim}
          />
        </>
      );
    case 'hat':
      // Melena larga y sombrero de bruja caído hacia atrás.
      return (
        <>
          <path
            d="M-12-46 Q-17-36 -14.5-25 Q-11-29 -11-38z M12-46 Q17-36 14.5-25 Q11-29 11-38z"
            fill={hair}
          />
          <path
            d="M-9-51.5 Q-9-58 -13-63.5 Q-2-62 3-52.5Z"
            fill="#4C1D95"
          />
          <ellipse
            cx={-1}
            cy={-51.5}
            rx={14.5}
            ry={3.4}
            fill="#5B21B6"
          />
          <path
            d="M-9.5-53.2 Q-3-55.4 3.4-53.6"
            stroke={tint}
            strokeWidth={1.4}
            fill="none"
          />
        </>
      );
    case 'eyelock':
      // Mechón que tapa un ojo (el del espejo).
      return (
        <path
          d="M1-51.5 Q11.5-51 11.8-40 Q9.5-37.2 2.2-38.6 Q4.2-45 1-51.5Z"
          fill={hair}
        />
      );
    case 'katana':
      // Katana a la espalda y barba de tres días.
      return (
        <>
          <path
            d="M-9-32 L-17.5-51"
            stroke="#0B0B12"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <path
            d="M-15.4-43.6 l3.6-1.6"
            stroke={ART.trim}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <path
            d="M-4.4-33.6 Q0-31 4.4-33.6"
            stroke="#1F2937"
            strokeWidth={1.7}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
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
fill={L.robe || ART.robe} />
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
fill={L.robe || ART.robe} />
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
fill={L.robe || ART.robe} />
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
        tint={L.shirt}
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
      viewBox="-23 -66 49 70"
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
