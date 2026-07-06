'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { sweepstakesClient, type Sweepstakes } from '@/services/sweepstakes.service';

type ParticipantSample = {
  phone?: string;
  phoneNumber?: string;
  storeName?: string;
  storeImage?: string;
};

type Winner = {
  phoneNumber: string;
  storeName: string;
  storeImage?: string;
};

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  label: string;
  color: string;
};

type Confetti = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  rot: number;
  vr: number;
};

type DrawState = {
  status: 'idle' | 'drawing' | 'winner';
  displayPhone: string;
  displayStore: string;
  displayImage?: string;
  winner?: Winner;
};

type DrawAction =
  | { type: 'START' }
  | { type: 'CYCLE'; item: Winner }
  | { type: 'WIN'; item: Winner }
  | { type: 'RESET' };

const COLORS = ['#ffd84d', '#ffffff', '#ff8fc4', '#ffe8a3', '#c7f0ff', '#ffb3d9', '#fff2cc'];
const INITIAL_PHONE = 'LISTO PARA JUGAR';
const INITIAL_STORE = 'Esperando sorteo...';

function reducer(state: DrawState, action: DrawAction): DrawState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        status: 'drawing',
        winner: undefined,
      };
    case 'CYCLE':
      return {
        ...state,
        displayPhone: action.item.phoneNumber,
        displayStore: action.item.storeName,
        displayImage: action.item.storeImage,
      };
    case 'WIN':
      return {
        status: 'winner',
        displayPhone: action.item.phoneNumber,
        displayStore: action.item.storeName,
        displayImage: action.item.storeImage,
        winner: action.item,
      };
    case 'RESET':
      return {
        status: 'idle',
        displayPhone: INITIAL_PHONE,
        displayStore: INITIAL_STORE,
        displayImage: undefined,
        winner: undefined,
      };
    default:
      return state;
  }
}

function formatPhone(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (normalized.length === 10) {
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }

  return raw || '';
}

function maskedPhone(): string {
  const rand3 = () => Math.floor(100 + Math.random() * 900).toString();
  return `(${rand3()}) ***-****`;
}

