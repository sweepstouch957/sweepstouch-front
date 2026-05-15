'use client';

import { Promo, PromoResults } from '@/components/application-ui/tables/promos/results';
import PageHeading from '@/components/base/page-heading';
import { usePromos } from '@/hooks/fetching/promos/usePromos';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import { promoService } from '@/services/promo.service';
import { useCustomization } from '@/hooks/use-customization';
import {
  AutoAwesome,
  Campaign,
  CheckCircleOutline,
  HourglassEmpty,
  PlayCircleOutline,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Skeleton,
  Typography,
  alpha,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateOrEditPromoModal } from '../../dialogs/promo/promoDialog';

interface PromoDashboardProps {
  storeId?: string;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard = ({ label, value, icon, color, loading }: StatCardProps) => (
  <Card
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        borderColor: color,
        boxShadow: `0 4px 20px ${alpha(color, 0.12)}`,
      },
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: alpha(color, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      {loading ? (
        <>
          <Skeleton width={36} height={28} sx={{ mb: 0.25 }} />
          <Skeleton width={72} height={14} />
        </>
      ) : (
        <>
          <Typography variant="h5" fontWeight={700} lineHeight={1.1}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {label}
          </Typography>
        </>
      )}
    </Box>
  </Card>
);

export const PromoDashboard = ({ storeId }: PromoDashboardProps) => {
  const customization = useCustomization();
  const { t } = useTranslation();

  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [promo, setPromo] = useState<Promo>();

  const { data: promoData, isPending, refetch } = usePromos({
    page: filters.page,
    limit: filters.limit,
    storeId,
  });

  const { data: sweepstakes, isLoading: loadingSweepstakes } = useSweepstakes();

  const allPromos = useMemo(
    () => [...(promoData?.genericPromos || []), ...(promoData?.customPromos || [])],
    [promoData],
  );

  const stats = useMemo(
    () => ({
      total: promoData?.meta?.total || 0,
      active: allPromos.filter((p) => p.status === 'in_progress' || p.status === 'active').length,
      pending: allPromos.filter((p) => p.status === 'pending').length,
      completed: allPromos.filter((p) => p.status === 'completed').length,
    }),
    [allPromos, promoData],
  );

  const handleDeletePromo = async (id: string) => {
    if (!id) return;
    const confirmed = window.confirm(t('Are you sure you want to delete this promotion?'));
    if (!confirmed) return;
    try {
      await promoService.deletePromo(id);
      refetch();
    } catch (error) {
      console.error('Error deleting promo', error);
      alert(t('There was an error deleting the promotion.'));
    }
  };

  const stores = [
    { _id: 't1', name: 'Tienda Principal', logo: 'https://via.placeholder.com/50' },
    { _id: 't2', name: 'Sucursal Norte', logo: 'https://via.placeholder.com/50' },
  ];

  const handleChangePage = (page: number) => setFilters((prev) => ({ ...prev, page }));
  const handleChangeLimit = (limit: number) => setFilters({ page: 1, limit });

  const statCards = [
    {
      label: t('Total Ads'),
      value: stats.total,
      icon: <Campaign />,
      color: '#FC0C83',
    },
    {
      label: t('Active'),
      value: stats.active,
      icon: <PlayCircleOutline />,
      color: '#0288d1',
    },
    {
      label: t('Pending'),
      value: stats.pending,
      icon: <HourglassEmpty />,
      color: '#ed6c02',
    },
    {
      label: t('Completed'),
      value: stats.completed,
      icon: <CheckCircleOutline />,
      color: '#2e7d32',
    },
  ];

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title={t(storeId ? 'Store Ads' : 'Ads Management')}
          description={t(
            storeId
              ? 'Active promotions for this store'
              : 'Manage and monitor all your ads and promotions',
          )}
          actions={
            <Button
              variant="contained"
              startIcon={<AutoAwesome fontSize="small" />}
              onClick={() => {
                setPromo(undefined);
                setOpenModal(true);
              }}
              sx={{
                mt: { xs: 2, md: 0 },
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              {t('New Ad')}
            </Button>
          }
        />

        {/* Stats */}
        <Grid
          container
          spacing={2}
          sx={{ mt: 0.5, mb: 3 }}
        >
          {statCards.map((card) => (
            <Grid
              item
              xs={6}
              sm={3}
              key={card.label}
            >
              <StatCard
                {...card}
                loading={isPending}
              />
            </Grid>
          ))}
        </Grid>

        {/* Table or states */}
        {isPending ? (
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
          >
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Skeleton
                  variant="rounded"
                  width={48}
                  height={48}
                  sx={{ borderRadius: 2, flexShrink: 0 }}
                />
                <Box flex={1}>
                  <Skeleton
                    width="40%"
                    height={16}
                    sx={{ mb: 0.75 }}
                  />
                  <Skeleton
                    width="25%"
                    height={12}
                  />
                </Box>
                <Skeleton
                  width={64}
                  height={24}
                  sx={{ borderRadius: 10 }}
                />
                <Skeleton
                  width={72}
                  height={24}
                  sx={{ borderRadius: 10 }}
                />
              </Box>
            ))}
          </Card>
        ) : !promoData ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 10,
              gap: 1,
            }}
          >
            <Campaign sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography
              color="error"
              fontWeight={500}
            >
              {t('Error loading promotions')}
            </Typography>
          </Box>
        ) : (
          <PromoResults
            promos={allPromos}
            total={promoData.meta.total}
            page={filters.page}
            limit={filters.limit}
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
            onEdit={(p) => {
              setPromo(p);
              setOpenModal(true);
            }}
            onDelete={handleDeletePromo}
            idStore={storeId}
          />
        )}
      </Container>

      <CreateOrEditPromoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          refetch();
        }}
        sweepstakes={sweepstakes || []}
        loadingSweepstakes={loadingSweepstakes}
        stores={stores}
        storeId={storeId}
        promo={promo}
      />
    </>
  );
};
