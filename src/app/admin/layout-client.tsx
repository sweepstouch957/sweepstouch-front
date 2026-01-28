'use client';

import type { ReactNode } from 'react';

import { Layout as AppLayout } from 'src/layouts';

interface Props {
  children: ReactNode;
}

export default function AdminLayoutClient({ children }: Props) {
  return <AppLayout>{children}</AppLayout>;
}
