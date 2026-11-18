'use client';

/**
 * Sweepstouch Bot acompaña en todo el panel: un botón flotante abajo a la derecha
 * que abre un chat sin salir de la pantalla. Usa el MISMO motor que el chat completo
 * (/ai/chat): recuerda la conversación, consulta los datos reales con todas las
 * herramientas, deja elegir el modelo y se le puede hablar (micrófono) y escuchar (voz).
 * Sabe en qué pantalla estás y puede llevarte a otra o ejecutar acciones (crear tareas…).
 */
import { MarkdownContent } from '@/components/application-ui/content-shells/ai-assistant/MarkdownContent';
import {
  MODEL_META,
  type BaseAIModel,
} from '@/components/application-ui/content-shells/ai-assistant/models';
import { RouterLink } from '@/components/base/router-link';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from '@/hooks/use-pathname';
import type { MenuItem as NavMenuItem } from '@/router/menuItem';
import { currentModule, menuModules } from '@/router/nav';
import { routes } from '@/router/routes';
import {
  getAvailableModels,
  sendChatMessage,
  transcribeAudio,
  type AvailableModels,
} from '@/services/ai.service';
import AddCommentRoundedIcon from '@mui/icons-material/AddCommentRounded';
import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
// '@mui/icons-material/TaskAltRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import {
  alpha,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  darken,
  Divider,
  Fab,
  Grow,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { tint, tintBorder } from 'src/theme/semantic';

type Turn = {
  id: number;
  from: 'me' | 'ai';
  text: string;
  route?: string;
  routeTitle?: string;
  done?: string[];
};

type ModelChoice = { provider: BaseAIModel; version: string };

const PROVIDERS: BaseAIModel[] = ['claude', 'openai', 'gemini'];
const PREFS_KEY = 'aiBuddy.prefs';

/** Preferencias del asistente (modelo y voz) por navegador. */
const loadPrefs = (): { model: ModelChoice; speak: boolean } => {
  const fallback = { model: { provider: 'claude' as BaseAIModel, version: '' }, speak: false };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    return saved && PROVIDERS.includes(saved.model?.provider)
      ? { ...fallback, ...saved }
      : fallback;
  } catch {
    return fallback;
  }
};

/** La marca de Sweepstouch (las dos flechas del logo), recortada del logo oficial y pintada con el color actual. */
function BrandMark({ size }: { size: number }) {
  const mask = 'url(/st-logo.png) left center / auto 100% no-repeat';
  return (
    <Box
      aria-hidden
      sx={{
        width: size * 0.8,
        height: size,
        flexShrink: 0,
        bgcolor: 'currentColor',
        mask,
        WebkitMask: mask,
      }}
    />
  );
}

/**
 * Texto para leer en voz alta: sólo lo que va ANTES de la línea '---' (en modo voz
 * el modelo deja ahí el resumen hablado y después el reporte escrito), sin markdown
 * ni enlaces.
 */
const speakable = (text: string) =>
  text
    .split(/\n\s*-{3,}\s*(?:\n|$)/)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#|>]/g, '')
    .slice(0, 1200);

/** La mejor voz en español que tenga el navegador (las "Natural"/"Google" suenan menos robóticas). */
const pickVoice = () => {
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('es'));
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural/i.test(v.name) ? 4 : 0) +
    (/google/i.test(v.name) ? 2 : 0) +
    (/alvaro|jorge|alonso|tomas|gerardo|diego/i.test(v.name) ? 1 : 0) +
    (/es-(us|mx|419)/i.test(v.lang) ? 1 : 0);
  return voices.reduce<SpeechSynthesisVoice | undefined>(
    (best, v) => (!best || score(v) > score(best) ? v : best),
    undefined
  );
};

/** Frases para salir del modo voz hablando. */
const BYE =
  /^\s*(adi[oó]s|hasta luego|ap[aá]gate|eso es todo|salir|terminar|gracias,? eso es todo)\b/i;

type VoiceState = 'off' | 'listening' | 'thinking' | 'speaking';
const VOICE_LABEL: Record<VoiceState, string> = {
  off: '',
  listening: 'Te escucho…',
  thinking: 'Consultando…',
  speaking: 'Respondiendo… (toca para interrumpir)',
};

/** Qué está haciendo mientras consulta (se muestra junto a los puntitos). */
const toolLabel = (tool: string) =>
  tool === 'db_read' || tool === 'store_audience'
    ? 'Consultando la base de datos…'
    : tool === 'create_task'
      ? 'Creando la tarea…'
      : tool === 'navigate'
        ? 'Buscando la pantalla…'
        : tool.includes('meeting')
          ? 'Revisando reuniones…'
          : tool.includes('calendar')
            ? 'Revisando el calendario…'
            : 'Consultando datos…';

