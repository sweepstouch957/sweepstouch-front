'use client';

/**
 * Estado de la lista del cliente, de un vistazo: cuántos productos ve HOY, cuántos están
 * ocultos, cuántos esperan su fecha, y qué flyer o circular manda. Es la primera pregunta de
 * la tienda ("¿cuántos salen?") y antes había que ir a Productos y contar.
 */
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { alpha, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { useCatalogSummary } from './hooks';
import { fmtDate } from './shared';

function Kpi({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: strong ? 'primary.main' : 'divider',
        bgcolor: (t) => (strong ? alpha(t.palette.primary.main, 0.06) : 'background.paper'),
        minWidth: 0,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={800}
        lineHeight={1.2}
        color={strong ? 'primary.main' : 'text.primary'}
      >
        {value}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'none', letterSpacing: 0, display: 'block', lineHeight: 1.3 }}
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}

export default function ListStatusCard({
  storeSlug,
  onOpenProducts,
  onOpenUpcoming,
}: {
  storeSlug: string;
  onOpenProducts: () => void;
  onOpenUpcoming: () => void;
}) {
  const q = useCatalogSummary(storeSlug);
  const s = q.data;
  if (q.isLoading || !s) {
    return (
      <Skeleton
        variant="rounded"
        height={120}
        sx={{ borderRadius: 3 }}
      />
    );
  }
  const src = s.bySource;
  const srcTxt = [
    src.flyer ? `${src.flyer} del flyer` : '',
    src.circular ? `${src.circular} del circular` : '',
    src.manual ? `${src.manual} a mano` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <VisibilityOutlinedIcon
            color="primary"
            fontSize="small"
          />
          <Typography
            variant="subtitle1"
            fontWeight={800}
          >
            Lo que ve el cliente hoy
          </Typography>
          {s.ruling ? (
            <Chip
              size="small"
              color={s.ruling.kind === 'flyer' ? 'primary' : 'default'}
              variant="outlined"
              label={`${s.ruling.kind === 'flyer' ? 'Flyer' : 'Circular'}: ${
                s.ruling.title
              } · hasta ${fmtDate(s.ruling.endDate)}`}
            />
          ) : (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Sin flyer ni circular vigente"
            />
          )}
        </Stack>
        <Stack
          direction="row"
          gap={1}
        >
          {s.pending > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={onOpenUpcoming}
            >
              Ver los {s.pending} que esperan
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            onClick={onOpenProducts}
          >
            Ver productos
          </Button>
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}
      >
        <Kpi
          label="Visibles en la lista"
          value={String(s.visible)}
          sub={srcTxt || 'sin origen marcado'}
          strong
        />
        <Kpi
          label="Ocultos"
          value={String(s.hidden)}
          sub={
            s.hidden
              ? 'no están en el flyer vigente o se apagaron a mano'
              : 'todo el catálogo se ve'
          }
        />
        <Kpi
          label="Esperan su fecha"
          value={String(s.pending)}
          sub={s.pending ? 'precio o alta de un flyer futuro' : 'nada programado'}
        />
        <Kpi
          label="Visibles sin foto"
          value={String(s.noImage)}
          sub={s.noImage ? 'Iris las rehace; o Rescanear fotos en Productos' : 'todas con foto'}
        />
      </Box>
    </Box>
  );
}
