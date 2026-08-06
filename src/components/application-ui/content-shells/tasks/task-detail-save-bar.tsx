'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

/**
 * Barra de guardado. Sólo existe cuando hay cambios sin guardar: una barra fija
 * permanente se vuelve parte del decorado y deja de avisar nada.
 */
export function TaskSaveBar({
  saving,
  onDiscard,
  onSave,
}: {
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        p: { xs: 1.5, md: 2 },
        pb: 'calc(env(safe-area-inset-bottom) + 12px)',
        bgcolor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(12px)',
        borderTop: `2px solid ${theme.palette.warning.main}`,
        '@keyframes slideUp': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        animation: 'slideUp .24s cubic-bezier(.2,.8,.2,1)',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              flexShrink: 0,
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flex: 1, display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}
          >
            Tenés cambios sin guardar
          </Typography>
          <Button
            onClick={onDiscard}
            startIcon={<CloseRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              height: 46,
              borderRadius: 2.5,
              textTransform: 'none',
              flex: { xs: 1, sm: 'none' },
            }}
          >
            Descartar
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={saving}
            onClick={onSave}
            startIcon={
              saving ? (
                <CircularProgress
                  size={15}
                  color="inherit"
                />
              ) : (
                <CheckCircleRoundedIcon sx={{ fontSize: 17 }} />
              )
            }
            sx={{
              height: 46,
              px: 3,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 800,
              flex: { xs: 1, sm: 'none' },
            }}
          >
            Guardar
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
