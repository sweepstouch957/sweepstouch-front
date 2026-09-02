'use client';

import { useStoreById } from '@/hooks/fetching/stores/useStoreById';
import { shortLinkService } from '@/services/short-link.service';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import toast from 'react-hot-toast';

/**
 * El link corto permanente de esta tienda: `swtrcs.com/s/XXXXXX` → su linktree.
 *
 * Es el mismo que resuelve `#linktreeShort` en una campaña, así que acá se ve
 * exactamente lo que le va a llegar al cliente por SMS — y cuántos clicks lleva.
 * Se crea solo la primera vez que se abre esta pantalla y no cambia nunca más.
 */
export function LinktreeShortCard({ storeId }: { storeId: string }) {
  const theme = useTheme();
  const { data: store } = useStoreById(storeId);
  const slug = (store as any)?.slug as string | undefined;

  const { data, isPending, isError } = useQuery({
    queryKey: ['linktree-short-link', slug],
    queryFn: () => shortLinkService.forStore(slug as string),
    enabled: !!slug,
    staleTime: Infinity,
    retry: false,
  });

  const copy = async () => {
    if (!data?.shortUrl) return;
    await navigator.clipboard.writeText(data.shortUrl);
    toast.success('Link copiado');
  };

  if (store && !slug) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
        Esta tienda no tiene <b>slug</b>, así que todavía no tiene linktree ni link corto.
      </Alert>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 2.5,
        mb: 3,
        borderColor: alpha(theme.palette.primary.main, 0.25),
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <LinkRounded />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              textTransform="uppercase"
              letterSpacing={0.6}
            >
              Link corto del linktree
            </Typography>

            {isPending ? (
              <Skeleton variant="text" width={220} height={28} />
            ) : isError ? (
              <Typography variant="body2" color="error">
                No se pudo obtener el link
              </Typography>
            ) : (
              <Typography variant="h6" fontWeight={700} fontFamily="monospace" noWrap>
                {data?.shortUrl.replace(/^https?:\/\//, '')}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" noWrap component="div" title={data?.target}>
              {data?.target || `El destino es el linktree de ${(store as any)?.name || 'la tienda'}`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          <Chip
            size="small"
            icon={<TrendingUpRounded />}
            label={`${(data?.hits ?? 0).toLocaleString()} clicks`}
            sx={{ fontWeight: 600 }}
          />
          <Tooltip title="Copiar link">
            <span>
              <IconButton onClick={copy} disabled={!data?.shortUrl}>
                <ContentCopyRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Abrir">
            <span>
              <IconButton
                href={data?.shortUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!data?.shortUrl}
              >
                <OpenInNewRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Es el mismo que reemplaza <code>#linktreeShort</code> en una campaña: no cambia nunca, así
        que sirve impreso y en el perfil de redes.
      </Typography>
    </Paper>
  );
}
