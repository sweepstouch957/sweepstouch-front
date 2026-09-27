'use client';

/**
 * "Atendida" — la marca de que alguien ya habló con esa persona.
 *
 * No existe en el backend: no hay campo para "un humano ya llamó". Vive en este
 * navegador (localStorage), dura 24 h y sólo saca la fila de la cola para que el
 * que está llamando no repita. Lo que cambia estado de verdad (aprobar, armar,
 * entregar) son los botones de la ficha, que sí escriben en order-service.
 *
 * ponytail: marca local, suficiente para una persona trabajando la cola. Si
 * mañana llaman dos a la vez y se pisan, esto se muda a una colección propia.
 */

import { useCallback, useEffect, useState } from 'react';

const KEY = 'rcsMatrix.attended';
const TTL_MS = 24 * 60 * 60 * 1000;

type Marks = Record<string, number>;

function read(): Marks {
  if (typeof window === 'undefined') return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Marks;
    const now = Date.now();
    // Se limpia sola: una marca de ayer no debe esconder a quien hoy volvió a escribir.
    return Object.fromEntries(Object.entries(raw).filter(([, at]) => now - at < TTL_MS));
  } catch {
    return {};
  }
}

function write(marks: Marks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(marks));
  } catch {
    /* sin storage: la marca dura lo que dure la página */
  }
}

export function useAttended() {
  const [marks, setMarks] = useState<Marks>({});
  useEffect(() => setMarks(read()), []);

  const mark = useCallback((keys: string[], on = true) => {
    setMarks((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        if (on) next[k] = Date.now();
        else delete next[k];
      }
      write(next);
      return next;
    });
  }, []);

  const isAttended = useCallback((key: string) => !!marks[key], [marks]);

  return { marks, mark, isAttended, count: Object.keys(marks).length };
}
