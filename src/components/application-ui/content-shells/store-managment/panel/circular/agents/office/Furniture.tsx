'use client';

/** Muebles de la oficina en isométrico: escritorio con monitor, planta, café e impresora. */
import { memo } from 'react';
import { iso, poly } from './geometry';
import { ART, type OfficePalette } from './palette';

/** Caja isométrica de tres caras (arriba, izquierda, derecha). */
function IsoBox({
  x,
  y,
  w,
  d,
  h,
  pal,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  pal: OfficePalette;
}) {
  const a = iso(x, y);
  const b = iso(x + w, y);
  const c = iso(x + w, y + d);
  const e = iso(x, y + d);
  return (
    <g>
      <polygon
        points={poly([
          { ...a, dy: h },
          { ...b, dy: h },
          { ...c, dy: h },
          { ...e, dy: h },
        ])}
        fill={pal.top}
      />
      <polygon
        points={poly([{ ...e, dy: h }, { ...c, dy: h }, c, e])}
        fill={pal.left}
      />
      <polygon
        points={poly([{ ...c, dy: h }, { ...b, dy: h }, b, c])}
        fill={pal.right}
      />
    </g>
  );
}

export const Desk = memo(function Desk({
  x,
  y,
  on,
  pal,
}: {
  x: number;
  y: number;
  /** Monitor prendido: el agente está trabajando. */
  on: boolean;
  pal: OfficePalette;
}) {
  const m = iso(x + 0.7, y + 0.35);
  const chair = iso(x + 0.8, y + 1.1);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={1.6}
        d={0.9}
        h={22}
        pal={pal}
      />
      {/* monitor */}
      <g transform={`translate(${m.x},${m.y - 22})`}>
        <rect
          x={-2}
          y={-3}
          width={4}
          height={4}
          fill={ART.stand}
        />
        <rect
          x={-15}
          y={-23}
          width={30}
          height={20}
          rx={2}
          fill={ART.monitor}
        />
        <rect
          x={-13}
          y={-21}
          width={26}
          height={16}
          rx={1}
          fill={on ? pal.brand : pal.screenOff}
          className={on ? 'screen' : ''}
        />
        {on && (
          <>
            <rect
              x={-10}
              y={-18}
              width={14}
              height={2}
              fill="rgba(255,255,255,.8)"
            />
            <rect
              x={-10}
              y={-14}
              width={18}
              height={2}
              fill="rgba(255,255,255,.6)"
            />
            <rect
              x={-10}
              y={-10}
              width={9}
              height={2}
              fill="rgba(255,255,255,.7)"
            />
          </>
        )}
      </g>
      {/* teclado + taza */}
      <g transform={`translate(${m.x - 2},${m.y - 22})`}>
        <rect
          x={-10}
          y={4}
          width={20}
          height={5}
          rx={1}
          fill={pal.keyboard}
        />
      </g>
      <g transform={`translate(${m.x + 18},${m.y - 22})`}>
        <rect
          x={-3}
          y={0}
          width={6}
          height={6}
          rx={1.5}
          fill={pal.brand}
        />
        <path
          d="M3 1 q4 1 0 4"
          stroke={pal.brand}
          strokeWidth={1.2}
          fill="none"
        />
      </g>
      {/* silla */}
      <ellipse
        cx={chair.x}
        cy={chair.y - 4}
        rx={12}
        ry={6}
        fill={pal.chair}
      />
    </g>
  );
});

export const Plant = memo(function Plant({ x, y }: { x: number; y: number }) {
  const p = iso(x, y);
  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <ellipse
        cx={0}
        cy={0}
        rx={9}
        ry={4}
        fill="rgba(0,0,0,.15)"
      />
      <rect
        x={-6}
        y={-12}
        width={12}
        height={12}
        rx={2}
        fill={ART.pot}
      />
      <circle
        cx={-5}
        cy={-18}
        r={6}
        fill={ART.leaf[0]}
      />
      <circle
        cx={5}
        cy={-19}
        r={6}
        fill={ART.leaf[1]}
      />
      <circle
        cx={0}
        cy={-25}
        r={7}
        fill={ART.leaf[2]}
      />
    </g>
  );
});

export const Coffee = memo(function Coffee({
  x,
  y,
  pal,
}: {
  x: number;
  y: number;
  pal: OfficePalette;
}) {
  const p = iso(x, y);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={0.9}
        d={0.9}
        h={26}
        pal={pal}
      />
      <g transform={`translate(${p.x + 10},${p.y - 26})`}>
        <rect
          x={-8}
          y={-22}
          width={16}
          height={22}
          rx={2}
          fill={ART.machine}
        />
        <rect
          x={-5}
          y={-18}
          width={10}
          height={6}
          rx={1}
          fill={ART.machineLight}
        />
        <rect
          x={-3}
          y={-8}
          width={6}
          height={5}
          fill={ART.paper}
        />
        <path
          className="steam"
          d="M-2-24 q2-3 0-6 M2-24 q2-3 0-6"
          stroke={ART.machineLight}
          strokeWidth={1}
          fill="none"
        />
      </g>
    </g>
  );
});

export const Printer = memo(function Printer({
  x,
  y,
  pal,
}: {
  x: number;
  y: number;
  pal: OfficePalette;
}) {
  const p = iso(x, y);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={1.1}
        d={0.9}
        h={16}
        pal={pal}
      />
      <g transform={`translate(${p.x + 14},${p.y - 16})`}>
        <rect
          x={-13}
          y={-12}
          width={26}
          height={12}
          rx={2}
          fill={ART.printer}
        />
        <rect
          x={-9}
          y={-16}
          width={18}
          height={5}
          fill={ART.paper}
        />
        <circle
          cx={9}
          cy={-6}
          r={1.5}
          fill={ART.led}
        />
      </g>
    </g>
  );
});
