'use client';

import { useCashierCount, useCashiers, useCreateCashier } from '@/services/cashier.service';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import * as React from 'react';

type Row = {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  accessCode?: string;
  code?: string;
  access_code?: string;
  createdAt?: string;
  [k: string]: any;
};

interface Props {
  storeId?: string;
}

const getDisplayName = (r: Row) => {
  const full = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
  return full || r.name || '-';
};

const getAccessCode = (r: Row) => r.accessCode ?? r.code ?? r.access_code ?? '-';

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const CashiersTable: React.FC<Props> = ({ storeId }) => {
  // UI state
  const [q, setQ] = React.useState('');
  const qDebounced = useDebounced(q, 350);

  const [page0, setPage0] = React.useState(0); // MUI es 0-based
  const [limit, setLimit] = React.useState(10);

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', phoneNumber: '', email: '' });

  // Memo de params para no recrear el objeto en cada render
  const listParams = React.useMemo(
    () => ({
      storeId,
      q: qDebounced || undefined,
      page: page0 + 1, // backend 1-based
      limit,
    }),
    [storeId, qDebounced, page0, limit]
  );

  // Queries
  const {
    data: listData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useCashiers(listParams, {
    enabled: Boolean(storeId),
    keepPreviousData: true,
  });

  // Conteo por tienda (opcional: si tu endpoint de lista ya trae total, usamos ese)
  const { data: countData } = useCashierCount(storeId || undefined, undefined);

  const total = listData?.total ?? (typeof countData?.total === 'number' ? countData.total : 0);

  const rows: Row[] = React.useMemo(() => {
    if (!listData) return [];
    // Tu servicio tipado regresa { data: CashierUser[] }
    // por si en algún entorno viene como items o docs
    return (listData.data as Row[]) ?? (listData as any).items ?? (listData as any).docs ?? [];
  }, [listData]);

  // Mutación: crear cajera
  const createMut = useCreateCashier({
    onSuccess: () => {
      setOpen(false);
      setForm({ name: '', phoneNumber: '', email: '' });
      setPage0(0);
    },
    onError: () => {
      alert('No se pudo crear la cajera');
    },
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

  const loadLabel = isLoading ? 'Cargando…' : isFetching ? 'Actualizando…' : null;

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
            Cajeras
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
            {(error as any)?.message ?? 'Error cargando cajeras'}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Access code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r._id}
                  hover
                >
                  <TableCell>{getDisplayName(r)}</TableCell>
                  <TableCell>{r.phoneNumber || '-'}</TableCell>
                  <TableCell>{r.email || '-'}</TableCell>
                  <TableCell>{getAccessCode(r)}</TableCell>
                </TableRow>
              ))}
              {!rows.length && !isLoading && !isFetching && (
                <TableRow>
                  <TableCell colSpan={4}>
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
          </Table>
        </TableContainer>

        <Box p={2}>
          <TablePagination
            component="div"
            count={total ?? 0}
            page={page0}
            onPageChange={(_, p) => setPage0(p)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage0(0);
            }}
            rowsPerPageOptions={[5, 10, 15, 25]}
          />
        </Box>
      </CardContent>

      {/* Dialog crear */}
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
  );
};

export default CashiersTable;
