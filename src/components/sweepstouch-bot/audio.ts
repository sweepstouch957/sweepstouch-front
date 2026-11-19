/**
 * Voz de Sweepstouch Bot: hablar (voz natural del servidor, con la del navegador
 * de respaldo) y escuchar (micrófono + detección de voz y de pausa).
 * Funciones sueltas, sin React.
 */
import { speakText } from '@/services/ai.service';
import { sentences, speakable } from './constants';

/* ── Hablar ── */

/** La mejor voz en español que tenga el navegador (las "Natural"/"Google" suenan menos robóticas). */
const pickVoice = () => {
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural/i.test(v.name) ? 4 : 0) +
    (/google/i.test(v.name) ? 2 : 0) +
    (/dalia|paulina|sabina|elena|helena|monica|paloma|elvira|ximena|camila/i.test(v.name) ? 1 : 0) +
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
const sayWithBrowser = (parts: string[]) =>
  new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth || !parts.length) return resolve();
    synth.cancel();
    const voice = pickVoice();
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

/**
 * Junta frases en trozos de ~200 caracteres. Cada trozo se convierte en audio por
 * separado y en paralelo: la voz arranca al tener listo el primero, sin esperar
 * a que se genere el audio de toda la respuesta.
 */
const speechChunks = (spoken: string) =>
  sentences(spoken).reduce<string[]>((chunks, sentence) => {
    const last = chunks[chunks.length - 1];
    if (last && last.length + sentence.length < 200)
      chunks[chunks.length - 1] = `${last} ${sentence}`;
    else chunks.push(sentence);
    return chunks;
  }, []);

// Lo que esté sonando ahora: una sola voz a la vez.
let current: { control: AbortController; audio?: HTMLAudioElement } | null = null;
// Frases fijas (saludo, despedida, "un momento"): se piden una vez y se reusan.
const phraseCache = new Map<string, Blob>();

export const stopSpeaking = () => {
  current?.control.abort();
  current?.audio?.pause();
  current = null;
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
};

const fetchVoice = async (chunk: string, signal: AbortSignal) => {
  const cached = phraseCache.get(chunk);
  if (cached) return cached;
  const blob = await speakText(chunk, signal);
  if (chunk.length < 80) phraseCache.set(chunk, blob);
  return blob;
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
  const { signal } = mine.control;
  const chunks = speechChunks(spoken);
  // Todos los trozos se piden ya; se reproducen en orden conforme llegan.
  const pending = chunks.map((chunk) => fetchVoice(chunk, signal));
  pending.forEach((p) => p.catch(() => {})); // los rechazos se atienden abajo, en orden

  for (let i = 0; i < chunks.length; i++) {
    if (signal.aborted) return;
    try {
      await play(await pending[i], mine);
    } catch {
      // Falló la voz natural: lo que falta lo dice el navegador.
      if (!signal.aborted) await sayWithBrowser(chunks.slice(i));
      return;
    }
  }
}

/* ── Escuchar ── */

export type Mic = {
  stream: MediaStream;
  analyser: AnalyserNode;
  /** Ruido de fondo estimado; se va ajustando mientras el micrófono está abierto. */
  noise: number;
  close: () => void;
};

/** Abre el micrófono con un analizador de volumen. Lanza si no hay permiso. */
export async function openMic(): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  return {
    stream,
    analyser,
    noise: 0.01,
    close: () => {
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => {});
    },
  };
}

/**
 * Volumen de este instante (0–1 aprox.) y, de paso, afina el ruido de fondo:
 * baja rápido cuando hay silencio y sube muy despacio, así una voz no se
 * confunde con ruido y un cuarto ruidoso no se confunde con una voz.
 */
function readLevel(mic: Mic, samples: Uint8Array) {
  mic.analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (const s of samples) sum += ((s - 128) / 128) ** 2;
  const rms = Math.sqrt(sum / samples.length);
  mic.noise = rms < mic.noise * 1.5 ? mic.noise * 0.95 + rms * 0.05 : mic.noise * 1.0005;
  return rms;
}

const newSamples = (mic: Mic) => new Uint8Array(mic.analyser.fftSize);

const PAUSE_MS = 1100; // silencio que cuenta como "terminé de hablar"
const IDLE_MS = 12000; // nadie habló: se descarta y se vuelve a escuchar
const MAX_MS = 30000; // tope por pregunta

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
    const samples = newSamples(mic);
    const startedAt = performance.now();
    let frame = 0;
    let keep = false;
    let spoke = false;
    let lastLoud = startedAt;

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
      const rms = readLevel(mic, samples);
      const now = performance.now();
      opts.onLevel?.(Math.min(1, rms * 8));
      if (rms > Math.max(0.025, mic.noise * 3)) {
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

const BARGE_MS = 280; // voz sostenida este tiempo = "me están hablando encima"

/**
 * Espera a que alguien hable (para interrumpir al bot mientras responde).
 * Pide más volumen y que se sostenga, para no dispararse con el eco de su propia
 * voz ni con un golpe. Resuelve `true` si oyó voz, `false` si se canceló.
 */
export function waitForVoice(mic: Mic, signal: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) return resolve(false);
    const samples = newSamples(mic);
    let frame = 0;
    let loudSince = 0;
    const onAbort = () => {
      cancelAnimationFrame(frame);
      resolve(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });

    const tick = () => {
      const rms = readLevel(mic, samples);
      const now = performance.now();
      if (rms > Math.max(0.06, mic.noise * 4)) loudSince ||= now;
      else loudSince = 0;
      if (loudSince && now - loudSince > BARGE_MS) {
        signal.removeEventListener('abort', onAbort);
        return resolve(true);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });
}
