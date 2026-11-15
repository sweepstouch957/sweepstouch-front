/** Colores y datos fijos del paisaje del Reino del Trébol (ilustración: no siguen el tema). */
export const GRASS = {
  a: '#86C76B',
  b: '#79BD5F',
  line: 'rgba(22,101,52,.14)',
  edge: '#4D8B3A',
  dirt: '#8B6B45',
};
export const NIGHT = {
  a: '#2F5A33',
  b: '#2A5230',
  line: 'rgba(0,0,0,.2)',
  edge: '#1D3A22',
  dirt: '#5A4530',
};
export const TREES = ['#0F4C3A', '#14603F', '#1A7A4C'];

/** Colores fijos de la ilustración del fondo (como los personajes: son su identidad). */
export const SCENE = {
  light: {
    sky: ['#312E81', '#7C3AED', '#F472B6', '#FDBA74'],
    far: '#6D5BA8',
    castle: '#4C3F8F',
    skull: '#8E86B5',
    skullDark: '#655D8C',
    socket: '#2A2347',
    base: '#2A2440',
    baseLight: '#3A3357',
    roof: '#9F1239',
    gold: '#F5C84B',
    // valle bajo la isla: pradera al atardecer que se apaga hacia abajo
    field: ['#5B8A5C', '#3B3566'],
  },
  dark: {
    sky: ['#05040F', '#1E1B4B', '#5B21B6', '#9D4EDD'],
    far: '#2B2552',
    castle: '#1D1840',
    skull: '#4B4570',
    skullDark: '#342F55',
    socket: '#120E24',
    base: '#15111F',
    baseLight: '#211B33',
    roof: '#6B0F2A',
    gold: '#E0B040',
    field: ['#1F3B2B', '#0D0B1F'],
  },
};

// [x, y, radio]
export const STARS = [
  [-296, -124, 1.1],
  [-250, -100, 0.8],
  [-205, -128, 1.3],
  [-160, -92, 0.9],
  [-128, -122, 0.8],
  [-20, -128, 1.2],
  [18, -104, 0.8],
  [62, -126, 1],
  [104, -110, 0.8],
  [226, -122, 1.2],
  [262, -96, 0.9],
  [300, -130, 1],
  [344, -108, 1.3],
  [388, -126, 0.9],
  [396, -70, 0.8],
  [-300, -60, 0.9],
  [232, -62, 0.8],
  [-110, -70, 0.7],
];

// Ventanas encendidas de la base: [x, y]
export const WINDOWS = [
  [264, 14],
  [264, 44],
  [298, 6],
  [309, 6],
  [282, 48],
  [300, 48],
  [318, 48],
  [341, 10],
  [342, 46],
  [291, 74],
  [311, 74],
];

// Tréboles sobre el pasto: [tile x, tile y, hojas]. El de cinco hojas es negro, el de Asta.
export const CLOVERS = [
  [1.2, 1.1, 4],
  [6.6, 7.4, 4],
  [9.6, 1.4, 4],
  [3.2, 6.9, 5],
  [11.2, 6.2, 4],
  [7.4, 3.1, 4],
  [0.7, 3.4, 4],
  [10.2, 8.3, 4],
];

// Motas de maná que suben sobre el claro: [tile x, tile y, alto, color]
export const MANA: Array<[number, number, number, string]> = [
  [1.5, 3, 26, '#C4B5FD'],
  [4.2, 1.2, 40, '#FDE68A'],
  [7.2, 4.4, 30, '#C4B5FD'],
  [9.8, 2.6, 44, '#A7F3D0'],
  [3.4, 7.2, 34, '#FDE68A'],
  [10.6, 6.4, 28, '#C4B5FD'],
  [6.2, 7.8, 46, '#A7F3D0'],
  [0.8, 5.6, 38, '#FDE68A'],
];

/** Ángulos de las hojas de un trébol de 4 y de 5 (el negro). */
const leafAngles = (n: number) =>
  Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 - Math.PI / 2);
export const LEAVES_4 = leafAngles(4);
export const LEAVES_5 = leafAngles(5);

export type Colors = (typeof SCENE)['light'];
