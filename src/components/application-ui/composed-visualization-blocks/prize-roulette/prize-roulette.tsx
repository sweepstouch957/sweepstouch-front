'use client';

import { useParticipantsSamplePhones } from '@/hooks/fetching/sweepstakes/useSweepstakesExtras';
import { useConfetti } from '@/hooks/use-confetti';
import { alpha, Box, Button, Card, Stack, Typography, useTheme, Avatar } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { useEffect, useMemo, useRef, useState } from 'react';
import { WheelSvg } from './wheel';

/* ===================== Types ===================== */
export interface ParticipantPhoneSample {
  phoneNumber: string;
  storeName: string;
  storeImage?: string;
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
  return `(${rand3()}) \u2022\u2022\u2022-\u2022\u2022\u2022\u2022`;
}

const INITIAL_PHONE = 'LISTO PARA JUGAR';
const INITIAL_STORE = 'Esperando sorteo...';

/* ===================== Component ===================== */
export default function PrizeRouletteCard({ sweepstakeId }: Props) {
  const theme = useTheme();
  const { canvasRef, burst } = useConfetti();

  const {
    data: samples = [],
    isLoading,
    isError,
  } = useParticipantsSamplePhones({ sweepstakeId }) as {
    data?: ParticipantPhoneSample[];
    isLoading: boolean;
    isError: boolean;
  };

  const base = useMemo(() => {
    return (samples ?? [])
      .filter((x): x is ParticipantPhoneSample => Boolean(x?.phoneNumber))
      .map((x) => ({
        phoneNumber: formatPhone(x.phoneNumber),
        storeName: (x.storeName || '').trim() || '—',
        storeImage: x.storeImage,
      }));
  }, [samples]);

  const realList = useMemo(() => {
    const unique = new Map<string, { phoneNumber: string; storeName: string; storeImage?: string }>();
    for (const s of base) {
      const phoneNumber = (s.phoneNumber || '').trim();
      const storeName = (s.storeName || '').trim() || '—';
      if (!phoneNumber) continue;
      const k = `${phoneNumber}-${storeName}`;
      if (!unique.has(k)) unique.set(k, { phoneNumber, storeName, storeImage: s.storeImage });
    }
    return Array.from(unique.values());
  }, [base]);

  const fillerList = useMemo(() => {
    if (realList.length >= 14) return [];
    const fillCount = 18 - realList.length;
    const storeNames = ['Fresh Market Express', 'Super Mega Center', 'Premium Grocery Store', 'Local City Shop', 'Discount Retail Shop', 'Global Supermarket'];
    return Array.from({ length: Math.max(0, fillCount) }).map(() => ({
      phoneNumber: randomUSPhone(),
      storeName: storeNames[Math.floor(Math.random() * storeNames.length)],
      storeImage: undefined,
    }));
  }, [realList]);

  const spinList = useMemo(() => [...realList, ...fillerList], [realList, fillerList]);

  const [displayPhone, setDisplayPhone] = useState<string>(INITIAL_PHONE);
  const [displayStore, setDisplayStore] = useState<string>(INITIAL_STORE);
  const [displayImage, setDisplayImage] = useState<string | undefined>(undefined);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasWinner, setHasWinner] = useState(false);

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
  }, []);

  const handleToggleSpin = () => {
    if (!isSpinning) {
      start();
    } else {
      stop();
    }
  };

  const start = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setHasWinner(false);

    stoppingRef.current = false;
    stopAtRef.current = null;
    velRef.current = 1000 + Math.random() * 500;
    lastTickRef.current = null;

    if (phoneTimerRef.current) window.clearInterval(phoneTimerRef.current);

    let i = 0;
    let dynamicInterval = 70;

    const cyclePhoneText = () => {
      const pick = spinList[Math.floor(Math.random() * spinList.length)] ?? {
        phoneNumber: randomUSPhone(),
        storeName: 'Buscando...',
        storeImage: undefined,
      };
      
      setDisplayPhone(pick.phoneNumber);
      setDisplayStore(pick.storeName || '—');
      setDisplayImage(pick.storeImage);

      if (stoppingRef.current && velRef.current < 300) {
        dynamicInterval = Math.min(400, 20000 / Math.max(velRef.current, 10));
      } else {
        dynamicInterval = 70;
      }
      
      if (isSpinning) {
         phoneTimerRef.current = window.setTimeout(cyclePhoneText, dynamicInterval);
      }
    };
    
    phoneTimerRef.current = window.setTimeout(cyclePhoneText, dynamicInterval);

    const tick = () => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));

      let friction = 0.99;
      if (stoppingRef.current) {
        const elapsed = stopAtRef.current ? performance.now() - stopAtRef.current : 0;
        if (elapsed < 1000) friction = 0.985;
        else friction = 0.96;
      }

      velRef.current *= Math.pow(friction, dt * 60);

      if (!stoppingRef.current) {
        velRef.current = Math.max(700, Math.min(2000, velRef.current));
      }

      rotationRef.current = (rotationRef.current + velRef.current * dt) % 360;
      if (wheelWrapRef.current) {
        wheelWrapRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }

      if (stoppingRef.current && velRef.current < 2) {
        cleanupTimers();
        setIsSpinning(false);
        setHasWinner(true);
        stoppingRef.current = false;
        stopAtRef.current = null;
        lastTickRef.current = null;
        if (wheelWrapRef.current) wheelWrapRef.current.style.transform = `rotate(${rotationRef.current}deg)`;

        const pick =
          realList.length > 0
            ? realList[Math.floor(Math.random() * realList.length)]
            : spinList[Math.floor(Math.random() * spinList.length)] ?? {
                phoneNumber: randomUSPhone(),
                storeName: '—',
                storeImage: undefined,
              };

        setDisplayPhone(pick.phoneNumber);
        setDisplayStore(pick.storeName || '—');
        setDisplayImage(pick.storeImage);
        burst();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!isSpinning || stoppingRef.current) return;
    stoppingRef.current = true;
    if (stopAtRef.current === null) stopAtRef.current = performance.now();
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.4s ease',
      }}
    >
      {/* Background Subtle Gradient for Premium Feel */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: isDark ? 0.05 : 0.4, pointerEvents: 'none' }}>
         <Box sx={{
           position: 'absolute',
           top: '-50%', left: '-20%', right: '-20%', height: '100%',
           background: hasWinner 
            ? `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.4)} 0%, transparent 70%)`
            : (isSpinning ? `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 70%)` : 'transparent'),
           transition: 'background 1s ease',
         }} />
      </Box>

      {/* Confetti layer */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </Box>

      <Stack spacing={2.5} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
        
        {/* PREMIUM DISPLAY BOX */}
        <Box
          sx={{
            borderRadius: 4,
            width: '100%',
            maxWidth: 800,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Header Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 0.75,
              borderRadius: 20,
              background: hasWinner ? alpha(theme.palette.warning.main, 0.15) : alpha(theme.palette.primary.main, 0.1),
              color: hasWinner ? theme.palette.warning.dark : theme.palette.primary.main,
              mb: 2,
            }}
          >
            {hasWinner ? <EmojiEventsRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
            <Typography sx={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {hasWinner ? '¡Tenemos un Ganador!' : (isSpinning ? (stoppingRef.current ? 'Deteniéndose...' : 'Sorteo en curso') : 'Escoger Ganador')}
            </Typography>
          </Box>

          {/* Phone Number */}
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
              lineHeight: 1,
              color: hasWinner ? theme.palette.warning.main : theme.palette.text.primary,
              letterSpacing: hasWinner || isSpinning ? 3 : 0,
              fontVariantNumeric: 'tabular-nums',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              mb: 2,
              textShadow: hasWinner ? `0 4px 20px ${alpha(theme.palette.warning.main, 0.4)}` : 'none'
            }}
          >
            {displayPhone}
          </Typography>

          {/* Store Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.5,
              borderRadius: 3,
              background: alpha(theme.palette.text.primary, 0.04),
              border: `1px solid ${theme.palette.divider}`,
              minWidth: 220,
              justifyContent: 'center'
            }}
          >
            <Avatar 
              src={displayImage} 
              variant="rounded" 
              sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
            >
              {!displayImage && <StorefrontIcon fontSize="small" />}
            </Avatar>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: theme.palette.text.secondary }}>
              {displayStore}
            </Typography>
          </Box>
        </Box>

        {/* Action Button */}
        <Button
          onClick={handleToggleSpin}
          disabled={isLoading}
          startIcon={isSpinning ? <StopRoundedIcon fontSize="medium" /> : <PlayArrowRoundedIcon fontSize="medium" />}
          sx={{
            py: 1,
            px: 4,
            borderRadius: 20,
            fontWeight: 800,
            fontSize: '1rem',
            textTransform: 'none',
            color: '#FFFFFF',
            background: isSpinning 
              ? theme.palette.error.main 
              : theme.palette.primary.main,
            boxShadow: isSpinning 
              ? `0 10px 30px ${alpha(theme.palette.error.main, 0.4)}` 
              : `0 10px 30px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              background: isSpinning ? theme.palette.error.dark : theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: isSpinning 
                ? `0 14px 40px ${alpha(theme.palette.error.main, 0.5)}` 
                : `0 14px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            transition: 'all 0.2s ease',
            transform: isSpinning && !stoppingRef.current ? 'scale(1.02)' : 'none'
          }}
        >
          {isSpinning ? (stoppingRef.current ? 'Procesando...' : 'Detener Sorteo') : (hasWinner ? 'Sortear de Nuevo' : 'Iniciar Sorteo')}
        </Button>

        {/* Minimal Physical Wheel Visualization */}
        <Box
          sx={{
            width: { xs: 140, sm: 160 },
            height: { xs: 140, sm: 160 },
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 1,
            opacity: hasWinner ? 1 : (isSpinning ? 0.9 : 0.5),
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none'
          }}
        >
          {/* Pointer */}
          <Box sx={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
            width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', 
            borderTop: `18px solid ${hasWinner ? theme.palette.warning.main : theme.palette.primary.main}`,
            filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.15))',
            transition: 'border-top-color 0.4s ease'
          }} />
          
          <Box sx={{
            p: 1.5, borderRadius: '50%',
            background: theme.palette.background.paper,
            border: `2px solid ${alpha(hasWinner ? theme.palette.warning.main : theme.palette.primary.main, 0.2)}`,
            boxShadow: isSpinning ? `0 0 30px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
            transition: 'all 0.4s ease'
          }}>
            <Box
              ref={wheelWrapRef}
              sx={{
                width: { xs: 110, sm: 130 }, height: { xs: 110, sm: 130 },
                willChange: 'transform', transform: `rotate(${rotationRef.current}deg)`,
              }}
            >
              <WheelSvg rotationDeg={0} size={150} />
            </Box>
          </Box>
        </Box>
      </Stack>
    </Card>
  );
}
