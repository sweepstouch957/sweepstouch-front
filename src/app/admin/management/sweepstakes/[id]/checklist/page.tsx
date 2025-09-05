'use client';

import SweepstakeChecklist from '@/components/website/sweeptake-checklist';
import { CreateOutlined } from '@mui/icons-material';
import { Box, Container } from '@mui/material';
import { useParams } from 'next/navigation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const pageMeta = {
    title: 'Checklist | Sweepstake',
    description: 'Manage and monitor Sweepstake checklist',
    icon: <CreateOutlined />,
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
          />
        </Container>
      )}
      <Box
        pb={{
          xs: 2,
          sm: 3,
        }}
      >
        {!id ? (
          <div>Please provide a valid sweepstake ID in the URL.</div>
        ) : (
          <SweepstakeChecklist sweepstakeId={id} />
        )}
      </Box>
    </>
  );
}
export default Page;
