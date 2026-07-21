'use client';

import {
  generateQr,
  listQrs,
  upsertStoreGenericQr,
  upsertSweepstakeOptinQr,
  type GenerateQrResponse,
  type QrListItem,
  type StorePopulated,
} from '@/services/qr.service';
import { type Store } from '@/services/store.service';
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import {
  AddRounded,
  CheckRounded,
  CloseRounded,
  ContentCopyRounded,
  DownloadRounded,
  LinkRounded,
  OpenInNewRounded,
  QrCode2Rounded,
  QrCodeRounded,
  RefreshRounded,
  StorefrontRounded,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

/* ─────────────────────────── helpers */
async function downloadRemoteFile(url: string, filename?: string) {
  try {
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || url.split('/').pop() || 'qr';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function fmtDate(d?: string | Date) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

function storeOf(item: QrListItem): StorePopulated | undefined {
  return item.store && typeof item.store === 'object' ? (item.store as StorePopulated) : undefined;
}

function qrSrc(item: QrListItem): string | undefined {
  return item.qr?.secureUrl || (item.qr as any)?.url;
}

/* ─────────────────────────── CopyButton */
function CopyButton({ value }: { value?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [value]);
  if (!value) return null;
  return (
    <Tooltip title={copied ? 'Copiado' : 'Copiar'}>
      <IconButton size="small" onClick={copy} sx={{ color: copied ? 'success.main' : 'action.active' }}>
        {copied ? <CheckRounded fontSize="inherit" /> : <ContentCopyRounded fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
}

/* ─────────────────────────── QR card */
function QrCard({ item }: { item: QrListItem }) {
  const theme = useTheme();
  const isSweep = item.kind === 'sweepstake';
  const accent = isSweep ? theme.palette.success.main : theme.palette.primary.main;
  const accentDark = isSweep ? theme.palette.success.dark : theme.palette.primary.dark;
  const gradient =
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(accentDark, 0.9)} 0%, ${alpha(accent, 0.6)} 100%)`
      : `linear-gradient(135deg, ${accentDark} 0%, ${accent} 100%)`;
  const store = storeOf(item);
  const src = qrSrc(item);
  const title = isSweep ? item.sweepstakeName || 'QR del Sorteo' : 'QR de la Tienda';

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: accent },
      }}
    >
      {/* Banner */}
      <Box sx={{ background: gradient, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'common.white',
            flexShrink: 0,
            '& svg': { fontSize: 18 },
          }}
        >
          <QrCode2Rounded />
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} color="common.white" noWrap>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }} noWrap>
            {store?.name || '—'}
          </Typography>
        </Box>
        <Chip
          label={isSweep ? 'Sorteo' : 'Tienda'}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'common.white', fontWeight: 600, fontSize: 11 }}
        />
      </Box>

      {/* Body */}
      <Box p={2} flex={1} display="flex" flexDirection="column">
        <Box
          sx={{
            mx: 'auto',
            width: 170,
            aspectRatio: '1 / 1',
            borderRadius: 2.5,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          {src ? (
            <Box component="img" src={src} alt="QR" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.5 }} />
          ) : (
            <QrCode2Rounded sx={{ fontSize: 44, color: 'text.disabled', opacity: 0.4 }} />
          )}
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
          <Chip
            label={item.link?.replace(/^https?:\/\//, '').slice(0, 40) || '—'}
            size="small"
            component="a"
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            icon={<OpenInNewRounded style={{ fontSize: 12 }} />}
            sx={{ fontFamily: 'monospace', fontSize: 10.5, maxWidth: '100%' }}
          />
          <CopyButton value={item.link} />
        </Stack>

        <Typography variant="caption" color="text.disabled" sx={{ mb: 1.5 }}>
          Slug: {item.slug || '—'} · {fmtDate(item.updatedAt)}
        </Typography>

        <Box flex={1} />

        {src && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadRounded />}
              onClick={() => downloadRemoteFile(src, `${item.kind}-${item.slug}.png`)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Descargar
            </Button>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

/* ─────────────────────────── Create dialog */
type CreateMode = 'url' | 'store';

function CreateQrDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (msg: string) => void;
}) {
  const theme = useTheme();
  // Busqueda propia: no comparte termino con el filtro de la pagina.
  const [storeTerm, setStoreTerm] = useState('');
  const { options: stores, loading: storesLoading } = useStoreSearch(storeTerm);
  const [mode, setMode] = useState<CreateMode>('url');
  const [url, setUrl] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const [urlResult, setUrlResult] = useState<GenerateQrResponse | null>(null);

  const reset = () => {
    setUrl('');
    setStore(null);
    setUrlResult(null);
  };

  const urlMut = useMutation({
    mutationFn: () => generateQr({ url: url.trim() }),
    onSuccess: (data) => setUrlResult(data),
  });

  const storeMut = useMutation({
    mutationFn: async (storeId: string) => {
      const out = { store: false, sweep: false };
      await upsertStoreGenericQr(storeId);
      out.store = true;
      try {
        const sw = await sweepstakesClient.getSweepstakeByStoreId(storeId, false);
        if (sw?._id) {
          await upsertSweepstakeOptinQr(sw._id, storeId);
          out.sweep = true;
        }
      } catch {
        /* sin sorteo activo → solo QR de tienda */
      }
      return out;
    },
    onSuccess: (out) => {
      onCreated(
        out.sweep
          ? 'QR de tienda y de sorteo activo generados ✅'
          : 'QR de tienda generado (sin sorteo activo) ✅'
      );
      reset();
      onClose();
    },
  });

  const handleClose = () => {
    if (urlMut.isPending || storeMut.isPending) return;
    onClose();
  };

  const urlImg = urlResult?.cloudinary?.secure_url || urlResult?.url;
  const validUrl = /^https?:\/\/.+/i.test(url.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', width: 36, height: 36 }}>
            <QrCodeRounded fontSize="small" />
          </Avatar>
          <Box flex={1}>
            <Typography fontWeight={700}>Crear QR</Typography>
            <Typography variant="caption" color="text.secondary">
              Desde una URL o para una tienda (con su sorteo activo)
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={mode}
          onChange={(_, v) => v && setMode(v)}
          sx={{ mb: 2.5, mt: 0.5 }}
        >
          <ToggleButton value="url" sx={{ textTransform: 'none', gap: 0.75 }}>
            <LinkRounded fontSize="small" /> Desde URL
          </ToggleButton>
          <ToggleButton value="store" sx={{ textTransform: 'none', gap: 0.75 }}>
            <StorefrontRounded fontSize="small" /> Desde tienda
          </ToggleButton>
        </ToggleButtonGroup>

        {mode === 'url' ? (
          <Stack spacing={2}>
            <TextField
              label="URL"
              placeholder="https://..."
              fullWidth
              size="small"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlResult(null); }}
              error={Boolean(url) && !validUrl}
              helperText={url && !validUrl ? 'Debe empezar con http:// o https://' : 'El QR se genera y descarga; no se guarda en la lista.'}
            />

            {urlImg && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 180,
                    aspectRatio: '1 / 1',
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'white',
                    border: `1px solid ${theme.palette.divider}`,
                    p: 1.5,
                  }}
                >
                  <Box component="img" src={urlImg} alt="QR" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" startIcon={<DownloadRounded />} onClick={() => downloadRemoteFile(urlImg!, 'qr.png')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Descargar
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<OpenInNewRounded />} href={urlImg} target="_blank" rel="noopener noreferrer" sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Abrir
                  </Button>
                </Stack>
              </Paper>
            )}

            {urlMut.isError && <Alert severity="error" sx={{ borderRadius: 2 }}>No se pudo generar el QR. Revisa la URL.</Alert>}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Autocomplete
              options={stores}
              loading={storesLoading}
              value={store}
              onChange={(_, v) => setStore(v)}
              inputValue={storeTerm}
              onInputChange={(_, v, reason) => { if (reason !== 'reset') setStoreTerm(v); }}
              filterOptions={(x) => x}
              noOptionsText={storeTerm.trim().length < 2 ? 'Escribi al menos 2 letras...' : 'Sin resultados'}
              getOptionLabel={(o) => o.name || ''}
              isOptionEqualToValue={(o, v) => o._id === v._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tienda"
                  size="small"
                  placeholder="Buscar tienda..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {storesLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Alert severity="info" sx={{ borderRadius: 2, py: 0 }}>
              Genera el QR genérico de la tienda y, si tiene un sorteo activo, también su QR de opt-in.
            </Alert>
            {storeMut.isError && <Alert severity="error" sx={{ borderRadius: 2 }}>No se pudo generar el QR de la tienda.</Alert>}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2, textTransform: 'none' }}>
          Cerrar
        </Button>
        {mode === 'url' ? (
          <Button
            variant="contained"
            disabled={!validUrl || urlMut.isPending}
            startIcon={urlMut.isPending ? <CircularProgress size={14} color="inherit" /> : <QrCode2Rounded />}
            onClick={() => urlMut.mutate()}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {urlMut.isPending ? 'Generando...' : 'Generar'}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={!store || storeMut.isPending}
            startIcon={storeMut.isPending ? <CircularProgress size={14} color="inherit" /> : <QrCode2Rounded />}
            onClick={() => store && storeMut.mutate(store._id)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {storeMut.isPending ? 'Generando...' : 'Generar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ─────────────────────────── Page */
export default function QrManagementPage() {
  const theme = useTheme();
  const qc = useQueryClient();
  const [storeFilter, setStoreFilter] = useState<Store | null>(null);
  const [kind, setKind] = useState<'all' | 'store' | 'sweepstake'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({ open: false, msg: '' });

  // Busqueda server-side: antes traia el catalogo completo de tiendas.
  const [storeTerm, setStoreTerm] = useState('');
  const { options: stores, loading: storesLoading } = useStoreSearch(storeTerm);

  const {
    data: qrResp,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['qr-list', storeFilter?._id ?? 'all', kind],
    queryFn: () => listQrs({ store: storeFilter?._id, kind }),
  });

  const items = qrResp?.data ?? [];
  const gradient =
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.65)} 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`;

  const onCreated = (msg: string) => {
    setSnack({ open: true, msg });
    qc.invalidateQueries({ queryKey: ['qr-list'] });
  };

  const headerCount = useMemo(() => (qrResp ? `${qrResp.total} códigos` : ''), [qrResp]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        mb={3}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'common.white',
            }}
          >
            <QrCodeRounded />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              Códigos QR
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isLoading ? 'Cargando...' : `Todos los QR generados · ${headerCount}`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refrescar">
            <span>
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching}
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) } }}
              >
                {isFetching ? <CircularProgress size={20} /> : <RefreshRounded />}
              </IconButton>
            </span>
          </Tooltip>
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, background: gradient }}>
            Crear QR
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} mb={3}>
        <Autocomplete
          sx={{ minWidth: { sm: 320 }, flex: { xs: 1, sm: 'unset' } }}
          options={stores}
          loading={storesLoading}
          value={storeFilter}
          onChange={(_, v) => setStoreFilter(v)}
          inputValue={storeTerm}
          onInputChange={(_, v, reason) => { if (reason !== 'reset') setStoreTerm(v); }}
          filterOptions={(x) => x}
          noOptionsText={storeTerm.trim().length < 2 ? 'Escribi al menos 2 letras...' : 'Sin resultados'}
          getOptionLabel={(o) => o.name || ''}
          isOptionEqualToValue={(o, v) => o._id === v._id}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Filtrar por tienda"
              placeholder="Todas las tiendas"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {storesLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <ToggleButtonGroup exclusive size="small" value={kind} onChange={(_, v) => v && setKind(v)}>
          <ToggleButton value="all" sx={{ textTransform: 'none', px: 2 }}>Todos</ToggleButton>
          <ToggleButton value="store" sx={{ textTransform: 'none', px: 2 }}>Tienda</ToggleButton>
          <ToggleButton value="sweepstake" sx={{ textTransform: 'none', px: 2 }}>Sorteo</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Content */}
      {isError ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No se pudieron cargar los códigos QR.
        </Alert>
      ) : isLoading ? (
        <Grid container spacing={2.5}>
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center' }}>
          <QrCode2Rounded sx={{ fontSize: 56, color: 'text.disabled', opacity: 0.35, mb: 1.5 }} />
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {storeFilter ? 'Esta tienda no tiene códigos QR' : 'Aún no hay códigos QR'}
          </Typography>
          <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', mt: 1 }}>
            Crear el primero
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`${item.kind}-${item._id}`}>
              <QrCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateQrDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onCreated}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
