import { Box, Divider, Stack, styled, Typography } from '@mui/material';
import { ChartsAxisContentProps } from '@mui/x-charts';

// === Tooltip helpers ===
const usd = (n: number) =>
  Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));
export const LegendRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: theme.typography.pxToRem(14),
}));

export const Dot = styled('span')<{ color: string }>(({ color }) => ({
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: 999,
  background: color,
}));

export const AxisTooltipTotal: React.FC<ChartsAxisContentProps> = (props) => {
  // `props` contiene la info del punto activo (índice, series, label, etc.)
  const p: any = props as any;
  const idx = p?.dataIndex ?? 0;
  const axisLabel = p?.axisLabel ?? '';

  // series -> [{ label, data[], color }]
  const items =
    p?.series?.map((s: any) => ({
      label: s.label ?? s.id,
      value: s.data?.[idx] ?? 0,
      color: s.color,
    })) ?? [];

  const total = items.reduce((acc: number, it: any) => acc + Number(it.value || 0), 0);

  return (
    <Stack
      sx={{ p: 1 }}
      bgcolor={'#ffffff'}
      borderRadius={2}
    >
      <Typography
        variant="caption"
        sx={{ mb: 0.5 }}
      >
        {axisLabel}
      </Typography>

      {items.map((it: any) => (
        <Box
          key={it.label}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 999,
              background: it.color,
            }}
          />
          <Typography sx={{ minWidth: 90 }}>{it.label}</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography fontWeight={600}>{usd(it.value)}</Typography>
        </Box>
      ))}

      <Divider sx={{ my: 0.5 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography fontWeight={700}>Total</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography fontWeight={800}>{usd(total)}</Typography>
      </Box>
    </Stack>
  );
};
