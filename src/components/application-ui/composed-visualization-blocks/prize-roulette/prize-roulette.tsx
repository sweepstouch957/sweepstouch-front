'use client';

import { useParticipantsSamplePhones } from '@/hooks/fetching/sweepstakes/useSweepstakesExtras';
import { alpha, Box, Button, Card, Stack, Typography, useTheme } from '@mui/material';
import  { useEffect, useMemo, useRef, useState } from 'react';

/* ===================== Types ===================== */
export interface ParticipantPhoneSample {
  phone: string;
  createdAt?: string;
  storeId?: string;
  storeName?: string; // ✅ nombre tienda correcto
}

type Props = {
  sweepstakeId: string;
};

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  va: number;
  life: number;
  color: string;
};

/* ===================== Helpers ===================== */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function randomUSPhone(): string {
  const rand3 = () => Math.floor(100 + Math.random() * 900).toString();
  const rand4 = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `(${rand3()}) ${rand3()}-${rand4()}`;
}

// ✅ Estado inicial “000”
const INITIAL_PHONE = '(000) 000-0000';
const INITIAL_STORE = '—';

/* ===================== Wheel SVG ===================== */
function WheelSvg({ rotationDeg, size = 340 }: { rotationDeg: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.floor(size * 0.46);
  const segments = 8;

  const colors = [
    '#E11D48',
    '#2563EB',
    '#F59E0B',
    '#10B981',
    '#7C3AED',
    '#DB2777',
    '#06B6D4',
    '#EAB308',
  ];

  const paths = Array.from({ length: segments }).map((_, i) => {
    const a0 = (i * 2 * Math.PI) / segments - Math.PI / 2;
    const a1 = ((i + 1) * 2 * Math.PI) / segments - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const largeArc = a1 - a0 > Math.PI ? 1 : 0;
    const d = [
      `M ${cx} ${cy}`,
      `L ${x0} ${y0}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`,
      'Z',
    ].join(' ');
    return { d, fill: colors[i % colors.length] };
  });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: `rotate(${rotationDeg}deg)`,
        transition: 'none',
        willChange: 'transform',
        filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.15))',
      }}
    >
      <defs>
        <radialGradient
          id="goldRim"
          cx="30%"
          cy="30%"
          r="80%"
        >
          <stop
            offset="0%"
            stopColor="#FFF2B0"
          />
          <stop
            offset="35%"
            stopColor="#FFD36B"
          />
          <stop
            offset="70%"
            stopColor="#E2A83B"
          />
          <stop
            offset="100%"
            stopColor="#8C5A12"
          />
        </radialGradient>
        <linearGradient
          id="goldShine"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#FFF8D6"
            stopOpacity="0.95"
          />
          <stop
            offset="40%"
            stopColor="#FFD36B"
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor="#8C5A12"
            stopOpacity="0.35"
          />
        </linearGradient>
      </defs>

      {paths.map((p, idx) => (
        <path
          key={idx}
          d={p.d}
          fill={p.fill}
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={r + 6}
        fill="none"
        stroke="url(#goldRim)"
        strokeWidth={10}
        opacity={0.98}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r + 1}
        fill="none"
        stroke="url(#goldShine)"
        strokeWidth={3}
        opacity={0.9}
      />

      <circle
        cx={cx}
        cy={cy}
        r={36}
        fill="white"
        opacity={0.95}
      />
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill="#111827"
        opacity={0.15}
      />
    </svg>
  );
}

