// src/components/QrDuetMUI.tsx
import {
  getStoreGenericQr,
  getSweepstakeOptinQr,
  type StoreQr,
  type SweepstakeQr,
} from '@/services/qr.service';
import { sweepstakesClient } from '@/services/sweepstakes.service';

import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export interface QrDuetMUIProps {
  storeId: string;
  className?: string;
}

type PreviewTarget = { type: 'store'; doc: StoreQr } | { type: 'sweepstake'; doc: SweepstakeQr };

type ActiveSweepstake = {
  _id: string;
  name?: string;
  status?: string; // 'in progress' | 'completed' | ...
  confirmationLink?: string;
};

function formatDate(d?: string | Date) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString();
}

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

function KV({
  label,
  value,
  copyable,
}: {
  label: string;
  value?: React.ReactNode;
  copyable?: boolean;
}) {
  const str = typeof value === 'string' ? value : undefined;
  const handleCopy = useCallback(() => {
    if (!str) return;
    navigator.clipboard?.writeText(str).catch(() => {});
  }, [str]);

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: 140, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Box sx={{ wordBreak: 'break-all', flex: 1 }}>
        <Typography variant="body2">{value ?? '—'}</Typography>
      </Box>
      {copyable && str && (
        <Tooltip title="Copiar">
          <IconButton
            size="small"
            onClick={handleCopy}
            aria-label={`copiar ${label}`}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

function SkeletonCard() {
  return (
    <Card
      variant="outlined"
      sx={{ height: '100%' }}
    >
      <CardHeader
        title={<Box sx={{ height: 28, bgcolor: 'action.hover', borderRadius: 1 }} />}
        avatar={
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'action.hover' }} />
        }
      />
      <CardContent>
        <Box
          sx={{
            aspectRatio: '1 / 1',
            width: '100%',
            borderRadius: 2,
            bgcolor: 'action.hover',
            mb: 2,
          }}
        />
        <Stack spacing={1}>
          <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1 }} />
          <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1, width: '80%' }} />
          <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1, width: '60%' }} />
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Box sx={{ width: 120, height: 36, bgcolor: 'action.hover', borderRadius: 1 }} />
      </CardActions>
    </Card>
  );
}

