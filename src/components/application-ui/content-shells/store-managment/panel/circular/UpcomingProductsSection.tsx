'use client';

/**
 * Próximos: productos que ya están en el catálogo pero salen en una fecha (vienen de una
 * campaña agendada o de un circular que todavía no arrancó). Se revisan ANTES de que el
 * cliente los vea: precio que va a salir, fecha, imagen (recortada del arte de SU campaña
 * o circular), letra chica. Se pueden publicar ya o sacar.
 */
import {
  circularService,
  type StoreProduct,
  type UpcomingGroup,
} from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import CameraswitchOutlinedIcon from '@mui/icons-material/CameraswitchOutlined';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useRefreshStoreData, useUpcoming } from './hooks';
import { ProductEditorDialog } from './ProductImageTools';
import { UpcomingGroupSkeleton } from './skeletons';

const TZ = 'America/New_York';
const DAY = 24 * 60 * 60 * 1000;
// Cards que se pintan por grupo antes de "Ver los restantes".
const GROUP_PREVIEW = 24;
// Constantes estables: un `?? []` nuevo por render invalidaba el useMemo de abajo.
const EMPTY_GROUPS: UpcomingGroup[] = [];
const EMPTY_BANNERS: NonNullable<
  Awaited<ReturnType<typeof circularService.getUpcoming>>['banners']
> = [];

const fmtDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

