'use client';

/**
 * La oficina de los robots, estilo juego: escena isométrica en SVG (sin librerías) con un
 * escritorio por agente, monitores, plantas, café y pizarra. Cada agente es un personaje SVG
 * propio que camina, se sienta a teclear cuando trabaja, va a avisarle al siguiente cuando
 * termina y pasea cuando no hay nada que hacer. Los globos salen de la bitácora real del
 * circular (`/circulars/:id/pipeline`). Abajo, una caja para darles instrucciones: se guardan
 * como "lección" de la tienda y los agentes las leen en la próxima lectura.
 */
import { circularService, type Pipeline } from '@/services/circular.service';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import toast from 'react-hot-toast';

/* ────────────────── Mundo ────────────────── */
const ORDER = ['hermes', 'argos', 'mnemosine', 'hefesto', 'atenea', 'iris', 'temis'];
const TEAM: Pipeline['agents'] = {
  hermes: { name: 'Hermes', emoji: '📨', role: 'Trae el archivo y arma las páginas' },
  argos: { name: 'Argos', emoji: '👁️', role: 'Lee los productos de cada página' },
  mnemosine: {
    name: 'Mnemósine',
    emoji: '🧠',
    role: 'Busca cada producto en la base: si ya estaba lo reutiliza, si no lo agrega',
  },
  hefesto: { name: 'Hefesto', emoji: '🔧', role: 'Guarda y actualiza el catálogo de la tienda' },
  atenea: {
    name: 'Atenea',
    emoji: '🦉',
    role: 'Audita página por página: precios, cantidades, letra chica y fotos',
  },
  iris: { name: 'Iris', emoji: '🌈', role: 'Limpia y genera las fotos de producto' },
  temis: { name: 'Temis', emoji: '⚖️', role: 'Decide qué se ve en la lista y quita duplicados' },
};
// Look de cada personaje: colores y accesorio, para reconocerlos sin leer el nombre.
const LOOK: Record<
  string,
  {
    shirt: string;
    hair: string;
    skin: string;
    acc: 'wings' | 'goggles' | 'bun' | 'helmet' | 'glasses' | 'band' | 'wig';
  }
> = {
  hermes: { shirt: '#3B82F6', hair: '#F59E0B', skin: '#F2C9A6', acc: 'wings' },
  argos: { shirt: '#10B981', hair: '#1F2937', skin: '#D9A074', acc: 'goggles' },
  mnemosine: { shirt: '#8B5CF6', hair: '#6B21A8', skin: '#F2C9A6', acc: 'bun' },
  hefesto: { shirt: '#F97316', hair: '#7C2D12', skin: '#C68642', acc: 'helmet' },
  atenea: { shirt: '#0EA5E9', hair: '#9CA3AF', skin: '#F2C9A6', acc: 'glasses' },
  iris: { shirt: '#EC4899', hair: '#DB2777', skin: '#E0AC69', acc: 'band' },
  temis: { shirt: '#111827', hair: '#E5E7EB', skin: '#F2C9A6', acc: 'wig' },
};

// Tiles del piso y proyección isométrica 2:1.
const COLS = 12,
  ROWS = 9,
  TW = 64,
  TH = 32;
const iso = (x: number, y: number) => ({ x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) });
// Escritorio (tile) y dónde se para el personaje al trabajar (delante del escritorio).
const DESK: Record<string, { x: number; y: number }> = {
  hermes: { x: 2, y: 2 },
  argos: { x: 5, y: 2 },
  mnemosine: { x: 8, y: 2 },
  hefesto: { x: 2, y: 5.5 },
  atenea: { x: 5, y: 5.5 },
  iris: { x: 8, y: 5.5 },
  temis: { x: 10.5, y: 4 },
};
const SEAT = (k: string) => ({ x: DESK[k].x + 0.5, y: DESK[k].y + 1.1 });
// Puntos de interés para pasear: café, impresora, pizarra, planta.
const POI = [
  { x: 0.8, y: 8 },
  { x: 4, y: 8.2 },
  { x: 6.5, y: 0.6 },
  { x: 10.5, y: 7.8 },
  { x: 3.5, y: 0.7 },
];

