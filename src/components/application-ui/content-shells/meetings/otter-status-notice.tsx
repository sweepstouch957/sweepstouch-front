import type { OtterStatus } from '@/services/otter.service';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { alpha, Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import { tint } from 'src/theme/semantic';
import { fallbackStatusCopy, STATUS_COPY } from './constants';

interface Props {
  status?: OtterStatus;
  onRetry: () => void;
  retrying?: boolean;
}

/**
 * Estado vacío cuando la integración no responde. Es la pantalla que más se ve
 * hasta que Otter habilite el Public API en la cuenta, así que dice exactamente
 * qué hay que hacer en vez de un "error" genérico.
 */
export const OtterStatusNotice: React.FC<Props> = ({ status, onRetry, retrying }) => {
  const theme = useTheme();
  const copy = (status?.code && STATUS_COPY[status.code]) || fallbackStatusCopy(status);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: 2,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: alpha(theme.palette.warning.main, 0.4),
        bgcolor: tint(theme, 'warning', theme.palette.mode === 'dark' ? 0.08 : 0.04),
      }}
    >
      <Stack
        spacing={2}
        alignItems="center"
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.warning.main, 0.15),
            color: 'warning.main',
          }}
        >
          <CloudOffRoundedIcon fontSize="large" />
        </Box>

        <Typography
          variant="h5"
          fontWeight={800}
        >
          {copy.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 560 }}
        >
          {copy.detail}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
        >
          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={onRetry}
            disabled={retrying}
          >
            Reintentar
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            endIcon={<OpenInNewRoundedIcon />}
            href="https://otter.ai/integrations"
            target="_blank"
            rel="noopener"
          >
            Abrir Otter
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
