import type { PaletteColor } from '@mui/material/styles/createPalette';
import { darkTheme, lightTheme } from './colors';
import type { ColorPreset } from './index';

export const getPrimaryDark = (preset?: ColorPreset): PaletteColor => {
  if (!preset) {
    console.error('Preset is not available!');
    return darkTheme.royalBlue; // Default case
  }
  const color = darkTheme[preset.replace('-', '')];
  return color ? color : darkTheme.royalBlue; // Fallback
};

export const getPrimary = (preset?: ColorPreset): PaletteColor => {
  if (!preset) {
    console.error('Preset is not available!');
    return lightTheme.royalBlue; // Default case
  }
  const color = lightTheme[preset.replace('-', '')];
  return color ? color : lightTheme.royalBlue; // Fallback
};

// Extended Sidebar Layout

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 98;
export const HEADER_HEIGHT = 54;

/**
 * Alto real del navbar, publicado por la cabecera del shell activo.
 *
 * `HEADER_HEIGHT` es sólo el valor de arranque: cada shell arma su cabecera
 * distinto —varias crecen a 1.5× cuando el scroll va hacia arriba— así que el
 * número de la constante no sirve para reservar espacio ni para pegar barras.
 * Cuando cada quien lo copiaba a mano aparecían bandas grises y contenido
 * metido debajo del navbar, y las páginas lo tapaban con márgenes negativos.
 *
 * La cabecera se mide sola y escribe acá; todo lo demás lee `headerOffset`.
 */
export const HEADER_HEIGHT_VAR = '--app-header-h';

/** Alto del navbar para usar en CSS. Cae en `HEADER_HEIGHT` antes del primer pintado. */
export const headerOffset = `var(${HEADER_HEIGHT_VAR}, ${HEADER_HEIGHT}px)`;

/** Lo mismo, más un extra: `headerOffsetPlus(62)` → `calc(var(…) + 62px)`. */
export const headerOffsetPlus = (extra: number) => `calc(${headerOffset} + ${extra}px)`;

// Common
/**
 * Radio base del design system. `theme.shape.borderRadius`.
 * Es la ÚNICA fuente de verdad del redondeo: en sx, `borderRadius: 1` = 8px,
 * `2` = 16px, etc. No hardcodear px en los componentes.
 */
export const BORDER_RADIUS = 8;
export const SPACING_UNIT = 10;
