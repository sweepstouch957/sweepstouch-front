'use client';

import { transcribeAudio } from '@/services/ai.service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { openMic, recordUntilPause, say, stopSpeaking, waitForVoice, type Mic } from './audio';
import { BYE, HOLD, MIC_DENIED, type VoiceState } from './constants';

const SLOW_MS = 4500; // si la consulta tarda más, avisa que sigue trabajando

/** Habla, y se calla en cuanto la persona le habla encima («pérate», otra pregunta…). */
async function sayInterruptible(text: string, mic: Mic) {
  const watch = new AbortController();
  void waitForVoice(mic, watch.signal).then((heard) => heard && stopSpeaking());
  try {
    await say(text);
  } finally {
    watch.abort();
  }
}

type Ask = (question: string, opts?: { voice?: boolean }) => Promise<string>;
type Deps = { ask: Ask; stop: () => void; notify: (text: string) => void };

/**
 * Conversación por voz, manos libres: escucha → detecta la pausa → transcribe →
 * consulta → responde en voz alta → vuelve a escuchar. Si le hablas encima mientras
 * responde, se calla y te escucha; tocar la esfera hace lo mismo.
 */
export function useVoiceMode({ ask, stop, notify }: Deps) {
  const [voice, setVoice] = useState<VoiceState>('off');
  const orbRef = useRef<HTMLButtonElement>(null);
  const session = useRef<AbortController | null>(null);

  const stopVoice = useCallback(() => {
    session.current?.abort();
    session.current = null;
    stopSpeaking();
    stop();
    setVoice('off');
  }, [stop]);

  const startVoice = useCallback(async () => {
    if (session.current) return;
    const control = new AbortController();
    session.current = control;
    const live = () => !control.signal.aborted;
    const setLevel = (level: number) => orbRef.current?.style.setProperty('--lvl', String(level));

    let mic;
    try {
      mic = await openMic();
    } catch {
      session.current = null;
      notify(MIC_DENIED);
      return;
    }

    try {
      window.speechSynthesis?.getVoices(); // precarga la lista de voces
      setVoice('speaking');
      await say('A la orden. ¿Qué necesitas?');

      while (live()) {
        setVoice('listening');
        const audio = await recordUntilPause(mic, { signal: control.signal, onLevel: setLevel });
        if (!audio) continue; // sólo silencio: se sigue escuchando

        setVoice('thinking');
        const heard = await transcribeAudio(audio).catch(() => '');
        // Nada entendible, o sólo «pérate»: no se pregunta nada, se sigue escuchando.
        if (!live() || !heard.trim() || HOLD.test(heard)) continue;
        if (BYE.test(heard)) {
          await say('Entendido. Aquí estaré.');
          break;
        }

        // Consulta larga: avisa que sigue trabajando, para que no parezca colgado.
        const slow = window.setTimeout(
          () => void say('Un momento, lo estoy consultando.'),
          SLOW_MS
        );
        const answer = await ask(heard, { voice: true }).finally(() => window.clearTimeout(slow));
        if (live() && answer) {
          setVoice('speaking');
          await sayInterruptible(answer, mic);
        }
      }
    } finally {
      mic.close();
      if (session.current === control) session.current = null;
      setVoice('off');
    }
  }, [ask, notify]);

  /** Tocar la esfera: corta lo que esté diciendo o consultando; el bucle vuelve a escuchar. */
  const tapOrb = useCallback(() => {
    stopSpeaking();
    stop();
  }, [stop]);

  useEffect(() => () => session.current?.abort(), []);

  return { voice, orbRef, startVoice, stopVoice, tapOrb };
}

/** Dictado: toca para grabar, toca otra vez y la pregunta se transcribe y se envía. */
export function useDictation({ ask, notify }: Pick<Deps, 'ask' | 'notify'>) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const toggleDictation = useCallback(async () => {
    if (recorderRef.current) return recorderRef.current.stop();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return notify(MIC_DENIED);
    }
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      setRecording(false);
      if (!chunks.length) return;
      setTranscribing(true);
      const heard = await transcribeAudio(
        new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      ).catch(() => null);
      setTranscribing(false);
      if (heard === null)
        notify('No pude entender el audio. Inténtalo de nuevo o escribe la pregunta.');
      else if (heard.trim()) void ask(heard);
    };
    recorder.start();
    setRecording(true);
  }, [ask, notify]);

  useEffect(
    () => () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    []
  );

  return { recording, transcribing, toggleDictation };
}
