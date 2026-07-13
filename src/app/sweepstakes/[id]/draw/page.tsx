'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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

type DrawMode = 'tickets' | 'balls';

const COLORS = ['#ffd84d', '#ffffff', '#ff8fc4', '#ffe8a3', '#c7f0ff', '#ffb3d9', '#fff2cc'];
const TICKET_ASSETS = [
  '/raffle-tickets/ticket1.svg',
  '/raffle-tickets/ticket2.svg',
  '/raffle-tickets/ticket3.svg',
  '/raffle-tickets/ticket4.svg',
  '/raffle-tickets/ticket5.svg',
];
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

function ticketNumber(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.slice(-7) || '0000000';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>('tickets');

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

  const ticketRows = useMemo(() => {
    const source = spinList.length ? spinList : [{ phoneNumber: '0000000', storeName: '', storeImage: undefined }];

    return Array.from({ length: 7 }).map((_, rowIndex) => {
      return {
        delay: -(rowIndex * 0.52),
        duration: 6.2,
        startScale: 0.64 + (rowIndex % 3) * 0.04,
        items: Array.from({ length: 4 }).map((_, columnIndex) => {
          const index = rowIndex * 4 + columnIndex;
          const pick = source[index % source.length];

          return {
            asset: TICKET_ASSETS[index % TICKET_ASSETS.length],
            number: ticketNumber(pick.phoneNumber),
            left: 8 + columnIndex * 23 + ((rowIndex + columnIndex) % 2 === 0 ? -3 : 3),
            top: ((rowIndex * 7 + columnIndex * 11) % 12) - 6,
            rotate: ((rowIndex * 47 + columnIndex * 71) % 360) - 180,
            spinDelay: -((rowIndex * 0.18 + columnIndex * 0.27) % 1.8),
          };
        }),
      };
    });
  }, [spinList]);

  const ballLabels = useMemo(() => {
    return spinList.length ? spinList.map((item) => item.phoneNumber.replace(/\D/g, '').slice(-4) || '0000') : ['0000'];
  }, [spinList]);

  const isLoading = sweepstakeLoading || samplesLoading;
  const hasDataError = sweepstakeError || samplesError;
  const canDraw = realList.length > 0 && !isLoading;

  const enterFullscreen = useCallback(() => {
    const target = stageRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().catch(() => {
        /* Browser may reject fullscreen without direct user gesture. */
      });
    }
  }, []);

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
    ballsRef.current = Array.from({ length: 46 }).map((_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (radius - ballRadius * 1.4);

      return {
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        r: ballRadius,
        label: ballLabels[index % ballLabels.length],
        color: COLORS[index % COLORS.length],
      };
    });
  }, [ballLabels]);

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
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    resetCanvasBalls();
  }, [resetCanvasBalls]);

  useEffect(() => {
    if (drawMode !== 'balls') return undefined;

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !stage || !ctx) return undefined;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;

    const resetBallsForCanvas = () => {
      const ballRadius = radius * 0.115;

      ballsRef.current = Array.from({ length: 46 }).map((_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (radius - ballRadius * 1.4);

        return {
          x: cx + Math.cos(angle) * distance,
          y: cy + Math.sin(angle) * distance,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          r: ballRadius,
          label: ballLabels[index % ballLabels.length],
          color: COLORS[index % COLORS.length],
        };
      });
    };

    const resize = () => {
      width = canvas.width = stage.clientWidth;
      height = canvas.height = stage.clientHeight;
      cx = width / 2;
      cy = height * 0.56;
      radius = Math.min(width, height) * 0.27;
      resetBallsForCanvas();
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
  }, [ballLabels, drawMode]);

  useEffect(() => {
    return () => {
      if (cycleTimerRef.current) window.clearInterval(cycleTimerRef.current);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    };
  }, []);

  const buttonText = state.status === 'winner' ? 'NUEVO SORTEO' : state.status === 'drawing' ? 'SORTEANDO...' : 'SORTEAR';
  const title = sweepstake?.name || 'Sorteo';
  const supermarketName = realList[0]?.storeName || state.displayStore || 'Supermercado participante';

  return (
    <main
      className="draw-stage"
      ref={stageRef}
    >
      <div
        className="vegas-frame"
        aria-hidden="true"
      >
        <div className="vegas-lights top" />
        <div className="vegas-lights right" />
        <div className="vegas-lights bottom" />
        <div className="vegas-lights left" />
      </div>

      {drawMode === 'balls' && (
        <canvas
          className="balls-canvas"
          ref={canvasRef}
          aria-hidden="true"
        />
      )}

      {drawMode === 'tickets' && (
        <section
          className={`ticket-machine ${state.status}`}
          aria-hidden="true"
        >
          <Image
            className="machine-stand"
            src="/raffle-tickets/stand.svg"
            alt=""
            width={193}
            height={155}
            priority
          />

          <div className="raffle-holder">
            <Image
              className="machine-glass back"
              src="/raffle-tickets/glass.svg"
              alt=""
              width={188}
              height={106}
              priority
            />

            <div className="ticket-window">
              {ticketRows.map((row, rowIndex) => (
                <div
                  className="ticket-row"
                  key={`ticket-row-${rowIndex}`}
                  style={{
                    '--row-delay': `${row.delay}s`,
                    '--row-duration': `${row.duration}s`,
                    '--row-scale': row.startScale,
                    '--row-scale-back': row.startScale * 0.76,
                    '--row-scale-mid': row.startScale * 0.92,
                    '--row-scale-front': row.startScale * 1.26,
                  } as CSSProperties}
                >
                  {row.items.map((ticket, ticketIndex) => (
                    <div
                      className="ticket-item"
                      key={`${ticket.number}-${rowIndex}-${ticketIndex}`}
                      style={{
                        '--ticket-left': `${ticket.left}%`,
                        '--ticket-top': `${ticket.top}%`,
                        '--ticket-rotate': `${ticket.rotate}deg`,
                        '--ticket-spin-delay': `${ticket.spinDelay}s`,
                      } as CSSProperties}
                    >
                      <Image
                        src={ticket.asset}
                        alt=""
                        width={768}
                        height={389}
                      />
                      <span>{ticket.number}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <Image
              className="machine-glass front"
              src="/raffle-tickets/glass.svg"
              alt=""
              width={188}
              height={106}
              priority
            />

            <div className="drum-side-holder">
              {Array.from({ length: 4 }).map((_, index) => (
                <Image
                  className="drum-side"
                  key={`drum-side-${index}`}
                  src="/raffle-tickets/side.svg"
                  alt=""
                  width={188}
                  height={3}
                  style={{ '--side-delay': `${-(index * 0.42)}s` } as CSSProperties}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {!isFullscreen && (
        <button
          className="fullscreen-btn"
          type="button"
          onClick={enterFullscreen}
        >
          Pantalla completa
        </button>
      )}

      <div
        className="mode-selector"
        role="group"
        aria-label="Animacion del sorteo"
      >
        <button
          className={drawMode === 'tickets' ? 'active' : ''}
          type="button"
          onClick={() => setDrawMode('tickets')}
          disabled={state.status === 'drawing'}
        >
          Tickets
        </button>
        <button
          className={drawMode === 'balls' ? 'active' : ''}
          type="button"
          onClick={() => setDrawMode('balls')}
          disabled={state.status === 'drawing'}
        >
          Bolas
        </button>
      </div>

      <section
        className="brand"
        aria-label="Sweepstouch"
      >
        <div className="logo">
          SWEEPS<span>TOUCH</span>
        </div>
        <div className="store">{supermarketName}</div>
      </section>

      <section
        className="prize"
        aria-label="Premio"
      >
        <div className="p">{title}</div>
      </section>

      {state.status === 'winner' && (
        <section className={`winner-card ${drawMode}`}>
          {drawMode === 'tickets' ? (
            <div className="winner-ticket">
              <div className="winner-ticket-side">{ticketNumber(state.winner?.phoneNumber || '')}</div>
              <div className="winner-ticket-main">
                <div className="winner-ticket-label">The winning ticket is</div>
                <div className="winner-phone">{state.winner?.phoneNumber}</div>
                <div className="winner-store">{state.winner?.storeName}</div>
              </div>
            </div>
          ) : (
            <div className="winner-panel">
              <div className="winner-label">Ganador</div>
              <div className="winner-panel-phone">{state.winner?.phoneNumber}</div>
              <div className="winner-panel-store">{state.winner?.storeName}</div>
            </div>
          )}
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
          background:
            linear-gradient(90deg, rgba(255, 216, 77, 0.08) 0 1px, transparent 1px 100%),
            linear-gradient(0deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 100%),
            radial-gradient(circle at 50% 38%, #ff2a97 0%, #ef0f82 38%, #b00860 74%, #5f003d 100%);
          background-size: 48px 48px, 48px 48px, auto;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }

        .draw-stage::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.42), transparent 18%, transparent 82%, rgba(0, 0, 0, 0.42)),
            linear-gradient(180deg, rgba(0, 0, 0, 0.36), transparent 20%, transparent 82%, rgba(0, 0, 0, 0.44));
        }

        .vegas-frame {
          position: absolute;
          inset: 0;
          z-index: 4;
          pointer-events: none;
        }

        .vegas-lights {
          position: absolute;
          filter:
            drop-shadow(0 0 6px rgba(255, 216, 77, 0.95))
            drop-shadow(0 0 14px rgba(255, 43, 151, 0.8));
          opacity: 0.95;
        }

        .vegas-lights.top,
        .vegas-lights.bottom {
          left: 0;
          right: 0;
          height: 34px;
          background:
            radial-gradient(circle, #fff8c9 0 25%, #ffd84d 28% 40%, transparent 44%) 0 50% / 58px 34px repeat-x;
          animation: chaseHorizontal 1.25s linear infinite;
        }

        .vegas-lights.top {
          top: 0;
        }

        .vegas-lights.bottom {
          bottom: 0;
          animation-direction: reverse;
        }

        .vegas-lights.left,
        .vegas-lights.right {
          top: 0;
          bottom: 0;
          width: 34px;
          background:
            radial-gradient(circle, #fff8c9 0 25%, #ffd84d 28% 40%, transparent 44%) 50% 0 / 34px 58px repeat-y;
          animation: chaseVertical 1.25s linear infinite;
        }

        .vegas-lights.left {
          left: 0;
          animation-direction: reverse;
        }

        .vegas-lights.right {
          right: 0;
        }

        .ticket-machine {
          position: absolute;
          left: 50%;
          top: 23vh;
          z-index: 3;
          width: min(920px, 78vw);
          aspect-ratio: 193.532 / 155.436;
          transform: translateX(-50%);
          pointer-events: none;
          filter:
            drop-shadow(0 0 24px rgba(255, 216, 77, 0.22))
            drop-shadow(0 26px 46px rgba(0, 0, 0, 0.22));
        }

        .ticket-machine.drawing {
          animation: ticketMachineSpin 0.38s ease-in-out infinite;
          filter:
            drop-shadow(0 0 32px rgba(255, 216, 77, 0.5))
            drop-shadow(0 0 52px rgba(255, 42, 151, 0.34))
            drop-shadow(0 28px 48px rgba(0, 0, 0, 0.26));
        }

        .machine-stand {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .raffle-holder {
          position: absolute;
          top: 2%;
          left: 1%;
          z-index: 2;
          width: 98%;
          aspect-ratio: 188.027 / 106.104;
        }

        .machine-glass {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
        }

        .machine-glass.back {
          z-index: 1;
          opacity: 0.78;
        }

        .machine-glass.front {
          z-index: 100;
          opacity: 0.72;
          pointer-events: none;
        }

        .ticket-window {
          position: absolute;
          inset: 0;
          z-index: 5;
          overflow: hidden;
          perspective: 900px;
        }

        .ticket-machine.drawing .ticket-window {
          animation: ticketWindowPulse 0.7s ease-in-out infinite;
        }

        .ticket-row {
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 100%;
          animation: ticketRowOrbit var(--row-duration) linear infinite;
          animation-delay: var(--row-delay);
          transform-origin: center;
          will-change: top, transform, opacity, filter;
        }

        .ticket-machine.drawing .ticket-row {
          animation-duration: 1.35s;
        }

        .ticket-item {
          position: absolute;
          left: var(--ticket-left);
          top: var(--ticket-top);
          width: 25%;
          transform: rotate(var(--ticket-rotate));
          transform-origin: center;
          will-change: transform;
        }

        .ticket-machine.drawing .ticket-item {
          animation: ticketItemShuffle 1.15s ease-in-out infinite;
          animation-delay: var(--ticket-spin-delay);
        }

        .ticket-item img {
          display: block;
          width: 100%;
          height: auto;
          filter:
            drop-shadow(0 8px 10px rgba(0, 0, 0, 0.22))
            drop-shadow(0 0 6px rgba(255, 255, 255, 0.2));
        }

        .ticket-item span {
          position: absolute;
          left: 30%;
          top: 54%;
          color: rgba(34, 38, 45, 0.72);
          font-size: clamp(10px, 0.95vw, 15px);
          font-weight: 900;
          letter-spacing: 1px;
          transform: translate(-50%, -50%) rotate(90deg);
        }

        .drum-side-holder {
          position: absolute;
          inset: 0;
          z-index: 101;
          pointer-events: none;
        }

        .drum-side {
          position: absolute;
          left: 0;
          top: 20%;
          width: 100%;
          height: auto;
          animation: drumSideSpin 1.65s linear infinite;
          animation-delay: var(--side-delay);
        }

        .ticket-machine:not(.drawing) .drum-side {
          animation-duration: 4.6s;
        }

        .balls-canvas {
          position: absolute;
          inset: 0;
          z-index: 3;
          width: 100%;
          height: 100%;
        }

        .brand,
        .prize,
        .display,
        .winner-card,
        .mode-selector,
        .fullscreen-btn,
        .btn,
        .hint {
          position: absolute;
          z-index: 5;
        }

        .fullscreen-btn {
          top: 24px;
          right: 24px;
          border: 1px solid rgba(255, 255, 255, 0.42);
          border-radius: 999px;
          background: rgba(70, 0, 48, 0.44);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0;
          padding: 10px 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 18px rgba(255, 216, 77, 0.25), inset 0 0 12px rgba(255, 255, 255, 0.08);
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .fullscreen-btn:hover {
          background: rgba(255, 216, 77, 0.18);
          box-shadow: 0 0 24px rgba(255, 216, 77, 0.45), inset 0 0 14px rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }

        .draw-stage:fullscreen .fullscreen-btn {
          display: none;
        }

        .mode-selector {
          top: 24px;
          left: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          border: 1px solid rgba(255, 255, 255, 0.34);
          border-radius: 999px;
          background: rgba(70, 0, 48, 0.44);
          padding: 4px;
          backdrop-filter: blur(10px);
          box-shadow:
            0 0 18px rgba(255, 216, 77, 0.22),
            inset 0 0 12px rgba(255, 255, 255, 0.08);
        }

        .mode-selector button {
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255, 255, 255, 0.78);
          cursor: pointer;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0;
          padding: 8px 14px;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .mode-selector button.active {
          background: #fff;
          color: #ef0f82;
          box-shadow: 0 0 18px rgba(255, 216, 77, 0.42);
        }

        .mode-selector button:disabled {
          cursor: not-allowed;
          opacity: 0.58;
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
          color: #fff;
          text-shadow:
            0 0 10px rgba(255, 255, 255, 0.82),
            0 0 24px rgba(255, 43, 151, 0.85),
            0 0 44px rgba(255, 216, 77, 0.36);
          animation: neonFlicker 2.4s ease-in-out infinite;
        }

        .logo span {
          color: #ffd84d;
          text-shadow:
            0 0 10px rgba(255, 216, 77, 0.95),
            0 0 28px rgba(255, 216, 77, 0.7);
        }

        .store {
          max-width: min(780px, 86vw);
          margin: 0.9vh auto 0;
          font-size: clamp(12px, 1.05vw, 19px);
          font-weight: 600;
          line-height: 1.25;
          opacity: 0.9;
          text-shadow:
            0 0 10px rgba(255, 255, 255, 0.55),
            0 0 22px rgba(255, 216, 77, 0.28);
        }

        .prize {
          top: 14.5vh;
          left: 0;
          right: 0;
          padding: 0 24px;
          color: #fff;
          pointer-events: none;
          text-align: center;
        }

        .prize .p {
          max-width: min(1080px, 92vw);
          margin: 0 auto;
          font-size: clamp(34px, 4.4vw, 78px);
          font-weight: 800;
          line-height: 1.02;
          overflow-wrap: anywhere;
          text-shadow:
            0 3px 14px rgba(0, 0, 0, 0.28),
            0 0 18px rgba(255, 255, 255, 0.92),
            0 0 34px rgba(255, 216, 77, 0.42),
            0 0 54px rgba(255, 43, 151, 0.62);
          animation: titleGlow 1.8s ease-in-out infinite;
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
          box-shadow:
            0 18px 60px rgba(0, 0, 0, 0.24),
            0 0 34px rgba(255, 216, 77, 0.28);
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
          top: 24vh;
          left: 50%;
          width: min(820px, 86vw);
          min-width: 0;
          padding: 0;
          text-align: center;
          transform: translateX(-50%);
          animation: ticketPrizePop 0.72s cubic-bezier(0.2, 1.4, 0.4, 1);
          overflow: visible;
        }

        .winner-card.balls {
          top: 30vh;
          width: min(760px, 86vw);
        }

        .winner-card::before,
        .winner-card::after {
          display: none;
        }

        .winner-ticket {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 96px minmax(0, 1fr);
          overflow: hidden;
          min-height: 290px;
          width: 100%;
          border: 4px solid #2b1530;
          border-radius: 22px;
          background:
            radial-gradient(circle at 78% 24%, rgba(255, 255, 255, 0.22), transparent 30%),
            linear-gradient(135deg, #f51383, #b80663);
          box-shadow:
            inset 0 0 0 4px rgba(255, 255, 255, 0.1),
            inset 0 0 40px rgba(255, 216, 77, 0.12),
            0 24px 54px rgba(0, 0, 0, 0.32);
        }

        .winner-ticket::before,
        .winner-ticket::after {
          content: '';
          position: absolute;
          top: 50%;
          z-index: 2;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #050405;
          transform: translateY(-50%);
        }

        .winner-ticket::before {
          left: -36px;
        }

        .winner-ticket::after {
          right: -36px;
        }

        .winner-ticket-main {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0;
          padding: 28px 46px;
          pointer-events: none;
        }

        .winner-ticket-side {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 3px dashed rgba(20, 16, 20, 0.72);
          background: rgba(255, 216, 77, 0.18);
          color: #2b1530;
          font-size: clamp(16px, 1.5vw, 28px);
          font-weight: 900;
          letter-spacing: 5px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }

        .winner-ticket-label {
          color: #fff;
          font-size: clamp(14px, 1.4vw, 24px);
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-shadow:
            0 0 8px rgba(255, 216, 77, 1),
            0 0 18px rgba(255, 216, 77, 0.85),
            0 0 36px rgba(255, 43, 151, 0.72);
        }

        .winner-phone {
          margin-top: 14px;
          width: 100%;
          max-width: 100%;
          color: #fff;
          font-size: clamp(36px, 5.4vw, 86px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
          text-align: center;
          overflow-wrap: anywhere;
          text-shadow:
            0 0 10px rgba(255, 42, 151, 0.92),
            0 0 24px rgba(255, 42, 151, 0.72),
            0 0 42px rgba(255, 216, 77, 0.36);
        }

        .winner-store {
          margin-top: 16px;
          width: 86%;
          color: #fff;
          font-size: clamp(15px, 1.55vw, 28px);
          font-weight: 800;
          line-height: 1.15;
          text-shadow:
            0 0 10px rgba(255, 255, 255, 0.48),
            0 0 18px rgba(255, 216, 77, 0.24);
        }

        .winner-panel {
          position: relative;
          overflow: hidden;
          border: 3px solid #ffd84d;
          border-radius: 34px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 216, 77, 0.22), transparent 34%),
            linear-gradient(180deg, #141014 0%, #050405 100%);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.55),
            0 0 18px rgba(255, 216, 77, 0.72),
            0 0 46px rgba(255, 43, 151, 0.46),
            inset 0 0 0 1px rgba(255, 255, 255, 0.16);
          padding: 34px 48px 38px;
        }

        .winner-label {
          color: #ffd84d;
          font-size: clamp(18px, 2vw, 38px);
          font-weight: 900;
          letter-spacing: 6px;
          text-transform: uppercase;
          text-shadow:
            0 0 8px rgba(255, 216, 77, 1),
            0 0 20px rgba(255, 216, 77, 0.72);
        }

        .winner-panel-phone {
          margin-top: 18px;
          color: #fff;
          font-size: clamp(46px, 6vw, 104px);
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          overflow-wrap: anywhere;
          text-shadow:
            0 0 10px rgba(255, 42, 151, 0.9),
            0 0 28px rgba(255, 42, 151, 0.7);
        }

        .winner-panel-store {
          margin-top: 18px;
          color: #fff;
          font-size: clamp(16px, 1.7vw, 30px);
          font-weight: 800;
          line-height: 1.2;
        }

        .btn {
          bottom: 6.4vh;
          left: 50%;
          min-width: 220px;
          border: 0;
          border-radius: 999px;
          background: #fff;
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.3),
            0 0 26px rgba(255, 216, 77, 0.45),
            inset 0 0 0 4px rgba(255, 216, 77, 0.08);
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
          animation: pulse 1.3s ease-in-out infinite, buttonShine 2.2s ease-in-out infinite;
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

        @keyframes chaseHorizontal {
          from {
            background-position: 0 50%;
          }
          to {
            background-position: 58px 50%;
          }
        }

        @keyframes chaseVertical {
          from {
            background-position: 50% 0;
          }
          to {
            background-position: 50% 58px;
          }
        }

        @keyframes neonFlicker {
          0%,
          100% {
            filter: brightness(1);
          }
          45% {
            filter: brightness(1.22);
          }
          48% {
            filter: brightness(0.92);
          }
          52% {
            filter: brightness(1.28);
          }
        }

        @keyframes titleGlow {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.16);
          }
        }

        @keyframes buttonShine {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.08);
          }
        }

        @keyframes ticketRowOrbit {
          0% {
            top: 18%;
            opacity: 0.42;
            filter: brightness(0.76) blur(0.2px);
            transform: translate3d(-2%, -50%, -110px) scale(var(--row-scale-back));
          }
          17% {
            top: 31%;
            opacity: 0.72;
            filter: brightness(0.9);
            transform: translate3d(1.5%, -50%, -36px) scale(var(--row-scale-mid));
          }
          43% {
            top: 62%;
            opacity: 1;
            filter: brightness(1.08);
            transform: translate3d(2%, -50%, 84px) scale(var(--row-scale-front));
          }
          70% {
            top: 88%;
            opacity: 0.86;
            filter: brightness(0.96);
            transform: translate3d(-1%, -50%, 24px) scale(calc(var(--row-scale) * 1));
          }
          100% {
            top: 18%;
            opacity: 0.42;
            filter: brightness(0.76) blur(0.2px);
            transform: translate3d(-2%, -50%, -110px) scale(var(--row-scale-back));
          }
        }

        @keyframes ticketItemShuffle {
          0%,
          100% {
            transform: rotate(var(--ticket-rotate));
          }
          50% {
            transform: rotate(calc(var(--ticket-rotate) + 92deg));
          }
        }

        @keyframes ticketMachineSpin {
          0%,
          100% {
            transform: translateX(-50%) rotate(-0.4deg) scale(1);
          }
          25% {
            transform: translateX(-50%) rotate(0.8deg) scale(1.012);
          }
          50% {
            transform: translateX(-50%) rotate(-0.7deg) scale(1.006);
          }
          75% {
            transform: translateX(-50%) rotate(0.5deg) scale(1.014);
          }
        }

        @keyframes ticketWindowPulse {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.18);
          }
        }

        @keyframes drumSideSpin {
          0% {
            top: 14%;
            opacity: 0;
            transform: scale(0.84);
          }
          38% {
            top: 48%;
            opacity: 0.7;
            transform: scale(1);
          }
          70% {
            top: 84%;
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            top: 14%;
            opacity: 0;
            transform: scale(0.84);
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

        @keyframes ticketPrizePop {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px) scale(0.38) rotate(-5deg);
          }
          64% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1.04) rotate(1deg);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1) rotate(0);
          }
        }

        @media (max-width: 760px) {
          .prize {
            top: 15vh;
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
            top: 30vh;
            width: min(94vw, 820px);
          }

          .winner-card.balls {
            top: 31vh;
          }

          .winner-ticket-main {
            padding: 22px 24px;
          }

          .winner-ticket {
            grid-template-columns: 54px minmax(0, 1fr);
            min-height: 240px;
          }

          .winner-ticket-side {
            letter-spacing: 3px;
          }

          .winner-phone {
            font-size: clamp(28px, 8.8vw, 54px);
          }

          .winner-store {
            font-size: clamp(10px, 2.8vw, 15px);
          }

          .winner-panel {
            border-radius: 24px;
            padding: 24px 22px 28px;
          }

          .winner-panel-phone {
            font-size: clamp(34px, 10vw, 58px);
          }

          .mode-selector {
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
          }

          .btn {
            min-width: 180px;
          }
        }
      `}</style>
    </main>
  );
}