/* ===================== Confetti ===================== */
function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  const burst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
    canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const colors = ['#FF4D6D', '#4D96FF', '#FFD166', '#06D6A0', '#9B5DE5'];
    const count = 120;
    const startX = rect.width * 0.5;
    const startY = rect.height * 0.25;

    const parts: ConfettiParticle[] = [];
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 4 + Math.random() * 7;
      parts.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 4,
        a: Math.random() * Math.PI,
        va: (Math.random() - 0.5) * 0.35,
        life: 70 + Math.random() * 40,
        color: colors[i % colors.length],
      });
    }
    particlesRef.current = parts;

    const tick = () => {
      const c = canvasRef.current;
      if (!c) return;
      const cctx = c.getContext('2d');
      if (!cctx) return;

      const w = rect.width;
      const h = rect.height;
      cctx.clearRect(0, 0, w, h);

      const next: ConfettiParticle[] = [];
      for (const p of particlesRef.current) {
        const np = { ...p };
        np.x += np.vx;
        np.y += np.vy;
        np.vy += 0.18;
        np.vx *= 0.995;
        np.a += np.va;
        np.life -= 1;

        if (np.life > 0 && np.y < h + 40) {
          next.push(np);
          cctx.save();
          cctx.translate(np.x, np.y);
          cctx.rotate(np.a);
          cctx.fillStyle = np.color;
          cctx.globalAlpha = Math.min(1, np.life / 40);
          cctx.fillRect(-np.r, -np.r * 0.6, np.r * 2, np.r * 1.2);
          cctx.restore();
        }
      }
      particlesRef.current = next;
      if (next.length > 0) rafRef.current = requestAnimationFrame(tick);
      else {
        cctx.clearRect(0, 0, w, h);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { canvasRef, burst };
}

/* ===================== Component ===================== */
export default function PrizeRouletteCard({ sweepstakeId }: Props) {
  const theme = useTheme();
  const { canvasRef, burst } = useConfetti();

  // ✅ Usa TU hook (sin storeId)
  const {
    data: samples = [],
    isLoading,
    isError,
  } = useParticipantsSamplePhones({
    sweepstakeId,
  }) as {
    data?: ParticipantPhoneSample[];
    isLoading: boolean;
    isError: boolean;
  };

  // ✅ normalizamos y garantizamos storeName
  const base = useMemo(() => {
    return (samples ?? [])
      .filter((x): x is ParticipantPhoneSample => Boolean(x?.phone))
      .map((x) => ({
        phone: formatPhone(x.phone),
        storeName: (x.storeName || '').trim() || '—',
        storeId: x.storeId,
        createdAt: x.createdAt,
      }));
  }, [samples]);

  // ✅ lista para girar (relleno si hay pocos)
  const spinList = useMemo(() => {
    const unique = new Map<string, ParticipantPhoneSample>();
    for (const s of base) {
      const k = `${s.phone}-${s.storeName}`;
      if (!unique.has(k)) unique.set(k, s);
    }
    const arr = Array.from(unique.values());

    if (arr.length >= 14) return arr;

    const fillCount = 18 - arr.length;
    const fillers: ParticipantPhoneSample[] = Array.from({ length: Math.max(0, fillCount) }).map(
      () => ({
        phone: randomUSPhone(),
        storeName: '—',
      })
    );

    return [...arr, ...fillers];
  }, [base]);

  const [displayPhone, setDisplayPhone] = useState<string>(INITIAL_PHONE);
  const [displayStore, setDisplayStore] = useState<string>(INITIAL_STORE);
  const [isSpinning, setIsSpinning] = useState(false);

  const rotationRef = useRef(0);
  const wheelWrapRef = useRef<HTMLDivElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const velRef = useRef(0);
  const stoppingRef = useRef(false);
  const stopAtRef = useRef<number | null>(null);
  const phoneTimerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const cleanupTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (phoneTimerRef.current) window.clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = null;
  };

  // ✅ al cargar data por primera vez, NO cambies el display (queda 000)
  // solo guardamos para usar cuando se gire
  // (si querés que ponga el primer número automático, te lo cambio)
  useEffect(() => {
    return () => cleanupTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    stoppingRef.current = false;
    stopAtRef.current = null;

    velRef.current = 950 + Math.random() * 650;
    lastTickRef.current = null;

    // ✅ ticker de números usando la lista real
    if (phoneTimerRef.current) window.clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = window.setInterval(() => {
      const idx = Math.floor(Math.random() * spinList.length);
      const pick = spinList[idx] ?? { phone: randomUSPhone(), storeName: '—' };
      setDisplayPhone(pick.phone);
      setDisplayStore(pick.storeName || '—');
    }, 85);

    const tick = () => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));

      let friction = 0.985;
      if (stoppingRef.current) {
        const elapsed = stopAtRef.current ? performance.now() - stopAtRef.current : 0;
        if (elapsed < 900) friction = 0.994;
        else if (elapsed < 2200) friction = 0.987;
        else friction = 0.978;
      }

      velRef.current *= Math.pow(friction, dt * 60);

      if (!stoppingRef.current) {
        velRef.current = Math.max(750, Math.min(1900, velRef.current));
      }

      rotationRef.current = (rotationRef.current + velRef.current * dt) % 360;
      if (wheelWrapRef.current) {
        wheelWrapRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }

      const stopElapsed = stopAtRef.current ? performance.now() - stopAtRef.current : 0;
      if (stoppingRef.current && stopElapsed > 1500 && velRef.current < 28) {
        cleanupTimers();
        setIsSpinning(false);
        stoppingRef.current = false;
        stopAtRef.current = null;
        lastTickRef.current = null;

        if (wheelWrapRef.current) {
          wheelWrapRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
        }

        const idx = Math.floor(Math.random() * spinList.length);
        const pick = spinList[idx] ?? { phone: randomUSPhone(), storeName: '—' };

        setDisplayPhone(pick.phone);
        setDisplayStore(pick.storeName || '—');

        burst();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!isSpinning) return;
    stoppingRef.current = true;
    if (stopAtRef.current === null) stopAtRef.current = performance.now();
  };

  return (
    <Card
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(
                theme.palette.background.default,
                0.92
              )} 100%)`
            : `linear-gradient(135deg, ${alpha('#FFFFFF', 1)} 0%, ${alpha('#F6F9FF', 1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
      }}
    >
      {/* Confetti layer */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      <Stack
        spacing={2.25}
        alignItems="center"
      >
        {/* Display */}
        <Box
          sx={{
            borderRadius: 3,
            px: { xs: 2, sm: 3 },
            py: { xs: 1.8, sm: 2.1 },
            width: '100%',
            maxWidth: 760,
            position: 'relative',
            overflow: 'hidden',
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha('#0B0F19', 0.94)} 0%, ${alpha(
                    '#111827',
                    0.92
                  )} 60%, ${alpha('#0F172A', 0.94)} 100%)`
                : `linear-gradient(135deg, ${alpha('#111827', 0.96)} 0%, ${alpha(
                    '#0F172A',
                    0.94
                  )} 65%, ${alpha('#111827', 0.96)} 100%)`,
            border: `1px solid ${alpha('#FFFFFF', 0.14)}`,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 18px 44px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 18px 44px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          {/* subtle sparkles */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(circle at 20% 20%, ${alpha('#FFFFFF', 0.1)} 0%, transparent 55%),
                radial-gradient(circle at 75% 85%, ${alpha('#FFD36B', 0.08)} 0%, transparent 60%)
              `,
            }}
          />

          {/* animated shine */}
          <Box
            sx={{
              position: 'absolute',
              top: -46,
              left: -90,
              width: 240,
              height: 170,
              transform: 'rotate(18deg)',
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0) 100%)',
              animation: isSpinning ? 'shineSweep 1.2s linear infinite' : 'none',
              opacity: theme.palette.mode === 'dark' ? 0.7 : 0.9,
            }}
          />

          <Stack
            spacing={0.6}
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Typography
              sx={{
                fontWeight: 950,
                letterSpacing: 2.6,
                textTransform: 'uppercase',
                fontSize: { xs: 15, sm: 16.5 },
                lineHeight: 1,
                opacity: 0.95,
                background:
                  'linear-gradient(180deg, rgba(255,245,210,1) 0%, rgba(255,211,107,1) 38%, rgba(226,168,59,1) 70%, rgba(140,90,18,1) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 10px 22px rgba(0,0,0,0.35)',
              }}
            >
              WINNER
            </Typography>

            <Typography
              variant="h2"
              sx={{
                letterSpacing: 1,
                fontWeight: 900,
                fontSize: { xs: '1.75rem', sm: '3.0rem', md: '3.8rem' },
                lineHeight: 1,
                color: '#FFE08A',
                textShadow:
                  '0 14px 32px rgba(0,0,0,0.75), 0 0 22px rgba(255, 216, 120, 0.45), 0 0 44px rgba(255, 216, 120, 0.18)',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              {displayPhone}
            </Typography>

            <Box
              sx={{
                mt: 0.2,
                px: 1.25,
                py: 0.55,
                borderRadius: 999,
                background: alpha('#FFFFFF', theme.palette.mode === 'dark' ? 0.08 : 0.1),
                border: `1px solid ${alpha('#FFFFFF', 0.14)}`,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 850,
                  fontSize: { xs: 12.5, sm: 13.5 },
                  color: alpha('#FFFFFF', 0.88),
                  maxWidth: 640,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={displayStore}
              >
                {displayStore}
              </Typography>
            </Box>

            {(isLoading || isError) && (
              <Typography
                sx={{ mt: 0.35, fontWeight: 700, fontSize: 12, color: alpha('#FFFFFF', 0.62) }}
              >
                {isLoading ? 'Cargando participantes…' : 'No se pudo cargar participantes'}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Controls */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ width: '100%', maxWidth: 560 }}
        >
          <Button
            variant="contained"
            onClick={start}
            disabled={isSpinning}
            sx={{
              flex: 1,
              py: 1.25,
              borderRadius: 2.75,
              fontWeight: 900,
              textTransform: 'none',
              color: '#FFFFFF',
              background:
                'linear-gradient(180deg, rgba(255,60,165,1) 0%, rgba(255,20,120,1) 45%, rgba(210,0,90,1) 100%)',
              boxShadow: '0 14px 28px rgba(0,0,0,0.35), 0 0 26px rgba(255, 30, 140, 0.35)',
              border: '1px solid rgba(255,255,255,0.22)',
              '&:hover': {
                background:
                  'linear-gradient(180deg, rgba(255,105,195,1) 0%, rgba(255,45,145,1) 45%, rgba(210,0,90,1) 100%)',
              },
              '&:disabled': { opacity: 0.6, color: 'rgba(255,255,255,0.75)' },
            }}
          >
            Start
          </Button>

          <Button
            variant="contained"
            onClick={stop}
            disabled={!isSpinning}
            sx={{
              flex: 1,
              py: 1.25,
              borderRadius: 2.75,
              fontWeight: 900,
              textTransform: 'none',
              color: '#FFFFFF',
              background:
                'linear-gradient(180deg, rgba(255,60,165,1) 0%, rgba(255,20,120,1) 45%, rgba(210,0,90,1) 100%)',
              boxShadow: '0 14px 28px rgba(0,0,0,0.35), 0 0 26px rgba(255, 30, 140, 0.35)',
              border: '1px solid rgba(255,255,255,0.22)',
              '&:hover': {
                background:
                  'linear-gradient(180deg, rgba(255,105,195,1) 0%, rgba(255,45,145,1) 45%, rgba(210,0,90,1) 100%)',
              },
              '&:disabled': { opacity: 0.6, color: 'rgba(255,255,255,0.75)' },
            }}
          >
            Stop
          </Button>
        </Stack>

        {/* Wheel */}
        <Box
          sx={{
            width: { xs: 290, sm: 340, md: 400 },
            height: { xs: 290, sm: 340, md: 400 },
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 1,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderBottom: `26px solid ${
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.85)
                  : alpha(theme.palette.common.black, 0.75)
              }`,
              filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.15))',
            }}
          />

          <Box
            sx={{
              p: 2,
              borderRadius: '999px',
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.06)
                  : alpha(theme.palette.common.black, 0.03),
              border: `1px solid ${alpha('#E2A83B', 0.35)}`,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 18px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255, 210, 90, 0.10)'
                  : '0 18px 40px rgba(226,168,59,0.18), inset 0 0 0 1px rgba(255, 210, 90, 0.14)',
            }}
          >
            <Box
              ref={wheelWrapRef}
              sx={{
                width: { xs: 250, sm: 300, md: 360 },
                height: { xs: 250, sm: 300, md: 360 },
                willChange: 'transform',
                transform: `rotate(${rotationRef.current}deg)`,
              }}
            >
              <WheelSvg
                rotationDeg={0}
                size={380}
              />
            </Box>
          </Box>
        </Box>
      </Stack>

      <style
        jsx
        global
      >{`
        @keyframes shineSweep {
          0% {
            transform: translateX(-60px) rotate(18deg);
            opacity: 0;
          }
          10% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.85;
          }
          90% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(430px) rotate(18deg);
            opacity: 0;
          }
        }
      `}</style>
    </Card>
  );
}
