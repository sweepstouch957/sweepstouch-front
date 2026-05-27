'use client';

import { useStores } from '@/hooks/fetching/stores/useStores';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SearchIcon from '@mui/icons-material/Search';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { StoresMapCanvas } from './StoresMapCanvas';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_OPTIONS: { value: StatusFilter; label: string; color?: 'success' | 'error' }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas', color: 'success' },
  { value: 'inactive', label: 'Inactivas', color: 'error' },
];

const MapboxMap = () => {
  const { data: stores, isLoading, error } = useStores();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [minCustomers, setMinCustomers] = useState('');
  const [maxCustomers, setMaxCustomers] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStores = useMemo(() => {
    const min = minCustomers !== '' ? Number(minCustomers) : null;
    const max = maxCustomers !== '' ? Number(maxCustomers) : null;
    return (
      stores?.filter((store) => {
        const count = store.customerCount || 0;
        if (!store.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter === 'active' && !store.active) return false;
        if (statusFilter === 'inactive' && store.active) return false;
        if (min !== null && count < min) return false;
        if (max !== null && count > max) return false;
        return true;
      }) ?? []
    );
  }, [stores, statusFilter, minCustomers, maxCustomers, searchTerm]);

  const sumAudience = useMemo(
    () => filteredStores.reduce((s, st) => s + (st.customerCount || 0), 0),
    [filteredStores],
  );

  const exportToExcel = () => {
    const data = filteredStores.map((s) => ({
      Tienda: s.name,
      Clientes: s.customerCount,
      Activa: s.active ? 'Sí' : 'No',
      Direccion: s.address,
      CodigoPostal: s.zipCode,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tiendas');
    XLSX.writeFile(wb, 'tiendas.xlsx');
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton
          variant="rounded"
          height={56}
          sx={{ mb: 1.5 }}
        />
        <Skeleton
          variant="rounded"
          height={600}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        py={4}
      >
        <Typography
          color="error"
          variant="h6"
        >
          Error cargando las tiendas.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter bar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          mb: 1.5,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar tienda..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  fontSize="small"
                  sx={{ color: 'text.disabled' }}
                />
              </InputAdornment>
            ),
          }}
          sx={{ width: 200 }}
        />

        <Box
          sx={{ width: '1px', height: 28, bgcolor: 'divider', display: { xs: 'none', md: 'block' } }}
        />

        <Box
          display="flex"
          alignItems="center"
          gap={0.75}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mr: 0.25 }}
          >
            Estado
          </Typography>
          {STATUS_OPTIONS.map(({ value, label, color }) => (
            <Chip
              key={value}
              label={label}
              size="small"
              onClick={() => setStatusFilter(value)}
              variant={statusFilter === value ? 'filled' : 'outlined'}
              color={statusFilter === value ? (color ?? 'primary') : 'default'}
              sx={{
                cursor: 'pointer',
                fontWeight: statusFilter === value ? 600 : 400,
                transition: 'all 150ms ease-out',
              }}
            />
          ))}
        </Box>

        <Box
          sx={{ width: '1px', height: 28, bgcolor: 'divider', display: { xs: 'none', md: 'block' } }}
        />

        <Box
          display="flex"
          alignItems="center"
          gap={1}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
          >
            Clientes
          </Typography>
          <TextField
            size="small"
            placeholder="Mín"
            value={minCustomers}
            onChange={(e) => setMinCustomers(e.target.value.replace(/\D/g, ''))}
            inputProps={{ inputMode: 'numeric' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon
                    fontSize="small"
                    sx={{ color: 'text.disabled' }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ width: 110 }}
          />
          <Typography
            variant="body2"
            color="text.disabled"
            lineHeight={1}
          >
            —
          </Typography>
          <TextField
            size="small"
            placeholder="Máx"
            value={maxCustomers}
            onChange={(e) => setMaxCustomers(e.target.value.replace(/\D/g, ''))}
            inputProps={{ inputMode: 'numeric' }}
            sx={{ width: 110 }}
          />
        </Box>

        <Box flex={1} />

        <Box
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.primary"
              lineHeight={1.3}
            >
              <b>{filteredStores.length}</b>{' '}
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                tiendas
              </Typography>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {sumAudience.toLocaleString()} clientes
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
            onClick={exportToExcel}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      <StoresMapCanvas stores={filteredStores} />
    </Box>
  );
};

export default MapboxMap;
