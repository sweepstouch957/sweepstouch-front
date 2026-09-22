'use client';

// Pre-RCS de la tienda desde el panel admin: la misma lógica que el merchant
// tiene en su portal (circular + catálogo + validación de listas), más las
// métricas de compras por recibo. Todo contra endpoints ya existentes de
// circular-service y tracking-service.

import { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import { applyCatalogOrder, moveCatalogItem } from './catalog-order';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { imageFromPaste, PasteReplaceDialog, ProductEditorDialog } from './ProductImageTools';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  circularService,
  type Circular,
  type StoreProduct,
} from '@/services/circular.service';
import { campaignClient } from '@/services/campaing.service';
import {
  shoppingListsService,
  shoppingListsQK,
  type AdminShoppingList,
  type ShoppingListStatus,
} from '@/services/shopping-lists.service';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Link as MuiLink,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import TestMmsShoppingListModal from '@/components/mms/TestMmsShoppingListModal';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import StoreBannerSection from './StoreBannerSection';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (v: number | null | undefined) => usd.format(Number(v ?? 0));

/** Precio por unidad desde el string del flyer: "$2.99", "99¢/lb", "2/$5". */
function parsePriceNum(price?: string | null): number {
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
function regularFromPrice(price?: string | null): string | null {
  const unit = parsePriceNum(price);
  return unit > 0 ? `$${(unit * 1.25).toFixed(2)}` : null;
}
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'default' | 'info' }> = {
  active: { label: 'Activo', color: 'success' },
  scheduled: { label: 'Agendado', color: 'info' },
  expired: { label: 'Vencido', color: 'default' },
  draft: { label: 'Borrador', color: 'warning' },
  archived: { label: 'Archivado', color: 'default' },
  pending: { label: 'Pendiente', color: 'warning' },
  validated: { label: 'Validada', color: 'success' },
};

const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;

const CATEGORIES = [
  'meat', 'seafood', 'produce', 'dairy', 'bakery', 'frozen', 'pantry', 'beverages', 'deli', 'other',
] as const;

type Props = {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  provider?: string;
  infobipSenderId?: string;
  address?: string;
  /** Link del circular de la tienda (api.circularss.com/dl/xxx): de ahí se trae el PDF de la semana. */
  circularssUrl?: string;
};

/* ═══════════════ Visor de imagen (producto o circular) ═══════════════ */

/** Imagen en grande sobre fondo cuadriculado: si de verdad no tiene fondo, se ven
 *  los cuadros detrás del producto. Muestra formato y tamaño reales para revisar calidad. */
