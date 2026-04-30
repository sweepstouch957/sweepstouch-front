'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Box,
  Stack,
  Skeleton,
  Chip,
  Avatar,
  Tab,
  Tabs,
  alpha,
  LinearProgress,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import type { ProductAnalytics, ProductDetail } from '@/services/analytics.service';

interface Props {
  data?: { purchased: ProductAnalytics[]; selected: ProductAnalytics[] };
  campaignProducts?: {
    purchased: ProductDetail[];
    selected: ProductDetail[];
    byCampaign: Record<string, { storeSlug: string; products: ProductDetail[] }>;
  };
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  meat: '#ef4444',
  produce: '#22c55e',
  beverages: '#3b82f6',
  dairy: '#f59e0b',
  pantry: '#8b5cf6',
  frozen: '#06b6d4',
  bakery: '#f97316',
  deli: '#ec4899',
  snacks: '#a855f7',
  household: '#6366f1',
};

const CATEGORY_EMOJI: Record<string, string> = {
  meat: '🥩',
  produce: '🥬',
  beverages: '🥤',
  dairy: '🧀',
  pantry: '🥫',
  frozen: '🧊',
  bakery: '🍞',
  deli: '🥪',
  snacks: '🍿',
  household: '🧹',
};

function getColor(cat: string): string {
  return CATEGORY_COLORS[cat?.toLowerCase()] || '#9e9e9e';
}

function getEmoji(cat: string): string {
  return CATEGORY_EMOJI[cat?.toLowerCase()] || '📦';
}

