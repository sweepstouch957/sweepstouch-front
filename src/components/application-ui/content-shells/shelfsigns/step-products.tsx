'use client';

import {
  useEnhanceProductImage,
  useSaveProductImages,
} from '@/hooks/fetching/designs/use-shelfsign-images';
import designsService, { productSlug } from '@/services/designs.service';
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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
}

export function StepProducts({
  products,
  color,
  onSetProducts,
  onAppendProducts,
  onPatchProduct,
  onRemoveProduct,
}: Props): React.JSX.Element {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = React.useState(false);
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

  const { loading, status, error, flyerPreview, flyerUrl, analyze, setStatus } = useFlyerExtraction({
    onProducts: handleProducts,
    onPatchProduct,
  });

  const enhance = useEnhanceProductImage();
  const saveToLibrary = useSaveProductImages();

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

          {flyerPreview && (
            <Box
              component="img"
              src={flyerPreview}
              alt="Flyer"
              sx={{
                mt: 2,
                maxHeight: 180,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                display: 'block',
              }}
            />
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
            />
          ))}
        </>
      )}
    </Stack>
  );
}

export default StepProducts;
