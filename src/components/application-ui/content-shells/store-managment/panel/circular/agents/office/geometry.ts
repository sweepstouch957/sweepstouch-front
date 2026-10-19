/** Plano de la oficina: tiles del piso, proyección isométrica y dónde está cada cosa. */

// Tiles del piso y proyección isométrica 2:1.
export const COLS = 12;
export const ROWS = 9;
export const TW = 64;
export const TH = 32;
/** Alto de las paredes (px). */
export const WALL_H = 120;

export type Pt = { x: number; y: number };
export const iso = (x: number, y: number): Pt => ({ x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) });
/** Polígono SVG a partir de puntos de tile, con desplazamiento vertical opcional por punto. */
export const poly = (pts: Array<Pt & { dy?: number }>) =>
  pts.map((p) => `${p.x},${p.y - (p.dy ?? 0)}`).join(' ');

// Escritorio (tile) y dónde se para el personaje al trabajar (delante del escritorio).
export const DESK: Record<string, Pt> = {
  hermes: { x: 2, y: 2 },
  argos: { x: 5, y: 2 },
  mnemosine: { x: 8, y: 2 },
  hefesto: { x: 2, y: 5.5 },
  atenea: { x: 5, y: 5.5 },
  iris: { x: 8, y: 5.5 },
  temis: { x: 10.5, y: 4 },
};
export const SEAT = (k: string): Pt => ({ x: DESK[k].x + 0.5, y: DESK[k].y + 1.1 });
/** Al lado del escritorio del siguiente: ahí va a avisarle que le toca. */
export const BESIDE = (k: string): Pt => ({ x: DESK[k].x - 0.6, y: DESK[k].y + 1.1 });

// Puntos de interés para pasear: café, impresora, pizarra, planta.
export const POI: Pt[] = [
  { x: 0.8, y: 8 },
  { x: 4, y: 8.2 },
  { x: 6.5, y: 0.6 },
  { x: 10.5, y: 7.8 },
  { x: 3.5, y: 0.7 },
];

export const PLANTS: Pt[] = [
  { x: 0.3, y: 7.4 },
  { x: 11.3, y: 0.3 },
  { x: 11.3, y: 8.3 },
];
export const COFFEE: Pt = { x: 0, y: 8.1 };
export const PRINTER: Pt = { x: 3.6, y: 8.3 };

// Encuadre del SVG: la sala proyectada ocupa de x=-ROWS*TW/2 a COLS*TW/2.
export const VIEWBOX = `${-ROWS * (TW / 2) - 30} -140 ${(COLS + ROWS) * (TW / 2) + 60} ${
  (COLS + ROWS) * (TH / 2) + 150
}`;
