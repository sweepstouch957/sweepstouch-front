'use client';

import {
  useEnhanceProductImage,
  useRemoveProductBackground,
  useSaveProductImages,
  useSetActiveProductImage,
  useShelfsignProductImages,
} from '@/hooks/fetching/designs/use-shelfsign-images';
import {
  FlyerCropper,
  type PctBox,
} from '@/components/application-ui/content-shells/store-managment/panel/circular/ProductImageTools';
import designsService, {
  productSlug,
  type ProductImageVersion,
  type StoreHintDto,
} from '@/services/designs.service';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import React from 'react';
import { demoProducts } from './constants';
import { parseManualLine } from './parse';
import { ProductEditorCard } from './product-editor-card';
import type { ShelfSignProduct } from './types';
import { useFlyerExtraction } from './use-flyer-extraction';

/**
 * Paso 2 — Productos: extracción con IA + revisión humana (obligatoria) o carga
 * manual desde una lista.
 */

interface Props {
  products: ShelfSignProduct[];
  color: string;
  onSetProducts: (items: ShelfSignProduct[]) => void;
  onAppendProducts: (items: ShelfSignProduct[]) => void;
  onPatchProduct: (id: string, patch: Partial<ShelfSignProduct>) => void;
  onRemoveProduct: (id: string) => void;
  /** La tienda que dice el flyer, para que el paso 3 la preseleccione. */
  onStoreHint?: (hint: StoreHintDto) => void;
}

