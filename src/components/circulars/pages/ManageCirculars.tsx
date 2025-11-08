'use client';

/* eslint-disable react/jsx-max-props-per-line */
import { circularService } from '@services/circular.service'; // <-- tu servicio JS/TS

import { fmt, initialsFromSlug } from '@/utils/format';
import {
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { MetricCard } from '../MetricCard';
import { StatusBadge } from '../StatusBadge';

const ManageCirculars = () => {
  /**
   * Traemos overview y, con esos slugs, para cada tienda pedimos su lista
   * y derivamos:
   *  - current = primer circular con status 'active' (si no hay => null)
   *  - next    = primer circular con status 'scheduled' con fecha futura (si no hay => null)
   */
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['circulars', 'manage'],
    queryFn: async () => {
      const overview = await circularService.getOverview(); // { totals, byStore }
      const slugs = (overview?.byStore || []).map((s) => s._id);

      // Para cada store, buscamos su historial
      const perStore = await Promise.all(
        slugs.map(async (slug) => {
          const { items } = await circularService.getByStore(slug); // [{...}]
          // current = el primero ACTIVE (o null)
          const current = items.find((i) => i.status === 'active') || null;
          // next = el primero SCHEDULED futuro (o null)
          const now = Date.now();
          const next =
            items.find((i) => i.status === 'scheduled' && new Date(i.startDate).getTime() > now) ||
            null;

          return { slug, current, next };
        })
      );

      return {
        totals: overview?.totals || { active: 0, scheduled: 0, expired: 0 },
        rows: perStore, // [{ slug, current, next }]
      };
    },
    staleTime: 60 * 1000,
  });

  const totals = data?.totals || { active: 0, scheduled: 0, expired: 0 };
  const rows = data?.rows || [];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}
        >
          Manage Circulars
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: '#718096' }}
        >
          Manage circular schedule of stores
        </Typography>
      </Box>

      {/* Loading / Error */}
      {isLoading && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
          <CircularProgress size={20} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Cargando datos…
          </Typography>
        </Box>
      )}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          Error cargando circulares: {String(error?.message || 'desconocido')}
        </Alert>
      )}

      {/* Metrics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <MetricCard
          title="Active Circulars"
          value={totals.active}
          icon={TrendingUpIcon}
          borderColor="#4CAF50"
        />
        <MetricCard
          title="Scheduled"
          value={totals.scheduled}
          icon={ScheduleIcon}
          borderColor="#FF9800"
        />
        <MetricCard
          title="Expired"
          value={totals.expired}
          icon={ErrorIcon}
          borderColor="#F44336"
        />
      </Box>

      {/* Circular Status by Store Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: '#2D3748' }}
          >
            Circular Status by Store
          </Typography>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>STORE</TableCell>
                <TableCell>CURRENT CIRCULAR</TableCell>
                <TableCell>NEXT CIRCULAR</TableCell>
                <TableCell align="center">PREVIEW</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ slug, current, next }) => (
                <TableRow
                  key={slug}
                  hover
                >
                  {/* STORE */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#E91E63',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {initialsFromSlug(slug)}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, color: '#2D3748' }}
                          >
                            {slug}
                          </Typography>
                          <StatusBadge status={current?.status || next?.status || 'scheduled'} />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* CURRENT */}
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#2D3748', fontWeight: 500 }}
                      >
                        {current ? current.title : 'No active circular'}
                      </Typography>
                      {current?.endDate && (
                        <Typography
                          variant="caption"
                          sx={{ color: '#718096' }}
                        >
                          {`UNTIL ${fmt(current.endDate)}`}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* NEXT */}
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#2D3748', fontWeight: 500 }}
                      >
                        {next ? next.title : 'No scheduled circular'}
                      </Typography>
                      {next?.startDate && (
                        <Typography
                          variant="caption"
                          sx={{ color: '#2196F3' }}
                        >
                          {`STARTS ${fmt(next.startDate)}`}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* PREVIEW */}
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      sx={{ color: '#718096' }}
                      disabled={!current?.fileUrl && !next?.fileUrl}
                      onClick={() => {
                        const url = current?.fileUrl || next?.fileUrl;
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ p: 2 }}
                    >
                      No hay tiendas/circulares para mostrar.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export { ManageCirculars };
