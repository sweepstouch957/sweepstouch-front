'use client';

import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/services/ai.service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { say, stopSpeaking } from './audio';
import {
  loadPrefs,
  savePrefs,
  toolLabel,
  type BotPrefs,
  type ModelChoice,
  type Turn,
} from './constants';

const NO_ANSWER = 'No recibí respuesta del modelo. Inténtalo de nuevo o prueba con otro modelo.';

/**
 * La conversación de Sweepstouch Bot: turnos, envío con streaming sobre /ai/chat
 * (misma memoria y herramientas que el chat completo), modelo elegido y lectura
 * en voz alta. Todas las funciones que devuelve son estables: se pueden pasar a
 * componentes memoizados y al bucle de voz sin que queden desactualizadas.
 */
export function useBotChat(pageContext: string) {
  const { user } = useAuth();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  // Sólo se pintan dentro del panel (que carga en el cliente): leerlas al iniciar
  // no descuadra la hidratación.
  const [prefs, setPrefs] = useState<BotPrefs>(loadPrefs);

  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const convIdRef = useRef<string | undefined>(undefined);
  // Lo que `ask` necesita al día sin tener que recrearse en cada render.
  const live = useRef({ user, pageContext, prefs });
  live.current = { user, pageContext, prefs };

  useEffect(
    () => () => {
      abortRef.current?.abort();
      stopSpeaking();
    },
    []
  );

  const updatePrefs = useCallback((next: Partial<BotPrefs>) => {
    const merged = { ...live.current.prefs, ...next };
    savePrefs(merged);
    setPrefs(merged);
  }, []);

  const pickModel = useCallback((model: ModelChoice) => updatePrefs({ model }), [updatePrefs]);

  const toggleSpeak = useCallback(() => {
    if (live.current.prefs.speak) stopSpeaking();
    updatePrefs({ speak: !live.current.prefs.speak });
  }, [updatePrefs]);

  /** Mensaje del bot que no viene del modelo (ej. falta permiso de micrófono). */
  const notify = useCallback(
    (text: string) => setTurns((all) => [...all, { id: Date.now(), from: 'ai', text }]),
    []
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopSpeaking();
    convIdRef.current = undefined;
    setTurns([]);
  }, []);

  /**
   * Manda una pregunta y devuelve la respuesta completa ('' si se detuvo). En modo
   * voz devuelve también los avisos de error, para que se digan en voz alta.
   */
  const ask = useCallback(
    async (question: string, opts: { voice?: boolean } = {}): Promise<string> => {
      const q = question.trim();
      if (!q || busyRef.current) return '';
      busyRef.current = true;

      const { user: who, pageContext: where, prefs: current } = live.current;
      const aiId = Date.now() + 1;
      const patch = (change: (t: Turn) => Turn) =>
        setTurns((all) => all.map((t) => (t.id === aiId ? change(t) : t)));
      const controller = new AbortController();
      let answer = '';
      let failed = false;
      // El texto llega a ráfagas: se pinta una vez por cuadro, no una por fragmento.
      let frame = 0;
      const paint = () => {
        frame = 0;
        patch((t) => ({ ...t, text: answer }));
      };
      const schedulePaint = () => {
        frame ||= requestAnimationFrame(paint);
      };

      stopSpeaking();
      abortRef.current = controller;
      setTurns((all) => [
        ...all,
        { id: aiId - 1, from: 'me', text: q },
        { id: aiId, from: 'ai', text: '' },
      ]);
      setBusy(true);
      setStatus('');

      await sendChatMessage(
        {
          conversationId: convIdRef.current,
          message: q,
          userId: who?._id || who?.id || '',
          userName: who ? `${who.firstName || ''} ${who.lastName || ''}`.trim() : 'User',
          userRole: who?.role || 'admin',
          model: current.model.provider,
          modelVersion: current.model.version || undefined,
          pageContext: where,
          voice: opts.voice || undefined,
          signal: controller.signal,
        },
        (chunk) => {
          answer += chunk;
          setStatus('');
          schedulePaint();
        },
        () => {},
        (error) => {
          failed = true;
          answer += `${answer ? '\n\n' : ''}No pude responder: ${error}. Inténtalo de nuevo.`;
          schedulePaint();
        },
        (data) => setStatus(toolLabel(data.tool)),
        (data) => {
          const r = data.result || {};
          if (data.tool === 'navigate' && r.route)
            patch((t) => ({ ...t, route: r.route, routeTitle: r.title }));
          if (r.success && r.message)
            patch((t) => ({ ...t, done: [...(t.done || []), r.message] }));
          if (r._fileUrls?.excelUrl) answer += `\n\n[Descargar Excel](${r._fileUrls.excelUrl})`;
          if (r._fileUrls?.pdfUrl) answer += `\n\n[Descargar PDF](${r._fileUrls.pdfUrl})`;
          if (r._fileUrls) schedulePaint();
        },
        undefined,
        (id) => {
          convIdRef.current = id;
        }
      );

      cancelAnimationFrame(frame);
      abortRef.current = null;
      busyRef.current = false;
      setBusy(false);
      setStatus('');

      if (controller.signal.aborted) {
        patch((t) => ({ ...t, text: answer.trim() ? answer : 'Detenido.' }));
        return '';
      }
      if (!answer.trim()) {
        // Nunca "Listo." sin respuesta: si no llegó texto, se dice tal cual.
        patch((t) => ({
          ...t,
          text: t.route ? 'Te llevo ahí:' : t.done?.length ? 'Hecho.' : NO_ANSWER,
        }));
        return opts.voice ? 'No recibí respuesta. Inténtalo de nuevo.' : '';
      }
      paint();
      if (failed) return opts.voice ? 'No pude responder. Inténtalo de nuevo.' : '';
      if (!opts.voice && live.current.prefs.speak) void say(answer);
      return answer;
    },
    []
  );

  return {
    turns,
    busy,
    status,
    model: prefs.model,
    speak: prefs.speak,
    firstName: user?.firstName as string | undefined,
    ask,
    stop,
    reset,
    notify,
    pickModel,
    toggleSpeak,
  };
}
