'use client';

import { useStores } from '@/hooks/fetching/stores/useStores';
import { shortLinkService, type LinktreeShortLink } from '@/services/short-link.service';
import AutoFixHighRounded from '@mui/icons-material/AutoFixHighRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useDeferredValue, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Links cortos del linktree — uno por tienda, permanente.
 *
 * `swtrcs.com/s/XXXXXX` → `links.sweepstouch.com/?slug=<slug>`. Es el link que
 * se manda por WhatsApp, se pega en el perfil de Instagram y se imprime; como
 * el destino depende sólo del slug, no cambia nunca y los clicks se acumulan
 * sobre el mismo código.
 */
export default function ShortLinks(): React.JSX.Element {
  const theme = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ['linktree-short-links'],
    queryFn: shortLinkService.list,
    staleTime: 1000 * 60,
  });

  // Sólo para poner el nombre de la tienda al lado del slug: el link guarda el
  // slug, que es lo estable, pero nadie reconoce una tienda por su slug.
  const { data: stores } = useStores();
  const nameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    (stores || []).forEach((s: any) => {
      if (s?.slug) map.set(String(s.slug).toLowerCase(), s.name || '');
    });
    return map;
  }, [stores]);

  const links = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const all = data?.links ?? [];
    if (!q) return all;
    return all.filter(
      (l) =>
        l.storeSlug?.includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (nameBySlug.get(l.storeSlug) || '').toLowerCase().includes(q)
    );
  }, [data, deferredSearch, nameBySlug]);

  const backfill = useMutation({
    mutationFn: shortLinkService.backfill,
    onSuccess: (res) => {
      toast.success(
        res.created > 0
          ? `${res.created} link${res.created === 1 ? '' : 's'} nuevo${res.created === 1 ? '' : 's'}`
          : 'Todas las tiendas ya tenían su link'
      );
      qc.invalidateQueries({ queryKey: ['linktree-short-links'] });
    },
    onError: () => toast.error('No se pudieron generar los links'),
  });

  const copy = async (link: LinktreeShortLink) => {
    await navigator.clipboard.writeText(link.shortUrl);
    toast.success('Link copiado');
  };

  const missing = Math.max(0, nameBySlug.size - (data?.count ?? 0));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* ── Resumen + acciones ── */}
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              size="small"
              placeholder="Buscar tienda, slug o código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Tooltip title="Refrescar">
              <span>
                <IconButton onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? <CircularProgress size={20} /> : <RefreshRounded />}
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={backfill.isPending ? <CircularProgress size={16} /> : <AutoFixHighRounded />}
              onClick={() => backfill.mutate()}
              disabled={backfill.isPending}
              sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
            >
              Generar los que falten
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`${data?.count ?? 0} links`} sx={{ fontWeight: 600 }} />
            <Chip
              size="small"
              label={`${(data?.totalClicks ?? 0).toLocaleString()} clicks`}
              sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.main' }}
            />
            {missing > 0 ? (
              <Chip
                size="small"
                label={`${missing} tienda${missing === 1 ? '' : 's'} sin link`}
                sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.warning.main, 0.14), color: 'warning.main' }}
              />
            ) : null}
          </Stack>
        </Card>

        {/* ── Tabla ── */}
        {isError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            No se pudieron cargar los links.
          </Alert>
        ) : isPending ? (
          <Stack spacing={1}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : !links.length ? (
          <Card sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
            <LinkRounded sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
              {data?.count ? 'Sin coincidencias' : 'Todavía no hay links'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data?.count
                ? 'Probá con otro nombre, slug o código.'
                : 'Generá el link de cada tienda activa de una sola vez.'}
            </Typography>
            {!data?.count ? (
              <Button
                variant="contained"
                startIcon={<AutoFixHighRounded />}
                onClick={() => backfill.mutate()}
                disabled={backfill.isPending}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Generar los links
              </Button>
            ) : null}
          </Card>
        ) : (
          <Card sx={{ borderRadius: 3, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tienda</TableCell>
                  <TableCell>Link corto</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Destino</TableCell>
                  <TableCell align="right">Clicks</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {links.map((l) => (
                  <TableRow key={l.code} hover>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {nameBySlug.get(l.storeSlug) || l.storeSlug}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {l.storeSlug}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                        {l.shortUrl.replace(/^https?:\/\//, '')}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 320 }}>
                      <Typography variant="caption" color="text.secondary" noWrap component="div" title={l.target}>
                        {l.target}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color={l.hits > 0 ? 'success.main' : 'text.disabled'}>
                        {l.hits.toLocaleString()}
                      </Typography>
                    </TableCell>

                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Copiar link">
                        <IconButton size="small" onClick={() => copy(l)}>
                          <ContentCopyRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Abrir">
                        <IconButton
                          size="small"
                          href={l.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenInNewRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
