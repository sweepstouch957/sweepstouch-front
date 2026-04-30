'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Stack, Alert, Chip, useTheme, alpha } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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

import {
  DEMO_OVERVIEW,
  DEMO_CAMPAIGNS,
  DEMO_CUSTOMERS,
  DEMO_PRODUCTS,
  DEMO_TIMELINE,
  DEMO_CAMPAIGN_PRODUCTS,
} from './demoData';

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

  // ─── Fallback to demo ───
  const isDemo = overview.isError || (!overview.isLoading && !overview.data?.kpis?.totalScans);
  const overviewData = isDemo ? DEMO_OVERVIEW : overview.data;
  const campaignData = campaigns.isError || (!campaigns.isLoading && (!campaigns.data || campaigns.data.length === 0)) ? DEMO_CAMPAIGNS : campaigns.data;
  const customerData = customers.isError || (!customers.isLoading && (!customers.data || customers.data.length === 0)) ? DEMO_CUSTOMERS : customers.data;
  const timelineData = timeline.isError || (!timeline.isLoading && (!timeline.data || timeline.data.scans.length === 0)) ? DEMO_TIMELINE : timeline.data;

  const realProducts = products.data;
  const productData = isDemo
    ? {
        purchased: [...(DEMO_PRODUCTS.purchased), ...(realProducts?.purchased || [])],
        selected: [...(realProducts?.selected || []), ...(DEMO_PRODUCTS.selected)],
      }
    : realProducts || DEMO_PRODUCTS;

  const campaignProductData = isDemo
    ? DEMO_CAMPAIGN_PRODUCTS
    : campaignProducts.isError
      ? undefined
      : campaignProducts.data;

  const allLoading = overview.isLoading && campaigns.isLoading;

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3, maxWidth: 1440, mx: 'auto' }}>
      {/* ═══ Header ═══ */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 4,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
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

      {/* Demo banner */}
      {isDemo && !allLoading && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{
            mb: 3,
            borderRadius: 2.5,
            '& .MuiAlert-message': { display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' },
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Showing demo data — Real data will populate once campaigns have scans.
          </Typography>
          <Chip label="DEMO" size="small" color="info" sx={{ fontWeight: 800, height: 22 }} />
        </Alert>
      )}

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
        <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#22c55e', 0.1), display: 'flex' }}>
          <TrendingUpIcon sx={{ color: '#22c55e', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900}>
            Product Intelligence
          </Typography>
          <Typography variant="caption" color="text.secondary">
            What's selling and what customers want — granular product-level analytics
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
