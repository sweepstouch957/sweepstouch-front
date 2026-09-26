'use client';

/**
 * Próximos: productos que ya están en el catálogo pero salen en una fecha (vienen de una
 * campaña agendada o de un circular que todavía no arrancó). Se revisan ANTES de que el
 * cliente los vea: precio que va a salir, fecha, imagen (recortada del arte de SU campaña
 * o circular), letra chica. Se pueden publicar ya o sacar.
 */
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { circularService, type StoreProduct, type UpcomingGroup } from '@/services/circular.service';
import { ProductEditorDialog } from './ProductImageTools';

const TZ = 'America/New_York';
const DAY = 24 * 60 * 60 * 1000;

const fmtDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** "hoy", "mañana", "en 3 días" — contado en días calendario de la tienda. */
function relDay(day: string) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const diff = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
  if (diff <= 0) return 'hoy';
  if (diff === 1) return 'mañana';
  return `en ${diff} días`;
}

const errMsg = (e: any, fallback: string) => e?.response?.data?.error || e?.message || fallback;

type Confirm =
  | { kind: 'group'; group: UpcomingGroup }
  | { kind: 'publish'; product: StoreProduct }
  | { kind: 'cancel'; product: StoreProduct };

export default function UpcomingProductsSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [editor, setEditor] = useState<{ product: StoreProduct; flyerUrl: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const upcoming = useQuery({
    queryKey: ['store-upcoming', storeSlug],
    queryFn: () => circularService.getUpcoming(storeSlug),
    enabled: !!storeSlug,
    refetchInterval: 60_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['store-upcoming', storeSlug] });
    qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    qc.invalidateQueries({ queryKey: ['store-banners', storeSlug] });
  };

  // Imagen para recortar: la del arte/circular del que salió ESTE producto (no el vigente).
  // Si es PDF se pide la portada renderizada (queda cacheada en el servidor).
  const flyerFor = async (g: UpcomingGroup) => {
    if (!g.circular) return '';
    if (g.circular.flyerUrl) return g.circular.flyerUrl;
    if (!g.circular.hasFile) return '';
    return (await circularService.getPreviewImage(g.circular._id).catch(() => ({ url: '' }))).url || '';
  };

  const openEditor = useMutation({
    mutationFn: async ({ product, group }: { product: StoreProduct; group: UpcomingGroup }) => ({
      product,
      flyerUrl: await flyerFor(group),
    }),
    onSuccess: (d) => setEditor(d),
  });

  const openArt = useMutation({
    mutationFn: flyerFor,
    onSuccess: (url) => (url ? setPreview(url) : toast('Este grupo no tiene arte para mostrar')),
  });

  const act = useMutation({
    mutationFn: async (c: Confirm) => {
      if (c.kind === 'group') {
        return circularService.publishUpcomingNow(storeSlug, {
          day: c.group.day,
          ...(c.group.circular ? { circularId: c.group.circular._id } : {}),
        });
      }
      if (c.kind === 'publish') return circularService.publishPendingNow(c.product._id);
      return circularService.cancelPending(c.product._id);
    },
    onSuccess: (_d, c) => {
      toast.success(
        c.kind === 'cancel'
          ? c.product.pending?.isNew
            ? 'Producto quitado: no va a salir'
            : 'Cambio de precio descartado: queda el precio de hoy'
          : 'Publicado: ya se ve en las listas de los clientes'
      );
      setConfirm(null);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo completar')),
  });

  const groups = upcoming.data?.groups ?? [];
  const banners = upcoming.data?.banners ?? [];
  const bannerOfDay = (day: string) => banners.find((b) => b.day === day);
  const fmtShort = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: TZ });
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      needle
        ? groups
            .map((g) => ({ ...g, items: g.items.filter((p) => p.name.toLowerCase().includes(needle)) }))
            .filter((g) => g.items.length)
        : groups,
    [groups, needle]
  );

  const all = groups.flatMap((g) => g.items);
  const nNew = all.filter((p) => p.pending?.isNew).length;

  return (
    <Stack spacing={2}>
      {/* Resumen */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Lo que sale pronto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Productos y banners ya cargados que el cliente todavía no ve. Revísalos antes de su fecha.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Buscar producto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: { xs: '100%', sm: 240 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
        />
      </Stack>

      {!!all.length && (
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip icon={<EventRoundedIcon />} label={`${all.length} esperando fecha`} />
          <Chip color="success" variant="outlined" label={`${nNew} nuevos`} />
          <Chip color="warning" variant="outlined" label={`${all.length - nNew} cambian de precio`} />
          {groups[0] && <Chip variant="outlined" label={`Próximo: ${fmtDay(groups[0].day)} (${relDay(groups[0].day)})`} />}
        </Stack>
      )}

      {upcoming.isLoading && <LinearProgress />}

      {/* Banners programados: salen solos en su fecha (el vigente es el de inicio más reciente). */}
      {!!banners.length && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
            <ViewCarouselOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>Banners programados</Typography>
            <Typography variant="body2" color="text.secondary">· reemplazan al actual en su fecha</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
            {banners.map((b) => (
              <Box key={b._id}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setPreview(b.imageUrl)}
                  aria-label={`Ver banner ${b.title || ''}`}
                  sx={{
                    p: 0, width: '100%', aspectRatio: '3 / 1', borderRadius: 2, overflow: 'hidden', cursor: 'zoom-in',
                    border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', display: 'block',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </Box>
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.75 }} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={600}>
                    {fmtShort(b.startDate)} → {fmtShort(new Date(+new Date(b.endDate) - 1).toISOString())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">· {relDay(b.day)}</Typography>
                  {b.auto && <Chip size="small" variant="outlined" label="Automático" sx={{ height: 20 }} />}
                </Stack>
              </Box>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Se editan en la pestaña Circular, sección Banner de las listas.
          </Typography>
        </Paper>
      )}

      {!upcoming.isLoading && !groups.length && !banners.length && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <EventRoundedIcon color="disabled" sx={{ fontSize: 40 }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
            No hay productos esperando fecha
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cuando agendes una campaña con arte o un circular a futuro, sus productos aparecen aquí antes de salir.
          </Typography>
        </Paper>
      )}

      {filtered.map((g) => (
        <Paper key={g.key} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Cabecera del grupo: cuándo sale y de dónde viene */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
            gap={1.5}
            sx={{ p: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 52, height: 52, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center',
                  bgcolor: 'primary.main', color: 'primary.contrastText', lineHeight: 1,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={800} lineHeight={1}>{Number(g.day.slice(8, 10))}</Typography>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
                    {new Date(`${g.day}T12:00:00Z`).toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                  {fmtDay(g.day)} · {relDay(g.day)}
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                  {g.circular ? (
                    <Chip
                      size="small"
                      icon={g.circular.fromCampaign ? <CampaignRoundedIcon /> : <DescriptionOutlinedIcon />}
                      color={g.circular.fromCampaign ? 'primary' : 'default'}
                      variant="outlined"
                      label={g.circular.fromCampaign ? `Campaña · ${g.circular.title.replace(/^Campaña:\s*/, '')}` : g.circular.title || 'Circular'}
                    />
                  ) : (
                    <Chip size="small" variant="outlined" label="Sin origen" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {g.items.length} producto{g.items.length !== 1 ? 's' : ''}
                    {bannerOfDay(g.day) ? ' + banner' : ''}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
              {bannerOfDay(g.day) && (
                <Tooltip title="Banner de ese día">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setPreview(bannerOfDay(g.day)!.imageUrl)}
                    aria-label="Ver banner de ese día"
                    sx={{
                      p: 0, width: 120, aspectRatio: '3 / 1', borderRadius: 1.5, overflow: 'hidden', cursor: 'zoom-in',
                      border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', display: 'block',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bannerOfDay(g.day)!.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </Box>
                </Tooltip>
              )}
              {g.circular?.hasFile && (
                <Button size="small" variant="outlined" startIcon={<ImageOutlinedIcon />} disabled={openArt.isPending} onClick={() => openArt.mutate(g)}>
                  Ver arte
                </Button>
              )}
              <Button size="small" variant="contained" startIcon={<RocketLaunchOutlinedIcon />} onClick={() => setConfirm({ kind: 'group', group: g })}>
                Publicar ahora
              </Button>
            </Stack>
          </Stack>

          {/* Productos */}
          <Box
            sx={{
              p: 2,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
            }}
          >
            {g.items.map((p) => (
              <UpcomingCard
                key={p._id}
                product={p}
                busy={openEditor.isPending && openEditor.variables?.product._id === p._id}
                onEdit={() => openEditor.mutate({ product: p, group: g })}
                onPublish={() => setConfirm({ kind: 'publish', product: p })}
                onCancel={() => setConfirm({ kind: 'cancel', product: p })}
              />
            ))}
          </Box>
        </Paper>
      ))}

      <ProductEditorDialog
        open={!!editor}
        product={editor?.product ?? null}
        storeSlug={storeSlug}
        flyerUrl={editor?.flyerUrl || undefined}
        onClose={() => setEditor(null)}
        onSaved={refresh}
      />

      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 1, bgcolor: 'background.default' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Arte" style={{ width: '100%', display: 'block' }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onClose={act.isPending ? undefined : () => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirm?.kind === 'cancel' ? '¿Que no salga?' : '¿Publicar ahora?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirm?.kind === 'group' &&
              `Los ${confirm.group.items.length} productos del ${fmtDay(confirm.group.day)} se ven desde ya en las listas, con su precio nuevo${bannerOfDay(confirm.group.day)?.auto ? ', y su banner pasa a ser el vigente' : ''}. Hoy todavía no es su fecha.`}
            {confirm?.kind === 'publish' && `"${confirm.product.name}" se ve desde ya a ${confirm.product.pending?.price || '—'}.`}
            {confirm?.kind === 'cancel' &&
              (confirm.product.pending?.isNew
                ? `"${confirm.product.name}" es nuevo: se borra del catálogo y no va a salir.`
                : `"${confirm.product.name}" se queda con su precio de hoy (${confirm.product.price || '—'}); el cambio a ${confirm.product.pending?.price || '—'} se descarta.`)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={act.isPending}>Cancelar</Button>
          <Button
            variant="contained"
            color={confirm?.kind === 'cancel' ? 'error' : 'primary'}
            disabled={act.isPending}
            onClick={() => confirm && act.mutate(confirm)}
          >
            {act.isPending ? 'Un momento…' : confirm?.kind === 'cancel' ? 'Sí, que no salga' : 'Sí, publicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function UpcomingCard({
  product: p,
  busy,
  onEdit,
  onPublish,
  onCancel,
}: {
  product: StoreProduct;
  busy: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onCancel: () => void;
}) {
  const pend = p.pending;
  const changes = !pend?.isNew && !!p.price && p.price !== pend?.price;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25, borderRadius: 2, display: 'flex', gap: 1.25, alignItems: 'stretch',
        transition: 'border-color .15s', '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${p.name}`}
        sx={{
          width: 76, height: 76, flexShrink: 0, p: 0.5, borderRadius: 1.5, cursor: 'pointer',
          border: '1px solid', borderColor: 'divider', bgcolor: 'background.default',
          display: 'grid', placeItems: 'center', overflow: 'hidden',
        }}
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <ImageOutlinedIcon color="disabled" />
        )}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" gap={0.5}>
          <Typography variant="body2" fontWeight={700} sx={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
            {p.name}
          </Typography>
          <Chip
            size="small"
            color={pend?.isNew ? 'success' : 'warning'}
            label={pend?.isNew ? 'Nuevo' : 'Precio'}
            sx={{ height: 20, fontSize: 11 }}
          />
        </Stack>
        <Stack direction="row" alignItems="baseline" gap={0.75} sx={{ mt: 0.5 }} flexWrap="wrap">
          <Typography variant="subtitle1" fontWeight={800} color="primary.main" lineHeight={1.2}>
            {pend?.price || '—'}
          </Typography>
          {pend?.originalPrice && (
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              {pend.originalPrice}
            </Typography>
          )}
        </Stack>
        {changes && (
          <Typography variant="caption" color="text.secondary" display="block">
            Hoy {p.price} → {pend?.price}
          </Typography>
        )}
        {(p.offerCondition || p.counterOnly || (pend?.packQty ?? 0) > 1) && (
          <Typography variant="caption" color="warning.main" display="block" noWrap title={p.offerCondition}>
            {[(pend?.packQty ?? 0) > 1 ? `Caja ${pend?.packQty} ${pend?.packUnit}` : '', p.counterOnly ? 'Mostrador' : '', p.offerCondition]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        )}
        <Stack direction="row" gap={0.25} sx={{ mt: 0.5, ml: -0.75 }}>
          <Tooltip title="Editar: precio, fecha, imagen (recortar del arte)">
            <span>
              <IconButton size="small" onClick={onEdit} disabled={busy}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Publicar ya">
            <IconButton size="small" onClick={onPublish}>
              <RocketLaunchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Que no salga">
            <IconButton size="small" onClick={onCancel}>
              <VisibilityOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Paper>
  );
}
