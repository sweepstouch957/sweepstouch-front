'use client';

import { campaignClient } from '@/services/campaing.service';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContactMailRoundedIcon from '@mui/icons-material/ContactMailRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { startOfMonth, endOfDay, format } from 'date-fns';

interface OptinMmsBannerProps {
  storeId?: string;
}

const OPTIN_PRICE = 0.0585;

export default function OptinMmsBanner({ storeId }: OptinMmsBannerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);

  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now).toISOString(),
      endDate: endOfDay(now).toISOString(),
      label: format(now, 'MMMM yyyy'),
    };
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['optin-mms-count', startDate, endDate, storeId],
    queryFn: () => campaignClient.getOptinMmsCount({ startDate, endDate, storeId }),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    retry: false,
    enabled: !!storeId,
  });

  const sent = data?.sent ?? 0;
  const skipped = data?.skipped ?? 0;
  const total = data?.total ?? 0;
  const estimatedCost = data?.estimatedCost ?? 0;
  const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;
  const sentRate = total > 0 ? Math.round((sent / total) * 100) : 0;

  const accentColor =
    estimatedCost < 200 ? '#10b981' : estimatedCost < 800 ? '#f59e0b' : '#ef4444';

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: alpha(accentColor, isDark ? 0.25 : 0.2),
        bgcolor: alpha(accentColor, isDark ? 0.05 : 0.03),
        overflow: 'hidden',
        mb: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { borderColor: alpha(accentColor, 0.4), boxShadow: `0 4px 16px ${alpha(accentColor, 0.12)}` },
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded((p) => !p)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, cursor: 'pointer', gap: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} flex={1} minWidth={0}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
            <ContactMailRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box minWidth={0} overflow="hidden">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography noWrap sx={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Opt-in MMS — Registro de Sorteos
              </Typography>
              <Tooltip title={`Cada cliente que escanea el QR recibe un MMS de confirmación ($${OPTIN_PRICE}/msg). Estos costos se incluyen en la factura mensual como línea "optin".`} arrow placement="top">
                <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
              </Tooltip>
            </Stack>
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
              Periodo: {label} · ${OPTIN_PRICE}/msg · no aparecen como campañas
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} flexShrink={0}>
          {isLoading ? (
            <Skeleton width={160} height={24} sx={{ borderRadius: 1 }} />
          ) : (
            <>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>est.</Typography>
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: 'center' }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
                {sent.toLocaleString()} enviados
              </Typography>
              {skipped > 0 && (
                <Chip size="small" icon={<BlockRoundedIcon sx={{ fontSize: 12 }} />} label={`${skipped.toLocaleString()} omitidos`}
                  sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#10b981', border: `1px solid ${alpha('#10b981', 0.2)}`, '& .MuiChip-icon': { color: '#10b981' } }} />
              )}
            </>
          )}
          {isFetching && !isLoading && <CircularProgress size={12} sx={{ color: accentColor }} />}
          <IconButton size="small" sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'text.secondary' }}>
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Progress bar */}
      {!isLoading && total > 0 && (
        <Box sx={{ height: 2, bgcolor: alpha('#ef4444', 0.15), overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${sentRate}%`, bgcolor: accentColor, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
        </Box>
      )}

      {/* Expanded detail */}
      <Collapse in={expanded} unmountOnExit>
        <Divider />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 0 }}>
          {/* Enviados */}
          <Box sx={{ px: 2.5, py: 1.5, borderRight: { sm: '1px solid', xs: 'none' }, borderBottom: { xs: '1px solid', md: 'none' }, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14, color: '#10b981' }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>MMS Enviados</Typography>
              <Box sx={{ ml: 'auto', px: 0.75, py: 0.2, borderRadius: 1, bgcolor: alpha('#10b981', 0.1), border: `1px solid ${alpha('#10b981', 0.2)}` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{sentRate}%</Typography>
              </Box>
            </Stack>
            {isLoading ? <Skeleton width={80} height={28} /> : <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#10b981', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sent.toLocaleString()}</Typography>}
            <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.25 }}>clientes activos que recibieron el MMS</Typography>
          </Box>

          {/* Omitidos */}
          <Box sx={{ px: 2.5, py: 1.5, borderRight: { md: '1px solid', xs: 'none' }, borderBottom: { xs: '1px solid', md: 'none' }, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
              <BlockRoundedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>MMS Omitidos</Typography>
              {skipRate > 0 && (
                <Box sx={{ ml: 'auto', px: 0.75, py: 0.2, borderRadius: 1, bgcolor: alpha('#6b7280', 0.1), border: `1px solid ${alpha('#6b7280', 0.2)}` }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{skipRate}%</Typography>
                </Box>
              )}
            </Stack>
            {isLoading ? <Skeleton width={80} height={28} /> : <Typography sx={{ fontSize: 24, fontWeight: 900, color: 'text.secondary', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{skipped.toLocaleString()}</Typography>}
            <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.25 }}>opt-outs / inactivos · no se cobran</Typography>
          </Box>

          {/* Total */}
          <Box sx={{ px: 2.5, py: 1.5, borderRight: { sm: '1px solid', md: '1px solid' }, borderBottom: { xs: '1px solid', sm: 'none' }, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
              <ContactMailRoundedIcon sx={{ fontSize: 14, color: accentColor }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Registros totales</Typography>
            </Stack>
            {isLoading ? <Skeleton width={80} height={28} /> : <Typography sx={{ fontSize: 24, fontWeight: 900, color: accentColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</Typography>}
            <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.25 }}>participantes registrados en el periodo</Typography>
          </Box>

          {/* Costo */}
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
              <AttachMoneyIcon sx={{ fontSize: 14, color: accentColor }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Costo Estimado</Typography>
            </Stack>
            {isLoading ? <Skeleton width={100} height={28} /> : (
              <Stack direction="row" alignItems="baseline" spacing={0.4}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>$</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 900, color: accentColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Stack>
            )}
            <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.25 }}>
              ${OPTIN_PRICE} × {sent.toLocaleString()} msg · incluido en tu factura
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
