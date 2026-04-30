'use client';

import {
  Card,
  Typography,
  Box,
  Stack,
  Avatar,
  Skeleton,
  Chip,
  Divider,
  alpha,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PhoneIcon from '@mui/icons-material/Phone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import type { CustomerAnalytics } from '@/services/analytics.service';

interface Props {
  data?: CustomerAnalytics[];
  isLoading: boolean;
}

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_GRADIENTS = [
  'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
  'linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)',
  'linear-gradient(135deg, #D4A574 0%, #8D6E63 100%)',
];

export default function TopCustomers({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={68} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" fontWeight={600}>
          No customer data yet
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Customer rankings will appear once scans are tracked
        </Typography>
      </Card>
    );
  }

  const maxPoints = Math.max(...data.map((c) => c.totalPoints), 1);

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha('#FFD700', 0.15), display: 'flex' }}>
            <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              Loyalty Leaders
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Top {data.length} customers by points
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ maxHeight: 520, overflow: 'auto', p: 1.5 }}>
        {data.map((c, i) => {
          const isTop3 = i < 3;
          const initial = (c.customerName || c.customerPhone || '?')[0].toUpperCase();
          const pointsPct = (c.totalPoints / maxPoints) * 100;
          const daysSinceVisit = c.lastVisit
            ? Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000)
            : null;

          return (
            <Box key={c.customerId}>
              <Box
                sx={{
                  py: 1.5,
                  px: 1.5,
                  borderRadius: 2.5,
                  mb: 0.5,
                  transition: 'all 0.2s',
                  ...(isTop3 && {
                    bgcolor: alpha(MEDAL_COLORS[i], 0.06),
                    border: `1px solid ${alpha(MEDAL_COLORS[i], 0.15)}`,
                  }),
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  {/* Rank */}
                  <Box sx={{ minWidth: 30, textAlign: 'center' }}>
                    {isTop3 ? (
                      <Typography sx={{ fontSize: 22, lineHeight: 1 }}>
                        {MEDAL_EMOJI[i]}
                      </Typography>
                    ) : (
                      <Avatar
                        sx={{
                          width: 26,
                          height: 26,
                          fontSize: 11,
                          fontWeight: 900,
                          bgcolor: 'action.selected',
                          color: 'text.secondary',
                        }}
                      >
                        {i + 1}
                      </Avatar>
                    )}
                  </Box>

                  {/* Avatar */}
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: isTop3 ? MEDAL_COLORS[i] : 'primary.main',
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {initial}
                  </Avatar>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={800} noWrap>
                        {c.customerName || 'Unknown'}
                      </Typography>
                      {daysSinceVisit !== null && daysSinceVisit <= 3 && (
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 8,
                            fontWeight: 800,
                            bgcolor: alpha('#22c55e', 0.1),
                            color: '#22c55e',
                          }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      {c.customerPhone && (
                        <Tooltip title={c.customerPhone}>
                          <Stack direction="row" spacing={0.3} alignItems="center">
                            <PhoneIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                              {c.customerPhone.slice(-4)}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      )}
                      <Stack direction="row" spacing={0.3} alignItems="center">
                        <TrendingUpIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                          {c.totalScans} visits
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.3} alignItems="center">
                        <StorefrontIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                          {c.storeCount} store{c.storeCount > 1 ? 's' : ''}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Points bar */}
                    <LinearProgress
                      variant="determinate"
                      value={pointsPct}
                      sx={{
                        mt: 0.8,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(isTop3 ? MEDAL_COLORS[i] : '#6366f1', 0.08),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          bgcolor: isTop3 ? MEDAL_COLORS[i] : '#6366f1',
                        },
                      }}
                    />
                  </Box>

                  {/* Points + Products */}
                  <Stack alignItems="flex-end" spacing={0.2}>
                    <Chip
                      icon={<StarIcon sx={{ fontSize: 13, color: '#FF9800 !important' }} />}
                      label={c.totalPoints.toLocaleString()}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        fontSize: 12,
                        height: 26,
                        bgcolor: alpha('#FF9800', 0.08),
                        color: '#FF9800',
                        border: `1px solid ${alpha('#FF9800', 0.2)}`,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 600 }}>
                      {c.productsPurchased} products
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              {!isTop3 && i < data.length - 1 && <Divider sx={{ mx: 1.5 }} />}
            </Box>
          );
        })}
      </Box>

      {/* Summary footer */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {[
          { label: 'Avg Points', value: Math.round(data.reduce((s, c) => s + c.totalPoints, 0) / data.length).toLocaleString() },
          { label: 'Avg Visits', value: (data.reduce((s, c) => s + c.totalScans, 0) / data.length).toFixed(1) },
          { label: 'Total Products', value: data.reduce((s, c) => s + c.productsPurchased, 0).toLocaleString() },
        ].map((stat, i) => (
          <Box
            key={stat.label}
            sx={{
              py: 1.5,
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {stat.label}
            </Typography>
            <Typography variant="body2" fontWeight={900} sx={{ mt: 0.2 }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
