/**
 * Colores de la oficina. Lo que informa o acompaña el modo (marca, estados, globos, sala,
 * muebles) sale del tema y funciona en oscuro. Los personajes, las plantas y los aparatos
 * son ilustración: su color es su identidad (se reconoce a cada robot sin leer el nombre) y
 * no cambia con el tema, por eso van fijos acá — misma excepción que los colores guardados
 * en BD de ARCHITECTURE §8.
 */
import { toneText } from '@/theme/semantic';
import { alpha, darken, lighten, type Theme } from '@mui/material/styles';
import type { AgentStatus } from '../constants';

export type Accessory = 'wings' | 'goggles' | 'bun' | 'helmet' | 'glasses' | 'band' | 'wig';

// Look de cada personaje: colores y accesorio, para reconocerlos sin leer el nombre.
export const LOOK: Record<string, { shirt: string; hair: string; skin: string; acc: Accessory }> = {
  hermes: { shirt: '#3B82F6', hair: '#F59E0B', skin: '#F2C9A6', acc: 'wings' },
  argos: { shirt: '#10B981', hair: '#1F2937', skin: '#D9A074', acc: 'goggles' },
  mnemosine: { shirt: '#8B5CF6', hair: '#6B21A8', skin: '#F2C9A6', acc: 'bun' },
  hefesto: { shirt: '#F97316', hair: '#7C2D12', skin: '#C68642', acc: 'helmet' },
  atenea: { shirt: '#0EA5E9', hair: '#9CA3AF', skin: '#F2C9A6', acc: 'glasses' },
  iris: { shirt: '#EC4899', hair: '#DB2777', skin: '#E0AC69', acc: 'band' },
  temis: { shirt: '#111827', hair: '#E5E7EB', skin: '#F2C9A6', acc: 'wig' },
};

/** Tinta fija de la ilustración (pantalones, ojos, monitores, plantas, café, impresora). */
export const ART = {
  pants: '#1F2937',
  shoes: '#111827',
  eye: '#111',
  mouth: '#7a4a2a',
  shade: 'rgba(0,0,0,.22)',
  shine: 'rgba(255,255,255,.12)',
  wing: '#fff',
  wingLine: '#cbd5e1',
  helmet: '#FACC15',
  helmetLine: '#CA8A04',
  lens: 'rgba(255,255,255,.5)',
  brow: '#16A34A',
  wig: '#E5E7EB',
  monitor: '#111827',
  stand: '#374151',
  pot: '#B45309',
  leaf: ['#15803D', '#16A34A', '#22C55E'],
  machine: '#374151',
  machineLight: '#9CA3AF',
  printer: '#4B5563',
  led: '#22C55E',
  paper: '#fff',
  clockHand: '#111',
  clockRim: '#9CA3AF',
  rainbow: ['#ef4444', '#eab308', '#3b82f6'],
  sky: ['#bae6fd', '#e0f2fe'],
} as const;

export type OfficePalette = ReturnType<typeof officePalette>;

/** Colores derivados del tema para la sala, los muebles, los globos y los estados. */
export function officePalette(t: Theme) {
  const dark = t.palette.mode === 'dark';
  const brand = t.palette.primary.main;
  const paper = t.palette.background.paper;
  const surface = (light: number, darkAmt: number) =>
    dark ? lighten(paper, darkAmt) : darken(paper, light);
  return {
    dark,
    brand,
    onBrand: t.palette.primary.contrastText,
    bg: alpha(brand, dark ? 0.04 : 0.03),
    wallL: alpha(brand, dark ? 0.12 : 0.14),
    wallR: alpha(brand, dark ? 0.18 : 0.09),
    floorA: alpha(brand, dark ? 0.08 : 0.06),
    floorB: alpha(brand, dark ? 0.05 : 0.03),
    floorLine: alpha(brand, dark ? 0.12 : 0.08),
    rug: alpha(brand, 0.18),
    // Muebles: opacos (tapan lo de atrás), tres caras con luz distinta.
    top: surface(0, 0.22),
    left: surface(0.15, 0.06),
    right: surface(0.08, 0.14),
    chair: surface(0.4, 0.28),
    keyboard: surface(0.22, 0.35),
    screenOff: dark ? lighten(paper, 0.1) : t.palette.grey[700],
    board: paper,
    boardLine: t.palette.divider,
    label: t.palette.text.primary,
    labelStroke: paper,
    bubble: paper,
    bubbleText: t.palette.text.primary,
    bubbleError: dark ? darken(t.palette.error.main, 0.6) : lighten(t.palette.error.main, 0.85),
    bubbleErrorText: toneText(t, 'error'),
    shadow: alpha(t.palette.common.black, 0.18),
    ring: {
      error: t.palette.error.main,
      done: t.palette.success.main,
      running: brand,
      waiting: t.palette.grey[400],
    } as Record<AgentStatus, string>,
    bubbleBorder: (s: AgentStatus) =>
      s === 'error' ? t.palette.error.main : s === 'running' ? brand : t.palette.divider,
  };
}