function ImagePreviewDialog({ url, title, onClose }: { url: string | null; title?: string; onClose: () => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const ext = (url?.split('?')[0].match(/\.([a-z0-9]{3,4})$/i)?.[1] || '').toUpperCase();
  return (
    <Dialog open={!!url} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {title || 'Vista previa'}
        <Typography variant="caption" color="text.secondary" display="block">
          {[ext, size ? `${size.w} × ${size.h} px` : null].filter(Boolean).join(' · ') || 'Cargando…'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            minHeight: 320,
            maxHeight: '70vh',
            overflow: 'auto',
            p: 2,
            // Cuadriculado de transparencia
            backgroundColor: '#fff',
            backgroundImage:
              'linear-gradient(45deg,#e6e6e6 25%,transparent 25%),linear-gradient(-45deg,#e6e6e6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e6e6e6 75%),linear-gradient(-45deg,transparent 75%,#e6e6e6 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
          }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={title || ''}
              onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {url && (
          <Button component="a" href={url} target="_blank" rel="noopener">
            Abrir original
          </Button>
        )}
        <Button variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ═══════════════ 1 · Circular (agendar + mensaje de prueba) ═══════════════ */

function CircularSection({ storeId, storeSlug, storeName, provider, infobipSenderId, address, circularssUrl }: Props) {
  const qc = useQueryClient();
  const circulars = useQuery({
    queryKey: ['store-circulars', storeSlug],
    queryFn: () => circularService.getByStore(storeSlug),
    enabled: !!storeSlug,
  });

  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Extracción IA por circular. Tarda ~1 min; si el cliente corta antes, la
  // extracción sigue en el servidor y aparece al refrescar.
  // Cuántos extraer: "los primeros X" = los de foto grande (rápido, recortes limpios).
  // Los chiquitos quedan para "Agregar los que faltan". 0 = todos de una.
  const [maxProducts, setMaxProducts] = useState(20);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  // Arte de campaña: se pregunta antes cuántos extraer y si se limpian las imágenes.
  const [campaignAsk, setCampaignAsk] = useState(false);
  const [campaignMax, setCampaignMax] = useState(10);
  const [campaignClean, setCampaignClean] = useState(true);
  // Crear el circular con el arte de campaña: apagado a propósito. Antes se creaba solo y
  // quedaba activo, o sea que el arte de una campaña se volvía el circular de la semana
  // para el linktree y el Pre-RCS sin que nadie lo decidiera.
  const [createCircular, setCreateCircular] = useState(false);

  const extract = useMutation({
    mutationFn: (circularId: string) => circularService.extractProducts(circularId, maxProducts),
    onSuccess: (d: any) => {
      toast.success(`IA: ${d?.circular?.products?.length ?? 0} productos extraídos. Las imágenes se limpian en segundo plano.`);
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) => {
      // Si el servidor RESPONDIÓ con error, la extracción falló de verdad: se muestra el
      // motivo. Sólo cuando no hubo respuesta (timeout del navegador, ~1 min) puede seguir
      // corriendo en el servidor. Antes todo caía en "sigue corriendo" y un fallo real
      // quedaba tapado para siempre.
      if (e?.response) {
        toast.error(`No se pudieron extraer los productos: ${e.response.data?.error || `error ${e.response.status}`}`, { duration: 9000 });
      } else {
        toast('La extracción sigue corriendo en el servidor. Refresca en un minuto.');
      }
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
    },
  });

  // Circular que YA tiene productos → pasarlos al catálogo de la tienda (lo que ve
  // el Pre-RCS). No re-extrae; las imágenes se limpian solas en segundo plano.
  const loadCatalog = useMutation({
    mutationFn: (circularId: string) => circularService.loadCatalogFromCircular(circularId),
    onSuccess: (d) => {
      toast.success(
        `${d.productCount} productos cargados al catálogo` +
          (d.pendingImages ? ` · ${d.pendingImages} imágenes se están limpiando (sin fondo, livianas para web)` : '')
      );
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo cargar el catálogo'),
  });

  // Segunda pasada por secciones: trae los productos chicos que la primera dejó afuera.
  const addMissing = useMutation({
    mutationFn: (circularId: string) => circularService.addMissingProducts(circularId),
    onSuccess: (d) => {
      toast.success(d.added ? `${d.added} productos nuevos agregados (de ${d.found} encontrados)` : 'No había productos nuevos para agregar');
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) =>
      e?.response
        ? toast.error(`No se pudieron agregar productos: ${e.response.data?.error || `error ${e.response.status}`}`, { duration: 9000 })
        : toast('La extracción sigue corriendo en el servidor. Refresca en unos minutos.'),
  });

  // Arte de la última campaña con imagen: otra fuente de productos (trae las carnes y
  // ofertas fuertes de la semana, que suelen venir en su tabla/pedestal).
  const lastCampaign = useQuery({
    queryKey: ['store-last-campaign-image', storeId],
    queryFn: () => campaignClient.getLastCampaign(storeId, { withImage: true }).catch(() => null),
    enabled: !!storeId,
    staleTime: 5 * 60_000,
  });

  // Con circular vigente → se SUMAN a ese circular los productos que falten.
  // Sin circular → se crea el de esta semana con esa imagen como flyer y se extrae.
  const loadFromCampaign = useMutation({
    mutationFn: async ({ imageUrl, targetId, max, aiImages }: { imageUrl: string; targetId?: string; max: number; aiImages: boolean }) => {
      // La cantidad y si se limpian las imágenes se PREGUNTAN antes (campaignAsk): un arte
      // puede traer 40 productos y cada imagen limpia por IA cuesta.
      // Crear circular es una decisión de la tienda, no un efecto secundario de leer un arte:
      // el circular que se creaba acá quedaba ACTIVO y pasaba a ser el de la semana en el
      // linktree y el Pre-RCS. Sin circular destino, sólo se crea si se pidió expresamente.
      if (targetId) {
        const d = await circularService.addProductsFromImage(targetId, imageUrl, max, { aiImages });
        return { mode: 'added' as const, added: d.added, found: d.found };
      }
      // Sin circular vigente el arte necesita una percha: se crea BORRADOR salvo que se
      // pida publicarlo. Un borrador no sale en el linktree ni en el Pre-RCS, así que los
      // productos se cargan igual sin cambiarle la semana a la tienda.
      const created = await circularService.createFromImageUrl(
        storeSlug,
        imageUrl,
        'Arte de la última campaña',
        { draft: !createCircular }
      );
      const ex = await circularService.extractProducts(created.circular._id, max, { aiImages });
      const n = ex?.circular?.products?.length ?? 0;
      return { mode: createCircular ? ('created' as const) : ('draft' as const), added: n, found: n };
    },
    onSuccess: (d) => {
      toast.success(
        d.mode === 'added'
          ? d.added
            ? `${d.added} productos nuevos sumados desde la campaña (de ${d.found} encontrados)`
            : 'Todos los productos de la campaña ya estaban cargados'
          : d.mode === 'draft'
            ? `${d.added} productos cargados desde la campaña. Quedaron en un borrador: la tienda sigue sin circular de la semana.`
            : `Circular creado desde la campaña: ${d.added} productos. Las imágenes se limpian en segundo plano.`
      );
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) => {
      if (e?.response) toast.error(`No se pudo cargar desde la campaña: ${e.response.data?.error || `error ${e.response.status}`}`, { duration: 9000 });
      else toast('La extracción sigue corriendo en el servidor. Refresca en unos minutos.');
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
    },
  });

  // Ver el circular: si es PDF el servidor renderiza la primera página (una vez, queda cacheada).
  const openCircularPreview = useMutation({
    mutationFn: async (c: Circular) => {
      const direct = (c as any).previewImageUrl || (/\.(png|jpe?g|webp)(\?|$)/i.test(c.fileUrl || '') ? c.fileUrl : '');
      if (direct) return direct as string;
      return (await circularService.getPreviewImage(c._id)).url;
    },
    onSuccess: (url, c) => setPreview({ url, title: c.title || 'Circular' }),
    onError: () => toast.error('No se pudo generar la vista previa del circular'),
  });

  // Sin circular vigente en la base: se trae el PDF de la semana desde el link de la
  // tienda, se crea el circular de esta semana y la extracción arranca sola.
  const importFromUrl = useMutation({
    mutationFn: () => circularService.importFromStoreUrl(storeSlug),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      toast.success('Circular de la semana importado — extrayendo productos con IA…');
      if (d?.circular?._id) extract.mutate(d.circular._id);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo traer el circular'),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!start || !end) throw new Error('Fechas de inicio y fin son obligatorias');
      if (file) {
        return circularService.upload({ file, storeSlug, startDate: start, endDate: end, title: title || undefined });
      }
      return circularService.schedule({ storeSlug, startDate: start, endDate: end, title: title || undefined });
    },
    onSuccess: (d: any) => {
      setTitle(''); setStart(''); setEnd(''); setFile(null);
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      // Con PDF la extracción arranca sola: antes el circular quedaba agendado
      // con 0 productos y el Pre-RCS salía vacío.
      if (file && d?.circular?._id) {
        toast.success('Circular subido — extrayendo productos con IA…');
        extract.mutate(d.circular._id);
      } else {
        toast.success('Circular agendado (sin archivo aún)');
      }
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || e.message || 'No se pudo agendar'),
  });

  const items: Circular[] = circulars.data?.items ?? [];
  // El circular vigente (o el próximo): sus productos alimentan el mensaje de prueba
  // Prioridad: el ACTIVO; si no hay, el próximo agendado; si no, el más reciente.
  const activeCircular =
    items.find((c) => c.status === 'active') ||
    items.find((c) => c.status === 'scheduled') ||
    items[0] ||
    null;
  const activeProducts: number = (activeCircular as any)?.products?.length ?? 0;
  const busyExtract = extract.isPending || addMissing.isPending;
  // El vigente (activo o agendado): a ese se le suman los productos de la campaña.
  const currentCircular = items.find((c) => c.status === 'active') || items.find((c) => c.status === 'scheduled') || null;
  const campaignImage: string = (lastCampaign.data as any)?.image || '';
  // ¿Hay uno vigente o por venir? Si no, se ofrece traerlo del link de la tienda.
  const hasCurrent = items.some((c) => c.status === 'active' || c.status === 'scheduled');

  return (
    <Stack spacing={2}>
      {/* Sin circular vigente (ni activo ni agendado): casi siempre el PDF de la semana
          está en el link de circular de la tienda. Se trae de ahí en un click. */}
      {!circulars.isLoading && !hasCurrent && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Esta tienda no tiene circular vigente
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {circularssUrl
                  ? 'Se puede traer el PDF de esta semana desde el link de circular de la tienda. Se crea el circular de la semana actual y la IA carga sus productos al catálogo.'
                  : 'La tienda no tiene link de circular configurado. Subí el PDF abajo, o cargá el link en los datos de la tienda.'}
              </Typography>
              {circularssUrl && (
                <MuiLink
                  href={/^https?:\/\//i.test(circularssUrl) ? circularssUrl : `https://${circularssUrl}`}
                  target="_blank"
                  rel="noopener"
                  variant="caption"
                >
                  Ver el link de la tienda
                </MuiLink>
              )}
            </Box>
            <Button
              variant="contained"
              disabled={!circularssUrl || importFromUrl.isPending || extract.isPending}
              onClick={() => importFromUrl.mutate()}
            >
              {importFromUrl.isPending ? 'Trayendo circular…' : extract.isPending ? 'Extrayendo…' : 'Traer circular de la semana'}
            </Button>
          </Stack>
          {(importFromUrl.isPending || extract.isPending) && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
        </Paper>
      )}

      {/* Circular vigente → cargar sus productos. Con productos: van al catálogo tal
          cual. Sin productos pero con archivo: se extraen con IA (y eso ya los carga). */}
      {activeCircular && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="subtitle2" fontWeight={700}>
                  {activeCircular.status === 'active' ? 'Circular activo' : 'Circular más reciente'}
                </Typography>
                <Chip size="small" {...(STATUS_CHIP[activeCircular.status] || { label: activeCircular.status, color: 'default' })} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {activeCircular.title || 'Sin título'} · {fmtDate(activeCircular.startDate)} → {fmtDate(activeCircular.endDate)} ·{' '}
                {activeProducts} producto{activeProducts !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {activeProducts > 0
                  ? 'Cargá estos productos al catálogo (lo que ve el cliente en sus listas), o sumá los chicos que faltan. Las imágenes quedan sin fondo, con su tabla o pedestal, y livianas para web.'
                  : activeCircular.fileUrl
                    ? 'Este circular todavía no tiene productos. Elegí cuántos extraer: primero los de foto grande, y después sumás los chicos con "Agregar los que faltan".'
                    : 'Adjuntá el PDF o la imagen del circular para poder cargar sus productos.'}
              </Typography>
            </Box>
            {activeCircular.fileUrl && (
              <Button
                variant="outlined"
                disabled={openCircularPreview.isPending}
                onClick={() => openCircularPreview.mutate(activeCircular)}
              >
                {openCircularPreview.isPending ? 'Abriendo…' : 'Ver circular'}
              </Button>
            )}
          </Stack>

          {/* Acciones de extracción */}
          {activeCircular.fileUrl && (
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.25} sx={{ mt: 1.75 }}>
              <TextField
                select
                size="small"
                label="Cantidad a extraer"
                value={maxProducts}
                onChange={(e) => setMaxProducts(Number(e.target.value))}
                disabled={busyExtract}
                sx={{ width: 210 }}
                helperText={maxProducts ? 'Los de foto más grande primero' : 'Por secciones: tarda varios minutos'}
              >
                {[10, 20, 30, 50].map((n) => (
                  <MenuItem key={n} value={n}>Los primeros {n}</MenuItem>
                ))}
                <MenuItem value={0}>Todos los productos</MenuItem>
              </TextField>
              <Button
                variant={activeProducts > 0 ? 'outlined' : 'contained'}
                disabled={busyExtract}
                onClick={() => {
                  if (activeProducts > 0 && !window.confirm('Volver a extraer REEMPLAZA los productos de este circular. ¿Continuar?')) return;
                  extract.mutate(activeCircular._id);
                }}
                sx={{ alignSelf: 'flex-start', mt: 0.25 }}
              >
                {extract.isPending ? 'Extrayendo…' : activeProducts > 0 ? 'Volver a extraer' : 'Extraer productos (IA)'}
              </Button>
              {activeProducts > 0 && (
                <>
                  <Button
                    variant="outlined"
                    disabled={busyExtract}
                    onClick={() => addMissing.mutate(activeCircular._id)}
                    sx={{ alignSelf: 'flex-start', mt: 0.25 }}
                  >
                    {addMissing.isPending ? 'Buscando los que faltan…' : 'Agregar los que faltan (chicos)'}
                  </Button>
                  <Button
                    variant="contained"
                    disabled={busyExtract || loadCatalog.isPending}
                    onClick={() => loadCatalog.mutate(activeCircular._id)}
                    sx={{ alignSelf: 'flex-start', mt: 0.25 }}
                  >
                    {loadCatalog.isPending ? 'Cargando…' : 'Cargar productos al catálogo'}
                  </Button>
                </>
              )}
            </Stack>
          )}
          {(loadCatalog.isPending || busyExtract) && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
        </Paper>
      )}

      {/* Otra fuente: el arte de la última campaña (MMS). */}
      {campaignImage && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
            <Box
              component="button"
              type="button"
              aria-label="Ver el arte de la campaña en grande"
              onClick={() => setPreview({ url: campaignImage, title: lastCampaign.data?.title || 'Arte de la campaña' })}
              sx={{
                width: 64, height: 88, p: 0, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden',
                border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', cursor: 'zoom-in',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={campaignImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Arte de la última campaña
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {lastCampaign.data?.title || 'Sin título'}
                {lastCampaign.data?.startDate ? ` · ${fmtDate(lastCampaign.data.startDate as any)}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {currentCircular
                  ? 'Suma al circular vigente los productos de esta imagen que todavía no estén. No toca los que ya tenés.'
                  : 'No hay circular esta semana: los productos quedan en un borrador, sin publicarse, salvo que lo pidas en el diálogo.'}{' '}
                Antes de empezar te pregunta cuántos extraer.
              </Typography>
            </Box>
            <Button
              variant="contained"
              disabled={loadFromCampaign.isPending || busyExtract}
              onClick={() => setCampaignAsk(true)}
            >
              {loadFromCampaign.isPending ? 'Leyendo la imagen…' : 'Cargar productos de la campaña'}
            </Button>
          </Stack>
          {loadFromCampaign.isPending && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
        </Paper>
      )}

      {/* Antes de leer el arte de campaña: cuántos y si se limpian las imágenes. Un arte puede
          traer 40 productos y lo caro es la imagen limpia por IA (una generación por producto). */}
      <Dialog open={campaignAsk} onClose={() => setCampaignAsk(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>¿Cuántos productos extraer?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Un arte de campaña puede traer hasta 40 productos. Lo que más cuesta es la imagen limpia
            por IA: es una generación por cada producto.
          </Typography>
          <TextField
            select
            size="small"
            fullWidth
            label="Cantidad"
            value={campaignMax}
            onChange={(e) => setCampaignMax(Number(e.target.value))}
            helperText={campaignMax ? 'Primero los de foto más grande (carnes y ofertas principales).' : 'Todos: por secciones, tarda varios minutos.'}
          >
            {[5, 10, 20, 30].map((n) => (
              <MenuItem key={n} value={n}>Los primeros {n}</MenuItem>
            ))}
            <MenuItem value={0}>Todos los productos</MenuItem>
          </TextField>
          <Stack direction="row" alignItems="flex-start" gap={1} sx={{ mt: 1.5 }}>
            <Switch checked={campaignClean} onChange={(e) => setCampaignClean(e.target.checked)} />
            <Box sx={{ pt: 0.75 }}>
              <Typography variant="body2" fontWeight={600}>Limpiar las imágenes con IA ahora</Typography>
              <Typography variant="caption" color="text.secondary">
                {campaignClean
                  ? `Hasta ${campaignMax || 'todas las'} imágenes sin fondo, con su tabla o pedestal.`
                  : 'Quedan los recortes del arte. Después las limpiás desde Productos, de a una o todas.'}
              </Typography>
            </Box>
          </Stack>
          {!currentCircular && (
            <Stack direction="row" alignItems="flex-start" gap={1} sx={{ mt: 1.5 }}>
              <Switch checked={createCircular} onChange={(e) => setCreateCircular(e.target.checked)} />
              <Box sx={{ pt: 0.75 }}>
                <Typography variant="body2" fontWeight={600}>Publicarlo como el circular de la semana</Typography>
                <Typography variant="caption" color="text.secondary">
                  {createCircular
                    ? 'Queda activo: es el que verán el linktree y el Pre-RCS.'
                    : 'Apagado: los productos se cargan igual, en un borrador. La tienda sigue sin circular de la semana.'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCampaignAsk(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setCampaignAsk(false);
              loadFromCampaign.mutate({ imageUrl: campaignImage, targetId: currentCircular?._id, max: campaignMax, aiImages: campaignClean });
            }}
          >
            Extraer {campaignMax ? `${campaignMax} productos` : 'todos'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImagePreviewDialog key={preview?.url || 'none'} url={preview?.url ?? null} title={preview?.title} onClose={() => setPreview(null)} />

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Agendar circular
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Misma lógica que el portal del merchant: con PDF extrae productos; sin PDF queda
          agendado y el archivo se adjunta después. El cron lo activa solo al llegar la fecha.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
          <TextField size="small" label="Título" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ width: 200 }} />
          <TextField size="small" label="Inicio" type="date" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Fin" type="date" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button component="label" size="small" variant="outlined">
            {file ? file.name : 'PDF / imagen'}
            <input hidden type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={create.isPending || !start || !end}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Agendando…' : 'Agendar'}
          </Button>
        </Stack>
      </Paper>

      {circulars.isLoading ? (
        <LinearProgress />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Circular</TableCell>
                <TableCell sx={cell}>Vigencia</TableCell>
                <TableCell sx={cell}>Estado</TableCell>
                <TableCell sx={cell} align="right">Productos</TableCell>
                <TableCell sx={cell}>Archivo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell sx={cell}>{c.title || '—'}</TableCell>
                  <TableCell sx={cell}>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</TableCell>
                  <TableCell sx={cell}>
                    <Chip size="small" {...(STATUS_CHIP[c.status] || { label: c.status, color: 'default' })} />
                  </TableCell>
                  <TableCell sx={cell} align="right">
                    {(c as any).products?.length ?? 0}
                    {/* Con archivo pero sin productos: la extracción no corrió (o falló) */}
                    {c.fileUrl && !((c as any).products?.length) && (
                      <Button
                        size="small"
                        sx={{ ml: 1, minWidth: 0 }}
                        disabled={extract.isPending}
                        onClick={() => extract.mutate(c._id)}
                      >
                        {extract.isPending ? 'Extrayendo…' : 'Extraer (IA)'}
                      </Button>
                    )}
                    {/* Con productos: se pueden pasar al catálogo desde cualquier circular */}
                    {!!(c as any).products?.length && (
                      <Button
                        size="small"
                        sx={{ ml: 1, minWidth: 0 }}
                        disabled={loadCatalog.isPending}
                        onClick={() => loadCatalog.mutate(c._id)}
                      >
                        Cargar al catálogo
                      </Button>
                    )}
                  </TableCell>
                  <TableCell sx={cell}>
                    {c.fileUrl ? (
                      <MuiLink href={c.fileUrl} target="_blank" rel="noopener" variant="body2">Ver</MuiLink>
                    ) : (
                      <Typography variant="caption" color="text.disabled">sin archivo</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Esta tienda no tiene circulares.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Stack>
  );
}

/* ═══════════════ 2 · Productos (catálogo Pre-RCS) ═══════════════ */

function CatalogSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const catalog = useQuery({
    queryKey: ['store-catalog-admin', storeSlug],
    queryFn: () => circularService.getCatalogAdmin(storeSlug),
    enabled: !!storeSlug,
    // Mientras la IA limpia imágenes el catálogo se refresca solo: cada fila pasa de
    // "Generando…" a su foto final sin recargar.
    refetchInterval: (q) => (q.state.data?.cleaning ? 8000 : false),
  });
  const cleaning = !!catalog.data?.cleaning;
  const catalogContainerRef = useRef<HTMLDivElement>(null);
  const [catalogWidth, setCatalogWidth] = useState(0);
  useEffect(() => {
    const container = catalogContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setCatalogWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, [catalog.isLoading]);
  // Recorte crudo del flyer (trae precio y texto) o sin foto, con limpieza en curso:
  // no se muestra, para que nadie lo tome por la imagen final.
  const isGenerating = (p: StoreProduct) => cleaning && (!p.imageUrl || /\/circular-products\//.test(p.imageUrl));
  const generatingCount = cleaning ? (catalog.data?.items || []).filter(isGenerating).length : 0;
  const [search, setSearch] = useState('');
  const [pendingOrder, setPendingOrder] = useState<{ store: string; ids: string[] } | null>(null);
  const saveOrder = useMutation({
    mutationFn: ({ store, ids }: { store: string; ids: string[] }) =>
      circularService.saveCatalogOrder(store, ids),
    onMutate: async (order) => {
      setPendingOrder(order);
      await qc.cancelQueries({ queryKey: ['store-catalog-admin', order.store] });
    },
    onSuccess: (data, order) => {
      qc.setQueryData(['store-catalog-admin', order.store], data);
      toast.success('Orden guardado para las listas.');
    },
    onError: (error: Error) => toast.error(error.message || 'No se pudo guardar el orden.'),
    onSettled: async (_data, _error, order) => {
      try {
        // Reload even on partial failure: the screen must reflect what the backend actually saved.
        await qc.invalidateQueries({ queryKey: ['store-catalog-admin', order.store] });
      } finally {
        setPendingOrder(null);
      }
    },
  });
  // Imagen abierta en grande (para revisar recorte, calidad y que no tenga fondo)
  const [imgPreview, setImgPreview] = useState<{ url: string; title: string } | null>(null);

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      circularService.updateStoreProduct(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] }),
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const orderedItems = useMemo(
    () => applyCatalogOrder(catalog.data?.items ?? [], pendingOrder?.store === storeSlug ? pendingOrder.ids : []),
    [catalog.data, pendingOrder, storeSlug]
  );
  const items: StoreProduct[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? orderedItems.filter((p) => `${p.name} ${p.brand ?? ''}`.toLowerCase().includes(q)) : orderedItems;
  }, [orderedItems, search]);

  const handleCatalogDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index || saveOrder.isPending) return;
    const ids = moveCatalogItem(
      orderedItems.map((p) => p._id), items.map((p) => p._id), source.index, destination.index
    );
    saveOrder.mutate({ store: storeSlug, ids });
  };

  // Productos con oferta pero sin precio regular calculable
  const missingRegular = useMemo(
    () => (catalog.data?.items ?? []).filter((p) => !p.originalPrice?.trim() && regularFromPrice(p.price)),
    [catalog.data]
  );

  // Alta y edición con herramientas de imagen (pegar, subir, recortar del circular,
  // quitar fondo, generar con IA). `product: null` = producto nuevo.
  const [editor, setEditor] = useState<{ open: boolean; product: StoreProduct | null }>({ open: false, product: null });
  const refreshCatalog = () => qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });

  // Imagen del circular para "Recortar circular". Sólo se resuelve al abrir el editor:
  // si el circular es PDF, el servidor renderiza la primera página una vez y la cachea.
  const flyer = useQuery({
    queryKey: ['store-flyer-image', storeSlug],
    enabled: editor.open && !!storeSlug,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const list: Circular[] = (await circularService.getByStore(storeSlug))?.items ?? [];
      const c =
        list.find((x) => x.status === 'active' && x.fileUrl) ||
        list.find((x) => x.status === 'scheduled' && x.fileUrl) ||
        list.find((x) => x.fileUrl);
      if (!c) return '';
      const direct = (c as any).previewImageUrl || (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(c.fileUrl || '') ? c.fileUrl : '');
      if (direct) return direct as string;
      return (await circularService.getPreviewImage(c._id).catch(() => ({ url: '' }))).url || '';
    },
  });

  // Ctrl+V sobre una fila: la fila "activa" es la última sobre la que pasó el mouse o
  // recibió foco. Con una imagen en el portapapeles se abre la confirmación de reemplazo.
  const [activeRow, setActiveRow] = useState<StoreProduct | null>(null);
  const [pasted, setPasted] = useState<{ file: File; product: StoreProduct } | null>(null);
  const activeRowRef = useRef<StoreProduct | null>(null);
  activeRowRef.current = activeRow;
  useEffect(() => {
    if (editor.open || pasted) return; // el editor tiene su propio Ctrl+V
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFromPaste(e);
      if (!file) return; // texto: lo maneja el campo enfocado
      const target = activeRowRef.current;
      e.preventDefault();
      if (!target) {
        toast('Pasá el mouse sobre el producto al que le querés cambiar la imagen y pegá de nuevo.');
        return;
      }
      setPasted({ file, product: target });
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [editor.open, pasted]);

  const removeProduct = useMutation({
    mutationFn: (id: string) => circularService.deleteStoreProduct(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo eliminar'),
  });

  // Limpieza IA de los recortes feos del catálogo (texto, precios, vecinos).
  // Corre en el servidor ~10 s por imagen: se refresca la tabla en 1 y 3 min.
  const cleanImages = useMutation({
    mutationFn: () => circularService.cleanCatalogImages(storeSlug),
    onSuccess: (d) => {
      if (!d.queued && !d.verifying) {
        toast.success('Todas las imágenes ya están limpias');
        return;
      }
      toast.success(
        d.queued
          ? `Limpiando ${d.queued} imágenes con IA… se van actualizando solas`
          : `Revisando ${d.verifying} fotos: las que no coincidan con su producto se regeneran solas`
      );
      const refresh = () => qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
      setTimeout(refresh, 60_000);
      setTimeout(refresh, 180_000);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo iniciar la limpieza'),
  });

  // El botón inteligente: visibles = SOLO los productos del último circular.
  const [syncOpen, setSyncOpen] = useState(false);
  const syncVisibility = useMutation({
    mutationFn: () => circularService.syncVisibility(storeSlug),
    onSuccess: (d) => {
      toast.success(
        `"${d.circularTitle}": ${d.inCircular} del circular visibles · ${d.hidden} ocultados`
      );
      setSyncOpen(false);
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || 'No se pudo sincronizar la visibilidad'),
  });

  // Completa TODOS los regulares faltantes con la regla del backend (+25%).
  const fillAll = useMutation({
    mutationFn: async () => {
      for (const p of missingRegular) {
        await circularService.updateStoreProduct(p._id, {
          originalPrice: regularFromPrice(p.price)!,
          hasOffer: true,
        } as any);
      }
      return missingRegular.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} precio${n === 1 ? '' : 's'} regular${n === 1 ? '' : 'es'} calculado${n === 1 ? '' : 's'}`);
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || 'No se pudieron calcular todos');
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
  });

  return (
    <Stack spacing={1.5}>
      <Alert severity="info" sx={{ py: 0.5 }}>
        Estos son los productos que ve el cliente en el flujo de listas (Pre-RCS). Solo salen los
        que tienen <strong>oferta</strong> y están <strong>visibles</strong>; los switches aplican al instante.
      </Alert>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5}>
        <TextField
          size="small"
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
        />
        {missingRegular.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            disabled={fillAll.isPending}
            onClick={() => fillAll.mutate()}
          >
            {fillAll.isPending
              ? 'Calculando…'
              : `Completar ${missingRegular.length} regular${missingRegular.length === 1 ? '' : 'es'} (+25%)`}
          </Button>
        )}
        <Button size="small" variant="outlined" onClick={() => setEditor({ open: true, product: null })}>
          + Agregar producto
        </Button>
        <Tooltip title="Deja visibles en el Pre-RCS SOLO los productos del último circular y oculta el resto del catálogo. Un click en vez de switch por switch.">
          <Button
            size="small"
            variant="contained"
            startIcon={<AutoAwesomeOutlinedIcon />}
            disabled={syncVisibility.isPending}
            onClick={() => setSyncOpen(true)}
          >
            {syncVisibility.isPending ? 'Sincronizando…' : 'Visibles = último circular'}
          </Button>
        </Tooltip>
        <Tooltip title="Pasa por IA todos los recortes del flyer: deja solo el producto (con su pedestal si lo tiene), sin letras ni precios, con fondo transparente. Los sin foto se generan.">
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeOutlinedIcon />}
            disabled={cleanImages.isPending}
            onClick={() => cleanImages.mutate()}
          >
            {cleanImages.isPending ? 'Iniciando…' : 'Limpiar imágenes con IA'}
          </Button>
        </Tooltip>
      </Stack>

      {/* Confirmación con modal propio — nada de window.confirm del navegador */}
      <ImagePreviewDialog
        key={imgPreview?.url || 'none'}
        url={imgPreview?.url ?? null}
        title={imgPreview?.title}
        onClose={() => setImgPreview(null)}
      />

      <Dialog open={syncOpen} onClose={() => setSyncOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeOutlinedIcon color="primary" fontSize="small" />
          Sincronizar visibilidad
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Se dejarán <strong>visibles en el Pre-RCS solo los productos del último circular</strong> de
            la tienda; el resto del catálogo se ocultará.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            No toca precios, ofertas ni imágenes — solo el switch de visibilidad. Cualquier
            producto se puede volver a mostrar a mano después.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setSyncOpen(false)}>Cancelar</Button>
          <Button
            size="small"
            variant="contained"
            disabled={syncVisibility.isPending}
            onClick={() => syncVisibility.mutate()}
          >
            {syncVisibility.isPending ? 'Sincronizando…' : 'Sí, sincronizar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ProductEditorDialog
        open={editor.open}
        product={editor.product}
        storeSlug={storeSlug}
        flyerUrl={flyer.data || undefined}
        onClose={() => setEditor((s) => ({ ...s, open: false }))}
        onSaved={refreshCatalog}
      />
      <PasteReplaceDialog
        file={pasted?.file ?? null}
        product={pasted?.product ?? null}
        onClose={() => setPasted(null)}
        onDone={refreshCatalog}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        title={`Para cambiar una imagen rápido: pasá el mouse sobre el producto y pegá (Ctrl+V) una captura o imagen copiada.${activeRow ? ` Fila activa: ${activeRow.name}.` : ''}`}
        sx={{ minWidth: 0, maxWidth: '100%' }}
      >
        Para cambiar una imagen rápido: pasá el mouse sobre el producto y pegá (Ctrl+V) una captura o imagen copiada.
        {activeRow ? ` Fila activa: ${activeRow.name}.` : ''}
      </Typography>

      {cleaning && (
        <Alert severity="info" icon={<CircularProgress size={16} />} sx={{ mb: 1 }}>
          {generatingCount
            ? `Generando ${generatingCount} imágenes con IA (sin fondo, sin precio). Aparecen solas en cada fila, no hace falta recargar.`
            : 'Revisando que cada foto coincida con su producto…'}
        </Alert>
      )}

      {saveOrder.isPending && <LinearProgress aria-label="Guardando orden de productos" />}
      {catalog.isLoading ? (
        <LinearProgress />
      ) : (
        <Box
          ref={catalogContainerRef}
          sx={{ minWidth: 0, width: '100%' }}
        >
          <DragDropContext
            onDragEnd={handleCatalogDragEnd}
            dragHandleUsageInstructions="Presioná espacio para levantar el producto, usá las flechas para moverlo y espacio para soltarlo. Escape cancela."
          >
          <Table
            size="small"
            sx={{
              width: '100%',
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                verticalAlign: 'middle',
                px: 1,
              },
              '& .MuiInputBase-root': { minWidth: 0, lineHeight: 1.5 },
              '& textarea': { overflowWrap: 'anywhere' },
              '& .MuiSelect-select': {
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                textOverflow: 'clip',
              },
              '& tr > :nth-child(1)': { width: 116 },
              '& tr > :nth-child(2)': { width: '23%' },
              '& tr > :nth-child(3), & tr > :nth-child(4)': { width: '12%' },
              '& tr > :nth-child(5)': { width: '14%' },
              '& tr > :nth-child(7), & tr > :nth-child(8)': { width: 66 },
              '& tr > :nth-child(9)': { width: 40 },
              ...(catalogWidth <= 900 ? {
                '& thead': { display: 'none' },
                '&, & tbody': { display: 'block' },
                '& tbody tr:not([data-rfd-placeholder-context-id])': {
                  display: 'grid',
                  gridTemplateColumns: `repeat(${catalogWidth <= 420 ? 2 : 3}, minmax(0, 1fr))`,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1,
                },
                '& tbody tr > td': { display: 'block', width: 'auto', minWidth: 0, borderBottom: 0 },
                '& tbody td:nth-of-type(2)': { gridColumn: catalogWidth <= 420 ? 'auto' : 'span 2' },
                '& tbody td[data-label]::before': {
                  content: 'attr(data-label)',
                  display: 'block',
                  mb: 0.5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'text.secondary',
                },
                '& tbody td[colspan]': { gridColumn: '1 / -1' },
              } : {}),
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Imagen</TableCell>
                <TableCell sx={cell}>Producto</TableCell>
                <TableCell sx={cell}>Precio oferta</TableCell>
                <TableCell sx={cell}>Precio regular</TableCell>
                <TableCell sx={cell}>Ahorro</TableCell>
                <TableCell sx={cell}>Categoría</TableCell>
                <TableCell sx={cell} align="center">En oferta</TableCell>
                <TableCell sx={cell} align="center">Visible</TableCell>
                <TableCell sx={cell} align="center" />{/* eliminar */}
              </TableRow>
            </TableHead>
            <Droppable droppableId={`catalog-${storeSlug}`}>
              {(dropProvided) => (
            <TableBody
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
            >
              {items.map((p, index) => (
                <Draggable
                  key={p._id}
                  draggableId={p._id}
                  index={index}
                  isDragDisabled={saveOrder.isPending}
                  disableInteractiveElementBlocking
                >
                  {(dragProvided, snapshot) => (
                <TableRow
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  hover
                  onMouseEnter={() => setActiveRow(p)}
                  onFocusCapture={() => setActiveRow(p)}
                  sx={{
                    ...(activeRow?._id === p._id ? { boxShadow: (t) => `inset 3px 0 0 ${t.palette.primary.main}` } : {}),
                    ...(snapshot.isDragging ? { display: 'table', tableLayout: 'fixed', bgcolor: 'background.paper', boxShadow: 6 } : {}),
                  }}
                >
                  <TableCell sx={cell}>
                    {/* Miniatura + acciones: subir manual o regenerar con IA */}
                    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5}>
                      <Tooltip title={saveOrder.isPending ? 'Guardando orden…' : 'Arrastrar para cambiar el orden de las listas'}>
                        <IconButton
                          {...dragProvided.dragHandleProps}
                          size="small"
                          aria-label={`Mover ${p.name}`}
                          sx={{ cursor: snapshot.isDragging ? 'grabbing' : 'grab', p: 0.25 }}
                        >
                          <DragIndicatorRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Box
                        component={p.imageUrl ? 'button' : 'div'}
                        type={p.imageUrl ? 'button' : undefined}
                        aria-label={p.imageUrl ? `Ver imagen de ${p.name} en grande` : undefined}
                        onClick={p.imageUrl ? () => setImgPreview({ url: p.imageUrl as string, title: p.name }) : undefined}
                        sx={{
                          width: 44, height: 44, borderRadius: 1.5, flexShrink: 0, p: 0,
                          border: '1px solid', borderColor: 'divider',
                          display: 'grid', placeItems: 'center', overflow: 'hidden',
                          bgcolor: 'background.default', fontSize: 20,
                          cursor: p.imageUrl ? 'zoom-in' : 'default',
                          '&:hover': p.imageUrl ? { borderColor: 'primary.main' } : undefined,
                        }}
                      >
                        {isGenerating(p) ? (
                          <Tooltip title="Generando imagen con IA… el recorte con precio se reemplaza solo">
                            <CircularProgress size={18} thickness={5} aria-label="Generando imagen" />
                          </Tooltip>
                        ) : p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span>🛒</span>
                        )}
                      </Box>
                      {/* Todo lo de imagen (subir, pegar, recortar, IA) vive en el modal de editar */}
                      <Tooltip title="Editar producto e imagen (subir, pegar, recortar del circular, quitar fondo, generar con IA)">
                        <IconButton
                          size="small"
                          aria-label={`Editar ${p.name}`}
                          onClick={() => setEditor({ open: true, product: p })}
                        >
                          <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell
                    sx={cell}
                    data-label="Producto"
                  >
                    {/* Todo editable: la encargada corrige lo que la IA leyó mal */}
                    <TextField
                      size="small"
                      variant="standard"
                      defaultValue={p.name}
                      fullWidth
                      multiline
                      inputProps={{ style: { fontWeight: 600 } }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== p.name) patch.mutate({ id: p._id, body: { name: v } });
                      }}
                    />
                    {(p.brand || p.size) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {[p.brand, p.size].filter(Boolean).join(' · ')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    data-label="Precio oferta"
                  >
                    <TextField
                      size="small"
                      variant="standard"
                      defaultValue={p.price ?? ''}
                      fullWidth
                      multiline
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== String(p.price ?? '')) patch.mutate({ id: p._id, body: { price: v } });
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={cell}
                    data-label="Precio regular"
                  >
                    <TextField
                      size="small"
                      variant="standard"
                      defaultValue={p.originalPrice ?? ''}
                      fullWidth
                      multiline
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== String(p.originalPrice ?? '')) {
                          patch.mutate({ id: p._id, body: { originalPrice: v, ...(v ? { hasOffer: true } : {}) } });
                        }
                      }}
                    />
                    {/* Sin regular: se estima con la misma regla del backend (+25%) */}
                    {!p.originalPrice?.trim() && regularFromPrice(p.price) && (
                      <Tooltip title={`Calcular: ${regularFromPrice(p.price)} (oferta + 25%)`}>
                        <Button
                          size="small"
                          sx={{ ml: 0.5, minWidth: 0, px: 0.75 }}
                          disabled={patch.isPending}
                          onClick={() =>
                            patch.mutate({
                              id: p._id,
                              body: { originalPrice: regularFromPrice(p.price)!, hasOffer: true },
                            })
                          }
                        >
                          +25%
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    data-label="Ahorro"
                  >
                    <TextField
                      size="small"
                      variant="standard"
                      defaultValue={p.savings ?? ''}
                      fullWidth
                      multiline
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== String(p.savings ?? '')) patch.mutate({ id: p._id, body: { savings: v } });
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={cell}
                    data-label="Categoría"
                  >
                    <TextField
                      select
                      size="small"
                      variant="standard"
                      value={CATEGORIES.includes(p.category as any) ? p.category : 'other'}
                      fullWidth
                      onChange={(e) => patch.mutate({ id: p._id, body: { category: e.target.value } })}
                    >
                      {CATEGORIES.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="center"
                    data-label="En oferta"
                  >
                    <Switch
                      size="small"
                      checked={!!p.onPromotion}
                      onChange={(e) => patch.mutate({ id: p._id, body: { onPromotion: e.target.checked } })}
                    />
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="center"
                    data-label="Visible"
                  >
                    <Switch
                      size="small"
                      checked={p.visibleInRcs !== false}
                      onChange={(e) => patch.mutate({ id: p._id, body: { visibleInRcs: e.target.checked } })}
                    />
                  </TableCell>
                  <TableCell sx={cell} align="center">
                    <Tooltip title="Eliminar del catálogo">
                      <IconButton
                        size="small"
                        disabled={removeProduct.isPending}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar "${p.name}" del catálogo?`)) removeProduct.mutate(p._id);
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                  )}
                </Draggable>
              ))}
              {dropProvided.placeholder}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Sin productos en el catálogo.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
              )}
            </Droppable>
          </Table>
          </DragDropContext>
        </Box>
      )}
    </Stack>
  );
}

/* ═══════════════ 3 · Listas Pre-RCS (validar) ═══════════════ */

function ListsSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ShoppingListStatus | 'all'>('all');
  const [detail, setDetail] = useState<AdminShoppingList | null>(null);

  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled: !!storeSlug,
  });
  const lists = useQuery({
    queryKey: shoppingListsQK.lists(storeSlug, status),
    queryFn: () =>
      shoppingListsService.lists({ storeSlug, status: status === 'all' ? undefined : status, limit: 50 }),
    enabled: !!storeSlug,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['shopping-lists'] });
  };

  const validate = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.validate(qrCode),
    onSuccess: (d) => { toast.success(`Lista validada · +${d.pointsAwarded} pts acreditados`); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo validar'),
  });
  const extend = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { extendHours: 24 }),
    onSuccess: () => { toast.success('Vigencia extendida 24 h'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo extender'),
  });
  const reopen = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { status: 'pending' }),
    onSuccess: () => { toast.success('Lista reabierta'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo reabrir'),
  });

  const s = summary.data;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(
          [
            ['all', `Todas${s ? ` (${s.total})` : ''}`],
            ['pending', `Pendientes${s ? ` (${s.pending})` : ''}`],
            ['validated', `Validadas${s ? ` (${s.validated})` : ''}`],
            ['expired', `Vencidas${s ? ` (${s.expired})` : ''}`],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            size="small"
            label={label}
            color={status === value ? 'primary' : 'default'}
            onClick={() => setStatus(value)}
          />
        ))}
        {s && (
          <Chip size="small" variant="outlined" label={`${s.pointsAwarded} pts acreditados`} sx={{ ml: 'auto' }} />
        )}
      </Stack>

      {lists.isLoading ? (
        <LinearProgress />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>QR</TableCell>
                <TableCell sx={cell}>Cliente</TableCell>
                <TableCell sx={cell} align="right">Items</TableCell>
                <TableCell sx={cell} align="right">Puntos</TableCell>
                <TableCell sx={cell}>Estado</TableCell>
                <TableCell sx={cell}>Creada</TableCell>
                <TableCell sx={cell} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(lists.data?.items ?? []).map((l) => (
                <TableRow key={l._id} hover sx={{ cursor: 'pointer' }} onClick={() => setDetail(l)}>
                  <TableCell sx={{ ...cell, fontFamily: 'monospace' }}>{l.qrCode}</TableCell>
                  <TableCell sx={cell}>
                    <Typography variant="body2" fontWeight={600}>{l.customerName || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.customerPhone}</Typography>
                  </TableCell>
                  <TableCell sx={cell} align="right">{l.totalItems}</TableCell>
                  <TableCell sx={cell} align="right">{l.pointsAwarded || '—'}</TableCell>
                  <TableCell sx={cell}>
                    <Chip size="small" {...(STATUS_CHIP[l.status] || { label: l.status, color: 'default' })} />
                  </TableCell>
                  <TableCell sx={cell}>{fmtDate(l.createdAt)}</TableCell>
                  <TableCell sx={cell} align="right" onClick={(e) => e.stopPropagation()}>
                    {l.status !== 'validated' && (
                      <Tooltip title="Validar todos los productos y acreditar puntos">
                        <Button size="small" onClick={() => validate.mutate(l.qrCode)} disabled={validate.isPending}>
                          Validar
                        </Button>
                      </Tooltip>
                    )}
                    {l.status === 'expired' && (
                      <Button size="small" onClick={() => extend.mutate(l.qrCode)} disabled={extend.isPending}>
                        +24h
                      </Button>
                    )}
                    {l.status === 'validated' && (
                      <Button size="small" color="warning" onClick={() => reopen.mutate(l.qrCode)} disabled={reopen.isPending}>
                        Reabrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!lists.data?.items?.length && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Sin listas.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'monospace' }}>{detail?.qrCode}</DialogTitle>
        <DialogContent dividers>
          <Stack divider={<Divider flexItem />}>
            {(detail?.items ?? []).map((it, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
                <Typography variant="body2">
                  {it.quantity}× {it.name}
                  {detail?.validatedItems?.some((n) => n.toLowerCase() === it.name.toLowerCase()) && ' ✓'}
                </Typography>
                <Typography variant="body2" color="text.secondary">{it.price}</Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

/* ═══════════════ 4 · Compras (recibos) ═══════════════ */

function PurchasesSection({ storeSlug }: { storeSlug: string }) {
  const purchases = useQuery({
    queryKey: shoppingListsQK.purchases(storeSlug),
    queryFn: () => shoppingListsService.purchases(storeSlug),
    enabled: !!storeSlug,
  });

  if (purchases.isLoading) return <LinearProgress />;
  const d = purchases.data;
  if (!d) return <Alert severity="warning">No se pudieron leer las compras.</Alert>;

  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        {(
          [
            ['Recibos escaneados', d.totals.receipts],
            ['Validados', d.totals.success],
            ['Rechazados', d.totals.failed],
            ['Puntos acreditados', d.totals.pointsAwarded],
            ['Gasto detectado', money(d.totals.spend)],
          ] as const
        ).map(([label, value]) => (
          <Grid item xs={6} sm={2.4} key={label}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={800}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle2" fontWeight={700}>
        Qué compró cada cliente
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          tenga o no puntos, esté o no en la base
        </Typography>
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={cell}>Cliente</TableCell>
              <TableCell sx={cell} align="right">Recibos</TableCell>
              <TableCell sx={cell} align="right">Productos</TableCell>
              <TableCell sx={cell} align="right">Puntos</TableCell>
              <TableCell sx={cell} align="right">Gasto</TableCell>
              <TableCell sx={cell}>Último recibo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {d.customers.map((c) => (
              <TableRow key={c.customerId} hover>
                <TableCell sx={cell}>
                  <Typography variant="body2" fontWeight={600}>
                    {c.customerName || c.customerPhone || c.customerId}
                  </Typography>
                  {!c.inDatabase && <Chip size="small" label="fuera de la base" sx={{ height: 18, fontSize: 11 }} />}
                </TableCell>
                <TableCell sx={cell} align="right">{c.receipts}</TableCell>
                <TableCell sx={cell} align="right">{c.products}</TableCell>
                <TableCell sx={cell} align="right">{c.points}</TableCell>
                <TableCell sx={cell} align="right">{money(c.spend)}</TableCell>
                <TableCell sx={cell}>{fmtDate(c.lastReceiptAt)}</TableCell>
              </TableRow>
            ))}
            {!d.customers.length && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Todavía no hay recibos escaneados.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {d.topProducts.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700}>Productos más comprados (según recibos)</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={cell}>Producto</TableCell>
                  <TableCell sx={cell} align="right">Unidades</TableCell>
                  <TableCell sx={cell} align="right">Recibos</TableCell>
                  <TableCell sx={cell} align="right">En oferta</TableCell>
                  <TableCell sx={cell} align="right">Ingreso</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.topProducts.map((p) => (
                  <TableRow key={p.name} hover>
                    <TableCell sx={{ ...cell, maxWidth: 280 }}>
                      <Typography variant="body2" noWrap>{p.name}</Typography>
                    </TableCell>
                    <TableCell sx={cell} align="right">{p.quantity}</TableCell>
                    <TableCell sx={cell} align="right">{p.receipts}</TableCell>
                    <TableCell sx={cell} align="right">{p.matchedReceipts}</TableCell>
                    <TableCell sx={cell} align="right">{money(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Stack>
  );
}

/* ═══════════════ 5 · Mensajes (mensaje de prueba) ═══════════════ */

/** El mismo flujo que el merchant: crea la lista de compras del cliente elegido y le
 *  manda el SMS/MMS con su link. Usa los productos del circular vigente. */
function MessagesSection({ storeId, storeSlug, storeName, provider, infobipSenderId, address }: Props) {
  const [open, setOpen] = useState(false);
  const circulars = useQuery({
    queryKey: ['store-circulars', storeSlug],
    queryFn: () => circularService.getByStore(storeSlug),
    enabled: !!storeSlug,
  });
  const items: Circular[] = circulars.data?.items ?? [];
  const active = items.find((c) => c.status === 'active') || items.find((c) => c.status === 'scheduled') || items[0] || null;
  const count: number = (active as any)?.products?.length ?? 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700}>Mensaje de prueba</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
            Crea la lista de compras de un cliente y le manda el SMS o MMS con su link, igual que lo recibe en una campaña.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
            {circulars.isLoading
              ? 'Cargando circular…'
              : active
                ? `Circular: ${active.title || 'sin título'} · ${count} productos`
                : 'La tienda no tiene circular: cargá uno en la pestaña Circular.'}
          </Typography>
        </Box>
        <Button variant="contained" disabled={!active} onClick={() => setOpen(true)}>
          Enviar mensaje de prueba
        </Button>
      </Stack>
      <TestMmsShoppingListModal
        open={open}
        onClose={() => setOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName || storeSlug}
        products={((active as any)?.products ?? []) as any[]}
        headline={(active as any)?.headline || ''}
        circularId={active?._id}
        // Si el circular es PDF pero ya tiene preview renderizado (página 1 en
        // imagen), ESE va como adjunto del MMS y no hay que pedir nada.
        circularFileUrl={(active as any)?.previewImageUrl || active?.fileUrl}
        storeProvider={provider}
        storeInfobipSenderId={infobipSenderId}
        storeAddress={address}
      />
    </Paper>
  );
}

/* ═══════════════ Panel ═══════════════ */

export default function StoreCircularPanel({ storeId, storeSlug, storeName, provider, infobipSenderId, address, circularssUrl }: Props) {
  const [tab, setTab] = useState(0);

  if (!storeSlug) {
    return (
      <Box p={3}>
        <Alert severity="warning">Esta tienda no tiene slug: el Pre-RCS trabaja por slug.</Alert>
      </Box>
    );
  }

  return (
    <Box px={{ xs: 1, md: 2 }} pt={2} pb={4}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Circular & Listas {storeName ? `· ${storeName}` : ''}
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
        <Tab icon={<CalendarMonthRoundedIcon fontSize="small" />} iconPosition="start" label="Circular" />
        <Tab icon={<Inventory2OutlinedIcon fontSize="small" />} iconPosition="start" label="Productos" />
        <Tab icon={<FactCheckOutlinedIcon fontSize="small" />} iconPosition="start" label="Listas" />
        <Tab icon={<ReceiptLongRoundedIcon fontSize="small" />} iconPosition="start" label="Compras" />
        <Tab icon={<SmsOutlinedIcon fontSize="small" />} iconPosition="start" label="Mensajes" />
      </Tabs>
      {tab === 0 && (
        <CircularSection
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          provider={provider}
          infobipSenderId={infobipSenderId}
          address={address}
          circularssUrl={circularssUrl}
        />
      )}
      {tab === 0 && (
        <Box sx={{ mt: 2 }}>
          <StoreBannerSection storeSlug={storeSlug} storeId={storeId} />
        </Box>
      )}
      {tab === 1 && <CatalogSection storeSlug={storeSlug} />}
      {tab === 2 && <ListsSection storeSlug={storeSlug} />}
      {tab === 3 && <PurchasesSection storeSlug={storeSlug} />}
      {tab === 4 && (
        <MessagesSection
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          provider={provider}
          infobipSenderId={infobipSenderId}
          address={address}
        />
      )}
    </Box>
  );
}
