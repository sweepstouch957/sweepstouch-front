import type { Direction, PaletteMode } from '@mui/material';
import type { ColorPreset } from 'src/theme';

export type Layout =
  | 'vertical-shells-dark'
  | 'vertical-shells-dark-alternate'
  | 'vertical-shells-brand'
  | 'vertical-shells-white'
  | 'vertical-shells-white-off'
  | 'vertical-shells-light'
  | 'vertical-shells-accent-header'
  | 'collapsed-shells-double'
  | 'collapsed-shells-double-accent'
  | 'collapsed-shells-double-dark'
  | 'collapsed-shells-single'
  | 'collapsed-shells-single-accent'
  | 'collapsed-shells-single-white'
  | 'collapsed-shells-single-white-off'
  | 'stacked-shells-top-nav'
  | 'stacked-shells-top-nav-accent'
  | 'stacked-shells-top-nav-tabs'
  | 'stacked-shells-top-nav-wide';

export interface Customization {
  colorPreset?: ColorPreset;
  direction?: Direction;
  layout?: Layout;
  paletteMode?: PaletteMode;
  stretch?: boolean;
}

export interface State extends Customization {
  isInitialized: boolean;
}
