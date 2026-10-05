'use client';

/**
 * Revisión IA: lo que el agente cotejó contra el flyer (precios, nombres, letra chica),
 * qué arregló solo y qué quedó para decidir. Corre sola todos los días antes de las
 * campañas de las 6; acá también se corre a mano.
 */
import { circularService, type ProductReviewItem } from '@/services/circular.service';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { qk } from './hooks';
import { SectionHeader, Surface } from './panelUi';
import { fmtDate } from './shared';

const KIND: Record<ProductReviewItem['kind'], string> = {
  price: 'Precio',
  name: 'Nombre',
  fineprint: 'Letra chica',
  duplicate: 'Duplicado',
};

const show = (v: Record<string, any>) =>
  Object.entries(v || {})
    .filter(([, x]) => x !== '' && x !== null && x !== undefined)
    .map(([k, x]) => `${k}: ${String(x)}`)
    .join(' · ') || '—';

export default function ReviewSection({
  storeSlug,
  firstStep = 1,
}: {
  storeSlug: string;
  firstStep?: number;
}) {
  const qc = useQueryClient();
  const key = ['product-review', storeSlug];
  const q = useQuery({
    queryKey: key,
    queryFn: () => circularService.getProductReview(storeSlug),
    refetchInterval: (query) =>
      query.state.data?.run && !query.state.data.run.finishedAt ? 4000 : false,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const run = useMutation({
    mutationFn: () => circularService.runProductReview(storeSlug),
    onSuccess: () => {
      toast.success('Revisando… tarda unos minutos; te avisa en la campana.');
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo iniciar la revisión'),
  });
  const applySafe = useMutation({
    mutationFn: () => circularService.applySafeReviews(storeSlug),
    onSuccess: (d) => {
      toast.success(`${d.applied} precios aplicados`);
      refresh();
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
  });
  const apply = useMutation({
    mutationFn: (id: string) => circularService.applyReview(id),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo aplicar'),
  });
  const ignore = useMutation({
    mutationFn: (id: string) => circularService.ignoreReview(id),
    onSuccess: refresh,
  });

  const data = q.data;
  const r = data?.run;
  const running = !!r && !r.finishedAt;
  const open = data?.open ?? [];
  const safeOpen = open.filter(
    (it) => it.kind === 'price' && it.confidence >= (data?.autoConfidence ?? 0.9)
  ).length;

  return (
    <Stack spacing={2}>
      <Surface sx={{ p: { xs: 2, md: 2.5 } }}>
        <SectionHeader
          step={firstStep}
          title="El agente revisa los productos"
          description="Todos los días temprano, antes de las campañas, coteja precios, nombres y letra chica contra el flyer, aplica solo lo seguro y ordena qué se ve. Lo dudoso queda acá para decidir."
          action={
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              {safeOpen > 0 && (
                <Button
                  variant="outlined"
                  disabled={applySafe.isPending}
                  onClick={() => applySafe.mutate()}
                >
                  Aplicar {safeOpen} precios seguros
                </Button>
              )}
              <Button
                variant="contained"
                disabled={running || run.isPending}
                onClick={() => run.mutate()}
              >
                {running ? 'Revisando…' : 'Revisar ahora'}
              </Button>
            </Stack>
          }
        />
        {(q.isLoading || running) && <LinearProgress sx={{ borderRadius: 1, mt: 1 }} />}
        {r && (
          <Box
            sx={{
              mt: 1.5,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
              gap: 1.5,
            }}
          >
            <Stat
              label="Última corrida"
              value={fmtDate(r.startedAt)}
              sub={r.trigger === 'cron' ? 'automática' : 'a mano'}
            />
            <Stat
              label="Cotejados"
              value={String(r.productsChecked)}
              sub={`${r.pagesChecked} páginas · ${r.circulars.length} flyer${
                r.circulars.length === 1 ? '' : 's'
              }`}
            />
            <Stat
              label="Arreglados solos"
              value={String(r.autoApplied)}
              sub="precios con confianza alta"
            />
            <Stat
              label="Por revisar"
              value={String(r.open)}
              sub={`${r.duplicates} duplicados`}
            />
            <Stat
              label="Visibles / ocultos"
              value={`${r.visibility?.shown ?? 0} / ${r.visibility?.hidden ?? 0}`}
              sub={r.visibility?.flyers || 'sin flyer vivo'}
            />
          </Box>
        )}
        {r?.error && (
          <Typography
            color="error"
            variant="body2"
            sx={{ mt: 1 }}
          >
            Falló: {r.error}
          </Typography>
        )}
        {r && r.missingPhotos > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            {r.missingPhotos} productos visibles sin foto: se limpian desde Productos → "Limpiar
            imágenes con IA".
          </Typography>
        )}
        {!r && !q.isLoading && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Todavía no corrió para esta tienda.
          </Typography>
        )}
      </Surface>

      <Surface sx={{ p: { xs: 2, md: 2.5 } }}>
        <SectionHeader
          step={firstStep + 1}
          title={`Para decidir (${open.length})`}
          description="Lo que el flyer muestra distinto a lo guardado, o que no se pudo confirmar con seguridad."
        />
        {open.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Nada pendiente.
          </Typography>
        ) : (
          <Table
            size="small"
            sx={{ mt: 1 }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Qué</TableCell>
                <TableCell>Guardado</TableCell>
                <TableCell>El flyer dice</TableCell>
                <TableCell align="right">Confianza</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {open.map((it) => (
                <TableRow
                  key={it._id}
                  hover
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                    >
                      {it.name}
                    </Typography>
                    {it.page > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        pág. {it.page}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={KIND[it.kind]}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{show(it.current)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      {show(it.proposed)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {it.evidence}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{Math.round(it.confidence * 100)}%</TableCell>
                  <TableCell
                    align="right"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    <Button
                      size="small"
                      onClick={() => ignore.mutate(it._id)}
                    >
                      Ignorar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => apply.mutate(it._id)}
                    >
                      Aplicar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>

      {!!data?.recent?.length && (
        <Surface sx={{ p: { xs: 2, md: 2.5 } }}>
          <SectionHeader
            step={firstStep + 2}
            title="Aplicado recientemente"
            description="Lo que el agente arregló solo o se aplicó desde acá. Se puede corregir a mano en Productos."
          />
          <Stack
            gap={0.75}
            sx={{ mt: 1 }}
          >
            {data.recent.map((it) => (
              <Typography
                key={it._id}
                variant="body2"
              >
                <b>{it.name}</b> · {KIND[it.kind]}: {show(it.current)} → {show(it.proposed)}{' '}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  ({it.status === 'auto' ? 'solo' : 'a mano'}
                  {it.appliedAt ? `, ${fmtDate(it.appliedAt)}` : ''})
                </Typography>
              </Typography>
            ))}
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={800}
      >
        {value}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}
