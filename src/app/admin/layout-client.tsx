'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Layout as AppLayout } from 'src/layouts';
import { perfEnabled } from 'src/libs/perf/monitor';

// Monitor de rendimiento (?perf=1): se descarga sólo si está prendido.
const PerfOverlay = dynamic(() => import('src/components/perf/PerfOverlay'), { ssr: false });

interface Props {
  children: ReactNode;
}

export default function AdminLayoutClient({ children }: Props) {
  // Se decide después de montar: el servidor no sabe si está prendido (evita error de hidratación).
  const [perf, setPerf] = useState(false);
  useEffect(() => setPerf(perfEnabled()), []);

  return (
    <AppLayout>
      {children}
      {perf && <PerfOverlay />}
    </AppLayout>
  );
}
