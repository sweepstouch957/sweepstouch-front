'use client';

/**
 * La oficina de los robots: una sala isométrica (CSS 3D, sin librerías) con un escritorio por
 * agente. El que trabaja se levanta y habla; los demás esperan, celebran o se quejan según la
 * bitácora real del circular (`/circulars/:id/pipeline`). Los diálogos salen de los mensajes
 * que cada robot deja en la bitácora, con un pase de mano al siguiente.
 */
import type { Pipeline } from '@/services/circular.service';
import { alpha, Box, Chip, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

const ORDER = ['hermes', 'argos', 'mnemosine', 'hefesto', 'atenea', 'iris', 'temis'];
// Mismo equipo que circular-service/utils/agents.js: la oficina se ve aunque no haya circular.
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
// Posición de cada escritorio en la sala (en % del piso): dos filas, Temis al fondo decidiendo.
const DESK: Record<string, { x: number; y: number }> = {
  hermes: { x: 10, y: 18 },
  argos: { x: 40, y: 18 },
  mnemosine: { x: 70, y: 18 },
  hefesto: { x: 10, y: 62 },
  atenea: { x: 40, y: 62 },
  iris: { x: 70, y: 62 },
  temis: { x: 85, y: 40 },
};
const ROOM_TILT = 'rotateX(56deg) rotateZ(-38deg)';
const BILLBOARD = 'rotateZ(38deg) rotateX(-56deg)';

type Status = 'waiting' | 'running' | 'done' | 'error';
const IDLE = [
  '☕ Esperando el próximo circular…',
  '🧘 Sin pendientes por acá.',
  '📋 Todo al día.',
  '🎧 En pausa hasta que haya trabajo.',
];

/** Qué dice cada uno según su estado, con pase de mano al que sigue. */
function line(
  agentKey: string,
  s: { status: Status; message?: string } | undefined,
  data: Pipeline,
  i: number
) {
  const name = (k: string) => data.agents[k]?.name || k;
  const next = ORDER[ORDER.indexOf(agentKey) + 1];
  const prev = ORDER[ORDER.indexOf(agentKey) - 1];
  if (!s) {
    if (data.running)
      return prev ? `Esperando a que ${name(prev)} termine…` : 'Listo para arrancar.';
    return IDLE[i % IDLE.length];
  }
  if (s.status === 'running') return s.message ? `${s.message}` : 'Trabajando…';
  if (s.status === 'error') return `😓 Me trabé: ${s.message || 'error'}`;
  if (s.status === 'done') {
    const base = s.message || 'Listo por mi parte.';
    const nxt = next ? data.steps.find((x) => x.agent === next) : null;
    return nxt?.status === 'running' ? `${base} ¡${name(next)}, te toca!` : `✅ ${base}`;
  }
  return 'Esperando…';
}

export default function AgentOffice({
  data,
  loading,
}: {
  data?: Pipeline | null;
  loading?: boolean;
}) {
  const t = useTheme();
  const dark = t.palette.mode === 'dark';
  // Turno para hablar: los que trabajan hablan siempre; los demás se van turnando cada 4 s.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const agents = data?.agents && Object.keys(data.agents).length ? data.agents : TEAM;
  const byAgent = new Map((data?.steps || []).map((s) => [s.agent, s]));
  const keys = ORDER.filter((k) => agents[k]);
  const talking = new Set<string>();
  keys.forEach((k) => {
    if (byAgent.get(k)?.status === 'running' || byAgent.get(k)?.status === 'error') talking.add(k);
  });
  if (talking.size < 2) talking.add(keys[tick % keys.length]);
  // Sin bitácora igual charlan (frases de oficina vacía), así la sala nunca está muerta.
  const pipe: Pipeline = data || { ok: true, agents, steps: [], running: false, accuracy: null };

  const floor = dark ? alpha('#fff', 0.06) : '#F6F1F4';
  const tile = dark ? alpha('#fff', 0.08) : alpha('#E8127F', 0.08);
  const wall = dark ? alpha('#fff', 0.1) : '#FBE7F1';
  const brand = t.palette.primary.main;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: dark ? alpha('#fff', 0.03) : alpha(brand, 0.03),
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <style>{`
        @keyframes officeBob{0%,100%{transform:${BILLBOARD} translateZ(70px) translateY(0)}50%{transform:${BILLBOARD} translateZ(70px) translateY(-7px)}}
        @keyframes officePop{from{opacity:0;transform:${BILLBOARD} translateZ(120px) scale(.85)}to{opacity:1;transform:${BILLBOARD} translateZ(120px) scale(1)}}
        @keyframes officeType{0%,80%,100%{opacity:.25}40%{opacity:1}}
        @media (prefers-reduced-motion: reduce){.office-av{animation:none !important}}
      `}</style>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
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

      {/* Cámara */}
      <Box
        sx={{
          perspective: 1500,
          perspectiveOrigin: '50% 30%',
          height: { xs: 340, sm: 420, md: 470 },
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: 420, sm: 560, md: 680 },
            height: { xs: 250, sm: 330, md: 400 },
            transformStyle: 'preserve-3d',
            transform: ROOM_TILT,
            transformOrigin: '50% 50%',
            mt: { xs: 6, md: 4 },
          }}
        >
          {/* Piso */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 2,
              bgcolor: floor,
              border: '1px solid',
              borderColor: 'divider',
              backgroundImage: `linear-gradient(${tile} 1px, transparent 1px), linear-gradient(90deg, ${tile} 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              boxShadow: `0 40px 60px -20px ${alpha('#000', dark ? 0.6 : 0.25)}`,
            }}
          />
          {/* Paredes */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: 110,
              bgcolor: wall,
              transformOrigin: 'top',
              transform: 'rotateX(-90deg)',
              borderBottom: '2px solid',
              borderColor: 'divider',
              opacity: 0.9,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: '8%',
                top: 18,
                width: '28%',
                height: 60,
                borderRadius: 1,
                bgcolor: dark ? alpha('#fff', 0.08) : '#fff',
                border: '1px solid',
                borderColor: 'divider',
                display: 'grid',
                placeItems: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: 'text.secondary',
                letterSpacing: '.08em',
              }}
            >
              PIZARRA · CIRCULAR DE LA SEMANA
            </Box>
            <Box
              sx={{
                position: 'absolute',
                right: '8%',
                top: 14,
                width: 70,
                height: 70,
                borderRadius: '50%',
                border: '3px solid',
                borderColor: 'divider',
                bgcolor: dark ? alpha('#fff', 0.08) : '#fff',
              }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: 110,
              bgcolor: wall,
              transformOrigin: 'left',
              transform: 'rotateY(90deg)',
              borderRight: '2px solid',
              borderColor: 'divider',
              opacity: 0.8,
            }}
          />

          {/* Escritorios + robots */}
          {keys.map((k, i) => {
            const a = agents[k];
            const s = byAgent.get(k) as { status: Status; message?: string } | undefined;
            const st: Status = s?.status || 'waiting';
            const p = DESK[k] || { x: 50, y: 50 };
            const active = st === 'running';
            const speaks = talking.has(k);
            const ring =
              st === 'error'
                ? t.palette.error.main
                : st === 'done'
                  ? t.palette.success.main
                  : active
                    ? brand
                    : t.palette.divider;
            return (
              <Box
                key={k}
                sx={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: 96,
                  height: 60,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Mesa */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 1.5,
                    bgcolor: dark ? '#3a2f36' : '#fff',
                    border: '1px solid',
                    borderColor: 'divider',
                    transform: 'translateZ(26px)',
                    boxShadow: `0 26px 0 -2px ${alpha('#000', dark ? 0.5 : 0.12)}`,
                  }}
                >
                  {/* Monitor */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: 4,
                      width: 36,
                      height: 22,
                      borderRadius: 0.5,
                      bgcolor: active ? brand : dark ? '#111' : '#2b2b31',
                      transformOrigin: 'bottom',
                      transform: 'rotateX(-80deg)',
                      boxShadow: active ? `0 0 18px ${alpha(brand, 0.6)}` : 'none',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 8,
                      bottom: 6,
                      width: 10,
                      height: 12,
                      borderRadius: '2px 2px 4px 4px',
                      bgcolor: alpha(brand, 0.5),
                    }}
                  />
                </Box>
                {/* Avatar (siempre mira a cámara) */}
                <Box
                  className="office-av"
                  sx={{
                    position: 'absolute',
                    left: 28,
                    top: -34,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 24,
                    bgcolor: dark ? '#26202a' : '#fff',
                    border: '3px solid',
                    borderColor: ring,
                    boxShadow: active
                      ? `0 0 0 6px ${alpha(brand, 0.18)}, 0 10px 20px ${alpha('#000', 0.25)}`
                      : `0 8px 14px ${alpha('#000', 0.18)}`,
                    transform: `${BILLBOARD} translateZ(70px)`,
                    animation: active ? 'officeBob 1.1s ease-in-out infinite' : 'none',
                    opacity: !s && data?.running ? 0.55 : 1,
                    filter: !s && data?.running ? 'grayscale(.6)' : 'none',
                  }}
                >
                  {a.emoji}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 44,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'text.primary',
                      bgcolor: dark ? alpha('#000', 0.5) : alpha('#fff', 0.85),
                      px: 0.75,
                      borderRadius: 1,
                    }}
                  >
                    {a.name}
                  </Box>
                </Box>
                {/* Globo de diálogo */}
                {speaks && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -40,
                      top: -118,
                      width: 176,
                      p: 1,
                      borderRadius: 2,
                      fontSize: 11.5,
                      lineHeight: 1.3,
                      bgcolor:
                        st === 'error'
                          ? alpha(t.palette.error.main, dark ? 0.35 : 0.1)
                          : dark
                            ? '#2b2530'
                            : '#fff',
                      color: 'text.primary',
                      border: '1px solid',
                      borderColor: st === 'error' ? 'error.main' : active ? brand : 'divider',
                      boxShadow: `0 10px 24px ${alpha('#000', 0.2)}`,
                      transform: `${BILLBOARD} translateZ(120px)`,
                      animation: 'officePop .25s ease both',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        left: 78,
                        bottom: -7,
                        width: 12,
                        height: 12,
                        bgcolor: 'inherit',
                        borderRight: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'inherit',
                        transform: 'rotate(45deg)',
                      },
                    }}
                  >
                    {line(k, s, pipe, i + tick)}
                    {active && (
                      <Box
                        component="span"
                        sx={{
                          ml: 0.5,
                          '& i': {
                            display: 'inline-block',
                            width: 4,
                            height: 4,
                            mx: '1px',
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                            animation: 'officeType 1.2s infinite',
                          },
                          '& i:nth-of-type(2)': { animationDelay: '.2s' },
                          '& i:nth-of-type(3)': { animationDelay: '.4s' },
                        }}
                      >
                        <i />
                        <i />
                        <i />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Quién es quién: para no tener que preguntar. */}
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
          const s = byAgent.get(k);
          const st = s?.status || 'waiting';
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
              <Box sx={{ fontSize: 18, lineHeight: 1 }}>{agents[k].emoji}</Box>
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