type Status = 'waiting' | 'running' | 'done' | 'error';
// Repertorio de cada estado: el mensaje real de la bitácora va primero y el remate le da voz
// de empleado que le habla al patrón. Se rota con el turno para que no repitan siempre lo mismo.
const SAY = {
  idle: [
    '☕ Un cafecito mientras llega el próximo circular, patrón.',
    'Todo al día por acá, patrón. ¿Hay algo más?',
    '¿Alguien vio el flyer de la semana que viene?',
    'Sin pendientes. Estiro las piernas un rato.',
    'Hoy no se me trabó nada 😎',
    '¿Mandamos el circular nuevo cuando quiera, patrón?',
  ],
  waiting: [
    'Esperando a que {prev} termine…',
    'En cuanto {prev} me pase lo suyo, arranco.',
    'Listo en mi puesto, patrón.',
  ],
  first: ['Listo para arrancar, patrón.', 'Apenas llegue el archivo, lo traigo.'],
  running: ['{msg}', '{msg} Ya casi, patrón.', '{msg} Dame un minuto.'],
  done: [
    '{msg} ¿Vuelvo a trabajar, patrón?',
    '{msg} Ya terminé lo mío. ¿Algo más?',
    '{msg} Listo por mi parte, patrón 👍',
  ],
  handoff: [
    '{msg} ¡{next}, te toca!',
    '{msg} Te lo dejo en tu escritorio, {next}.',
    'Terminé, {next}. Es todo tuyo.',
  ],
  error: ['Me trabé, patrón: {msg}', 'Necesito ayuda: {msg}', 'Esto no me salió: {msg}'],
  thanks: ['¡Gracias, patrón! ☕', 'Me lo gané, ¿no? 😄', 'Descanso cinco y vuelvo.'],
  go: ['¡A trabajar! 💪', 'Sí, patrón. Voy.', 'Ahora mismo, patrón.'],
};
const pick = (arr: string[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];
const fill = (tpl: string, v: Record<string, string>) =>
  tpl
    .replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')
    .replace(/\s+/g, ' ')
    .trim();

function line(
  k: string,
  s: { status: Status; message?: string } | undefined,
  data: Pipeline,
  i: number
) {
  const name = (x: string) => data.agents[x]?.name || x;
  const next = ORDER[ORDER.indexOf(k) + 1];
  const prev = ORDER[ORDER.indexOf(k) - 1];
  const msg = (s?.message || '').trim().replace(/[.…]+$/, '');
  const v = {
    msg: msg ? `${msg}.` : '',
    prev: prev ? name(prev) : '',
    next: next ? name(next) : '',
  };
  if (!s) return fill(pick(data.running ? (prev ? SAY.waiting : SAY.first) : SAY.idle, i), v);
  if (s.status === 'running')
    return fill(pick(SAY.running, i), { ...v, msg: msg ? `${msg}…` : 'Trabajando…' });
  if (s.status === 'error') return fill(pick(SAY.error, i), { ...v, msg: msg || 'error' });
  const nxt = next ? data.steps.find((x) => x.agent === next) : null;
  return fill(pick(nxt?.status === 'running' ? SAY.handoff : SAY.done, i), v);
}

/* ────────────────── Personaje ────────────────── */
function Character({
  k,
  walking,
  typing,
  flip,
  status,
}: {
  k: string;
  walking: boolean;
  typing: boolean;
  flip: boolean;
  status: Status;
}) {
  const L = LOOK[k] || LOOK.hermes;
  const ring =
    status === 'error'
      ? '#DC2626'
      : status === 'done'
        ? '#16A34A'
        : status === 'running'
          ? '#E8127F'
          : '#9CA3AF';
  return (
    <g
      className={`ch ${walking ? 'walk' : ''} ${typing ? 'type' : ''}`}
      transform={`scale(${flip ? -1 : 1},1)`}
    >
      <ellipse
        cx={0}
        cy={1}
        rx={11}
        ry={4}
        fill="rgba(0,0,0,.22)"
      />
      {/* piernas */}
      <g className="leg l">
        <rect
          x={-7}
          y={-15}
          width={6}
          height={15}
          rx={2}
          fill="#1F2937"
        />
        <rect
          x={-8}
          y={-2}
          width={8}
          height={4}
          rx={1.5}
          fill="#111827"
        />
      </g>
      <g className="leg r">
        <rect
          x={1}
          y={-15}
          width={6}
          height={15}
          rx={2}
          fill="#1F2937"
        />
        <rect
          x={0}
          y={-2}
          width={8}
          height={4}
          rx={1.5}
          fill="#111827"
        />
      </g>
      {/* cuerpo */}
      <rect
        x={-10}
        y={-32}
        width={20}
        height={19}
        rx={5}
        fill={L.shirt}
      />
      <rect
        x={-4}
        y={-32}
        width={8}
        height={19}
        fill="rgba(255,255,255,.12)"
      />
      {/* brazos */}
      <g className="arm l">
        <rect
          x={-14}
          y={-30}
          width={5}
          height={14}
          rx={2.5}
          fill={L.shirt}
        />
        <circle
          cx={-11.5}
          cy={-16}
          r={3}
          fill={L.skin}
        />
      </g>
      <g className="arm r">
        <rect
          x={9}
          y={-30}
          width={5}
          height={14}
          rx={2.5}
          fill={L.shirt}
        />
        <circle
          cx={11.5}
          cy={-16}
          r={3}
          fill={L.skin}
        />
      </g>
      {/* cabeza */}
      <circle
        cx={0}
        cy={-42}
        r={11}
        fill={L.skin}
      />
      <path
        d="M-11-44 Q-10-55 0-55 Q10-55 11-44 Q6-50 0-49 Q-6-50 -11-44Z"
        fill={L.hair}
      />
      <circle
        cx={-4}
        cy={-42}
        r={1.6}
        fill="#111"
      />
      <circle
        cx={4}
        cy={-42}
        r={1.6}
        fill="#111"
      />
      <path
        d="M-3-37 Q0-35 3-37"
        stroke="#7a4a2a"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* accesorio */}
      {L.acc === 'wings' && (
        <>
          <path
            d="M-12-50 l-7-5 l1 8z"
            fill="#fff"
            stroke="#cbd5e1"
          />
          <path
            d="M12-50 l7-5 l-1 8z"
            fill="#fff"
            stroke="#cbd5e1"
          />
        </>
      )}
      {L.acc === 'goggles' && (
        <>
          <circle
            cx={-4}
            cy={-42}
            r={4}
            fill="none"
            stroke="#111"
            strokeWidth={1.5}
          />
          <circle
            cx={4}
            cy={-42}
            r={4}
            fill="none"
            stroke="#111"
            strokeWidth={1.5}
          />
          <circle
            cx={0}
            cy={-50}
            r={2.2}
            fill="#111"
          />
        </>
      )}
      {L.acc === 'bun' && (
        <circle
          cx={0}
          cy={-56}
          r={5}
          fill={L.hair}
        />
      )}
      {L.acc === 'helmet' && (
        <path
          d="M-12-46 Q-12-58 0-58 Q12-58 12-46Z"
          fill="#FACC15"
          stroke="#CA8A04"
        />
      )}
      {L.acc === 'glasses' && (
        <>
          <circle
            cx={-4}
            cy={-42}
            r={3.5}
            fill="rgba(255,255,255,.5)"
            stroke="#111"
            strokeWidth={1.2}
          />
          <circle
            cx={4}
            cy={-42}
            r={3.5}
            fill="rgba(255,255,255,.5)"
            stroke="#111"
            strokeWidth={1.2}
          />
          <path
            d="M-13-48 Q-8-53 -4-50 M13-48 Q8-53 4-50"
            stroke="#16A34A"
            strokeWidth={1.5}
            fill="none"
          />
        </>
      )}
      {L.acc === 'band' && (
        <path
          d="M-11-47 Q0-52 11-47"
          stroke="url(#rainbow)"
          strokeWidth={3}
          fill="none"
        />
      )}
      {L.acc === 'wig' && (
        <>
          <rect
            x={-13}
            y={-50}
            width={5}
            height={14}
            rx={2.5}
            fill="#E5E7EB"
          />
          <rect
            x={8}
            y={-50}
            width={5}
            height={14}
            rx={2.5}
            fill="#E5E7EB"
          />
        </>
      )}
      {/* estado sobre la cabeza */}
      <g transform={`scale(${flip ? -1 : 1},1)`}>
        <circle
          cx={10}
          cy={-58}
          r={5.5}
          fill={ring}
        />
        {status === 'done' && (
          <path
            d="M7-58 l2 2 l4-4"
            stroke="#fff"
            strokeWidth={1.6}
            fill="none"
          />
        )}
        {status === 'error' && (
          <text
            x={10}
            y={-55.5}
            textAnchor="middle"
            fontSize={8}
            fontWeight={800}
            fill="#fff"
          >
            !
          </text>
        )}
        {status === 'running' && (
          <circle
            cx={10}
            cy={-58}
            r={2}
            fill="#fff"
            className="blink"
          />
        )}
        {status === 'waiting' && (
          <text
            x={10}
            y={-55.5}
            textAnchor="middle"
            fontSize={7}
            fontWeight={800}
            fill="#fff"
          >
            z
          </text>
        )}
      </g>
    </g>
  );
}

