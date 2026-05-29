'use client';

import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import type { FC } from 'react';

interface Props {
  storeName?: string;
  tag: string;
  action: string | null;
  storeActive?: boolean;
  onBack: () => void;
  onCreateCampaign: () => void;
  onQuickOpen: () => void;
  onMMSNavigate: () => void;
}

export const StoreManagementHeader: FC<Props> = ({
  storeName,
  tag,
  action,
  storeActive,
  onBack,
  onCreateCampaign,
  onQuickOpen,
  onMMSNavigate,
}) => {
  const theme = useTheme();

  return (
    <Box
      px={{ xs: 2, md: 4 }}
      py={2.5}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={2}
      sx={{
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        mb: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
        <IconButton
          onClick={onBack}
          size="small"
          color="primary"
          aria-label="Volver a tiendas"
          sx={{
            border: (t) => `1px solid ${t.palette.divider}`,
            borderRadius: 1.5,
            flexShrink: 0,
          }}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>

        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
            '& .MuiBreadcrumbs-li': {
              overflow: 'hidden',
              maxWidth: { xs: 100, sm: 180, md: 'none' },
            },
          }}
        >
          <Typography color="text.secondary" variant="body2" noWrap>
            Tiendas
          </Typography>
          <Typography
            color="text.primary"
            variant="body2"
            fontWeight={500}
            noWrap
            sx={{ maxWidth: { xs: 120, sm: 220, md: 400 } }}
          >
            {storeName}
          </Typography>
          <Typography
            color="primary"
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ textTransform: 'capitalize' }}
          >
            {tag}
          </Typography>
          {action && (
            <Typography color="text.primary" variant="body2" noWrap>
              {action}
            </Typography>
          )}
        </Breadcrumbs>
      </Stack>

      {tag === 'campaigns' && (
        <Stack direction="row" spacing={1.5} flexShrink={0}>
          {action === 'create' ? (
            <Button
              variant="contained"
              color="secondary"
              onClick={onBack}
              size="small"
            >
              Ver campañas
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FlashOnRoundedIcon fontSize="small" />}
                onClick={onQuickOpen}
                aria-label="Crear campaña rápida"
                sx={{
                  opacity: storeActive ? 1 : 0.5,
                  borderStyle: 'dashed',
                  px: 2,
                }}
              >
                Quick
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<MailOutlineRoundedIcon fontSize="small" />}
                onClick={onMMSNavigate}
                disabled={!storeActive}
                aria-label="Ir a MMS"
                sx={{
                  px: 2,
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    bgcolor: alpha(theme.palette.error.main, 0.04),
                  },
                }}
              >
                MMS
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddCircleOutlineRoundedIcon fontSize="small" />}
                onClick={onCreateCampaign}
                disabled={!storeActive}
                aria-label="Crear nueva campaña"
                sx={{ px: 2 }}
              >
                Crear campaña
              </Button>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};
