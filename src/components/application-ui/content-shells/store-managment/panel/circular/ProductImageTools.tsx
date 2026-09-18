'use client';

/**
 * Herramientas de imagen para el catálogo de la tienda (tab Productos):
 *  - PasteReplaceDialog: confirmar el reemplazo de la imagen de una fila con lo pegado (Ctrl+V).
 *  - ProductEditorDialog: alta/edición de un producto con imagen pegada, subida, recortada
 *    del circular o generada con IA, y quitar fondo.
 *
 * Toda imagen que entra por acá termina como URL alojada. "Quitar fondo", el recorte del
 * circular y el pegado pasan por la limpieza IA (ai-service /product-image-edit): solo el
 * producto, sin precio ni texto, fondo transparente, HD, WebP liviano. El recorte del
 * circular se hace EN EL SERVIDOR (caja en %): el flyer es de otro origen y un canvas del
 * navegador quedaría bloqueado por CORS.
 */

import { circularService, type StoreProduct } from '@/services/circular.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import CropRoundedIcon from '@mui/icons-material/CropRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import LayersClearOutlinedIcon from '@mui/icons-material/LayersClearOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

/* ─────────────── helpers ─────────────── */

/** Imagen dentro de un evento de pegado (captura de pantalla, "copiar imagen"…). */
export function imageFromPaste(e: ClipboardEvent | React.ClipboardEvent): File | null {
  const items = (e as ClipboardEvent).clipboardData?.items;
  if (!items) return null;
  for (const it of Array.from(items)) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) return new File([f], f.name && f.name !== 'image.png' ? f.name : `pegada-${Date.now()}.png`, { type: f.type });
    }
  }
  return null;
}

/** ¿El foco está en un campo de texto? Ahí Ctrl+V es del campo, no nuestro. */
export const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

const checker = {
  backgroundColor: '#fff',
  backgroundImage:
    'linear-gradient(45deg,#e6e6e6 25%,transparent 25%),linear-gradient(-45deg,#e6e6e6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e6e6e6 75%),linear-gradient(-45deg,transparent 75%,#e6e6e6 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
} as const;

const CLEANING = 'Limpiando con IA: solo el producto, sin precio ni fondo (30 a 60 s)…';

const errMsg = (e: any, fallback: string) => e?.response?.data?.error || e?.message || fallback;

/** Limpieza IA: deja SOLO el producto (sin precio, texto ni fondo), en HD, sobre su tabla si
 *  es comida fresca. Es la misma que usa la extracción del circular. El recortador local
 *  gratis sólo borraba el fondo: el precio y las letras quedaban pegados al producto. */
async function aiClean(imageUrl: string, name?: string, box?: PctBox): Promise<string> {
  const r = await circularService.aiCleanProductImage(imageUrl, name, box);
  if (!r?.imageUrl) throw new Error('La IA no devolvió la imagen');
  return r.imageUrl;
}

/** Sube el archivo y, si se pide, lo limpia con IA. Devuelve la URL final. */
async function hostImage(file: File, opts: { clean: boolean; name?: string }): Promise<string> {
  const up = await uploadCampaignImage(file, 'store-products');
  return opts.clean ? aiClean(up.url, opts.name) : up.url;
}

/* ─────────────── 1 · Pegar sobre una fila ─────────────── */

