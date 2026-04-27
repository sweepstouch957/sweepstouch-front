'use client';

import { Store } from '@/services/store.service';
import { getProviderChip } from '@/utils/ui/store.page';
import {
  CloseRounded,
  EditLocationAltRounded,
  EditRounded,
  OpenInNewRounded,
  QrCodeRounded,
  RocketLaunch,
  SaveRounded,
  ShieldRounded,
  StoreMallDirectoryRounded,
  VerifiedRounded,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';


/* ── small icon action button ────────────────────────────── */
function IBtn({
  title,
  onClick,
  href,
  disabled,
  tint,
  children,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  tint?: string;
}) {
  const theme = useTheme();
  const btn = (
    <Tooltip title={title} arrow placement="bottom">
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            width: 34, height: 34,
            borderRadius: 1.5,
            bgcolor: tint
              ? alpha(tint, theme.palette.mode === 'dark' ? 0.18 : 0.1)
              : theme.palette.mode === 'dark' ? alpha('#fff', 0.07) : alpha('#000', 0.05),
            color: tint || 'text.secondary',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: tint
                ? alpha(tint, theme.palette.mode === 'dark' ? 0.3 : 0.18)
                : theme.palette.mode === 'dark' ? alpha('#fff', 0.13) : alpha('#000', 0.1),
              transform: 'translateY(-1px)',
              boxShadow: tint ? `0 3px 10px ${alpha(tint, 0.3)}` : 1,
            },
            '&.Mui-disabled': { opacity: 0.35 },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>{btn}</Link>;
  return btn;
}

/* ── props ───────────────────────────────────────────────── */
type Props = {
  image?: string;
  address: string;
  kioskUrl: string;
  qrImageUrl?: string;
  showQrBadge?: boolean;
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
  image, address, kioskUrl, qrImageUrl, showQrBadge,
  edit, saving, name, type, provider, active, verifiedByTwilio,
  onEdit, onSave, onCancel, onNameChange,
}: Props) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const searchParams = useSearchParams();
  const [qrOpen, setQrOpen] = React.useState(false);
  const isDark = theme.palette.mode === 'dark';

  const extractSlug = (url?: string) => {
    try { return new URL(url || '').searchParams.get('slug') ?? undefined; } catch { return undefined; }
  };
  const slug = extractSlug(kioskUrl);
  const qrHref = slug ? `https://st.sweepstouch.com/?slug=${encodeURIComponent(slug)}` : undefined;
  const fallbackQrSrc = qrHref
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrHref)}&size=512x512`
    : undefined;

  const inferredShow = (searchParams.get('tag') || '').toLowerCase() === 'general-info';
  const shouldShowQr = typeof showQrBadge === 'boolean' ? showQrBadge : inferredShow;

  const TIERS: Record<Store['type'], { accent: string; label: string; gradient: string }> = {
    elite: {
      accent: theme.palette.primary.main,
      label: 'Elite',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    },
    basic: {
      accent: theme.palette.info.main,
      label: 'Basic',
      gradient: `linear-gradient(135deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
    },
    free: {
      accent: theme.palette.text.secondary,
      label: 'Free',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.text.secondary, 0.85)}, ${alpha(theme.palette.text.secondary, 0.6)})`,
    },
  };
  const tier = TIERS[type] ?? TIERS.free;
  const providerChip = getProviderChip(provider);

  /* Don't duplicate address if name already contains it */
  const showAddress = address && !name.toLowerCase().includes(address.toLowerCase().slice(0, 20));

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, md: 2.5 },
          pt: { xs: 1.75, md: 2 },
          pb: { xs: 1.5, md: 1.75 },
          background: isDark
            ? `linear-gradient(135deg, ${alpha(tier.accent, 0.2)} 0%, ${alpha(tier.accent, 0.06)} 100%)`
            : `linear-gradient(135deg, ${alpha(tier.accent, 0.09)} 0%, ${alpha(tier.accent, 0.03)} 100%)`,
          borderBottom: `1px solid ${alpha(tier.accent, 0.18)}`,
        }}
      >
        {/* Top accent bar */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tier.gradient }} />

        {/* Glow blob */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: alpha(tier.accent, 0.08), filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* ── Layout ── */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={{ xs: 1.5, md: 2 }}
          flexWrap={{ xs: 'wrap', md: 'nowrap' }}
        >

          {/* Avatar */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={image}
              alt={name}
              sx={{
                width: { xs: 50, md: 58 },
                height: { xs: 50, md: 58 },
                border: `2.5px solid ${alpha(tier.accent, 0.45)}`,
                boxShadow: `0 0 0 1px ${alpha(tier.accent, 0.12)}, 0 4px 14px ${alpha(tier.accent, 0.22)}`,
                bgcolor: alpha(tier.accent, 0.15),
              }}
            >
              <StoreMallDirectoryRounded sx={{ fontSize: 26, color: tier.accent }} />
            </Avatar>
            {/* Online dot */}
            <Box sx={{
              position: 'absolute', bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: '50%',
              bgcolor: active ? '#22c55e' : '#f59e0b',
              border: `2px solid ${theme.palette.background.paper}`,
              boxShadow: `0 0 6px ${active ? alpha('#22c55e', 0.7) : alpha('#f59e0b', 0.7)}`,
            }} />
          </Box>

          {/* Name + chips */}
          <Box flex={1} minWidth={0}>
            {edit ? (
              <TextField
                size="small"
                fullWidth
                value={name}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder="Nombre de la tienda"
                sx={{ mb: 0.75, maxWidth: 420 }}
                inputProps={{ style: { fontWeight: 700, fontSize: 14 } }}
              />
            ) : (
              <Typography
                variant="subtitle1"
                fontWeight={800}
                lineHeight={1.25}
                sx={{
                  letterSpacing: 0.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: '100%', md: 520 },
                }}
                title={name}
              >
                {name}
              </Typography>
            )}

            {showAddress && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mb: 0.5, fontSize: 11 }}
                noWrap
              >
                {address}
              </Typography>
            )}

            {/* Status chips */}
            <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" mt={showAddress ? 0.25 : 0.5}>
              <Chip
                size="small"
                label={tier.label.toUpperCase()}
                sx={{
                  height: 19, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  background: tier.gradient, color: '#fff',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
              <Chip
                size="small"
                color={providerChip.color}
                icon={React.cloneElement(providerChip.icon as React.ReactElement, { style: { fontSize: 11 } })}
                label={providerChip.label}
                sx={{ height: 19, fontSize: 10, fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }}
              />
              <Chip
                size="small"
                color={active ? 'success' : 'warning'}
                icon={active ? <VerifiedRounded style={{ fontSize: 11 }} /> : undefined}
                label={active ? 'Activa' : 'Inactiva'}
                sx={{ height: 19, fontSize: 10, fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }}
              />
              {verifiedByTwilio && (
                <Chip
                  size="small"
                  color="info"
                  icon={<ShieldRounded style={{ fontSize: 11 }} />}
                  label="Verificada"
                  sx={{ height: 19, fontSize: 10, fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }}
                />
              )}
            </Stack>
          </Box>

          {/* ── Actions ─────────────────────────────────── */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            flexShrink={0}
            sx={{
              /* on xs: full-width row below avatar+name */
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-end', md: 'flex-end' },
              mt: { xs: 0.5, md: 0 },
            }}
          >
            {!edit ? (
              <>
                <IBtn title="Editar" onClick={onEdit} tint={tier.accent}>
                  <EditRounded sx={{ fontSize: 17 }} />
                </IBtn>

                <IBtn
                  title="Ver en Google Maps"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`, '_blank')}
                >
                  <EditLocationAltRounded sx={{ fontSize: 17 }} />
                </IBtn>

                <IBtn
                  title="Abrir Kiosko"
                  onClick={() => window.open(kioskUrl, '_blank')}
                >
                  <OpenInNewRounded sx={{ fontSize: 17 }} />
                </IBtn>

                <IBtn
                  title="Impulsar tienda"
                  href={`/admin/management/work-stores?q=${encodeURIComponent(name)}`}
                  tint={tier.accent}
                >
                  <RocketLaunch sx={{ fontSize: 17 }} />
                </IBtn>

                {/* Vertical divider */}
                {shouldShowQr && qrHref && (
                  <Box sx={{ width: '1px', height: 22, bgcolor: alpha(tier.accent, 0.25), mx: 0.25 }} />
                )}

                {/* QR thumbnail */}
                {shouldShowQr && qrHref && (
                  <Tooltip title="Ver QR" arrow>
                    <Box
                      role="button"
                      aria-label="Ver QR"
                      onClick={() => setQrOpen(true)}
                      sx={{
                        width: 34, height: 34,
                        borderRadius: 1.5,
                        border: `1.5px solid ${alpha(tier.accent, 0.35)}`,
                        bgcolor: isDark ? alpha('#fff', 0.06) : 'white',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          transform: 'translateY(-1px) scale(1.06)',
                          boxShadow: `0 3px 12px ${alpha(tier.accent, 0.35)}`,
                        },
                      }}
                    >
                      {qrImageUrl || fallbackQrSrc
                        ? <Box component="img" src={qrImageUrl || fallbackQrSrc} alt="QR" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <QrCodeRounded sx={{ fontSize: 18, color: tier.accent }} />
                      }
                    </Box>
                  </Tooltip>
                )}
              </>
            ) : (
              /* Edit mode buttons */
              <>
                <Tooltip title="Cancelar" arrow>
                  <span>
                    <IconButton
                      size="small"
                      onClick={onCancel}
                      disabled={saving}
                      sx={{
                        width: 34, height: 34, borderRadius: 1.5,
                        bgcolor: alpha('#ef4444', isDark ? 0.2 : 0.1),
                        color: 'error.main',
                        '&:hover': { bgcolor: alpha('#ef4444', isDark ? 0.32 : 0.18), transform: 'translateY(-1px)' },
                      }}
                    >
                      <CloseRounded sx={{ fontSize: 17 }} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Guardar cambios" arrow>
                  <span>
                    <IconButton
                      size="small"
                      onClick={onSave}
                      disabled={saving}
                      sx={{
                        width: 34, height: 34, borderRadius: 1.5,
                        bgcolor: alpha('#22c55e', isDark ? 0.2 : 0.1),
                        color: 'success.main',
                        '&:hover': { bgcolor: alpha('#22c55e', isDark ? 0.32 : 0.18), transform: 'translateY(-1px)' },
                      }}
                    >
                      {saving
                        ? <CircularProgress size={15} color="inherit" />
                        : <SaveRounded sx={{ fontSize: 17 }} />
                      }
                    </IconButton>
                  </span>
                </Tooltip>

                {shouldShowQr && qrHref && (
                  <>
                    <Box sx={{ width: '1px', height: 22, bgcolor: alpha(tier.accent, 0.25), mx: 0.25 }} />
                    <Tooltip title="Ver QR" arrow>
                      <Box
                        role="button"
                        onClick={() => setQrOpen(true)}
                        sx={{
                          width: 34, height: 34, borderRadius: 1.5,
                          border: `1.5px solid ${alpha(tier.accent, 0.35)}`,
                          bgcolor: isDark ? alpha('#fff', 0.06) : 'white',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          '&:hover': { transform: 'scale(1.06)', boxShadow: `0 3px 10px ${alpha(tier.accent, 0.3)}` },
                        }}
                      >
                        {qrImageUrl || fallbackQrSrc
                          ? <Box component="img" src={qrImageUrl || fallbackQrSrc} alt="QR" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <QrCodeRounded sx={{ fontSize: 18, color: tier.accent }} />
                        }
                      </Box>
                    </Tooltip>
                  </>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* ── QR Dialog ────────────────────────────────────── */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ height: 3, background: tier.gradient }} />
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <QrCodeRounded sx={{ color: tier.accent, fontSize: 20 }} />
          <Typography fontWeight={700}>QR del sorteo</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', placeItems: 'center', p: 3 }}>
          {qrImageUrl || fallbackQrSrc ? (
            <Box
              component="img"
              src={qrImageUrl || fallbackQrSrc}
              alt="QR sorteo"
              sx={{
                width: '100%', maxWidth: 300, height: 'auto',
                borderRadius: 2,
                boxShadow: `0 0 0 3px ${alpha(tier.accent, 0.2)}, 0 8px 28px ${alpha(tier.accent, 0.15)}`,
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">Sin imagen de QR.</Typography>
          )}
          {qrHref && (
            <Typography variant="caption" sx={{ mt: 2, textAlign: 'center', wordBreak: 'break-all', color: 'text.secondary' }}>
              <MuiLink href={qrHref} target="_blank" rel="noopener noreferrer" sx={{ color: tier.accent }}>
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
              sx={{ borderRadius: 2, textTransform: 'none', background: tier.gradient, boxShadow: 'none' }}
            >
              Abrir enlace
            </Button>
          )}
          <Button onClick={() => setQrOpen(false)} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