export function StepProducts({
  products,
  color,
  onSetProducts,
  onAppendProducts,
  onPatchProduct,
  onRemoveProduct,
  onStoreHint,
}: Props): React.JSX.Element {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [manualText, setManualText] = React.useState('');
  const [manualNote, setManualNote] = React.useState('');
  const [enhancingId, setEnhancingId] = React.useState<string | null>(null);
  const [photoNote, setPhotoNote] = React.useState('');

  const handleProducts = React.useCallback(
    (items: ShelfSignProduct[], mode: 'replace' | 'append') => {
      if (mode === 'replace') onSetProducts(items);
      else onAppendProducts(items);
    },
    [onAppendProducts, onSetProducts]
  );

  const {
    loading,
    status,
    error,
    flyerPreview,
    flyerUrl,
    pendingPhotoIds,
    storeHint,
    analyze,
    setStatus,
  } = useFlyerExtraction({
    onProducts: handleProducts,
    onPatchProduct,
  });

  React.useEffect(() => {
    if (storeHint) onStoreHint?.(storeHint);
  }, [storeHint, onStoreHint]);

  /** Subidas manuales en vuelo. Se suman a las del pipeline para el skeleton. */
  const [uploadingIds, setUploadingIds] = React.useState<string[]>([]);

  const enhance = useEnhanceProductImage();
  const removeBackground = useRemoveProductBackground();
  const saveToLibrary = useSaveProductImages();
  const setActiveVersion = useSetActiveProductImage();

  /* ── Versiones guardadas de cada producto ──
     Una sola consulta para todos los cartones: la librería guarda el historial
     por slug, así que volver a la foto de otra semana no cuesta nada. */
  const slugs = React.useMemo(
    () => Array.from(new Set(products.map((p) => productSlug(p.name)).filter(Boolean))),
    [products]
  );
  const { data: libraryImages } = useShelfsignProductImages(slugs);

  const versionsBySlug = React.useMemo(() => {
    const map = new Map<string, ProductImageVersion[]>();
    for (const img of libraryImages || []) {
      // La activa primero: es la que el cartón está usando ahora.
      const list = [...(img.versions || [])];
      if (img.url && !list.some((v) => v.url === img.url)) {
        list.unshift({ url: img.url, source: img.source });
      }
      map.set(img.slug, list);
    }
    return map;
  }, [libraryImages]);

  /** Vuelve a una foto ya guardada: se usa en el cartón y queda como default. */
  const handlePickVersion = React.useCallback(
    (p: ShelfSignProduct, url: string) => {
      onPatchProduct(p.id, { photo: url, photoBox: null });
      const slug = productSlug(p.name);
      if (slug) setActiveVersion.mutate({ slug, url });
    },
    [onPatchProduct, setActiveVersion]
  );

  /**
   * Recorte a mano sobre el flyer, el mismo gesto que el panel del circular.
   * La IA acierta la mayoría, pero en el cabezal —tres carnes en una sola foto—
   * el diseñador ve en un segundo lo que al modelo le cuesta, y antes su única
   * salida era abrir Photoshop y subir el PNG.
   */
  const [cropFor, setCropFor] = React.useState<ShelfSignProduct | null>(null);
  const [cropping, setCropping] = React.useState(false);

  const handleCropFromFlyer = React.useCallback(
    async (box: PctBox) => {
      const p = cropFor;
      if (!p || !flyerUrl) return;
      setCropping(true);
      setPhotoNote('');
      try {
        const url = await removeBackground.mutateAsync({
          imageUrl: flyerUrl,
          box,
          slug: productSlug(p.name),
          name: p.name,
        });
        if (url) {
          onPatchProduct(p.id, { photo: url, photoBox: box });
          setCropFor(null);
        } else {
          setPhotoNote(`No se pudo recortar "${p.name}". Probá con un rectángulo más amplio.`);
        }
      } catch (e: any) {
        setPhotoNote(
          `No se pudo recortar "${p.name}": ${e?.response?.data?.error || e?.message || e}`
        );
      } finally {
        setCropping(false);
      }
    },
    [cropFor, flyerUrl, onPatchProduct, removeBackground]
  );
  /**
   * Limpieza en lote. El recorte del flyer trae fondo, precio y a veces medio
   * producto vecino; el diseñador los iba limpiando de a uno y en un flyer de 40
   * eso son 40 clics. Acá se hace de corrido, de a dos a la vez (el modelo de
   * imagen es lo caro y lo lento), y se puede cortar a mitad de camino.
   */
  const [bulk, setBulk] = React.useState<{ done: number; total: number } | null>(null);
  const bulkStop = React.useRef(false);

  const onPickFlyer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) analyze(file);
  };

  /**
   * "Mejorar con IA": parte de la foto limpia si ya existe, o del flyer + la
   * caja del producto. Siempre vuelve a revisión: el modelo a veces redibuja
   * etiquetas y logos.
   */
  const handleEnhance = React.useCallback(
    async (p: ShelfSignProduct) => {
      const fromCutout = p.photo?.startsWith('http');
      const imageUrl = fromCutout ? p.photo! : flyerUrl;
      if (!imageUrl) return;

      setEnhancingId(p.id);
      setPhotoNote('');
      try {
        const url = await enhance.mutateAsync({
          imageUrl,
          box: fromCutout ? null : p.photoBox,
          slug: productSlug(p.name),
          name: p.name,
        });
        if (url) onPatchProduct(p.id, { photo: url });
        else setPhotoNote(`No se pudo mejorar "${p.name}".`);
      } catch (e: any) {
        setPhotoNote(
          `No se pudo mejorar "${p.name}": ${e?.response?.data?.error || e?.message || e}`
        );
      } finally {
        setEnhancingId(null);
      }
    },
    [enhance, flyerUrl, onPatchProduct]
  );

  /** Los que todavía se ven como salieron del flyer: sin foto, o con el recorte crudo. */
  const dirty = React.useMemo(
    () => products.filter((p) => p.photo?.startsWith('http') || (flyerUrl && p.photoBox)),
    [products, flyerUrl]
  );

  const runBulkClean = React.useCallback(async () => {
    if (!dirty.length) return;
    bulkStop.current = false;
    setBulk({ done: 0, total: dirty.length });
    setPhotoNote('');
    let failed = 0;
    const queue = [...dirty];
    const worker = async () => {
      while (queue.length && !bulkStop.current) {
        const p = queue.shift();
        if (!p) return;
        const fromCutout = p.photo?.startsWith('http');
        const imageUrl = fromCutout ? p.photo! : flyerUrl;
        if (!imageUrl) continue;
        try {
          const url = await enhance.mutateAsync({
            imageUrl,
            box: fromCutout ? null : p.photoBox,
            slug: productSlug(p.name),
            name: p.name,
          });
          if (url) onPatchProduct(p.id, { photo: url });
          else failed += 1;
        } catch {
          // Una foto que falla no corta la tanda: se cuenta y se sigue.
          failed += 1;
        }
        setBulk((b) => (b ? { ...b, done: b.done + 1 } : b));
      }
    };
    await Promise.all([worker(), worker()]);
    setBulk(null);
    if (failed) setPhotoNote(`${failed} de ${dirty.length} no se pudieron limpiar. Probá de a una.`);
  }, [dirty, enhance, flyerUrl, onPatchProduct]);

  /**
   * Foto subida a mano por el diseñador. Se muestra al instante desde el
   * archivo local y en paralelo se guarda en la librería con origen "designer":
   * son los PNG limpios de Photoshop, la fuente más confiable, y así la próxima
   * semana ese producto no necesita ni detección ni recorte.
   */
  const handlePhotoFile = React.useCallback(
    async (p: ShelfSignProduct, file: File) => {
      const slug = productSlug(p.name);
      if (!slug) return;
      setUploadingIds((ids) => [...ids, p.id]);
      try {
        const uploaded = await designsService.uploadFlyer(file);
        await saveToLibrary.mutateAsync([
          { slug, name: p.name, url: uploaded.url, source: 'designer' },
        ]);
        onPatchProduct(p.id, { photo: uploaded.url, photoBox: null });
      } catch {
        // La vista previa local ya quedó puesta: el cartón sale igual, sólo no
        // se guardó en la librería.
        setPhotoNote(`La foto de "${p.name}" no se pudo guardar en la librería.`);
      } finally {
        setUploadingIds((ids) => ids.filter((id) => id !== p.id));
      }
    },
    [onPatchProduct, saveToLibrary]
  );

  const generateFromList = () => {
    const items = manualText.split('\n').map(parseManualLine).filter(Boolean) as ShelfSignProduct[];
    if (!items.length) {
      setManualNote('Escribí al menos una línea.');
      return;
    }
    onAppendProducts(items);
    setManualText('');
    setManualNote('');
    setManualOpen(false);
    setStatus(`${items.length} cartón(es) generados desde la lista. Completá los detalles donde falte.`);
  };

  return (
    <Stack spacing={2.5}>
      <Card>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Extraer productos del flyer
            </Typography>
            {/* Discreto a propósito: es para pruebas, no parte del flujo real. */}
            <Button
              size="small"
              variant="text"
              color="inherit"
              sx={{ opacity: 0.5, minWidth: 0, fontSize: 11 }}
              onClick={() => {
                onSetProducts(demoProducts());
                setStatus('Demo cargado.');
              }}
            >
              demo
            </Button>
          </Stack>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickFlyer}
          />

          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
          >
            <Button
              variant="contained"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
              startIcon={
                loading ? <CircularProgress size={16}
color="inherit" /> : <UploadFileRoundedIcon />
              }
            >
              {loading ? 'Procesando…' : 'Subir flyer y analizar con IA'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<PlaylistAddRoundedIcon />}
              onClick={() => setManualOpen((o) => !o)}
            >
              Agregar manual (lista)
            </Button>
          </Stack>

          {status && !error && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.5 }}
            >
              {status}
            </Typography>
          )}
          {error && (
            <Alert
              severity="error"
              sx={{ mt: 1.5 }}
            >
              {error}
            </Alert>
          )}
          {photoNote && (
            <Alert
              severity="warning"
              sx={{ mt: 1.5 }}
              onClose={() => setPhotoNote('')}
            >
              {photoNote}
            </Alert>
          )}


          <Collapse in={manualOpen}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <TextField
                label="Un producto por línea — nombre y precio en formato libre"
                fullWidth
                multiline
                minRows={4}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={'JUMBO WHITE EGGS 3/$5\nBONELESS CHICKEN BREAST $2.29 LB\nTROPICANA ORANGE JUICE 2/95¢'}
                error={!!manualNote}
                helperText={manualNote || 'Detecta: $2.29 LB · 3/$5 · 2/95¢ · 49¢ · EA / LB'}
              />
              <Button
                variant="contained"
                sx={{ mt: 1.5 }}
                onClick={generateFromList}
              >
                Generar cartones desde la lista
              </Button>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* El flyer a un clic desde cualquier punto de la lista: la revisión es
          comparar cada cartón contra el papel, y el visor va en un modal con zoom
          porque al ancho de la tarjeta los precios chicos no se leen. */}
      {flyerPreview && (
        <Card
          variant="outlined"
          sx={{ position: 'sticky', top: 8, zIndex: 3 }}
        >
          <CardContent
            sx={{
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:last-child': { pb: 1 },
            }}
          >
            <Box
              component="img"
              src={flyerPreview}
              alt=""
              onClick={() => setViewerOpen(true)}
              sx={{
                height: 44,
                width: 44,
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'zoom-in',
              }}
            />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ flex: 1 }}
            >
              Flyer subido
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ZoomInRoundedIcon />}
              onClick={() => setViewerOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Ver flyer
            </Button>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Todavía no hay cartones. Subí un flyer, cargá una lista manual o probá el demo.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Limpiar todas de una: el mismo modelo que deja los productos del catálogo
              sin fondo ni precio, pero sobre los cartones y en tanda. */}
          <Card variant="outlined">
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                py: 2,
                '&:last-child': { pb: 2 },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                >
                  Limpiar las fotos con IA
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {bulk
                    ? `Limpiando ${bulk.done} de ${bulk.total}… podés seguir editando precios.`
                    : `Deja cada producto sin fondo ni precio encima, como en el catálogo. ${dirty.length} cartón${dirty.length === 1 ? '' : 'es'} para limpiar · una generación por producto.`}
                </Typography>
                {bulk && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.round((bulk.done / Math.max(1, bulk.total)) * 100)}
                    sx={{ mt: 1, borderRadius: 1 }}
                  />
                )}
              </Box>
              {bulk ? (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    bulkStop.current = true;
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Detener
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={!dirty.length}
                  onClick={runBulkClean}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Limpiar {dirty.length || ''} con IA
                </Button>
              )}
            </CardContent>
          </Card>

          <Alert severity="warning">
            Revisá cada precio antes de generar el PDF. Un precio mal leído impreso en góndola es
            un problema con el cliente. Si una foto salió mal encuadrada o con gráficos encima,
            probá "Mejorar con IA", quitala o subí una manual.
          </Alert>
          {products.map((p, i) => (
            <ProductEditorCard
              key={p.id}
              product={p}
              index={i}
              color={color}
              onChange={onPatchProduct}
              onRemove={onRemoveProduct}
              onEnhance={p.photo?.startsWith('http') || (flyerUrl && p.photoBox) ? handleEnhance : undefined}
              enhancing={enhancingId === p.id}
              onPhotoFile={handlePhotoFile}
              onCropFromFlyer={flyerUrl ? setCropFor : undefined}
              photoLoading={pendingPhotoIds.includes(p.id) || uploadingIds.includes(p.id)}
              versions={versionsBySlug.get(productSlug(p.name))}
              onPickVersion={handlePickVersion}
            />
          ))}
        </>
      )}

      {/* Visor del flyer. El zoom arranca en "entra entero" y sube hasta 4x: a
          tamaño real un flyer de 1050x2300 no entra en ninguna pantalla, y lo que
          se viene a mirar son los precios chicos de la grilla de grocery. */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}
        >
          <Box sx={{ flex: 1 }}>Flyer subido</Box>
          <IconButton
            size="small"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
          >
            <ZoomOutRoundedIcon />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ width: 52, textAlign: 'center' }}
          >
            {zoom.toFixed(1)}x
          </Typography>
          <IconButton
            size="small"
            disabled={zoom >= 4}
            onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
          >
            <ZoomInRoundedIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewerOpen(false)}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.default' }}>
          <Box sx={{ maxHeight: '78vh', overflow: 'auto' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flyerPreview || flyerUrl || ''}
              alt="Flyer"
              onClick={() => setZoom((z) => (z >= 4 ? 1 : z + 1))}
              style={{
                width: `${zoom * 100}%`,
                display: 'block',
                margin: '0 auto',
                cursor: zoom >= 4 ? 'zoom-out' : 'zoom-in',
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cropFor}
        onClose={cropping ? undefined : () => setCropFor(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Recortar del flyer — {cropFor?.name}
        </DialogTitle>
        <DialogContent>
          {cropFor && (flyerPreview || flyerUrl) && (
            <FlyerCropper
              flyerUrl={flyerPreview || flyerUrl || ''}
              busy={cropping}
              hint={`Arrastrá un rectángulo alrededor de "${cropFor.name}". No importa si entra el precio o el fondo: se le quita todo y queda el producto solo.`}
              cta="Recortar y limpiar"
              onCancel={() => setCropFor(null)}
              onCrop={handleCropFromFlyer}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

export default StepProducts;
