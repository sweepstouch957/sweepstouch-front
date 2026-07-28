import { alpha, type Theme } from '@mui/material/styles';

/**
 * Design system — capa semántica.
 *
 * Regla: en la UI NO se escriben colores hex. Se usa el rol semántico
 * (`primary`, `success`, `warning`, `error`, `info`) y el theme resuelve el valor.
 * Así el selector de theme (`colorPreset`) y el dark mode funcionan de verdad.
 */

export type SemanticRole = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Fondo tenue para iconos/chips/badges. Reemplaza el patrón repetido
 * `bgcolor: alpha(theme.palette.x.main, 0.1)` y ajusta solo en dark mode,
 * donde 0.1 queda invisible.
 */
export function tint(theme: Theme, role: SemanticRole = 'primary', amount?: number): string {
  const base = theme.palette[role].main;
  const a = amount ?? (theme.palette.mode === 'dark' ? 0.16 : 0.1);
  return alpha(base, a);
}

/** Borde tenue del mismo rol — para cards/estados destacados. */
export function tintBorder(theme: Theme, role: SemanticRole = 'primary', amount = 0.25): string {
  return alpha(theme.palette[role].main, amount);
}

/**
 * Mapa de migración: hex quemado → token semántico.
 *
 * Sale de auditar el repo (1512 hex en 154 archivos). Es la referencia para
 * reemplazar y para no volver a introducirlos. Los agrupamos por intención,
 * no por tono exacto: dos verdes distintos que significan "éxito" van los dos
 * a `success.main`.
 *
 * ⚠️ Excepción: los colores de MARCA DE UNA TIENDA (mainColor/secondaryColor que
 * vienen de la BD) NO se migran — son data, no design system.
 */
export const HEX_TO_TOKEN: Record<string, string> = {
  // Marca sweepstouch — la peor ofensa: quemarlos anula el selector de theme
  '#ee1e7c': 'primary.main',
  '#ef0f82': 'primary.main',
  '#e91e63': 'primary.main',
  '#fc0c83': 'primary.main',
  '#5569ff': 'primary.main',

  // Éxito / positivo
  '#10b981': 'success.main',
  '#4ade80': 'success.light',
  '#22c55e': 'success.main',
  '#4caf50': 'success.main',
  '#2e7d32': 'success.dark',

  // Advertencia
  '#f59e0b': 'warning.main',
  '#ff9800': 'warning.main',
  '#d97706': 'warning.dark',

  // Error / crítico
  '#ef4444': 'error.main',
  '#f44336': 'error.main',
  '#f87171': 'error.light',
  '#dc1f26': 'error.dark',
  '#d32f2f': 'error.dark',

  // Info
  '#60a5fa': 'info.light',
  '#1976d2': 'info.main',
  '#1565c0': 'info.dark',

  // Neutros / texto — casi siempre son text.*, no un gris fijo
  '#2d3748': 'text.primary',
  '#718096': 'text.secondary',
  '#64748b': 'text.secondary',
  '#6b7280': 'text.secondary',
  '#9ca3af': 'text.disabled',
};

/**
 * Prioridad / severidad → rol semántico.
 * Evita los `Record<string, string>` con hex sueltos que había repetidos en
 * soporte, tickets, turnos y campañas.
 */
export const SEVERITY_ROLE: Record<string, SemanticRole> = {
  low: 'success',
  medium: 'primary',
  high: 'warning',
  critical: 'error',
};

export function severityColor(theme: Theme, level: string): string {
  const role = SEVERITY_ROLE[level] ?? 'primary';
  return theme.palette[role].main;
}

/**
 * Paleta CATEGÓRICA para charts (torta/barras por categoría).
 *
 * No es lo mismo que un token semántico: acá hacen falta N colores
 * *distinguibles entre sí*, no "el color de éxito". Arranca con el primary del
 * theme (así respeta el selector) y sigue con tonos estables y accesibles.
 * Antes cada chart definía su propio array de hex.
 */
export function chartPalette(theme: Theme): string[] {
  return [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
    theme.palette.success.dark,
    theme.palette.info.dark,
    theme.palette.warning.dark,
  ];
}

/**
 * Chequeo runnable del mapa (no depende de MUI ni del theme).
 * `npx tsx src/theme/semantic.ts` o importarlo desde un test.
 */
export function assertHexMapIsSane(): void {
  const entries = Object.entries(HEX_TO_TOKEN);
  for (const [hex, token] of entries) {
    if (!/^#[0-9a-f]{6}$/.test(hex)) {
      throw new Error(`HEX_TO_TOKEN: clave inválida "${hex}" (debe ser #rrggbb en minúscula)`);
    }
    if (!/^(primary|secondary|success|warning|error|info|text)\.[a-z]+$/.test(token)) {
      throw new Error(`HEX_TO_TOKEN: token inválido "${token}" para ${hex}`);
    }
  }
  if (new Set(entries.map(([h]) => h)).size !== entries.length) {
    throw new Error('HEX_TO_TOKEN: hay hex duplicados');
  }
}
