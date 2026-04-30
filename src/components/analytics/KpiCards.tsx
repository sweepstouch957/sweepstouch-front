'use client';

import { Box, Card, Typography, Skeleton, Stack, alpha } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import EmailIcon from '@mui/icons-material/Email';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import type { AnalyticsOverview } from '@/services/analytics.service';

interface Props {
  data?: AnalyticsOverview;
  isLoading: boolean;
}

interface KpiDef {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  gradient: string;
}

export default function KpiCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  if (!data) return null;

  const kpis: KpiDef[] = [
    {
      label: 'Total Scans',
      value: data.kpis.totalScans.toLocaleString(),
      icon: <QrCodeScannerIcon />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      subtitle: 'Barcode scans',
    },
    {
      label: 'Unique Customers',
      value: data.kpis.uniqueCustomers.toLocaleString(),
      icon: <PeopleAltIcon />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      subtitle: 'Active shoppers',
    },
    {
      label: 'Confirmed Purchases',
      value: data.kpis.confirmedPurchases.toLocaleString(),
      icon: <CheckCircleIcon />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      subtitle: `${data.kpis.conversionRate}% conversion`,
    },
    {
      label: 'Points Awarded',
      value: data.kpis.totalPoints.toLocaleString(),
      icon: <StarIcon />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      subtitle: 'Loyalty points',
    },
    {
      label: 'Shopping Lists',
      value: data.shoppingLists.total.toLocaleString(),
      icon: <ShoppingCartIcon />,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
      subtitle: `${data.shoppingLists.validated} validated`,
    },
    {
      label: 'Items Selected',
      value: data.shoppingLists.totalItems.toLocaleString(),
      icon: <InventoryIcon />,
      color: '#14b8a6',
      gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
      subtitle: `${data.shoppingLists.uniqueCustomers} customers`,
    },
    {
      label: 'Messages Sent',
      value: data.messaging.total.toLocaleString(),
      icon: <EmailIcon />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      subtitle: `${data.messaging.deliveryRate}% delivery`,
    },
    {
      label: 'MMS Campaigns',
      value: data.messaging.mms.toLocaleString(),
      icon: <TrendingUpIcon />,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
      subtitle: `${data.messaging.sms.toLocaleString()} SMS`,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      {kpis.map((kpi, idx) => (
        <Card
          key={kpi.label}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: `fadeInUp 0.5s ease ${idx * 60}ms both`,
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 32px ${alpha(kpi.color, 0.2)}`,
              borderColor: alpha(kpi.color, 0.4),
            },
          }}
        >
          {/* Accent bar */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: kpi.gradient,
            }}
          />

          {/* Background glow */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(kpi.color, 0.06),
            }}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: 10,
                }}
              >
                {kpi.label}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  background: kpi.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  mt: 0.5,
                  fontSize: { xs: 24, md: 28 },
                }}
              >
                {kpi.value}
              </Typography>
              {kpi.subtitle && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: 11 }}>
                  {kpi.subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2.5,
                background: alpha(kpi.color, 0.1),
                color: kpi.color,
                display: 'flex',
              }}
            >
              {kpi.icon}
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}
