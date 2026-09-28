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

/* ── Notas por persona ────────────────────────────────────────────────────
   "No contesta, llamar mañana", "pidió cancelar": lo que hoy se escribe en un
   papel. Mismo alcance que la marca de atendida —este navegador— y por eso no
   caduca: una nota vieja sigue sirviendo. */

const NOTES_KEY = 'rcsMatrix.notes';

function readNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  useEffect(() => setNotes(readNotes()), []);

  const setNote = useCallback((key: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      const clean = text.trim().slice(0, 500);
      if (clean) next[key] = clean;
      else delete next[key];
      try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      } catch {
        /* sin storage: la nota dura lo que dure la página */
      }
      return next;
    });
  }, []);

  return { notes, setNote };
}
