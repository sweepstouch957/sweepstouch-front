import { Customer } from '@/models/customer';
import {
  SearchTwoTone,
  PictureAsPdf,
  GroupsRounded,
  CheckCircleRounded,
  BlockRounded,
} from '@mui/icons-material';
import {
  Avatar, Box, Card, Chip, Divider, InputAdornment, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';
import React from 'react';
import type { Customer as ModelCustomer } from '@/models/customer';
import type { Customer as ServiceCustomer } from '@/services/customerService';

type CustomerRow = Partial<ModelCustomer & ServiceCustomer> & {
  _id?: string;          // puede venir opcional en el service
  phoneNumber?: string;  // idem
  countryCode?: string;
};

interface ResultsProps {
  exporting?: boolean;
  onExportPdf?: () => void;
  customers: CustomerRow[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
}

function StatCard({
  label, value, total, icon, from, to,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  from: string;
  to: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, sm: 2.5 },
        color: '#fff',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transition: 'transform .2s ease, box-shadow .2s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700, letterSpacing: 1 }}>
            {label}
          </Typography>
          <Typography variant="h3" fontWeight={800} lineHeight={1.1}>
            {value.toLocaleString()}
          </Typography>
        </Box>
        <Avatar
          sx={{
            bgcolor: alpha('#fff', 0.18),
            color: '#fff',
            width: 44,
            height: 44,
            backdropFilter: 'blur(4px)',
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {pct !== null && (
        <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>
          {pct}% del total
        </Typography>
      )}
    </Card>
  );
}

export default function Results(props: ResultsProps) {
  const {
    customers, total, page, limit, isLoading,
    search, onSearchChange, onPageChange, onLimitChange,
    onExportPdf, exporting, stats,
  } = props;

  const totalCount = stats?.total || 0;

  return (
    <Box>
      {/* KPIs */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
        gap={{ xs: 1.5, sm: 2 }}
        mb={3}
      >
        <StatCard
          label="Total Clientes"
          value={totalCount}
          total={totalCount}
          icon={<GroupsRounded />}
          from="#1f1f1f"
          to="#3d3d3d"
        />
        <StatCard
          label="Activos"
          value={stats?.active || 0}
          total={totalCount}
          icon={<CheckCircleRounded />}
          from="#0d4d1a"
          to="#16a34a"
        />
        <StatCard
          label="Inactivos"
          value={stats?.inactive || 0}
          total={totalCount}
          icon={<BlockRounded />}
          from="#4d0d0d"
          to="#b91c1c"
        />
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          gap={1.5}
          p={2}
        >
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
            Directorio
          </Typography>
          <TextField
            size="small"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ width: { xs: '100%', md: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoTone fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {onExportPdf && (
            <Button
              size="small"
              startIcon={<PictureAsPdf />}
              variant="outlined"
              onClick={onExportPdf}
              disabled={exporting}
              sx={{ borderRadius: 2, px: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600 }}
            >
              {exporting ? 'Generando…' : 'Exportar PDF'}
            </Button>
          )}
        </Stack>
        <Divider />

        <TableContainer>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: (t) => alpha(t.palette.text.primary, 0.02) } }}>
                <TableCell>Cliente</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>ZIP</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => {
                const isActive = (c as any).active !== false;
                return (
                  <TableRow
                    key={c._id}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 15, fontWeight: 700 }}>
                          {(c.firstName || '?')[0]?.toUpperCase()}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="body1" fontWeight={600} noWrap>
                            {[c.firstName, (c as any).lastName].filter(Boolean).join(' ') || '—'}
                          </Typography>
                          {c.email && (
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {c.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" whiteSpace="nowrap">{'+' + c.phoneNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{(c as any).zipCode || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isActive ? 'Activo' : 'Inactivo'}
                        color={isActive ? 'success' : 'default'}
                        variant={isActive ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" whiteSpace="nowrap">
                        {dayjs(c.createdAt).format('DD/MM/YYYY')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {customers.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box p={4} textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron clientes
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, (page || 1) - 1)}
          onPageChange={(_, p) => onPageChange(p + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Filas:"
        />
      </Card>
    </Box>
  );
}
