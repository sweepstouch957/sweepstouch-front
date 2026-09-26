'use client';

/** 2 · El circular que recibe los productos (de la campaña o del PDF): la base del catálogo. */
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  productCount,
  useAddMissing,
  useCampaignImportJob,
  useCircularBusy,
  useCircularPreview,
  useExtractProducts,
  useLastCampaignArt,
  useLoadCatalog,
  useStoreCirculars,
} from './hooks';
import { Meta, SectionHeader, Surface } from './panelUi';
import { circularLabel, fmtDate, statusChip } from './shared';
import { CircularCardSkeleton } from './skeletons';

const AMOUNTS = [10, 20, 30, 50];

type Props = {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  onPreview: (url: string, title: string) => void;
};

export default function WeeklyCircularCard({ storeId, storeSlug, storeName, onPreview }: Props) {
  const { top: circular, isLoading } = useStoreCirculars(storeSlug);
  const { campaign } = useLastCampaignArt(storeId);
  // Misma query que la sección 1: React Query la comparte, no suma pedidos.
  const { data: job } = useCampaignImportJob(campaign?._id);
  const { busy, extracting, adding, loading } = useCircularBusy(storeSlug);
  const extract = useExtractProducts(storeSlug);
  const addMissing = useAddMissing(storeSlug);
  const loadCatalog = useLoadCatalog(storeSlug);
  const preview = useCircularPreview(onPreview);

  // "Los primeros X" = los de foto grande (rápido, recortes limpios). 0 = todos de una.
  const [max, setMax] = useState(20);
  const [reextractOpen, setReextractOpen] = useState(false);

  if (isLoading) {
    return (
      <Surface>
        <CircularCardSkeleton />
      </Surface>
    );
  }
  if (!circular) return null;
  const n = productCount(circular);
  const receivedFromCampaign = job?.result?.circularId === circular._id;

  return (
    <Surface>
      <Stack spacing={2}>
        <SectionHeader
          step={2}
          title={circular.status === 'active' ? 'Circular de la semana' : 'Circular más reciente'}
          description="Es la base de productos de la tienda: de acá salen el catálogo y las listas de los clientes."
          action={
            circular.fileUrl && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                disabled={preview.isPending}
                onClick={() => preview.mutate(circular)}
              >
                {preview.isPending ? 'Abriendo…' : 'Ver circular'}
              </Button>
            )
          }
        />

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mr: 0.5 }}
            >
              {circularLabel(circular, storeSlug, storeName)}
            </Typography>
            <Chip
              size="small"
              {...statusChip(circular.status)}
            />
            {receivedFromCampaign && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                icon={<CampaignOutlinedIcon />}
                label={`Recibió ${job?.result?.added ?? 0} de la campaña`}
              />
            )}
            {circular.fileKey === 'campaign' && (
              <Chip
                size="small"
                variant="outlined"
                label="Creado por la campaña"
              />
            )}
          </Stack>
          <Stack
            direction="row"
            gap={2.5}
            flexWrap="wrap"
            sx={{ mt: 1 }}
          >
            <Meta icon={<CalendarMonthRoundedIcon />}>
              {fmtDate(circular.startDate)} → {fmtDate(circular.endDate)}
            </Meta>
            <Meta icon={<Inventory2OutlinedIcon />}>
              {n} producto{n !== 1 ? 's' : ''}
            </Meta>
            <Meta icon={<DescriptionOutlinedIcon />}>
              {circular.fileUrl ? 'Con archivo' : 'Sin archivo'}
            </Meta>
          </Stack>
          {circular.status === 'draft' && (
            <Alert
              severity="warning"
              variant="outlined"
              sx={{ mt: 1.5, py: 0 }}
            >
              Borrador: no sale en el linktree. Sus productos se ven en las listas sólo si los
              cargas al catálogo.
            </Alert>
          )}
        </Box>

        {!circular.fileUrl ? (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Adjunta el PDF o la imagen del circular (sección 3) para poder cargar sus productos.
          </Typography>
        ) : n > 0 ? (
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
                variant="text"
                disabled={busy}
                onClick={() => setReextractOpen(true)}
              >
                Volver a extraer
              </Button>
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => addMissing.mutate(circular._id)}
              >
                {adding ? 'Buscando…' : 'Agregar los que faltan'}
              </Button>
              <Button
                variant="contained"
                disabled={busy || loading}
                onClick={() => loadCatalog.mutate(circular._id)}
              >
                {loading ? 'Cargando…' : 'Cargar al catálogo'}
              </Button>
            </Stack>
          </Stack>
        ) : (
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
              onChange={setMax}
              disabled={busy}
              sx={{ width: 190 }}
            />
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => extract.mutate({ id: circular._id, max })}
            >
              {extracting ? 'Extrayendo…' : 'Extraer productos'}
            </Button>
          </Stack>
        )}
        {(loading || busy) && <LinearProgress sx={{ borderRadius: 1 }} />}
      </Stack>

      {/* Volver a extraer REEMPLAZA los productos: pregunta cuántos y avisa. */}
      <Dialog
        open={reextractOpen}
        onClose={() => setReextractOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0.5 }}>¿Volver a extraer?</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Reemplaza los {n} productos de este circular por una lectura nueva. Lo que corregiste a
            mano en el circular se pierde; el catálogo no se toca hasta que lo cargues.
          </Typography>
          <AmountSelect
            value={max}
            onChange={setMax}
            fullWidth
            label="Cantidad"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReextractOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setReextractOpen(false);
              extract.mutate({ id: circular._id, max });
            }}
          >
            Sí, volver a extraer
          </Button>
        </DialogActions>
      </Dialog>
    </Surface>
  );
}

function AmountSelect({
  value,
  onChange,
  ...rest
}: { value: number; onChange: (n: number) => void } & Omit<
  React.ComponentProps<typeof TextField>,
  'value' | 'onChange'
>) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
    >
      {AMOUNTS.map((a) => (
        <MenuItem
          key={a}
          value={a}
        >
          Los primeros {a} (foto grande)
        </MenuItem>
      ))}
      <MenuItem value={0}>Todos, por secciones (tarda más)</MenuItem>
    </TextField>
  );
}
