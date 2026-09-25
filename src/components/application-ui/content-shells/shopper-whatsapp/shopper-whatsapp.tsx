'use client';

import { useStores } from '@/hooks/fetching/stores/useStores';
import {
  shopperWhatsappService,
  type ShopperReply,
} from '@/services/shopper-whatsapp.service';
import SendRounded from '@mui/icons-material/SendRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SENTIMENT_LABEL: Record<string, string> = {
  positive: 'Positiva',
  negative: 'Negativa',
  neutral: 'Neutral',
};

const OPTION_LABEL: Record<string, string> = {
  '1': 'Quiere completar la compra',
  '2': 'Sólo estaba probando',
  '3': 'Le gustó la experiencia',
};

/**
 * Mensajes de WhatsApp con los clientes de tienda.
 *
 * El bot ya contesta solo a quien toca el botón del RCS; acá se arranca la
 * conversación al revés (una tienda, todas, o los clientes dados de alta en un
 * rango) y se leen las respuestas ya clasificadas en positivas y negativas.
 */
export default function ShopperWhatsapp(): React.JSX.Element {
  const theme = useTheme();
  const qc = useQueryClient();

  // Envío
  const [scope, setScope] = useState<'store' | 'all'>('store');
  const [storeSlug, setStoreSlug] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(500);
  const [preview, setPreview] = useState<{ total: number; capped?: boolean } | null>(null);

  // Filtros de la tabla
  const [fStore, setFStore] = useState('');
  const [fSentiment, setFSentiment] = useState('');
  const [fOption, setFOption] = useState('');

  const { data: stores } = useStores();

  const filters = {
    store: fStore || undefined,
    sentiment: fSentiment || undefined,
    option: fOption || undefined,
  };

  const replies = useQuery({
    queryKey: ['shopper-replies', filters],
    queryFn: () => shopperWhatsappService.replies({ ...filters, limit: 100 }),
    staleTime: 1000 * 30,
  });

  const stats = useQuery({
    queryKey: ['shopper-stats', fStore],
    queryFn: () => shopperWhatsappService.stats({ store: fStore || undefined }),
    staleTime: 1000 * 30,
  });

  const jobs = useQuery({
    queryKey: ['shopper-broadcast-status'],
    queryFn: shopperWhatsappService.broadcastStatus,
    // Mientras haya un envío corriendo, el progreso se refresca solo.
    refetchInterval: (q) =>
      (q.state.data?.jobs || []).some((j) => j.status === 'running') ? 5000 : false,
  });

  const payload = {
    allStores: scope === 'all',
    storeSlugs: scope === 'store' && storeSlug ? [storeSlug] : [],
    from: from || undefined,
    to: to || undefined,
    limit,
  };

  const check = useMutation({
    mutationFn: () => shopperWhatsappService.broadcast({ ...payload, dryRun: true }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.message || 'No se pudo calcular la audiencia');
      setPreview({ total: res.total, capped: res.capped });
    },
    onError: () => toast.error('No se pudo calcular la audiencia'),
  });

  const send = useMutation({
    mutationFn: () => shopperWhatsappService.broadcast(payload),
    onSuccess: (res) => {
      setPreview(null);
      if (!res.ok) return toast.error(res.message || 'No se pudo iniciar el envío');
      toast.success(`Enviando a ${res.total} cliente${res.total === 1 ? '' : 's'}`);
      qc.invalidateQueries({ queryKey: ['shopper-broadcast-status'] });
    },
    onError: () => toast.error('No se pudo iniciar el envío'),
  });

  const canSend = scope === 'all' || !!storeSlug;
  const running = (jobs.data?.jobs || []).find((j) => j.status === 'running');

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* ── Automatización: a quién se le manda ── */}
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            Mandar el mensaje
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sale el saludo con las 3 opciones. Lo que conteste el cliente lo responde el bot y
            queda guardado abajo.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              select
              size="small"
              label="A quién"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as 'store' | 'all');
                setPreview(null);
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="store">Una tienda</MenuItem>
              <MenuItem value="all">Todas las tiendas</MenuItem>
            </TextField>

            {scope === 'store' ? (
              <TextField
                select
                size="small"
                label="Tienda"
                value={storeSlug}
                onChange={(e) => {
                  setStoreSlug(e.target.value);
                  setPreview(null);
                }}
                sx={{ minWidth: 260 }}
              >
                {(stores || [])
                  .filter((s: any) => s?.slug)
                  .map((s: any) => (
                    <MenuItem key={s.slug} value={s.slug}>
                      {s.name}
                    </MenuItem>
                  ))}
              </TextField>
            ) : null}

            <TextField
              size="small"
              type="date"
              label="Alta desde"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreview(null);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="date"
              label="Alta hasta"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPreview(null);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="number"
              label="Tope"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))}
              sx={{ width: 120 }}
              helperText="Máx. 5000"
            />
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              onClick={() => check.mutate()}
              disabled={!canSend || check.isPending}
              startIcon={check.isPending ? <CircularProgress size={16} /> : undefined}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Ver a cuántos les toca
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsApp />}
              onClick={() => check.mutate()}
              disabled={!canSend || check.isPending || send.isPending}
              sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
            >
              Enviar
            </Button>
            {running ? (
              <Chip
                size="small"
                label={`Enviando… ${running.sent}/${running.total}`}
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.info.main, 0.14),
                  color: 'info.main',
                }}
              />
            ) : null}
          </Stack>
        </Card>

        {/* ── Resumen de respuestas ── */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${stats.data?.total ?? 0} mensajes`} sx={{ fontWeight: 700 }} />
          <Chip
            size="small"
            label={`${stats.data?.bySentiment?.positive ?? 0} positivas`}
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.14), color: 'success.main' }}
          />
          <Chip
            size="small"
            label={`${stats.data?.bySentiment?.negative ?? 0} negativas`}
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.error.main, 0.14), color: 'error.main' }}
          />
          <Chip
            size="small"
            label={`${stats.data?.byOption?.['1'] ?? 0} quieren completar la compra`}
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.14), color: 'warning.main' }}
          />
        </Stack>

        {/* ── Filtros + tabla ── */}
        <Card sx={{ borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
            <TextField
              select
              size="small"
              label="Tienda"
              value={fStore}
              onChange={(e) => setFStore(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(stores || [])
                .filter((s: any) => s?.slug)
                .map((s: any) => (
                  <MenuItem key={s.slug} value={s.slug}>
                    {s.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Sentimiento"
              value={fSentiment}
              onChange={(e) => setFSentiment(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="positive">Positivas</MenuItem>
              <MenuItem value="negative">Negativas</MenuItem>
              <MenuItem value="neutral">Neutrales</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Opción"
              value={fOption}
              onChange={(e) => setFOption(e.target.value)}
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="1">1 · Quiere completar la compra</MenuItem>
              <MenuItem value="2">2 · Sólo estaba probando</MenuItem>
              <MenuItem value="3">3 · Le gustó la experiencia</MenuItem>
            </TextField>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={() => {
                replies.refetch();
                stats.refetch();
              }}
              startIcon={replies.isFetching ? <CircularProgress size={16} /> : <RefreshRounded />}
              sx={{ textTransform: 'none' }}
            >
              Refrescar
            </Button>
          </Stack>
          <Divider />

          {replies.isError ? (
            <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
              No se pudieron cargar las respuestas.
            </Alert>
          ) : replies.isPending ? (
            <Stack spacing={1} sx={{ p: 2 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          ) : !replies.data?.data.length ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <WhatsApp sx={{ fontSize: 56, color: 'text.disabled' }} />
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                Todavía no hay respuestas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mandá el mensaje a una tienda y acá van apareciendo.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Tienda</TableCell>
                    <TableCell>Respuesta</TableCell>
                    <TableCell>Clasificación</TableCell>
                    <TableCell align="right">Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {replies.data.data.map((r: ShopperReply) => (
                    <TableRow key={r._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {r.customerName || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.storeName || r.storeSlug || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2">
                          {r.option ? OPTION_LABEL[String(r.option)] : r.text || '—'}
                        </Typography>
                        {r.summary ? (
                          <Typography variant="caption" color="text.secondary">
                            {r.summary}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={SENTIMENT_LABEL[r.sentiment] || r.sentiment}
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(
                              r.sentiment === 'positive'
                                ? theme.palette.success.main
                                : r.sentiment === 'negative'
                                  ? theme.palette.error.main
                                  : theme.palette.text.disabled,
                              0.14
                            ),
                            color:
                              r.sentiment === 'positive'
                                ? 'success.main'
                                : r.sentiment === 'negative'
                                  ? 'error.main'
                                  : 'text.secondary',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(r.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>
      </Stack>

      {/* Confirmación: un envío masivo no se dispara de un solo click. */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmar envío</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Se le va a mandar el saludo por WhatsApp a{' '}
            <strong>{preview?.total ?? 0} cliente{preview?.total === 1 ? '' : 's'}</strong>
            {scope === 'all' ? ' de todas las tiendas activas' : ''}
            {from || to ? ' (filtrados por fecha de alta)' : ''}.
          </Typography>
          {preview?.capped ? (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              Se llegó al tope de {limit}. El resto queda para otra tanda.
            </Alert>
          ) : null}
          {!preview?.total ? (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Ningún cliente cumple con esos filtros.
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreview(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={send.isPending ? <CircularProgress size={16} /> : <SendRounded />}
            disabled={!preview?.total || send.isPending}
            onClick={() => send.mutate()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Enviar ahora
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
