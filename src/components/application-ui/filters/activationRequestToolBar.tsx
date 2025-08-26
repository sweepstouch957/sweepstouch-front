// src/components/application-ui/filters/ActivationRequestsToolbar.tsx
'use client';

import type { ActivationStatus } from '@/services/activation.service';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

export type ToolbarStatus = ActivationStatus | 'all';

interface Props {
  // métricas
  totalItems: number;
  showingFrom: number;
  showingTo: number;

  // paginación
  page: number;
  totalPages: number;
  rowsPerPage: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;

  // filtros controlados
  status: ToolbarStatus;
  email: string;

  // notifica cambios de filtros al padre (hook/página)
  onFilterChange: (next: { status?: ActivationStatus; email?: string }) => void;
}

const DEFAULT_PAGE_SIZES = [12, 24, 36];

export default function ActivationRequestsToolbar({
  totalItems,
  showingFrom,
  showingTo,
  page,
  totalPages,
  rowsPerPage,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageChange,
  onRowsPerPageChange,
  status,
  email,
  onFilterChange,
}: Props) {
  const theme = useTheme();

  // Estado local para debounce del email (UI → 300ms → parent)
  const [emailInput, setEmailInput] = useState(email ?? '');

  useEffect(() => {
    setEmailInput(email ?? '');
  }, [email]);

  useEffect(() => {
    const id = setTimeout(() => {
      const trimmed = emailInput.trim();
      onFilterChange({ email: trimmed || undefined });
      // al cambiar filtros, lo ideal es resetear a página 1 en el padre
      // (tu hook ya lo hace al detectar cambios en filters)
    }, 300);
    return () => clearTimeout(id);
  }, [emailInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultText = useMemo(() => {
    return totalItems ? `Mostrando ${showingFrom}–${showingTo} de ${totalItems}` : 'Sin resultados';
  }, [totalItems, showingFrom, showingTo]);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      mt={4}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.04)'
            : 'linear-gradient(180deg, #fff, #fafafa)',
      }}
    >
      <Typography
        variant="body2"
        sx={{ opacity: 0.8 }}
      >
        {resultText}
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.25, sm: 2 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent={{ xs: 'center', sm: 'flex-end' }}
        sx={{
          width: '100%',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 2 },
        }}
      >
        {/* Filtro: estado */}
        <FormControl
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 180 } }}
        >
          <InputLabel id="status-filter-label">Estado</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Estado"
            value={status ?? 'all'}
            onChange={(e) => {
              const v = e.target.value as ToolbarStatus;
              onFilterChange({ status: v === 'all' ? undefined : (v as ActivationStatus) });
            }}
            sx={{ width: '100%', '& .MuiSelect-select': { py: 1.0 } }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="aprobado">Aprobado</MenuItem>
            <MenuItem value="rechazado">Rechazado</MenuItem>
          </Select>
        </FormControl>

        {/* Buscador: email */}
        <TextField
          size="small"
          label="Buscar por email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="ej. alguien@mail.com"
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: emailInput ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setEmailInput('')}
                  aria-label="Limpiar búsqueda"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />

        {/* Tamaño de página */}
        <FormControl
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 140 } }}
        >
          <InputLabel id="rows-per-page-label">Por página</InputLabel>
          <Select
            labelId="rows-per-page-label"
            label="Por página"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            sx={{ width: '100%', '& .MuiSelect-select': { py: 1.0 } }}
          >
            {pageSizeOptions.map((n) => (
              <MenuItem
                key={n}
                value={n}
              >
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Paginación */}
        <Box
          sx={{
            width: { xs: '100%', sm: 'auto' },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Pagination
            color="primary"
            variant="outlined"
            shape="rounded"
            page={page}
            count={totalPages}
            onChange={(_, value) => onPageChange(value)}
            siblingCount={1}
            boundaryCount={1}
            hidePrevButton={totalPages <= 1}
            hideNextButton={totalPages <= 1}
            sx={{
              '& .MuiPagination-ul': {
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: { xs: 0.5, sm: 0.75 },
              },
              '& .MuiPaginationItem-root': {
                minWidth: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                fontSize: { xs: 12, sm: 14 },
              },
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
