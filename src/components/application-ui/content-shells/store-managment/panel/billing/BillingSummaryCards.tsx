// src/components/billing/components/BillingSummaryCards.tsx
'use client';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { formatMoney } from './utils/billingFormatters';

type Props = {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  currency?: string;
  maxDaysOverdue?: number;
};

export function BillingSummaryCards({
  totalInvoiced,
  totalPaid,
  totalPending,
  currency = 'USD',
}: Props) {
  const ratio = totalInvoiced ? Math.min(100, (totalPending / totalInvoiced) * 100) : 0;

  type CardItemProps = {
    label: string;
    value: string;
    caption: string;
    icon: React.ReactNode;
    iconBg: string;
  };

  const CardItem = ({ label, value, caption, icon, iconBg }: CardItemProps) => (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        bgcolor: '#FFFFFF',
        minHeight: 112,
      }}
    >
      <CardContent sx={{ py: 2.5, px: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                fontWeight: 600,
                color: '#6B7280',
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              sx={{ mt: 0.5, fontWeight: 700, color: '#111827' }}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: 'block', color: '#9CA3AF' }}
            >
              {caption}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: iconBg,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
    >
      <CardItem
        label="Total facturado"
        value={formatMoney(totalInvoiced, currency)}
        caption="Histórico de facturas (no canceladas)"
        icon={<ReceiptLongIcon sx={{ color: '#1D4ED8' }} />}
        iconBg="rgba(37, 99, 235, 0.06)"
      />

      <CardItem
        label="Total pagado"
        value={formatMoney(totalPaid, currency)}
        caption="Pagos registrados"
        icon={<AttachMoneyIcon sx={{ color: '#16A34A' }} />}
        iconBg="rgba(22, 163, 74, 0.08)"
      />

      <Card
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 3,
          border: '1px solid #E5E7EB',
          bgcolor: '#FFFFFF',
          minHeight: 112,
        }}
      >
        <CardContent sx={{ py: 2.5, px: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  fontWeight: 600,
                  color: '#6B7280',
                }}
              >
                Pendiente
              </Typography>
              <Typography
                variant="h6"
                sx={{ mt: 0.5, fontWeight: 700, color: '#111827' }}
              >
                {formatMoney(totalPending, currency)}
              </Typography>

              <Typography
                variant="caption"
                sx={{ mt: 1, display: 'block', color: '#9CA3AF' }}
              >
                Saldo vencido / pendiente
              </Typography>
              <LinearProgress
                variant="determinate"
                value={ratio}
                sx={{
                  mt: 1,
                  height: 6,
                  borderRadius: 999,
                  bgcolor: '#E5E7EB',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(17, 24, 39, 0.04)',
              }}
            >
              <PaymentsIcon sx={{ color: '#4B5563' }} />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
