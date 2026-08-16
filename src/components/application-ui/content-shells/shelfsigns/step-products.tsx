'use client';

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
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

  const handleProducts = React.useCallback(
    (items: ShelfSignProduct[], mode: 'replace' | 'append') => {
      if (mode === 'replace') onSetProducts(items);
      else onAppendProducts(items);
    },
    [onAppendProducts, onSetProducts]
  );

  const { loading, status, error, flyerPreview, canContinue, analyze, continueAnalysis, setStatus } =
    useFlyerExtraction({ onProducts: handleProducts });

  const onPickFlyer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) analyze(file);
  };

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
                loading ? <CircularProgress size={16} color="inherit" /> : <UploadFileRoundedIcon />
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

            {canContinue && !loading && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={continueAnalysis}
              >
                Continuar análisis
              </Button>
            )}
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
            un problema con el cliente. Las cajas de recorte que devuelve la IA son aproximadas: si
            una foto salió mal encuadrada, quitala o subí una manual.
          </Alert>
          {products.map((p, i) => (
            <ProductEditorCard
              key={p.id}
              product={p}
              index={i}
              color={color}
              onChange={onPatchProduct}
              onRemove={onRemoveProduct}
            />
          ))}
        </>
      )}
    </Stack>
  );
}

export default StepProducts;
