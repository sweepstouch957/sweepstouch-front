// src/components/billing/components/BillingSummaryCards.tsx
'use client';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { alpha, Box, Card, CardContent, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
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
  const theme = useTheme();
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
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
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
                color: 'text.secondary',
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              sx={{ mt: 0.5, fontWeight: 700, color: 'text.primary' }}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: 'block', color: 'text.disabled' }}
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
        icon={<ReceiptLongIcon color="primary" />}
        iconBg={alpha(theme.palette.primary.main, 0.08)}
      />

      <CardItem
        label="Total pagado"
        value={formatMoney(totalPaid, currency)}
        caption="Pagos registrados"
        icon={<AttachMoneyIcon color="success" />}
        iconBg={alpha(theme.palette.success.main, 0.08)}
      />

      <Card
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
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
                  color: 'text.secondary',
                }}
              >
                Pendiente
              </Typography>
              <Typography
                variant="h6"
                sx={{ mt: 0.5, fontWeight: 700, color: 'text.primary' }}
              >
                {formatMoney(totalPending, currency)}
              </Typography>

              <Typography
                variant="caption"
                sx={{ mt: 1, display: 'block', color: 'text.disabled' }}
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
                  bgcolor: alpha(theme.palette.text.primary, 0.08),
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
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              }}
            >
              <PaymentsIcon color="action" />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
