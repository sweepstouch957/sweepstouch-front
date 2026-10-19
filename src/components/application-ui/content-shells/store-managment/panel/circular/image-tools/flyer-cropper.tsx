'use client';

import { alpha, Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import type { PctBox } from './constants';

/** Arrastrar un rectángulo sobre el circular. Devuelve la caja en % (0–100) de la imagen.
 *  Lo usa también Shelfsigns (/admin/designs/shelfsigns): es el mismo gesto sobre el
 *  mismo arte, y tener dos recortadores distintos era garantía de que uno se pudra. */
export function FlyerCropper({
  flyerUrl,
  onCancel,
  onCrop,
  busy,
  hint,
  cta,
}: {
  flyerUrl: string;
  onCancel: () => void;
  onCrop: (b: PctBox) => void;
  busy: boolean;
  hint?: string;
  cta?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState<PctBox | null>(null);

  const pos = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const down = (e: React.PointerEvent) => {
    if (busy) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    start.current = pos(e);
    setBox(null);
  };
  const move = (e: React.PointerEvent) => {
    if (!start.current) return;
    const p = pos(e);
    setBox({
      x: Math.min(start.current.x, p.x),
      y: Math.min(start.current.y, p.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    });
  };
  const up = () => {
    start.current = null;
  };
  const valid = !!box && box.w > 1.5 && box.h > 1.5;

  return (
    <Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1 }}
      >
        {hint ||
          'Arrastrá un rectángulo alrededor del producto (no importa si entra el precio). La IA deja solo el producto, sin precio ni fondo, en alta definición.'}
      </Typography>
      <Box
        sx={{
          maxHeight: '56vh',
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box
          ref={wrap}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          sx={{
            position: 'relative',
            cursor: busy ? 'progress' : 'crosshair',
            touchAction: 'none',
            userSelect: 'none',
            lineHeight: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flyerUrl}
            alt="Circular"
            draggable={false}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          {box && (
            <Box
              sx={(t) => ({
                position: 'absolute',
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.w}%`,
                height: `${box.h}%`,
                border: '2px solid',
                borderColor: 'primary.main',
                bgcolor: alpha(t.palette.primary.main, 0.14),
                // Oscurece todo lo que queda fuera del recorte (no es sombra de tarjeta).
                boxShadow: `0 0 0 9999px ${alpha(t.palette.common.black, 0.35)}`,
                pointerEvents: 'none',
              })}
            />
          )}
        </Box>
      </Box>
      {busy && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
      <Stack
        direction="row"
        justifyContent="flex-end"
        gap={1}
        sx={{ mt: 1.5 }}
      >
        <Button
          onClick={onCancel}
          disabled={busy}
        >
          Volver
        </Button>
        <Button
          variant="contained"
          disabled={!valid || busy}
          onClick={() => box && onCrop(box)}
        >
          {busy ? 'Limpiando con IA (30 a 60 s)…' : cta || 'Usar este recorte'}
        </Button>
      </Stack>
    </Box>
  );
}
