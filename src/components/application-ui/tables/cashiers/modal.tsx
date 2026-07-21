'use client';

import {
  useCashierRewardProgress,
  useCashierRewards,
  useMarkRewardPaid,
} from '@/hooks/fetching/cashiers/useCashierRewards';
import { useCashierStats } from '@/services/cashier.service';
import type { CashierProgress, CashierReward } from '@/services/rewards.service';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PaidIcon from '@mui/icons-material/Paid';
import PhoneIcon from '@mui/icons-material/Phone';
import DownloadIcon from '@mui/icons-material/Download';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import * as React from 'react';

const getFirstName = (full?: string | null) => (full ? String(full).trim().split(/\s+/)[0] : '-');

const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('es-ES') : '—');

type TotalsKPI = { total: number; new: number; existing: number };

type Props = {
  open: boolean;
  onClose: () => void;
  cashierId: string | null;
  cashierName?: string | null;
  cashierEmail?: string | null;
  cashierAccessCode?: string | null;
  startDateYMD: string;
  endDateYMD: string;
  storeId?: string;

  /** KPIs adicionales visibles en el modal */
  lifetimeTotals?: TotalsKPI;
  sinceNov3Totals?: TotalsKPI;
  phoneAudit?: {
    totalRegistered: number;
    validPhones: number;
    invalidPhones: number;
    unknownPhones: number;
    invalidPercent: number;
  };
};

