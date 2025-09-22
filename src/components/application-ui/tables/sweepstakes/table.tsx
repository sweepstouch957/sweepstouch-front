'use client';

import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
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
  useMediaQuery,
  useTheme,
  ButtonBase,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';



const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'in progress', label: 'Activo' },
  { value: 'completed', label: 'Finalizado' },
  { value: 'draft', label: 'Borrador' },
];

// Helpers
const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '-');

const getChecklist = (sw: any) => {
  // soporto posibles typos del backend: checklistProgress / checkllsitPorgress
  const progress = sw?.checklistProgress ?? sw?.checkllsitPorgress ?? sw?.checkListProgress ?? 0;
  const total = 7;
  const pct = Math.max(0, Math.min(100, Math.round((progress / total) * 100)));
  let label = 'Borrador';
  let color: 'default' | 'warning' | 'success' = 'default';
  if (progress >= total) {
    label = 'Completo';
    color = 'success';
  } else if (progress > 0) {
    label = 'En progreso';
    color = 'warning';
  }
  return { progress, total, pct, label, color };
};

const getStatusChip = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'in progress' || s === 'active') {
    return { color: 'warning' as const, label: 'En curso' };
  }
  if (s === 'completed') {
    return { color: 'success' as const, label: 'Finalizado' };
  }
  if (s === 'draft') {
    return { color: 'default' as const, label: 'Borrador' };
  }
  return { color: 'default' as const, label: status || '—' };
};

export default function SweepstakesTable() {
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [filters, setFilters] = useState({ status: '', name: '' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { data: sweepstakes, isLoading, error, isFetching } = useSweepstakes(filters);

  // Filtros handlers
  const handleStatusChange = (e: any) => setFilters((f) => ({ ...f, status: e.target.value }));
  const handleNameChange = (e: any) => setFilters((f) => ({ ...f, name: e.target.value }));

  // ...dentro del componente, antes del return:
  const sortedSweepstakes = (sweepstakes ?? [])
    .slice()
    .sort((a: any, b: any) => (Number(b.participants) || 0) - (Number(a.participants) || 0));

  return (
    <Box>
      {/* Filtros */}
      <Paper
        sx={{
          mb: 2,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          background: theme.palette.mode === 'light' ? '#f9fafb' : '#181818',
        }}
        elevation={0}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          alignItems={isMobile ? 'stretch' : 'center'}
        >
          <TextField
            placeholder="Buscar por nombre..."
            size="small"
            value={filters.name}
            onChange={handleNameChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 2, minWidth: 180 }}
          />
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            size="small"
            sx={{
              flex: 1,
              minWidth: 150,
              background: theme.palette.background.paper,
              fontWeight: 500,
            }}
            variant="outlined"
          >
            {statusOptions.map((s) => (
              <MenuItem
                key={s.value}
                value={s.value}
              >
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Paper>

      {/* Tabla */}
      <Fade in={!isLoading && !error}>
        <Box>
          {isLoading || isFetching ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="240px"
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography
              color="error"
              align="center"
            >
              Error al cargar los sweepstakes
            </Typography>
          ) : !sweepstakes?.length ? (
            <Typography
              align="center"
              color="text.secondary"
              sx={{ py: 6 }}
            >
              No hay sorteos registrados.
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                mt: 2,
                overflowX: 'auto',
                maxHeight: '70vh',
                '&::-webkit-scrollbar': {
                  height: 7,
                  borderRadius: 8,
                },
              }}
            >
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 170 }}>Cheklist</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Participantes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tiendas Afiliadas</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Fechas</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Imagen</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedSweepstakes.map((sw: any) => {
                    const { progress, total, pct, label, color } = getChecklist(sw);
                    const statusChip = getStatusChip(sw.status);

                    return (
                      <TableRow
                        key={sw.id}
                        hover
                        sx={{
                          transition: 'box-shadow 0.2s',
                          '&:hover': {
                            boxShadow: '0 4px 16px 0 rgba(0,0,0,0.06)',
                            background: theme.palette.action.hover,
                          },
                        }}
                      >
                        {/* Nombre */}
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Stack spacing={0.3}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 700 }}
                            >
                              {sw.name}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Creación: chip + progreso x/7 */}
                        <TableCell>
                          <Stack spacing={1}>
                            <Chip
                              label={label}
                              color={color}
                              size="small"
                              sx={{ fontWeight: 700, alignSelf: 'flex-start' }}
                            />
                            <Stack spacing={0.5}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                  height: 8,
                                  borderRadius: 999,
                                  bgcolor:
                                    theme.palette.mode === 'light'
                                      ? '#e9edf5'
                                      : 'rgba(255,255,255,0.12)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 999,
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {progress}/{total} completado
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>

                        {/* Participantes */}
                        <TableCell>
                          <Chip
                            color="primary"
                            label={sw.participants}
                            sx={{ fontWeight: 600 }}
                            size="small"
                          />
                        </TableCell>

                        {/* Tiendas */}
                        <TableCell>
                          <Chip
                            color="secondary"
                            label={sw.stores}
                            sx={{ fontWeight: 600 }}
                            size="small"
                          />
                        </TableCell>

                        {/* Fechas (Inicio y Fin en la misma celda) */}
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <CalendarMonthIcon
                              fontSize="small"
                              color="action"
                            />
                            <Stack spacing={0.25}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {formatDate(sw.startDate)} — {formatDate(sw.endDate)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Inicio — Fin
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          <Chip
                            label={statusChip.label}
                            color={statusChip.color as any}
                            size="small"
                            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                          />
                        </TableCell>

                        {/* Imagen */}
                        <TableCell>
                          {sw.image ? (
                            <Tooltip title="Ver imagen">
                              <ButtonBase
                                onClick={() => setPreview({ url: sw.image, name: sw.name })}
                                sx={{ borderRadius: 2, cursor: 'zoom-in' }}
                                aria-label={`Ver imagen de ${sw.name}`}
                              >
                                <Avatar
                                  src={sw.image}
                                  alt={sw.name}
                                  variant="rounded"
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    boxShadow: 1,
                                    borderRadius: 2,
                                    border: '2px solid #e2e8f0',
                                  }}
                                />
                              </ButtonBase>
                            </Tooltip>
                          ) : (
                            <Chip
                              label="Sin imagen"
                              size="small"
                            />
                          )}
                        </TableCell>

                        {/* Acciones: Ver, Editar, Configuración */}
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1}
                          >
                            <Tooltip title="Ver estadísticas">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  router.push(`/admin/management/sweepstakes/${sw.id}/stats`)
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar">
                              <IconButton
                                color="info"
                                onClick={() =>
                                  router.push(`/admin/management/sweepstakes/${sw.id}/checklist`)
                                }
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

      </Fade>
      <Dialog
        open={!!preview}
        onClose={() => setPreview(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{preview?.name ?? 'Imagen'}</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box
            component="img"
            src={preview?.url ?? ''}
            alt={preview?.name ?? 'preview'}
            sx={{ width: '100%', height: 'auto', display: 'block', borderRadius: 1 }}
          />
        </DialogContent>
      </Dialog>
    </Box>

  );

}
