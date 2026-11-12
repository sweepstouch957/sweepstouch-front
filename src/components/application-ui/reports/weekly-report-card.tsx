'use client';
import { textHas } from '@/utils/text';

import { useConfirm } from '@/components/base/confirm';

/** Correo semanal a tiendas (reporte de los lunes): elegir la semana, ver a quién le llegó,
 *  a quién le falta el correo, y enviarlo a mano sin esperar al cron de cada hora. */
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import ScheduleSendRoundedIcon from '@mui/icons-material/ScheduleSendRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { campaignClient } from '@services/campaing.service';
import type { WeeklyReportState, WeeklyReportStatus } from '@services/campaing.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const KEY = ['reports', 'weekly-report-status'];

type Tone = 'success' | 'info' | 'warning' | 'error';
const STATE: Record<WeeklyReportState, { label: string; tone: Tone }> = {
  sent: { label: 'Enviado', tone: 'success' },
  pending: { label: 'Listo para enviar', tone: 'info' },
  sent_fake: { label: 'Se fue a un correo falso', tone: 'warning' },
  no_email: { label: 'Sin correo', tone: 'error' },
};

type Filter = 'todo' | 'resolver' | 'sent';

const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtSent = (d: string) =>
  new Date(d).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
const weekLabel = (end: string) => {
  const start = new Date(`${end}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 7);
  return `${fmtDay(start.toISOString().slice(0, 10))} – ${fmtDay(end)}`;
};

export default function WeeklyReportCard() {
  const confirm = useConfirm();
  const theme = useTheme();
  const qc = useQueryClient();
  // '' = la última semana (la del cron); si no, el lunes de cierre de una anterior.
  const [endDate, setEndDate] = useState('');
  const [filter, setFilter] = useState<Filter>('resolver');
  const [search, setSearch] = useState('');

  const q = useQuery<WeeklyReportStatus>({
    queryKey: [...KEY, endDate],
    queryFn: () => campaignClient.getWeeklyReportStatus(endDate || undefined),
    staleTime: 60_000,
  });

  const send = useMutation({
    mutationFn: (body: { storeId?: string; force?: boolean }) =>
      campaignClient.sendWeeklyReport({ ...body, ...(endDate ? { endDate } : {}) }),
    onSuccess: (d, body) => {
      const noEmail = (d.results ?? []).filter((r) => r.skipped === 'no_email').length;
      const failed = (d.results ?? []).filter((r) => r.sent === false).length;
      if (body.storeId) {
        if (d.sent) toast.success('Reporte enviado a la tienda');
        else toast.error(noEmail ? 'La tienda no tiene un correo real en su ficha' : 'No se pudo enviar: revisa la ficha de la tienda');
      } else {
        toast.success(
          `${d.sent} enviado${d.sent === 1 ? '' : 's'}` +
            (failed ? ` · ${failed} fallaron` : '') +
            (noEmail ? ` · ${noEmail} siguen sin correo` : '')
        );
      }
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo enviar'),
  });

  const t = q.data?.totals;
  const weeks = q.data?.weeks ?? (q.data ? [q.data.week.endDate] : []);
  const busyId = send.isPending ? send.variables?.storeId ?? 'all' : null;
  const missing = (t?.noEmail ?? 0) + (t?.sentFake ?? 0);
  const sentPct = t?.stores ? Math.round((t.sent / t.stores) * 100) : 0;

  const stores = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (q.data?.stores ?? [])
      .filter((s) => (filter === 'todo' ? true : filter === 'sent' ? s.state === 'sent' : s.state !== 'sent'))
      .filter((s) => !term || textHas(s.name, term) || textHas(s.email, term));
  }, [q.data, filter, search]);

  const kpis: Array<{ label: string; value: number | undefined; hint: string; tone: Tone | 'primary'; icon: React.ReactNode; onClick?: () => void }> = [
    { label: 'Tiendas con campañas', value: t?.stores, hint: 'en la semana elegida', tone: 'primary', icon: <StorefrontRoundedIcon />, onClick: () => setFilter('todo') },
    { label: 'Enviados', value: t?.sent, hint: `${sentPct}% de las tiendas`, tone: 'success', icon: <MarkEmailReadRoundedIcon />, onClick: () => setFilter('sent') },
    { label: 'Listos para enviar', value: t?.pending, hint: 'tienen correo, falta mandarlo', tone: 'info', icon: <ScheduleSendRoundedIcon />, onClick: () => setFilter('resolver') },
    { label: 'Sin correo', value: missing, hint: 'hay que ponerlo en la ficha', tone: 'error', icon: <ErrorOutlineRoundedIcon />, onClick: () => setFilter('resolver') },
  ];

  const toneColor = (tone: Tone | 'primary') => theme.palette[tone].main;

  return (
    <Stack spacing={2.5}>
      {/* Semana + envío masivo */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)}, ${alpha(theme.palette.primary.main, 0)} 60%)`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {q.data ? `Semana ${weekLabel(q.data.week.endDate)}` : 'Cargando semana…'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sale solo los lunes desde las 8:00 am (NY) y se reintenta cada hora. Las semanas anteriores se envían desde aquí.
            </Typography>
            {t && (
              <Box sx={{ mt: 1.5, maxWidth: 420 }}>
                <LinearProgress
                  variant="determinate"
                  value={sentPct}
                  color="success"
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.12) }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontSize: 12.5 }}
                >
                  {t.sent} de {t.stores} tiendas recibieron el reporte
                </Typography>
              </Box>
            )}
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1.5}
          >
            <TextField
              select
              size="small"
              label="Semana"
              value={endDate || q.data?.week.endDate || ''}
              onChange={(e) => setEndDate(e.target.value === weeks[0] ? '' : e.target.value)}
              sx={{ minWidth: 190 }}
            >
              {weeks.map((end) => (
                <MenuItem
                  key={end}
                  value={end}
                >
                  {weekLabel(end)}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disableElevation
              startIcon={busyId === 'all' ? <CircularProgress size={14}
color="inherit" /> : <SendRoundedIcon />}
              disabled={!t?.pending || send.isPending}
              onClick={() =>
                void confirm({
                  title: '¿Enviar los reportes semanales listos?',
                  description: 'Sale un correo a cada tienda con su reporte de la semana.',
                  details: [['Correos que salen', `${t?.pending ?? 0} tiendas`]],
                  severity: 'primary',
                  confirmLabel: `Enviar ${t?.pending ?? 0} correos`,
                }).then((ok) => ok && send.mutate({}))
              }
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Enviar listos{t?.pending ? ` (${t.pending})` : ''}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Indicadores */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        {kpis.map((k) => (
          <Paper
            key={k.label}
            elevation={0}
            onClick={k.onClick}
            sx={{
              p: 2,
              borderRadius: 3,
              cursor: 'pointer',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'border-color .15s, transform .15s',
              '&:hover': { borderColor: toneColor(k.tone), transform: 'translateY(-1px)' },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  color: toneColor(k.tone),
                  bgcolor: alpha(toneColor(k.tone), 0.12),
                  '& svg': { fontSize: 17 },
                }}
              >
                {k.icon}
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 600, fontSize: 12.5 }}
              >
                {k.label}
              </Typography>
            </Stack>
            {q.isLoading ? (
              <Skeleton width={50}
height={36} />
            ) : (
              <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: k.value ? toneColor(k.tone) : 'text.disabled' }}>
                {k.value ?? 0}
              </Typography>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12, mt: 0.25 }}
            >
              {k.hint}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Lista de tiendas */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, v) => v && setFilter(v)}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.75 } }}
          >
            <ToggleButton value="resolver">Por resolver{t ? ` · ${t.stores - t.sent}` : ''}</ToggleButton>
            <ToggleButton value="sent">Enviados{t ? ` · ${t.sent}` : ''}</ToggleButton>
            <ToggleButton value="todo">Todas{t ? ` · ${t.stores}` : ''}</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small"
            placeholder="Buscar tienda o correo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { md: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {q.isLoading ? (
          <Stack
            spacing={1}
            sx={{ p: 2.5 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={58}
              />
            ))}
          </Stack>
        ) : q.isError ? (
          <Typography
            color="error"
            variant="body2"
            sx={{ p: 2.5 }}
          >
            No se pudo cargar el estado del reporte.
          </Typography>
        ) : !stores.length ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <MarkEmailReadRoundedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography sx={{ fontWeight: 700 }}>
              {search ? 'Ninguna tienda coincide con la búsqueda' : filter === 'resolver' ? 'Todo al día' : 'Nada que mostrar'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {filter === 'resolver' && !search ? 'A todas las tiendas de esta semana les llegó el reporte.' : ''}
            </Typography>
          </Box>
        ) : (
          <Box>
            {stores.map((s) => {
              const st = STATE[s.state];
              const color = toneColor(st.tone);
              const needsEmail = s.state === 'no_email' || s.state === 'sent_fake';
              const fichaHref = `/admin/management/stores/edit/${s.storeId}?tag=general-info`;
              return (
                <Stack
                  key={s.storeId}
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={{ xs: 1, sm: 2 }}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderLeft: `3px solid ${color}`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-of-type': { borderBottom: 0 },
                    '&:hover': { bgcolor: alpha(color, 0.04) },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link
                      component={NextLink}
                      href={fichaHref}
                      underline="hover"
                      sx={{ fontWeight: 650, fontSize: 14.5, color: 'text.primary' }}
                    >
                      {s.name}
                    </Link>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12.5, overflowWrap: 'anywhere', textTransform: 'none' }}
                    >
                      {s.email ? s.email.toLowerCase() : 'Sin correo en la ficha'}
                      {' · '}
                      {s.campaigns} campaña{s.campaigns === 1 ? '' : 's'}
                      {s.sentAt && ` · enviado ${fmtSent(s.sentAt)}`}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      color,
                      bgcolor: alpha(color, 0.1),
                    }}
                  >
                    {st.label}
                  </Box>
                  <Box sx={{ minWidth: 132, textAlign: { sm: 'right' } }}>
                    {needsEmail ? (
                      <Button
                        size="small"
                        variant="outlined"
                        component={NextLink}
                        href={fichaHref}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                      >
                        Poner correo
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant={s.state === 'sent' ? 'text' : 'contained'}
                        disableElevation
                        disabled={send.isPending}
                        startIcon={
                          busyId === s.storeId ? <CircularProgress size={12}
color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 15 }} />
                        }
                        onClick={() => {
                          const go = () => send.mutate({ storeId: s.storeId, force: s.state === 'sent' });
                          // Reenviar manda un segundo correo a la tienda: se pregunta. El primero, no.
                          if (s.state !== 'sent') return go();
                          void confirm({
                            title: `¿Reenviar el reporte a ${s.name}?`,
                            description: `Ya se envió a ${s.email}. Le llega otra vez el mismo correo.`,
                            severity: 'primary',
                            confirmLabel: 'Reenviar',
                          }).then((ok) => ok && go());
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                      >
                        {s.state === 'sent' ? 'Reenviar' : 'Enviar'}
                      </Button>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Box>
        )}
      </Paper>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: 12.5, px: 0.5 }}
      >
        Los correos automáticos …@sweepstouch.com no son de nadie y cuentan como “sin correo”. Pon el correo real en la ficha
        de la tienda, vuelve aquí y dale Enviar.
      </Typography>
    </Stack>
  );
}
