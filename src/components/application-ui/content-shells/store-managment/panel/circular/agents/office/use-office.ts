'use client';

/** Vida de la oficina: quién camina a dónde, el turno de paseo y los globos de respuesta. */
import type { Pipeline } from '@/services/circular.service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ORDER, type AgentStatus } from '../constants';
import { BESIDE, DESK, iso, POI, SEAT, type Pt } from './geometry';

export type Pos = { x: number; y: number; ms: number; walking: boolean; flip: boolean };

/**
 * Posición (en tiles) y destino de cada personaje. Caminan por transición CSS; `walking`
 * dura lo que tarda el viaje, proporcional a la distancia.
 */
export function useOfficeWalkers(
  keys: string[],
  statuses: Record<string, AgentStatus>,
  data: Pipeline | null | undefined
) {
  const [pos, setPos] = useState<Record<string, Pos>>(() =>
    Object.fromEntries(ORDER.map((k) => [k, { ...SEAT(k), ms: 0, walking: false, flip: false }]))
  );
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Última posición conocida fuera del estado: así el timer se arma FUERA del updater (que
  // React puede ejecutar dos veces) y siempre se puede cancelar.
  const posRef = useRef(pos);
  posRef.current = pos;

  const goTo = useCallback((k: string, to: Pt, then?: () => void) => {
    const cur = posRef.current[k];
    const dist = Math.hypot(to.x - cur.x, to.y - cur.y);
    const ms = Math.max(600, dist * 650);
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(() => {
      setPos((q) => ({ ...q, [k]: { ...q[k], walking: false } }));
      then?.();
    }, ms);
    const sx = iso(to.x, to.y).x - iso(cur.x, cur.y).x;
    setPos((p) => ({
      ...p,
      [k]: {
        x: to.x,
        y: to.y,
        ms,
        walking: dist > 0.05,
        flip: sx < 0 ? true : sx > 0 ? false : p[k].flip,
      },
    }));
  }, []);

  /** Ir a un lugar, esperar `wait` ms y volver a la silla. */
  const visit = useCallback(
    (k: string, to: Pt, wait: number) =>
      goTo(k, to, () => {
        timers.current[`${k}-back`] = setTimeout(() => goTo(k, SEAT(k)), wait);
      }),
    [goTo]
  );

  // Reacciones a la bitácora: el que trabaja va a su silla; el que termina camina a avisarle al
  // siguiente y vuelve; el que falla se queda en su puesto.
  const prevStatus = useRef<Record<string, AgentStatus>>({});
  useEffect(() => {
    keys.forEach((k) => {
      const st = statuses[k];
      const was = prevStatus.current[k];
      if (st === was) return;
      prevStatus.current[k] = st;
      if (st === 'running' || st === 'error') goTo(k, SEAT(k));
      if (st === 'done' && was === 'running') {
        const next = ORDER[ORDER.indexOf(k) + 1];
        if (next && DESK[next]) visit(k, BESIDE(next), 1800);
      }
    });
  }, [data]);

  // Paseo: cada 5 s algún agente libre (sin trabajo en curso) sale a un punto de interés y vuelve.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Con la pestaña del navegador oculta no se mueve nada: ni paseos ni re-render del SVG.
    const id = setInterval(() => {
      if (!document.hidden) setTick((n) => n + 1);
    }, 5000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!keys.length) return;
    const free = keys.filter(
      (k) => statuses[k] !== 'running' && statuses[k] !== 'error' && !posRef.current[k].walking
    );
    if (!free.length || Math.random() < 0.35) return;
    const k = free[Math.floor(Math.random() * free.length)];
    const poi = POI[Math.floor(Math.random() * POI.length)];
    visit(
      k,
      { x: poi.x + (Math.random() - 0.5) * 0.6, y: poi.y + (Math.random() - 0.5) * 0.4 },
      3500 + Math.random() * 3000
    );
  }, [tick]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  return { pos, tick };
}

/** Globos rosa = lo que contestan al patrón (por agente). Se borran solos a los 7 s. */
export function useReplyBubbles() {
  const [reply, setReply] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const say = useCallback((map: Record<string, string>) => {
    setReply(map);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReply({}), 7000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { reply, say };
}
