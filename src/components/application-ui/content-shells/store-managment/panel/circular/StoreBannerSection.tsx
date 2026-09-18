'use client';

/**
 * Banner de campaña del Pre-RCS (lo que el cliente ve arriba de su lista en el linktree).
 * Por tienda y con vigencia: el vigente se muestra, los vencidos quedan de histórico y sin
 * banner vigente el linktree no muestra nada. Acá se sube, se previsualiza, se cambian
 * fechas/título y se borra.
 */

import { circularService, type StoreBanner } from '@/services/circular.service';
import { uploadCampaignImage } from '@/services/upload.service';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

const TZ = 'America/New_York';
/** ISO → "YYYY-MM-DD" en hora del Este (el fin de día guardado cae en el día siguiente en UTC). */
const toDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }) : '');
const pretty = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }) : '—');
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

export default function StoreBannerSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const key = ['store-banners', storeSlug];
  const banners = useQuery({ queryKey: key, queryFn: () => circularService.getStoreBanners(storeSlug), enabled: !!storeSlug });

  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
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
        { imageUrl: form.imageUrl, title: form.title.trim(), startDate: form.startDate, endDate: form.endDate },
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
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>Banner de campaña en las listas</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Es la imagen que el cliente ve arriba de su lista. Sale solo entre las fechas elegidas; sin banner vigente no se muestra nada.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2.5}>
        {/* Vigente */}
        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
            Lo que ve el cliente hoy
          </Typography>
          {active ? (
            <Box
              component="button"
              type="button"
              onClick={() => setPreview(active.imageUrl)}
              aria-label="Ver banner vigente en grande"
              sx={{ p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', display: 'block', width: '100%', cursor: 'zoom-in', bgcolor: 'background.default' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.imageUrl} alt={active.title || 'Banner vigente'} style={{ display: 'block', width: '100%', height: 'auto' }} />
            </Box>
          ) : (
            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Sin banner vigente: el cliente no ve ninguna imagen.</Typography>
            </Box>
          )}
          {active && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {active.title ? `${active.title} · ` : ''}{pretty(active.startDate)} al {pretty(active.endDate)}
            </Typography>
          )}
        </Box>

        {/* Alta / edición */}
        <Stack gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {form.id ? 'Editando banner' : 'Nuevo banner'}
          </Typography>
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
          <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
            {form.imageUrl && (
              <Box
                component="button"
                type="button"
                onClick={() => setPreview(form.imageUrl)}
                aria-label="Ver imagen elegida en grande"
                sx={{ p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', width: 150, cursor: 'zoom-in', bgcolor: 'background.default' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
              </Box>
            )}
            <Button variant="outlined" size="small" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? 'Subiendo…' : form.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
            </Button>
            <Typography variant="caption" color="text.secondary">Apaisada, 3:1 aprox. (ej. 2172×724)</Typography>
          </Stack>
          {uploading && <LinearProgress sx={{ borderRadius: 1 }} />}
          <TextField size="small" fullWidth label="Título (texto alternativo)" placeholder="Ej.: Labor Day Sale" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} inputProps={{ maxLength: 120 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <TextField size="small" fullWidth type="date" label="Desde" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <TextField
              size="small"
              fullWidth
              type="date"
              label="Hasta (inclusive)"
              InputLabelProps={{ shrink: true }}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              error={!validDates}
              helperText={!validDates ? 'La fecha de fin no puede ser anterior al inicio' : ' '}
            />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" gap={1}>
            {form.id && <Button color="inherit" onClick={() => setForm(blank())}>Cancelar edición</Button>}
            <Button variant="contained" disabled={!canSave} onClick={() => save.mutate()}>
              {save.isPending ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Guardar banner'}
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Histórico */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2.5, mb: 0.5 }}>Histórico</Typography>
      {banners.isLoading ? (
        <LinearProgress />
      ) : !items.length ? (
        <Typography variant="body2" color="text.secondary">Todavía no hay banners en esta tienda.</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Vigencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((b) => {
                const st = statusOf(b, active?._id);
                return (
                  <TableRow key={b._id} hover selected={form.id === b._id}>
                    <TableCell>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => setPreview(b.imageUrl)}
                        aria-label={`Ver banner ${b.title || ''} en grande`}
                        sx={{ p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', width: 96, display: 'block', cursor: 'zoom-in', bgcolor: 'background.default' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.imageUrl} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
                      </Box>
                    </TableCell>
                    <TableCell>{b.title || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{pretty(b.startDate)} al {pretty(b.endDate)}</TableCell>
                    <TableCell><Chip size="small" label={st.label} color={st.color} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar imagen, título o fechas">
                        <IconButton
                          size="small"
                          aria-label="Editar banner"
                          onClick={() => setForm({ id: b._id, imageUrl: b.imageUrl, title: b.title || '', startDate: toDay(b.startDate), endDate: toDay(b.endDate) })}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          aria-label="Eliminar banner"
                          disabled={remove.isPending}
                          onClick={() => { if (window.confirm('¿Eliminar este banner? No se puede deshacer.')) remove.mutate(b._id); }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={!!preview} onClose={() => setPreview('')} maxWidth="md" fullWidth>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="Vista previa del banner" style={{ display: 'block', width: '100%', height: 'auto' }} />}
      </Dialog>
    </Paper>
  );
}
