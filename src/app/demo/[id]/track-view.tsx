'use client';

import { demoService } from '@/services/demo.service';
import { useEffect, useRef } from 'react';

/** Cuenta la visita desde el navegador (no desde el servidor: así no suman bots ni prefetch). */
export function TrackView({ id }: { id: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    demoService.trackView(id);
  }, [id]);
  return null;
}