export default function QrDuetMUI({ storeId, className }: QrDuetMUIProps) {
  // 1) QR genérico de tienda
  const {
    data: storeQr,
    isLoading: loadingStore,
    isError: errorStore,
    error: storeErr,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ['storeQr', storeId],
    queryFn: () => getStoreGenericQr(storeId),
    enabled: Boolean(storeId),
  });

  // 2) Sweepstake activo por tienda
  const {
    data: sweepstake,
    isLoading: loadingSWMeta,
    isError: errorSWMeta,
    error: swMetaErr,
    refetch: refetchSWMeta,
  } = useQuery({
    queryKey: ['active-sweepstake', storeId],
    queryFn: () => sweepstakesClient.getSweepstakeByStoreId(storeId, true),
    enabled: !!storeId,
  });

  const sweepstakeId = sweepstake?._id;

  // 3) QR del opt-in (usando el sweepstake activo)
  const {
    data: sweepQr,
    isLoading: loadingSweep,
    isError: errorSweep,
    error: sweepErr,
    refetch: refetchSweep,
  } = useQuery({
    queryKey: ['sweepstakeQr', sweepstakeId, storeId],
    queryFn: () => getSweepstakeOptinQr(sweepstakeId as string, storeId),
    enabled: Boolean(sweepstakeId && storeId),
  });

  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  const anyLoading = loadingStore || loadingSWMeta || loadingSweep;
  const anyError = errorStore || errorSWMeta || errorSweep;

  const cards = useMemo(
    () =>
      [
        storeQr && {
          key: 'store' as const,
          title: 'QR genérico de la tienda',
          subtitle: storeQr.slug,
          img: storeQr.qr.secureUrl || (storeQr.qr as any).url,
          downloadName: `store-${storeQr.slug}.png`,
          onPreview: () => setPreview({ type: 'store', doc: storeQr }),
        },
        sweepstakeId &&
          sweepQr && {
            key: 'sweepstake' as const,
            title: 'QR del opt-in (sweepstake)',
            subtitle: sweepstake?.name || 'Sorteo activo',
            img: sweepQr.qr.secureUrl || (sweepQr.qr as any).url,
            downloadName: `sweepstake-${
              typeof sweepQr.sweepstake === 'string' ? sweepQr.sweepstake : sweepQr.sweepstake._id
            }-${sweepQr.slug}.png`,
            onPreview: () => setPreview({ type: 'sweepstake', doc: sweepQr }),
          },
      ].filter(Boolean) as Array<{
        key: 'store' | 'sweepstake';
        title: string;
        subtitle?: string;
        img: string;
        downloadName: string;
        details: React.ReactNode;
        onPreview: () => void;
      }>,
    [storeQr, sweepQr, sweepstake?.name, sweepstakeId]
  );

  return (
    <Box
      className={className}
      sx={{ width: '100%' }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2, gap: 1 }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Typography variant="h6">Códigos QR</Typography>
        </Stack>
        <Tooltip title="Refrescar">
          <span>
            <IconButton
              aria-label="refrescar"
              onClick={() => {
                refetchStore();
                refetchSWMeta();
                refetchSweep();
              }}
              disabled={anyLoading}
            >
              {anyLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Errores */}
      {anyError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 0.5 }}
          >
            Error al cargar
          </Typography>
          {errorStore && <div>Store QR: {(storeErr as any)?.message || 'Error'}</div>}
          {errorSWMeta && <div>Sweepstake activo: {(swMetaErr as any)?.message || 'Error'}</div>}
          {errorSweep && sweepstakeId && (
            <div>QR del sweepstake: {(sweepErr as any)?.message || 'Error'}</div>
          )}
        </Alert>
      )}

      {/* Aviso si no hay sweepstake */}
      {!loadingSWMeta && !errorSWMeta && !sweepstakeId && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
        >
          No hay un sweepstake activo para esta tienda. Mostramos solo el QR genérico de la tienda.
        </Alert>
      )}

      {/* Cards */}
      <Grid
        container
        spacing={2}
      >
        {cards.map((c) => (
          <Grid
            item
            xs={12}
            md={4}
            key={c.key}
          >
            <Card
              variant="outlined"
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardHeader
                title={<Typography variant="subtitle1">{c.title}</Typography>}
              />
              <CardContent sx={{ pt: 0 }}>
                <Box
                  sx={{
                    aspectRatio: '1 / 1',
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    mb: 1.5,
                  }}
                >
                  {c.img ? (
                    <Box
                      component="img"
                      src={c.img}
                      alt={c.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  ) : (
                    <Typography color="text.secondary">Sin imagen</Typography>
                  )}
                </Box>

                <Stack spacing={1}>{c.details}</Stack>
              </CardContent>

              <Box sx={{ flexGrow: 1 }} />

              <Divider />

              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={c.onPreview}
                  variant="contained"
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadRemoteFile(c.img, c.downloadName)}
                  variant="outlined"
                >
                  Descargar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {(loadingStore || loadingSWMeta || loadingSweep) && (
          <>
            <Grid
              item
              xs={12}
              md={6}
            >
              <SkeletonCard />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <SkeletonCard />
            </Grid>
          </>
        )}

        {!anyLoading && cards.length === 0 && (
          <Grid
            item
            xs={12}
          >
            <Alert severity="info">No hay datos para mostrar.</Alert>
          </Grid>
        )}
      </Grid>

      {/* Modal de preview */}
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {preview?.type === 'store' ? 'QR genérico de la tienda' : 'QR del opt-in (sweepstake)'}
          <IconButton
            onClick={() => setPreview(null)}
            aria-label="cerrar"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {preview && (
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                md={6}
              >
                <Box
                  sx={{
                    aspectRatio: '1 / 1',
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box
                    component="img"
                    src={preview.doc.qr.secureUrl || (preview.doc.qr as any).url}
                    alt="QR"
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
              >
                <Stack spacing={1}>
                  {preview.type === 'store' ? (
                    <>
                      <KV
                        label="Slug"
                        value={(preview.doc as StoreQr).slug}
                        copyable
                      />
                      <KV
                        label="Link destino"
                        value={(preview.doc as StoreQr).link}
                        copyable
                      />
                    </>
                  ) : (
                    <>
                      <KV
                        label="Slug"
                        value={(preview.doc as SweepstakeQr).slug}
                        copyable
                      />
                      <KV
                        label="Base link"
                        value={(preview.doc as SweepstakeQr).baseLink}
                        copyable
                      />
                      <KV
                        label="Link final"
                        value={(preview.doc as SweepstakeQr).link}
                        copyable
                      />
                    </>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <KV
                    label="Formato"
                    value={preview.doc.qr.format?.toUpperCase()}
                  />
                  <KV
                    label="Tamaño"
                    value={`${preview.doc.qr.size ?? '—'} px`}
                  />
                  <KV
                    label="Nivel"
                    value={preview.doc.qr.level}
                  />
                  <KV
                    label="public_id"
                    value={preview.doc.qr.publicId}
                    copyable
                  />
                  <KV
                    label="Creado"
                    value={formatDate(preview.doc.createdAt)}
                  />
                  <KV
                    label="Actualizado"
                    value={formatDate(preview.doc.updatedAt)}
                  />
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {preview && (
            <>
              <Button
                startIcon={<DownloadIcon />}
                variant="contained"
                onClick={() =>
                  downloadRemoteFile(
                    preview.doc.qr.secureUrl || (preview.doc.qr as any).url,
                    (preview.type === 'store'
                      ? `store-${(preview.doc as StoreQr).slug}`
                      : `sweepstake-${
                          typeof (preview.doc as SweepstakeQr).sweepstake === 'string'
                            ? (preview.doc as SweepstakeQr).sweepstake
                            : (preview.doc as SweepstakeQr).sweepstake
                        }-${(preview.doc as SweepstakeQr).slug}`) +
                      (String(preview.doc.qr.format || '').toLowerCase() === 'svg'
                        ? '.svg'
                        : '.png')
                  )
                }
              >
                Descargar
              </Button>
              <Button
                startIcon={<OpenInNewIcon />}
                href={preview.doc.qr.secureUrl || (preview.doc.qr as any).url}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                Abrir
              </Button>
            </>
          )}
          <Button onClick={() => setPreview(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
