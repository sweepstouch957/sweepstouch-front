'use client';

import { Edit, FileDownloadOutlined, SearchTwoTone } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrands } from '@/hooks/fetching/brands/useBrands';
import { Brand } from '@/services/brand.service';
import { BrandCreationModal } from '@/components/admin/stores/BrandCreationModal';
import { CircularProgress } from '@mui/material';
import { exportBrandsExcel } from './exportBrandsExcel';

type StatusFilter = 'all' | 'active' | 'inactive';
const STATUS_LABEL: Record<StatusFilter, string> = { all: 'Todas', active: 'Activas', inactive: 'Inactivas' };

export default function BrandListing() {
  const { t } = useTranslation();
  const { data: brandsRes, isLoading } = useBrands();
  const brands: Brand[] = Array.isArray(brandsRes) ? brandsRes : (brandsRes?.data || []);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [editBrand, setEditBrand] = useState<Brand | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brands.filter((b) => {
      if (status === 'active' && b.active === false) return false;
      if (status === 'inactive' && b.active !== false) return false;
      return !q || (b.name || '').toLowerCase().includes(q) || (b.slug || '').toLowerCase().includes(q);
    });
  }, [brands, search, status]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        py={2}
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <TextField
          size="small"
          placeholder={t('Search brands by name')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchTwoTone />
              </InputAdornment>
            )
          }}
          sx={{ maxWidth: 420, flex: 1 }}
        />
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={status}
            onChange={(_, v: StatusFilter | null) => {
              if (v) {
                setStatus(v);
                setPage(0);
              }
            }}
          >
            <ToggleButton value="all">Todas</ToggleButton>
            <ToggleButton value="active">Activas</ToggleButton>
            <ToggleButton value="inactive">Inactivas</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlined />}
            disabled={filtered.length === 0}
            onClick={() => exportBrandsExcel(filtered, STATUS_LABEL[status])}
          >
            Exportar Excel ({filtered.length})
          </Button>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('Logo')}</TableCell>
              <TableCell>{t('Name')}</TableCell>
              <TableCell>{t('Slug')}</TableCell>
              <TableCell>{t('Status')}</TableCell>
              <TableCell align="center">Tiendas</TableCell>
              <TableCell align="right">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((brand) => (
              <TableRow hover key={brand.id || brand._id}>
                <TableCell>
                  <Avatar
                    variant="rounded"
                    src={brand.image}
                    sx={{ width: 48, height: 48 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {brand.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {brand.slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  {brand.active !== false ? (
                    <Chip label="Activo" color="success" size="small" />
                  ) : (
                    <Chip label="Inactivo" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {brand.storesActive ?? 0}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}/ {brand.storesTotal ?? 0}
                    </Typography>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => setEditBrand(brand)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box py={6} display="flex" justifyContent="center" alignItems="center">
                    <Typography color="text.secondary">
                      {t('No results')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Box display="flex" justifyContent="flex-end">
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
          slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }}
        />
      </Box>

      {/* Reused modal for Editing */}
      <BrandCreationModal
        open={Boolean(editBrand)}
        onClose={() => setEditBrand(null)}
        initialData={editBrand}
      />
    </Card>
  );
}