/** "hoy", "mañana", "en 3 días" — contado en días calendario de la tienda. */
function relDay(day: string) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const diff = Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY
  );
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
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [editor, setEditor] = useState<{ product: StoreProduct; flyerUrl: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const upcoming = useUpcoming(storeSlug);
  const refresh = useRefreshStoreData(storeSlug);

  // Imagen para recortar: la del arte/circular del que salió ESTE producto (no el vigente).
  // Si es PDF se pide la portada renderizada (queda cacheada en el servidor).
  const flyerFor = async (g: UpcomingGroup) => {
    if (!g.circular) return '';
    if (g.circular.flyerUrl) return g.circular.flyerUrl;
    if (!g.circular.hasFile) return '';
    return (
      (await circularService.getPreviewImage(g.circular._id).catch(() => ({ url: '' }))).url || ''
    );
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

  // "Poner a los agentes a trabajar" sobre un flyer que todavía no salió: Atenea audita el
  // circular contra el arte y, si se pide, Iris rehace las fotos de sus productos (mode ids).
  const [agentsFor, setAgentsFor] = useState<UpcomingGroup | null>(null);
  const [agentsPhotos, setAgentsPhotos] = useState(true);
  const agents = useMutation({
    mutationFn: async ({ group, photos }: { group: UpcomingGroup; photos: boolean }) => {
      if (group.circular?._id) await circularService.runAudit(group.circular._id);
      if (photos && group.items.length) {
        await circularService.rescanPhotos(
          storeSlug,
          'ids',
          group.items.map((p) => p._id)
        );
      }
    },
    onSuccess: (_d, v) => {
      setAgentsFor(null);
      toast.success(
        v.photos
          ? `Atenea audita el flyer e Iris rehace ${v.group.items.length} fotos. Míralos trabajar en Agentes IA.`
          : 'Atenea está auditando el flyer. Míralo en Agentes IA.',
        { duration: 7000 }
      );
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo arrancar a los agentes')),
  });
  // Una sola foto: Iris la busca de nuevo en su página (≈ 1 min) y la card se actualiza.
  const rephoto = useMutation({
    mutationFn: (id: string) => circularService.rescanProductPhoto(id),
    onSuccess: (d) => {
      toast.success(d.relocated ? 'Foto rehecha desde el arte' : 'Foto generada');
      refresh();
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo rehacer la foto')),
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

  const groups = upcoming.data?.groups ?? EMPTY_GROUPS;
  const banners = upcoming.data?.banners ?? EMPTY_BANNERS;
  // Un flyer trae 100+ productos por día: se pintan los primeros y el resto a pedido.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const bannerOfDay = (day: string) => banners.find((b) => b.day === day);
  const fmtShort = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: TZ });
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      needle
        ? groups
            .map((g) => ({
              ...g,
              items: g.items.filter((p) => p.name.toLowerCase().includes(needle)),
            }))
            .filter((g) => g.items.length)
        : groups,
    [groups, needle]
  );

  const all = groups.flatMap((g) => g.items);
  const nNew = all.filter((p) => p.pending?.isNew).length;

  return (
    <Stack spacing={2}>
      {/* Resumen */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
          >
            Lo que sale pronto
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Productos y banners ya cargados que el cliente todavía no ve. Revísalos antes de su
            fecha.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Buscar producto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: { xs: '100%', sm: 240 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {!!all.length && (
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          <Chip
            icon={<EventRoundedIcon />}
            label={`${all.length} esperando fecha`}
          />
          <Chip
            color="success"
            variant="outlined"
            label={`${nNew} nuevos`}
          />
          <Chip
            color="warning"
            variant="outlined"
            label={`${all.length - nNew} cambian de precio`}
          />
          {groups[0] && (
            <Chip
              variant="outlined"
              label={`Próximo: ${fmtDay(groups[0].day)} (${relDay(groups[0].day)})`}
            />
          )}
        </Stack>
      )}

      {upcoming.isLoading && (
        <Stack spacing={2}>
          <Stack
            direction="row"
            gap={1}
          >
            {[150, 100, 150, 220].map((w) => (
              <Skeleton
                key={w}
                variant="rounded"
                width={w}
                height={32}
                sx={{ borderRadius: 4 }}
              />
            ))}
          </Stack>
          <UpcomingGroupSkeleton />
          <UpcomingGroupSkeleton cards={3} />
        </Stack>
      )}

      {/* Banners programados: salen solos en su fecha (el vigente es el de inicio más reciente). */}
      {!!banners.length && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 3 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <ViewCarouselOutlinedIcon
              color="primary"
              fontSize="small"
            />
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              Banners programados
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              · reemplazan al actual en su fecha
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            }}
          >
            {banners.map((b) => (
              <Box key={b._id}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setPreview(b.imageUrl)}
                  aria-label={`Ver banner ${b.title || ''}`}
                  sx={{
                    p: 0,
                    width: '100%',
                    aspectRatio: '3 / 1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'zoom-in',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                    display: 'block',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cloudinaryThumb(b.imageUrl, 480, 160, 'fill')}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.75}
                  sx={{ mt: 0.75 }}
                  flexWrap="wrap"
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {fmtShort(b.startDate)} →{' '}
                    {fmtShort(new Date(+new Date(b.endDate) - 1).toISOString())}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    · {relDay(b.day)}
                  </Typography>
                  {b.auto && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Automático"
                      sx={{ height: 20 }}
                    />
                  )}
                </Stack>
              </Box>
            ))}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5 }}
          >
            Se editan en la pestaña Circular, sección Banner de las listas.
          </Typography>
        </Paper>
      )}

      {!upcoming.isLoading && !groups.length && !banners.length && (
        <Paper
          variant="outlined"
          sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}
        >
          <EventRoundedIcon
            color="disabled"
            sx={{ fontSize: 40 }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ mt: 1 }}
          >
            No hay productos esperando fecha
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Cuando agendes una campaña con arte o un circular a futuro, sus productos aparecen aquí
            antes de salir.
          </Typography>
        </Paper>
      )}

      {filtered.map((g) => (
        <Paper
          key={g.key}
          variant="outlined"
          sx={{ borderRadius: 3, overflow: 'hidden' }}
        >
          {/* Cabecera del grupo: cuándo sale y de dónde viene */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
            gap={1.5}
            sx={{
              p: 2,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1.5}
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  lineHeight: 1,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    lineHeight={1}
                  >
                    {Number(g.day.slice(8, 10))}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}
                  >
                    {new Date(`${g.day}T12:00:00Z`).toLocaleDateString('es-ES', {
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {fmtDay(g.day)} · {relDay(g.day)}
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.75}
                  flexWrap="wrap"
                >
                  {g.circular ? (
                    <Chip
                      size="small"
                      icon={
                        g.circular.fromCampaign ? (
                          <CampaignRoundedIcon />
                        ) : (
                          <DescriptionOutlinedIcon />
                        )
                      }
                      color={g.circular.fromCampaign ? 'primary' : 'default'}
                      variant="outlined"
                      label={
                        g.circular.fromCampaign
                          ? `Campaña · ${g.circular.title.replace(/^Campaña:\s*/, '')}`
                          : g.circular.title || 'Circular'
                      }
                    />
                  ) : (
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Sin origen"
                    />
                  )}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {g.items.length} producto{g.items.length !== 1 ? 's' : ''}
                    {bannerOfDay(g.day) ? ' + banner' : ''}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
              alignItems="center"
            >
              {bannerOfDay(g.day) && (
                <Tooltip title="Banner de ese día">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setPreview(bannerOfDay(g.day)!.imageUrl)}
                    aria-label="Ver banner de ese día"
                    sx={{
                      p: 0,
                      width: 120,
                      aspectRatio: '3 / 1',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      cursor: 'zoom-in',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      display: 'block',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cloudinaryThumb(bannerOfDay(g.day)!.imageUrl, 360, 120, 'fill')}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
              {g.circular?.hasFile && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ImageOutlinedIcon />}
                  disabled={openArt.isPending}
                  onClick={() => openArt.mutate(g)}
                >
                  Ver arte
                </Button>
              )}
              {g.circular?.hasFile && (
                <Tooltip title="Atenea coteja precios y nombres contra el arte; Iris rehace las fotos que no se parecen. El avance se ve en Agentes IA.">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<SmartToyOutlinedIcon />}
                    disabled={agents.isPending}
                    onClick={() => setAgentsFor(g)}
                  >
                    Revisar con los agentes
                  </Button>
                </Tooltip>
              )}
              <Button
                size="small"
                variant="contained"
                startIcon={<RocketLaunchOutlinedIcon />}
                onClick={() => setConfirm({ kind: 'group', group: g })}
              >
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
              // minmax(0, 1fr): con "1fr" pelado una card con precio largo ensanchaba la columna
              // y la grilla se salía del contenedor (se cortaba la 4ª columna).
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {(expanded.has(g.key) ? g.items : g.items.slice(0, GROUP_PREVIEW)).map((p) => (
              <UpcomingCard
                key={p._id}
                product={p}
                busy={openEditor.isPending && openEditor.variables?.product._id === p._id}
                rephotoing={rephoto.isPending && rephoto.variables === p._id}
                onEdit={() => openEditor.mutate({ product: p, group: g })}
                onRephoto={() => rephoto.mutate(p._id)}
                onPublish={() => setConfirm({ kind: 'publish', product: p })}
                onCancel={() => setConfirm({ kind: 'cancel', product: p })}
              />
            ))}
            {g.items.length > GROUP_PREVIEW && !expanded.has(g.key) && (
              <Button
                variant="outlined"
                onClick={() => setExpanded((s) => new Set(s).add(g.key))}
                sx={{ alignSelf: 'center', justifySelf: 'start' }}
              >
                Ver los {g.items.length - GROUP_PREVIEW} restantes
              </Button>
            )}
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

      <Dialog
        open={!!preview}
        onClose={() => setPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 1, bgcolor: 'background.default' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && (
            <img
              src={preview}
              alt="Arte"
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Poner a los agentes a trabajar sobre un flyer que todavía no salió. */}
      <Dialog
        open={!!agentsFor}
        onClose={agents.isPending ? undefined : () => setAgentsFor(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyOutlinedIcon color="primary" />
          Revisar con los agentes
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            {agentsFor ? `${agentsFor.items.length} productos del ${fmtDay(agentsFor.day)}.` : ''}
          </Typography>
          <Typography variant="body2">
            <b>Atenea</b> vuelve a leer el arte página por página y coteja precios, nombres y letra
            chica. Lo seguro lo corrige; lo dudoso queda en Agentes IA para decidir.
          </Typography>
          <FormControlLabel
            sx={{ mt: 1, alignItems: 'flex-start', ml: 0 }}
            control={
              <Checkbox
                checked={agentsPhotos}
                onChange={(e) => setAgentsPhotos(e.target.checked)}
                sx={{ mt: -0.5 }}
              />
            }
            label={
              <Typography variant="body2">
                <b>Iris</b> rehace TODAS las fotos de este flyer buscando cada producto en su página
                (una por producto, tarda varios minutos). Si sólo son una o dos, mejor el ícono de
                cámara en la card.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAgentsFor(null)}
            disabled={agents.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={agents.isPending}
            onClick={() => agentsFor && agents.mutate({ group: agentsFor, photos: agentsPhotos })}
          >
            {agents.isPending ? 'Arrancando…' : 'A trabajar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirm}
        onClose={act.isPending ? undefined : () => setConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirm?.kind === 'cancel' ? '¿Que no salga?' : '¿Publicar ahora?'}
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {confirm?.kind === 'group' &&
              `Los ${confirm.group.items.length} productos del ${fmtDay(
                confirm.group.day
              )} se ven desde ya en las listas, con su precio nuevo${
                bannerOfDay(confirm.group.day)?.auto ? ', y su banner pasa a ser el vigente' : ''
              }. Hoy todavía no es su fecha.`}
            {confirm?.kind === 'publish' &&
              `"${confirm.product.name}" se ve desde ya a ${
                confirm.product.pending?.price || '—'
              }.`}
            {confirm?.kind === 'cancel' &&
              (confirm.product.pending?.isNew
                ? `"${confirm.product.name}" es nuevo: se borra del catálogo y no va a salir.`
                : `"${confirm.product.name}" se queda con su precio de hoy (${
                    confirm.product.price || '—'
                  }); el cambio a ${confirm.product.pending?.price || '—'} se descarta.`)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirm(null)}
            disabled={act.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={confirm?.kind === 'cancel' ? 'error' : 'primary'}
            disabled={act.isPending}
            onClick={() => confirm && act.mutate(confirm)}
          >
            {act.isPending
              ? 'Un momento…'
              : confirm?.kind === 'cancel'
                ? 'Sí, que no salga'
                : 'Sí, publicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function UpcomingCard({
  product: p,
  busy,
  rephotoing,
  onEdit,
  onRephoto,
  onPublish,
  onCancel,
}: {
  product: StoreProduct;
  busy: boolean;
  rephotoing: boolean;
  onEdit: () => void;
  onRephoto: () => void;
  onPublish: () => void;
  onCancel: () => void;
}) {
  const pend = p.pending;
  const changes = !pend?.isNew && !!p.price && p.price !== pend?.price;
  const fine = [
    (pend?.packQty ?? 0) > 1 ? `Caja ${pend?.packQty} ${pend?.packUnit}` : '',
    p.counterOnly ? 'Mostrador' : '',
    p.offerCondition,
  ]
    .filter(Boolean)
    .join(' · ');
  const action = (title: string, icon: React.ReactNode, onClick: () => void, disabled = false) => (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
  return (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 0,
        borderRadius: 2.5,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .15s, box-shadow .15s',
        '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
      }}
    >
      {/* Foto grande arriba, en caja blanca: lo primero que se revisa es si ES el producto. */}
      <Box
        component="button"
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${p.name}`}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          p: 1.5,
          border: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryThumb(p.imageUrl, 320, 240, 'fit')}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: rephotoing ? 0.35 : 1,
            }}
          />
        ) : (
          <ImageOutlinedIcon
            color="disabled"
            sx={{ fontSize: 40 }}
          />
        )}
        {rephotoing && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              inset: 'auto 0 8px',
              textAlign: 'center',
              fontWeight: 700,
              color: 'primary.main',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            Iris está rehaciendo la foto…
          </Typography>
        )}
        <Chip
          size="small"
          color={pend?.isNew ? 'success' : 'warning'}
          label={pend?.isNew ? 'Nuevo' : 'Cambia precio'}
          sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: 11 }}
        />
      </Box>
      <Box sx={{ p: 1.25, minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="body2"
          fontWeight={700}
          title={p.name}
          sx={{
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.5em',
          }}
        >
          {p.name}
        </Typography>
        {(p.brand || p.size) && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ textTransform: 'none', letterSpacing: 0 }}
          >
            {[p.brand, p.size].filter(Boolean).join(' · ')}
          </Typography>
        )}
        <Stack
          direction="row"
          alignItems="baseline"
          gap={0.75}
          sx={{ mt: 0.5, minWidth: 0 }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            color="primary.main"
            lineHeight={1.1}
            noWrap
          >
            {pend?.price || '—'}
          </Typography>
          {pend?.originalPrice && (
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ textDecoration: 'line-through' }}
            >
              {pend.originalPrice}
            </Typography>
          )}
        </Stack>
        {changes && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block', textTransform: 'none', letterSpacing: 0 }}
          >
            Hoy {p.price} → {pend?.price}
          </Typography>
        )}
        {fine && (
          <Typography
            variant="caption"
            color="warning.main"
            noWrap
            title={fine}
            sx={{ display: 'block', textTransform: 'none', letterSpacing: 0 }}
          >
            {fine}
          </Typography>
        )}
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 'auto', pt: 0.75, ml: -0.5, mr: -0.5 }}
        >
          <Stack direction="row">
            {action(
              'Editar precio, fecha o recortar la foto del arte',
              <EditOutlinedIcon fontSize="small" />,
              onEdit,
              busy
            )}
            {action(
              'No se parece: Iris la busca de nuevo en su página del arte (≈ 1 min)',
              <CameraswitchOutlinedIcon fontSize="small" />,
              onRephoto,
              rephotoing
            )}
          </Stack>
          <Stack direction="row">
            {action('Publicar ya', <RocketLaunchOutlinedIcon fontSize="small" />, onPublish)}
            {action('Que no salga', <VisibilityOffOutlinedIcon fontSize="small" />, onCancel)}
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
