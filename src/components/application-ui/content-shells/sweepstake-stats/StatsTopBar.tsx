'use client';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { routes } from 'src/router/routes';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<
  ReturnType<typeof useSweepstakeStats>,
  | 'exporting'
  | 'sweepstake'
  | 'sweepstakeLoading'
  | 'metricsLoading'
  | 'metricsFetching'
  | 'refetchMetrics'
  | 'refetchDaily'
  | 'handleExport'
  | 'lastUpdated'
>;

/** Barra superior: volver, nombre y estado del sorteo, indicador en vivo, actualizar y descargar CSV. */
export function StatsTopBar({
  exporting,
  sweepstake,
  sweepstakeLoading,
  metricsLoading,
  metricsFetching,
  refetchMetrics,
  refetchDaily,
  handleExport,
  lastUpdated,
}: Props) {
  const theme = useTheme();
  const { push } = useRouter();

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1.5}
      sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
    >
      <Tooltip title="Volver a sorteos">
        <IconButton
          onClick={() => push(routes.admin.management.sweepstakes.listing)}
          size="small"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {sweepstakeLoading ? (
        <Skeleton
          width={220}
          height={30}
          sx={{ borderRadius: 1 }}
        />
      ) : (
        <Typography
          variant="h5"
          fontWeight={800}
          noWrap
        >
          {sweepstake?.name}
        </Typography>
      )}

      {sweepstake && (
        <Chip
          size="small"
          label={sweepstake.status}
          color={sweepstake.status === 'active' ? 'success' : 'default'}
          sx={{ fontWeight: 700, textTransform: 'capitalize' }}
        />
      )}

      {sweepstake?.endDate && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: { xs: 'none', md: 'block' } }}
        >
          Finaliza:{' '}
          <b style={{ color: theme.palette.error.main }}>
            {format(new Date(sweepstake.endDate), 'MMM d, yyyy')}
          </b>
        </Typography>
      )}

      <Box flex={1} />

      {/* Live indicator */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: metricsFetching ? theme.palette.warning.main : theme.palette.success.main,
            boxShadow: `0 0 6px ${
              metricsFetching ? theme.palette.warning.main : theme.palette.success.main
            }`,
            animation: metricsFetching ? 'none' : 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%,100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          fontSize={11}
        >
          {metricsFetching ? 'Actualizando...' : lastUpdated ? `${lastUpdated}` : 'En vivo'}
        </Typography>
      </Stack>

      <Tooltip title="Actualizar">
        <IconButton
          size="small"
          onClick={() => {
            refetchMetrics();
            refetchDaily();
          }}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            width: 34,
            height: 34,
          }}
        >
          {metricsFetching ? (
            <AutorenewRoundedIcon
              fontSize="small"
              sx={{
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  from: { transform: 'rotate(0)' },
                  to: { transform: 'rotate(360deg)' },
                },
              }}
            />
          ) : (
            <RefreshRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Button
        variant="contained"
        disableElevation
        size="small"
        startIcon={
          exporting ? (
            <CircularProgress
              size={14}
              color="inherit"
            />
          ) : (
            <DownloadRoundedIcon />
          )
        }
        onClick={handleExport}
        disabled={exporting || metricsLoading}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        }}
      >
        Descargar CSV
      </Button>
    </Stack>
  );
}
