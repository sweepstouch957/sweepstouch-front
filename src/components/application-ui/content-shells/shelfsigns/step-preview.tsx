'use client';

import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import RangePickerField from '@/components/base/range-picker-field';
import type { StoreHintDto } from '@/services/designs.service';
import React from 'react';
import { createPortal } from 'react-dom';
import { fmtOfferDate } from './dates';
import { matchStoreByHint } from './store-match';
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
  /** Lo que la IA leyó del encabezado del flyer. Preselecciona, no decide. */
  storeHint?: StoreHintDto | null;
  /** Encuadre de la foto: se ajusta acá, donde el cartón ya está armado. */
  onPatchProduct: (id: string, patch: Partial<ShelfSignProduct>) => void;
}

/** Zoom al que se muestra la hoja. Las puntas se compensan con él. */
const PREVIEW_SCALE = 0.6;

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

export function StepPreview({
  config,
  onChange,
  products,
  storeHint,
  onPatchProduct,
}: Props): React.JSX.Element {
  const { stores, loadingStores } = useActiveStores();
  const { qrUrl, loadingQr, qrMissing } = useStoreGenericQr(config.storeId);

  const selectedStore = React.useMemo(
    () => stores.find((s) => (s._id || s.id) === config.storeId) || null,
    [stores, config.storeId]
  );

  const hintedStore = React.useMemo(
    () => matchStoreByHint(storeHint || null, stores),
    [storeHint, stores]
  );

  /**
   * Preselecciona la tienda que la IA leyó del flyer, SÓLO si todavía no hay
   * ninguna elegida: si el diseñador ya eligió, manda él. El Autocomplete queda
   * igual de editable — la IA se equivoca y el QR equivocado sólo se descubre
   * con los cartones ya impresos.
   */
  React.useEffect(() => {
    if (!hintedStore || config.storeId) return;
    onChange({
      storeId: hintedStore._id || hintedStore.id,
      storeName: hintedStore.name || '',
      qrUrl: null,
    });
  }, [hintedStore, config.storeId, onChange]);

  // El QR viaja en la config para que cada cartón lo reciba junto al resto de
  // la plantilla, sin que ShelfSign tenga que saber de tiendas ni de red.
  React.useEffect(() => {
    if (qrUrl !== config.qrUrl) onChange({ qrUrl: qrUrl || null });
  }, [qrUrl, config.qrUrl, onChange]);

  const pages = React.useMemo(() => paginate(products), [products]);

  const [photoMode, setPhotoMode] = React.useState<'move' | 'crop'>('move');

  const edit = React.useMemo(
    () => ({ scale: PREVIEW_SCALE, mode: photoMode, onChange: onPatchProduct }),
    [photoMode, onPatchProduct]
  );

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

            {/* Un solo campo de rango (el del resto del panel) en vez de dos
                inputs sueltos: la vigencia de una oferta es UN dato, y el picker
                ya ordena las fechas, así que no se puede elegir un hasta
                anterior al desde. */}
            <Box sx={{ minWidth: 240 }}>
              <RangePickerField
                label="Vigencia de la oferta"
                value={{ startYmd: config.dateFrom, endYmd: config.dateTo }}
                onChange={({ startYmd, endYmd }) =>
                  onChange({ dateFrom: startYmd, dateTo: endYmd })
                }
              />
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: config.color }}
              >
                {config.dateFrom && config.dateTo
                  ? `${fmtOfferDate(config.dateFrom)} → ${fmtOfferDate(config.dateTo, true)}`
                  : 'Sin fechas'}
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

          {/* Que se vea de dónde salió la tienda: una preselección silenciosa es
              justo la que nadie revisa, y el QR equivocado se descubre con los
              cartones ya impresos. */}
          {storeHint?.name && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1.5 }}
            >
              {hintedStore
                ? `Tienda tomada del flyer: «${storeHint.name}${
                    storeHint.address ? ` — ${storeHint.address}` : ''
                  }». Cambiala si no es la correcta.`
                : `El flyer dice «${storeHint.name}», pero no encontré esa tienda en el catálogo: elegila a mano.`}
            </Typography>
          )}

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
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={photoMode}
              onChange={(_, v) => v && setPhotoMode(v)}
            >
              <ToggleButton value="move">Mover y agrandar</ToggleButton>
              <ToggleButton value="crop">Recortar</ToggleButton>
            </ToggleButtonGroup>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {photoMode === 'move'
                ? 'Arrastrá la foto para moverla; estirá desde las puntas para agrandarla. Se corta recién en el borde del cartón.'
                : 'Arrastrá las puntas hacia adentro para comerle el borde a la foto. El producto no cambia de tamaño: sólo se le saca marco.'}
            </Typography>
          </Stack>

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
                    transform: `scale(${PREVIEW_SCALE})`,
                    transformOrigin: 'top left',
                    width: '8.5in',
                    height: '6.7in',
                  }}
                >
                  <Sheet
                    pair={pair}
                    config={config}
                    shadow
                    edit={edit}
                  />
                </Box>
              </Box>

              {/* Devolver la foto a su caja. Sólo aparece si se movió: hasta
                  entonces no hay nada que restablecer. */}
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: -1 }}
              >
                {pair
                  .filter((p) => p.photoLayout || p.photoCrop)
                  .map((p) => (
                    <Stack
                      key={p.id}
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 140 }}
                        title={p.name}
                      >
                        {p.name}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<RestartAltRoundedIcon />}
                        disabled={!p.photoLayout && !p.photoCrop}
                        onClick={() =>
                          onPatchProduct(p.id, { photoLayout: undefined, photoCrop: undefined })
                        }
                        sx={{ textTransform: 'none' }}
                      >
                        Restablecer
                      </Button>
                    </Stack>
                  ))}
              </Stack>
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