export default function CashierDetailsDialog({
  open,
  onClose,
  cashierId,
  cashierName,
  cashierEmail,
  cashierAccessCode,
  startDateYMD,
  endDateYMD,
  storeId,
  lifetimeTotals,
  sinceNov3Totals,
  phoneAudit,
}: Props) {
  const enabled = Boolean(open && cashierId);

  /** ===== Stats por rango (participaciones) ===== */
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
  } = useCashierStats(
    cashierId || undefined,
    { startDate: startDateYMD, endDate: endDateYMD, storeId },
    { enabled }
  );

  const totals = stats?.totals;
  const total = totals?.total ?? 0;
  const newNum = totals?.newNumbers ?? 0;
  const existing = totals?.existingNumbers ?? 0;
  const pctNew = total > 0 ? Math.round((newNum / total) * 100) : 0;

  /** ===== Recompensas: progreso + listado ===== */
  const {
    data: progress,
    isLoading: isProgLoading,
    isError: isProgError,
  } = useCashierRewardProgress(cashierId || undefined, storeId);

  const {
    data: rewards,
    isLoading: isRewardsLoading,
    isError: isRewardsError,
  } = useCashierRewards(cashierId || undefined, storeId);

  const markPaidMut = useMarkRewardPaid();

  // ✅ La mutación recibe SOLO el rewardId (según tu servicio)
  const onMarkPaid = async (rewardId: string) => {
    try {
      await markPaidMut.mutateAsync(rewardId);
    } catch {
      /* noop; la invalidación ya sucede en onSuccess */
    }
  };

  // Fallback para la card "Desde …" si no recibes sinceNov3Totals:
  // Usa la info de progreso real (CashierProgress) si existe.
  const resolvedSinceTotals: TotalsKPI | undefined = React.useMemo(() => {
    if (progress && typeof progress.current === 'number') {
      return {
        total: progress.current,
        new: progress.current,
        existing: 0,
      };
    }
    return undefined;
  }, [progress]);

  const [isExporting, setIsExporting] = React.useState(false);

  const onExportCSV = async () => {
    if (!cashierId || !startDateYMD || !endDateYMD) return;
    setIsExporting(true);
    try {
      const res = await sweepstakesClient.getParticipantsByPromotor({
        promotorId: cashierId,
        startDate: startDateYMD,
        endDate: endDateYMD,
        storeId
      });
      const participants = res?.participants || [];
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Telefono,Nuevo,Metodo,Valido,Status SMS,Fecha\n";
      
      participants.forEach((p: any) => {
        const phone = p.customer?.phoneNumber || p.customerPhone || "";
        const isNew = p.isNewUser ? "Si" : "No";
        const valid = p.isPhoneValid === true ? "Bueno" : (p.isPhoneValid === false ? "Malo" : "Pendiente");
        const status = p.smsStatus || "pending";
        const date = new Date(p.registeredAt).toLocaleString('es-ES');
        csvContent += `${phone},${isNew},${p.method},${valid},${status},${date}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Numeros_${cashierName}_${startDateYMD}_${endDateYMD}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Error al exportar");
    } finally {
      setIsExporting(false);
    }
  };

  // Etiqueta de fecha base (si viene del backend)
  const sinceLabel = progress?.since
    ? new Date(progress.since).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '03 nov 2025';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Detalles de cajera</DialogTitle>
      <DialogContent dividers>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          gap={2}
          mb={2}
        >
          <Avatar
            sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}
            src={
              stats?.user?.profileImage
                ? `https://api2.sweepstouch.com/uploads/${stats.user.profileImage}`
                : undefined
            }
          >
            {getFirstName(cashierName ?? stats?.user?.name)[0]?.toUpperCase() ?? 'C'}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
            >
              {cashierName ?? stats?.user?.name ?? '—'}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
            >
              <Chip
                label={cashierEmail || stats?.user?.email || '—'}
                size="small"
              />
              <Chip
                label={`Access code: ${cashierAccessCode || stats?.user?.accessCode || '—'}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              <Chip
                label={`${startDateYMD} — ${endDateYMD}`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Stack>

        {/* Stats por rango */}
        {isStatsLoading && (
          <Stack
            gap={1}
            mb={2}
          >
            <LinearProgress />
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Cargando estadísticas…
            </Typography>
          </Stack>
        )}

        {isStatsError && (
          <Typography
            variant="body2"
            color="error"
            mb={2}
          >
            {(statsError as any)?.message || 'No se pudo obtener los stats'}
          </Typography>
        )}

        {!isStatsLoading && !isStatsError && (
          <Stack
            gap={2}
            mb={2}
          >
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                sm={4}
              >
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      TOTAL PARTICIPACIONES
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={900}
                    >
                      {total.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid
                item
                xs={12}
                sm={4}
              >
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={700}
                    >
                      NÚMEROS NUEVOS
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={900}
                      sx={{ color: 'success.main' }}
                    >
                      {newNum.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="success.main"
                    >
                      {pctNew}% de total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid
                item
                xs={12}
                sm={4}
              >
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="secondary.main"
                      fontWeight={700}
                    >
                      EXISTENTES
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={900}
                      sx={{ color: 'secondary.main' }}
                    >
                      {existing.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* KPIs extra: Lifetime + Desde 3 de nov (o desde progress.since) */}
            {(lifetimeTotals || sinceNov3Totals || resolvedSinceTotals) && (
              <Grid
                container
                spacing={2}
              >
                {lifetimeTotals && (
                  <Grid
                    item
                    xs={12}
                    md={6}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          TODAS LAS PARTICIPACIONES
                        </Typography>
                        <Stack
                          direction="row"
                          gap={3}
                          alignItems="baseline"
                          mt={0.5}
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="h5"
                            fontWeight={900}
                          >
                            {lifetimeTotals.total.toLocaleString()}
                          </Typography>
                          <Chip
                            size="small"
                            color="success"
                            label={`Nuevos: ${lifetimeTotals.new.toLocaleString()}`}
                          />
                          <Chip
                            size="small"
                            color="secondary"
                            label={`Existentes: ${lifetimeTotals.existing.toLocaleString()}`}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {(sinceNov3Totals || resolvedSinceTotals) && (
                  <Grid
                    item
                    xs={12}
                    md={6}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          DESDE {sinceLabel.toUpperCase()}
                        </Typography>
                        <Stack
                          direction="row"
                          gap={3}
                          alignItems="baseline"
                          mt={0.5}
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="h5"
                            fontWeight={900}
                          >
                            {(sinceNov3Totals ?? resolvedSinceTotals)!.total.toLocaleString()}
                          </Typography>
                          <Chip
                            size="small"
                            color="success"
                            label={`Nuevos: ${(sinceNov3Totals ??
                              resolvedSinceTotals)!.new.toLocaleString()}`}
                          />
                          <Chip
                            size="small"
                            color="secondary"
                            label={`Existentes: ${(sinceNov3Totals ??
                              resolvedSinceTotals)!.existing.toLocaleString()}`}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}

            {Array.isArray(stats?.breakdown) && stats!.breakdown!.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  gutterBottom
                >
                  Desglose por día
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{ borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Nuevos</TableCell>
                        <TableCell align="right">Existentes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats!.breakdown!.map((d) => (
                        <TableRow key={d.date}>
                          <TableCell>{d.date}</TableCell>
                          <TableCell align="right">{d.total}</TableCell>
                          <TableCell align="right">{d.newNumbers}</TableCell>
                          <TableCell align="right">{d.existingNumbers}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        )}

        {/* ===== Auditoría de Números ===== */}
        {phoneAudit && phoneAudit.totalRegistered > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack gap={1.5}>
              <Stack direction="row" alignItems="center" gap={1}>
                <PhoneIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={800}>
                  Auditoría de Números
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="success.main" fontWeight={700}>VÁLIDOS</Typography>
                      <Typography variant="h5" fontWeight={900} color="success.main">
                        {phoneAudit.validPhones.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="error.main" fontWeight={700}>INVÁLIDOS</Typography>
                      <Typography variant="h5" fontWeight={900} color="error.main">
                        {phoneAudit.invalidPhones.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="error.main">
                        {phoneAudit.invalidPercent}% del total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>SIN VALIDAR</Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {phoneAudit.unknownPhones.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Stack gap={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Tasa de números inválidos
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color={phoneAudit.invalidPercent > 15 ? 'error.main' : phoneAudit.invalidPercent > 5 ? 'warning.main' : 'success.main'}>
                    {phoneAudit.invalidPercent}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, phoneAudit.invalidPercent)}
                  color={phoneAudit.invalidPercent > 15 ? 'error' : phoneAudit.invalidPercent > 5 ? 'warning' : 'success'}
                />
              </Stack>
            </Stack>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ===== Recompensas / Progreso ===== */}
        <Stack gap={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
          >
            <PaidIcon fontSize="small" />
            <Typography
              variant="subtitle1"
              fontWeight={800}
            >
              Recompensas / Progreso
            </Typography>
          </Stack>

          {/* Progreso (CashierProgress real) */}
          {isProgLoading ? (
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <CircularProgress size={16} />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Cargando progreso de recompensas…
              </Typography>
            </Stack>
          ) : isProgError ? (
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <ErrorOutlineIcon
                fontSize="small"
                color="error"
              />
              <Typography
                variant="caption"
                color="error"
              >
                No se pudo obtener el progreso.
              </Typography>
            </Stack>
          ) : progress ? (
            <Stack gap={0.5}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Desde: <b>{progress.since}</b>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, progress.percent))}
              />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {progress.current.toLocaleString()} / {progress.goal.toLocaleString()} (
                {progress.percent}
                %)
              </Typography>
              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
                mt={0.5}
              >
                <Chip
                  size="small"
                  label={`Premios logrados: ${progress.earnedRewards}`}
                />
                <Chip
                  size="small"
                  color="success"
                  label={`Nuevos desde baseline: ${progress.totalNewSinceBaseline.toLocaleString()}`}
                />
              </Stack>
            </Stack>
          ) : null}

          {/* Listado de recompensas (CashierReward real) */}
          {isRewardsLoading ? (
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <CircularProgress size={16} />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Cargando recompensas…
              </Typography>
            </Stack>
          ) : isRewardsError ? (
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <ErrorOutlineIcon
                fontSize="small"
                color="error"
              />
              <Typography
                variant="caption"
                color="error"
              >
                No se pudo cargar el listado de recompensas.
              </Typography>
            </Stack>
          ) : Array.isArray(rewards) && rewards.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 2 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Umbral</TableCell>
                    <TableCell>Periodo (inicio)</TableCell>
                    <TableCell>Logrado</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Pagado</TableCell>
                    <TableCell>Notas</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(rewards as CashierReward[]).map((rw) => {
                    const paid = rw.status === 'paid' || Boolean(rw.paidAt);
                    return (
                      <TableRow key={rw._id}>
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography fontWeight={600}>
                              {rw.countAtAchievement.toLocaleString()}
                            </Typography>
                            <Tooltip title="Participaciones nuevas en el hito alcanzado">
                              <ErrorOutlineIcon
                                fontSize="small"
                                color="disabled"
                              />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>{fmtDateTime(rw.periodStart)}</TableCell>
                        <TableCell>{fmtDateTime(rw.achievedAt)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={paid ? 'success' : 'default'}
                            icon={paid ? <CheckCircleIcon /> : undefined}
                            label={paid ? 'Pagada' : 'Pendiente'}
                          />
                        </TableCell>
                        <TableCell>{fmtDateTime(rw.paidAt)}</TableCell>
                        <TableCell>{rw.notes ?? '—'}</TableCell>
                        <TableCell
                          align="center"
                          width={160}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaidIcon />}
                            disabled={paid || markPaidMut.isPending}
                            onClick={() => onMarkPaid(rw._id)}
                          >
                            {markPaidMut.isPending ? 'Guardando…' : 'Marcar pagada'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sin recompensas configuradas.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />} 
          onClick={onExportCSV}
          disabled={isExporting}
        >
          {isExporting ? 'Exportando...' : 'Exportar Números (CSV)'}
        </Button>
        <Button onClick={onClose} variant="contained" color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
