'use client';

import { shiftService } from '@/services/shift.service';
import { Delete, Edit, Search, Visibility } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, startOfDay } from 'date-fns';
import Image from 'next/image';
import { FC, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import ShiftPreviewModal from '../../dialogs/shift-preview';
import DeleteShiftDialog from '../../dialogs/shift/delete';
import NewShiftModal from '../../dialogs/shift/modal';

interface Sweepstake {
  id: string;
  name: string;
}

interface ShiftTableWithActionsProps {
  sweepstakes: Sweepstake[];
}
// ================= EXCEL HELPERS =================
type ShiftRow = {
  _id: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: string;
  totalParticipations?: number;
  newParticipations?: number;
  existingParticipations?: number;
  totalEarnings?: number;
  storeInfo?: {
    name?: string;
    address?: string;
    zipCode?: string;
  };
  requestedBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  promoterInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

const fmt2 = (n: number) => (Number.isFinite(n) ? Number(n.toFixed(2)) : 0);
const safeNum = (n: any) => (typeof n === 'number' && isFinite(n) ? n : 0);
const getHours = (s?: string, e?: string) => {
  if (!s || !e) return 4; // fallback
  const diff = new Date(e).getTime() - new Date(s).getTime();
  if (!isFinite(diff) || diff <= 0) return 4;
  return fmt2(diff / 36e5);
};

const getPromoterName = (row: ShiftRow) => {
  const r = row.requestedBy || {};
  const p = row.promoterInfo || {};
  const name = [r.firstName ?? p.firstName ?? '', r.lastName ?? p.lastName ?? '']
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return name || 'Sin asignar';
};

const getPromoterEmail = (row: ShiftRow) => row.requestedBy?.email || row.promoterInfo?.email || '';

const autoFit = (data: any[]) => {
  // calcula ancho de columnas (wch) simple
  const cols = Object.keys(data[0] ?? {}).map(() => ({ wch: 10 }));
  data.forEach((row) => {
    Object.values(row).forEach((val: any, i) => {
      const len =
        val == null ? 0 : typeof val === 'number' ? String(val).length : String(val).length;
      cols[i].wch = Math.max(cols[i].wch, Math.min(60, len + 2));
    });
  });
  return cols;
};

const buildExcelAndDownload = (shifts: ShiftRow[]) => {
  // ---- Agrupar por promotora ----
  const groups = new Map<
    string,
    {
      name: string;
      email: string;
      rows: ShiftRow[];
      totals: {
        shifts: number;
        hours: number;
        earnings: number;
        totalNums: number;
        newNums: number;
        existingNums: number;
      };
    }
  >();

  shifts.forEach((row) => {
    const name = getPromoterName(row);
    const email = getPromoterEmail(row);
    const hours = getHours(row.startTime, row.endTime);
    const earn = safeNum(row.totalEarnings);
    const tot = safeNum(row.totalParticipations);
    const neu = safeNum(row.newParticipations);
    const exi = safeNum(row.existingParticipations);

    if (!groups.has(name)) {
      groups.set(name, {
        name,
        email,
        rows: [],
        totals: { shifts: 0, hours: 0, earnings: 0, totalNums: 0, newNums: 0, existingNums: 0 },
      });
    }
    const g = groups.get(name)!;
    g.rows.push(row);
    g.totals.shifts += 1;
    g.totals.hours += hours;
    g.totals.earnings += earn;
    g.totals.totalNums += tot;
    g.totals.newNums += neu;
    g.totals.existingNums += exi;
  });

  // ---- Resumen por promotora ----
  const resumenRows = Array.from(groups.values()).map((g) => ({
    Promotora: g.name,
    Email: g.email,
    Turnos: g.totals.shifts,
    'Horas totales': fmt2(g.totals.hours),
    'Ganancias totales ($)': fmt2(g.totals.earnings),
    'Números totales': g.totals.totalNums,
    'Números nuevos': g.totals.newNums,
    'Números existentes': g.totals.existingNums,
  }));

  // ---- Detalle por turno ----
  const detalleRows = Array.from(groups.values())
    .flatMap((g) =>
      g.rows.map((r) => {
        const hours = getHours(r.startTime, r.endTime);
        return {
          Promotora: g.name,
          Email: g.email,
          Fecha: r.date ? new Date(r.date).toLocaleDateString() : '',
          Inicio: r.startTime ? new Date(r.startTime).toLocaleTimeString() : '',
          Fin: r.endTime ? new Date(r.endTime).toLocaleTimeString() : '',
          'Horas (turno)': hours,
          Tienda: r.storeInfo?.name ?? '',
          Dirección: r.storeInfo?.address ?? '',
          ZIP: r.storeInfo?.zipCode ?? '',
          Estado: r.status ?? '',
          'Números totales': safeNum(r.totalParticipations),
          'Números nuevos': safeNum(r.newParticipations),
          'Números existentes': safeNum(r.existingParticipations),
          'Ganancia turno ($)': fmt2(safeNum(r.totalEarnings)),
        };
      })
    )
    // ordena por Promotora y fecha
    .sort((a, b) =>
      a.Promotora === b.Promotora
        ? new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()
        : a.Promotora.localeCompare(b.Promotora)
    );

  // ---- Workbook ----
  const wb = XLSX.utils.book_new();
  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  const wsDetalle = XLSX.utils.json_to_sheet(detalleRows);

  if (resumenRows.length) wsResumen['!cols'] = autoFit(resumenRows);
  if (detalleRows.length) wsDetalle['!cols'] = autoFit(detalleRows);

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por promotora');
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle por turno');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `turnos_${today}.xlsx`);
};
// ================= /EXCEL HELPERS =================

const PAGE_SIZE_OPTIONS = [10, 12, 20, 30, 50];
const STATUS_OPTIONS = ['available', 'assigned', 'active', 'completed'] as const;
type StatusFilter = 'all' | (typeof STATUS_OPTIONS)[number];

const ShiftTableWithActions: FC<ShiftTableWithActionsProps> = ({ sweepstakes }) => {
  const theme = useTheme();

  // Filtros UI
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(12);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Modales
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Fechas en ISO para el query (controller espera startTime / endTime)
  const startISO = useMemo(
    () => (startDate ? startOfDay(startDate).toISOString() : undefined),
    [startDate]
  );
  const endISO = useMemo(() => (endDate ? endOfDay(endDate).toISOString() : undefined), [endDate]);

  // Fetch (agregamos page, limit, startTime, endTime al query)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['shifts', page, rowsPerPage, startISO, endISO /*, search*/],
    queryFn: () =>
      shiftService.getAllShifts({
        page,
        limit: rowsPerPage,
        startTime: startISO,
        endTime: endISO,
        status: status === 'all' ? undefined : status, // Si luego agregas búsqueda por texto en backend, pásala:
      }),
  });

  const shifts = data?.shifts || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return theme.palette.primary.main;
      case 'Inactivo':
        return theme.palette.grey[400];
      case 'En Progreso':
        return theme.palette.secondary.main;
      case 'available':
        return theme.palette.secondary.main;
      case 'completed':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[300];
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    // setSearch(''); // si quieres limpiar búsqueda también
    setPage(1);
  };

  return (
    <Box>
      {/* Toolbar superior: título + filtros */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        mb={2}
      >
        <Typography
          fontWeight="bold"
          fontSize={18}
        >
          Lista de Turnos ({pagination.total})
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="flex-end"
          useFlexGap
        >
          <FormControl
            size="small"
            sx={{ minWidth: 160 }}
          >
            <InputLabel id="status-label">Estado</InputLabel>
            <Select
              labelId="status-label"
              label="Estado"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="available">available</MenuItem>
              <MenuItem value="assigned">assigned</MenuItem>
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="completed">completed</MenuItem>
            </Select>
          </FormControl>

          <DatePicker
            label="Start date"
            value={startDate}
            onChange={(val) => {
              setStartDate(val);
              if (val && endDate && endOfDay(val) > endOfDay(endDate)) {
                setEndDate(val);
              }
              setPage(1);
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  minWidth: 160,
                  background: theme.palette.mode === 'dark' ? '#1f1f1f' : '#fff',
                  borderRadius: 2,
                },
              },
            }}
          />

          <DatePicker
            label="End date"
            value={endDate}
            onChange={(val) => {
              setEndDate(val);
              if (val && startDate && endOfDay(val) < startOfDay(startDate)) {
                setStartDate(val);
              }
              setPage(1);
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  minWidth: 160,
                  background: theme.palette.mode === 'dark' ? '#1f1f1f' : '#fff',
                  borderRadius: 2,
                },
              },
            }}
          />

          <Tooltip title="Exportar a Excel (agrupado por promotora)">
            <span>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => buildExcelAndDownload(shifts)}
                disabled={!shifts || shifts.length === 0}
                sx={{ textTransform: 'none' }}
              >
                Exportar Excel
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Limpiar filtros">
            <span>
              <Button
                variant="text"
                onClick={clearFilters}
                disabled={!startDate && !endDate /* && !search */}
                sx={{ textTransform: 'none' }}
              >
                Limpiar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Loading bar sutil cuando hay refetch */}
      {isFetching && <LinearProgress sx={{ mb: 1, borderRadius: 1, height: 3, opacity: 0.8 }} />}

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', height: 240 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius: 4, background: '#f9f9f9' }}>
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
                <TableRow>
                  <TableCell>Supermercados</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Impulsadora</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Pago</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                      >
                        <Image
                          src={shift.storeInfo?.image || '/placeholder-profile.png'}
                          alt={shift.supermarketName}
                          width={40}
                          height={40}
                          style={{ borderRadius: '50%' }}
                        />
                        <Box>
                          <Typography fontWeight="bold">
                            {shift.storeInfo?.name} , <b>{shift.storeInfo?.customerCount}</b>
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shift.status || 'Sin estado'}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(shift.status),
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography>{new Date(shift.date).toLocaleDateString()}</Typography>
                      <Typography variant="caption">
                        {new Date(shift.startTime).toLocaleTimeString()} -{' '}
                        {new Date(shift.endTime).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {shift.promoterId ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Avatar
                            src={shift.requestedBy.profileImage || '/placeholder-profile.png'}
                            alt={shift.promoterName}
                          />
                          <Typography>{shift.requestedBy.firstName || 'Sin asignar'}</Typography>
                        </Stack>
                      ) : (
                        <Chip
                          label="Sin asignar"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={(shift.totalParticipations / 400) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#ffe4f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.primary.main,
                            },
                          }}
                        />
                        <Typography variant="caption">{shift.totalParticipations}/400</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ${shift.totalEarnings?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        {/* Ver siempre */}
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setSelectedShiftId(shift._id);
                            setPreviewModalOpen(true);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>

                        {/* Editar solo si está activo */}
                        {shift.status === 'active' && (
                          <IconButton
                            color="secondary"
                            onClick={() => {
                              setSelectedShiftId(shift._id);
                              setEditModalOpen(true);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}

                        {/* Editar + Eliminar si NO está activo ni completado */}
                        {!['active', 'completed'].includes(shift.status) && (
                          <>
                            <IconButton
                              color="secondary"
                              onClick={() => {
                                setSelectedShiftId(shift._id);
                                setEditModalOpen(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>

                            <IconButton
                              color="error"
                              onClick={() => {
                                setDeleteModalOpen(true);
                                setSelectedShiftId(shift._id);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Barra inferior: rows per page + paginación (responsive) */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            mt={3}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <FormControl
              size="small"
              sx={{ minWidth: 150 }}
            >
              <InputLabel id="rows-per-page-label">Por página</InputLabel>
              <Select
                labelId="rows-per-page-label"
                label="Por página"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <MenuItem
                    key={n}
                    value={n}
                  >
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Pagination
              color="primary"
              variant="outlined"
              shape="rounded"
              page={page}
              count={pagination.pages}
              onChange={(_, value) => setPage(value)}
              siblingCount={1}
              boundaryCount={1}
            />
          </Stack>
        </>
      )}

      {/* Modales */}
      <ShiftPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        shiftId={selectedShiftId}
      />
      <NewShiftModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedShiftId(null);
        }}
        sweepstakes={sweepstakes}
        shiftId={selectedShiftId}
      />
      <DeleteShiftDialog
        open={deleteModalOpen}
        shiftId={selectedShiftId}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedShiftId(null);
        }}
      />
    </Box>
  );
};

export default ShiftTableWithActions;
