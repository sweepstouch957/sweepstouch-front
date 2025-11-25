'use client';

import { Store } from '@/services/store.service';
import { getProviderChip, getTierColor } from '@/utils/ui/store.page';
import { RocketLaunch } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveIcon from '@mui/icons-material/Save';
import ShieldIcon from '@mui/icons-material/Shield';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';
import VerifiedIcon from '@mui/icons-material/Verified';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

type Props = {
  image?: string;
  address: string;
  kioskUrl: string;    // debe contener ?slug=...
  qrImageUrl?: string; // opcional: imagen QR desde backend
  showQrBadge?: boolean; // opcional: forzar visibilidad del QR
  edit: boolean;
  saving: boolean;
  name: string;
  type: Store['type'];
  provider: Store['provider'];
  active: boolean;
  verifiedByTwilio?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onNameChange?: (val: string) => void;
};

export default function StoreHeader({
  image,
  address,
  kioskUrl,
  qrImageUrl,
  showQrBadge,
  edit,
  saving,
  name,
  type,
  provider,
  active,
  verifiedByTwilio,
  onEdit,
  onSave,
  onCancel,
  onNameChange,
}: Props) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const searchParams = useSearchParams();
  const [qrOpen, setQrOpen] = React.useState(false);

  // Extraer slug de la URL del kiosko (?slug=...)
  const extractSlug = (url?: string) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      return u.searchParams.get('slug') ?? undefined;
    } catch {
      return undefined;
    }
  };
  const slug = extractSlug(kioskUrl);

  // Construir href con slug
  const qrHref = slug
    ? `https://sweepstakes.tech-touch.com/?slug=${encodeURIComponent(slug)}`
    : undefined;

  // Fallback si no hay imagen del backend (usa servicio público para generar QR)
  const fallbackQrSrc = qrHref
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrHref)}&size=512x512`
    : undefined;

  // Mostrar el QR solo en la pestaña General Info
  const inferredShow = (searchParams.get('tag') || '').toLowerCase() === 'general-info';
  const shouldShowQr = typeof showQrBadge === 'boolean' ? showQrBadge : inferredShow;

  const tier = getTierColor(type);
  const providerChip = getProviderChip(provider);

  const iconBg = 'rgba(0,0,0,0.06)';
  const iconBgHover = 'rgba(0,0,0,0.12)';

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        background: tier.bg,
        color: tier.text,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 1.5, md: 2 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ minWidth: 0 }}>
        <Avatar
          src={image}
          alt={name}
          sx={{
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            border: '2px solid rgba(255,255,255,0.7)',
            flex: '0 0 auto',
          }}
        />

        <Box
          sx={{ flex: 1, minWidth: 0 }}>
          {edit ? (
            <TextField
              size="small"
              fullWidth
              value={name}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Nombre de la tienda"
              inputProps={{ style: { fontWeight: 800 } }}
            />
          ) : (
            <Typography
              variant={mdUp ? 'h6' : 'subtitle1'}
              sx={{
                fontWeight: 800,
                letterSpacing: 0.2,
                lineHeight: 1.1
              }}
              noWrap
              title={name}>
              {name}
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              mt: 1,
              flexWrap: 'wrap'
            }}>
            <Chip
              size="small"
              icon={<StoreMallDirectoryIcon />}
              label={type?.toUpperCase?.() ?? ''} />
            <Chip
              size="small"
              color={providerChip.color}
              icon={providerChip.icon}
              label={provider === 'twilio' ? 'Twilio' : 'Bandwidth'} />
            {active ? (
              <Chip
                size="small"
                color="success"
                icon={<VerifiedIcon />}
                label="Activa"
                sx={{ color: '#fff' }} />
            ) : (
              <Chip
                size="small"
                color="warning"
                label="Inactiva" />
            )}
            {verifiedByTwilio &&
              <Chip
                size="small"
                icon={<ShieldIcon />}
                label="Verificada" />}
          </Stack>
        </Box>

        {/* Acciones (Desktop) */}
        {mdUp && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flex: '0 0 auto',
              alignItems: 'center'
            }}>
            {!edit ? (
              <>
                <Tooltip title="Editar">
                  <IconButton
                    sx={{
                      bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover }
                    }}
                    onClick={onEdit}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar en Google Maps">
                  <IconButton
                    sx={{
                      bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover }
                    }}
                    onClick={() => {
                      const addr = encodeURIComponent(address || '');
                      window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
                    }}
                  >
                    <EditLocationAltIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Abrir Kiosko">
                  <IconButton
                    sx={{
                      bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover }
                    }}
                    onClick={() => window.open(kioskUrl, '_blank')}>
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title="Imupulsar Tienda">
                  <Link
                    href={`/admin/management/work-stores?q=${encodeURIComponent(
                      name
                    )}`}
                    passHref
                  >
                    <IconButton color="primary">
                      <RocketLaunch fontSize="small" />
                    </IconButton>
                  </Link>
                </Tooltip>
                {/* QR badge → abre modal */}
                {shouldShowQr && qrHref && (
                  <Box
                    role="button"
                    onClick={() => setQrOpen(true)}
                    aria-label="Ver QR en grande"
                    sx={{
                      ml: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 120ms ease, box-shadow 120ms ease',
                      boxShadow: 0,
                      '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 },
                    }}
                  >
                    {qrImageUrl || fallbackQrSrc ? (
                      <Box
                        component="img"
                        src={qrImageUrl || fallbackQrSrc}
                        alt="QR"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10, color: 'text.secondary'
                        }}>
                        QR
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <>
                <Tooltip title="Cancelar">
                  <span>
                    <IconButton
                      sx={{
                        bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover }
                      }}
                      onClick={onCancel}
                      disabled={saving}>
                      <CloseIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Guardar cambios">
                  <span>
                    <IconButton sx={{
                      bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover }
                    }}
                      onClick={onSave}
                      disabled={saving}>
                      <SaveIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* QR badge (edit mode también) */}
                {shouldShowQr && qrHref && (
                  <Box
                    role="button"
                    onClick={() => setQrOpen(true)}
                    aria-label="Ver QR en grande"
                    sx={{
                      ml: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 120ms ease, box-shadow 120ms ease',
                      boxShadow: 0,
                      '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 },
                    }}
                  >
                    {qrImageUrl || fallbackQrSrc ? (
                      <Box
                        component="img"
                        src={qrImageUrl || fallbackQrSrc}
                        alt="QR"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10,
                          color: 'text.secondary'
                        }}>
                        QR
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
          </Stack>
        )}
      </Stack>

      {/* Acciones (Mobile) */}
      {!mdUp && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 1,
            flexWrap: 'nowrap',         // queremos una sola fila
            overflowX: 'auto',          // si no caben, scroll horizontal
            whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' },
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Editar */}
          <Tooltip title="Editar">
            <IconButton
              sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
              onClick={onEdit}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          {/* Editar en Google Maps */}
          <Tooltip title="Editar en Google Maps">
            <IconButton
              sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
              onClick={() => {
                const addr = encodeURIComponent(address || '');
                window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
              }}
            >
              <EditLocationAltIcon />
            </IconButton>
          </Tooltip>

          {/* Abrir Kiosko */}
          <Tooltip title="Abrir Kiosko">
            <IconButton
              sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
              onClick={() => window.open(kioskUrl, '_blank')}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>

          {/* QR badge → abre modal */}
          {shouldShowQr && qrHref && (
            <Box
              role="button"
              onClick={() => setQrOpen(true)}
              aria-label="Ver QR en grande"
              sx={{
                ml: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              {qrImageUrl || fallbackQrSrc ? (
                <Box
                  component="img"
                  src={qrImageUrl || fallbackQrSrc}
                  alt="QR"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Typography variant="caption">QR</Typography>
              )}
            </Box>
          )}
        </Stack>
      )}

      {/* Modal con QR grande */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="xs"
        fullWidth>
        <DialogTitle>QR del sorteo</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'grid',
            placeItems: 'center'
          }}>
          {qrImageUrl || fallbackQrSrc ? (
            <Box
              component="img"
              src={qrImageUrl || fallbackQrSrc}
              alt="QR sorteo"
              sx={{
                width: '100%',
                maxWidth: 420,
                height: 'auto'
              }}
            />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary">
              No hay imagen de QR disponible.
            </Typography>
          )}
          {qrHref && (
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                wordBreak: 'break-all',
                textAlign: 'center'
              }}>
              Enlace:{' '}
              <MuiLink
                href={qrHref}
                target="_blank"
                rel="noopener noreferrer">
                {qrHref}
              </MuiLink>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {qrHref && (
            <Button
              onClick={() => window.open(qrHref, '_blank')}
              variant="contained">
              Abrir enlace
            </Button>
          )}
          <Button
            onClick={() => setQrOpen(false)}
            color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {!mdUp && <Divider sx={{ my: 1 }} />}
    </Box>
  );
}
