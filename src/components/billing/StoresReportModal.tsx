'use client';

import * as React from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useQuery } from '@tanstack/react-query';

import {
  BillingService,
  billingQK,
  type MembershipType,
  type PaymentMethod,
} from '@/services/billing.service';

type Props = {
  open: boolean;
  onClose: () => void;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  periods?: number;
  paymentMethod?: PaymentMethod | null;
  membershipType?: MembershipType | 'all' | null;
};

type Row = {
  storeId: string | number;
  name: string;
  sms: number;
  mms: number;
  totalSmsMms: number;
  optinCost: number;
  membershipSubtotal: number;
  grandTotal: number;
  detail: {
    campaigns: { sms: number; mms: number; total: number; hasRules?: boolean };
    optin: { count: number; unitPrice: number; cost: number };
    membership: {
      unitFee: number;
      periods: number;
      subtotal: number;
      type?: MembershipType | 'none';
    };
  };
};

const numberFmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const columns = [
  { id: 'name', label: 'NOMBRE' as const, align: 'left' as const, numeric: false },
  { id: 'sms', label: 'SMS' as const, align: 'right' as const, numeric: true },
  { id: 'mms', label: 'MMS' as const, align: 'right' as const, numeric: true },
  { id: 'totalSmsMms', label: 'TOTAL SMS+MMS' as const, align: 'right' as const, numeric: true },
  { id: 'optinCost', label: 'OPT-IN' as const, align: 'right' as const, numeric: true },
  { id: 'membershipSubtotal', label: 'MEMBRESÍA' as const, align: 'right' as const, numeric: true },
  { id: 'grandTotal', label: 'GRAN TOTAL' as const, align: 'right' as const, numeric: true },
];

type OrderBy = typeof columns[number]['id'];
type OrderDir = 'asc' | 'desc';

/** Normaliza el tipo de membresía desde varias claves posibles del API y/o filtro UI. */
const pickMembershipType = (
  s: Record<string, unknown>,
  uiFilter: MembershipType | 'all' | null,
): MembershipType | 'none' => {
  const membership = (s.membership as Record<string, unknown> | undefined) ?? undefined;

  const raw =
    (membership?.type as string | undefined) ??
    (membership?.membershipType as string | undefined) ??
    (membership?.planType as string | undefined) ??
    (s as { membership_type?: string }).membership_type ??
    (s as { membershipType?: string }).membershipType ??
    (s as { planType?: string }).planType ??
    null;

  if (!raw) {
    if (uiFilter && uiFilter !== 'all') return uiFilter;
    return 'none';
  }

  const key = String(raw).toLowerCase();
  if (key === 'mensual' || key === 'monthly') return 'mensual';
  if (key === 'semanal' || key === 'weekly') return 'semanal';
  if (key === 'especial' || key === 'special') return 'especial';
  return key as MembershipType;
};

/** Para mostrar el tipo en español. */
const prettyMembership = (t?: string) => {
  if (!t || t === 'none') return '—';
  const key = String(t).toLowerCase();
  switch (key) {
    case 'mensual':
    case 'monthly':
      return 'Mensual';
    case 'semanal':
    case 'weekly':
      return 'Semanal';
    case 'especial':
    case 'special':
      return 'Especial';
    default:
      return t;
  }
};

