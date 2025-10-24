'use client';
import * as React from 'react';
//import dayjs from 'dayjs';
import {
    Box, Card, CardContent, Typography, Stack, TextField, InputAdornment, Button,
    Divider, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead,
    TableRow, TableCell, TableBody, TableContainer, TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { listCashiers, createCashier, getCashierCountByStore } from '@/services/cashier.service';

type Row = {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phoneNumber: string;
    email?: string;
    accessCode?: string;   // <- nuevo
    code?: string;         // <- fallback
    createdAt?: string;
    // access_code también podría venir con snake_case desde el backend
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

const CashiersTable: React.FC<Props> = ({ storeId }) => {
    const [q, setQ] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(10);
    const [rows, setRows] = React.useState<Row[]>([]);
    const [total, setTotal] = React.useState(0);
    const [isLoading, setLoading] = React.useState(false);
    const [isFetching, setFetching] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!storeId) return;
        const first = rows.length === 0;
        try {
            first ? setLoading(true) : setFetching(true);

            const res: any = await listCashiers({ storeId, q, page, limit });
            const list = res?.data ?? res?.items ?? res ?? [];
            setRows(list);

            let count =
                (await getCashierCountByStore(storeId)) ??
                res?.total ??
                res?.count ??
                list.length;

            setTotal(typeof count === 'number' ? count : 0);
        } catch (err) {
            console.error('cashiers load error', err);
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [storeId, q, page, limit]);

    React.useEffect(() => { load(); }, [load]);

    const [open, setOpen] = React.useState(false);
    const [form, setForm] = React.useState({ name: '', phoneNumber: '', email: '' });

    const onCreate = async (): Promise<void> => {
        try {
            if (!form.name || !form.phoneNumber || !storeId) return;
            await createCashier({ ...form, storeId });
            setOpen(false);
            setForm({ name: '', phoneNumber: '', email: '' });
            setPage(1);
            await load();
        } catch (err) {
            console.error('create cashier failed', err);
            alert('No se pudo crear la cajera');
        }
    };

    const loadLabel = isLoading ? 'Cargando…' : (isFetching ? 'Actualizando…' : null);

    return (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent>
                <Stack direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={2}
                    flexWrap="wrap">
                    <Typography
                        variant="h5"
                        fontWeight={700}>Cajeras</Typography>
                    <Stack direction="row"
                        gap={2}>
                        <TextField
                            placeholder="Buscar por nombre, teléfono o email"
                            size="small"
                            value={q}
                            onChange={(e) => { setQ(e.target.value); setPage(1); }}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
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
                    <Typography variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}>
                        {loadLabel}
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
                                <TableCell>Access code</TableCell> {/* <- nuevo (reemplaza "Creado") */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r._id}
                                    hover>
                                    <TableCell>{getDisplayName(r)}</TableCell>
                                    <TableCell>{r.phoneNumber || '-'}</TableCell>
                                    <TableCell>{r.email || '-'}</TableCell>
                                    <TableCell>{getAccessCode(r)}</TableCell> {/* <- nuevo */}
                                </TableRow>
                            ))}
                            {!rows.length && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography textAlign="center"
                                            py={3}>Sin registros</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box p={2}>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page - 1}
                        onPageChange={(_, p) => setPage(p + 1)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                        rowsPerPageOptions={[5, 10, 15, 25]}
                    />
                </Box>
            </CardContent>

            <Dialog open={open}
                onClose={() => setOpen(false)}>
                <DialogTitle>Nueva Cajera</DialogTitle>
                <DialogContent>
                    <Stack gap={2}
                        mt={1}
                        sx={{ minWidth: 320 }}>
                        <TextField label="Nombre"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <TextField label="Teléfono"
                            value={form.phoneNumber}
                            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                        <TextField label="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={onCreate}
                        variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default CashiersTable;
