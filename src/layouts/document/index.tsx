'use client';

import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Cookies from 'js-cookie';
import Head from 'next/head';
import { useState, type FC, type ReactNode } from 'react';
import { RtlDirection } from 'src/components/base/rtl-direction';
import { Toastr } from 'src/components/base/toastr';
import { AuthProvider } from 'src/contexts/auth/auth-context';
import { CustomizationConsumer, CustomizationProvider } from 'src/contexts/customization';
import { SidebarProvider } from 'src/contexts/sidebar-context';
import { createTheme } from 'src/theme';
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';
import 'src/i18n/i18n';
import 'src/global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Customization } from 'src/contexts/customization';

const CUSTOMIZATION_STORAGE_KEY = 'uifort.customization';

/**
 * Defaults de react-query para TODO el panel.
 *
 * Antes era `new QueryClient()` sin config, o sea `staleTime: 0`: cada query
 * quedaba obsoleta al instante y se refetcheaba al montar, al navegar y al
 * volver a la pestaña. Con ~176 `useQuery` en el panel, eso es la causa
 * principal de que "se sienta lento".
 *
 * Las pantallas que necesitan datos más frescos ya declaran su propio
 * `staleTime`/`refetchInterval` y siguen mandando (esto es solo el piso).
 */
const DEFAULT_QUERY_OPTIONS = {
  queries: {
    // Un minuto sin refetchear al navegar entre páginas.
    staleTime: 60_000,
    // Cache retenida 10 min: volver a una pantalla ya visitada es instantáneo.
    gcTime: 10 * 60_000,
    // El panel es de uso interno: no hace falta refrescar cada vez que el
    // usuario vuelve a la pestaña (era el default `true` de react-query).
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Un solo reintento: 3 (default) hace que un endpoint caído tarde en fallar.
    retry: 1,
  },
} as const;

const updateCustomization = (customization: Customization): void => {
  try {
    Cookies.set(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(customization));
    window.location.reload();
  } catch (err) {
    console.error(err);
  }
};

const resetCustomization = (): void => {
  try {
    Cookies.remove(CUSTOMIZATION_STORAGE_KEY);
    window.location.reload();
  } catch (err) {
    console.error(err);
  }
};

interface LayoutProps {
  children: ReactNode;
  customization?: Customization;
}

export const Layout: FC<LayoutProps> = (props: LayoutProps) => {
  const { children, customization } = props;
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: DEFAULT_QUERY_OPTIONS }));

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'uifort' }}>
      <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
              <SidebarProvider>
                <CustomizationProvider
                  onReset={resetCustomization}
                  onUpdate={updateCustomization}
                  settings={customization}
                >
                  <CustomizationConsumer>
                    {(settings) => {
                      const theme = createTheme({
                        colorPreset: settings.colorPreset,
                        direction: settings.direction,
                        paletteMode: settings.paletteMode,
                        layout: settings.layout,
                      });

                      return (
                        <ThemeProvider theme={theme}>
                          <Head>
                            <meta
                              name="color-scheme"
                              content={settings.paletteMode}
                            />
                            <meta
                              name="theme-color"
                              content={theme.palette.primary.main}
                            />
                          </Head>
                          <RtlDirection direction={settings.direction}>
                            <CssBaseline />
                            <Box
                              display="flex"
                              minHeight="100vh"
                            >
                              {children}
                            </Box>
                            <Toastr />
                          </RtlDirection>
                        </ThemeProvider>
                      );
                    }}
                  </CustomizationConsumer>
                </CustomizationProvider>
              </SidebarProvider>
            </AuthProvider>
          </LocalizationProvider>
      </QueryClientProvider>
    </NextAppDirEmotionCacheProvider>
  );
};
