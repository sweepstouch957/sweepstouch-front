'use client';

import PageHeading from '@/components/base/page-heading';
import { campaignClient } from '@/services/campaing.service';
import {
  alpha,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  Unstable_Grid2 as Grid,
  useTheme,
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import ExportButton from '../../buttons/export-button';
import Results from './results';

interface CampaignsGridProps {
  storeId?: string;
}

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: number | undefined;
  color: string;
  loading?: boolean;
}

const KpiCard = ({ icon, label, value, color, loading }: KpiCardProps) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: theme.shadows[3] },
      }}
    >
      <Box sx={{ height: 3, bgcolor: color }} />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.18 : 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="text.secondary" display="block" noWrap fontWeight={600}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={48} height={26} />
            ) : (
              <Typography fontWeight={800} fontSize={20} lineHeight={1.1} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {value?.toLocaleString() ?? 0}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

function CampaignsGrid({ storeId }: CampaignsGridProps) {
  const [filters, setFilters] = useState({
    status: '',
    title: '',
    storeName: '',
    type: '',
    platform: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 15,
    storeId,
  });
  const { t } = useTranslation();
  const theme = useTheme();

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignClient.getFilteredCampaigns(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  // Lightweight KPI counts by status
  const { data: completedCount, isLoading: loadingCompleted } = useQuery({
    queryKey: ['campaigns-count', 'completed', storeId],
    queryFn: () => campaignClient.getFilteredCampaigns({ status: 'completed', page: 1, limit: 1, storeId }),
    staleTime: 120_000,
    select: (d: any) => d?.total ?? 0,
  });

  const { data: scheduledCount, isLoading: loadingScheduled } = useQuery({
    queryKey: ['campaigns-count', 'scheduled', storeId],
    queryFn: () => campaignClient.getFilteredCampaigns({ status: 'scheduled', page: 1, limit: 1, storeId }),
    staleTime: 120_000,
    select: (d: any) => d?.total ?? 0,
  });

  const { data: cancelledCount, isLoading: loadingCancelled } = useQuery({
    queryKey: ['campaigns-count', 'cancelled', storeId],
    queryFn: () => campaignClient.getFilteredCampaigns({ status: 'cancelled', page: 1, limit: 1, storeId }),
    staleTime: 120_000,
    select: (d: any) => d?.total ?? 0,
  });

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error" variant="body1">Error al cargar campañas</Typography>
      </Box>
    );
  }

  return (
    <>
      <PageHeading
        title={t('Campaigns')}
        description={t('Overview of ongoing campaigns')}
        actions={<ExportButton eventName="campaigns:export" emitOnly />}
      />

      {/* KPI Summary Bar */}
      {isFetching && !isPending && (
        <LinearProgress sx={{ mb: 1, borderRadius: 1, height: 2, opacity: 0.6 }} />
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
          mt: 1,
        }}
      >
        <KpiCard
          icon={<CampaignRoundedIcon fontSize="small" />}
          label="Total filtrado"
          value={data?.total ?? 0}
          color={theme.palette.primary.main}
          loading={isFetching && isPending}
        />
        <KpiCard
          icon={<CheckCircleOutlineRoundedIcon fontSize="small" />}
          label="Completadas"
          value={completedCount}
          color="#10b981"
          loading={loadingCompleted}
        />
        <KpiCard
          icon={<ScheduleRoundedIcon fontSize="small" />}
          label="Programadas"
          value={scheduledCount}
          color="#f59e0b"
          loading={loadingScheduled}
        />
        <KpiCard
          icon={<CancelOutlinedIcon fontSize="small" />}
          label="Canceladas"
          value={cancelledCount}
          color="#ef4444"
          loading={loadingCancelled}
        />
      </Box>

      <Grid container mt={0} spacing={{ xs: 2, sm: 3 }}>
        <Grid xs={12}>
          <Results
            campaigns={data?.data || []}
            filters={filters}
            setFilters={setFilters}
            total={data?.total || 0}
            refetch={refetch}
            storeId={storeId}
            isLoading={isFetching}
          />
        </Grid>
      </Grid>

    </>
  );
}

export default CampaignsGrid;
