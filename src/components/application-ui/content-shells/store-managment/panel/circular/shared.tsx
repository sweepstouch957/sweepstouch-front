'use client';

/** Helpers y piezas que comparten las secciones del tab Circular & Listas. */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export type PanelProps = {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  provider?: string;
  infobipSenderId?: string;
  address?: string;
  /** Link del circular de la tienda (api.circularss.com/dl/xxx): de ahí se trae el PDF de la semana. */
  circularssUrl?: string;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (v: number | null | undefined) => usd.format(Number(v ?? 0));

// Un solo formateador (crear uno por llamada en listas largas se nota).
const dateFmt = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—');

/** Precio por unidad desde el string del flyer: "$2.99", "99¢/lb", "2/$5". */
export function parsePriceNum(price?: string | null): number {
  if (!price) return 0;
  const s = String(price);
  const multi = s.match(/(\d+)\s*\/\s*\$?([\d.]+)/);
  if (multi) {
    const n = parseInt(multi[1], 10);
    const t = parseFloat(multi[2]);
    return n > 0 ? t / n : t;
  }
  if (s.includes('¢')) return (parseFloat(s.replace(/[^0-9.]/g, '')) || 0) / 100;
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

/** Regular estimado = oferta × 1.25 — misma regla que circular-service. */
export function regularFromPrice(price?: string | null): string | null {
  const unit = parsePriceNum(price);
  return unit > 0 ? `$${(unit * 1.25).toFixed(2)}` : null;
}

export const STATUS_CHIP: Record<
  string,
  { label: string; color: 'success' | 'warning' | 'default' | 'info' }
> = {
  active: { label: 'Activo', color: 'success' },
  scheduled: { label: 'Agendado', color: 'info' },
  expired: { label: 'Vencido', color: 'default' },
  draft: { label: 'Borrador', color: 'warning' },
  archived: { label: 'Archivado', color: 'default' },
  pending: { label: 'Pendiente', color: 'warning' },
  validated: { label: 'Validada', color: 'success' },
};
export const statusChip = (s: string) => STATUS_CHIP[s] || { label: s, color: 'default' as const };

export const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;

export const CATEGORIES = [
  'meat',
  'seafood',
  'produce',
  'dairy',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'deli',
  'other',
] as const;

/** Los títulos autogenerados ("Circular super-supermarket-30-…-usa (2026-09-14 → …)") no se
 *  leen: se muestran como "Circular semanal" y las fechas van aparte. */
export function circularLabel(c: { title?: string }, storeSlug: string, storeName?: string) {
  const t = String(c.title || '').trim();
  if (!t) return 'Circular';
  const low = t.toLowerCase();
  const generic =
    /\(\d{4}-\d{2}-\d{2}\s*→/.test(t) ||
    (!!storeSlug && low.includes(storeSlug.toLowerCase())) ||
    (!!storeName && low === storeName.toLowerCase());
  return generic ? 'Circular semanal' : t.replace(/^Campaña:\s*/, '');
}

const CHECKER =
  'linear-gradient(45deg,#e6e6e6 25%,transparent 25%),linear-gradient(-45deg,#e6e6e6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e6e6e6 75%),linear-gradient(-45deg,transparent 75%,#e6e6e6 75%)';

/** Imagen en grande sobre cuadriculado: si de verdad no tiene fondo, se ven los cuadros
 *  detrás del producto. Muestra formato y tamaño reales para revisar calidad. */
export function ImagePreviewDialog({
  url,
  title,
  onClose,
}: {
  url: string | null;
  title?: string;
  onClose: () => void;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const ext = (url?.split('?')[0].match(/\.([a-z0-9]{3,4})$/i)?.[1] || '').toUpperCase();
  return (
    <Dialog
      open={!!url}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        {title || 'Vista previa'}
        <Typography
          variant="body2"
          color="text.secondary"
          display="block"
        >
          {[ext, size ? `${size.w} × ${size.h} px` : null].filter(Boolean).join(' · ') ||
            'Cargando…'}
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ p: 0 }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            minHeight: 320,
            maxHeight: '70vh',
            overflow: 'auto',
            p: 2,
            backgroundColor: '#fff',
            backgroundImage: CHECKER,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
          }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={title || ''}
              onLoad={(e) =>
                setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {url && (
          <Button
            component="a"
            href={url}
            target="_blank"
            rel="noopener"
          >
            Abrir original
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
