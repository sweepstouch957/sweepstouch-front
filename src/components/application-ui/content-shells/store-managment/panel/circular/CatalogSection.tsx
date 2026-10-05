'use client';

/** Productos: el catálogo de la tienda (lo que ve el cliente en sus listas). */
import { circularService, type Circular, type StoreProduct } from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Pagination,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { applyCatalogOrder, moveCatalogItem } from './catalog-order';
import { qk, useStoreCirculars } from './hooks';
import { imageFromPaste, PasteReplaceDialog, ProductEditorDialog } from './ProductImageTools';
import { CATEGORIES, cell, fmtDate, ImagePreviewDialog, regularFromPrice } from './shared';
import { CatalogRowsSkeleton } from './skeletons';

// Filas por página del catálogo (un circular grande trae 2000 productos).
const PAGE_SIZE = 50;

export default function CatalogSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  // Paginado y buscado en el servidor: 50 por página. La clave incluye página y búsqueda;
  // invalidar qk.catalog(storeSlug) sigue refrescando todas (prefijo).
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const catalog = useQuery({
    queryKey: [...qk.catalog(storeSlug), page, deferredSearch.trim()],
    queryFn: () =>
      circularService.getCatalogAdmin(storeSlug, { page, limit: PAGE_SIZE, q: deferredSearch }),
    enabled: !!storeSlug,
    staleTime: 30_000,
    // Cada combinación página+búsqueda es una entrada de caché con 50 productos: se suelta
    // al minuto en vez de a los 10 (default global).
    gcTime: 60_000,
    placeholderData: (prev) => prev,
    // Mientras la IA limpia imágenes el catálogo se refresca solo: cada fila pasa de
    // "Generando…" a su foto final sin recargar.
    refetchInterval: (q) => (q.state.data?.cleaning ? 8000 : false),
  });
  const cleaning = !!catalog.data?.cleaning;
  // Las categorías las arma cada tienda: se ofrecen las suyas + la base, y se puede
  // escribir una nueva ahí mismo.
  const categoriesQuery = useQuery({
    queryKey: qk.categories(storeSlug),
    queryFn: () => circularService.getStoreCategories(storeSlug),
    enabled: !!storeSlug,
    staleTime: 60_000,
  });
  const categoryOptions = useMemo(
    () => [...new Set([...(categoriesQuery.data || []), ...CATEGORIES])].sort(),
    [categoriesQuery.data]
  );
  const catalogContainerRef = useRef<HTMLDivElement>(null);
  // Refrescos diferidos de la limpieza de imágenes: se cancelan al desmontar.
  const lateTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => lateTimers.current.forEach(clearTimeout), []);
  // Sólo importa en qué rango cae el ancho: guardar el número exacto re-renderizaba la
  // tabla en cada píxel al redimensionar. 1000 = tabla normal.
  const [catalogWidth, setCatalogWidth] = useState(1000);
  useEffect(() => {
    const container = catalogContainerRef.current;
    if (!container) return;
    const bucket = (w: number) => (w <= 420 ? 420 : w <= 900 ? 900 : 1000);
    const observer = new ResizeObserver(([entry]) =>
      setCatalogWidth(bucket(entry.contentRect.width))
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [catalog.isLoading]);
  // Recorte crudo del flyer (trae precio y texto) o sin foto, con limpieza en curso:
  // no se muestra, para que nadie lo tome por la imagen final.
  const isGenerating = (p: StoreProduct) =>
    cleaning && (!p.imageUrl || /\/circular-products\//.test(p.imageUrl));
  const generatingCount = cleaning ? (catalog.data?.items || []).filter(isGenerating).length : 0;
  const [pendingOrder, setPendingOrder] = useState<{ store: string; ids: string[] } | null>(null);
  const saveOrder = useMutation({
    mutationFn: ({ store, ids, offset }: { store: string; ids: string[]; offset?: number }) =>
      circularService.saveCatalogOrder(store, ids, offset || 0),
    onMutate: async (order) => {
      setPendingOrder(order);
      await qc.cancelQueries({ queryKey: qk.catalog(order.store) });
    },
    onSuccess: () => toast.success('Orden guardado para las listas.'),
    onError: (error: Error) => toast.error(error.message || 'No se pudo guardar el orden.'),
    onSettled: async (_data, _error, order) => {
      try {
        // Reload even on partial failure: the screen must reflect what the backend actually saved.
        await qc.invalidateQueries({ queryKey: qk.catalog(order.store) });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) }),
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const { mutate: patchMutate } = patch;
  const onPatch = useCallback(
    (id: string, body: Record<string, unknown>) => patchMutate({ id, body }),
    [patchMutate]
  );
  const onCategory = useCallback(
    (id: string, category: string) => {
      patchMutate({ id, body: { category } });
      qc.invalidateQueries({ queryKey: qk.categories(storeSlug) });
    },
    [patchMutate, qc, storeSlug]
  );
  const onPreviewImage = useCallback(
    (p: StoreProduct) => setImgPreview({ url: p.imageUrl as string, title: p.name }),
    []
  );
  const [toDelete, setToDelete] = useState<StoreProduct | null>(null);

  const orderedItems = useMemo(
    () =>
      applyCatalogOrder(
        catalog.data?.items ?? [],
        pendingOrder?.store === storeSlug ? pendingOrder.ids : []
      ),
    [catalog.data, pendingOrder, storeSlug]
  );
  // La búsqueda ya viene filtrada del servidor.
  const items: StoreProduct[] = orderedItems;
  const total = catalog.data?.total ?? orderedItems.length;
  const pages = catalog.data?.pages ?? 1;

  // Lo que todavía no arrancó, agrupado por fecha de entrada: el encargado sube el flyer
  // de la semana que viene y necesita ver qué sale (o cambia de precio) y cuándo.
  const upcomingSummary = useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; title: string; total: number; nuevos: number; precios: number }
    >();
    for (const p of orderedItems) {
      if (!p.effectiveFrom) continue;
      const row = byDate.get(p.effectiveFrom) ?? {
        date: p.effectiveFrom,
        title: p.effectiveCircularTitle || '',
        total: 0,
        nuevos: 0,
        precios: 0,
      };
      row.total += 1;
      if (p.effectiveKind === 'price') row.precios += 1;
      else row.nuevos += 1;
      byDate.set(p.effectiveFrom, row);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [orderedItems]);

  const handleCatalogDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index || saveOrder.isPending) return;
    const ids = moveCatalogItem(
      orderedItems.map((p) => p._id),
      items.map((p) => p._id),
      source.index,
      destination.index
    );
    saveOrder.mutate({ store: storeSlug, ids, offset: (page - 1) * PAGE_SIZE });
  };

  // Productos con oferta pero sin precio regular calculable
  const missingRegular = useMemo(
    () =>
      (catalog.data?.items ?? []).filter(
        (p) => !p.originalPrice?.trim() && regularFromPrice(p.price)
      ),
    [catalog.data]
  );

  // Alta y edición con herramientas de imagen (pegar, subir, recortar del circular,
  // quitar fondo, generar con IA). `product: null` = producto nuevo.
  const [editor, setEditor] = useState<{ open: boolean; product: StoreProduct | null }>({
    open: false,
    product: null,
  });
  const onEdit = useCallback((p: StoreProduct) => setEditor({ open: true, product: p }), []);
  const refreshCatalog = () => qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });

  // Arte del flyer de la campaña vigente (es imagen, va directo) para "Recortar flyer".
  const { flyers } = useStoreCirculars(storeSlug);
  const campaignFlyerUrl =
    (
      flyers.find((x) => x.status === 'active') ||
      flyers.find((x) => x.status === 'scheduled') ||
      flyers[0]
    )?.fileUrl || undefined;

  // Imagen del circular para "Recortar circular". Sólo se resuelve al abrir el editor:
  // si el circular es PDF, el servidor renderiza la primera página una vez y la cachea.
  const flyer = useQuery({
    queryKey: qk.flyer(storeSlug),
    enabled: editor.open && !!storeSlug,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const all: Circular[] = (await circularService.getByStoreSummary(storeSlug))?.items ?? [];
      // Sólo circulares de verdad (PDF): el flyer de campaña va por "Recortar flyer".
      const list = all.filter((x) => x.fileKey !== 'campaign' && !x.campaign);
      const c =
        list.find((x) => x.status === 'active' && x.fileUrl) ||
        list.find((x) => x.status === 'scheduled' && x.fileUrl) ||
        list.find((x) => x.fileUrl);
      if (!c) return '';
      const direct =
        (c as any).previewImageUrl ||
        (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(c.fileUrl || '') ? c.fileUrl : '');
      if (direct) return direct as string;
      return (await circularService.getPreviewImage(c._id).catch(() => ({ url: '' }))).url || '';
    },
  });

  // Ctrl+V sobre una fila: la fila "activa" es la última sobre la que pasó el mouse o
  // recibió foco. Con una imagen en el portapapeles se abre la confirmación de reemplazo.
  // Sólo un ref: guardar la fila en estado re-renderizaba toda la tabla al mover el mouse.
  const [pasted, setPasted] = useState<{ file: File; product: StoreProduct } | null>(null);
  const activeRowRef = useRef<StoreProduct | null>(null);
  const onActivate = useCallback((p: StoreProduct) => {
    activeRowRef.current = p;
  }, []);
  useEffect(() => {
    if (editor.open || pasted) return; // el editor tiene su propio Ctrl+V
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFromPaste(e);
      if (!file) return; // texto: lo maneja el campo enfocado
      const target = activeRowRef.current;
      e.preventDefault();
      if (!target) {
        toast(
          'Pasa el mouse sobre el producto al que le quieres cambiar la imagen y pega de nuevo.'
        );
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
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
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
      // El refetchInterval del catálogo (mientras `cleaning`) ya lo va refrescando: estos
      // dos son el respaldo si el flag se apaga antes de que caigan las últimas fotos.
      const refresh = () => qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
      lateTimers.current.forEach(clearTimeout);
      lateTimers.current = [setTimeout(refresh, 60_000), setTimeout(refresh, 180_000)];
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo iniciar la limpieza'),
  });

  // Borrar todo: para empezar de cero cuando la lectura o las imágenes salieron mal.
  const [clearOpen, setClearOpen] = useState(false);
  const [clearCirculars, setClearCirculars] = useState(true);
  const clearAll = useMutation({
    mutationFn: () => circularService.clearCatalog(storeSlug, { circulars: clearCirculars }),
    onSuccess: (d) => {
      toast.success(
        `${d.deleted} productos borrados${
          d.circulars ? ` · ${d.circulars} circular(es) vaciado(s)` : ''
        }`
      );
      setClearOpen(false);
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo borrar'),
  });

  // "Rescanear fotos": vuelve a buscar cada producto en su página del circular, recorta sólo su
  // foto y la limpia; si no aparece, la genera. Corre en el backend; se consulta cada 3 s.
  const [rescanOpen, setRescanOpen] = useState(false);
  const [rescanWatch, setRescanWatch] = useState(false);
  const rescanStatus = useQuery({
    queryKey: ['catalog-rescan', storeSlug],
    queryFn: () => circularService.rescanPhotosStatus(storeSlug),
    enabled: rescanWatch,
    refetchInterval: (q) => (q.state.data?.job && !q.state.data.job.finishedAt ? 3000 : false),
  });
  const rescanRunning = rescanWatch && !rescanStatus.data?.job?.finishedAt;
  const rescanSeen = useRef(-1);
  useEffect(() => {
    const j = rescanStatus.data?.job;
    if (!rescanWatch) return;
    // Las fotos van cayendo una a una: se refresca el catálogo sólo cuando avanzó el
    // contador, no en cada poll de 3 s.
    const done = j?.done ?? 0;
    if (done !== rescanSeen.current) {
      rescanSeen.current = done;
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    }
    if (!j?.finishedAt) return;
    setRescanWatch(false);
    if (j.error) toast.error(j.error);
    else
      toast.success(
        `Fotos: ${j.relocated} re-ubicadas en el circular · ${j.generated} generadas${
          j.failed ? ` · ${j.failed} no se pudieron` : ''
        }`,
        { duration: 8000 }
      );
  }, [rescanStatus.data, rescanWatch, qc, storeSlug]);
  const rescanPhotos = useMutation({
    mutationFn: (mode: 'missing' | 'all') => circularService.rescanPhotos(storeSlug, mode),
    onSuccess: (d) => {
      setRescanOpen(false);
      if (!d.job?.total && d.job?.finishedAt) {
        toast.success('No hay fotos que rescanear');
        return;
      }
      setRescanWatch(true);
      toast.success('Iris está rescaneando las fotos… se van actualizando solas');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo rescanear'),
  });

  // "Completar marca / tamaño": relee el flyer o el circular sólo para los productos a los que
  // les falta marca o tamaño. Corre en el backend; acá se pregunta cada 3 s hasta que termina.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsWatch, setDetailsWatch] = useState(false);
  const detailsStatus = useQuery({
    queryKey: ['catalog-details', storeSlug],
    queryFn: () => circularService.fillDetailsStatus(storeSlug),
    enabled: detailsWatch,
    refetchInterval: (q) => (q.state.data?.job && !q.state.data.job.finishedAt ? 3000 : false),
  });
  const detailsRunning = detailsWatch && !detailsStatus.data?.job?.finishedAt;
  useEffect(() => {
    const j = detailsStatus.data?.job;
    if (!detailsWatch || !j?.finishedAt) return;
    setDetailsWatch(false);
    if (j.error) toast.error(j.error);
    else
      toast.success(
        `Marca y tamaño: ${j.updated} de ${j.total} productos completados leyendo "${j.circularTitle}"`,
        { duration: 7000 }
      );
    qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
  }, [detailsStatus.data, detailsWatch, qc, storeSlug]);
  const fillDetails = useMutation({
    mutationFn: (source: 'flyer' | 'circular') => circularService.fillDetails(storeSlug, source),
    onSuccess: () => {
      setDetailsOpen(false);
      setDetailsWatch(true);
      toast.success('Leyendo el archivo… te aviso cuando termine');
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || 'No se pudo completar marca y tamaño'),
  });

  // El botón inteligente: visibles = SOLO los productos del último circular.
  const [syncOpen, setSyncOpen] = useState(false);
  const syncVisibility = useMutation({
    mutationFn: (only: 'flyer' | 'circular') => circularService.syncVisibility(storeSlug, only),
    onSuccess: (d, only) => {
      toast.success(
        d.circularId
          ? `"${d.circularTitle}": ${d.inCircular} visibles · ${d.hidden} ocultados${
              d.duplicates ? ` · ${d.duplicates} duplicados quitados` : ''
            }`
          : `Sin ${only === 'flyer' ? 'flyer de campaña' : 'circular'} vigente hoy: ${
              d.hidden
            } productos ocultados`
      );
      setSyncOpen(false);
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
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
      toast.success(
        `${n} precio${n === 1 ? '' : 's'} regular${n === 1 ? '' : 'es'} calculado${
          n === 1 ? '' : 's'
        }`
      );
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || 'No se pudieron calcular todos');
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
  });

  return (
    <Stack spacing={1.5}>
      <Alert
        severity="info"
        sx={{ py: 0.5 }}
      >
        Estos son los productos que ve el cliente en el flujo de listas (Pre-RCS). Solo salen los
        que tienen <strong>oferta</strong> y están <strong>visibles</strong>; los switches aplican
        al instante.
      </Alert>
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={1.5}
      >
        <TextField
          size="small"
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
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
              : `Completar ${missingRegular.length} regular${
                  missingRegular.length === 1 ? '' : 'es'
                } (+25%)`}
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          onClick={() => setEditor({ open: true, product: null })}
        >
          + Agregar producto
        </Button>
        <Tooltip title="Borra TODOS los productos de la tienda para volver a extraer desde cero (p. ej. si la lectura o las imágenes salieron mal).">
          <Button
            size="small"
            color="error"
            variant="outlined"
            disabled={clearAll.isPending}
            onClick={() => setClearOpen(true)}
          >
            Borrar todos
          </Button>
        </Tooltip>
        <Dialog
          open={clearOpen}
          onClose={() => !clearAll.isPending && setClearOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 0.5 }}>¿Borrar todos los productos?</DialogTitle>
          <DialogContent>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5 }}
            >
              Se borra el catálogo completo de esta tienda ({orderedItems.length} productos) y
              desaparecen de la lista del cliente. No se puede deshacer.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={clearCirculars}
                  onChange={(e) => setClearCirculars(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Vaciar también los productos de los circulares vivos (para re-extraer limpio)
                </Typography>
              }
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setClearOpen(false)}
              disabled={clearAll.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={clearAll.isPending}
              onClick={() => clearAll.mutate()}
            >
              {clearAll.isPending ? 'Borrando…' : 'Sí, borrar todo'}
            </Button>
          </DialogActions>
        </Dialog>
        <Tooltip title="Deja visibles en el Pre-RCS SOLO los productos del último flyer de campaña o SOLO los del último circular, y oculta el resto. Un click en vez de switch por switch.">
          <Button
            size="small"
            variant="contained"
            startIcon={<AutoAwesomeOutlinedIcon />}
            disabled={syncVisibility.isPending}
            onClick={() => setSyncOpen(true)}
          >
            {syncVisibility.isPending ? 'Sincronizando…' : 'Visibles = último flyer / circular'}
          </Button>
        </Tooltip>
        <Tooltip title="Relee el flyer o el circular SOLO para los productos sin marca o sin tamaño y rellena marca, tamaño, unidad y presentación. No pisa lo que ya está escrito.">
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeOutlinedIcon />}
            disabled={detailsRunning}
            onClick={() => setDetailsOpen(true)}
          >
            {detailsRunning
              ? `Completando… ${detailsStatus.data?.job?.done ?? 0}/${
                  detailsStatus.data?.job?.total ?? 0
                }`
              : 'Completar marca / tamaño'}
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
        <Tooltip title="Vuelve a buscar cada producto en su página del circular, recorta SÓLO su foto, verifica que sea él y la limpia. Si no aparece en el circular, la genera desde el nombre.">
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeOutlinedIcon />}
            disabled={rescanRunning}
            onClick={() => setRescanOpen(true)}
          >
            {rescanRunning
              ? `Rescaneando… ${rescanStatus.data?.job?.done ?? 0}/${
                  rescanStatus.data?.job?.total ?? 0
                }`
              : 'Rescanear fotos'}
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

      <Dialog
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeOutlinedIcon
            color="primary"
            fontSize="small"
          />
          Sincronizar visibilidad
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 1 }}
          >
            Elige con qué se queda la lista del Pre-RCS:{' '}
            <strong>sólo el último flyer de campaña</strong> o{' '}
            <strong>sólo el último circular semanal</strong>. El resto del catálogo se oculta.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            No toca precios, ofertas ni imágenes — solo el switch de visibilidad. Cualquier producto
            se puede volver a mostrar a mano después.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={() => setSyncOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={syncVisibility.isPending}
            onClick={() => syncVisibility.mutate('circular')}
          >
            Sólo último circular
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={syncVisibility.isPending}
            onClick={() => syncVisibility.mutate('flyer')}
          >
            {syncVisibility.isPending ? 'Sincronizando…' : 'Sólo último flyer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rescanOpen}
        onClose={() => setRescanOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeOutlinedIcon
            color="primary"
            fontSize="small"
          />
          Rescanear fotos
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 1 }}
          >
            Iris vuelve a buscar cada producto en su página del circular, recorta sólo su foto,
            comprueba que sea él y la limpia. Si no lo encuentra, genera la foto desde el nombre.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            "Sólo las malas" = sin foto o con recorte crudo. "Todas" rehace también las que ya están
            limpias (útil si quedaron con el vecino o con varios productos). Para una sola foto,
            ábrela con el lápiz y usa "Rescanear foto".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={() => setRescanOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={rescanPhotos.isPending}
            onClick={() => rescanPhotos.mutate('all')}
          >
            Todas las visibles
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={rescanPhotos.isPending}
            onClick={() => rescanPhotos.mutate('missing')}
          >
            Sólo las malas
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeOutlinedIcon
            color="primary"
            fontSize="small"
          />
          Completar marca y tamaño
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 1 }}
          >
            ¿De dónde leo? Se revisan sólo los productos a los que les falta marca o tamaño; se
            rellenan marca, tamaño, unidad y presentación sin tocar lo que ya está escrito.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Tarda un rato en circulares grandes. Puedes seguir trabajando; te aviso al terminar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={() => setDetailsOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={fillDetails.isPending}
            onClick={() => fillDetails.mutate('circular')}
          >
            Del último circular
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={fillDetails.isPending}
            onClick={() => fillDetails.mutate('flyer')}
          >
            Del último flyer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar del catálogo?</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            &quot;{toDelete?.name}&quot; deja de salir en las listas. No se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={removeProduct.isPending}
            onClick={() => {
              if (toDelete) removeProduct.mutate(toDelete._id);
              setToDelete(null);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <ProductEditorDialog
        open={editor.open}
        product={editor.product}
        storeSlug={storeSlug}
        flyerUrl={flyer.data || undefined}
        campaignUrl={campaignFlyerUrl}
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
        title="Para cambiar una imagen rápido: pasa el mouse sobre el producto y pega (Ctrl+V) una captura o imagen copiada."
        sx={{ minWidth: 0, maxWidth: '100%' }}
      >
        Para cambiar una imagen rápido: pasa el mouse sobre el producto y pega (Ctrl+V) una captura
        o imagen copiada.
      </Typography>

      {upcomingSummary.map((u) => (
        <Alert
          key={u.date}
          severity="info"
          sx={{ mb: 1 }}
        >
          <strong>{u.total}</strong> {u.total === 1 ? 'producto entra' : 'productos entran'} el{' '}
          <strong>{fmtDate(u.date)}</strong>
          {u.nuevos ? ` · ${u.nuevos} ${u.nuevos === 1 ? 'nuevo' : 'nuevos'}` : ''}
          {u.precios ? ` · ${u.precios} ${u.precios === 1 ? 'cambia' : 'cambian'} de precio` : ''}
          {u.title ? ` (${u.title})` : ''}. Hasta esa fecha el cliente sigue viendo el precio de
          hoy; los productos nuevos entran ocultos y se prenden solos ese día.
        </Alert>
      ))}

      {cleaning && (
        <Alert
          severity="info"
          icon={<CircularProgress size={16} />}
          sx={{ mb: 1 }}
        >
          {generatingCount
            ? `Generando ${generatingCount} imágenes con IA (sin fondo, sin precio). Aparecen solas en cada fila, no hace falta recargar.`
            : 'Revisando que cada foto coincida con su producto…'}
        </Alert>
      )}

      {saveOrder.isPending && <LinearProgress aria-label="Guardando orden de productos" />}
      {catalog.isLoading ? (
        <CatalogRowsSkeleton />
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
                ...(catalogWidth <= 900
                  ? {
                      '& thead': { display: 'none' },
                      '&, & tbody': { display: 'block' },
                      '& tbody tr:not([data-rfd-placeholder-context-id])': {
                        display: 'grid',
                        gridTemplateColumns: `repeat(${
                          catalogWidth <= 420 ? 2 : 3
                        }, minmax(0, 1fr))`,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        py: 1,
                      },
                      '& tbody tr > td': {
                        display: 'block',
                        width: 'auto',
                        minWidth: 0,
                        borderBottom: 0,
                      },
                      '& tbody td:nth-of-type(2)': {
                        gridColumn: catalogWidth <= 420 ? 'auto' : 'span 2',
                      },
                      '& tbody td[data-label]::before': {
                        content: 'attr(data-label)',
                        display: 'block',
                        mb: 0.5,
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'text.secondary',
                      },
                      '& tbody td[colspan]': { gridColumn: '1 / -1' },
                    }
                  : {}),
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
                  <TableCell
                    sx={cell}
                    align="center"
                  >
                    En oferta
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="center"
                  >
                    Visible
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="center"
                  />
                  {/* eliminar */}
                </TableRow>
              </TableHead>
              <Droppable droppableId={`catalog-${storeSlug}`}>
                {(dropProvided) => (
                  <TableBody
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                  >
                    {items.map((p, index) => (
                      <CatalogRow
                        key={p._id}
                        p={p}
                        index={index}
                        generating={isGenerating(p)}
                        dragDisabled={saveOrder.isPending}
                        categoryOptions={categoryOptions}
                        onActivate={onActivate}
                        onPatch={onPatch}
                        onCategory={onCategory}
                        onEdit={onEdit}
                        onPreviewImage={onPreviewImage}
                        onDelete={setToDelete}
                      />
                    ))}
                    {dropProvided.placeholder}
                    {!items.length && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          sx={{ py: 3, textAlign: 'center' }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {deferredSearch.trim()
                              ? 'Nada coincide con la búsqueda.'
                              : 'Sin productos en el catálogo.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {pages > 1 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          sx={{ py: 1.5 }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            gap={2}
                            flexWrap="wrap"
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {total} productos · página {page} de {pages}
                              {catalog.isFetching ? ' · cargando…' : ''}
                            </Typography>
                            <Pagination
                              count={pages}
                              page={page}
                              onChange={(_e, p) => {
                                setPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              size="small"
                              siblingCount={1}
                            />
                          </Stack>
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

type RowProps = {
  p: StoreProduct;
  index: number;
  generating: boolean;
  dragDisabled: boolean;
  categoryOptions: string[];
  onActivate: (p: StoreProduct) => void;
  onPatch: (id: string, body: Record<string, unknown>) => void;
  onCategory: (id: string, category: string) => void;
  onEdit: (p: StoreProduct) => void;
  onPreviewImage: (p: StoreProduct) => void;
  onDelete: (p: StoreProduct) => void;
};

/** Una fila del catálogo. memo: al editar un producto sólo se re-renderiza su fila, no las
 *  cientos restantes (cada una tiene un Autocomplete de MUI, que es caro). */
const CatalogRow = memo(function CatalogRow({
  p,
  index,
  generating,
  dragDisabled,
  categoryOptions,
  onActivate,
  onPatch,
  onCategory,
  onEdit,
  onPreviewImage,
  onDelete,
}: RowProps) {
  return (
    <Draggable
      key={p._id}
      draggableId={p._id}
      index={index}
      isDragDisabled={dragDisabled}
      disableInteractiveElementBlocking
    >
      {(dragProvided, snapshot) => (
        <TableRow
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          hover
          onMouseEnter={() => onActivate(p)}
          onFocusCapture={() => onActivate(p)}
          sx={{
            // Fila "activa" para Ctrl+V: resaltada por CSS, sin estado (antes cada movimiento
            // del mouse re-renderizaba la tabla entera).
            '&:hover, &:focus-within': {
              boxShadow: (t) => `inset 3px 0 0 ${t.palette.primary.main}`,
            },
            ...(snapshot.isDragging
              ? {
                  display: 'table',
                  tableLayout: 'fixed',
                  bgcolor: 'background.paper',
                  boxShadow: 6,
                }
              : {}),
          }}
        >
          <TableCell sx={cell}>
            {/* Miniatura + acciones: subir manual o regenerar con IA */}
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              gap={0.5}
            >
              <Tooltip
                title={
                  dragDisabled
                    ? 'Guardando orden…'
                    : 'Arrastrar para cambiar el orden de las listas'
                }
              >
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
                onClick={p.imageUrl ? () => onPreviewImage(p) : undefined}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  flexShrink: 0,
                  p: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                  fontSize: 20,
                  cursor: p.imageUrl ? 'zoom-in' : 'default',
                  '&:hover': p.imageUrl ? { borderColor: 'primary.main' } : undefined,
                }}
              >
                {generating ? (
                  <Tooltip title="Generando imagen con IA… el recorte con precio se reemplaza solo">
                    <CircularProgress
                      size={18}
                      thickness={5}
                      aria-label="Generando imagen"
                    />
                  </Tooltip>
                ) : p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cloudinaryThumb(p.imageUrl, 88, 88, 'fit')}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={44}
                    height={44}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span>🛒</span>
                )}
              </Box>
              {/* Todo lo de imagen (subir, pegar, recortar, IA) vive en el modal de editar */}
              <Tooltip title="Editar producto e imagen (subir, pegar, recortar del circular, quitar fondo, generar con IA)">
                <IconButton
                  size="small"
                  aria-label={`Editar ${p.name}`}
                  onClick={() => onEdit(p)}
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
                if (v && v !== p.name) onPatch(p._id, { name: v });
              }}
            />
            {/* Letra chica del flyer: lo que el cliente reclama en la caja si no sale
                          en su lista ("15 lb box only", "at the counter", "limit 1"). */}
            {(p.packQty || p.counterOnly || p.maxPerCustomer) && (
              <Stack
                direction="row"
                gap={0.5}
                flexWrap="wrap"
                sx={{ mt: 0.5 }}
              >
                {!!p.packQty && p.packQty > 1 && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={`Caja ${p.packQty} ${p.packUnit || ''}`.trim()}
                    sx={{ height: 18, fontSize: 11 }}
                  />
                )}
                {p.counterOnly && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label="Mostrador"
                    sx={{ height: 18, fontSize: 11 }}
                  />
                )}
                {!!p.maxPerCustomer && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Máx ${p.maxPerCustomer}`}
                    sx={{ height: 18, fontSize: 11 }}
                  />
                )}
              </Stack>
            )}
            {/* Departamento del circular con las palabras de la tienda. */}
            {p.department && (
              <Chip
                size="small"
                variant="outlined"
                label={p.department}
                sx={{ height: 18, fontSize: 11, mr: 0.5 }}
              />
            )}
            {/* Tag de origen: flyer de campaña / circular / manual. */}
            {p.source && (
              <Chip
                size="small"
                variant="outlined"
                color={
                  p.source === 'flyer'
                    ? 'secondary'
                    : p.source === 'circular'
                      ? 'primary'
                      : 'default'
                }
                label={
                  p.source === 'flyer' ? 'Flyer' : p.source === 'circular' ? 'Circular' : 'Manual'
                }
                sx={{ height: 18, fontSize: 11, mr: 0.5 }}
              />
            )}
            {/* Producto de un flyer que todavía no arrancó: el catálogo ya lo tiene,
                          pero recién rige desde esa fecha. Sin este aviso parecía vigente hoy. */}
            {p.effectiveFrom && (
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={
                  p.effectiveKind === 'price'
                    ? `${p.effectivePrice || 'Nuevo precio'} desde el ${fmtDate(p.effectiveFrom)}`
                    : `Sale el ${fmtDate(p.effectiveFrom)}`
                }
                title={p.effectiveCircularTitle || undefined}
                sx={{ height: 18, fontSize: 11, mt: 0.5 }}
              />
            )}
            {/* Marca y tamaño: la IA los lee mal seguido y antes no había forma de
                          corregirlos desde el panel. */}
            <Stack
              direction="row"
              gap={1}
              sx={{ mt: 0.25 }}
            >
              <TextField
                size="small"
                variant="standard"
                defaultValue={p.brand ?? ''}
                placeholder="marca"
                inputProps={{ style: { fontSize: 12 } }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (p.brand ?? '')) onPatch(p._id, { brand: v });
                }}
              />
              <TextField
                size="small"
                variant="standard"
                defaultValue={p.size ?? ''}
                placeholder={p.unit ? `por ${p.unit}` : 'tamaño'}
                inputProps={{ style: { fontSize: 12 } }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (p.size ?? '')) onPatch(p._id, { size: v });
                }}
              />
            </Stack>
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
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== String(p.price ?? '')) onPatch(p._id, { price: v });
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
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== String(p.originalPrice ?? '')) {
                  onPatch(p._id, { originalPrice: v, ...(v ? { hasOffer: true } : {}) });
                }
              }}
            />
            {/* Sin regular: se estima con la misma regla del backend (+25%) */}
            {!p.originalPrice?.trim() && regularFromPrice(p.price) && (
              <Tooltip title={`Calcular: ${regularFromPrice(p.price)} (oferta + 25%)`}>
                <Button
                  size="small"
                  sx={{ ml: 0.5, minWidth: 0, px: 0.75 }}
                  onClick={() =>
                    onPatch(p._id, { originalPrice: regularFromPrice(p.price)!, hasOffer: true })
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
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== String(p.savings ?? '')) onPatch(p._id, { savings: v });
              }}
            />
          </TableCell>
          <TableCell
            sx={cell}
            data-label="Categoría"
          >
            <Autocomplete
              freeSolo
              size="small"
              options={categoryOptions}
              value={p.category || 'other'}
              onChange={(_, v) => {
                const next = String(v || '')
                  .trim()
                  .toLowerCase();
                if (next && next !== p.category) {
                  onCategory(p._id, next);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder="categoría"
                  // Escribir una nueva y salir del campo también la guarda.
                  onBlur={(e) => {
                    const next = e.target.value.trim().toLowerCase();
                    if (next && next !== p.category) {
                      onCategory(p._id, next);
                    }
                  }}
                />
              )}
            />
          </TableCell>
          <TableCell
            sx={cell}
            align="center"
            data-label="En oferta"
          >
            <Switch
              size="small"
              checked={!!p.onPromotion}
              onChange={(e) => onPatch(p._id, { onPromotion: e.target.checked })}
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
              onChange={(e) => onPatch(p._id, { visibleInRcs: e.target.checked })}
            />
          </TableCell>
          <TableCell
            sx={cell}
            align="center"
          >
            <Tooltip title="Eliminar del catálogo">
              <IconButton
                size="small"
                onClick={() => onDelete(p)}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      )}
    </Draggable>
  );
});
