/**
 * Voz de Sweepstouch Bot: hablar (voz natural del servidor, con la del navegador
 * de respaldo) y escuchar (micrófono + detección de pausa). Funciones sueltas, sin React.
 */
import { speakText } from '@/services/ai.service';
import { sentences, speakable } from './constants';

/* ── Hablar ── */

/** La mejor voz en español que tenga el navegador (las "Natural"/"Google" suenan menos robóticas). */
const pickVoice = () => {
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural/i.test(v.name) ? 4 : 0) +
    (/google/i.test(v.name) ? 2 : 0) +
    (/alvaro|jorge|alonso|tomas|gerardo|diego/i.test(v.name) ? 1 : 0) +
    (/es-(us|mx|419)/i.test(v.lang) ? 1 : 0);
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('es'))
    .reduce<SpeechSynthesisVoice | undefined>(
      (best, v) => (!best || score(v) > score(best) ? v : best),
      undefined
    );
};

/** Respaldo: la voz del propio navegador, cuando la voz natural no está disponible. */
const sayWithBrowser = (spoken: string) =>
  new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve();
    synth.cancel();
    const voice = pickVoice();
    const parts = sentences(spoken);
    parts.forEach((part, i) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = voice?.lang || 'es-US';
      if (voice) utterance.voice = voice;
      utterance.rate = 1.05;
      if (i === parts.length - 1) utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // cancelada o sin voz: se sigue
      synth.speak(utterance);
    });
  });

// Lo que esté sonando ahora: una sola voz a la vez.
let current: { control: AbortController; audio?: HTMLAudioElement } | null = null;
// Frases fijas (saludo, despedida): se piden una vez y se reusan.
const phraseCache = new Map<string, Blob>();

export const stopSpeaking = () => {
  current?.control.abort();
  current?.audio?.pause();
  current = null;
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
};

const play = (blob: Blob, mine: NonNullable<typeof current>) =>
  new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    mine.audio = audio;
    audio.onended = done;
    audio.onpause = done; // interrumpida con stopSpeaking
    audio.onerror = () => reject(new Error('audio'));
    audio.play().catch(reject); // el navegador puede bloquear la reproducción
  });

/**
 * Lee un texto en voz alta con la voz natural del servidor (/ai/speak) y, si no
 * se puede, con la del navegador. Resuelve cuando termina o cuando lo interrumpen.
 */
export async function say(text: string) {
  const spoken = speakable(text);
  if (!spoken || typeof window === 'undefined') return;
  stopSpeaking();
  const mine = { control: new AbortController() };
  current = mine;
  try {
    const blob = phraseCache.get(spoken) ?? (await speakText(spoken, mine.control.signal));
    if (spoken.length < 80) phraseCache.set(spoken, blob);
    if (!mine.control.signal.aborted) await play(blob, mine);
  } catch {
    if (!mine.control.signal.aborted) await sayWithBrowser(spoken);
  }
}

/* ── Escuchar ── */

export type Mic = { stream: MediaStream; analyser: AnalyserNode; close: () => void };

/** Abre el micrófono con un analizador de volumen. Lanza si no hay permiso. */
export async function openMic(): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  return {
    stream,
    analyser,
    close: () => {
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => {});
    },
  };
}

const PAUSE_MS = 1400; // silencio que cuenta como "terminé de hablar"
const IDLE_MS = 12000; // nadie habló: se descarta y se vuelve a escuchar
const MAX_MS = 60000; // tope por pregunta

/**
 * Graba hasta que la persona hace una pausa. Devuelve el audio, o `null` si sólo
 * hubo silencio o se canceló. `onLevel` recibe el volumen (0–1) en cada cuadro.
 */
export function recordUntilPause(
  mic: Mic,
  opts: { signal: AbortSignal; onLevel?: (level: number) => void }
) {
  return new Promise<Blob | null>((resolve) => {
    if (opts.signal.aborted) return resolve(null);
    const recorder = new MediaRecorder(mic.stream);
    const chunks: Blob[] = [];
    const samples = new Uint8Array(mic.analyser.fftSize);
    const startedAt = performance.now();
    let frame = 0;
    let keep = false;
    let spoke = false;
    let lastLoud = startedAt;
    let floor = 0.01; // ruido de fondo, medido en el primer medio segundo

    const finish = (useIt: boolean) => {
      keep = useIt;
      cancelAnimationFrame(frame);
      opts.onLevel?.(0);
      if (recorder.state === 'recording') recorder.stop();
    };
    const onAbort = () => finish(false);

    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
      opts.signal.removeEventListener('abort', onAbort);
      resolve(
        keep && chunks.length ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null
      );
    };
    opts.signal.addEventListener('abort', onAbort, { once: true });

    const tick = () => {
      mic.analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const s of samples) sum += ((s - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / samples.length);
      const now = performance.now();
      if (now - startedAt < 500) floor = Math.max(floor, rms);
      opts.onLevel?.(Math.min(1, rms * 8));
      if (rms > Math.max(0.03, floor * 2.5)) {
        spoke = true;
        lastLoud = now;
      }
      if (spoke && now - lastLoud > PAUSE_MS) return finish(true);
      if (!spoke && now - startedAt > IDLE_MS) return finish(false);
      if (now - startedAt > MAX_MS) return finish(spoke);
      frame = requestAnimationFrame(tick);
    };

    recorder.start();
    frame = requestAnimationFrame(tick);
  });
}