export default function StoresReportModal({
  open,
  onClose,
  start,
  end,
  periods,
  paymentMethod,
  membershipType,
}: Props) {
  const [query, setQuery] = React.useState('');
  const [orderBy, setOrderBy] = React.useState<OrderBy>('grandTotal');
  const [orderDir, setOrderDir] = React.useState<OrderDir>('desc');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  // Fetch
  const svc = React.useMemo(() => new BillingService(), []);
  const { data, isLoading } = useQuery({
    enabled: open && !!start && !!end,
    queryKey: billingQK.storesReport({
      start,
      end,
      periods,
      paymentMethod: paymentMethod ?? undefined,
      membershipType: (membershipType === 'all' ? undefined : membershipType) ?? undefined,
    }),
    queryFn: async () => {
      const res = await svc.getStoresRangeReport({
        start,
        end,
        periods,
        paymentMethod: paymentMethod ?? undefined,
        membershipType: (membershipType === 'all' ? undefined : membershipType) ?? undefined,
      });
      return res.data;
    },
  });

  // Normaliza data -> filas
  const rows: Row[] = React.useMemo(() => {
    if (!data?.stores?.length) return [];
    return data.stores.map((s: unknown) => {
      const src = s as Record<string, unknown>;

      const sms = Number((src as any)?.campaigns?.sms ?? 0);
      const mms = Number((src as any)?.campaigns?.mms ?? 0);
      const total = Number((src as any)?.campaigns?.total ?? sms + mms);
      const optCost = Number((src as any)?.optin?.cost ?? 0);
      const membSub = Number((src as any)?.membership?.subtotal ?? 0);
      const grand = Number((src as any)?.total ?? total + membSub);

      return {
        storeId:
          (src as any)?.storeId ??
          (src as any)?.id ??
          (src as any)?.store_id ??
          (src as any)?.name,
        name: (src as any)?.name ?? (src as any)?.storeName ?? '—',
        sms,
        mms,
        totalSmsMms: total,
        optinCost: optCost,
        membershipSubtotal: membSub,
        grandTotal: grand,
        detail: {
          campaigns: {
            sms,
            mms,
            total,
            hasRules: Boolean((src as any)?.campaigns?.hasRules),
          },
          optin: {
            count: Number((src as any)?.optin?.count ?? 0),
            unitPrice: Number((src as any)?.optin?.unitPrice ?? 0),
            cost: optCost,
          },
          membership: {
            unitFee: Number((src as any)?.membership?.unitFee ?? 0),
            periods: Number((src as any)?.membership?.periods ?? 0),
            subtotal: membSub,
            type: pickMembershipType(src, membershipType ?? null),
          },
        },
      };
    });
  }, [data, membershipType]);

  // Orden por encabezado
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && orderDir === 'asc';
    setOrderBy(property);
    setOrderDir(isAsc ? 'desc' : 'asc');
    setPage(0);
  };

  // Buscar + ordenar
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = rows;
    if (q) {
      arr = arr.filter((r) => r.name.toLowerCase().includes(q));
    }

    arr = [...arr].sort((a, b) => {
      const A = (a as unknown as Record<string, unknown>)[orderBy];
      const B = (b as unknown as Record<string, unknown>)[orderBy];
      const mul = orderDir === 'asc' ? 1 : -1;

      if (typeof A === 'string' && typeof B === 'string') {
        return (A as string).localeCompare(B as string) * mul;
      }
      return (Number(A) - Number(B)) * mul;
    });

    return arr;
  }, [rows, query, orderBy, orderDir]);

  // Paginación
  const paged = React.useMemo(() => {
    const startIdx = page * rowsPerPage;
    return filtered.slice(startIdx, startIdx + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Totales (dataset filtrado actual)
  const totals = React.useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.sms += r.sms;
        acc.mms += r.mms;
        acc.total += r.totalSmsMms;
        acc.opt += r.optinCost;
        acc.memb += r.membershipSubtotal;
        acc.grand += r.grandTotal;
        return acc;
      },
      { sms: 0, mms: 0, total: 0, opt: 0, memb: 0, grand: 0 },
    );
  }, [filtered]);

  // Fila expandible
  const RowItem: React.FC<{ row: Row }> = ({ row }) => {
    const [openRow, setOpenRow] = React.useState(false);

    return (
      <>
        <TableRow
          hover
          onClick={() => setOpenRow((v) => !v)}
          sx={{ cursor: 'pointer' }}
        >
          <TableCell sx={{ pl: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <ExpandMoreTwoToneIcon
                sx={{
                  transform: openRow ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: '0.2s',
                }}
              />
              <Typography fontWeight={600}>{row.name}</Typography>
            </Stack>
          </TableCell>
          <TableCell align="right">${numberFmt(row.sms)}</TableCell>
          <TableCell align="right">${numberFmt(row.mms)}</TableCell>
          <TableCell align="right">${numberFmt(row.totalSmsMms)}</TableCell>
          <TableCell align="right">${numberFmt(row.optinCost)}</TableCell>
          <TableCell align="right">${numberFmt(row.membershipSubtotal)}</TableCell>
          <TableCell align="right">${numberFmt(row.grandTotal)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell
            colSpan={7}
            sx={{ py: 0, border: 0 }}
          >
            <Collapse
              in={openRow}
              timeout="auto"
              unmountOnExit
            >
              <Box sx={{ px: 1, py: 1 }}>
                <Grid
                  container
                  columns={{ xs: 1, md: 12 }}
                  columnSpacing={{ xs: 2, md: 3 }}
                  rowSpacing={{ xs: 1, md: 0.75 }}
                  alignItems="flex-start"
                >
                  {/* Campañas */}
                  <Grid
                    item
                    xs={1}
                    md={2}
                  >
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Campañas</Typography>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                      >
                        <Typography variant="body2">SMS:</Typography>
                        <strong>${numberFmt(row.detail.campaigns.sms)}</strong>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                      >
                        <Typography variant="body2">MMS:</Typography>
                        <strong>${numberFmt(row.detail.campaigns.mms)}</strong>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                      >
                        <Typography variant="body2">Total (SMS + MMS):</Typography>
                        <strong>${numberFmt(row.detail.campaigns.total)}</strong>

                        {row.detail.campaigns.hasRules && (
                          <Tooltip title="Este total puede aplicar reglas de cálculo">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              (i)
                            </Typography>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Opt-in */}
                  <Grid
                    item
                    xs={1}
                    md={2}
                  >
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Opt-in</Typography>

                      <Typography variant="body2">
                        Audiencia: <strong>{row.detail.optin.count}</strong>
                      </Typography>

                      <Typography variant="body2">
                        Costo por Mensaje:{' '}
                        <strong>${numberFmt(row.detail.optin.unitPrice)}</strong>
                      </Typography>

                      <Typography variant="body2">
                        Total: <strong>${numberFmt(row.detail.optin.cost)}</strong>
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Membresía */}
                  <Grid
                    item
                    xs={1}
                    md={2}
                  >
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Membresía</Typography>

                      <Typography variant="body2">
                        Tipo:{' '}
                        <Chip
                          size="small"
                          label={prettyMembership(row.detail.membership.type)}
                        />
                      </Typography>

                      <Typography variant="body2">
                        Costo:{' '}
                        <strong>${numberFmt(row.detail.membership.unitFee)}</strong>
                      </Typography>

                      <Typography variant="body2">
                        Periodos: <strong>{row.detail.membership.periods}</strong>
                      </Typography>

                      <Typography variant="body2">
                        Total:{' '}
                        <strong>${numberFmt(row.detail.membership.subtotal)}</strong>
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Resumen por tiendas</Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Cabecera con rango + búsqueda */}
        <Toolbar
          disableGutters
          sx={{ mb: 1.5, gap: 1.5, flexWrap: 'wrap' }}
        >
          <Typography
            variant="body2"
            sx={{ mr: 1 }}
          >
            Rango:&nbsp;<strong>{start}</strong> → <strong>{end}</strong>
            {typeof periods === 'number' && (
              <>
                &nbsp;&middot;&nbsp;Periods: <strong>{periods}</strong>
              </>
            )}
          </Typography>

          <TextField
            size="small"
            placeholder="Buscar tienda"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>

        <Paper variant="outlined">
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table
              stickyHeader
              size="small"
              sx={{
                '& th, & td': { py: 0.5, px: 1 },
                '& th': { fontSize: 12, whiteSpace: 'nowrap' },
                '& td': { fontSize: 13, whiteSpace: 'nowrap' },
              }}
            >
              <TableHead>
                <TableRow>
                  {columns.map((c) => (
                    <TableCell
                      key={c.id}
                      align={c.align}
                    >
                      <TableSortLabel
                        active={orderBy === c.id}
                        direction={orderBy === c.id ? orderDir : 'asc'}
                        onClick={() => handleRequestSort(c.id)}
                      >
                        {c.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                    >
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : paged.length ? (
                  paged.map((row) => (
                    <RowItem
                      // eslint-disable-next-line react/no-array-index-key
                      key={row.storeId}
                      row={row}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2 }}
                      >
                        Sin resultados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell align="left">
                    <strong>Totales (filtro actual)</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>${numberFmt(totals.sms)}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>${numberFmt(totals.mms)}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>${numberFmt(totals.total)}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>${numberFmt(totals.opt)}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>${numberFmt(totals.memb)}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>${numberFmt(totals.grand)}</strong>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            rowsPerPageOptions={[25, 50, 100]}
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      </DialogContent>
    </Dialog>
  );
}
