'use client';

import {
  getStoreGenericQr,
  getSweepstakeOptinQr,
  upsertStoreGenericQr,
  upsertSweepstakeOptinQr,
  type StoreQr,
  type SweepstakeQr,
} from '@/services/qr.service';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import {
  AutorenewRounded,
  CheckRounded,
  CloseRounded,
  ContentCopyRounded,
  DownloadRounded,
  OpenInNewRounded,
  QrCode2Rounded,
  QrCodeRounded,
  RefreshRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useCallback, useState } from 'react';

/* ──────────────────────────────────────────────────────── types */
type PreviewTarget = { type: 'store'; doc: StoreQr } | { type: 'sweep'; doc: SweepstakeQr };

/* ──────────────────────────────────────────────────────── helpers */
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

/* ──────────────────────────────────────────────────────── CopyButton */
function CopyButton({ value, size = 'small' }: { value?: string; size?: 'small' | 'medium' }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [value]);
  if (!value) return null;
  return (
    <Tooltip title={copied ? 'Copiado' : 'Copiar'}>
      <IconButton size={size} onClick={copy} aria-label="copiar" sx={{ color: copied ? 'success.main' : 'action.active' }}>
        {copied ? <CheckRounded fontSize="inherit" /> : <ContentCopyRounded fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
}

/* ──────────────────────────────────────────────────────── LinkChip */
function LinkChip({ href }: { href?: string }) {
  if (!href) return null;
  const short = href.replace(/^https?:\/\//, '').slice(0, 48) + (href.length > 55 ? '…' : '');
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Chip
        label={short}
        size="small"
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        clickable
        icon={<OpenInNewRounded style={{ fontSize: 12 }} />}
        sx={{ fontFamily: 'monospace', fontSize: 11, maxWidth: '100%' }}
      />
      <CopyButton value={href} />
    </Stack>
  );
}

/* ──────────────────────────────────────────────────────── QrFrame */
function QrFrame({
  src,
  loading,
  accentColor,
}: {
  src?: string;
  loading?: boolean;
  accentColor: string;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'relative',
        mx: 'auto',
        width: { xs: '100%', sm: 220 },
        aspectRatio: '1 / 1',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: `0 0 0 3px ${alpha(accentColor, 0.25)}, 0 8px 32px ${alpha(accentColor, 0.12)}`,
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}
      {src && !loading && (
        <Box
          component="img"
          src={src}
          alt="QR code"
          loading="lazy"
          sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.5 }}
        />
      )}
      {!src && !loading && (
        <Stack alignItems="center" spacing={1} sx={{ color: 'text.disabled', p: 2 }}>
          <QrCode2Rounded sx={{ fontSize: 48, opacity: 0.3 }} />
          <Typography variant="caption" textAlign="center">
            Sin imagen
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

/* ──────────────────────────────────────────────────────── CardBanner */
function CardBanner({
  icon,
  label,
  badge,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  gradient: string;
}) {
  return (
    <Box
      sx={{
        background: gradient,
        px: 2.5,
        py: 2,
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
          backdropFilter: 'blur(4px)',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box flex={1} minWidth={0}>
        <Typography variant="subtitle2" fontWeight={700} color="#fff" noWrap>
          {label}
        </Typography>
      </Box>
      {badge}
    </Box>
  );
}

/* ──────────────────────────────────────────────────────── MetaRow */
function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="caption" color="text.disabled" sx={{ minWidth: 80, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

/* ──────────────────────────────────────────────────────── SkeletonQrCard */
function SkeletonQrCard() {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 0 }} />
      <Box p={2.5}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Skeleton variant="rectangular" width={220} height={220} sx={{ borderRadius: 2 }} />
        </Box>
        <Stack spacing={1.2}>
          <Skeleton variant="text" height={18} />
          <Skeleton variant="text" height={18} width="75%" />
          <Skeleton variant="text" height={18} width="55%" />
        </Stack>
        <Stack direction="row" spacing={1} mt={2.5} justifyContent="flex-end">
          <Skeleton variant="rectangular" width={90} height={32} sx={{ borderRadius: 1.5 }} />
          <Skeleton variant="rectangular" width={90} height={32} sx={{ borderRadius: 1.5 }} />
        </Stack>
      </Box>
    </Paper>
  );
}

/* ──────────────────────────────────────────────────────── Main */
export interface QrDuetMUIProps {
  storeId: string;
}

export default function QrDuetMUI({ storeId }: QrDuetMUIProps) {
  const theme = useTheme();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  /* ── queries ── */
  const {
    data: storeQr,
    isLoading: loadingStore,
    isError: errorStore,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ['storeQr', storeId],
    queryFn: () => getStoreGenericQr(storeId),
    enabled: Boolean(storeId),
    retry: 1,
  });

  const {
    data: sweepstake,
    isLoading: loadingSW,
    refetch: refetchSW,
  } = useQuery({
    queryKey: ['active-sweepstake', storeId],
    queryFn: () => sweepstakesClient.getSweepstakeByStoreId(storeId, true),
    enabled: !!storeId,
    retry: 1,
  });

  const sweepstakeId = sweepstake?._id as string | undefined;

  const {
    data: sweepQrResp,
    isLoading: loadingSweepQr,
    refetch: refetchSweepQr,
  } = useQuery({
    queryKey: ['sweepstakeQr', sweepstakeId, storeId],
    queryFn: () => getSweepstakeOptinQr(sweepstakeId as string, storeId),
    enabled: Boolean(sweepstakeId && storeId),
    retry: 1,
  });

  const sweepQr = sweepQrResp?.data ?? null;
  const isFallback = sweepQrResp?.isFallback ?? false;
  const fallbackLink = sweepQrResp?.fallbackLink;

  /* ── mutations ── */
  const genStoreMut = useMutation({
    mutationFn: () => upsertStoreGenericQr(storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['storeQr', storeId] });
    },
  });

  const genSweepMut = useMutation({
    mutationFn: () => upsertSweepstakeOptinQr(sweepstakeId as string, storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sweepstakeQr', sweepstakeId, storeId] });
    },
  });

  const anyLoading = loadingStore || loadingSW || loadingSweepQr;

  /* theme-driven colors — follow customization dialog */
  const storeAccent = theme.palette.primary.main;
  const sweepAccent = theme.palette.success.main;

  const storeGradient =
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.65)} 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`;

  const sweepGradient =
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.success.dark, 0.9)} 0%, ${alpha(theme.palette.success.main, 0.6)} 100%)`
      : `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`;

  const storeImg = storeQr ? (storeQr.qr.secureUrl || (storeQr.qr as any).url) : undefined;
  const sweepImg = sweepQr ? (sweepQr.qr.secureUrl || (sweepQr.qr as any).url) : undefined;

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        mb={3}
        gap={1.5}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: storeGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${alpha(storeAccent, 0.3)}`,
            }}
          >
            <QrCodeRounded sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Códigos QR
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Genera y descarga los códigos QR de opt-in
            </Typography>
          </Box>
        </Stack>

        <Tooltip title="Refrescar todo">
          <span>
            <IconButton
              onClick={() => { refetchStore(); refetchSW(); refetchSweepQr(); }}
              disabled={anyLoading}
              sx={{ bgcolor: alpha(storeAccent, 0.06), '&:hover': { bgcolor: alpha(storeAccent, 0.12) } }}
            >
              {anyLoading ? <CircularProgress size={20} /> : <RefreshRounded />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* ── Cards grid ─────────────────────────────────────── */}
      <Grid container spacing={3}>

        {/* ── Store QR Card ── */}
        <Grid item xs={12} md={6}>
          {loadingStore ? (
            <SkeletonQrCard />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: `0 4px 20px ${alpha(storeAccent, 0.12)}` },
              }}
            >
              <CardBanner
                icon={<QrCode2Rounded />}
                label="QR Genérico de la Tienda"
                gradient={storeGradient}
                badge={
                  storeQr ? (
                    <Chip label="Activo" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: 11 }} />
                  ) : (
                    <Chip label="Sin generar" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 11 }} />
                  )
                }
              />

              <Box p={2.5} flex={1} display="flex" flexDirection="column">
                <Box display="flex" justifyContent="center" mb={2.5}>
                  <QrFrame src={storeImg} accentColor={storeAccent} />
                </Box>

                {/* Link */}
                <Stack spacing={0.75} mb={2}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.6}>
                    URL destino
                  </Typography>
                  <LinkChip href={storeQr?.link} />
                </Stack>

                {/* Meta */}
                {storeQr && (
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(storeAccent, 0.03), mb: 2 }}
                  >
                    <Stack spacing={0.5}>
                      <MetaRow label="Slug" value={storeQr.slug} />
                      <MetaRow label="Formato" value={storeQr.qr.format?.toUpperCase()} />
                      <MetaRow label="Actualizado" value={fmtDate(storeQr.updatedAt)} />
                    </Stack>
                  </Paper>
                )}

                <Box flex={1} />

                {/* Error */}
                {errorStore && (
                  <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                    Error al cargar QR de tienda
                  </Alert>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={genStoreMut.isPending ? <CircularProgress size={14} /> : <AutorenewRounded />}
                    onClick={() => genStoreMut.mutate()}
                    disabled={genStoreMut.isPending}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {storeQr ? 'Regenerar' : 'Generar QR'}
                  </Button>
                  {storeQr && storeImg && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadRounded />}
                        onClick={() => downloadRemoteFile(storeImg, `store-${storeQr.slug}.png`)}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Descargar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<VisibilityRounded />}
                        onClick={() => setPreview({ type: 'store', doc: storeQr })}
                        sx={{ borderRadius: 2, textTransform: 'none', background: storeGradient }}
                      >
                        Preview
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* ── Sweepstake QR Card ── */}
        <Grid item xs={12} md={6}>
          {loadingSW || loadingSweepQr ? (
            <SkeletonQrCard />
          ) : !sweepstakeId ? (
            <Paper
              variant="outlined"
              sx={{ borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardBanner
                icon={<QrCode2Rounded />}
                label="QR del Sorteo Activo"
                gradient={sweepGradient}
                badge={<Chip label="Sin sorteo" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 11 }} />}
              />
              <Box p={3} flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <QrCode2Rounded sx={{ fontSize: 56, color: alpha(sweepAccent, 0.25), mb: 1.5 }} />
                <Typography variant="subtitle2" color="text.secondary" textAlign="center" gutterBottom>
                  No hay un sorteo activo
                </Typography>
                <Typography variant="caption" color="text.disabled" textAlign="center">
                  Activa un sweepstake para esta tienda para poder generar su QR de opt-in.
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: `0 4px 20px ${alpha(sweepAccent, 0.12)}` },
              }}
            >
              <CardBanner
                icon={<QrCode2Rounded />}
                label={sweepstake?.name ? `QR: ${sweepstake.name}` : 'QR del Sorteo Activo'}
                gradient={sweepGradient}
                badge={
                  sweepQr ? (
                    <Chip label="Generado" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: 11 }} />
                  ) : (
                    <Chip label="Sin generar" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 11 }} />
                  )
                }
              />

              <Box p={2.5} flex={1} display="flex" flexDirection="column">
                {sweepQr ? (
                  <>
                    <Box display="flex" justifyContent="center" mb={2.5}>
                      <QrFrame src={sweepImg} accentColor={sweepAccent} />
                    </Box>

                    <Stack spacing={0.75} mb={2}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.6}>
                        URL destino
                      </Typography>
                      <LinkChip href={sweepQr.link} />
                    </Stack>

                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(sweepAccent, 0.03), mb: 2 }}
                    >
                      <Stack spacing={0.5}>
                        <MetaRow label="Slug" value={sweepQr.slug} />
                        <MetaRow label="Base link" value={sweepQr.baseLink} />
                        <MetaRow label="Actualizado" value={fmtDate(sweepQr.updatedAt)} />
                      </Stack>
                    </Paper>
                  </>
                ) : (
                  /* Not generated yet — fallback state */
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 3,
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        border: `2px dashed ${alpha(sweepAccent, 0.35)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        bgcolor: alpha(sweepAccent, 0.04),
                      }}
                    >
                      <QrCode2Rounded sx={{ fontSize: 40, color: alpha(sweepAccent, 0.35) }} />
                    </Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      QR aún no generado
                    </Typography>
                    <Typography variant="caption" color="text.disabled" textAlign="center" mb={2}>
                      URL que usará este QR:
                    </Typography>
                    <LinkChip href={fallbackLink} />
                  </Box>
                )}

                <Box flex={1} />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={genSweepMut.isPending ? <CircularProgress size={14} /> : <AutorenewRounded />}
                    onClick={() => genSweepMut.mutate()}
                    disabled={genSweepMut.isPending}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: sweepAccent,
                      color: sweepAccent,
                      '&:hover': { borderColor: sweepAccent, bgcolor: alpha(sweepAccent, 0.06) },
                    }}
                  >
                    {sweepQr ? 'Regenerar' : 'Generar QR'}
                  </Button>
                  {sweepQr && sweepImg && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadRounded />}
                        onClick={() => downloadRemoteFile(sweepImg, `sweepstake-${sweepQr.slug}.png`)}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Descargar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<VisibilityRounded />}
                        onClick={() => setPreview({ type: 'sweep', doc: sweepQr })}
                        sx={{ borderRadius: 2, textTransform: 'none', background: sweepGradient }}
                      >
                        Preview
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* ── Preview Dialog ─────────────────────────────────── */}
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <CardBanner
            icon={<QrCode2Rounded />}
            label={preview?.type === 'store' ? 'QR Genérico de la Tienda' : 'QR del Sorteo Activo'}
            gradient={preview?.type === 'store' ? storeGradient : sweepGradient}
            badge={
              <IconButton size="small" onClick={() => setPreview(null)} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <CloseRounded fontSize="small" />
              </IconButton>
            }
          />
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {preview && (() => {
            const doc = preview.doc;
            const img = doc.qr.secureUrl || (doc.qr as any).url;
            const accent = preview.type === 'store' ? storeAccent : sweepAccent;

            return (
              <Grid container spacing={3} alignItems="flex-start">
                {/* Image */}
                <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 280,
                      aspectRatio: '1/1',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: `0 0 0 3px ${alpha(accent, 0.2)}, 0 12px 40px ${alpha(accent, 0.15)}`,
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'white',
                      p: 2,
                    }}
                  >
                    <Box component="img" src={img} alt="QR" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </Box>
                </Grid>

                {/* Meta */}
                <Grid item xs={12} md={7}>
                  <Stack spacing={1.5}>
                    {preview.type === 'store' ? (
                      <>
                        <Box>
                          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.6} fontWeight={600}>Slug</Typography>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="body2" fontFamily="monospace">{(doc as StoreQr).slug}</Typography>
                            <CopyButton value={(doc as StoreQr).slug} />
                          </Stack>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.6} fontWeight={600}>Link destino</Typography>
                          <Stack direction="row" alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>{(doc as StoreQr).link}</Typography>
                            <CopyButton value={(doc as StoreQr).link} />
                          </Stack>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box>
                          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.6} fontWeight={600}>Slug</Typography>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="body2" fontFamily="monospace">{(doc as SweepstakeQr).slug}</Typography>
                            <CopyButton value={(doc as SweepstakeQr).slug} />
                          </Stack>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.6} fontWeight={600}>Link final</Typography>
                          <Stack direction="row" alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>{(doc as SweepstakeQr).link}</Typography>
                            <CopyButton value={(doc as SweepstakeQr).link} />
                          </Stack>
                        </Box>
                      </>
                    )}

                    <Divider />

                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(accent, 0.03) }}>
                      <Stack spacing={0.6}>
                        <MetaRow label="Formato" value={doc.qr.format?.toUpperCase()} />
                        <MetaRow label="Tamaño" value={doc.qr.size ? `${doc.qr.size} px` : undefined} />
                        <MetaRow label="Nivel EC" value={doc.qr.level} />
                        <MetaRow label="Public ID" value={doc.qr.publicId} />
                        <MetaRow label="Generado" value={fmtDate(doc.qr.generatedAt)} />
                        <MetaRow label="Actualizado" value={fmtDate(doc.updatedAt)} />
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {preview && (() => {
            const doc = preview.doc;
            const img = doc.qr.secureUrl || (doc.qr as any).url;
            const slug = preview.type === 'store' ? (doc as StoreQr).slug : (doc as SweepstakeQr).slug;
            const ext = String(doc.qr.format || 'png').toLowerCase() === 'svg' ? '.svg' : '.png';
            return (
              <>
                <Button
                  variant="contained"
                  startIcon={<DownloadRounded />}
                  onClick={() => downloadRemoteFile(img, `${preview.type}-${slug}${ext}`)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Descargar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewRounded />}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Abrir
                </Button>
              </>
            );
          })()}
          <Button onClick={() => setPreview(null)} sx={{ borderRadius: 2, textTransform: 'none', ml: 'auto' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
