'use client';

import { tint, toneText } from '@/theme/semantic';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { deliveryGrade, num, pct } from './constants';
import { Pill, soft, StatsCard } from './ui';

export function DeliveryCard({
  audience,
  sent,
  errors,
  pending,
  channels,
  onOpenDelivered,
  onOpenErrors,
  onResend,
}: {
  audience: number;
  sent: number;
  errors: number;
  pending: number;
  /** "por SMS", "por SMS, MMS y RCS"… */
  channels: string;
  onOpenDelivered: () => void;
  onOpenErrors: () => void;
  onResend: () => void;
}) {
  const theme = useTheme();
  const rate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
  const grade = deliveryGrade(rate);
  const base = Math.max(audience, sent + errors + pending, 1);
  const segs = [
    { key: 'ok', label: 'Entregados', n: sent, color: theme.palette.success.main, onClick: onOpenDelivered },
    { key: 'err', label: 'Con error', n: errors, color: theme.palette.error.main, onClick: onOpenErrors },
    { key: 'pend', label: 'Pendientes', n: pending, color: theme.palette.info.main },
  ];

  return (
    <StatsCard
      title="Entrega de la campaña"
      subtitle={`${num(audience)} mensajes enviados ${channels}`}
      badge={
        <Pill
          label={grade.label}
          tone={grade.tone}
          dot={false}
        />
      }
    >
      <Stack
        direction="row"
        alignItems="baseline"
        gap={1.25}
        flexWrap="wrap"
      >
        <Typography sx={{ fontSize: { xs: 44, sm: 52 }, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>
          {rate}%
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>de los mensajes llegó al teléfono</Typography>
      </Stack>

      <Box
        sx={{ display: 'flex', height: 16, borderRadius: 2, overflow: 'hidden', gap: '2px', bgcolor: soft(theme) }}
        aria-label={`Entregados ${pct(sent, base)}, con error ${pct(errors, base)}, pendientes ${pct(pending, base)}`}
      >
        {segs
          .filter((s) => s.n > 0)
          .map((s) => (
            <Box
              key={s.key}
              sx={{ width: `${(s.n / base) * 100}%`, minWidth: 4, bgcolor: s.color }}
            />
          ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
        {segs.map((s) => (
          <Stack
            key={s.key}
            gap={0.25}
            onClick={s.onClick}
            role={s.onClick ? 'button' : undefined}
            sx={{ cursor: s.onClick ? 'pointer' : 'default', minWidth: 0, '&:hover .n': s.onClick ? { color: 'primary.main' } : {} }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={0.75}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: s.color, flex: 'none' }} />
              <Typography
                noWrap
                sx={{ fontSize: 12, color: 'text.secondary' }}
              >
                {s.label}
              </Typography>
            </Stack>
            <Typography
              className="n"
              sx={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', transition: 'color .15s' }}
            >
              {num(s.n)}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{pct(s.n, base)}</Typography>
          </Stack>
        ))}
      </Box>

      {errors > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
          sx={{ mt: 'auto', bgcolor: tint(theme, 'warning'), borderRadius: 3, px: 2, py: 1.75 }}
        >
          <WarningRoundedIcon sx={{ color: 'warning.main', flex: 'none' }} />
          <Typography sx={{ flex: 1, minWidth: 180, fontSize: 13, color: toneText(theme, 'warning') }}>
            <strong>{num(errors)} mensajes no llegaron</strong> ({pct(errors, audience)} de la audiencia). Puedes
            reenviarlos a los que todavía se pueden recuperar.
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="warning"
            disableElevation
            onClick={onResend}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Reenviar
          </Button>
        </Stack>
      )}
    </StatsCard>
  );
}
