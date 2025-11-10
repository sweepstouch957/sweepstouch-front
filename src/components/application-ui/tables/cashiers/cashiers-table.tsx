'use client';

import { useCashierRanking, useCreateCashier } from '@/services/cashier.service';
import AddIcon from '@mui/icons-material/Add';
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
  InputAdornment,
  Paper,
  Popover,
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
  useTheme,
} from '@mui/material';
import { addDays, formatISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import * as React from 'react';
import { DateRange } from 'react-date-range';

type Row = {
  cashierId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  accessCode: string | null;
  active: boolean;
  store: string | null;
  count: number;
  newNumbers?: number;
  existingNumbers?: number;
};

export interface CashiersTableProps {
  storeId?: string;
  active?: boolean;
}

const getFirstName = (full?: string | null) => (full ? String(full).trim().split(/\s+/)[0] : '-');
const toInt = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const medalColor = (idx: number) =>
  idx === 0 ? 'warning' : idx === 1 ? 'secondary' : idx === 2 ? 'info' : 'default';

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Util: formatea Date -> 'YYYY-MM-DD'
const toYMD = (d: Date) => formatISO(d, { representation: 'date' });

const CashiersTable: React.FC<CashiersTableProps> = ({ storeId, active }) => {
  const theme = useTheme();

  // 🔒 Rango permitido
  const minDate = React.useMemo(() => startOfDay(new Date('2025-11-03T00:00:00')), []);
  const maxDate = React.useMemo(() => new Date(), []);

  // Rango aplicado (lo que alimenta la query) — iniciamos con la última semana completa o desde minDate si hoy está antes
  const initialStart = React.useMemo(() => {
    // por defecto últimos 7 días dentro de [minDate, today]
    const today = startOfDay(new Date());
    const tentativeStart = addDays(today, -6);
    return tentativeStart < minDate ? minDate : tentativeStart;
  }, [minDate]);
  const initialEnd = React.useMemo(() => {
    const today = startOfDay(new Date());
    return today > maxDate ? maxDate : today;
  }, [maxDate]);

  const [appliedRange, setAppliedRange] = React.useState([
    { startDate: initialStart, endDate: initialEnd, key: 'selection' as const },
  ]);

  // Rango pendiente en el Popover (no afecta la query hasta "Aplicar")
  const [pendingRange, setPendingRange] = React.useState([
    { startDate: initialStart, endDate: initialEnd, key: 'selection' as const },
  ]);

  // Popover
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const openPopover = (e: React.MouseEvent<HTMLElement>) => {
    setPendingRange(appliedRange);
    setAnchorEl(e.currentTarget);
  };
  const closePopover = () => setAnchorEl(null);

  // Filtros
  const [q, setQ] = React.useState('');
  const qDebounced = useDebounced(q, 350);
  const [page0, setPage0] = React.useState(0);
  const [limit, setLimit] = React.useState(10);

  // Params a la API
  const startDateYMD = toYMD(appliedRange[0].startDate!);
  const endDateYMD = toYMD(appliedRange[0].endDate!);

  const params = React.useMemo(
    () => ({
      startDate: startDateYMD,
      endDate: endDateYMD,
      storeId: storeId || undefined,
      active,
      q: qDebounced || undefined,
      page: page0 + 1,
      limit,
    }),
    [startDateYMD, endDateYMD, storeId, active, qDebounced, page0, limit]
  );

  const { data, isLoading, isFetching, isError, error } = useCashierRanking(params, {
    keepPreviousData: true,
  });

  const totalCashiers = data?.totalCashiers ?? 0;
  const items = (data?.data ?? []) as Row[];

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

  const totals = React.useMemo(
    () => ({
      sumNew: ranked.reduce((acc: number, r: any) => acc + toInt(r.__new, 0), 0),
      sumExisting: ranked.reduce((acc: number, r: any) => acc + toInt(r.__existing, 0), 0),
      sumCount: ranked.reduce((acc: number, r: any) => acc + toInt(r.count, 0), 0),
    }),
    [ranked]
  );

  const loadLabel = isLoading ? 'Cargando…' : isFetching ? 'Actualizando…' : null;

  // Modal crear cajera (opcional)
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', phoneNumber: '', email: '' });
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

  // Manejo de cambios en el calendario (permite cualquier rango entre minDate y maxDate)
  const onPendingChange = (ranges: any) => {
    const sel = ranges.selection || ranges['selection'];
    let s = sel?.startDate ? new Date(sel.startDate) : appliedRange[0].startDate!;
    let e = sel?.endDate ? new Date(sel.endDate) : appliedRange[0].endDate!;

    // Clamp a [minDate, maxDate]
    if (s < minDate) s = minDate;
    if (e < minDate) e = minDate;
    if (s > maxDate) s = maxDate;
    if (e > maxDate) e = maxDate;

    setPendingRange([{ startDate: s, endDate: e, key: 'selection' }]);
  };

  const applyRange = () => {
    setAppliedRange(pendingRange);
    setPage0(0); // reset paginación al cambiar rango
    closePopover();
  };

  const periodLabel = (() => {
    const s = appliedRange[0].startDate!;
    const e = appliedRange[0].endDate!;
    const sTxt = s.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const eTxt = e.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${sTxt} — ${eTxt}`;
  })();

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardContent>
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
            flexWrap="wrap"
            alignItems="center"
          >
            <Chip label={periodLabel} />
            <Button
              variant="outlined"
              onClick={openPopover}
            >
              Cambiar rango
            </Button>
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

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 1.5 }}
          flexWrap="wrap"
        >
          <Chip
            label={`Total cajeras: ${totalCashiers}`}
            size="small"
          />
          <Chip
            label={`Participaciones: ${totals.sumCount}`}
            size="small"
            color="primary"
          />
          <Chip
            label={`Nuevos: ${totals.sumNew}`}
            size="small"
            color="success"
          />
          <Chip
            label={`Existentes: ${totals.sumExisting}`}
            size="small"
            color="secondary"
          />
        </Stack>

        {(isLoading || isFetching) && (
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

      {/* Modal crear */}
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

      {/* Popover rango de fechas */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5 } } }}
      >
        <DateRange
          ranges={pendingRange}
          onChange={onPendingChange}
          moveRangeOnFirstSelection={false}
          showDateDisplay={false}
          weekdayDisplayFormat="EEEEEE"
          showMonthAndYearPickers={true}
          editableDateInputs={false}
          dragSelectionEnabled={true}
          minDate={minDate}
          maxDate={maxDate}
          locale={es}
          rangeColors={[theme.palette.primary.main]}
        />

        <Stack
          direction="row"
          justifyContent="flex-end"
          gap={1}
          sx={{ pt: 1 }}
        >
          <Button
            size="small"
            onClick={closePopover}
          >
            Cancelar
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={applyRange}
          >
            Aplicar
          </Button>
        </Stack>
      </Popover>
    </Card>
  );
};

export default CashiersTable;
