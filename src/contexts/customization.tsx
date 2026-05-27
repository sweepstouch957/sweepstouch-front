import isEqual from 'lodash.isequal';

import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { CustomizationContext, type CustomizationContextType } from './customization-context';
import { type Customization, type Layout, type State } from './customization-types';

export type { Layout, Customization, State };

const defaultCustomization: Customization = {
  colorPreset: 'monacoBlue',
  direction: 'ltr',
  layout: 'vertical-shells-dark',
  paletteMode: 'light',
  stretch: false,
};

const initialState: State = {
  isInitialized: false,
};

interface CustomizationProviderProps {
  children?: ReactNode;
  onReset?: () => void;
  onUpdate?: (settings: Customization) => void;
  settings?: Customization;
}

export const CustomizationProvider: FC<CustomizationProviderProps> = (props) => {
  const {
    children,
    onReset = () => {},
    onUpdate = () => {},
    settings: initialCustomization,
  } = props;
  const [state] = useState<State>(initialState);

  const settings = useMemo(() => {
    return {
      ...defaultCustomization,
      ...initialCustomization,
    } as Customization;
  }, [initialCustomization]);

  const handleUpdate = useCallback(
    (newCustomization: Customization): void => {
      onUpdate({
        colorPreset: settings.colorPreset,
        direction: settings.direction,
        layout: settings.layout,
        paletteMode: settings.paletteMode,
        stretch: settings.stretch,
        ...newCustomization,
      });
    },
    [onUpdate, settings]
  );

  const isCustom = useMemo(() => {
    return !isEqual(initialCustomization, {
      colorPreset: settings.colorPreset,
      direction: settings.direction,
      layout: settings.layout,
      paletteMode: settings.paletteMode,
      stretch: settings.stretch,
    });
  }, [settings]);

  const contextValue = useMemo(
    () => ({
      ...settings,
      ...state,
      colorPreset: (settings.colorPreset ?? defaultCustomization.colorPreset)!,
      direction: (settings.direction ?? defaultCustomization.direction)!,
      layout: (settings.layout ?? defaultCustomization.layout)!,
      paletteMode: (settings.paletteMode ?? defaultCustomization.paletteMode)!,
      stretch: settings.stretch ?? defaultCustomization.stretch!,
      handleReset: onReset,
      handleUpdate,
      isCustom,
    }),
    [settings, state, onReset, handleUpdate, isCustom]
  );

  return (
    <CustomizationContext.Provider value={contextValue}>
      {children}
    </CustomizationContext.Provider>
  );
};

export const CustomizationConsumer = CustomizationContext.Consumer;
