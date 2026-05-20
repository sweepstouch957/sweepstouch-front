'use client';

import { campaignClient } from '@/services/campaing.service';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ContactMailRoundedIcon from '@mui/icons-material/ContactMailRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfDay,
  subMonths,
  startOfDay,
  endOfMonth,
  format,
} from 'date-fns';
import PageHeading from '@/components/base/page-heading';

const OPTIN_PRICE = 0.085;

type Period = 'current' | 'last1' | 'last2' | 'last3';

function getPeriodRange(period: Period): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  switch (period) {
    case 'current':
      return {
        startDate: startOfMonth(now).toISOString(),
        endDate: endOfDay(now).toISOString(),
        label: format(now, 'MMMM yyyy'),
      };
    case 'last1': {
      const d = subMonths(now, 1);
      return {
        startDate: startOfMonth(d).toISOString(),
        endDate: endOfMonth(d).toISOString(),
        label: format(d, 'MMMM yyyy'),
      };
    }
    case 'last2': {
      const d = subMonths(now, 2);
      return {
        startDate: startOfMonth(d).toISOString(),
        endDate: endOfMonth(d).toISOString(),
        label: format(d, 'MMMM yyyy'),
      };
    }
    case 'last3': {
      const d = subMonths(now, 3);
      return {
        startDate: startOfMonth(d).toISOString(),
        endDate: endOfMonth(d).toISOString(),
        label: format(d, 'MMMM yyyy'),
      };
    }
  }
}

