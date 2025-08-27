// src/components/stores/StoreHeader.tsx
'use client';

import { Store } from '@/services/store.service';
import { getProviderChip, getTierColor } from '@/utils/ui/store.page';
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
} from '@mui/material';

type Props = {
  image?: string;
  address: string;
  kioskUrl: string;
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
  const tier = getTierColor(type);
  const providerChip = getProviderChip(provider);

  const iconBg = 'rgba(255,255,255,0.18)';
  const iconBgHover = 'rgba(255,255,255,0.28)';

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
      {/* Top row (avatar + title + chips) */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ minWidth: 0 }}
      >
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

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {edit ? (
            <TextField
              size="small"
              fullWidth
              value={name}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Nombre de la tienda"
              inputProps={{ style: { fontWeight: 800 } }}
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: tier.text,
                  borderRadius: 2,
                  backdropFilter: 'blur(4px)',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.75)',
                },
              }}
            />
          ) : (
            <Typography
              variant={mdUp ? 'h6' : 'subtitle1'}
              sx={{ fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.1 }}
              noWrap
              title={name}
            >
              {name}
            </Typography>
          )}

          {/* Chip rail (scrollable on mobile) */}
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              mt: 1,
              flexWrap: { xs: 'nowrap', sm: 'wrap' },
              overflowX: { xs: 'auto', sm: 'visible' },
              pb: { xs: 0.5, sm: 0 },
              // Ocultar scrollbar en mobile
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            <Chip
              size="small"
              icon={<StoreMallDirectoryIcon />}
              label={type.toUpperCase()}
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: tier.text,
                fontWeight: 700,
                '& .MuiChip-icon': { color: tier.text },
              }}
            />
            <Chip
              size="small"
              color={providerChip.color}
              icon={providerChip.icon}
              label={provider === 'twilio' ? 'Twilio' : 'Bandwidth'}
              sx={{
                color: providerChip.color === 'secondary' ? '#fff' : undefined,
              }}
            />
            {active ? (
              <Chip
                size="small"
                color="success"
                icon={<VerifiedIcon />}
                label="Activa"
                sx={{ color: '#fff' }}
              />
            ) : (
              <Chip
                size="small"
                color="warning"
                label="Inactiva"
              />
            )}
            {verifiedByTwilio && (
              <Chip
                size="small"
                icon={<ShieldIcon />}
                label="Verificada"
                sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: tier.text }}
              />
            )}
          </Stack>
        </Box>

        {/* Action buttons (desktop right) */}
        {mdUp && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ flex: '0 0 auto' }}
          >
            {!edit ? (
              <>
                <Tooltip title="Editar">
                  <IconButton
                    onClick={onEdit}
                    sx={{
                      bgcolor: iconBg,
                      '&:hover': { bgcolor: iconBgHover },
                    }}
                  >
                    <EditIcon htmlColor={tier.text} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar en Google Maps">
                  <IconButton
                    onClick={() => {
                      const addr = encodeURIComponent(address || '');
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${addr}`,
                        '_blank'
                      );
                    }}
                    sx={{
                      bgcolor: iconBg,
                      '&:hover': { bgcolor: iconBgHover },
                    }}
                  >
                    <EditLocationAltIcon htmlColor={tier.text} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Abrir Kiosko">
                  <IconButton
                    onClick={() => window.open(kioskUrl, '_blank')}
                    sx={{
                      bgcolor: iconBg,
                      '&:hover': { bgcolor: iconBgHover },
                    }}
                  >
                    <OpenInNewIcon htmlColor={tier.text} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="Cancelar">
                  <span>
                    <IconButton
                      onClick={onCancel}
                      disabled={saving}
                      sx={{
                        bgcolor: iconBg,
                        '&:hover': { bgcolor: iconBgHover },
                      }}
                    >
                      <CloseIcon htmlColor={tier.text} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Guardar cambios">
                  <span>
                    <IconButton
                      onClick={onSave}
                      disabled={saving}
                      sx={{
                        bgcolor: iconBg,
                        '&:hover': { bgcolor: iconBgHover },
                      }}
                    >
                      <SaveIcon htmlColor={tier.text} />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Stack>
        )}
      </Stack>

      {/* Divider solo en mobile para separar la action bar */}
      {!mdUp && <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.25)' }} />}

      {/* Action bar (mobile bottom) */}
      {!mdUp && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'flex-end' }}
        >
          {!edit ? (
            <>
              <Tooltip title="Editar">
                <IconButton
                  onClick={onEdit}
                  sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
                >
                  <EditIcon htmlColor={tier.text} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Maps">
                <IconButton
                  onClick={() => {
                    const addr = encodeURIComponent(address || '');
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${addr}`,
                      '_blank'
                    );
                  }}
                  sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
                >
                  <EditLocationAltIcon htmlColor={tier.text} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Kiosko">
                <IconButton
                  onClick={() => window.open(kioskUrl, '_blank')}
                  sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
                >
                  <OpenInNewIcon htmlColor={tier.text} />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Cancelar">
                <span>
                  <IconButton
                    onClick={onCancel}
                    disabled={saving}
                    sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
                  >
                    <CloseIcon htmlColor={tier.text} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Guardar">
                <span>
                  <IconButton
                    onClick={onSave}
                    disabled={saving}
                    sx={{ bgcolor: iconBg, '&:hover': { bgcolor: iconBgHover } }}
                  >
                    <SaveIcon htmlColor={tier.text} />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
}
