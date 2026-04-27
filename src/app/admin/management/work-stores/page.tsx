'use client';

import type { ReactNode } from 'react';
import StoresNearbyTable from '@/components/application-ui/tables/stores-warning/results';
import PageHeading from '@/components/base/page-heading';
import { useNearUnderStores } from '@/hooks/fetching/promoter/useInWarningStores';
import { SortByOption } from '@models/near-by';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import StorefrontIcon from '@mui/icons-material/Storefront';
import {
  alpha,
  Box,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}

const KpiCard = ({ icon, label, value, sub, color, loading }: KpiCardProps) => {
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
        position: 'relative',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: theme.shadows[4] },
      }}
    >
      <Box sx={{ height: 3, bgcolor: color }} />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.15 : 0.1),
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
            <Typography variant="caption" color="text.secondary" display="block" mb={0.25} noWrap>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={56} height={28} />
            ) : (
              <Typography fontWeight={800} fontSize={22} lineHeight={1} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </Typography>
            )}
            {sub && !loading && (
              <Typography variant="caption" color="text.disabled" display="block" mt={0.25}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const WorkStoresPage = () => {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [radiusMi, setRadiusMi] = useState<number>(20);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [audienceMax, setAudienceMax] = useState<string>('1500');
  const [sortBy, setSortBy] = useState<SortByOption>('nearest');

  useEffect(() => {
    if (q !== searchTerm) setSearchTerm(q);
  }, [searchParams, q]);

  const { data, isError, isLoading, isFetching, refetch } = useNearUnderStores({
    audienceLt: Number(audienceMax) > 0 ? Number(audienceMax) : 1500,
    radiusMi,
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm,
  });

  // KPI derivations
  const kpis = useMemo(() => {
    const allStores = data?.stores ?? [];
    const withPromoters = allStores.filter((s) => (s.promoters?.length ?? 0) > 0);
    const available = withPromoters.filter((s) => s.store.canImpulse !== false);
    const busy = withPromoters.filter((s) => s.store.canImpulse === false);
    return {
      total: data?.totalStores ?? 0,
      withPromoters: withPromoters.length,
      available: available.length,
      busy: busy.length,
    };
  }, [data]);

  const handleChangeRadius = (r: number) => {
    setRadiusMi(r);
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      <PageHeading
        sx={{ px: 0 }}
        title="Tiendas Candidatas"
        description="Tiendas con bajo tráfico que pueden beneficiarse de una impulsadora"
      />

      {/* Fetching bar */}
      {isFetching && !isLoading && (
        <LinearProgress sx={{ mb: 1, borderRadius: 1, height: 2, opacity: 0.7 }} />
      )}

      {/* KPI grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
          mt: 1,
        }}
      >
        <KpiCard
          icon={<StorefrontIcon />}
          label="Total tiendas"
          value={kpis.total}
          sub="candidatas"
          color={theme.palette.primary.main}
          loading={isLoading}
        />
        <KpiCard
          icon={<PeopleAltIcon />}
          label="Con promotoras"
          value={kpis.withPromoters}
          sub="en esta vista"
          color="#10b981"
          loading={isLoading}
        />
        <KpiCard
          icon={<RocketLaunchIcon />}
          label="Listas para impulsar"
          value={kpis.available}
          sub="disponibles ahora"
          color="#6366f1"
          loading={isLoading}
        />
        <KpiCard
          icon={<MyLocationIcon />}
          label="Radio activo"
          value={`${radiusMi} mi`}
          sub={`audiencia ≤ ${Number(audienceMax) > 0 ? Number(audienceMax).toLocaleString() : '1,500'}`}
          color="#f59e0b"
          loading={isLoading}
        />
      </Box>

      <StoresNearbyTable
        radiusKm={data?.radiusMi}
        stores={data?.stores ?? []}
        total={data?.totalStores ?? 0}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        // pagination
        page={page}
        rowsPerPage={rowsPerPage}
        onChangePage={setPage}
        onChangeRowsPerPage={(n) => { setRowsPerPage(n); setPage(0); }}
        // filters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        audienceMax={audienceMax}
        onAudienceMaxChange={(v) => { if (/^\d*$/.test(v)) setAudienceMax(v); }}
        // new
        radiusMi={radiusMi}
        onChangeRadius={handleChangeRadius}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </Container>
  );
};

export default WorkStoresPage;
