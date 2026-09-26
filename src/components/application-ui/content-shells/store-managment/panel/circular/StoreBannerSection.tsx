'use client';

/**
 * Banner de campaña del Pre-RCS (lo que el cliente ve arriba de su lista en el linktree).
 * Por tienda y con vigencia: el vigente se muestra, los vencidos quedan de histórico y sin
 * banner vigente el linktree no muestra nada. Acá se sube, se previsualiza, se cambian
 * fechas/título y se borra.
 */
import { circularService, type StoreBanner } from '@/services/circular.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TitleRoundedIcon from '@mui/icons-material/TitleRounded';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { qk, useCampaignImportJob, useCircularBusy, useLastCampaignArt } from './hooks';
import { Meta, SectionHeader, Surface } from './panelUi';
import { BannerFrameSkeleton, ListRowsSkeleton } from './skeletons';

const TZ = 'America/New_York';
/** ISO → "YYYY-MM-DD" en hora del Este (el fin de día guardado cae en el día siguiente en UTC). */
const toDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }) : '';
const pretty = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('es', {
        timeZone: TZ,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
const today = () => toDay(new Date().toISOString());
const plusDays = (n: number) => toDay(new Date(Date.now() + n * 86_400_000).toISOString());

const statusOf = (b: StoreBanner, activeId?: string) => {
  const now = Date.now();
  if (b._id === activeId) return { label: 'Vigente', color: 'success' as const };
  if (+new Date(b.startDate) > now) return { label: 'Programado', color: 'info' as const };
  if (+new Date(b.endDate) < now) return { label: 'Vencido', color: 'default' as const };
  return { label: 'Tapado por uno más nuevo', color: 'warning' as const };
};

const blank = () => ({ id: '', imageUrl: '', title: '', startDate: today(), endDate: plusDays(6) });

// Marco 3:1 común a vigente, formulario e historial: todos los banners se ven con la misma forma.
const bannerFrame = {
  p: 0,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  overflow: 'hidden',
  display: 'block',
  width: '100%',
  cursor: 'zoom-in',
  bgcolor: 'background.default',
  aspectRatio: '3 / 1',
  '& img': { display: 'block', width: '100%', height: '100%', objectFit: 'cover' },
} as const;

export default function StoreBannerSection({
  storeSlug,
  storeId,
}: {
  storeSlug: string;
  storeId?: string;
}) {
  const qc = useQueryClient();
  const key = qk.banners(storeSlug);
  // Arte de la última campaña: misma query (y caché) que el bloque de automatización.
  const { campaign, image: campaignImage } = useLastCampaignArt(storeId);
  const job = useCampaignImportJob(campaign?._id);
  const { busy } = useCircularBusy(storeSlug);
  // Un banner automático sólo aparece mientras la IA trabaja (extracción o import de
  // campaña): recién ahí se consulta seguido. Antes era cada 20 s siempre.
  const aiWorking = busy || job.data?.status === 'queued' || job.data?.status === 'running';
  const banners = useQuery({
    queryKey: key,
    queryFn: () => circularService.getStoreBanners(storeSlug),
    enabled: !!storeSlug,
    staleTime: 30_000,
    refetchInterval: aiWorking ? 20_000 : false,
  });

  const fromFlyer = useMutation({
    mutationFn: (sourceUrl?: string) => circularService.bannerFromFlyer(storeSlug, sourceUrl),
    onSuccess: () => {
      toast.success('Banner sacado del flyer');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo sacar el banner'),
  });

  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [toDelete, setToDelete] = useState<StoreBanner | null>(null);
  const [showAll, setShowAll] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadCampaignImage(file, 'store-banners');
      setForm((f) => ({ ...f, imageUrl: up.url }));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () =>
      circularService.saveStoreBanner(
        storeSlug,
        {
          imageUrl: form.imageUrl,
          title: form.title.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
        },
        form.id || undefined
      ),
    onSuccess: () => {
      toast.success(form.id ? 'Banner actualizado' : 'Banner guardado');
      setForm(blank());
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar el banner'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => circularService.deleteStoreBanner(id),
    onSuccess: () => {
      toast.success('Banner eliminado');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo eliminar'),
  });

  const active = banners.data?.active ?? null;
  const items = banners.data?.items ?? [];
  const validDates = !!form.startDate && !!form.endDate && form.endDate >= form.startDate;
  const canSave = !!form.imageUrl && validDates && !uploading && !save.isPending;

  return (
    <Surface>
      <Stack spacing={2.5}>
        <SectionHeader
          step={4}
          title="Banner de las listas"
          description="La imagen que el cliente ve arriba de su lista, sólo entre sus fechas. La IA la saca sola del encabezado del flyer o de la campaña."
          action={
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoAwesomeOutlinedIcon />}
                disabled={fromFlyer.isPending}
                onClick={() => fromFlyer.mutate(undefined)}
              >
                Del circular
              </Button>
              {campaignImage && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoAwesomeOutlinedIcon />}
                  disabled={fromFlyer.isPending}
                  onClick={() => fromFlyer.mutate(campaignImage)}
                >
                  De la campaña
                </Button>
              )}
            </>
          }
        />
        {fromFlyer.isPending && (
          <Box>
            <LinearProgress sx={{ borderRadius: 1 }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              La IA está ubicando el encabezado del flyer (unos 20 segundos)…
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {/* Vigente */}
          <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.25 }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Lo que ve el cliente hoy
              </Typography>
              {active && (
                <Chip
                  size="small"
                  color="success"
                  label="Vigente"
                />
              )}
            </Stack>
            {banners.isLoading ? (
              <Stack gap={1}>
                <BannerFrameSkeleton />
                <Skeleton
                  variant="rounded"
                  width="55%"
                  height={14}
                />
              </Stack>
            ) : active ? (
              <>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setPreview(active.imageUrl)}
                  aria-label="Ver banner vigente en grande"
                  sx={bannerFrame}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={active.imageUrl}
                    alt={active.title || 'Banner vigente'}
                  />
                </Box>
                <Stack
                  direction="row"
                  gap={2}
                  flexWrap="wrap"
                  sx={{ mt: 1 }}
                >
                  {active.title && <Meta icon={<TitleRoundedIcon />}>{active.title}</Meta>}
                  <Meta icon={<CalendarMonthRoundedIcon />}>
                    {pretty(active.startDate)} al {pretty(active.endDate)}
                  </Meta>
                  {active.auto && <Meta icon={<AutoAwesomeOutlinedIcon />}>Automático</Meta>}
                </Stack>
              </>
            ) : (
              <Box
                sx={{
                  ...bannerFrame,
                  cursor: 'default',
                  borderStyle: 'dashed',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'transparent',
                }}
              >
                <Stack
                  alignItems="center"
                  gap={0.5}
                  sx={{ color: 'text.secondary', px: 2, textAlign: 'center' }}
                >
                  <ImageOutlinedIcon />
                  <Typography variant="body2">
                    Sin banner vigente: el cliente no ve ninguna imagen.
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>

          {/* Alta / edición */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: form.id ? 'primary.main' : 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                {form.id ? 'Editando banner' : 'Nuevo banner'}
              </Typography>
              {form.id && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setForm(blank())}
                >
                  Cancelar
                </Button>
              )}
            </Stack>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void upload(f);
              }}
            />
            <Box
              component="button"
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              onDrop={(e: React.DragEvent) => {
                e.preventDefault();
                const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith('image/'));
                if (f) void upload(f);
              }}
              sx={{
                ...bannerFrame,
                cursor: 'pointer',
                borderStyle: form.imageUrl ? 'solid' : 'dashed',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'transparent',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt=""
                />
              ) : (
                <Stack
                  alignItems="center"
                  gap={0.5}
                  sx={{ color: 'text.secondary', px: 2 }}
                >
                  <CloudUploadOutlinedIcon />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {uploading ? 'Subiendo…' : 'Sube o arrastra la imagen'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 12.5 }}
                  >
                    Apaisada 3:1 (ej. 2172×724)
                  </Typography>
                </Stack>
              )}
            </Box>
            {uploading && <LinearProgress sx={{ borderRadius: 1 }} />}
            <TextField
              size="small"
              fullWidth
              label="Título (texto alternativo)"
              placeholder="Ej.: Labor Day Sale"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              inputProps={{ maxLength: 120 }}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={1.5}
            >
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Desde"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Hasta (inclusive)"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                error={!validDates}
                helperText={!validDates ? 'El fin no puede ser antes del inicio' : undefined}
              />
            </Stack>
            <Button
              variant="contained"
              disabled={!canSave}
              onClick={() => save.mutate()}
              sx={{ alignSelf: 'flex-end' }}
            >
              {save.isPending ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Guardar banner'}
            </Button>
          </Box>
        </Box>

        {/* Historial en lista (antes: tabla con scroll lateral) */}
        <Box>
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              Historial de banners
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {items.length} en total
            </Typography>
          </Stack>
          {banners.isLoading ? (
            <ListRowsSkeleton
              rows={3}
              thumb
            />
          ) : !items.length ? (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Todavía no hay banners en esta tienda.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {(showAll ? items : items.slice(0, 4)).map((b, i) => {
                const st = statusOf(b, active?._id);
                return (
                  <Stack
                    key={b._id}
                    direction="row"
                    alignItems="center"
                    gap={2}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderTop: i ? '1px solid' : 'none',
                      borderColor: 'divider',
                      bgcolor: form.id === b._id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setPreview(b.imageUrl)}
                      aria-label={`Ver banner ${b.title || ''} en grande`}
                      sx={{ ...bannerFrame, width: 108, flexShrink: 0, borderRadius: 1.5 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.imageUrl}
                        alt=""
                        loading="lazy"
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                      >
                        {b.title || 'Sin título'}
                      </Typography>
                      <Stack
                        direction="row"
                        gap={1.5}
                        flexWrap="wrap"
                        alignItems="center"
                      >
                        <Meta icon={<CalendarMonthRoundedIcon />}>
                          {pretty(b.startDate)} al {pretty(b.endDate)}
                        </Meta>
                        {b.auto && <Meta icon={<AutoAwesomeOutlinedIcon />}>Automático</Meta>}
                      </Stack>
                    </Box>
                    <Chip
                      size="small"
                      label={st.label}
                      color={st.color}
                      sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    />
                    <Stack
                      direction="row"
                      sx={{ flexShrink: 0 }}
                    >
                      <Tooltip title="Editar imagen, título o fechas">
                        <IconButton
                          size="small"
                          aria-label="Editar banner"
                          onClick={() =>
                            setForm({
                              id: b._id,
                              imageUrl: b.imageUrl,
                              title: b.title || '',
                              startDate: toDay(b.startDate),
                              endDate: toDay(b.endDate),
                            })
                          }
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          aria-label="Eliminar banner"
                          disabled={remove.isPending}
                          onClick={() => setToDelete(b)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
              {items.length > 4 && (
                <Button
                  fullWidth
                  onClick={() => setShowAll((v) => !v)}
                  sx={{ borderTop: '1px solid', borderColor: 'divider', borderRadius: 0, py: 1 }}
                >
                  {showAll ? 'Ver menos' : `Ver los ${items.length} banners`}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Stack>

      <Dialog
        open={!!preview}
        onClose={() => setPreview('')}
        maxWidth="md"
        fullWidth
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && (
          <img
            src={preview}
            alt="Vista previa del banner"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        )}
      </Dialog>

      {/* Confirmación propia: nada de window.confirm del navegador */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar este banner?</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {toDelete?.title ? `"${toDelete.title}" ` : 'El banner '}se borra y no se puede
            deshacer.
            {toDelete && toDelete._id === active?._id
              ? ' Es el vigente: el cliente deja de ver banner.'
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={remove.isPending}
            onClick={() => {
              if (toDelete) remove.mutate(toDelete._id);
              setToDelete(null);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Surface>
  );
}
