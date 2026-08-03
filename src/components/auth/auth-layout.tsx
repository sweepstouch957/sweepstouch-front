import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import { alpha, Box, Button, darken, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from 'src/components/base/logo';
import { routes } from 'src/router/routes';
import { AuthStrategy } from 'src/utils/auth/strategy';
import { RouterLink } from '../base/router-link';

interface AuthLayoutProps {
  children: React.ReactNode;
  strategy?: keyof typeof AuthStrategy;
}

export function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Grid
      container
      sx={{ minHeight: '100vh' }}
    >
      {/* Panel de marca — oculto en móvil */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          alignItems: 'center',
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.common.black} 0%, ${darken(theme.palette.primary.dark, 0.45)} 55%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        {/* Glow de marca */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: (theme) =>
              `radial-gradient(60% 60% at 15% 20%, ${alpha(theme.palette.primary.main, 0.45)} 0%, transparent 70%)`,
          }}
        />

        <Stack
          spacing={3}
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { md: 6, xl: 10 },
            py: 8,
            maxWidth: 560,
          }}
        >
          <Box sx={{ '& > *': { transform: 'scale(1.2)', transformOrigin: 'left center' } }}>
            <Logo
              dark
              isLinkStatic
            />
          </Box>

          <Box>
            <Typography
              variant="h1"
              color="common.white"
              gutterBottom
            >
              Sweepstouch Admin
            </Typography>
            <Typography
              variant="h5"
              fontWeight={400}
              sx={{ color: (theme) => alpha(theme.palette.common.white, 0.75) }}
            >
              {t('The best way to manage your application')}
            </Typography>
          </Box>

          <Box>
            <Button
              component={RouterLink}
              href={routes.index}
              variant="contained"
              color="primary"
              startIcon={<KeyboardBackspaceRoundedIcon />}
            >
              {t('Go back')}
            </Button>
          </Box>
        </Stack>
      </Grid>

      {/* Panel del formulario */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          px: { xs: 2, sm: 4 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>{children}</Box>
      </Grid>
    </Grid>
  );
}