export function PasteReplaceDialog({
  file,
  product,
  onClose,
  onDone,
}: {
  file: File | null;
  product: StoreProduct | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [removeBg, setRemoveBg] = useState(true);
  const [busy, setBusy] = useState(false);
  const [localUrl, setLocalUrl] = useState('');

  useEffect(() => {
    if (!file) return setLocalUrl('');
    const u = URL.createObjectURL(file);
    setLocalUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const confirm = async () => {
    if (!file || !product) return;
    setBusy(true);
    try {
      const url = await hostImage(file, { clean: removeBg, name: product.name });
      await circularService.updateStoreProduct(product._id, { imageUrl: url });
      toast.success(`Imagen de "${product.name}" reemplazada`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(errMsg(e, 'No se pudo reemplazar la imagen'));
    } finally {
      setBusy(false);
    }
  };

  const pane = (label: string, src?: string) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ ...checker, height: 190, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <Typography variant="caption" color="text.secondary">Sin imagen</Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Dialog open={!!file && !!product} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        Reemplazar imagen
        <Typography variant="body2" color="text.secondary">{product?.name}</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" gap={2} sx={{ mt: 1 }}>
          {pane('Actual', product?.imageUrl)}
          {pane('Nueva (pegada)', localUrl)}
        </Stack>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Checkbox checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} disabled={busy} />}
          label="Limpiar con IA: solo el producto, sin precio ni fondo, en HD"
        />
        {busy && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
        {busy && removeBg && (
          <Typography variant="caption" color="text.secondary">La IA tarda entre 30 y 60 segundos. No cierres la ventana.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant="contained" onClick={confirm} disabled={busy}>
          {busy ? (removeBg ? 'Limpiando con IA…' : 'Subiendo…') : 'Reemplazar imagen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─────────────── 2 · Recortar del circular ─────────────── */

type PctBox = { x: number; y: number; w: number; h: number };

/** Arrastrar un rectángulo sobre el circular. Devuelve la caja en % (0–100) de la imagen. */
function FlyerCropper({ flyerUrl, onCancel, onCrop, busy }: { flyerUrl: string; onCancel: () => void; onCrop: (b: PctBox) => void; busy: boolean }) {
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
    setBox({ x: Math.min(start.current.x, p.x), y: Math.min(start.current.y, p.y), w: Math.abs(p.x - start.current.x), h: Math.abs(p.y - start.current.y) });
  };
  const up = () => { start.current = null; };
  const valid = !!box && box.w > 1.5 && box.h > 1.5;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Arrastrá un rectángulo alrededor del producto (no importa si entra el precio). La IA deja
        solo el producto, sin precio ni fondo, en alta definición.
      </Typography>
      <Box sx={{ maxHeight: '56vh', overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box
          ref={wrap}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          sx={{ position: 'relative', cursor: busy ? 'progress' : 'crosshair', touchAction: 'none', userSelect: 'none', lineHeight: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flyerUrl} alt="Circular" draggable={false} style={{ width: '100%', height: 'auto', display: 'block' }} />
          {box && (
            <Box
              sx={{
                position: 'absolute', left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`,
                border: '2px solid', borderColor: 'primary.main', bgcolor: 'rgba(252,12,131,.14)', boxShadow: '0 0 0 9999px rgba(0,0,0,.35)', pointerEvents: 'none',
              }}
            />
          )}
        </Box>
      </Box>
      {busy && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
      <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 1.5 }}>
        <Button onClick={onCancel} disabled={busy}>Volver</Button>
        <Button variant="contained" disabled={!valid || busy} onClick={() => box && onCrop(box)}>
          {busy ? 'Limpiando con IA (30 a 60 s)…' : 'Usar este recorte'}
        </Button>
      </Stack>
    </Box>
  );
}

/* ─────────────── 3 · Alta / edición de producto ─────────────── */

export function ProductEditorDialog({
  open,
  product,
  storeSlug,
  flyerUrl,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = producto nuevo */
  product: StoreProduct | null;
  storeSlug: string;
  /** Imagen del circular vigente (o su primera página renderizada) para "Recortar del circular". */
  flyerUrl?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [regular, setRegular] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null); // texto de lo que se está haciendo
  const [cropping, setCropping] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // El listener de pegado vive fuera del render: lee el nombre actual por ref.
  const nameRef = useRef('');
  nameRef.current = name.trim();

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? '');
    setPrice(product?.price ?? '');
    setRegular(product?.originalPrice ?? '');
    setImageUrl(product?.imageUrl ?? '');
    setCropping(false);
    setBusy(null);
  }, [open, product]);

  const run = useCallback(async (label: string, fn: () => Promise<void>, fail: string) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      toast.error(errMsg(e, fail));
    } finally {
      setBusy(null);
    }
  }, []);

  // Subida o soltada: se aloja tal cual (suele ser una foto ya buena; "Quitar fondo" la limpia).
  // Pegada: casi siempre es una captura del flyer con precio → se muestra y se limpia sola con IA.
  // Si la IA falla queda la captura alojada, no se pierde nada.
  const takeFile = useCallback(
    (file: File, clean = false) =>
      run(clean ? 'Subiendo captura…' : 'Subiendo imagen…', async () => {
        const raw = await hostImage(file, { clean: false });
        setImageUrl(raw);
        if (!clean) return;
        setBusy(CLEANING);
        setImageUrl(await aiClean(raw, nameRef.current || undefined));
      }, clean ? 'La IA no pudo limpiar la captura; quedó tal cual' : 'No se pudo subir la imagen'),
    [run]
  );

  // Ctrl+V en cualquier parte del modal (salvo dentro de un campo de texto con texto en el portapapeles).
  useEffect(() => {
    if (!open || cropping) return;
    const onPaste = (e: ClipboardEvent) => {
      const f = imageFromPaste(e);
      if (!f) return; // texto: que lo maneje el campo
      e.preventDefault();
      void takeFile(f, true);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, cropping, takeFile]);

  const removeBg = () =>
    run(CLEANING, async () => setImageUrl(await aiClean(imageUrl, name.trim() || undefined)), 'No se pudo limpiar la imagen');

  const generate = () =>
    run('Generando con IA…', async () => {
      const r = await circularService.aiProductImage(name.trim(), product?.category);
      setImageUrl(r.imageUrl);
    }, 'La IA no pudo generar la imagen');

  const cropFromFlyer = (box: PctBox) =>
    run(CLEANING, async () => {
      setImageUrl(await aiClean(flyerUrl as string, name.trim() || undefined, box));
      setCropping(false);
    }, 'No se pudo recortar el circular');

  const save = () =>
    run('Guardando…', async () => {
      const body = { name: name.trim(), price: price.trim(), originalPrice: regular.trim(), imageUrl };
      if (product) {
        await circularService.updateStoreProduct(product._id, { ...body, hasOffer: !!body.originalPrice || product.hasOffer } as any);
      } else {
        await circularService.createStoreProduct({ storeSlug, ...body });
      }
      toast.success(product ? 'Producto actualizado' : 'Producto agregado');
      onSaved();
      onClose();
    }, 'No se pudo guardar el producto');

  const canSave = !!name.trim() && !!price.trim() && !busy;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth={cropping ? 'md' : 'sm'} fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        {cropping ? 'Recortar del circular' : product ? 'Editar producto' : 'Agregar producto'}
        {!cropping && (
          <Typography variant="body2" color="text.secondary">
            Verificá los datos y la imagen. Podés pegar una captura con Ctrl+V.
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {cropping && flyerUrl ? (
          <FlyerCropper flyerUrl={flyerUrl} busy={!!busy} onCancel={() => setCropping(false)} onCrop={cropFromFlyer} />
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2.5} sx={{ mt: 1 }}>
            {/* Imagen + herramientas */}
            <Box sx={{ width: { xs: '100%', sm: 250 }, flexShrink: 0 }}>
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith('image/'));
                  if (f) void takeFile(f);
                }}
                sx={{ ...checker, height: 230, borderRadius: 2, border: '1px dashed', borderColor: 'divider', display: 'grid', placeItems: 'center', overflow: 'hidden', p: 1 }}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <Stack alignItems="center" gap={0.5} sx={{ color: 'text.secondary', textAlign: 'center', px: 2 }}>
                    <ContentPasteRoundedIcon />
                    <Typography variant="caption">Pegá (Ctrl+V), soltá o subí una imagen</Typography>
                  </Stack>
                )}
              </Box>
              {busy && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, minHeight: 18 }}>
                {busy || (imageUrl ? 'El cuadriculado indica transparencia.' : '')}
              </Typography>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) void takeFile(f);
                }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
                <Button size="small" variant="outlined" startIcon={<CloudUploadOutlinedIcon />} disabled={!!busy} onClick={() => fileInput.current?.click()}>
                  Subir
                </Button>
                <Button size="small" variant="outlined" startIcon={<CropRoundedIcon />} disabled={!!busy || !flyerUrl} onClick={() => setCropping(true)}>
                  Recortar circular
                </Button>
                <Button size="small" variant="outlined" startIcon={<LayersClearOutlinedIcon />} disabled={!!busy || !imageUrl} onClick={removeBg}>
                  Quitar fondo
                </Button>
                <Button size="small" variant="outlined" startIcon={<AutoAwesomeOutlinedIcon />} disabled={!!busy || !name.trim()} onClick={generate}>
                  Generar IA
                </Button>
              </Box>
              {imageUrl && (
                <Button size="small" color="inherit" disabled={!!busy} onClick={() => setImageUrl('')} sx={{ mt: 0.5 }}>
                  Quitar imagen
                </Button>
              )}
            </Box>

            {/* Datos */}
            <Stack gap={1.75} sx={{ flex: 1, minWidth: 0 }}>
              <TextField label="Nombre del producto" size="small" fullWidth value={name} onChange={(e) => setName(e.target.value)} autoFocus={!product} />
              <TextField label="Precio o promoción" size="small" fullWidth placeholder="$7.99 / lb o 2 / $5" value={price} onChange={(e) => setPrice(e.target.value)} />
              <TextField
                label="Precio regular"
                size="small"
                fullWidth
                placeholder="Opcional"
                value={regular}
                onChange={(e) => setRegular(e.target.value)}
                helperText="Sin precio regular el producto no aparece como oferta en las listas."
              />
              {!flyerUrl && (
                <Alert severity="info" sx={{ py: 0 }}>
                  Para recortar del circular, la tienda necesita un circular con archivo.
                </Alert>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      {!cropping && (
        <DialogActions>
          <Button onClick={onClose} disabled={!!busy}>Cancelar</Button>
          <Button variant="contained" onClick={save} disabled={!canSave}>
            {product ? 'Guardar cambios' : 'Guardar producto'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
