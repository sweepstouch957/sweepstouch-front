'use client';

import {
  Card,
  Typography,
  Box,
  Stack,
  Skeleton,
  Tooltip,
  alpha,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { TimelinePoint, ListTimelinePoint } from '@/services/analytics.service';

interface Props {
  data?: { scans: TimelinePoint[]; shoppingLists: ListTimelinePoint[] };
  isLoading: boolean;
}

const COLORS = {
  scans: '#3b82f6',
  customers: '#8b5cf6',
  confirmed: '#10b981',
};

export default function TimelineChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} />
      </Card>
    );
  }

  if (!data || data.scans.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" fontWeight={600}>No timeline data yet</Typography>
      </Card>
    );
  }

  const maxVal = Math.max(...data.scans.map((d) => Math.max(d.scans, d.customers, d.confirmed)), 1);
  const totalScans = data.scans.reduce((s, d) => s + d.scans, 0);
  const totalCustomers = data.scans.reduce((s, d) => s + d.customers, 0);
  const totalPoints = data.scans.reduce((s, d) => s + d.points, 0);
  const totalConfirmed = data.scans.reduce((s, d) => s + d.confirmed, 0);
  const BAR_HEIGHT = 200;

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha(COLORS.scans, 0.1), display: 'flex' }}>
            <TrendingUpIcon sx={{ color: COLORS.scans, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>Activity Timeline</Typography>
            <Typography variant="caption" color="text.secondary">{data.scans.length} data points</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2.5}>
          {[
            { label: 'Scans', color: COLORS.scans },
            { label: 'Customers', color: COLORS.customers },
            { label: 'Confirmed', color: COLORS.confirmed },
          ].map((l) => (
            <Stack key={l.label} direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: l.color }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">{l.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Chart */}
      <Box sx={{ px: 3, py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: BAR_HEIGHT,
          }}
        >
          {data.scans.map((d, idx) => {
            const scanH = Math.max((d.scans / maxVal) * (BAR_HEIGHT - 30), d.scans > 0 ? 6 : 0);
            const custH = Math.max((d.customers / maxVal) * (BAR_HEIGHT - 30), d.customers > 0 ? 6 : 0);
            const confH = Math.max((d.confirmed / maxVal) * (BAR_HEIGHT - 30), d.confirmed > 0 ? 6 : 0);

            return (
              <Tooltip
                key={d.date}
                arrow
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" fontWeight={800} sx={{ display: 'block', mb: 0.5 }}>
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Typography>
                    <Stack spacing={0.3}>
                      <Typography variant="caption">📊 {d.scans} scans</Typography>
                      <Typography variant="caption">👤 {d.customers} customers</Typography>
                      <Typography variant="caption">✅ {d.confirmed} confirmed</Typography>
                      <Typography variant="caption">⭐ {d.points} points</Typography>
                    </Stack>
                  </Box>
                }
              >
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover .bar-col': { filter: 'brightness(1.2)' },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing="2px"
                    alignItems="flex-end"
                    sx={{ height: BAR_HEIGHT - 24, width: '100%' }}
                  >
                    {/* Scan bar */}
                    <Box
                      className="bar-col"
                      sx={{
                        flex: 1,
                        height: `${scanH}px`,
                        bgcolor: COLORS.scans,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.4s ease, filter 0.2s',
                      }}
                    />
                    {/* Customer bar */}
                    <Box
                      className="bar-col"
                      sx={{
                        flex: 1,
                        height: `${custH}px`,
                        bgcolor: COLORS.customers,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.4s ease 50ms, filter 0.2s',
                      }}
                    />
                    {/* Confirmed bar */}
                    <Box
                      className="bar-col"
                      sx={{
                        flex: 1,
                        height: `${confH}px`,
                        bgcolor: COLORS.confirmed,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.4s ease 100ms, filter 0.2s',
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.6,
                      fontSize: 9,
                      color: 'text.secondary',
                      opacity: idx % 2 === 0 ? 0.9 : 0.4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.date.slice(5)}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Summary */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {[
          { label: 'Total Scans', value: totalScans.toLocaleString(), color: COLORS.scans, icon: '📊' },
          { label: 'Customer Visits', value: totalCustomers.toLocaleString(), color: COLORS.customers, icon: '👤' },
          { label: 'Confirmed', value: totalConfirmed.toLocaleString(), color: COLORS.confirmed, icon: '✅' },
          { label: 'Points Awarded', value: totalPoints.toLocaleString(), color: '#f59e0b', icon: '⭐' },
        ].map((stat, i) => (
          <Box
            key={stat.label}
            sx={{
              py: 2,
              px: 2,
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontSize: 11, mb: 0.3 }}>{stat.icon}</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: stat.color, lineHeight: 1.2 }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
