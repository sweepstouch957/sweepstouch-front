'use client';

import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { createPortal } from 'react-dom';
import { fmtOfferDate } from './dates';
import { paginate, Sheet } from './sheet';
import type { ShelfSignConfig, ShelfSignProduct } from './types';
import { useActiveStores, useStoreGenericQr } from './use-shelfsign-data';

/**
 * Paso 3 — Vista previa y PDF.
 *
 * La tienda no se imprime en el cartón: sólo determina qué QR va en la franja
 * VIP y sirve para organizar. El QR es el genérico que la tienda ya tiene
 * generado; acá no se genera ninguno.
 */

interface Props {
  config: ShelfSignConfig;
  onChange: (patch: Partial<ShelfSignConfig>) => void;
  products: ShelfSignProduct[];
}

/**
 * Las hojas a imprimir se montan colgando de <body>, no del árbol de la página.
 * Dentro del shell del admin cualquier ancestro con `overflow: hidden` o un
 * `transform` recorta el área de impresión y el PDF sale con una hoja o en
 * blanco; un portal la saca de todos esos contenedores.
 */
function PrintArea({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<div className="ss-print-area">{children}</div>, document.body);
}

export function StepPreview({ config, onChange, products }: Props): React.JSX.Element {
  const { stores, loadingStores } = useActiveStores();
  const { qrUrl, loadingQr, qrMissing } = useStoreGenericQr(config.storeId);

  const selectedStore = React.useMemo(
    () => stores.find((s) => (s._id || s.id) === config.storeId) || null,
    [stores, config.storeId]
  );

  // El QR viaja en la config para que cada cartón lo reciba junto al resto de
  // la plantilla, sin que ShelfSign tenga que saber de tiendas ni de red.
  React.useEffect(() => {
    if (qrUrl !== config.qrUrl) onChange({ qrUrl: qrUrl || null });
  }, [qrUrl, config.qrUrl, onChange]);

  const pages = React.useMemo(() => paginate(products), [products]);

  const missing: string[] = [];
  if (!products.length) missing.push('cargar productos');
  if (!config.storeId) missing.push('elegir tienda');
  else if (!qrUrl) missing.push('QR de la tienda');
  if (!config.dateFrom || !config.dateTo) missing.push('completar las fechas');

  const datesInverted =
    !!config.dateFrom && !!config.dateTo && config.dateTo < config.dateFrom;

  const canPrint = missing.length === 0 && !datesInverted;

  const fileName = React.useMemo(() => {
    const slug = selectedStore?.slug || 'tienda';
    return `shelfsigns-${slug}-${config.dateFrom || 'sin-fecha'}`;
  }, [selectedStore, config.dateFrom]);

  /**
   * El navegador usa document.title como nombre por defecto al "Guardar como
   * PDF". Es la única forma de acercarse al nombre pedido sin generar el PDF
   * server-side (ver fase 2, Puppeteer).
   */
  const handlePrint = () => {
    const previous = document.title;
    document.title = fileName;
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    // Safari no siempre dispara afterprint.
    window.setTimeout(restore, 5000);
  };

  return (
    <Stack spacing={2.5}>
      <Card className="ss-no-print">
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'flex-start' }}
          >
            <Autocomplete
              sx={{ minWidth: 280, flex: 1 }}
              options={stores}
              loading={loadingStores}
              value={selectedStore}
              getOptionLabel={(s) => s.name || ''}
              isOptionEqualToValue={(a, b) => (a._id || a.id) === (b._id || b.id)}
              onChange={(_, store) =>
                onChange({
                  storeId: store ? store._id || store.id : '',
                  storeName: store?.name || '',
                  qrUrl: null,
                })
              }
              renderOption={(props, s) => (
                <Box
                  component="li"
                  {...props}
                  key={s._id || s.id}
                >
                  <Box>
                    <Typography variant="body2">{s.name}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {s.address}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Tienda (QR y organización — no se imprime)"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStores || loadingQr ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Box>
              <TextField
                size="small"
                type="date"
                label="Válido desde"
                InputLabelProps={{ shrink: true }}
                value={config.dateFrom}
                onChange={(e) => onChange({ dateFrom: e.target.value })}
              />
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: config.color }}
              >
                {fmtOfferDate(config.dateFrom) || '—'}
              </Typography>
            </Box>

            <Box>
              <TextField
                size="small"
                type="date"
                label="Válido hasta"
                InputLabelProps={{ shrink: true }}
                value={config.dateTo}
                onChange={(e) => onChange({ dateTo: e.target.value })}
                error={datesInverted}
              />
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: config.color }}
              >
                {fmtOfferDate(config.dateTo, true) || '—'}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<PrintRoundedIcon />}
              disabled={!canPrint}
              onClick={handlePrint}
            >
              Imprimir / Guardar PDF ({pages.length} {pages.length === 1 ? 'hoja' : 'hojas'})
            </Button>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2 }}
          >
            {products.length} producto(s) → {pages.length} hoja(s) carta, 2 cartones por hoja.
            {canPrint && ` Nombre sugerido: ${fileName}.pdf`}
          </Typography>

          {qrMissing && config.storeId && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
            >
              Esta tienda no tiene QR genérico generado. Se genera desde el módulo de QR; sin él
              los cartones saldrían sin código.
            </Alert>
          )}
          {datesInverted && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
            >
              La fecha final es anterior a la inicial.
            </Alert>
          )}
          {!canPrint && !datesInverted && missing.length > 0 && (
            <Alert
              severity="info"
              sx={{ mt: 2 }}
            >
              Falta {missing.join(', ')} antes de imprimir.
            </Alert>
          )}
          {canPrint && (
            <Alert
              severity="success"
              sx={{ mt: 2 }}
            >
              En el diálogo de impresión: tamaño carta, orientación vertical, márgenes en
              &quot;Ninguno&quot; y sin encabezados ni pies de página.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Vista previa en pantalla ── */}
      {pages.length === 0 ? (
        <Card
          variant="outlined"
          className="ss-no-print"
        >
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Todavía no hay cartones. Volvé al paso de productos.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack
          spacing={3}
          className="ss-no-print"
        >
          {pages.map((pair, i) => (
            <Box key={pair[0].id}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Hoja {i + 1} de {pages.length}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Box
                  sx={{
                    transform: 'scale(0.6)',
                    transformOrigin: 'top left',
                    width: '8.5in',
                    height: '6.7in',
                  }}
                >
                  <Sheet
                    pair={pair}
                    config={config}
                    shadow
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {/* ── Lo que realmente se imprime: fuera de pantalla, sin escalar ── */}
      <PrintArea>
        {pages.map((pair) => (
          <Sheet
            key={`print-${pair[0].id}`}
            pair={pair}
            config={config}
          />
        ))}
      </PrintArea>
    </Stack>
  );
}

export default StepPreview;
