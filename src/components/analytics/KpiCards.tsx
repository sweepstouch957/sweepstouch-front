'use client';

import { Box, Card, Typography, Skeleton, Stack, alpha, useTheme } from '@mui/material';
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
  const theme = useTheme();
  // Gradiente derivado del token: no hay pares de hex quemados que se salteen el theme.
  const grad = (c: string) => `linear-gradient(135deg, ${c}, ${alpha(c, 0.6)})`;

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
      color: theme.palette.info.main,
      gradient: grad(theme.palette.info.main),
      subtitle: 'Barcode scans',
    },
    {
      label: 'Unique Customers',
      value: data.kpis.uniqueCustomers.toLocaleString(),
      icon: <PeopleAltIcon />,
      color: theme.palette.primary.main,
      gradient: grad(theme.palette.primary.main),
      subtitle: 'Active shoppers',
    },
    {
      label: 'Confirmed Purchases',
      value: data.kpis.confirmedPurchases.toLocaleString(),
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
      gradient: grad(theme.palette.success.main),
      subtitle: `${data.kpis.conversionRate}% conversion`,
    },
    {
      label: 'Points Awarded',
      value: data.kpis.totalPoints.toLocaleString(),
      icon: <StarIcon />,
      color: theme.palette.warning.main,
      gradient: grad(theme.palette.warning.main),
      subtitle: 'Loyalty points',
    },
    {
      label: 'Shopping Lists',
      value: data.shoppingLists.total.toLocaleString(),
      icon: <ShoppingCartIcon />,
      color: theme.palette.secondary.main,
      gradient: grad(theme.palette.secondary.main),
      subtitle: `${data.shoppingLists.validated} validated`,
    },
    {
      label: 'Items Selected',
      value: data.shoppingLists.totalItems.toLocaleString(),
      icon: <InventoryIcon />,
      color: theme.palette.success.dark,
      gradient: grad(theme.palette.success.dark),
      subtitle: `${data.shoppingLists.uniqueCustomers} customers`,
    },
    {
      label: 'Messages Sent',
      value: data.messaging.total.toLocaleString(),
      icon: <EmailIcon />,
      color: theme.palette.text.secondary,
      gradient: grad(theme.palette.text.secondary),
      subtitle: `${data.messaging.deliveryRate}% delivery`,
    },
    {
      label: 'MMS Campaigns',
      value: data.messaging.mms.toLocaleString(),
      icon: <TrendingUpIcon />,
      color: theme.palette.error.main,
      gradient: grad(theme.palette.error.main),
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
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            // Sin sombras: el hover se marca con borde + tinte del mismo rol.
            transition: 'border-color 0.2s, background-color 0.2s',
            animation: `fadeInUp 0.5s ease ${idx * 60}ms both`,
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            '&:hover': {
              borderColor: alpha(kpi.color, 0.4),
              bgcolor: alpha(kpi.color, 0.04),
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
