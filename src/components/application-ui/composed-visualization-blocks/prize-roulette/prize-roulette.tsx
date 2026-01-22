'use client';

import { useParticipantsSamplePhones } from '@/hooks/fetching/sweepstakes/useSweepstakesExtras';
import { useConfetti } from '@/hooks/use-confetti';
import { alpha, Box, Button, Card, Stack, Typography, useTheme } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { WheelSvg } from './wheel';

/* ===================== Types ===================== */
export interface ParticipantPhoneSample {
  phoneNumber: string;
  storeName: string;
}

type Props = {
  sweepstakeId: string;
};

/* ===================== Helpers ===================== */
function formatPhone(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw ?? '';
}

function randomUSPhone(): string {  
  const rand3 = () => Math.floor(100 + Math.random() * 900).toString();
  const rand4 = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `(${rand3()}) ${rand3()}-${rand4()}`;
}

// ✅ Estado inicial “000”
const INITIAL_PHONE = '(000) 000-0000';
const INITIAL_STORE = '—';



/* ===================== Component ===================== */
export default function PrizeRouletteCard({ sweepstakeId }: Props) {
  const theme = useTheme();
  const { canvasRef, burst } = useConfetti();

  // ✅ Backend devuelve: [{ phoneNumber, storeName }]
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

  // ✅ Normalizamos (formato tel + storeName)
  const base = useMemo(() => {
    return (samples ?? [])
      .filter((x): x is ParticipantPhoneSample => Boolean(x?.phoneNumber))
      .map((x) => ({
        phoneNumber: formatPhone(x.phoneNumber),
        storeName: (x.storeName || '').trim() || '—',
      }));
  }, [samples]);

  // ✅ lista REAL (únicos) desde backend
  const realList = useMemo(() => {
    const unique = new Map<string, { phoneNumber: string; storeName: string }>();

    for (const s of base) {
      const phoneNumber = (s.phoneNumber || '').trim();
      const storeName = (s.storeName || '').trim() || '—';
      if (!phoneNumber) continue;

      const k = `${phoneNumber}-${storeName}`;
      if (!unique.has(k)) unique.set(k, { phoneNumber, storeName });
    }

    return Array.from(unique.values());
  }, [base]);

  // (Opcional) fillers SOLO para animación visual
  const fillerList = useMemo(() => {
    if (realList.length >= 14) return [];
    const fillCount = 18 - realList.length;

    return Array.from({ length: Math.max(0, fillCount) }).map(() => ({
      phoneNumber: randomUSPhone(),
      storeName: '—',
    }));
  }, [realList]);

  // Para la animación (NO para ganador final si hay reales)
  const spinList = useMemo(() => [...realList, ...fillerList], [realList, fillerList]);

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

    // ✅ ticker: si hay reales, SOLO muestra reales (si no, fallback)
    if (phoneTimerRef.current) window.clearInterval(phoneTimerRef.current);

    let i = 0;
    phoneTimerRef.current = window.setInterval(() => {
      if (realList.length > 0) {
        const pick = realList[i % realList.length];
        i += 1;
        setDisplayPhone(pick.phoneNumber);
        setDisplayStore(pick.storeName || '—');
        return;
      }

      const pick =
        spinList[Math.floor(Math.random() * spinList.length)] ??
        ({
          phoneNumber: randomUSPhone(),
          storeName: '—',
        } as const);

      setDisplayPhone(pick.phoneNumber);
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

        // ✅ GANADOR FINAL: SIEMPRE real si existe
        const pick =
          realList.length > 0
            ? realList[Math.floor(Math.random() * realList.length)]
            : spinList[Math.floor(Math.random() * spinList.length)] ?? {
                phoneNumber: randomUSPhone(),
                storeName: '—',
              };

        setDisplayPhone(pick.phoneNumber);
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

            {!isLoading && !isError && realList.length === 0 && (
              <Typography
                sx={{ mt: 0.35, fontWeight: 700, fontSize: 12, color: alpha('#FFFFFF', 0.62) }}
              >
                Sin participantes reales aún (mostrando números demo)
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
