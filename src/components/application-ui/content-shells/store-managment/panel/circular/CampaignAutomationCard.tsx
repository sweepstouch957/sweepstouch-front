'use client';

/**
 * 1 · Automático: al agendar una campaña con arte, sus productos y su banner llegan solos a
 * la lista del cliente (cola /campaign-import de circular-service). Acá se ve el flujo, se
 * reintenta si falló y se puede releer el arte a mano.
 */
import { circularService } from '@/services/circular.service';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import CampaignAutomationFlow, { buildSteps } from './CampaignAutomationFlow';
import {
  qk,
  useCampaignImportJob,
  useCircularBusy,
  useLastCampaignArt,
  useRefreshStoreData,
  useStoreCirculars,
} from './hooks';
import { fmtDate } from './shared';
import { FlowSkeleton } from './skeletons';

type Props = {
  storeId: string;
  storeSlug: string;
  upcomingCount: number;
  onOpenUpcoming: () => void;
  onPreview: (url: string, title: string) => void;
};

export default function CampaignAutomationCard({
  storeId,
  storeSlug,
  upcomingCount,
  onOpenUpcoming,
  onPreview,
}: Props) {
  const qc = useQueryClient();
  const refresh = useRefreshStoreData(storeSlug);
  const { campaign, image, source, isLoading: campaignLoading } = useLastCampaignArt(storeId);
  const { current } = useStoreCirculars(storeSlug);
  const { busy } = useCircularBusy(storeSlug);

  // Mientras corre el import se consulta seguido; al terminar llega aviso a la campana.
  const campaignId: string | undefined = campaign?._id;
  const job = useCampaignImportJob(campaignId);
  const status = job.data?.status;
  // Al pasar a "done" se refresca lo que el import cambió (circulares, catálogo, banners).
  useEffect(() => {
    if (status !== 'done') return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, storeSlug]);

  const steps = useMemo(
    () => buildSteps(image ? campaign : null, job.data ?? null),
    [image, campaign, job.data]
  );

  const retry = useMutation({
    mutationFn: () =>
      circularService.retryCampaignImport({
        campaignId: campaign._id,
        storeId,
        imageUrl: source,
        startDate: campaign.startDate,
        title: campaign.title,
      }),
    onSuccess: () => {
      toast.success('Reintentando: te avisamos en la campana cuando termine.');
      qc.invalidateQueries({ queryKey: qk.campaignImport(campaignId) });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo reintentar'),
  });

  // Lectura a mano: se pregunta antes cuántos y si se limpian las imágenes (cada imagen limpia
  // por IA cuesta). Por defecto TODOS: quedarse con 10 dejaba el catálogo a medias.
  const [askOpen, setAskOpen] = useState(false);
  const [max, setMax] = useState(0);
  const [clean, setClean] = useState(true);
  // Crear circular con el arte: apagado a propósito (quedaba ACTIVO como circular de la
  // semana sin que nadie lo decidiera). Sin circular vigente va a un borrador.
  const [publish, setPublish] = useState(false);

  const readByHand = useMutation({
    mutationFn: async () => {
      if (current) {
        const d = await circularService.addProductsFromImage(current._id, source, max, {
          aiImages: clean,
        });
        return { mode: 'added' as const, added: d.added, found: d.found };
      }
      const created = await circularService.createFromImageUrl(
        storeSlug,
        source,
        'Arte de la última campaña',
        { draft: !publish }
      );
      const ex = await circularService.extractProducts(created.circular._id, max, {
        aiImages: clean,
      });
      const n = ex?.circular?.products?.length ?? 0;
      return { mode: publish ? ('created' as const) : ('draft' as const), added: n, found: n };
    },
    onSuccess: (d) => {
      toast.success(
        d.mode === 'added'
          ? d.added
            ? `${d.added} productos nuevos sumados desde la campaña (de ${d.found} encontrados)`
            : 'Todos los productos de la campaña ya estaban cargados'
          : d.mode === 'draft'
            ? `${d.added} productos cargados desde la campaña. Quedaron en un borrador: la tienda sigue sin circular de la semana.`
            : `Circular creado desde la campaña: ${d.added} productos. Las imágenes se limpian en segundo plano.`
      );
      refresh();
    },
    onError: (e: any) => {
      if (e?.response)
        toast.error(
          `No se pudo cargar desde la campaña: ${
            e.response.data?.error || `error ${e.response.status}`
          }`,
          { duration: 9000 }
        );
      else toast('La extracción sigue corriendo en el servidor. Refresca en unos minutos.');
      refresh();
    },
  });

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        borderColor: (t) => alpha(t.palette.primary.main, 0.35),
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        flexWrap="wrap"
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
          >
            <Box
              aria-hidden
              sx={{
                width: 22,
                height: 22,
                borderRadius: 1.25,
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: 'primary.contrastText',
                bgcolor: 'primary.main',
              }}
            >
              1
            </Box>
            <Typography
              variant="overline"
              color="primary"
              fontWeight={800}
              lineHeight={1.4}
            >
              Automático
            </Typography>
            {status === 'running' && (
              <Chip
                size="small"
                color="info"
                label="Trabajando ahora"
              />
            )}
          </Stack>
          <Typography
            variant="h6"
            fontWeight={800}
            lineHeight={1.25}
          >
            Campaña → lista del cliente
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Al agendar una campaña con arte, la IA lee sus productos y su banner y los suma a la
            lista con los precios del día de la campaña.
          </Typography>
        </Box>
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          {upcomingCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<EventRoundedIcon />}
              onClick={onOpenUpcoming}
            >
              Revisar {upcomingCount} próximo{upcomingCount !== 1 ? 's' : ''}
            </Button>
          )}
          <Button
            component={NextLink}
            href={`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`}
            variant="contained"
          >
            Agendar campaña
          </Button>
        </Stack>
      </Stack>

      {campaignLoading ? <FlowSkeleton /> : <CampaignAutomationFlow steps={steps} />}

      {image && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack
            direction="row"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
          >
            <Box
              component="button"
              type="button"
              aria-label="Ver el arte de la campaña en grande"
              onClick={() => onPreview(image, campaign?.title || 'Arte de la campaña')}
              sx={{
                width: 72,
                height: 100,
                p: 0,
                flexShrink: 0,
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                cursor: 'zoom-in',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Arte de la última campaña
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
              >
                {campaign?.title || 'Sin título'}
                {campaign?.startDate ? ` · ${fmtDate(campaign.startDate)}` : ''}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {job.data
                  ? 'Si faltó algún producto, se puede volver a leer a mano: sólo suma los que no están.'
                  : 'Esta campaña se agendó antes de la automatización: carga sus productos a mano.'}
              </Typography>
            </Box>
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              {status === 'failed' && (
                <Button
                  variant="contained"
                  color="error"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate()}
                >
                  {retry.isPending ? 'Reintentando…' : 'Reintentar automático'}
                </Button>
              )}
              <Button
                variant={job.data ? 'outlined' : 'contained'}
                disabled={readByHand.isPending || busy}
                onClick={() => setAskOpen(true)}
              >
                {readByHand.isPending
                  ? 'Leyendo la imagen…'
                  : job.data
                    ? 'Leer de nuevo a mano'
                    : 'Cargar productos de la campaña'}
              </Button>
            </Stack>
          </Stack>
          {readByHand.isPending && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
        </>
      )}

      <Dialog
        open={askOpen}
        onClose={() => setAskOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0.5 }}>¿Cuántos productos extraer?</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Un arte de campaña puede traer hasta 40 productos. Lo que más cuesta es la imagen limpia
            por IA: es una generación por cada producto.
          </Typography>
          <TextField
            select
            size="small"
            fullWidth
            label="Cantidad"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            helperText={
              max
                ? 'Primero los de foto más grande (carnes y ofertas principales).'
                : 'Todos: por secciones, tarda varios minutos.'
            }
          >
            {[5, 10, 20, 30].map((n) => (
              <MenuItem
                key={n}
                value={n}
              >
                Los primeros {n}
              </MenuItem>
            ))}
            <MenuItem value={0}>Todos los productos</MenuItem>
          </TextField>
          <Stack
            direction="row"
            alignItems="flex-start"
            gap={1}
            sx={{ mt: 1.5 }}
          >
            <Switch
              checked={clean}
              onChange={(e) => setClean(e.target.checked)}
            />
            <Box sx={{ pt: 0.75 }}>
              <Typography
                variant="body2"
                fontWeight={600}
              >
                Limpiar las imágenes con IA ahora
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {clean
                  ? `Hasta ${max || 'todas las'} imágenes sin fondo, con su tabla o pedestal.`
                  : 'Quedan los recortes del arte. Después se limpian desde Productos, de a una o todas.'}
              </Typography>
            </Box>
          </Stack>
          {!current && (
            <Stack
              direction="row"
              alignItems="flex-start"
              gap={1}
              sx={{ mt: 1.5 }}
            >
              <Switch
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
              />
              <Box sx={{ pt: 0.75 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  Publicarlo como el circular de la semana
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {publish
                    ? 'Queda activo: es el que verán el linktree y el Pre-RCS.'
                    : 'Apagado: los productos se cargan igual, en un borrador. La tienda sigue sin circular de la semana.'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAskOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setAskOpen(false);
              readByHand.mutate();
            }}
          >
            Extraer {max ? `${max} productos` : 'todos'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
