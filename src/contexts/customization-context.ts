import { createContext } from 'react';
import type { ColorPreset } from 'src/theme';
import type { Layout } from './customization-types';

export interface CustomizationContextType {
  colorPreset: ColorPreset;
  direction: 'ltr' | 'rtl';
  layout: Layout;
  paletteMode: 'light' | 'dark';
  stretch: boolean;
  isInitialized: boolean;
  handleReset: () => void;
  handleUpdate: (settings: Partial<CustomizationContextType>) => void;
  isCustom: boolean;
}

export const CustomizationContext = createContext<CustomizationContextType>({
  colorPreset: 'monacoBlue',
  direction: 'ltr',
  layout: 'vertical-shells-dark',
  paletteMode: 'light',
  stretch: false,
  isInitialized: false,
  handleReset: () => {},
  handleUpdate: () => {},
  isCustom: false,
});