export default function AiBuddy({ menuItems }: { menuItems: NavMenuItem[] }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { push } = useRouter();
  const { user } = useAuth();
  const modules = useMemo(() => menuModules(menuItems), [menuItems]);
  const aiRoute = routes.admin.applications['ai-assistant'];

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [voice, setVoice] = useState<VoiceState>('off');
  // Preferencias guardadas: sólo se pintan dentro del panel (cerrado al cargar),
  // así leerlas al iniciar no descuadra la hidratación.
  const [model, setModel] = useState<ModelChoice>(() => loadPrefs().model);
  const [speak, setSpeak] = useState(() => loadPrefs().speak);
  const [models, setModels] = useState<AvailableModels | null>(null);
  const [modelAnchor, setModelAnchor] = useState<HTMLElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const orbRef = useRef<HTMLButtonElement>(null);
  // El modo voz encadena escuchar → preguntar → hablar entre renders: lo que esas
  // funciones necesitan "al día" vive en refs, no en el estado del render que las creó.
  const convIdRef = useRef<string | undefined>(undefined);
  const modelRef = useRef(model);
  const busyRef = useRef(false);
  const voiceRef = useRef<{
    on: boolean;
    stream?: MediaStream;
    ctx?: AudioContext;
    analyser?: AnalyserNode;
    raf: number;
  }>({
    on: false,
    raf: 0,
  });
  modelRef.current = model;

  // En qué pantalla está la persona, con nombre: es el contexto que se le pasa a la IA.
  const here = currentModule(pathname, modules);
  const page = here?.module.pages.find((p) => p.route === here.route);
  const pageName = page ? (page.module ? `${page.module} › ${page.title}` : page.title) : '';

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns, busy]);
  // Al salir del panel: se corta lo que esté en curso (respuesta, micrófono, voz).
  useEffect(
    () => () => {
      abortRef.current?.abort();
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      const v = voiceRef.current;
      v.on = false;
      cancelAnimationFrame(v.raf);
      v.stream?.getTracks().forEach((t) => t.stop());
      void v.ctx?.close().catch(() => {});
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    },
    []
  );

  // Sólo para quien tiene el asistente en su menú; en la página del chat completo sobra.
  const allowed = modules.some((m) => m.pages.some((p) => p.route === aiRoute));
  if (!allowed || pathname.startsWith(aiRoute)) return null;

  const savePrefs = (next: { model?: ModelChoice; speak?: boolean }) => {
    const prefs = { model, speak, ...next };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* sin almacenamiento: la preferencia dura lo que dure la pestaña */
    }
  };
  const pickModel = (next: ModelChoice) => {
    setModel(next);
    savePrefs({ model: next });
  };
  const toggleSpeak = () => {
    if (speak) window.speechSynthesis?.cancel();
    setSpeak(!speak);
    savePrefs({ speak: !speak });
  };

  /** Lee la respuesta en voz alta; resuelve cuando termina (o la interrumpen). */
  const say = (answer: string, force = false) =>
    new Promise<void>((resolve) => {
      const synth = window.speechSynthesis;
      const spoken = speakable(answer).trim();
      if ((!speak && !force) || !synth || !spoken) return resolve();
      synth.cancel();
      // Por frases: Chrome corta las lecturas largas si van en un solo bloque.
      const parts = spoken
        .match(/[^.!?\n]+[.!?]*/g)
        ?.map((s) => s.trim())
        .filter(Boolean) || [spoken];
      const voiceChoice = pickVoice();
      parts.forEach((part, i) => {
        const utterance = new SpeechSynthesisUtterance(part);
        utterance.lang = voiceChoice?.lang || 'es-US';
        if (voiceChoice) utterance.voice = voiceChoice;
        utterance.rate = 1.05;
        if (i === parts.length - 1) utterance.onend = () => resolve();
        utterance.onerror = () => resolve(); // cancelada o sin voz: se sigue
        synth.speak(utterance);
      });
    });

  const ask = async (question: string, viaVoice = false): Promise<string> => {
    const q = question.trim();
    if (!q || busyRef.current) return '';
    busyRef.current = true;
    const aiId = Date.now() + 1;
    const patch = (fn: (t: Turn) => Turn) =>
      setTurns((all) => all.map((t) => (t.id === aiId ? fn(t) : t)));
    let answer = '';
    let failed = false;

    window.speechSynthesis?.cancel();
    setText('');
    setTurns((t) => [
      ...t,
      { id: aiId - 1, from: 'me', text: q },
      { id: aiId, from: 'ai', text: '' },
    ]);
    setBusy(true);
    setStatus('');
    const controller = new AbortController();
    abortRef.current = controller;

    await sendChatMessage(
      {
        conversationId: convIdRef.current,
        message: q,
        userId: user?._id || user?.id || '',
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
        userRole: user?.role || 'admin',
        model: modelRef.current.provider,
        modelVersion: modelRef.current.version || undefined,
        pageContext: `estoy en la pantalla "${pageName || pathname}" del panel, ruta ${pathname}`,
        voice: viaVoice || undefined,
        signal: controller.signal,
      },
      (chunk) => {
        answer += chunk;
        setStatus('');
        patch((t) => ({ ...t, text: answer }));
      },
      () => {},
      (error) => {
        failed = true;
        patch((t) => ({
          ...t,
          text: `${answer}${answer ? '\n\n' : ''}No pude responder: ${error}. Inténtalo de nuevo.`,
        }));
      },
      (data) => setStatus(toolLabel(data.tool)),
      (data) => {
        const r = data.result || {};
        if (data.tool === 'navigate' && r.route)
          patch((t) => ({ ...t, route: r.route, routeTitle: r.title }));
        if (r.success && r.message) patch((t) => ({ ...t, done: [...(t.done || []), r.message] }));
        if (r._fileUrls) {
          const { excelUrl, pdfUrl } = r._fileUrls;
          if (excelUrl) answer += `\n\n[Descargar Excel](${excelUrl})`;
          if (pdfUrl) answer += `\n\n[Descargar PDF](${pdfUrl})`;
          patch((t) => ({ ...t, text: answer }));
        }
      },
      undefined,
      (id) => {
        convIdRef.current = id;
      }
    );

    abortRef.current = null;
    busyRef.current = false;
    setBusy(false);
    setStatus('');
    if (controller.signal.aborted) {
      if (!answer.trim()) patch((t) => ({ ...t, text: 'Detenido.' }));
      return '';
    }
    if (failed) return viaVoice ? 'No pude responder. Inténtalo de nuevo.' : '';
    if (!answer.trim()) {
      // Nunca "Listo." sin respuesta: si no llegó texto, se dice tal cual.
      patch((t) =>
        t.route || t.done?.length
          ? { ...t, text: t.route ? 'Te llevo ahí:' : 'Hecho.' }
          : {
              ...t,
              text: 'No recibí respuesta del modelo. Inténtalo de nuevo o prueba con otro modelo.',
            }
      );
      return viaVoice ? 'No recibí respuesta. Inténtalo de nuevo.' : '';
    }
    if (!viaVoice) void say(answer);
    return answer;
  };

  /* ── Modo Jarvis: conversación por voz, manos libres ──
     escucha → detecta que terminaste de hablar → transcribe → consulta → responde
     en voz alta → vuelve a escuchar. Mientras habla no escucha (no se oye a sí mismo). */
  const stopVoice = () => {
    const v = voiceRef.current;
    v.on = false;
    cancelAnimationFrame(v.raf);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    v.stream?.getTracks().forEach((t) => t.stop());
    void v.ctx?.close().catch(() => {});
    v.stream = v.ctx = v.analyser = undefined;
    window.speechSynthesis?.cancel();
    abortRef.current?.abort();
    setVoice('off');
  };

  const listen = () => {
    const v = voiceRef.current;
    if (!v.on || !v.stream || !v.analyser) return;
    setVoice('listening');
    const recorder = new MediaRecorder(v.stream);
    const chunks: Blob[] = [];
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    const samples = new Uint8Array(v.analyser.fftSize);
    const startedAt = performance.now();
    let spoke = false;
    let lastLoud = startedAt;
    let floor = 0.01; // ruido de fondo, medido en el primer medio segundo
    let keep = false;

    const finish = (useIt: boolean) => {
      keep = useIt;
      cancelAnimationFrame(v.raf);
      orbRef.current?.style.setProperty('--lvl', '0');
      if (recorder.state === 'recording') recorder.stop();
    };

    recorder.onstop = async () => {
      recorderRef.current = null;
      if (!v.on) return;
      if (!keep || !chunks.length) return listen(); // sólo silencio: se sigue escuchando
      setVoice('thinking');
      const heard = await transcribeAudio(
        new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      ).catch(() => '');
      if (!v.on) return;
      if (!heard.trim()) return listen();
      if (BYE.test(heard)) {
        await say('Entendido. Aquí estaré.', true);
        return stopVoice();
      }
      const answer = await ask(heard, true);
      if (!v.on) return;
      if (answer) {
        setVoice('speaking');
        await say(answer, true);
      }
      if (v.on) listen();
    };

    const tick = () => {
      v.analyser!.getByteTimeDomainData(samples);
      let sum = 0;
      for (const s of samples) sum += ((s - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / samples.length);
      const now = performance.now();
      if (now - startedAt < 500) floor = Math.max(floor, rms);
      orbRef.current?.style.setProperty('--lvl', String(Math.min(1, rms * 8)));
      if (rms > Math.max(0.03, floor * 2.5)) {
        spoke = true;
        lastLoud = now;
      }
      if (spoke && now - lastLoud > 1400) return finish(true); // terminó de hablar
      if (!spoke && now - startedAt > 12000) return finish(false); // nadie habló: se reinicia
      if (now - startedAt > 60000) return finish(spoke); // tope por pregunta
      v.raf = requestAnimationFrame(tick);
    };

    recorder.start();
    v.raf = requestAnimationFrame(tick);
  };

  const startVoice = async () => {
    const v = voiceRef.current;
    if (v.on || recording) return;
    try {
      v.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setTurns((t) => [
        ...t,
        {
          id: Date.now(),
          from: 'ai',
          text: 'No tengo permiso para usar el micrófono. Actívalo en el navegador.',
        },
      ]);
      return;
    }
    v.ctx = new AudioContext();
    v.analyser = v.ctx.createAnalyser();
    v.analyser.fftSize = 1024;
    v.ctx.createMediaStreamSource(v.stream).connect(v.analyser);
    v.on = true;
    window.speechSynthesis?.getVoices(); // precarga la lista de voces
    setVoice('speaking');
    await say('A la orden. ¿Qué necesitas?', true);
    if (v.on) listen();
  };

  /** Tocar la esfera: interrumpe lo que esté haciendo y vuelve a escuchar. */
  const tapOrb = () => {
    if (voice === 'speaking') window.speechSynthesis?.cancel();
    else if (voice === 'thinking') abortRef.current?.abort();
  };

  /* ── Voz: graba, transcribe y manda la pregunta ── */
  const toggleMic = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (busy || transcribing || voiceRef.current.on) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        try {
          const heard = await transcribeAudio(
            new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          );
          if (heard.trim()) void ask(heard);
          else setText('');
        } catch {
          setTurns((t) => [
            ...t,
            {
              id: Date.now(),
              from: 'ai',
              text: 'No pude entender el audio. Inténtalo de nuevo o escribe la pregunta.',
            },
          ]);
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      setTurns((t) => [
        ...t,
        {
          id: Date.now(),
          from: 'ai',
          text: 'No tengo permiso para usar el micrófono. Actívalo en el navegador.',
        },
      ]);
    }
  };

  const reset = () => {
    if (voiceRef.current.on) stopVoice();
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
    setTurns([]);
    convIdRef.current = undefined;
  };

  const openModels = (el: HTMLElement) => {
    setModelAnchor(el);
    if (!models)
      getAvailableModels()
        .then(setModels)
        .catch(() => {});
  };

  const copy = (turn: Turn) => {
    void navigator.clipboard?.writeText(turn.text).then(() => {
      setCopiedId(turn.id);
      window.setTimeout(() => setCopiedId((id) => (id === turn.id ? null : id)), 1600);
    });
  };

  const suggestions = [
    {
      icon: <InsightsRoundedIcon />,
      text: 'Reporte de clientes: tiendas activas, inactivas, las que mandan campañas y las que no',
    },
    {
      icon: <EmojiEventsRoundedIcon />,
      text: '¿Cómo van los sorteos en progreso y cuántos participantes tienen?',
    },
    { icon: <ReceiptLongRoundedIcon />, text: '¿Cuántas facturas abiertas hay y cuánto suman?' },
    {
      icon: <TravelExploreRoundedIcon />,
      text: pageName ? `¿Qué puedo hacer en ${pageName}?` : '¿Qué puedo hacer en esta pantalla?',
    },
    {
      icon: <AddTaskRoundedIcon />,
      text: 'Crea una tarea para revisar las campañas de esta semana',
    },
  ];

  const offset = {
    right: 'max(20px, env(safe-area-inset-right, 0px))',
    bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
  };
  const versions = models?.[model.provider] || [];
  const modelLabel = MODEL_META[model.provider].label;
  const waiting = busy && !turns[turns.length - 1]?.text;
  const voiceOn = voice !== 'off';

  // Todo el color sale del rosa de marca del theme (primary): degradado, halos y tintes.
  const pink = theme.palette.primary;
  const brand = `linear-gradient(135deg, ${pink.light} 0%, ${pink.main} 48%, ${darken(
    pink.main,
    0.28
  )} 100%)`;
  const onBrand = pink.contrastText;
  const glow = (a: number) => alpha(pink.main, a);
  const subtle = alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.04);
  const noMotion = '@media (prefers-reduced-motion: reduce)';
  const headerBtn = {
    width: 34,
    height: 34,
    color: 'inherit',
    transition: 'background-color 160ms ease',
    '&:hover': { bgcolor: alpha(onBrand, 0.18) },
    '&:focus-visible': { outline: `2px solid ${onBrand}`, outlineOffset: 1 },
  };

  return (
    <>
      <Grow
        in={open}
        unmountOnExit
        style={{ transformOrigin: 'bottom right' }}
      >
        <Paper
          role="dialog"
          aria-label="Sweepstouch Bot"
          elevation={0}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          sx={{
            position: 'fixed',
            zIndex: theme.zIndex.speedDial,
            right: offset.right,
            bottom: `calc(${offset.bottom} + 76px)`,
            width: { xs: 'calc(100vw - 24px)', sm: 440 },
            maxWidth: 'calc(100vw - 24px)',
            height: 'min(680px, calc(100dvh - 124px))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 5,
            border: `1px solid ${glow(0.22)}`,
            backgroundImage: 'none',
            boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.28)}, 0 8px 28px ${glow(
              0.22
            )}`,
          }}
        >
          {/* Cabecera de marca */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1.25}
            sx={{
              position: 'relative',
              px: 2,
              py: 1.5,
              color: onBrand,
              background: brand,
              overflow: 'hidden',
              // Brillo suave arriba a la derecha: da profundidad sin otro color.
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -70,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(onBrand, 0.3)} 0%, transparent 68%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'relative',
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: onBrand,
                color: pink.main,
                boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.22)}`,
              }}
            >
              <BrandMark size={22} />
              <Box
                sx={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  border: `2px solid ${onBrand}`,
                }}
              />
            </Box>
            <Box
              flex={1}
              minWidth={0}
              position="relative"
            >
              <Typography
                sx={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.2 }}
              >
                Sweepstouch Bot
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 11.5, fontWeight: 500, color: alpha(onBrand, 0.9) }}
              >
                {pageName ? `Viendo: ${pageName}` : 'Tu asistente en todo el panel'}
              </Typography>
            </Box>
            <Stack
              direction="row"
              position="relative"
            >
              {turns.length > 0 && (
                <Tooltip title="Conversación nueva">
                  <IconButton
                    aria-label="Conversación nueva"
                    onClick={reset}
                    sx={headerBtn}
                  >
                    <AddCommentRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Abrir el chat completo">
                <IconButton
                  aria-label="Abrir el chat completo"
                  component={RouterLink}
                  href={aiRoute}
                  onClick={() => setOpen(false)}
                  sx={headerBtn}
                >
                  <OpenInFullRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cerrar">
                <IconButton
                  aria-label="Cerrar Sweepstouch Bot"
                  onClick={() => setOpen(false)}
                  sx={headerBtn}
                >
                  <CloseRoundedIcon sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Barra de modo: modelo, lectura en voz alta y conversación por voz */}
          <Stack
            direction="row"
            alignItems="center"
            gap={0.75}
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: glow(0.04),
            }}
          >
            <Tooltip title="Elegir el modelo de IA">
              <Chip
                size="small"
                icon={<AutoAwesomeRoundedIcon />}
                label={modelLabel}
                aria-label={`Modelo: ${modelLabel}. Cambiar modelo`}
                aria-haspopup="menu"
                onClick={(e) => openModels(e.currentTarget)}
                sx={{
                  height: 30,
                  px: 0.5,
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: 'background.paper',
                  border: `1px solid ${tintBorder(theme, 'primary')}`,
                  '& .MuiChip-icon': { fontSize: 15, color: 'primary.main' },
                  '&:hover': { bgcolor: tint(theme, 'primary', 0.1) },
                }}
              />
            </Tooltip>
            <Tooltip
              title={
                speak
                  ? 'Dejar de leer las respuestas en voz alta'
                  : 'Leer las respuestas en voz alta'
              }
            >
              <IconButton
                aria-label="Leer las respuestas en voz alta"
                aria-pressed={speak}
                onClick={toggleSpeak}
                sx={{
                  width: 32,
                  height: 32,
                  color: speak ? 'primary.main' : 'text.secondary',
                  bgcolor: speak ? tint(theme, 'primary', 0.12) : 'transparent',
                }}
              >
                {speak ? (
                  <VolumeUpRoundedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VolumeOffRoundedIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
            <Box flex={1} />
            <Button
              size="small"
              disableElevation
              variant={voiceOn ? 'outlined' : 'contained'}
              startIcon={voiceOn ? <StopRoundedIcon /> : <GraphicEqRoundedIcon />}
              aria-pressed={voiceOn}
              onClick={() => (voiceOn ? stopVoice() : void startVoice())}
              sx={{
                height: 32,
                px: 1.75,
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 800,
                textTransform: 'none',
                ...(!voiceOn && { background: brand, boxShadow: `0 4px 14px ${glow(0.35)}` }),
              }}
            >
              {voiceOn ? 'Salir de voz' : 'Hablar con el bot'}
            </Button>
          </Stack>

          <Menu
            anchorEl={modelAnchor}
            open={!!modelAnchor}
            onClose={() => setModelAnchor(null)}
            slotProps={{ paper: { sx: { width: 270, maxHeight: 420, borderRadius: 3 } } }}
          >
            {PROVIDERS.map((p) => (
              <MenuItem
                key={p}
                selected={p === model.provider}
                onClick={() => pickModel({ provider: p, version: '' })}
                sx={{ fontSize: 13.5, fontWeight: 700 }}
              >
                {MODEL_META[p].label}
              </MenuItem>
            ))}
            <Divider />
            <Typography
              sx={{
                px: 2,
                pt: 0.5,
                pb: 0.25,
                fontSize: 11,
                fontWeight: 700,
                color: 'text.secondary',
              }}
            >
              Versión de {modelLabel}
            </Typography>
            <MenuItem
              selected={!model.version}
              onClick={() => pickModel({ ...model, version: '' })}
              sx={{ fontSize: 12.5 }}
            >
              Predeterminada
              {models?.current?.[model.provider] ? ` (${models.current[model.provider]})` : ''}
            </MenuItem>
            {!models && (
              <MenuItem
                disabled
                sx={{ fontSize: 12.5 }}
              >
                Cargando versiones…
              </MenuItem>
            )}
            {versions.map((v) => (
              <MenuItem
                key={v.id}
                selected={v.id === model.version}
                onClick={() => pickModel({ ...model, version: v.id })}
                sx={{ fontSize: 12.5 }}
              >
                {v.display_name || v.id}
              </MenuItem>
            ))}
          </Menu>

          {/* Modo voz: la esfera late con tu voz y dice en qué está */}
          {voiceOn && (
            <Stack
              alignItems="center"
              gap={1.25}
              sx={{
                py: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                background: `radial-gradient(ellipse at 50% 0%, ${glow(0.14)} 0%, transparent 70%)`,
              }}
            >
              <Box
                component="button"
                type="button"
                ref={orbRef}
                onClick={tapOrb}
                aria-label={VOICE_LABEL[voice]}
                sx={{
                  '--lvl': 0,
                  position: 'relative',
                  width: 108,
                  height: 108,
                  p: 0,
                  border: 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color: onBrand,
                  cursor: voice === 'listening' ? 'default' : 'pointer',
                  background: `radial-gradient(circle at 32% 26%, ${pink.light} 0%, ${
                    pink.main
                  } 52%, ${darken(pink.main, 0.32)} 100%)`,
                  boxShadow: `0 0 0 calc(6px + var(--lvl) * 26px) ${glow(
                    0.16
                  )}, 0 0 0 calc(2px + var(--lvl) * 12px) ${glow(0.28)}, 0 12px 36px ${glow(0.5)}`,
                  transform: 'scale(calc(1 + var(--lvl) * 0.1))',
                  transition: 'transform 90ms linear, box-shadow 90ms linear',
                  animation: voice === 'listening' ? 'none' : 'buddyOrb 1.5s ease-in-out infinite',
                  '@keyframes buddyOrb': {
                    '0%, 100%': { filter: 'brightness(1)' },
                    '50%': { filter: 'brightness(1.22)' },
                  },
                  // Anillo que gira mientras consulta: se ve que está trabajando.
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -9,
                    borderRadius: '50%',
                    border: `2px solid transparent`,
                    borderTopColor: glow(0.9),
                    opacity: voice === 'thinking' ? 1 : 0,
                    animation: 'buddySpin 0.9s linear infinite',
                  },
                  '@keyframes buddySpin': { to: { transform: 'rotate(360deg)' } },
                  '&:focus-visible': { outline: `3px solid ${pink.main}`, outlineOffset: 12 },
                  [noMotion]: {
                    animation: 'none',
                    transition: 'none',
                    transform: 'none',
                    '&::after': { animation: 'none' },
                  },
                }}
              >
                <BrandMark size={44} />
              </Box>
              <Typography
                aria-live="polite"
                sx={{ fontSize: 14, fontWeight: 800 }}
              >
                {(voice === 'thinking' && status) || VOICE_LABEL[voice]}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11.5,
                  color: 'text.secondary',
                  textAlign: 'center',
                  px: 3,
                  mt: -0.75,
                }}
              >
                Habla normal y haz una pausa al terminar. Di «adiós» para salir.
              </Typography>
            </Stack>
          )}

          {/* Conversación */}
          <Stack
            gap={1.5}
            aria-live="polite"
            sx={{ flex: 1, overflowY: 'auto', px: 1.75, py: 1.75 }}
          >
            {turns.length === 0 && !voiceOn && (
              <Stack
                gap={1}
                sx={{ my: 'auto' }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    color: onBrand,
                    background: brand,
                    boxShadow: `0 0 0 8px ${glow(0.1)}, 0 10px 26px ${glow(0.4)}`,
                    mb: 0.75,
                  }}
                >
                  <BrandMark size={26} />
                </Box>
                <Typography
                  sx={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.25 }}
                >
                  Hola{user?.firstName ? `, ${user.firstName}` : ''}. ¿Qué necesitas saber?
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.55, mb: 0.75 }}
                >
                  Consulto los datos reales de Sweepstouch al momento: tiendas, clientes, sorteos,
                  campañas, facturas y tareas. Escríbeme o háblame.
                </Typography>
                {suggestions.map((s) => (
                  <ButtonBase
                    key={s.text}
                    onClick={() => void ask(s.text)}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      gap: 1.25,
                      px: 1.25,
                      py: 1,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      fontSize: 12.75,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      transition: 'border-color 160ms ease, background-color 160ms ease',
                      '&:hover': {
                        borderColor: tintBorder(theme, 'primary', 0.5),
                        bgcolor: tint(theme, 'primary', 0.06),
                      },
                      '&:focus-visible': { outline: `2px solid ${pink.main}`, outlineOffset: 2 },
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'primary.main',
                        bgcolor: tint(theme, 'primary', 0.1),
                        '& svg': { fontSize: 18 },
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box flex={1}>{s.text}</Box>
                    <ChevronRightRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </ButtonBase>
                ))}
              </Stack>
            )}

            {turns.map((turn) =>
              turn.from === 'me' ? (
                <Box
                  key={turn.id}
                  sx={{
                    alignSelf: 'flex-end',
                    maxWidth: '84%',
                    px: 1.75,
                    py: 1.1,
                    borderRadius: '18px 18px 6px 18px',
                    background: brand,
                    color: onBrand,
                    fontSize: 13.5,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                    boxShadow: `0 4px 14px ${glow(0.28)}`,
                  }}
                >
                  {turn.text}
                </Box>
              ) : turn.text || turn.route || turn.done?.length ? (
                <Stack
                  key={turn.id}
                  direction="row"
                  alignItems="flex-start"
                  gap={1}
                  sx={{ alignSelf: 'stretch' }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      width: 28,
                      height: 28,
                      mt: 0.25,
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      color: onBrand,
                      background: brand,
                    }}
                  >
                    <BrandMark size={13} />
                  </Box>
                  <Stack
                    gap={0.75}
                    minWidth={0}
                    flex={1}
                    alignItems="flex-start"
                  >
                    {turn.text && (
                      <Box
                        sx={{
                          maxWidth: '100%',
                          px: 1.75,
                          py: 1.25,
                          borderRadius: '6px 18px 18px 18px',
                          bgcolor: subtle,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <MarkdownContent content={turn.text} />
                      </Box>
                    )}
                    {turn.route && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<OpenInNewRoundedIcon />}
                        onClick={() => push(turn.route!)}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                      >
                        {turn.routeTitle || 'Abrir'}
                      </Button>
                    )}
                    {turn.done?.map((message, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        alignItems="center"
                        gap={0.75}
                        sx={{
                          px: 1.25,
                          py: 0.75,
                          borderRadius: 2,
                          bgcolor: tint(theme, 'success', 0.1),
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        <TaskAltRoundedIcon sx={{ fontSize: 17, color: 'success.main' }} />
                        {message}
                      </Stack>
                    ))}
                    {turn.text && !(busy && turn === turns[turns.length - 1]) && (
                      <ButtonBase
                        onClick={() => copy(turn)}
                        aria-label="Copiar la respuesta"
                        sx={{
                          gap: 0.5,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 1.5,
                          fontSize: 11,
                          fontWeight: 600,
                          color: copiedId === turn.id ? 'success.main' : 'text.secondary',
                          '&:hover': { bgcolor: subtle },
                        }}
                      >
                        {copiedId === turn.id ? (
                          <CheckRoundedIcon sx={{ fontSize: 13 }} />
                        ) : (
                          <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
                        )}
                        {copiedId === turn.id ? 'Copiado' : 'Copiar'}
                      </ButtonBase>
                    )}
                  </Stack>
                </Stack>
              ) : null
            )}

            {(waiting || status || transcribing) && (
              <Stack
                direction="row"
                alignItems="center"
                gap={0.6}
                aria-label={status || (transcribing ? 'Transcribiendo el audio' : 'Pensando')}
                sx={{
                  alignSelf: 'flex-start',
                  ml: 4.5,
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '6px 18px 18px 18px',
                  bgcolor: tint(theme, 'primary', 0.08),
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'text.secondary',
                  '& span': {
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    animation: 'buddyDot 1s ease-in-out infinite',
                  },
                  '& span:nth-of-type(2)': { animationDelay: '0.15s' },
                  '& span:nth-of-type(3)': { animationDelay: '0.3s', mr: 0.5 },
                  '@keyframes buddyDot': {
                    '0%, 80%, 100%': { opacity: 0.25, transform: 'translateY(0)' },
                    '40%': { opacity: 1, transform: 'translateY(-3px)' },
                  },
                  [noMotion]: { '& span': { animation: 'none', opacity: 0.6 } },
                }}
              >
                <span />
                <span />
                <span />
                {transcribing ? 'Transcribiendo el audio…' : status}
              </Stack>
            )}
            <div ref={endRef} />
          </Stack>

          {/* Entrada */}
          <Box sx={{ px: 1.5, pt: 1, pb: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack
              component="form"
              direction="row"
              alignItems="flex-end"
              gap={0.5}
              onSubmit={(e) => {
                e.preventDefault();
                void ask(text);
              }}
              sx={{
                p: 0.5,
                pl: 1.75,
                borderRadius: 4,
                border: '1.5px solid',
                borderColor: 'divider',
                bgcolor: subtle,
                transition: 'border-color 160ms ease, box-shadow 160ms ease',
                '&:focus-within': {
                  borderColor: 'primary.main',
                  boxShadow: `0 0 0 3px ${glow(0.14)}`,
                },
              }}
            >
              <InputBase
                inputRef={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void ask(text);
                  }
                }}
                multiline
                maxRows={4}
                placeholder={
                  recording
                    ? 'Te escucho… toca el micrófono para enviar'
                    : 'Pregúntale a Sweepstouch Bot…'
                }
                inputProps={{ 'aria-label': 'Pregunta para Sweepstouch Bot' }}
                sx={{ flex: 1, py: 0.9, fontSize: 14 }}
              />
              <Tooltip title={recording ? 'Terminar y enviar' : 'Dictar la pregunta'}>
                <span>
                  <IconButton
                    aria-label={recording ? 'Terminar de grabar y enviar' : 'Dictar la pregunta'}
                    aria-pressed={recording}
                    disabled={transcribing || voiceOn || (busy && !recording)}
                    onClick={() => void toggleMic()}
                    sx={{
                      width: 40,
                      height: 40,
                      color: recording ? 'error.main' : 'text.secondary',
                      ...(recording && { bgcolor: tint(theme, 'error', 0.12) }),
                    }}
                  >
                    {transcribing ? (
                      <CircularProgress size={18} />
                    ) : (
                      <MicRoundedIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton
                type={busy ? 'button' : 'submit'}
                aria-label={busy ? 'Detener la respuesta' : 'Enviar'}
                disabled={!busy && !text.trim()}
                onClick={busy ? () => abortRef.current?.abort() : undefined}
                sx={{
                  width: 40,
                  height: 40,
                  color: onBrand,
                  background: brand,
                  boxShadow: `0 4px 12px ${glow(0.35)}`,
                  transition: 'opacity 160ms ease, box-shadow 160ms ease',
                  '&:hover': { boxShadow: `0 6px 18px ${glow(0.5)}` },
                  '&.Mui-disabled': { color: onBrand, opacity: 0.35, boxShadow: 'none' },
                }}
              >
                {busy ? (
                  <StopRoundedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <ArrowUpwardRoundedIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Stack>
            <Typography
              sx={{ mt: 0.75, fontSize: 10.5, color: 'text.secondary', textAlign: 'center' }}
            >
              Responde con datos reales de Sweepstouch. Revisa la línea «Fuente» antes de decidir.
            </Typography>
          </Box>
        </Paper>
      </Grow>

      <Tooltip
        title={open ? '' : 'Sweepstouch Bot'}
        placement="left"
      >
        <Fab
          aria-label={open ? 'Cerrar Sweepstouch Bot' : 'Abrir Sweepstouch Bot'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          sx={{
            position: 'fixed',
            zIndex: theme.zIndex.speedDial,
            right: offset.right,
            bottom: offset.bottom,
            width: 60,
            height: 60,
            color: onBrand,
            background: brand,
            boxShadow: `0 10px 28px ${glow(0.5)}`,
            transition: 'transform 180ms ease-out, box-shadow 180ms ease-out',
            '&:hover': {
              background: brand,
              transform: 'scale(1.06)',
              boxShadow: `0 14px 34px ${glow(0.6)}`,
            },
            '&:focus-visible': { outline: `3px solid ${glow(0.5)}`, outlineOffset: 3 },
            // Halo que respira mientras está cerrado: invita sin estorbar.
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${glow(0.55)}`,
              opacity: 0,
              animation: open ? 'none' : 'buddyHalo 2.8s ease-out infinite',
            },
            '@keyframes buddyHalo': {
              '0%': { transform: 'scale(1)', opacity: 0.7 },
              '70%, 100%': { transform: 'scale(1.55)', opacity: 0 },
            },
            [noMotion]: {
              transition: 'none',
              '&:hover': { transform: 'none' },
              '&::after': { animation: 'none' },
            },
          }}
        >
          {open ? <CloseRoundedIcon /> : <BrandMark size={28} />}
        </Fab>
      </Tooltip>
    </>
  );
}