/* ────────────────── Muebles ────────────────── */
function IsoBox({
  x,
  y,
  w,
  d,
  h,
  top,
  left,
  right,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
}) {
  const a = iso(x, y),
    b = iso(x + w, y),
    c = iso(x + w, y + d),
    e = iso(x, y + d);
  return (
    <g>
      <polygon
        points={`${a.x},${a.y - h} ${b.x},${b.y - h} ${c.x},${c.y - h} ${e.x},${e.y - h}`}
        fill={top}
      />
      <polygon
        points={`${e.x},${e.y - h} ${c.x},${c.y - h} ${c.x},${c.y} ${e.x},${e.y}`}
        fill={left}
      />
      <polygon
        points={`${c.x},${c.y - h} ${b.x},${b.y - h} ${b.x},${b.y} ${c.x},${c.y}`}
        fill={right}
      />
    </g>
  );
}
function Desk({ x, y, on, dark }: { x: number; y: number; on: boolean; dark: boolean }) {
  const m = iso(x + 0.7, y + 0.35);
  const chair = iso(x + 0.8, y + 1.1);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={1.6}
        d={0.9}
        h={22}
        top={dark ? '#4b4046' : '#ffffff'}
        left={dark ? '#2f272c' : '#d9d2d6'}
        right={dark ? '#3a3036' : '#eae3e7'}
      />
      {/* monitor */}
      <g transform={`translate(${m.x},${m.y - 22})`}>
        <rect
          x={-2}
          y={-3}
          width={4}
          height={4}
          fill="#374151"
        />
        <rect
          x={-15}
          y={-23}
          width={30}
          height={20}
          rx={2}
          fill="#111827"
        />
        <rect
          x={-13}
          y={-21}
          width={26}
          height={16}
          rx={1}
          fill={on ? '#E8127F' : dark ? '#1f2937' : '#334155'}
          className={on ? 'screen' : ''}
        />
        {on && (
          <>
            <rect
              x={-10}
              y={-18}
              width={14}
              height={2}
              fill="rgba(255,255,255,.8)"
            />
            <rect
              x={-10}
              y={-14}
              width={18}
              height={2}
              fill="rgba(255,255,255,.6)"
            />
            <rect
              x={-10}
              y={-10}
              width={9}
              height={2}
              fill="rgba(255,255,255,.7)"
            />
          </>
        )}
      </g>
      {/* teclado + taza */}
      <g transform={`translate(${m.x - 2},${m.y - 22})`}>
        <rect
          x={-10}
          y={4}
          width={20}
          height={5}
          rx={1}
          fill={dark ? '#6b7280' : '#cbd5e1'}
        />
      </g>
      <g transform={`translate(${m.x + 18},${m.y - 22})`}>
        <rect
          x={-3}
          y={0}
          width={6}
          height={6}
          rx={1.5}
          fill="#E8127F"
        />
        <path
          d="M3 1 q4 1 0 4"
          stroke="#E8127F"
          strokeWidth={1.2}
          fill="none"
        />
      </g>
      {/* silla */}
      <ellipse
        cx={chair.x}
        cy={chair.y - 4}
        rx={12}
        ry={6}
        fill={dark ? '#5b4a53' : '#9b8f96'}
      />
    </g>
  );
}
function Plant({ x, y }: { x: number; y: number }) {
  const p = iso(x, y);
  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <ellipse
        cx={0}
        cy={0}
        rx={9}
        ry={4}
        fill="rgba(0,0,0,.15)"
      />
      <rect
        x={-6}
        y={-12}
        width={12}
        height={12}
        rx={2}
        fill="#B45309"
      />
      <circle
        cx={-5}
        cy={-18}
        r={6}
        fill="#15803D"
      />
      <circle
        cx={5}
        cy={-19}
        r={6}
        fill="#16A34A"
      />
      <circle
        cx={0}
        cy={-25}
        r={7}
        fill="#22C55E"
      />
    </g>
  );
}
function Coffee({ x, y, dark }: { x: number; y: number; dark: boolean }) {
  const p = iso(x, y);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={0.9}
        d={0.9}
        h={26}
        top={dark ? '#4b4046' : '#f3f4f6'}
        left={dark ? '#2f272c' : '#d1d5db'}
        right={dark ? '#3a3036' : '#e5e7eb'}
      />
      <g transform={`translate(${p.x + 10},${p.y - 26})`}>
        <rect
          x={-8}
          y={-22}
          width={16}
          height={22}
          rx={2}
          fill="#374151"
        />
        <rect
          x={-5}
          y={-18}
          width={10}
          height={6}
          rx={1}
          fill="#9CA3AF"
        />
        <rect
          x={-3}
          y={-8}
          width={6}
          height={5}
          fill="#fff"
        />
        <path
          className="steam"
          d="M-2-24 q2-3 0-6 M2-24 q2-3 0-6"
          stroke="#9CA3AF"
          strokeWidth={1}
          fill="none"
        />
      </g>
    </g>
  );
}
function Printer({ x, y, dark }: { x: number; y: number; dark: boolean }) {
  const p = iso(x, y);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={1.1}
        d={0.9}
        h={16}
        top={dark ? '#4b4046' : '#f3f4f6'}
        left={dark ? '#2f272c' : '#d1d5db'}
        right={dark ? '#3a3036' : '#e5e7eb'}
      />
      <g transform={`translate(${p.x + 14},${p.y - 16})`}>
        <rect
          x={-13}
          y={-12}
          width={26}
          height={12}
          rx={2}
          fill="#4B5563"
        />
        <rect
          x={-9}
          y={-16}
          width={18}
          height={5}
          fill="#fff"
        />
        <circle
          cx={9}
          cy={-6}
          r={1.5}
          fill="#22C55E"
        />
      </g>
    </g>
  );
}

