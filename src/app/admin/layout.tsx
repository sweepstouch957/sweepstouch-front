import type { ReactNode } from 'react';

import AdminLayoutClient from './layout-client';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Server wrapper layout.
 *
 * Keeping this file as a Server Component prevents "clientifying" the whole
 * /admin tree by default. The actual UI layout (MUI, contexts, etc.) remains
 * in the client wrapper.
 */
export default function Layout({ children }: LayoutProps) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