function StatCard({
  icon,
  label,
  sublabel,
  value,
  color,
  pct,
  isCurrency,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: number;
  color: string;
  pct?: number;
  isCurrency?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: alpha(color, isDark ? 0.22 : 0.18),
        bgcolor: alpha(color, isDark ? 0.05 : 0.03),
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          borderColor: alpha(color, 0.45),
          boxShadow: `0 6px 20px ${alpha(color, 0.15)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          bgcolor: color,
          borderRadius: '4px 0 0 4px',
        }}
      />
      <Stack spacing={1} sx={{ pl: 0.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 28, height: 28, borderRadius: 1.5,
                bgcolor: alpha(color, isDark ? 0.2 : 0.12),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary' }}>
              {label}
            </Typography>
          </Stack>
          {pct !== undefined && (
            <Box
              sx={{
                px: 0.75, py: 0.25, borderRadius: 1,
                bgcolor: alpha(color, 0.12),
                border: `1px solid ${alpha(color, 0.2)}`,
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                {pct}%
              </Typography>
            </Box>
          )}
        </Stack>

        {loading ? (
          <Skeleton width={100} height={36} sx={{ borderRadius: 1 }} />
        ) : (
          <Stack direction="row" alignItems="baseline" spacing={0.4}>
            {isCurrency && (
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>$</Typography>
            )}
            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1,
                color,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-1px',
              }}
            >
              {isCurrency
                ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : value.toLocaleString()}
            </Typography>
          </Stack>
        )}

        <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.3 }}>
          {sublabel}
        </Typography>
      </Stack>
    </Box>
  );
}

export default function OptinMmsGlobalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [period, setPeriod] = useState<Period>('current');

  const { startDate, endDate, label } = useMemo(() => getPeriodRange(period), [period]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['optin-mms-count-global', startDate, endDate],
    queryFn: () => campaignClient.getOptinMmsCount({ startDate, endDate }),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });

  const sent = data?.sent ?? 0;
  const skipped = data?.skipped ?? 0;
  const total = data?.total ?? 0;
  const estimatedCost = data?.estimatedCost ?? 0;
  const sentRate = total > 0 ? Math.round((sent / total) * 100) : 0;
  const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

  const accentColor =
    estimatedCost < 200 ? '#10b981' :
    estimatedCost < 800 ? '#f59e0b' :
    '#ef4444';

  return (
    <>
      <PageHeading
        title="Opt-in MMS"
        description="Registro de confirmaciones de sorteos enviadas por mes. No aparecen como campañas — se facturan por separado."
        actions={
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Select
              size="small"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              sx={{ fontSize: 13, fontWeight: 700, minWidth: 160 }}
            >
              <MenuItem value="current">Mes actual</MenuItem>
              <MenuItem value="last1">Mes anterior</MenuItem>
              <MenuItem value="last2">Hace 2 meses</MenuItem>
              <MenuItem value="last3">Hace 3 meses</MenuItem>
            </Select>
          </Stack>
        }
      />

      {/* Period badge + loading bar */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2} mt={1}>
        <Chip
          icon={<ContactMailRoundedIcon sx={{ fontSize: 14 }} />}
          label={label}
          size="small"
          sx={{
            fontWeight: 700, fontSize: 12,
            bgcolor: alpha(accentColor, 0.1),
            color: accentColor,
            border: `1px solid ${alpha(accentColor, 0.25)}`,
            '& .MuiChip-icon': { color: accentColor },
          }}
        />
        <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
          ${OPTIN_PRICE}/msg · facturado en la línea "optin" de cada tienda
        </Typography>
        <Tooltip
          title="Cada cliente que escanea el QR o se registra en un sorteo recibe un MMS de confirmación. Los 'omitidos' son opt-outs o clientes inactivos y no se cobran."
          arrow placement="top"
        >
          <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled', cursor: 'help' }} />
        </Tooltip>
        {isFetching && !isLoading && (
          <CircularProgress size={14} sx={{ color: accentColor }} />
        )}
      </Stack>

      {isFetching && !isLoading && (
        <LinearProgress
          sx={{
            mb: 2, height: 2, borderRadius: 1,
            bgcolor: alpha(accentColor, 0.12),
            '& .MuiLinearProgress-bar': { bgcolor: accentColor },
          }}
        />
      )}

      {/* KPI cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <StatCard
          icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          label="MMS Enviados"
          sublabel="clientes activos que recibieron el MMS"
          value={sent}
          color="#10b981"
          pct={sentRate}
          loading={isLoading}
        />
        <StatCard
          icon={<BlockRoundedIcon sx={{ fontSize: 16 }} />}
          label="MMS Omitidos"
          sublabel="opt-outs / inactivos · no se cobran"
          value={skipped}
          color="#6b7280"
          pct={skipRate}
          loading={isLoading}
        />
        <StatCard
          icon={<PeopleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          label="Registros totales"
          sublabel="participantes que escanearon QR o se registraron"
          value={total}
          color={accentColor}
          loading={isLoading}
        />
        <StatCard
          icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
          label="Costo estimado"
          sublabel={`$${OPTIN_PRICE} × ${sent.toLocaleString()} msg · incluido en factura`}
          value={estimatedCost}
          color={accentColor}
          isCurrency
          loading={isLoading}
        />
      </Box>

      {/* Sent rate bar */}
      {!isLoading && total > 0 && (
        <Box
          sx={{
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
            p: 2,
            mb: 3,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
              Tasa de entrega
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
              {sentRate}%
            </Typography>
          </Stack>
          <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: alpha('#ef4444', 0.12), overflow: 'hidden' }}>
            <Box
              sx={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: `${sentRate}%`,
                bgcolor: accentColor,
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </Box>
          <Stack direction="row" justifyContent="space-between" mt={0.75}>
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
              {sent.toLocaleString()} enviados
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
              {skipped.toLocaleString()} omitidos
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Pricing note */}
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha('#f59e0b', isDark ? 0.2 : 0.15),
          bgcolor: alpha('#f59e0b', isDark ? 0.04 : 0.03),
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16, color: '#f59e0b', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
          Los MMS de opt-in <strong>no aparecen en el listado de campañas</strong>. Son cargos automáticos generados por el sistema de registro de sorteos. Cada participante que escanea el QR recibe un mensaje de confirmación a <strong>${OPTIN_PRICE}/msg</strong>.
        </Typography>
      </Box>
    </>
  );
}