/* ────────────────── Oficina ────────────────── */
type Props = { data?: Pipeline | null; loading?: boolean; storeSlug: string };
type Pos = { x: number; y: number; ms: number; walking: boolean; flip: boolean };

export default function AgentOffice({ data, loading, storeSlug }: Props) {
  const t = useTheme();
  const dark = t.palette.mode === 'dark';
  const qc = useQueryClient();
  const brand = t.palette.primary.main;

  const agents = data?.agents && Object.keys(data.agents).length ? data.agents : TEAM;
  const byAgent = useMemo(() => new Map((data?.steps || []).map((s) => [s.agent, s])), [data]);
  const keys = ORDER.filter((k) => agents[k]);
  const pipe: Pipeline = data || { ok: true, agents, steps: [], running: false, accuracy: null };
  const statusOf = (k: string): Status => (byAgent.get(k)?.status as Status) || 'waiting';

  // Posición (en tiles) y destino de cada personaje. Caminan por transición CSS; `walking`
  // dura lo que tarda el viaje, proporcional a la distancia.
  const [pos, setPos] = useState<Record<string, Pos>>(() =>
    Object.fromEntries(ORDER.map((k) => [k, { ...SEAT(k), ms: 0, walking: false, flip: false }]))
  );
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const goTo = (k: string, to: { x: number; y: number }, then?: () => void) => {
    setPos((p) => {
      const cur = p[k];
      const dist = Math.hypot(to.x - cur.x, to.y - cur.y);
      const ms = Math.max(600, dist * 650);
      clearTimeout(timers.current[k]);
      timers.current[k] = setTimeout(() => {
        setPos((q) => ({ ...q, [k]: { ...q[k], walking: false } }));
        then?.();
      }, ms);
      const sx = iso(to.x, to.y).x - iso(cur.x, cur.y).x;
      return {
        ...p,
        [k]: {
          x: to.x,
          y: to.y,
          ms,
          walking: dist > 0.05,
          flip: sx < 0 ? true : sx > 0 ? false : cur.flip,
        },
      };
    });
  };

  // Reacciones a la bitácora: el que trabaja va a su silla; el que termina camina a avisarle al
  // siguiente y vuelve; el que falla se queda en su puesto.
  const prevStatus = useRef<Record<string, Status>>({});
  useEffect(() => {
    keys.forEach((k) => {
      const st = statusOf(k);
      const was = prevStatus.current[k];
      if (st === was) return;
      prevStatus.current[k] = st;
      if (st === 'running' || st === 'error') goTo(k, SEAT(k));
      if (st === 'done' && was === 'running') {
        const next = ORDER[ORDER.indexOf(k) + 1];
        if (next && DESK[next])
          goTo(k, { x: DESK[next].x - 0.6, y: DESK[next].y + 1.1 }, () => {
            timers.current[`${k}-back`] = setTimeout(() => goTo(k, SEAT(k)), 1800);
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Paseo: cada 5 s algún agente libre (sin trabajo en curso) sale a un punto de interés y vuelve.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!keys.length) return;
    const free = keys.filter(
      (k) => statusOf(k) !== 'running' && statusOf(k) !== 'error' && !pos[k].walking
    );
    if (!free.length || Math.random() < 0.35) return;
    const k = free[Math.floor(Math.random() * free.length)];
    const poi = POI[Math.floor(Math.random() * POI.length)];
    goTo(
      k,
      { x: poi.x + (Math.random() - 0.5) * 0.6, y: poi.y + (Math.random() - 0.5) * 0.4 },
      () => {
        timers.current[`${k}-back`] = setTimeout(
          () => goTo(k, SEAT(k)),
          3500 + Math.random() * 3000
        );
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  // Quién habla: los que trabajan o fallaron siempre; uno más por turno.
  const talking = new Set<string>(
    keys.filter((k) => statusOf(k) === 'running' || statusOf(k) === 'error')
  );
  if (talking.size < 2 && keys.length) talking.add(keys[tick % keys.length]);

  // Instrucciones desde la oficina → lección de la tienda (Temis contesta en pantalla).
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  // Globos rosa = lo que contestan al patrón (por agente). Se borran solos a los 7 s.
  const [reply, setReply] = useState<Record<string, string>>({});
  const say = (map: Record<string, string>) => {
    setReply(map);
    clearTimeout(timers.current.reply);
    timers.current.reply = setTimeout(() => setReply({}), 7000);
  };
  const send = async () => {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await circularService.addStoreLesson(storeSlug, text);
      setMsg('');
      say({
        temis: `Anotado, patrón: "${text.slice(0, 60)}${
          text.length > 60 ? '…' : ''
        }". Lo aplicamos en la próxima lectura.`,
      });
      void qc.invalidateQueries({ queryKey: ['store-profile', storeSlug] });
    } catch {
      toast.error('No se pudo guardar la instrucción');
    } finally {
      setSending(false);
    }
  };
  // Respuestas rápidas del patrón: "Sí, dale" arranca la revisión diaria (Atenea coteja todo
  // contra el flyer); "Descansen" sólo les contesta.
  const [answering, setAnswering] = useState(false);
  const answer = async (kind: 'go' | 'rest') => {
    const all = Object.fromEntries(
      keys.map((k, i) => [k, pick(kind === 'go' ? SAY.go : SAY.thanks, i + tick)])
    );
    if (kind === 'rest') return say(all);
    setAnswering(true);
    try {
      await circularService.runProductReview(storeSlug);
      say(all);
      void qc.invalidateQueries({ queryKey: ['product-review', storeSlug] });
      toast.success('Revisando el circular… te avisan en la campana cuando terminen.');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'No pudieron arrancar');
    } finally {
      setAnswering(false);
    }
  };
  const asking = !data?.running && keys.some((k) => statusOf(k) === 'done' || !byAgent.get(k));

  // Encuadre del SVG: la sala proyectada ocupa de x=-ROWS*TW/2 a COLS*TW/2.
  const minX = -ROWS * (TW / 2) - 30,
    width = (COLS + ROWS) * (TW / 2) + 60,
    height = (COLS + ROWS) * (TH / 2) + 150;
  const floorA = dark ? '#2a2328' : '#F6EEF2',
    floorB = dark ? '#312a2f' : '#FBF5F8';
  const wallL = dark ? '#3b3139' : '#F3DCE7',
    wallR = dark ? '#443840' : '#FAE6EF';

  // Muebles y personajes, pintados por profundidad (x+y) para que se tapen bien.
  const scene: { z: number; el: ReactElement }[] = [];
  keys.forEach((k) =>
    scene.push({
      z: DESK[k].x + DESK[k].y + 1,
      el: (
        <Desk
          key={`d-${k}`}
          x={DESK[k].x}
          y={DESK[k].y}
          on={statusOf(k) === 'running'}
          dark={dark}
        />
      ),
    })
  );
  [
    { x: 0.3, y: 7.4 },
    { x: 11.3, y: 0.3 },
    { x: 11.3, y: 8.3 },
  ].forEach((p, i) =>
    scene.push({
      z: p.x + p.y,
      el: (
        <Plant
          key={`p-${i}`}
          x={p.x}
          y={p.y}
        />
      ),
    })
  );
  scene.push({
    z: 0.4 + 8.5 + 0.5,
    el: (
      <Coffee
        key="coffee"
        x={0}
        y={8.1}
        dark={dark}
      />
    ),
  });
  scene.push({
    z: 4 + 8.8 + 0.5,
    el: (
      <Printer
        key="printer"
        x={3.6}
        y={8.3}
        dark={dark}
      />
    ),
  });
  keys.forEach((k, i) => {
    const p = pos[k],
      s = iso(p.x, p.y),
      st = statusOf(k);
    const step = byAgent.get(k) as { status: Status; message?: string } | undefined;
    const border =
      st === 'error' ? '#DC2626' : st === 'running' ? brand : dark ? '#4b5563' : '#e5e7eb';
    scene.push({
      z: p.x + p.y + 0.6,
      el: (
        <g
          key={`c-${k}`}
          className="walker"
          style={{
            transform: `translate(${s.x}px, ${s.y}px)`,
            transitionDuration: `${p.ms || 600}ms`,
          }}
        >
          <Character
            k={k}
            walking={p.walking}
            typing={st === 'running' && !p.walking}
            flip={p.flip}
            status={st}
          />
          <text
            y={12}
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
            fill={dark ? '#f3f4f6' : '#111827'}
            stroke={dark ? '#1b1619' : '#fff'}
            strokeWidth={3}
            paintOrder="stroke"
          >
            {agents[k].name}
          </text>
          {talking.has(k) && (
            <foreignObject
              x={-78}
              y={-128}
              width={156}
              height={66}
              className="bubble"
              style={{ overflow: 'visible' }}
            >
              <div
                style={{
                  position: 'relative',
                  background: st === 'error' ? '#FEE2E2' : dark ? '#2b2530' : '#fff',
                  color: st === 'error' ? '#991B1B' : dark ? '#f3f4f6' : '#111827',
                  border: `1.5px solid ${border}`,
                  borderRadius: 10,
                  padding: '6px 8px',
                  fontSize: 10.5,
                  lineHeight: 1.25,
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 16px rgba(0,0,0,.18)',
                  maxHeight: 58,
                  overflow: 'hidden',
                }}
              >
                {line(k, step, pipe, i + tick)}
                <span
                  style={{
                    position: 'absolute',
                    left: 70,
                    bottom: -7,
                    width: 11,
                    height: 11,
                    background: 'inherit',
                    borderRight: `1.5px solid ${border}`,
                    borderBottom: `1.5px solid ${border}`,
                    transform: 'rotate(45deg)',
                  }}
                />
              </div>
            </foreignObject>
          )}
          {reply[k] && (
            <foreignObject
              x={-90}
              y={-150}
              width={180}
              height={70}
              className="bubble"
              style={{ overflow: 'visible' }}
            >
              <div
                style={{
                  background: brand,
                  color: '#fff',
                  borderRadius: 10,
                  padding: '6px 8px',
                  fontSize: 10.5,
                  lineHeight: 1.25,
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 16px rgba(0,0,0,.25)',
                }}
              >
                {reply[k]}
              </div>
            </foreignObject>
          )}
        </g>
      ),
    });
  });
  scene.sort((a, b) => a.z - b.z);

  const o = iso(0, 0),
    r = iso(COLS, 0),
    l = iso(0, ROWS),
    H = 120;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: dark ? '#1b1619' : '#FFF8FB',
      }}
    >
      <style>{`
        .ch .leg, .ch .arm { transform-box: fill-box; transform-origin: top center; }
        .ch.walk .leg.l { animation: legL .5s ease-in-out infinite; }
        .ch.walk .leg.r { animation: legR .5s ease-in-out infinite; }
        .ch.walk .arm.l { animation: legR .5s ease-in-out infinite; }
        .ch.walk .arm.r { animation: legL .5s ease-in-out infinite; }
        .ch.type .arm.l { animation: typeA .22s ease-in-out infinite; }
        .ch.type .arm.r { animation: typeA .22s ease-in-out infinite .11s; }
        @keyframes legL { 0%,100% { transform: rotate(-22deg) } 50% { transform: rotate(22deg) } }
        @keyframes legR { 0%,100% { transform: rotate(22deg) } 50% { transform: rotate(-22deg) } }
        @keyframes typeA { 0%,100% { transform: translateY(0) rotate(-40deg) } 50% { transform: translateY(2px) rotate(-40deg) } }
        .walker { transition-property: transform; transition-timing-function: linear; }
        .screen { animation: glow 1.4s ease-in-out infinite; }
        @keyframes glow { 0%,100% { opacity: .85 } 50% { opacity: 1 } }
        .blink { animation: glow .8s ease-in-out infinite; }
        .steam { animation: steam 2.2s ease-in-out infinite; }
        @keyframes steam { 0% { opacity: 0; transform: translateY(2px) } 50% { opacity: 1 } 100% { opacity: 0; transform: translateY(-4px) } }
        .bubble { animation: pop .25s ease both; }
        @keyframes pop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .ch *, .walker, .screen, .steam, .blink { animation: none !important; transition: none !important } }
      `}</style>

      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
        sx={{ position: 'absolute', top: 12, left: 14, zIndex: 2 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={800}
        >
          La oficina
        </Typography>
        {loading && <CircularProgress size={14} />}
        {data?.running && (
          <Chip
            size="small"
            color="info"
            label="Trabajando ahora"
          />
        )}
        {data && !data.running && data.accuracy != null && (
          <Chip
            size="small"
            color={data.accuracy >= 95 ? 'success' : data.accuracy >= 85 ? 'warning' : 'error'}
            label={`Efectividad ${data.accuracy}%`}
          />
        )}
        {!data && !loading && (
          <Chip
            size="small"
            variant="outlined"
            label="Sin circular todavía"
          />
        )}
      </Stack>

      <svg
        viewBox={`${minX} -140 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxHeight: 560 }}
        role="img"
        aria-label="Oficina de los agentes"
      >
        <defs>
          <linearGradient
            id="rainbow"
            x1="0"
            x2="1"
          >
            <stop
              offset="0"
              stopColor="#ef4444"
            />
            <stop
              offset=".5"
              stopColor="#eab308"
            />
            <stop
              offset="1"
              stopColor="#3b82f6"
            />
          </linearGradient>
          <linearGradient
            id="win"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              stopColor="#bae6fd"
            />
            <stop
              offset="1"
              stopColor="#e0f2fe"
            />
          </linearGradient>
        </defs>

        {/* Paredes */}
        <polygon
          points={`${o.x},${o.y - H} ${r.x},${r.y - H} ${r.x},${r.y} ${o.x},${o.y}`}
          fill={wallR}
        />
        <polygon
          points={`${o.x},${o.y - H} ${l.x},${l.y - H} ${l.x},${l.y} ${o.x},${o.y}`}
          fill={wallL}
        />
        {/* ventana pared derecha */}
        <polygon
          points={`${iso(6.5, 0).x},${iso(6.5, 0).y - 100} ${iso(10, 0).x},${iso(10, 0).y - 100} ${
            iso(10, 0).x
          },${iso(10, 0).y - 45} ${iso(6.5, 0).x},${iso(6.5, 0).y - 45}`}
          fill="url(#win)"
          stroke="#fff"
          strokeWidth={3}
        />
        {/* pizarra pared izquierda */}
        <polygon
          points={`${iso(0, 1).x},${iso(0, 1).y - 100} ${iso(0, 5).x},${iso(0, 5).y - 100} ${
            iso(0, 5).x
          },${iso(0, 5).y - 40} ${iso(0, 1).x},${iso(0, 1).y - 40}`}
          fill={dark ? '#1f2937' : '#ffffff'}
          stroke={dark ? '#374151' : '#e5e7eb'}
          strokeWidth={3}
        />
        <text
          transform={`translate(${iso(0, 1.4).x},${iso(0, 1.4).y - 86}) skewY(26.57)`}
          fontSize={9}
          fontWeight={800}
          fill={brand}
          letterSpacing={1}
        >
          CIRCULAR DE LA SEMANA
        </text>
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={iso(0, 1.4).x}
            y1={iso(0, 1.4).y - 76 + i * 9}
            x2={iso(0, 4.6).x}
            y2={iso(0, 4.6).y - 76 + i * 9}
            stroke={dark ? '#4b5563' : '#e5e7eb'}
            strokeWidth={2}
          />
        ))}
        {/* reloj */}
        <circle
          cx={iso(3, 0).x}
          cy={iso(3, 0).y - 80}
          r={10}
          fill="#fff"
          stroke="#9CA3AF"
          strokeWidth={2}
        />
        <line
          x1={iso(3, 0).x}
          y1={iso(3, 0).y - 80}
          x2={iso(3, 0).x}
          y2={iso(3, 0).y - 87}
          stroke="#111"
          strokeWidth={1.5}
        />
        <line
          x1={iso(3, 0).x}
          y1={iso(3, 0).y - 80}
          x2={iso(3, 0).x + 5}
          y2={iso(3, 0).y - 78}
          stroke="#111"
          strokeWidth={1.5}
        />

        {/* Piso */}
        {Array.from({ length: ROWS }).flatMap((_, y) =>
          Array.from({ length: COLS }).map((__, x) => {
            const a = iso(x, y),
              b = iso(x + 1, y),
              c = iso(x + 1, y + 1),
              d = iso(x, y + 1);
            return (
              <polygon
                key={`${x}-${y}`}
                points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`}
                fill={(x + y) % 2 ? floorA : floorB}
                stroke={dark ? '#1b1619' : '#F1E4EA'}
                strokeWidth={1}
              />
            );
          })
        )}
        {/* alfombra */}
        <polygon
          points={`${iso(1, 7.2).x},${iso(1, 7.2).y} ${iso(5.5, 7.2).x},${iso(5.5, 7.2).y} ${
            iso(5.5, 8.8).x
          },${iso(5.5, 8.8).y} ${iso(1, 8.8).x},${iso(1, 8.8).y}`}
          fill={alpha(brand, 0.18)}
        />

        {scene.map((it) => it.el)}
      </svg>

      {/* El patrón contesta: cuando alguno pregunta "¿vuelvo a trabajar?" o están de brazos cruzados. */}
      {asking && (
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          flexWrap="wrap"
          sx={{ px: 2, pt: 1.5 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Te preguntan, patrón:
          </Typography>
          <Chip
            color="primary"
            label={answering ? 'Arrancando…' : 'Sí, dale: revisen el circular 💪'}
            disabled={answering}
            onClick={() => void answer('go')}
          />
          <Chip
            variant="outlined"
            label="Descansen ☕"
            onClick={() => void answer('rest')}
          />
        </Stack>
      )}

      {/* Instrucciones para los robots, desde la oficina. */}
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        sx={{ px: 2, pt: 1, pb: 1.5 }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Dile algo a los robots: 'las bebidas son por unidad', 'ignora la página de cerveza', 'los 2/$5 no son $2.50'…"
          value={msg}
          onChange={(e) => setMsg(e.target.value.slice(0, 300))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void send();
            }
          }}
          disabled={sending}
        />
        <IconButton
          color="primary"
          aria-label="Enviar instrucción"
          disabled={!msg.trim() || sending}
          onClick={() => void send()}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 2, pb: 1.5, mt: -1 }}
      >
        Queda guardado como lección de la tienda y los agentes lo leen en la próxima lectura. Se ve
        y se borra en "Cómo funciona esta tienda".
      </Typography>

      {/* Quién es quién */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1,
        }}
      >
        {keys.map((k) => {
          const st = statusOf(k);
          return (
            <Stack
              key={k}
              direction="row"
              gap={1}
              alignItems="flex-start"
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: st === 'running' ? alpha(brand, 0.08) : 'transparent',
              }}
            >
              <svg
                width={30}
                height={46}
                viewBox="-16 -62 32 66"
                aria-hidden
              >
                <Character
                  k={k}
                  walking={false}
                  typing={false}
                  flip={false}
                  status={st}
                />
              </svg>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  lineHeight={1.2}
                >
                  {agents[k].name}{' '}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      textTransform: 'none',
                      letterSpacing: 0,
                      color:
                        st === 'error'
                          ? 'error.main'
                          : st === 'done'
                            ? 'success.main'
                            : st === 'running'
                              ? 'primary.main'
                              : 'text.secondary',
                    }}
                  >
                    ·{' '}
                    {st === 'running'
                      ? 'trabajando'
                      : st === 'done'
                        ? 'listo'
                        : st === 'error'
                          ? 'falló'
                          : 'esperando'}
                  </Typography>
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    textTransform: 'none',
                    letterSpacing: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {agents[k].role}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}
