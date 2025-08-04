'use client';

import NewPromoterModal from '@/components/application-ui/dialogs/promotor/modal';
import KpiSection from '@/components/application-ui/section-headings/kpis/kpis';
import PromoterTable from '@/components/application-ui/tables/kpi/results';
import { promoterService } from '@/services/promotor.service';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Box, Button, Container } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(4);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['promoters'],
    queryFn: () => promoterService.getAllPromoters(),
  });
  const { t } = useTranslation();
  const pageMeta = {
    title: 'Promotors',
    description: 'Gestión de Impulsadoras',
    icon: <FileDownloadOutlinedIcon />,
  };
  return (
    <>
      {pageMeta.title && (
        <Container
          sx={{
            py: {
              xs: 2,
              sm: 3,
            },
          }}
          maxWidth={customization.stretch ? false : 'xl'}
        >
          <PageHeading
            sx={{
              px: 0,
            }}
            title={t(pageMeta.title)}
            description={pageMeta.description && pageMeta.description}
            actions={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: 10,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
                onClick={() => setModalOpen(true)}
              >
                Nueva Impulsadora
              </Button>
            }
          />
        </Container>
      )}
      <Box
        pb={{
          xs: 2,
          sm: 3,
        }}
      >
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          <KpiSection />
          <Box
            sx={{
              mt: 2,
              mb: 3,
            }}
          >
            <PromoterTable
              promoters={data || []}
              isLoading={isLoading}
              isError={isError}
              refetch={refetch}
              search={search}
              setSearch={setSearch}
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
            />{' '}
          </Box>
        </Container>
      </Box>
      <NewPromoterModal
        open={modalOpen}
        onCreated={() => {
          setModalOpen(false);
          refetch();

        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
export default Page;
