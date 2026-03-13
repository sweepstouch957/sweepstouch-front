'use client';

import BrandListing from '@/components/application-ui/tables/brands/BrandListing';
import { Box, Button, Container } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import AddIcon from '@mui/icons-material/Add';
import { BrandCreationModal } from '@/components/admin/stores/BrandCreationModal';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const pageMeta = {
    title: 'Brands',
    description: 'Manage all the store brands in the system',
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
            sx={{ px: 0 }}
            title={t(pageMeta.title)}
            description={pageMeta.description}
            actions={
              <Button
                sx={{
                  mt: {
                    xs: 2,
                    md: 0,
                  },
                }}
                variant="contained"
                onClick={() => setModalOpen(true)}
                startIcon={<AddIcon fontSize="small" />}
              >
                {t('Add Brand')}
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
          <BrandListing />
        </Container>
      </Box>
      <BrandCreationModal 
         open={modalOpen}
         onClose={() => setModalOpen(false)}
      />
    </>
  );
}
export default Page;
