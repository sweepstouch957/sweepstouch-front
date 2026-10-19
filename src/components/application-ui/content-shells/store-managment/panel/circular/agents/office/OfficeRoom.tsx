'use client';

/** La sala: paredes con ventana, pizarra y reloj, piso en damero y alfombra. No se mueve. */
import { memo } from 'react';
import { COLS, iso, poly, ROWS, WALL_H } from './geometry';
import { ART, type OfficePalette } from './palette';

/** Rectángulo pintado sobre una pared, entre dos puntos de tile y dos alturas. */
const wallRect = (from: [number, number], to: [number, number], hi: number, lo: number) => {
  const a = iso(...from);
  const b = iso(...to);
  return poly([
    { ...a, dy: hi },
    { ...b, dy: hi },
    { ...b, dy: lo },
    { ...a, dy: lo },
  ]);
};

function OfficeRoom({ pal }: { pal: OfficePalette }) {
  const o = iso(0, 0);
  const r = iso(COLS, 0);
  const l = iso(0, ROWS);
  const clock = iso(3, 0);
  const board = iso(0, 1.4);
  const boardEnd = iso(0, 4.6);

  return (
    <>
      <defs>
        <linearGradient
          id="rainbow"
          x1="0"
          x2="1"
        >
          <stop
            offset="0"
            stopColor={ART.rainbow[0]}
          />
          <stop
            offset=".5"
            stopColor={ART.rainbow[1]}
          />
          <stop
            offset="1"
            stopColor={ART.rainbow[2]}
          />
        </linearGradient>
        <linearGradient
          id="win"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            stopColor={ART.sky[0]}
          />
          <stop
            offset="1"
            stopColor={ART.sky[1]}
          />
        </linearGradient>
      </defs>

      {/* Paredes */}
      <polygon
        points={poly([{ ...o, dy: WALL_H }, { ...r, dy: WALL_H }, r, o])}
        fill={pal.wallR}
      />
      <polygon
        points={poly([{ ...o, dy: WALL_H }, { ...l, dy: WALL_H }, l, o])}
        fill={pal.wallL}
      />
      {/* ventana pared derecha */}
      <polygon
        points={wallRect([6.5, 0], [10, 0], 100, 45)}
        fill="url(#win)"
        stroke={ART.paper}
        strokeWidth={3}
      />
      {/* pizarra pared izquierda */}
      <polygon
        points={wallRect([0, 1], [0, 5], 100, 40)}
        fill={pal.board}
        stroke={pal.boardLine}
        strokeWidth={3}
      />
      <text
        transform={`translate(${board.x},${board.y - 86}) skewY(26.57)`}
        fontSize={9}
        fontWeight={800}
        fill={pal.brand}
        letterSpacing={1}
      >
        CIRCULAR DE LA SEMANA
      </text>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={board.x}
          y1={board.y - 76 + i * 9}
          x2={boardEnd.x}
          y2={boardEnd.y - 76 + i * 9}
          stroke={pal.boardLine}
          strokeWidth={2}
        />
      ))}
      {/* reloj */}
      <circle
        cx={clock.x}
        cy={clock.y - 80}
        r={10}
        fill={ART.paper}
        stroke={ART.clockRim}
        strokeWidth={2}
      />
      <line
        x1={clock.x}
        y1={clock.y - 80}
        x2={clock.x}
        y2={clock.y - 87}
        stroke={ART.clockHand}
        strokeWidth={1.5}
      />
      <line
        x1={clock.x}
        y1={clock.y - 80}
        x2={clock.x + 5}
        y2={clock.y - 78}
        stroke={ART.clockHand}
        strokeWidth={1.5}
      />

      {/* Piso */}
      {Array.from({ length: ROWS }).flatMap((_, y) =>
        Array.from({ length: COLS }).map((__, x) => (
          <polygon
            key={`${x}-${y}`}
            points={poly([iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)])}
            fill={(x + y) % 2 ? pal.floorA : pal.floorB}
            stroke={pal.floorLine}
            strokeWidth={1}
          />
        ))
      )}
      {/* alfombra */}
      <polygon
        points={poly([iso(1, 7.2), iso(5.5, 7.2), iso(5.5, 8.8), iso(1, 8.8)])}
        fill={pal.rug}
      />
    </>
  );
}

export default memo(OfficeRoom);
