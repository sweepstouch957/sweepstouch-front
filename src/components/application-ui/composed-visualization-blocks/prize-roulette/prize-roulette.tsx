'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  alpha,
  Box,
  Button,
  Card,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';

type Props = {
  /** Optional: list of phone numbers to cycle through while spinning. */
  phoneNumbers?: string[];
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

function formatPhone(raw: string): string {
  // Keep it simple: accept (###) ###-####, ##########, or already formatted.
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

function WheelSvg({
  rotationDeg,
  size = 340,
}: {
  rotationDeg: number;
  size?: number;
}) {
  // 8 segments, vivid palette, no text.
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.floor(size * 0.46);
  const segments = 8;
  const colors = [
    '#E11D48', // deep rose
    '#2563EB', // strong blue
    '#F59E0B', // amber
    '#10B981', // emerald
    '#7C3AED', // violet
    '#DB2777', // fuchsia
    '#06B6D4', // cyan
    '#EAB308', // yellow
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
        // We animate rotation via requestAnimationFrame; disable transitions to avoid jitter.
        transition: 'none',
        willChange: 'transform',
        filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.15))',
      }}
    >
      <defs>
        {/* Gold rim gradients */}
        <radialGradient id="goldRim" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFF2B0" />
          <stop offset="35%" stopColor="#FFD36B" />
          <stop offset="70%" stopColor="#E2A83B" />
          <stop offset="100%" stopColor="#8C5A12" />
        </radialGradient>
        <linearGradient id="goldShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF8D6" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#FFD36B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8C5A12" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {paths.map((p, idx) => (
        <path
          key={idx}
          d={p.d}
          fill={p.fill}
        />
      ))}

      {/* Golden rim */}
      <circle
        cx={cx}
        cy={cy}
        r={r + 6}
        fill="none"
        stroke="url(#goldRim)"
        strokeWidth={10}
        opacity={0.98}
      />
      {/* Subtle shine ring */}
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
      const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 1.4;
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
        np.vy += 0.18; // gravity
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
      if (next.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
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

export default function PrizeRouletteCard({ phoneNumbers }: Props) {
  const theme = useTheme();
  const { canvasRef, burst } = useConfetti();

  const phones = useMemo(() => {
    const base = (phoneNumbers && phoneNumbers.length ? phoneNumbers : []).map(formatPhone);
    if (base.length >= 10) return base;
    const fill = Array.from({ length: 18 }).map(() => randomUSPhone());
    return [...base, ...fill];
  }, [phoneNumbers]);

  const [displayPhone, setDisplayPhone] = useState<string>(() => phones[0] ?? randomUSPhone());
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationRef = useRef(0);
  const wheelWrapRef = useRef<HTMLDivElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const velRef = useRef(0);
  const stoppingRef = useRef(false);
  const stopAtRef = useRef<number | null>(null);
  const phoneTimerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const stopInternal = () => {
    stoppingRef.current = true;
    if (stopAtRef.current === null) stopAtRef.current = performance.now();
  };

  const cleanupTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (phoneTimerRef.current) window.clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = null;
  };

  const start = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    stoppingRef.current = false;
    stopAtRef.current = null;
    // degrees per second (time-based for smoother animation across devices)
    // Slightly lower base speed so the rotation feels smoother (less harsh).
    velRef.current = 950 + Math.random() * 650;
    lastTickRef.current = null;

    // phone ticker
    if (phoneTimerRef.current) window.clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = window.setInterval(() => {
      const idx = Math.floor(Math.random() * phones.length);
      setDisplayPhone(phones[idx] ?? randomUSPhone());
    }, 90);

    const tick = () => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));

      // When stopping, decelerate slowly for a more "casino" feel.
      let friction = 0.985;
      if (stoppingRef.current) {
        const elapsed = stopAtRef.current ? performance.now() - stopAtRef.current : 0;
        // Two-phase stop: first coast (very light friction), then gradually slow down.
        // Coast longer first, then slow down noticeably, then crawl to a stop.
        if (elapsed < 900) friction = 0.994;
        else if (elapsed < 2200) friction = 0.987;
        else friction = 0.978;
      }
      // Convert per-frame friction (at ~60fps) to time-based friction.
      velRef.current *= Math.pow(friction, dt * 60);
      // Keep it lively while spinning.
      if (!stoppingRef.current) {
        velRef.current = Math.max(750, Math.min(1900, velRef.current));
      }

      rotationRef.current = (rotationRef.current + velRef.current * dt) % 360;
      if (wheelWrapRef.current) {
        // Imperative style update keeps the motion silky-smooth (no React re-render every frame).
        wheelWrapRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }

      // stop condition
      // Stop gently (lower threshold so it coasts longer).
      const stopElapsed = stopAtRef.current ? performance.now() - stopAtRef.current : 0;
      // Stop once we're crawling.
      if (stoppingRef.current && stopElapsed > 1500 && velRef.current < 28) {
        cleanupTimers();
        setIsSpinning(false);
        stoppingRef.current = false;
        stopAtRef.current = null;
        lastTickRef.current = null;
        // Ensure final rotation is applied.
        if (wheelWrapRef.current) {
          wheelWrapRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
        }
        // settle on a final phone
        const idx = Math.floor(Math.random() * phones.length);
        setDisplayPhone(phones[idx] ?? randomUSPhone());
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
    stopInternal();
    // Keep numbers cycling until the wheel fully stops.
  };

  useEffect(() => {
    return () => cleanupTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                theme.palette.background.default,
                0.9,
              )} 100%)`
            : `linear-gradient(135deg, ${alpha('#FFFFFF', 1)} 0%, ${alpha('#F8FAFF', 1)} 100%)`,
      }}
    >
      <Box
        ref={undefined}
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

	      <Stack spacing={2.25} alignItems="center">
	        {/* Display */}
	        <Box
	          sx={{
              borderRadius: 2.5,
              px: 2,
              py: 1.5,
              // Dark/metallic "winner display" look (number stays gold)
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha('#0B0F19', 0.92)} 0%, ${alpha(
                      '#111827',
                      0.9,
                    )} 45%, ${alpha('#0F172A', 0.92)} 100%)`
                  : `linear-gradient(135deg, ${alpha('#1F2937', 0.94)} 0%, ${alpha(
                      '#0F172A',
                      0.92,
                    )} 55%, ${alpha('#111827', 0.92)} 100%)`,
              border: `1px solid ${alpha('#FFFFFF', 0.14)}`,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : '0 16px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
		          display: 'flex',
		          alignItems: 'center',
		          justifyContent: 'center',
	              minHeight: { xs: 78, sm: 92 },
	              position: 'relative',
	              overflow: 'hidden',
	              width: '100%',
	              maxWidth: 720,
	            }}
	        >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  theme.palette.mode === 'dark'
                    ? `radial-gradient(circle at 25% 30%, ${alpha('#FFFFFF', 0.10)} 0%, transparent 55%),
                       radial-gradient(circle at 70% 80%, ${alpha('#9CA3AF', 0.10)} 0%, transparent 60%)`
                    : `radial-gradient(circle at 25% 30%, ${alpha('#FFFFFF', 0.12)} 0%, transparent 55%),
                       radial-gradient(circle at 70% 80%, ${alpha('#9CA3AF', 0.10)} 0%, transparent 60%)`,
              }}
            />

            {/* glossy shine sweep */}
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                left: -80,
                width: 220,
                height: 160,
                transform: 'rotate(20deg)',
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0) 100%)'
                    : 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 100%)',
                animation: isSpinning ? 'shineSweep 1.2s linear infinite' : 'none',
              }}
            />
		        <Stack
		          spacing={0.6}
		          alignItems="center"
		          sx={{ position: 'relative' }}
		        >
		          <Typography
		            sx={{
		              fontWeight: 900,
		              letterSpacing: 2.4,
		              textTransform: 'uppercase',
			      fontSize: { xs: 18, sm: 20 },
		              lineHeight: 1,
		              background:
		                'linear-gradient(180deg, rgba(255,245,210,1) 0%, rgba(255,211,107,1) 38%, rgba(226,168,59,1) 70%, rgba(140,90,18,1) 100%)',
		              WebkitBackgroundClip: 'text',
		              WebkitTextFillColor: 'transparent',
		              textShadow:
		                '0 10px 22px rgba(0,0,0,0.35), 0 0 28px rgba(255, 210, 90, 0.22)',
		            }}
		          >
		            Winner
		          </Typography>
		          <Typography
		            variant="h2"
		            sx={{
		              letterSpacing: 1,
		              fontWeight: 800,
		              // Responsive: keep in one line on mobile.
		              fontSize: { xs: '1.7rem', sm: '3.0rem', md: '3.8rem' },
		              lineHeight: 1,
		              color: '#FFE08A',
		              textShadow:
		                '0 14px 32px rgba(0,0,0,0.75), 0 0 22px rgba(255, 216, 120, 0.45), 0 0 44px rgba(255, 216, 120, 0.18)',
		              whiteSpace: 'nowrap',
		              maxWidth: '100%',
		              overflow: 'hidden',
		              textOverflow: 'clip',
		            }}
		          >
		            {displayPhone}
		          </Typography>
		        </Stack>
          </Box>

        {/* Controls */}
        <Stack direction="row" spacing={1.5} sx={{ width: '100%', maxWidth: 560 }}>
            <Button
              variant="contained"
              onClick={start}
              disabled={isSpinning}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: 2.75,
                fontWeight: 800,
                textTransform: 'none',
                color: '#FFFFFF',
                background:
                  'linear-gradient(180deg, rgba(255,60,165,1) 0%, rgba(255,20,120,1) 45%, rgba(210,0,90,1) 100%)',
                boxShadow:
                  '0 14px 28px rgba(0,0,0,0.35), 0 0 26px rgba(255, 30, 140, 0.35)',
                border: '1px solid rgba(255,255,255,0.22)',
                '&:hover': {
                  background:
                    'linear-gradient(180deg, rgba(255,105,195,1) 0%, rgba(255,45,145,1) 45%, rgba(210,0,90,1) 100%)',
                },
                '&:disabled': {
                  opacity: 0.6,
                  color: 'rgba(255,255,255,0.75)',
                },
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
                fontWeight: 800,
                textTransform: 'none',
                color: '#FFFFFF',
                background:
                  'linear-gradient(180deg, rgba(255,60,165,1) 0%, rgba(255,20,120,1) 45%, rgba(210,0,90,1) 100%)',
                boxShadow:
                  '0 14px 28px rgba(0,0,0,0.35), 0 0 26px rgba(255, 30, 140, 0.35)',
                border: '1px solid rgba(255,255,255,0.22)',
                '&:hover': {
                  background:
                    'linear-gradient(180deg, rgba(255,105,195,1) 0%, rgba(255,45,145,1) 45%, rgba(210,0,90,1) 100%)',
                },
                '&:disabled': {
                  opacity: 0.6,
                  color: 'rgba(255,255,255,0.75)',
                },
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
          {/* pointer */}
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
              border: `1px solid ${alpha('#E2A83B', theme.palette.mode === 'dark' ? 0.35 : 0.35)}`,
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
              <WheelSvg rotationDeg={0} size={380} />
            </Box>
          </Box>
        </Box>
      </Stack>

      {/* keyframes */}
      <style jsx global>{`
        @keyframes shineSweep {
          0% { transform: translateX(-60px) rotate(20deg); opacity: 0.0; }
          10% { opacity: 0.55; }
          50% { opacity: 0.85; }
          90% { opacity: 0.55; }
          100% { transform: translateX(420px) rotate(20deg); opacity: 0.0; }
        }
      `}</style>
    </Card>
  );
}
