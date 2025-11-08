'use client';

/* eslint-disable react/jsx-max-props-per-line */
// 🔗 Hooks reales
import { useCircularAlerts, useCircularOverview } from '@hooks/fetching/circulars/useCirculars';
import {
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Alert, Avatar, Box, CircularProgress, Divider, Paper, Typography } from '@mui/material';
import React from 'react';
import { MetricCard } from '../MetricCard';
import { StatusBadge } from '../StatusBadge';

function slugToInitials(slug = '') {
  const clean = String(slug).replace(/[-_]+/g, ' ').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (!parts.length) return 'ST';
  const first = parts[0]?.[0] || '';
  const last = parts[1]?.[0] || parts[0]?.[1] || '';
  return `${first}${last}`.toUpperCase();
}

function fmt(d) {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

const InfoDashboard = () => {
  // 📊 Datos de overview (totales + último circular por tienda)
  const { data: overview, isLoading, isError, error } = useCircularOverview();
  // 🔔 Alertas (expira pronto / gap warning)
  const { data: alertsData, isLoading: loadingAlerts } = useCircularAlerts(48);

  const totals = overview?.totals || { active: 0, scheduled: 0, expired: 0 };
  const byStore :any= overview?.byStore || [];
  const totalStores = byStore.length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}
        >
          Info Dashboard
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: '#718096' }}
        >
          Overview of circular statistics
        </Typography>
      </Box>

      {/* Loading / Error states */}
      {isLoading && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <CircularProgress size={20} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Cargando KPIs…
          </Typography>
        </Box>
      )}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          Error cargando overview: {String(error?.message || 'desconocido')}
        </Alert>
      )}

      {/* Metrics Cards (reales) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <MetricCard
          title="Total Stores"
          value={totalStores}
          subtitle="+0 this month"
          icon={ShoppingCartIcon}
          borderColor="#E91E63"
          iconColor="#E91E63"
        />
        <MetricCard
          title="Active Circulars"
          value={totals.active}
          subtitle="Currently running"
          icon={TrendingUpIcon}
          borderColor="#4CAF50"
          iconColor="#4CAF50"
        />
        <MetricCard
          title="Scheduled"
          value={totals.scheduled}
          subtitle="Ready to launch"
          icon={ScheduleIcon}
          borderColor="#FF9800"
          iconColor="#FF9800"
        />
        <MetricCard
          title="Expired"
          value={totals.expired}
          subtitle="Need attention"
          icon={ErrorIcon}
          borderColor="#F44336"
          iconColor="#F44336"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Status Alerts (reales) */}
        <Paper sx={{ borderRadius: 3, p: 3, height: 'fit-content' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <WarningIcon sx={{ color: '#F44336', fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: '#2D3748' }}
            >
              Status Alerts
            </Typography>
          </Box>

          {loadingAlerts ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <CircularProgress size={18} />
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Cargando alertas…
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(alertsData?.alerts || []).length === 0 && (
                <Alert
                  severity="success"
                  sx={{ borderRadius: 2 }}
                >
                  No hay alertas por ahora ✅
                </Alert>
              )}
              {(alertsData?.alerts || []).map((a) => (
                <Alert
                  key={a.circularId}
                  severity={a.type === 'gap_warning' ? 'warning' : 'info'}
                  sx={{ borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.875rem' } }}
                >
                  {a.type === 'gap_warning'
                    ? `⚠ El circular de ${a.storeSlug} expira el ${fmt(
                        a.endDate
                      )} y NO hay otro agendado.`
                    : `ℹ El circular de ${a.storeSlug} expira pronto (${fmt(a.endDate)}).`}
                </Alert>
              ))}
            </Box>
          )}
        </Paper>

        {/* Store Status Overview (real) */}
        <Paper sx={{ borderRadius: 3, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <InfoIcon sx={{ color: '#E91E63', fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: '#2D3748' }}
            >
              Store Status Overview
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {byStore.map((s, index) => {
              const last = s.last || {};
              const status = last.status || 'scheduled';
              const start = last.startDate ? `STARTS ${fmt(last.startDate)}` : '';
              const until = last.endDate ? `UNTIL ${fmt(last.endDate)}` : '';
              return (
                <React.Fragment key={s._id}>
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
                      {slugToInitials(s._id)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: '#2D3748' }}
                        >
                          {s._id}
                        </Typography>
                        <StatusBadge status={status} />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {until && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#718096' }}
                          >
                            {until}
                          </Typography>
                        )}
                        {start && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#2196F3' }}
                          >
                            {start}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  {index < byStore.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              );
            })}
            {byStore.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                No hay datos aún.
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export { InfoDashboard };
