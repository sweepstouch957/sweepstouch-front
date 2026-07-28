import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import 'src/global.css';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { NProgress } from 'src/components/base/nprogress';
import type { Customization } from 'src/contexts/customization';
import { Layout as DocumentLayout } from 'src/layouts/document';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Panel Sweepstouch',
    template: `%s | Sweepstouch`,
  },
  description: 'Panel de administración Sweepstouch — Gestión de tiendas, campañas y reportes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
};

const CUSTOMIZATION_STORAGE_KEY = 'uifort.customization';

// 👇 ahora es async y usa await cookies() + .get()
const restoreCustomization = async (): Promise<Customization | undefined> => {
  const cookieStore = await cookies();

  const restored = cookieStore.get(CUSTOMIZATION_STORAGE_KEY);
  if (!restored) return undefined;

  try {
    const value = JSON.parse(restored.value) as Customization;
    return value;
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

interface LayoutProps {
  children: ReactNode;
}

// 👇 el layout también pasa a ser async para poder await restoreCustomization()
const Layout = async (props: LayoutProps) => {
  const { children } = props;

  const customization = await restoreCustomization();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/sweeps.ico" />

        {/*
         * ✅ PERFORMANCE: Preload Inter font weights used in the app.
         * This eliminates the web font CLS (0.31 → near 0) by making fonts
         * available before the first paint instead of loading after FCP.
         */}
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-400-normal.ac374088.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-500-normal.7d0979cc.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-600-normal.34227eb1.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-700-normal.eb892c4c.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>

      <body suppressHydrationWarning>
        <DocumentLayout customization={customization}>
          {children}
          <NProgress />
        </DocumentLayout>
      </body>
    </html>
  );
};

export default Layout;
