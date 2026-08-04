'use client';

import { Store } from '@/services/store.service';
import { uploadCampaignImage } from '@/services/upload.service';
import {
  CameraAltRounded,
  EditLocationAltRounded,
  LinkRounded,
  OpenInNewRounded,
  QrCodeRounded,
  RocketLaunch,
  StoreMallDirectoryRounded,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<Store['type'], string> = {
  elite: 'Elite',
  basic: 'Basic',
  free: 'Free',
};

const PROVIDER_LABEL: Record<string, string> = {
  twilio: 'Twilio',
  bandwidth: 'Bandwidth',
  infobip: 'Infobip',
};

/* ── Botón de acción: neutro, sin color de categoría ──────────── */
function IBtn({
  title,
  onClick,
  href,
  children,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const btn = (
    <Tooltip
      title={title}
      arrow
      placement="bottom"
    >
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          color: 'text.secondary',
          transition: 'color 0.15s ease, background-color 0.15s ease',
          '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
  if (href)
    return (
      <Link
        href={href}
        style={{ textDecoration: 'none', display: 'inline-flex' }}
      >
        {btn}
      </Link>
    );
  return btn;
}

/* ── Etiqueta de metadato: texto, no cápsula de color ─────────── */
function Meta({ children, dot }: { children: React.ReactNode; dot?: string }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.6}
    >
      {dot && (
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: 11.5, fontWeight: 500 }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

type Props = {
  image?: string;
  address: string;
  kioskUrl: string;
  qrImageUrl?: string;
  showQrBadge?: boolean;
  edit: boolean;
  name: string;
  type: Store['type'];
  provider: Store['provider'];
  /** Estado resuelto por el panel. Único color con significado del encabezado. */
  statusLabel: string;
  statusColor: string;
  onNameChange?: (val: string) => void;
  /**
   * Imagen DE ESTA TIENDA (`store.image`). No toca el logo de la marca
   * (`mmsTheme.logoUrl`, pestaña Brand): dos tiendas de la misma marca pueden
   * tener foto propia.
   */
  onImageChange?: (url: string) => void;
};

// Pure helper — extracts the `slug` query param, allocated once at module scope
const extractSlug = (url?: string) => {
  try {
    return new URL(url || '').searchParams.get('slug') ?? undefined;
  } catch {
    return undefined;
  }
};

export default function StoreHeader({
  image,
  address,
  kioskUrl,
  qrImageUrl,
  showQrBadge,
  edit,
  name,
  type,
  provider,
  statusLabel,
  statusColor,
  onNameChange,
  onImageChange,
}: Props) {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [qrOpen, setQrOpen] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  const canEditImage = edit && !!onImageChange;

  async function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingImage(true);
    try {
      // Carpeta propia: la foto de la tienda no se mezcla con los logos de marca
      const { url } = await uploadCampaignImage(file, 'store-images');
      if (!url) throw new Error('sin url');
      onImageChange?.(url);
      toast.success('Imagen lista. Guarda los cambios para aplicarla.');
    } catch {
      toast.error('No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  }

  const slug = extractSlug(kioskUrl);
  const qrHref = slug ? `https://st.sweepstouch.com/?slug=${encodeURIComponent(slug)}` : undefined;
  /** Linktree público de la tienda — mismo slug que el kiosko. */
  const linktreeHref = slug
    ? `https://links.sweepstouch.com/?slug=${encodeURIComponent(slug)}`
    : undefined;
  const fallbackQrSrc = qrHref
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrHref)}&size=512x512`
    : undefined;

  const inferredShow = (searchParams.get('tag') || '').toLowerCase() === 'general-info';
  const shouldShowQr = typeof showQrBadge === 'boolean' ? showQrBadge : inferredShow;

  /* Don't duplicate address if name already contains it */
  const showAddress = address && !name.toLowerCase().includes(address.toLowerCase().slice(0, 20));

  return (
    <>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 2.5 },
          pb: { xs: 1.75, md: 2 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={{ xs: 1.5, md: 2 }}
          flexWrap={{ xs: 'wrap', md: 'nowrap' }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              canEditImage ? (
                <Tooltip
                  title="Cambiar imagen de la tienda"
                  arrow
                >
                  <IconButton
                    component="label"
                    size="small"
                    disabled={uploadingImage}
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: 'background.paper',
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': { bgcolor: 'primary.main', color: 'common.white' },
                    }}
                  >
                    {uploadingImage ? (
                      <CircularProgress size={12} />
                    ) : (
                      <CameraAltRounded sx={{ fontSize: 13 }} />
                    )}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handlePickImage}
                    />
                  </IconButton>
                </Tooltip>
              ) : null
            }
          >
            <Avatar
              src={image}
              alt={name}
              variant="rounded"
              sx={{
                width: { xs: 46, md: 52 },
                height: { xs: 46, md: 52 },
                borderRadius: 2,
                flexShrink: 0,
                bgcolor: (t) =>
                  alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.16 : 0.08),
                color: 'primary.main',
              }}
            >
              <StoreMallDirectoryRounded sx={{ fontSize: 24 }} />
            </Avatar>
          </Badge>

          <Box
            flex={1}
            minWidth={0}
          >
            {edit ? (
              <TextField
                size="small"
                fullWidth
                value={name}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder="Nombre de la tienda"
                sx={{ mb: 0.75, maxWidth: 460 }}
                inputProps={{ style: { fontWeight: 700, fontSize: 16 } }}
              />
            ) : (
              <Typography
                variant="h6"
                fontWeight={700}
                lineHeight={1.25}
                sx={{
                  fontSize: { xs: 17, md: 19 },
                  letterSpacing: -0.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={name}
              >
                {name}
              </Typography>
            )}

            {showAddress && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: 'block', fontSize: 12.5, mt: 0.15 }}
                noWrap
                title={address}
              >
                {address}
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={1.5}
              divider={
                <Box sx={{ width: '1px', bgcolor: 'divider', alignSelf: 'stretch', my: 0.25 }} />
              }
              useFlexGap
              flexWrap="wrap"
              mt={0.85}
            >
              <Meta dot={statusColor}>{statusLabel}</Meta>
              <Meta>{TYPE_LABEL[type] ?? 'Free'}</Meta>
              <Meta>{PROVIDER_LABEL[provider] ?? 'Sin proveedor'}</Meta>
            </Stack>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.25}
            flexShrink={0}
            sx={{
              width: { xs: '100%', md: 'auto' },
              justifyContent: 'flex-end',
              mt: { xs: 0.5, md: 0 },
            }}
          >
            <IBtn
              title="Ver en Google Maps"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    address || ''
                  )}`,
                  '_blank'
                )
              }
            >
              <EditLocationAltRounded sx={{ fontSize: 18 }} />
            </IBtn>

            <IBtn
              title="Abrir kiosko"
              onClick={() => window.open(kioskUrl, '_blank')}
            >
              <OpenInNewRounded sx={{ fontSize: 18 }} />
            </IBtn>

            {linktreeHref && (
              <IBtn
                title="Abrir linktree de la tienda"
                onClick={() => window.open(linktreeHref, '_blank', 'noopener')}
              >
                <LinkRounded sx={{ fontSize: 18 }} />
              </IBtn>
            )}

            <IBtn
              title="Impulsar tienda"
              href={`/admin/management/work-stores?q=${encodeURIComponent(name)}`}
            >
              <RocketLaunch sx={{ fontSize: 18 }} />
            </IBtn>

            {shouldShowQr && qrHref && (
              <Tooltip
                title="Ver QR del sorteo"
                arrow
              >
                <Box
                  role="button"
                  aria-label="Ver código QR del sorteo"
                  tabIndex={0}
                  onClick={() => setQrOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setQrOpen(true);
                    }
                  }}
                  sx={{
                    ml: 0.75,
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    '&:focus-visible, &:hover': { borderColor: 'primary.main' },
                  }}
                >
                  {qrImageUrl || fallbackQrSrc ? (
                    <Box
                      component="img"
                      src={qrImageUrl || fallbackQrSrc}
                      alt="QR"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <QrCodeRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                  )}
                </Box>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, pb: 1 }}>QR del sorteo</DialogTitle>
        <DialogContent
          dividers
          sx={{ display: 'grid', placeItems: 'center', p: 3 }}
        >
          {qrImageUrl || fallbackQrSrc ? (
            <Box
              component="img"
              src={qrImageUrl || fallbackQrSrc}
              alt="QR sorteo"
              sx={{
                width: '100%',
                maxWidth: 300,
                height: 'auto',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sin imagen de QR.
            </Typography>
          )}
          {qrHref && (
            <Typography
              variant="caption"
              sx={{ mt: 2, textAlign: 'center', wordBreak: 'break-all' }}
            >
              <MuiLink
                href={qrHref}
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
              >
                {qrHref}
              </MuiLink>
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          {qrHref && (
            <Button
              onClick={() => window.open(qrHref, '_blank')}
              variant="contained"
              size="small"
              disableElevation
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Abrir enlace
            </Button>
          )}
          <Button
            onClick={() => setQrOpen(false)}
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
