'use client';

import { Promo, PromoResults } from '@/components/application-ui/tables/promos/results';
import PageHeading from '@/components/base/page-heading';
import { usePromos } from '@/hooks/fetching/promos/usePromos';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import { promoService } from '@/services/promo.service';
import { useCustomization } from '@/hooks/use-customization';
import { Create } from '@mui/icons-material';
import { Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateOrEditPromoModal } from '../../dialogs/promo/promoDialog';

interface PromoDashboardProps {
  storeId?: string; // opcional para usar en vista de tienda
}

export const PromoDashboard = ({ storeId }: PromoDashboardProps) => {
  const customization = useCustomization();
  const { t } = useTranslation();

  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [promo, setPromo] = useState<Promo>();

  const {
    data: promoData,
    isPending,
    refetch,
  } = usePromos({ page: filters.page, limit: filters.limit, storeId });

  const { data: sweepstakes, isLoading: loadingSweepstakes } = useSweepstakes();

  const handleDeletePromo = async (id: string) => {
    if (!id) return;

    const confirmed = window.confirm(
      t('Are you sure you want to delete this promotion?')
    );
    if (!confirmed) return;

    try {
      await promoService.deletePromo(id);
      refetch(); // recargar la lista
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

  const pageMeta = {
    title: storeId ? 'Promociones por tienda' : 'List Ads',
    description: storeId
      ? 'Promociones activas para esta tienda'
      : 'Aquí puedes gestionar todas las promociones',
  };

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title={t(pageMeta.title)}
          description={pageMeta.description}
          actions={
            <Button
              sx={{ mt: { xs: 2, md: 0 } }}
              variant="contained"
              startIcon={<Create fontSize="small" />}
              onClick={() => {
                setPromo(undefined);
                setOpenModal(true);
              }}
            >
              {t('Create')}
            </Button>
          }
        />

        <Box mt={4}>
          {isPending ? (
            <Box
              display="flex"
              justifyContent="center"
              py={8}
            >
              <CircularProgress />
            </Box>
          ) : !promoData ? (
            <Typography
              color="error"
              py={6}
              textAlign="center"
            >
              Error al cargar promociones
            </Typography>
          ) : (
            <PromoResults
              promos={[...(promoData.genericPromos || []), ...(promoData.customPromos || [])]}
              total={promoData.meta.total}
              page={filters.page}
              limit={filters.limit}
              onChangePage={handleChangePage}
              onChangeLimit={handleChangeLimit}
              onEdit={(promo) => {
                setPromo(promo);
                setOpenModal(true);
              }}
              onDelete={handleDeletePromo}
              idStore={storeId}
            />
          )}
        </Box>
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