function cleanStoreImage(src?: string) {
  if (!src || src === 'no-image.jpg' || src === 'n/a') return undefined;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${process.env.NEXT_PUBLIC_API_URL}/files/images/${src}`;
}

function normalizeSamples(samples: ParticipantSample[]): Winner[] {
  const unique = new Map<string, Winner>();

  for (const sample of samples) {
    const rawPhone = (sample.phoneNumber || sample.phone || '').trim();
    if (!rawPhone) continue;

    const phoneNumber = formatPhone(rawPhone);
    const storeName = (sample.storeName || '').trim() || 'Tienda participante';
    const key = `${phoneNumber}-${storeName}`;

    if (!unique.has(key)) {
      unique.set(key, {
        phoneNumber,
        storeName,
        storeImage: cleanStoreImage(sample.storeImage),
      });
    }
  }

  return Array.from(unique.values());
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

export default function PublicSweepstakeDrawPage() {
  const { id } = useParams<{ id: string }>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const cycleTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const drawStatusRef = useRef<DrawState['status']>('idle');

  const [state, dispatch] = useReducer(reducer, {
    status: 'idle',
    displayPhone: INITIAL_PHONE,
    displayStore: INITIAL_STORE,
    displayImage: undefined,
    winner: undefined,
  });

  useEffect(() => {
    drawStatusRef.current = state.status;
  }, [state.status]);

  const {
    data: sweepstake,
    isLoading: sweepstakeLoading,
    isError: sweepstakeError,
  } = useQuery({
    queryKey: ['public-sweepstake-draw', id],
    queryFn: () => sweepstakesClient.getSweepstakeById(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const {
    data: samples = [],
    isLoading: samplesLoading,
    isError: samplesError,
  } = useQuery({
    queryKey: ['public-sweepstake-draw-samples', id],
    queryFn: () => sweepstakesClient.getParticipantsSamplePhones(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  }) as {
    data?: ParticipantSample[];
    isLoading: boolean;
    isError: boolean;
  };

  const realList = useMemo(() => normalizeSamples(samples), [samples]);

  const spinList = useMemo(() => {
    if (realList.length >= 14) return realList;

    const stores = [
      'Fresh Market Express',
      'Super Mega Center',
      'Premium Grocery Store',
      'Local City Shop',
      'Discount Retail Shop',
      'Global Supermarket',
    ];
    const filler = Array.from({ length: 18 - realList.length }).map(() => ({
      phoneNumber: maskedPhone(),
      storeName: stores[Math.floor(Math.random() * stores.length)],
      storeImage: undefined,
    }));

    return [...realList, ...filler];
  }, [realList]);

  const isLoading = sweepstakeLoading || samplesLoading;
  const hasDataError = sweepstakeError || samplesError;
  const canDraw = realList.length > 0 && !isLoading;

  const resetCanvasBalls = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const width = canvas.width = stage.clientWidth;
    const height = canvas.height = stage.clientHeight;
    const cx = width / 2;
    const cy = height * 0.53;
    const radius = Math.min(width, height) * 0.27;
    const ballRadius = radius * 0.115;
    const labels = spinList.length ? spinList.map((item) => item.phoneNumber.replace(/\D/g, '').slice(-4) || '0000') : ['0000'];

    ballsRef.current = Array.from({ length: 46 }).map((_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (radius - ballRadius * 1.4);

      return {
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        r: ballRadius,
        label: labels[index % labels.length],
        color: COLORS[index % COLORS.length],
      };
    });
  }, [spinList]);

  const spawnConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    confettiRef.current = Array.from({ length: 220 }).map((_, index) => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 16,
      vy: -6 - Math.random() * 14,
      r: 4 + Math.random() * 7,
      color: COLORS[index % COLORS.length],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
    }));
  }, []);

  const startDraw = useCallback(() => {
    if (!canDraw) return;

    if (state.status === 'winner') {
      dispatch({ type: 'RESET' });
      resetCanvasBalls();
      confettiRef.current = [];
      return;
    }

    if (state.status === 'drawing') return;

    dispatch({ type: 'START' });

    if (cycleTimerRef.current) window.clearInterval(cycleTimerRef.current);
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);

    cycleTimerRef.current = window.setInterval(() => {
      const pick = spinList[Math.floor(Math.random() * spinList.length)] || realList[0];
      dispatch({ type: 'CYCLE', item: pick });
    }, 70);

    finishTimerRef.current = window.setTimeout(() => {
      if (cycleTimerRef.current) window.clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;

      const winner = realList[Math.floor(Math.random() * realList.length)];
      dispatch({ type: 'WIN', item: winner });
      spawnConfetti();
    }, 5000);
  }, [canDraw, realList, resetCanvasBalls, spawnConfetti, spinList, state.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        startDraw();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startDraw]);

  useEffect(() => {
    resetCanvasBalls();
  }, [resetCanvasBalls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !stage || !ctx) return undefined;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;

    const resize = () => {
      width = canvas.width = stage.clientWidth;
      height = canvas.height = stage.clientHeight;
      cx = width / 2;
      cy = height * 0.56;
      radius = Math.min(width, height) * 0.27;
      resetCanvasBalls();
    };

    const drawAmphora = () => {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.20)';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.42, cy + radius * 0.98);
      ctx.lineTo(cx + radius * 0.42, cy + radius * 0.98);
      ctx.lineTo(cx + radius * 0.28, cy + radius * 1.16);
      ctx.lineTo(cx - radius * 0.28, cy + radius * 1.16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 1.17, radius * 0.34, radius * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = radius * 0.07;
      ctx.strokeStyle = 'rgba(255,255,255,.28)';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.92, cy - radius * 0.35);
      ctx.quadraticCurveTo(cx - radius * 1.28, cy, cx - radius * 0.85, cy + radius * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + radius * 0.92, cy - radius * 0.35);
      ctx.quadraticCurveTo(cx + radius * 1.28, cy, cx + radius * 0.85, cy + radius * 0.3);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,.14)';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.72, cy - radius * 0.7);
      ctx.quadraticCurveTo(cx - radius * 0.34, cy - radius * 1.02, cx - radius * 0.3, cy - radius * 1.28);
      ctx.lineTo(cx + radius * 0.3, cy - radius * 1.28);
      ctx.quadraticCurveTo(cx + radius * 0.34, cy - radius * 1.02, cx + radius * 0.72, cy - radius * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,.34)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - radius * 1.28, radius * 0.34, radius * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, radius * 0.2, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,.34)');
      gradient.addColorStop(0.7, 'rgba(255,255,255,.12)');
      gradient.addColorStop(1, 'rgba(255,255,255,.05)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawGlass = () => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = Math.max(2, radius * 0.02);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = radius * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.82, Math.PI * 1.15, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    };

    const drawBall = (ball: Ball) => {
      const gradient = ctx.createRadialGradient(
        ball.x - ball.r * 0.35,
        ball.y - ball.r * 0.4,
        ball.r * 0.15,
        ball.x,
        ball.y,
        ball.r,
      );
      gradient.addColorStop(0, ball.color);
      gradient.addColorStop(1, shade(ball.color, -18));

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.72)';
      ctx.font = `800 ${ball.r * 0.72}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.label, ball.x, ball.y + ball.r * 0.04);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.arc(ball.x - ball.r * 0.32, ball.y - ball.r * 0.36, ball.r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const physics = () => {
      const agitation = drawStatusRef.current === 'drawing' ? 0.15 : 0.025;
      for (const ball of ballsRef.current) {
        ball.vy += 0.35;
        if (Math.random() < agitation) {
          ball.vy -= 6 + Math.random() * 7;
          ball.vx += (Math.random() - 0.5) * 8;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.995;
        ball.vy *= 0.995;

        const dx = ball.x - cx;
        const dy = ball.y - cy;
        const distance = Math.hypot(dx, dy);
        const limit = radius - ball.r;

        if (distance > limit) {
          const nx = dx / distance;
          const ny = dy / distance;
          ball.x = cx + nx * limit;
          ball.y = cy + ny * limit;
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx * 0.86;
          ball.vy -= 2 * dot * ny * 0.86;
        }
      }
    };

    const drawConfetti = () => {
      for (const piece of confettiRef.current) {
        piece.vy += 0.35;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vx *= 0.99;
        piece.rot += piece.vr;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.r / 2, -piece.r / 2, piece.r, piece.r * 1.6);
        ctx.restore();
      }

      confettiRef.current = confettiRef.current.filter((piece) => piece.y < height + 30);
    };

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      drawAmphora();
      physics();
      for (const ball of ballsRef.current) drawBall(ball);
      drawGlass();
      drawConfetti();
      animationRef.current = requestAnimationFrame(loop);
    };

    resize();
    loop();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [resetCanvasBalls]);

  useEffect(() => {
    return () => {
      if (cycleTimerRef.current) window.clearInterval(cycleTimerRef.current);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    };
  }, []);

  const buttonText = state.status === 'winner' ? 'NUEVO SORTEO' : state.status === 'drawing' ? 'SORTEANDO...' : 'SORTEAR';
  const title = sweepstake?.name || 'Sorteo';
  const subtitle = sweepstake?.description || 'Sorteo de la semana';

  return (
    <main
      className="draw-stage"
      ref={stageRef}
    >
      <canvas ref={canvasRef} />

      <section
        className="brand"
        aria-label="Sweepstouch"
      >
        <div className="logo">
          SWEEPS<span>TOUCH</span>
        </div>
        <div className="store">{subtitle}</div>
      </section>

      <section
        className="prize"
        aria-label="Premio"
      >
        <div className="k">Sorteo de la semana</div>
        <div className="p">{title}</div>
        <div className="s">{realList.length.toLocaleString()} participantes disponibles</div>
      </section>

      {state.status === 'drawing' && (
        <section
          className="display drawing"
          aria-live="polite"
        >
          {state.displayImage ? (
            <img
              src={state.displayImage}
              alt=""
            />
          ) : (
            <div className="store-icon">ST</div>
          )}
          <div>
            <div className="phone">{isLoading ? 'CARGANDO...' : state.displayPhone}</div>
            <div className="store-name">
              {hasDataError ? 'No se pudo cargar la informacion del sorteo' : state.displayStore}
            </div>
          </div>
        </section>
      )}

      {state.status === 'winner' && (
        <section className="winner-card">
          <div className="winner-k">Ganador</div>
          <div className="winner-phone">{state.winner?.phoneNumber}</div>
          <div className="winner-store">{state.winner?.storeName}</div>
        </section>
      )}

      <button
        className={`btn ${state.status === 'idle' ? 'pulse' : ''}`}
        type="button"
        onClick={startDraw}
        disabled={!canDraw || state.status === 'drawing'}
      >
        {canDraw ? buttonText : isLoading ? 'CARGANDO' : 'SIN PARTICIPANTES'}
      </button>

      <div className="hint">
        {canDraw ? 'Toca SORTEAR o presiona ESPACIO' : 'Este sorteo no tiene participantes disponibles para elegir'}
      </div>

      <style jsx>{`
        .draw-stage,
        .draw-stage * {
          box-sizing: border-box;
        }

        .draw-stage {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: radial-gradient(circle at 50% 38%, #ff2a97 0%, #ef0f82 42%, #b00860 100%);
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }

        canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .brand,
        .prize,
        .display,
        .winner-card,
        .btn,
        .hint {
          position: absolute;
          z-index: 5;
        }

        .brand {
          top: 3.4vh;
          left: 0;
          right: 0;
          color: #fff;
          pointer-events: none;
          text-align: center;
        }

        .logo {
          font-size: clamp(24px, 2.4vw, 46px);
          font-weight: 800;
          letter-spacing: 1px;
        }

        .logo span {
          color: #ffd84d;
        }

        .store {
          max-width: min(780px, 86vw);
          margin: 0.9vh auto 0;
          font-size: clamp(12px, 1.05vw, 19px);
          font-weight: 600;
          line-height: 1.25;
          opacity: 0.9;
        }

        .prize {
          top: 15vh;
          left: 0;
          right: 0;
          padding: 0 24px;
          color: #fff;
          pointer-events: none;
          text-align: center;
        }

        .prize .k {
          color: #ffd84d;
          font-size: clamp(12px, 1.05vw, 20px);
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .prize .p {
          max-width: min(1080px, 92vw);
          margin: 1.2vh auto 0;
          font-size: clamp(34px, 4.2vw, 72px);
          font-weight: 800;
          line-height: 1.02;
          overflow-wrap: anywhere;
          text-shadow: 0 3px 14px rgba(0, 0, 0, 0.25);
        }

        .prize .s {
          margin-top: 1.3vh;
          font-size: clamp(13px, 1.2vw, 22px);
          font-weight: 700;
          opacity: 0.9;
        }

        .display {
          left: 50%;
          bottom: 17vh;
          display: flex;
          min-width: min(760px, 88vw);
          align-items: center;
          justify-content: center;
          gap: 18px;
          border: 1px solid rgba(255, 255, 255, 0.32);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
          padding: 18px 34px;
          transform: translateX(-50%);
        }

        .display.winner {
          box-shadow: 0 22px 80px rgba(255, 216, 77, 0.55);
        }

        .display img,
        .store-icon {
          width: 54px;
          height: 54px;
          flex: 0 0 auto;
          border-radius: 16px;
        }

        .display img {
          object-fit: cover;
        }

        .store-icon {
          display: grid;
          place-items: center;
          background: #ffe1f0;
          color: #ef0f82;
          font-weight: 900;
        }

        .phone {
          color: #ef0f82;
          font-size: clamp(28px, 4.8vw, 84px);
          font-weight: 900;
          letter-spacing: 2px;
          line-height: 1;
          text-align: left;
          font-variant-numeric: tabular-nums;
        }

        .store-name {
          margin-top: 8px;
          color: #565b66;
          font-size: clamp(13px, 1.3vw, 24px);
          font-weight: 800;
          text-align: left;
        }

        .winner-card {
          top: 30vh;
          left: 50%;
          min-width: min(620px, 86vw);
          border-radius: 32px;
          background: #fff;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          padding: 28px 52px;
          text-align: center;
          transform: translateX(-50%);
          animation: pop 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
        }

        .winner-k {
          color: #ffd84d;
          font-size: clamp(20px, 2vw, 42px);
          font-weight: 900;
          letter-spacing: 6px;
          text-transform: uppercase;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
        }

        .winner-phone {
          margin-top: 12px;
          color: #ef0f82;
          font-size: clamp(42px, 5.7vw, 110px);
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .winner-store {
          margin-top: 12px;
          color: #2b2b2b;
          font-size: clamp(16px, 1.7vw, 32px);
          font-weight: 800;
        }

        .btn {
          bottom: 6.4vh;
          left: 50%;
          min-width: 220px;
          border: 0;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          color: #ef0f82;
          cursor: pointer;
          font-size: clamp(22px, 2vw, 38px);
          font-weight: 900;
          letter-spacing: 1px;
          padding: 1.5vh 4vw;
          transform: translateX(-50%);
          transition: transform 0.1s, opacity 0.2s;
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }

        .btn:active:not(:disabled) {
          transform: translateX(-50%) scale(0.97);
        }

        .btn.pulse {
          animation: pulse 1.3s ease-in-out infinite;
        }

        .hint {
          bottom: 3vh;
          left: 0;
          right: 0;
          color: rgba(255, 255, 255, 0.85);
          pointer-events: none;
          text-align: center;
          font-size: clamp(11px, 1vw, 18px);
          font-weight: 700;
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 8px 44px rgba(255, 216, 77, 0.9);
          }
        }

        @keyframes pop {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.4);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        @media (max-width: 760px) {
          .prize {
            top: 14vh;
          }

          .display {
            bottom: 18vh;
            flex-direction: column;
            padding: 16px 18px;
          }

          .phone,
          .store-name {
            text-align: center;
          }

          .winner-card {
            top: 31vh;
            padding: 22px 24px;
          }

          .btn {
            min-width: 180px;
          }
        }
      `}</style>
    </main>
  );
}
