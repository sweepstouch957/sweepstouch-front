// components/cashiers/CashiersRankingTable.tsx
'use client';

import { useCashierRanking, useCreateCashier } from '@/services/cashier.service';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsTwoToneIcon from '@mui/icons-material/EmojiEventsTwoTone';
import SearchIcon from '@mui/icons-material/Search';
import {
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
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs, { Dayjs } from 'dayjs';
import * as React from 'react';

// ===== Tipos según tu payload de ranking =====
type Row = {
  cashierId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  accessCode: string | null;
  active: boolean;
  store: string | null;
  count: number; // participaciones / números ingresados
  newNumbers?: number;
  existingNumbers?: number;
};

export interface Props {
  startDate: string;
  endDate: string;
  storeId?: string;
  active?: boolean;
}

// ===== Helpers =====
const getFirstName = (full?: string | null) => (full ? String(full).trim().split(/\s+/)[0] : '-');
const toInt = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const medalColor = (idx: number) =>
  idx === 0 ? 'warning' : idx === 1 ? 'secondary' : idx === 2 ? 'info' : 'default';

// Datos fake para el gráfico de barras
const weeklyData = {
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  values: [30, 45, 35, 52, 43, 64, 32],
};

const CashiersRankingTable: React.FC<Props> = ({ startDate, endDate, storeId, active }) => {
  // UI state
  const [q, setQ] = React.useState('');
  const qDebounced = useDebounced(q, 350);
  const [page0, setPage0] = React.useState(0);
  const [limit, setLimit] = React.useState(10);

  // Date range state - NUEVO
  const [dateStart, setDateStart] = React.useState<Dayjs | null>(dayjs(startDate));
  const [dateEnd, setDateEnd] = React.useState<Dayjs | null>(dayjs(endDate));

  // Crear cajera (opcional)
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', phoneNumber: '', email: '' });

  // Params - MODIFICADO para usar las fechas del state
  const params = React.useMemo(
    () => ({
      startDate: dateStart?.format('YYYY-MM-DD') || startDate,
      endDate: dateEnd?.format('YYYY-MM-DD') || endDate,
      storeId: storeId || undefined,
      active,
      q: qDebounced || undefined,
      page: page0 + 1,
      limit,
    }),
    [dateStart, dateEnd, storeId, active, qDebounced, page0, limit, startDate, endDate]
  );

  const { data, isLoading, isFetching, isError, error } = useCashierRanking(params, {
    keepPreviousData: true,
  });
  const totalCashiers = data?.totalCashiers ?? 0;
  const items = (data?.data ?? []) as Row[];

  // Normaliza + ranking (por nuevos+existentes si existen; si no, count)
  const ranked = React.useMemo(() => {
    return [...items]
      .map((r) => ({
        ...r,
        __firstName: getFirstName(r.name),
        __new: r.newNumbers,
        __existing: r.existingNumbers,
      }))
      .sort((a: any, b: any) => {
        const aKey =
          Number.isFinite(a.__new) || Number.isFinite(a.__existing)
            ? toInt(a.__new, 0) + toInt(a.__existing, 0)
            : toInt(a.count, 0);
        const bKey =
          Number.isFinite(b.__new) || Number.isFinite(b.__existing)
            ? toInt(b.__new, 0) + toInt(b.__existing, 0)
            : toInt(b.count, 0);
        return bKey - aKey;
      });
  }, [items]);

  // Totales (arriba)
  const totals = React.useMemo(
    () => ({
      sumNew: ranked.reduce((acc: number, r: any) => acc + toInt(r.__new, 0), 0),
      sumExisting: ranked.reduce((acc: number, r: any) => acc + toInt(r.__existing, 0), 0),
      sumCount: ranked.reduce((acc: number, r: any) => acc + toInt(r.count, 0), 0),
    }),
    [ranked]
  );

  // Datos fake para las métricas - NUEVO
  const audienciaInicial = 447;
  const audienciaFinal = 1490;
  const crecimiento = audienciaFinal - audienciaInicial;

  const loadLabel = isLoading ? 'Cargando…' : isFetching ? 'Actualizando…' : null;

  // Mutación crear (opcional)
  const createMut = useCreateCashier({
    onSuccess: () => {
      setOpen(false);
      setForm({ name: '', phoneNumber: '', email: '' });
      setPage0(0);
    },
    onError: () => alert('No se pudo crear la cajera'),
  });

  const onCreate = async () => {
    if (!storeId) return;
    const name = form.name.trim();
    const [firstName, ...rest] = name.split(/\s+/);
    const lastName = rest.join(' ');
    if (!firstName || !form.phoneNumber) return;
    await createMut.mutateAsync({
      firstName,
      lastName,
      storeId,
      email: form.email || undefined,
      phoneNumber: form.phoneNumber,
      active: true,
    });
  };

  return (
    <Box>
      {/* ========== SECCIÓN NUEVA: Título principal ========== */}
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 1 }}
      >
        Análisis de Cajeras
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Super Supermarket 30 Memorial Dr, Paterson, NJ
      </Typography>

      {/* ========== SECCIÓN NUEVA: Selector de Rango de Fechas ========== */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ mb: 2 }}
          >
            <CalendarTodayIcon fontSize="small" />
            <Typography
              variant="subtitle2"
              fontWeight={600}
            >
              Rango de Fechas
            </Typography>
          </Stack>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                md={6}
              >
                <DatePicker
                  label="Fecha Inicio"
                  value={dateStart}
                  onChange={(newValue) => setDateStart(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
              >
                <DatePicker
                  label="Fecha Fin"
                  value={dateEnd}
                  onChange={(newValue) => setDateEnd(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </CardContent>
      </Card>

      {/* ========== SECCIÓN NUEVA: Cards de Métricas de Audiencia ========== */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid
          item
          xs={12}
          md={6}
        >
          <Card
            sx={{
              borderRadius: 2,
              borderLeft: '4px solid #2196F3',
              bgcolor: 'rgba(33, 150, 243, 0.05)',
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle2"
                sx={{ color: '#2196F3', fontWeight: 600, mb: 1 }}
              >
                Audiencia Inicial
              </Typography>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{ color: '#2196F3' }}
              >
                {audienciaInicial}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
        >
          <Card
            sx={{
              borderRadius: 2,
              borderLeft: '4px solid #4CAF50',
              bgcolor: 'rgba(76, 175, 80, 0.05)',
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle2"
                sx={{ color: '#4CAF50', fontWeight: 600, mb: 1 }}
              >
                Audiencia Final
              </Typography>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{ color: '#4CAF50' }}
              >
                {audienciaFinal}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#4CAF50', fontWeight: 500, mt: 0.5, display: 'block' }}
              >
                +{crecimiento} en el período
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ========== SECCIÓN NUEVA: Gráfico de Barras ========== */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2 }}
          >
            Registros por Día de la Semana
          </Typography>
          <Box sx={{ width: '100%', height: 300 }}>
            <BarChart
              xAxis={[
                {
                  scaleType: 'band',
                  data: weeklyData.days,
                },
              ]}
              series={[
                {
                  data: weeklyData.values,
                  color: '#2196F3',
                },
              ]}
              height={300}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ========== SECCIÓN ORIGINAL: Tabla de Ranking (SIN CAMBIOS) ========== */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            flexWrap="wrap"
          >
            <Typography
              variant="h5"
              fontWeight={700}
            >
              Ranking de Cajeras
            </Typography>
            <Stack
              direction="row"
              gap={2}
            >
              <TextField
                placeholder="Buscar por nombre, teléfono o email"
                size="small"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage0(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
                disabled={!storeId}
              >
                Nueva Cajera
              </Button>
            </Stack>
          </Stack>

          {/* Totales arriba */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 1.5 }}
            flexWrap="wrap"
          >
            <Chip
              label={`Total cajeras: ${totalCashiers}`}
              size="small"
              color="default"
            />

            <Chip
              label={`Participaciones: ${totals.sumCount}`}
              size="small"
              color="primary"
            />
          </Stack>

          {loadLabel && (
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ mt: 1 }}
            >
              <CircularProgress size={14} />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {loadLabel}
              </Typography>
            </Stack>
          )}
          {isError && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: 'block' }}
            >
              {(error as any)?.message ?? 'Error cargando ranking'}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Tabla */}
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>First name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Access code</TableCell>
                  <TableCell align="right">Participaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ranked.map((r: any, idx: number) => (
                  <TableRow
                    key={r.cashierId || r._id || idx}
                    hover
                  >
                    <TableCell width={64}>
                      <Chip
                        size="small"
                        label={idx + 1 + page0 * limit}
                        color={medalColor(idx)}
                        icon={idx < 3 ? <EmojiEventsTwoToneIcon fontSize="small" /> : undefined}
                      />
                    </TableCell>
                    <TableCell>{getFirstName(r.name)}</TableCell>
                    <TableCell>{r.email ?? '—'}</TableCell>
                    <TableCell>{r.accessCode ?? '—'}</TableCell>

                    <TableCell align="right">{toInt(r.count, 0)}</TableCell>
                  </TableRow>
                ))}

                {!ranked.length && !isLoading && !isFetching && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography
                        textAlign="center"
                        py={3}
                      >
                        Sin registros
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Total cajeras: <b>{totalCashiers}</b>
                      </Typography>
                      <TablePagination
                        component="div"
                        count={totalCashiers}
                        page={page0}
                        onPageChange={(_, p) => setPage0(p)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(e) => {
                          setLimit(parseInt(e.target.value, 10));
                          setPage0(0);
                        }}
                        rowsPerPageOptions={[5, 10, 15, 25, 50]}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </CardContent>

        {/* Modal crear (opcional) */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
        >
          <DialogTitle>Nueva Cajera</DialogTitle>
          <DialogContent>
            <Stack
              gap={2}
              mt={1}
              sx={{ minWidth: 320 }}
            >
              <TextField
                label="Nombre completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label="Teléfono"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={onCreate}
              variant="contained"
              disabled={createMut.isPending || !storeId}
            >
              {createMut.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Box>
  );
};

export default CashiersRankingTable;
