'use client';

import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'in progress', label: 'Activo' },
  { value: 'completed', label: 'Finalizado' },
  { value: 'draft', label: 'Borrador' },
];

export default function SweepstakesTable() {
  const [filters, setFilters] = useState({ status: '', name: '' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { data: sweepstakes, isLoading, error, isFetching } = useSweepstakes(filters);

  // Filtros handlers
  const handleStatusChange = (e) => setFilters((f) => ({ ...f, status: e.target.value }));
  const handleNameChange = (e) => setFilters((f) => ({ ...f, name: e.target.value }));

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
                    <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Participantes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tiendas</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Inicio</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Fin</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Imagen</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sweepstakes.map((sw) => (
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
                      <TableCell sx={{ fontWeight: 500 }}>{sw.name}</TableCell>
                      <TableCell>
                        <Chip
                          color="primary"
                          label={sw.participants}
                          sx={{ fontWeight: 600 }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          color="secondary"
                          label={sw.stores}
                          sx={{ fontWeight: 600 }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(sw.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(sw.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={sw.status}
                          color={
                            sw.status === 'active'
                              ? 'success'
                              : sw.status === 'completed'
                                ? 'info'
                                : 'default'
                          }
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {sw.image ? (
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
                        ) : (
                          <Chip
                            label="Sin imagen"
                            size="small"
                          />
                        )}
                      </TableCell>
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
                          <Tooltip title="Configuración">
                            <IconButton color="secondary">
                              <SettingsIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Fade>
    </Box>
  );
}
