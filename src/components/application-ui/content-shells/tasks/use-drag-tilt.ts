import React from 'react';

/* ── Physics-based tilt hook (Google Maps pegman style) ── */
export function useDragTiltDom(dragging?: boolean, transformStr?: string) {
  const paperRef = React.useRef<HTMLDivElement>(null);
  const tiltRef = React.useRef(0);
  const targetTiltRef = React.useRef(0);
  const lastX = React.useRef<number | null>(null);
  const lastTime = React.useRef<number | null>(null);
  const rafId = React.useRef<number | null>(null);

  const tiltVelocityRef = React.useRef(0); // For spring physics

  React.useEffect(() => {
    if (!dragging || !transformStr) {
      targetTiltRef.current = 0;
      lastX.current = null;
      return;
    }
    const match = transformStr.match(/translate\(([^,]+)px/);
    if (match) {
      const x = parseFloat(match[1]);
      const now = performance.now();
      if (lastX.current !== null && lastTime.current !== null) {
        const dt = now - lastTime.current;
        if (dt > 0) {
          const velocity = (x - lastX.current) / dt;
          let target = velocity * 12; // Adjust sensitivity
          if (target > 25) target = 25;
          if (target < -25) target = -25;
          targetTiltRef.current = target;
        }
      }
      lastX.current = x;
      lastTime.current = now;
    }
  }, [dragging, transformStr]);

  React.useEffect(() => {
    if (!dragging) {
      tiltRef.current = 0;
      tiltVelocityRef.current = 0;
      targetTiltRef.current = 0;
      if (paperRef.current) paperRef.current.style.transform = 'scale(1) rotate(0deg)';
      return;
    }

    let isActive = true;

    const animate = () => {
      if (!isActive) return;
      const now = performance.now();

      // If drag stops moving for a while, target goes to 0
      if (lastTime.current && now - lastTime.current > 50) {
        targetTiltRef.current = 0;
      }

      // Physics constants for dangling pendulum feel
      const stiffness = 0.08;
      const damping = 0.85;

      const current = tiltRef.current;
      const target = targetTiltRef.current;

      // Calculate spring force
      const force = (target - current) * stiffness;
      tiltVelocityRef.current = (tiltVelocityRef.current + force) * damping;

      let next = current + tiltVelocityRef.current;

      // Stop loop if at rest and virtually straight
      if (Math.abs(next) < 0.1 && Math.abs(tiltVelocityRef.current) < 0.1) {
        next = 0;
        tiltRef.current = 0;
        tiltVelocityRef.current = 0;
        if (paperRef.current) paperRef.current.style.transform = `scale(1) rotate(0deg)`;
        return;
      }

      tiltRef.current = next;
      if (paperRef.current) {
        paperRef.current.style.transform = `scale(${dragging ? 1.03 : 1}) rotate(${next}deg)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      isActive = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [dragging]);

  return paperRef;
}
