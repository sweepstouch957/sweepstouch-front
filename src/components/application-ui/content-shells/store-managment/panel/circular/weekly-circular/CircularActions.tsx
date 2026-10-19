'use client';

/**
 * Qué se puede hacer con el circular según su estado: sin archivo (subirlo), sin productos
 * (extraer) o con productos (pasarlos al catálogo + secundarias en "Más acciones").
 */
import { Button, Stack, Typography } from '@mui/material';
import { MoreMenu } from '../panelUi';
import AmountSelect from './AmountSelect';

export default function CircularActions({
  hasFile,
  productCount,
  busy,
  extracting,
  adding,
  loading,
  max,
  onMaxChange,
  onExtract,
  onLoadCatalog,
  onAddMissing,
  onReextract,
}: {
  hasFile: boolean;
  productCount: number;
  busy: boolean;
  extracting: boolean;
  adding: boolean;
  loading: boolean;
  max: number;
  onMaxChange: (n: number) => void;
  onExtract: () => void;
  onLoadCatalog: () => void;
  onAddMissing: () => void;
  onReextract: () => void;
}) {
  if (!hasFile) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
      >
        Adjunta el PDF o la imagen del circular (paso 2, «Subir el circular») para poder cargar sus
        productos.
      </Typography>
    );
  }

  if (productCount > 0) {
    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 520 }}
        >
          Pasa estos productos al catálogo para que los vea el cliente. Las imágenes quedan sin
          fondo y livianas.
        </Typography>
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
          sx={{ flexShrink: 0 }}
        >
          <Button
            variant="contained"
            disabled={busy || loading}
            onClick={onLoadCatalog}
          >
            {loading ? 'Cargando…' : 'Cargar al catálogo'}
          </Button>
          <MoreMenu
            items={[
              {
                label: adding ? 'Buscando los que faltan…' : 'Agregar los que faltan',
                hint: 'Segunda pasada por secciones: suma los productos chicos que la lectura se saltó.',
                disabled: busy,
                onClick: onAddMissing,
              },
              {
                label: 'Volver a extraer',
                hint: 'Reemplaza los productos de este circular por una lectura nueva. Pide confirmación.',
                disabled: busy,
                danger: true,
                onClick: onReextract,
              },
            ]}
          />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      gap={1.5}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flex: 1 }}
      >
        Todavía no tiene productos. Empieza por los de foto grande y después suma los chicos.
      </Typography>
      <AmountSelect
        value={max}
        onChange={onMaxChange}
        disabled={busy}
        sx={{ width: { xs: '100%', sm: 190 } }}
      />
      <Button
        variant="contained"
        disabled={busy}
        onClick={onExtract}
      >
        {extracting ? 'Extrayendo…' : 'Extraer productos'}
      </Button>
    </Stack>
  );
}
