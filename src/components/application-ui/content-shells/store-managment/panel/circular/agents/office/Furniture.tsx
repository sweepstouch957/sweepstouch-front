'use client';

/**
 * Cosas del claro del bosque, en isométrico. Mismos nombres y props que cuando era una
 * oficina (la escena no cambia): el "escritorio" es un tocón con un cristal que se enciende
 * cuando el mago trabaja, la "planta" es un pino, el "café" una fogata y la "impresora" un
 * pozo de piedra.
 */
import { memo } from 'react';
import { iso } from './geometry';
import type { OfficePalette } from './palette';

/** Colores de la ilustración del bosque (fijos: son su identidad, como los personajes). */
const WOOD = { bark: '#6B4423', barkDark: '#4A2E17', top: '#D9B382', ring: '#B58A55' };
const PINE = ['#14532D', '#166534', '#15803D'];
const STONE = { light: '#9CA3AF', mid: '#6B7280', dark: '#4B5563' };

const shadow = 'rgba(0,0,0,.18)';

/** Tocón de trabajo: encima flota un cristal que brilla con el color de la marca al trabajar. */
export const Desk = memo(function Desk({
  x,
  y,
  on,
  pal,
}: {
  x: number;
  y: number;
  /** Cristal encendido: el agente está trabajando. */
  on: boolean;
  pal: OfficePalette;
}) {
  const p = iso(x + 0.55, y + 0.45);
  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <ellipse
        cx={0}
        cy={4}
        rx={25}
        ry={10}
        fill={shadow}
      />
      {/* raíces */}
      <path
        d="M-21 2 q-7 3 -9 7 q7-1 11-3z M21 2 q7 3 9 7 q-7-1 -11-3z"
        fill={WOOD.barkDark}
      />
      {/* tronco */}
      <path
        d="M-20-16 v17 q20 10 40 0 v-17z"
        fill={WOOD.bark}
      />
      <path
        d="M-12-12 v14 M-3-10 v15 M8-11 v15 M15-13 v12"
        stroke={WOOD.barkDark}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
      {/* corte con anillos */}
      <ellipse
        cx={0}
        cy={-16}
        rx={20}
        ry={8}
        fill={WOOD.top}
      />
      <ellipse
        cx={0}
        cy={-16}
        rx={13}
        ry={5}
        fill="none"
        stroke={WOOD.ring}
        strokeWidth={1}
      />
      <ellipse
        cx={0}
        cy={-16}
        rx={6}
        ry={2.3}
        fill="none"
        stroke={WOOD.ring}
        strokeWidth={1}
      />
      {/* cristal */}
      {on && (
        <ellipse
          className="screen"
          cx={0}
          cy={-17}
          rx={11}
          ry={4}
          fill={pal.brand}
          opacity={0.35}
        />
      )}
      <g className={on ? 'book on' : ''}>
        <path
          d="M0-44 l6 9 l-6 12 l-6-12z"
          fill={on ? pal.brand : STONE.light}
          className={on ? 'screen' : ''}
        />
        <path
          d="M0-44 l6 9 l-6 3z"
          fill="rgba(255,255,255,.4)"
        />
        <path
          d="M0-23 l-6-12 l6 3z"
          fill="rgba(0,0,0,.18)"
        />
      </g>
      {/* hongo al pie */}
      <path
        d="M-17 5 v-5"
        stroke="#F5F0E6"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M-22 0 q5-7 10 0z"
        fill="#DC2626"
      />
      <circle
        cx={-18.5}
        cy={-2.2}
        r={0.9}
        fill="#fff"
      />
    </g>
  );
});

/** Pino. */
export const Plant = memo(function Plant({ x, y }: { x: number; y: number }) {
  const p = iso(x, y);
  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <ellipse
        cx={0}
        cy={1}
        rx={14}
        ry={5}
        fill={shadow}
      />
      <rect
        x={-3}
        y={-12}
        width={6}
        height={13}
        rx={1.5}
        fill={WOOD.bark}
      />
      <path
        d="M-18-10 L0-36 L18-10z"
        fill={PINE[0]}
      />
      <path
        d="M-14-26 L0-50 L14-26z"
        fill={PINE[1]}
      />
      <path
        d="M-10-42 L0-62 L10-42z"
        fill={PINE[2]}
      />
      <path
        d="M0-62 L10-42 L3-42z M0-50 L14-26 L5-26z M0-36 L18-10 L7-10z"
        fill="rgba(255,255,255,.1)"
      />
    </g>
  );
});

/** Fogata: donde se juntan los que esperan. */
export const Coffee = memo(function Coffee({
  x,
  y,
}: {
  x: number;
  y: number;
  pal: OfficePalette;
}) {
  const p = iso(x + 0.5, y + 0.4);
  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <ellipse
        cx={0}
        cy={2}
        rx={17}
        ry={7}
        fill={shadow}
      />
      {/* piedras */}
      {[-13, -6, 2, 10].map((sx, i) => (
        <ellipse
          key={sx}
          cx={sx + 1}
          cy={i % 2 ? 4 : 1}
          rx={4.5}
          ry={3}
          fill={i % 2 ? STONE.mid : STONE.light}
        />
      ))}
      {/* leños */}
      <path
        d="M-11-1 l22-5 M-11-6 l22 5"
        stroke={WOOD.barkDark}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* fuego */}
      <path
        className="screen"
        d="M0-26 q8 9 6 16 q-1 6 -6 6 q-5 0 -6-6 q-1-6 3-9 q0 4 2 4 q2-4 1-11z"
        fill="#F97316"
      />
      <path
        className="screen"
        d="M0-17 q4 5 3 9 q-1 3 -3 3 q-3 0 -3-4 q0-3 3-8z"
        fill="#FDE047"
      />
      {/* humo */}
      <g
        className="steam"
        fill="none"
        stroke="rgba(148,163,184,.8)"
        strokeWidth={1.6}
        strokeLinecap="round"
      >
        <path d="M-2-30 q-4-4 0-8 q4-4 0-8" />
        <path d="M4-33 q-3-3 0-6" />
      </g>
    </g>
  );
});

/** Pozo de piedra. */
export const Printer = memo(function Printer({
  x,
  y,
}: {
  x: number;
  y: number;
  pal: OfficePalette;
}) {
  const p = iso(x + 0.5, y + 0.4);
  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <ellipse
        cx={0}
        cy={3}
        rx={20}
        ry={8}
        fill={shadow}
      />
      <path
        d="M-15-12 v12 q15 8 30 0 v-12z"
        fill={STONE.mid}
      />
      <path
        d="M-15-6 q15 8 30 0 M-6-11 v13 M6-11 v13"
        stroke={STONE.dark}
        strokeWidth={1.1}
        fill="none"
      />
      <ellipse
        cx={0}
        cy={-12}
        rx={15}
        ry={6}
        fill={STONE.light}
      />
      <ellipse
        cx={0}
        cy={-12}
        rx={10}
        ry={3.8}
        fill="#0EA5E9"
        opacity={0.75}
      />
      {/* techito */}
      <path
        d="M-13-13 v-20 M13-13 v-20"
        stroke={WOOD.bark}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <path
        d="M-19-31 L0-44 L19-31z"
        fill={WOOD.barkDark}
      />
      <path
        d="M0-44 L19-31 L8-31z"
        fill="rgba(255,255,255,.12)"
      />
    </g>
  );
});
