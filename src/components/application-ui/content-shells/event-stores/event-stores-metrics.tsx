'use client';

/** Cabecera del módulo Eventos: tarjetas de totales + registros por día. */

import type { EventStoreDailyPoint, EventStoreTotals } from '@/services/sweepstakes.service';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonAddAlt1Rounded from '@mui/icons-material/PersonAddAlt1Rounded';
import { Box, Card, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';
import { BarChart } from 'src/components/base/lazy-charts';

type MetricCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  color: 'primary' | 'success' | 'info' | 'warning';
  loading?: boolean;
};

function MetricCard({ icon, label, value, hint, color, loading }: MetricCardProps) {
  const theme = useTheme();
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 42,
            height: 42,
            borderRadius: 2,
            flexShrink: 0,
            color: theme.palette[color].main,
            bgcolor: alpha(theme.palette[color].main, 0.12),
          }}
        >
          {icon}
        </Box>
        <Stack minWidth={0}>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={64} />
          ) : (
            <Typography
              variant="h4"
              fontWeight={700}
              lineHeight={1.1}
            >
              {value.toLocaleString()}
            </Typography>
          )}
          {hint && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
            >
              {hint}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

type Props = {
  totals?: EventStoreTotals;
  daily?: EventStoreDailyPoint[];
  loading: boolean;
};

export default function EventStoresMetrics({ totals, daily = [], loading }: Props) {
  const theme = useTheme();
  const t = totals;

  // dd/MM sin año: 30 etiquetas con año no entran y nadie las lee.
  const labels = daily.map((d) => `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`);
  const hasData = daily.some((d) => d.total > 0);

  return (
    <Stack gap={2}>
      <Grid
        container
        spacing={2}
      >
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <MetricCard
            icon={<EventAvailableRounded />}
            label="Eventos"
            value={t?.eventos ?? 0}
            hint={`${t?.activos ?? 0} en curso`}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <MetricCard
            icon={<GroupsRounded />}
            label="Números captados"
            value={t?.numeros ?? 0}
            hint="Total histórico en eventos"
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <MetricCard
            icon={<PersonAddAlt1Rounded />}
            label="Nuevos"
            value={t?.nuevos ?? 0}
            hint={`${(t?.existentes ?? 0).toLocaleString()} ya estaban en la base`}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <MetricCard
            icon={<BadgeRounded />}
            label="Owner / Manager"
            value={t?.ownerManager ?? 0}
            hint={`${(t?.sellerBrand ?? 0).toLocaleString()} Seller / Brand`}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Card sx={{ p: 2 }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mb: 1.5 }}
        >
          Registros por día
        </Typography>

        {loading ? (
          <Skeleton
            variant="rectangular"
            height={230}
            sx={{ borderRadius: 2 }}
          />
        ) : hasData ? (
          <BarChart
            xAxis={[
              {
                data: labels,
                scaleType: 'band',
                tickLabelStyle: { fontSize: 10 } as any,
              },
            ]}
            series={[
              {
                data: daily.map((d) => d.nuevos),
                label: 'Nuevos',
                color: theme.palette.success.main,
                stack: 'total',
              },
              {
                data: daily.map((d) => d.existentes),
                label: 'Existentes',
                color: theme.palette.primary.main,
                stack: 'total',
              },
            ]}
            height={230}
            borderRadius={4}
            slotProps={{
              legend: {
                position: { vertical: 'top', horizontal: 'right' },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
              } as any,
            }}
          />
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            height={230}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sin registros en el rango elegido.
            </Typography>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
