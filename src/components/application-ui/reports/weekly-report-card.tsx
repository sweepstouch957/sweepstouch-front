'use client';

/** Reporte semanal a tiendas (correo de los lunes): a quién le llegó el de la semana pasada,
 *  a quién le falta el correo y un botón para reintentar sin esperar al cron de cada hora. */
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { campaignClient } from '@services/campaing.service';
import type { WeeklyReportState, WeeklyReportStatus } from '@services/campaing.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

const KEY = ['reports', 'weekly-report-status'];

const STATE: Record<WeeklyReportState, { label: string; tone: 'success' | 'warning' | 'error' | 'info' }> = {
  sent: { label: 'Enviado', tone: 'success' },
  pending: { label: 'Pendiente', tone: 'info' },
  sent_fake: { label: 'Se fue a un correo falso', tone: 'warning' },
  no_email: { label: 'Sin correo', tone: 'error' },
};

const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function WeeklyReportCard() {
  const theme = useTheme();
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const q = useQuery<WeeklyReportStatus>({
    queryKey: KEY,
    queryFn: () => campaignClient.getWeeklyReportStatus(),
    staleTime: 60_000,
  });

  const send = useMutation({
    mutationFn: (body: { storeId?: string; force?: boolean }) => campaignClient.sendWeeklyReport(body),
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
  const stores = (q.data?.stores ?? []).filter((s) => showAll || s.state !== 'sent');
  const busyId = send.isPending ? send.variables?.storeId ?? 'all' : null;

  return (
    <Paper
      elevation={0}
      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            }}
          >
            <MarkEmailReadRoundedIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              Reporte semanal a tiendas
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Sale solo los lunes 8:00 am (NY) y se reintenta cada hora.
              {q.data && ` Semana ${fmtDay(q.data.week.startDate)} – ${fmtDay(q.data.week.endDate)}.`}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          size="small"
          disableElevation
          startIcon={busyId === 'all' ? <CircularProgress size={14} color="inherit" /> : <SendRoundedIcon />}
          disabled={!t?.pending || send.isPending}
          onClick={() => send.mutate({})}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Reintentar pendientes{t?.pending ? ` (${t.pending})` : ''}
        </Button>
      </Stack>

      <Box sx={{ px: 2.5, py: 2 }}>
        {q.isLoading ? (
          <Skeleton
            variant="rounded"
            height={120}
          />
        ) : q.isError ? (
          <Typography
            color="error"
            variant="body2"
          >
            No se pudo cargar el estado del reporte.
          </Typography>
        ) : (
          <>
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
              sx={{ mb: 1.5 }}
            >
              <Chip size="small" label={`${t!.stores} tiendas con campañas`} />
              <Chip size="small" color="success" variant="outlined" label={`${t!.sent} enviados`} />
              <Chip size="small" color="info" variant="outlined" label={`${t!.pending} pendientes`} />
              <Chip size="small" color="warning" variant="outlined" label={`${t!.sentFake} a correo falso`} />
              <Chip size="small" color="error" variant="outlined" label={`${t!.noEmail} sin correo`} />
            </Stack>

            <Stack divider={<Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }} />}>
              {stores.map((s) => {
                const st = STATE[s.state];
                const needsEmail = s.state === 'no_email' || s.state === 'sent_fake';
                return (
                  <Stack
                    key={s.storeId}
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Link
                        component={NextLink}
                        href={`/admin/management/stores/edit/${s.storeId}?tag=general-info`}
                        underline="hover"
                        sx={{ fontWeight: 600, fontSize: 14, color: 'text.primary' }}
                      >
                        {s.name}
                      </Link>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ overflowWrap: 'anywhere' }}
                      >
                        {s.email || 'Sin correo en la ficha'} · {s.campaigns} campaña{s.campaigns === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={st.tone}
                      label={st.label}
                      sx={{ fontWeight: 700 }}
                    />
                    {needsEmail ? (
                      <Button
                        size="small"
                        component={NextLink}
                        href={`/admin/management/stores/edit/${s.storeId}?tag=general-info`}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Poner correo
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        disabled={send.isPending}
                        startIcon={busyId === s.storeId ? <CircularProgress size={12} color="inherit" /> : undefined}
                        onClick={() => send.mutate({ storeId: s.storeId, force: s.state === 'sent' })}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {s.state === 'sent' ? 'Reenviar' : 'Enviar'}
                      </Button>
                    )}
                  </Stack>
                );
              })}
              {!stores.length && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 1 }}
                >
                  A todas las tiendas les llegó el reporte de la semana pasada.
                </Typography>
              )}
            </Stack>
            <Button
              size="small"
              onClick={() => setShowAll((v) => !v)}
              sx={{ mt: 1, textTransform: 'none' }}
            >
              {showAll ? 'Ocultar las enviadas' : `Ver también las enviadas (${t!.sent})`}
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              “Se fue a un correo falso” = la tienda tenía un correo automático …@sweepstouch.com. Pon el correo real en
              su ficha, vuelve aquí y dale Reenviar.
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
}
