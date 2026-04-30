'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  Box,
  Skeleton,
  Chip,
  Stack,
  alpha,
  Collapse,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import type { CampaignAnalytics, ProductDetail } from '@/services/analytics.service';

interface Props {
  data?: CampaignAnalytics[];
  campaignProducts?: {
    purchased: ProductDetail[];
    selected: ProductDetail[];
    byCampaign: Record<string, { storeSlug: string; products: ProductDetail[] }>;
  };
  isLoading: boolean;
}

const PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#f97316'];
const CATEGORY_EMOJI: Record<string, string> = {
  meat: '🥩', produce: '🥬', beverages: '🥤', dairy: '🧀', pantry: '🥫',
  frozen: '🧊', bakery: '🍞', deli: '🥪', snacks: '🍿', household: '🧹',
};
const CATEGORY_COLORS: Record<string, string> = {
  meat: '#ef4444', produce: '#22c55e', beverages: '#3b82f6', dairy: '#f59e0b', pantry: '#8b5cf6',
  frozen: '#06b6d4', bakery: '#f97316', deli: '#ec4899', snacks: '#a855f7', household: '#6366f1',
};

export default function CampaignTable({ data, campaignProducts, isLoading }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1.5, borderRadius: 2 }} />
        ))}
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CampaignIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" fontWeight={600}>No campaign data yet</Typography>
      </Card>
    );
  }

  const maxScans = Math.max(...data.map((c) => c.totalScans));

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  const getProducts = (circularId: string, storeSlug: string): ProductDetail[] => {
    if (!campaignProducts?.byCampaign) return [];
    return campaignProducts.byCampaign[circularId]?.products
      || campaignProducts.byCampaign[storeSlug]?.products
      || [];
  };

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.1), display: 'flex' }}>
            <CampaignIcon sx={{ color: '#6366f1', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              Campaign Performance
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.length} campaign{data.length !== 1 ? 's' : ''} · Click to see products
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Campaign list */}
      <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
        {data.map((c, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const isOpen = expanded === c.circularId;
          const prods = getProducts(c.circularId, c.storeSlug);
          const totalProdUnits = prods.reduce((s, p) => s + p.quantity, 0);

          return (
            <Box key={c.circularId}>
              {/* ── Campaign Row ── */}
              <Box
                onClick={() => toggle(c.circularId)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2.5,
                  py: 2,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  borderBottom: isOpen ? 'none' : '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                  ...(isOpen && { bgcolor: alpha(color, 0.03) }),
                }}
              >
                {/* Color initial */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: alpha(color, 0.1),
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {(c.storeSlug || 'S')[0].toUpperCase()}
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {c.storeSlug || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.firstScan ? new Date(c.firstScan).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    {c.lastScan && ` — ${new Date(c.lastScan).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </Typography>
                </Box>

                {/* Metrics */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <Box sx={{ textAlign: 'center', minWidth: 50 }}>
                    <Typography variant="body2" fontWeight={800}>{c.totalScans}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>scans</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 50 }}>
                    <Typography variant="body2" fontWeight={600}>{c.uniqueCustomers}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>customers</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 50 }}>
                    <Typography variant="body2" fontWeight={600}>{c.confirmedPurchases}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>confirmed</Typography>
                  </Box>
                  <Chip
                    label={`${c.conversionRate}%`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: 11,
                      height: 24,
                      bgcolor: c.conversionRate >= 60
                        ? alpha('#10b981', 0.1)
                        : c.conversionRate >= 30
                          ? alpha('#f59e0b', 0.1)
                          : alpha('#ef4444', 0.1),
                      color: c.conversionRate >= 60
                        ? '#10b981'
                        : c.conversionRate >= 30
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  />
                  <Stack direction="row" spacing={0.3} alignItems="center">
                    <Typography sx={{ fontSize: 12 }}>⭐</Typography>
                    <Typography fontWeight={800} fontSize={13} sx={{ color: '#f59e0b' }}>
                      {c.totalPoints.toLocaleString()}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Expand icon */}
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Box>

              {/* ── Expandable Products ── */}
              <Collapse in={isOpen} unmountOnExit>
                <Box
                  sx={{
                    px: 2.5,
                    pb: 2,
                    pt: 0.5,
                    bgcolor: alpha(color, 0.02),
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {prods.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No product data available for this campaign yet
                    </Typography>
                  ) : (
                    <>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 }}>
                          Products purchased ({prods.length})
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: 10 }}>
                          {totalProdUnits} total units
                        </Typography>
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.5 }}>
                        {prods.map((p, pIdx) => {
                          const cat = p.category?.toLowerCase() || 'other';
                          const catColor = CATEGORY_COLORS[cat] || '#9e9e9e';
                          const emoji = CATEGORY_EMOJI[cat] || '📦';
                          const pct = totalProdUnits ? (p.quantity / Math.max(...prods.map((pp) => pp.quantity))) * 100 : 0;

                          return (
                            <Box
                              key={`${p.product}-${pIdx}`}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: alpha(catColor, 0.04) },
                              }}
                            >
                              {/* Emoji */}
                              <Typography sx={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>
                                {emoji}
                              </Typography>

                              {/* Product info */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                                    {p.product}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.2 }}>
                                  <Chip
                                    label={cat}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: 8,
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      bgcolor: alpha(catColor, 0.1),
                                      color: catColor,
                                    }}
                                  />
                                  {p.price && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                                      {p.price}
                                    </Typography>
                                  )}
                                  <Tooltip title={`${p.uniqueCustomers} unique customers`}>
                                    <Stack direction="row" spacing={0.3} alignItems="center">
                                      <PeopleAltIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                                        {p.uniqueCustomers}
                                      </Typography>
                                    </Stack>
                                  </Tooltip>
                                </Stack>
                              </Box>

                              {/* Bar */}
                              <Box sx={{ width: 80, mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  sx={{
                                    height: 5,
                                    borderRadius: 3,
                                    bgcolor: alpha(catColor, 0.06),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: catColor,
                                    },
                                  }}
                                />
                              </Box>

                              {/* Quantity */}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 900,
                                  color: catColor,
                                  fontSize: 16,
                                  minWidth: 36,
                                  textAlign: 'right',
                                }}
                              >
                                {p.quantity}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
