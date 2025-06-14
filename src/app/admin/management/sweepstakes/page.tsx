'use client';

import SweepstakesTable from '@/components/application-ui/tables/sweepstakes/table';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ProjectsListing from 'src/components/application-ui/tables/projects/projects';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const pageMeta = {
    title: 'Sweepstakes',
    description: 'Manage and monitor sweepstakes',
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
              <>
                <Button
                  sx={{
                    mt: {
                      xs: 2,
                      md: 0,
                    },
                  }}
                  variant="contained"
                  startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
                >
                  {t('Export')}
                </Button>
              </>
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
          <SweepstakesTable />
        </Container>
      </Box>
    </>
  );
}
export default Page;
