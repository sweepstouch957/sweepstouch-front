'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Box, Button, Container } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import UsersTableListing from 'src/components/application-ui/tables/users/users';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import { Layout } from 'src/layouts';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const pageMeta = {
    title: 'Users',
    description: 'Manage user accounts and permissions',
  };

  const triggerExport = (
    mode: 'filtered' | 'page' | 'selected' | 'all' = 'filtered'
  ) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('users-export', { detail: { mode } })
      );
    }
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
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => triggerExport('page')}
                  sx={{ mr: 1 }}
                >
                  {t('Export page')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => triggerExport('all')}
                  sx={{ mr: 1 }}
                >
                  {t('Export all')}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => triggerExport('filtered')}
                >
                  {t('Export filtered')}
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
          <UsersTableListing

          />
        </Container>
      </Box>
    </>
  );
}

export default Page;
