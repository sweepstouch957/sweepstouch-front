import { useEffect, useRef } from "react";
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
/* ===================== Confetti ===================== */
export function useConfetti() {
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
