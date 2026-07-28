'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { tint } from '@/theme/semantic';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';

import {
  fetchOverview,
  fetchCampaigns,
  fetchCustomers,
  fetchProducts,
  fetchTimeline,
  fetchCampaignProducts,
  type AnalyticsFilters,
} from '@/services/analytics.service';

import FilterBar from './FilterBar';
import KpiCards from './KpiCards';
import CampaignTable from './CampaignTable';
import TopCustomers from './TopCustomers';
import ProductChart from './ProductChart';
import TimelineChart from './TimelineChart';

export default function AnalyticsDashboard() {
  const theme = useTheme();
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const overview = useQuery({
    queryKey: ['analytics-overview', filters],
    queryFn: () => fetchOverview(filters),
    retry: 1,
  });

  const campaigns = useQuery({
    queryKey: ['analytics-campaigns', filters],
    queryFn: () => fetchCampaigns(filters),
    retry: 1,
  });

  const customers = useQuery({
    queryKey: ['analytics-customers', filters],
    queryFn: () => fetchCustomers({ ...filters, limit: 15 }),
    retry: 1,
  });

  const products = useQuery({
    queryKey: ['analytics-products', filters],
    queryFn: () => fetchProducts(filters),
    retry: 1,
  });

  const campaignProducts = useQuery({
    queryKey: ['analytics-campaign-products', filters],
    queryFn: () => fetchCampaignProducts(filters),
    retry: 1,
  });

  const timeline = useQuery({
    queryKey: ['analytics-timeline', filters],
    queryFn: () => fetchTimeline({ ...filters, groupBy: filters.groupBy || 'day' }),
    retry: 1,
  });

  // ─── Datos reales (sin demo). Si no hay info, los componentes muestran su estado vacío. ───
  const overviewData = overview.data;
  const campaignData = campaigns.data;
  const customerData = customers.data;
  const timelineData = timeline.data;
  const productData = products.data || { purchased: [], selected: [] };
  const campaignProductData = campaigns.isError ? undefined : campaignProducts.data;
  const isDemo = false;

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3, maxWidth: 1440, mx: 'auto' }}>
      {/* ═══ Header ═══ */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: '40%', width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
              }}
            >
              <AnalyticsIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5, lineHeight: 1.2 }}>
                Campaign Analytics
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.65, mt: 0.3, fontSize: 13 }}>
                Actionable insights for smarter decisions
              </Typography>
            </Box>
          </Stack>

          {overviewData && (
            <Stack direction="row" spacing={1.5}>
              {[
                { label: 'Conv.', value: `${overviewData.kpis.conversionRate}%` },
                { label: 'Delivery', value: `${overviewData.messaging.deliveryRate}%` },
              ].map((q) => (
                <Box
                  key={q.label}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Typography sx={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                    {q.label}
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{q.value}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ═══ Filters ═══ */}
      <Box sx={{ mb: 4 }}>
        <FilterBar filters={filters} onChange={setFilters} />
      </Box>

      {/* ═══ KPIs ═══ */}
      <Box sx={{ mb: 4 }}>
        <KpiCards data={overviewData} isLoading={overview.isLoading && !isDemo} />
      </Box>

      {/* ═══ Timeline ═══ */}
      <Box sx={{ mb: 4 }}>
        <TimelineChart data={timelineData} isLoading={timeline.isLoading && !isDemo} />
      </Box>

      {/* ═══ Section: Performance ═══ */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <InsightsIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        <Typography variant="h6" fontWeight={900}>
          Performance & Loyalty
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <CampaignTable
          data={campaignData}
          campaignProducts={campaignProductData}
          isLoading={campaigns.isLoading && !isDemo}
        />
        <TopCustomers data={customerData} isLoading={customers.isLoading && !isDemo} />
      </Box>

      {/* ═══ Section: Product Intelligence ═══ */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: tint(theme, 'success'), display: 'flex' }}>
          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900}>
            Product Intelligence
          </Typography>
          <Typography variant="caption" color="text.secondary">
            What's selling and what customers want (granular product-level analytics)
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 4 }}>
        <ProductChart
          data={productData}
          campaignProducts={campaignProductData}
          isLoading={(products.isLoading || campaignProducts.isLoading) && !isDemo}
        />
      </Box>
    </Box>
  );
}
