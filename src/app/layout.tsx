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
    default: 'Admin Sweepstouch ',
    template: `%s | UIFort`,
  },
  description: 'React UI Kit and Admin Dashboard Template - UIFort',
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
    <html>
      <head>
        <link rel="shortcut icon" href="/sweeps.ico" />
      </head>

      <body>
        <DocumentLayout customization={customization}>
          {children}
          <NProgress />
        </DocumentLayout>
      </body>
    </html>
  );
};

export default Layout;