export default function ProductChart({ data, campaignProducts, isLoading }: Props) {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  // Merge data from both sources
  const purchased = [
    ...(data?.purchased || []).map((p) => ({
      product: p.product,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: p.timesPurchased || 0,
      uniqueCustomers: p.uniqueCustomers,
      source: 'purchased' as const,
    })),
    ...(campaignProducts?.purchased || []).map((p) => ({
      product: p.product,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: p.quantity || 0,
      uniqueCustomers: p.uniqueCustomers,
      source: 'purchased' as const,
    })),
  ];

  const selected = [
    ...(data?.selected || []).map((p) => ({
      product: p.product,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: p.timesSelected || 0,
      uniqueCustomers: p.uniqueCustomers,
      source: 'selected' as const,
    })),
    ...(campaignProducts?.selected || []).map((p) => ({
      product: p.product,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: p.quantity || 0,
      uniqueCustomers: p.uniqueCustomers,
      source: 'selected' as const,
    })),
  ];

  // Deduplicate by product name and sum quantities
  type ProdItem = { product: string; category: string; price: string; imageUrl: string; quantity: number; uniqueCustomers: number; source: string };
  const dedup = (arr: ProdItem[]) => {
    const map = new Map<string, ProdItem>();
    for (const p of arr) {
      const existing = map.get(p.product);
      if (existing) {
        existing.quantity += p.quantity;
        existing.uniqueCustomers = Math.max(existing.uniqueCustomers, p.uniqueCustomers);
      } else {
        map.set(p.product, { ...p });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  };

  const purchasedList = dedup(purchased);
  const selectedList = dedup(selected);
  const activeList = tab === 0 ? purchasedList : selectedList;

  // Filter
  const filtered = search
    ? activeList.filter(
        (p) =>
          p.product.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.toLowerCase().includes(search.toLowerCase())
      )
    : activeList;

  const maxQty = Math.max(...(filtered.map((p) => p.quantity) || [1]), 1);

  // Category breakdown — useMemo MUST be called before any early return
  const categories = useMemo(() => {
    const cats = new Map<string, { qty: number; customers: number; count: number }>();
    for (const p of activeList) {
      const cat = p.category?.toLowerCase() || 'other';
      const existing = cats.get(cat) || { qty: 0, customers: 0, count: 0 };
      existing.qty += p.quantity;
      existing.customers += p.uniqueCustomers;
      existing.count += 1;
      cats.set(cat, existing);
    }
    return Array.from(cats.entries())
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.qty - a.qty);
  }, [activeList]);

  const totalProducts = activeList.reduce((s, p) => s + p.quantity, 0);

  // ─── Early returns AFTER all hooks ───
  if (isLoading) {
    return (
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={240} height={32} sx={{ mb: 2 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5, borderRadius: 2 }} />
        ))}
      </Card>
    );
  }

  if (purchasedList.length === 0 && selectedList.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" fontWeight={600}>
          No product data yet
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Products will appear here once campaigns have confirmed purchases
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {/* ═══ Header ═══ */}
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
          <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha('#22c55e', 0.1), display: 'flex' }}>
            <InventoryIcon sx={{ color: '#22c55e', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              Product Intelligence
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalProducts.toLocaleString()} total units · {activeList.length} unique products
            </Typography>
          </Box>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 12, fontWeight: 700, textTransform: 'none' },
            '& .MuiTabs-indicator': {
              background: tab === 0 ? '#22c55e' : '#3b82f6',
              height: 3,
              borderRadius: 2,
            },
          }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ShoppingCartIcon sx={{ fontSize: 16 }} />
                <span>Purchased ({purchasedList.length})</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                <span>Selected ({selectedList.length})</span>
              </Stack>
            }
          />
        </Tabs>
      </Box>

      {/* ═══ Category Summary Chips ═══ */}
      {categories.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
          }}
        >
          {categories.map((c) => (
            <Tooltip
              key={c.cat}
              title={`${c.qty} units · ${c.count} products · ${c.customers} customers`}
              arrow
            >
              <Chip
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>{getEmoji(c.cat)}</span>
                    <span style={{ fontWeight: 800, fontSize: 11 }}>{c.cat}</span>
                    <span style={{ fontWeight: 600, fontSize: 10, opacity: 0.7 }}>({c.qty})</span>
                  </Stack>
                }
                size="small"
                sx={{
                  height: 28,
                  bgcolor: alpha(getColor(c.cat), 0.08),
                  color: getColor(c.cat),
                  border: `1px solid ${alpha(getColor(c.cat), 0.2)}`,
                  fontWeight: 700,
                  '&:hover': { bgcolor: alpha(getColor(c.cat), 0.15) },
                  cursor: 'pointer',
                }}
                onClick={() => setSearch(c.cat)}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      {/* ═══ Search ═══ */}
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search products or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 },
          }}
        />
      </Box>

      {/* ═══ Product List ═══ */}
      <Box sx={{ px: 2, py: 1, maxHeight: 600, overflow: 'auto' }}>
        {filtered.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2" fontWeight={600}>
              No products match "{search}"
            </Typography>
          </Box>
        )}

        {filtered.map((p, idx) => {
          const pct = maxQty ? (p.quantity / maxQty) * 100 : 0;
          const cat = p.category?.toLowerCase() || 'other';
          const color = getColor(cat);
          const isHot = idx < 3;

          return (
            <Box
              key={`${p.product}-${idx}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.5,
                mx: 0.5,
                mb: 0.5,
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(color, 0.04),
                },
                ...(isHot && {
                  bgcolor: alpha(color, 0.03),
                  border: `1px solid ${alpha(color, 0.1)}`,
                }),
              }}
            >
              {/* Rank */}
              <Box sx={{ minWidth: 28, textAlign: 'center' }}>
                {isHot ? (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 11,
                      fontWeight: 900,
                      bgcolor: alpha(color, 0.15),
                      color,
                    }}
                  >
                    {idx + 1}
                  </Avatar>
                ) : (
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    #{idx + 1}
                  </Typography>
                )}
              </Box>

              {/* Product Image or Emoji */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: alpha(color, 0.06),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `1px solid ${alpha(color, 0.12)}`,
                }}
              >
                {p.imageUrl ? (
                  <Box
                    component="img"
                    src={p.imageUrl}
                    alt={p.product}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 20 }}>{getEmoji(cat)}</Typography>
                )}
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1 }}>
                    {p.product}
                  </Typography>
                  {isHot && (
                    <LocalFireDepartmentIcon
                      sx={{ fontSize: 16, color: '#ef4444', animation: 'pulse 1.5s infinite' }}
                    />
                  )}
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                  <Chip
                    label={cat}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      bgcolor: alpha(color, 0.1),
                      color,
                      letterSpacing: 0.5,
                    }}
                  />
                  {p.price && (
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {p.price}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.3} alignItems="center">
                    <PeopleAltIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {p.uniqueCustomers}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Progress bar */}
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    mt: 0.8,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(color, 0.06),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
                    },
                  }}
                />
              </Box>

              {/* Quantity */}
              <Stack alignItems="flex-end" sx={{ minWidth: 60 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    color,
                    lineHeight: 1,
                    fontSize: 20,
                  }}
                >
                  {p.quantity}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 10 }}>
                  {tab === 0 ? 'purchased' : 'selected'}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* ═══ Footer insights ═══ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {[
          {
            label: 'Top Category',
            value: categories[0] ? `${getEmoji(categories[0].cat)} ${categories[0].cat}` : '—',
            sub: categories[0] ? `${categories[0].qty} units` : '',
          },
          {
            label: 'Top Product',
            value: filtered[0]?.product?.slice(0, 20) || '—',
            sub: filtered[0] ? `${filtered[0].quantity} units` : '',
          },
          {
            label: 'Total Units',
            value: totalProducts.toLocaleString(),
            sub: `${activeList.length} products`,
          },
        ].map((stat, i) => (
          <Box
            key={stat.label}
            sx={{
              py: 2,
              px: 2,
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 9, letterSpacing: 0.8 }}>
              {stat.label}
            </Typography>
            <Typography variant="body2" fontWeight={900} noWrap sx={{ mt: 0.3 }}>
              {stat.value}
            </Typography>
            {stat.sub && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {stat.sub}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Card>
  );
}
