'use client';

import { CustomActions } from '@/components/application-ui/actions/custom-actions';
import KpiSection from '@/components/application-ui/section-headings/kpis/kpis';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
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
            actions={<CustomActions />}
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
          <KpiSection/>
        </Container>
      </Box>
    </>
  );
}
export default Page;
