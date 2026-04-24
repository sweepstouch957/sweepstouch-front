'use client';

import { use } from 'react';
import RequestDetail from '@/components/campaign-requests/RequestDetail';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CampaignRequestDetailPage({ params }: Props) {
  const { id } = use(params);
  const customization = useCustomization();
  const router = useRouter();

  return (
    <>
      <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ py: { xs: 2, sm: 3 } }}>
        <PageHeading
          sx={{ px: 0 }}
          title="Detalle de solicitud"
          description="Revisa los requerimientos del cliente y gestiona las propuestas de diseño"
          actions={
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/admin/management/campaign-requests')}
              variant="outlined"
              size="small"
            >
              Volver
            </Button>
          }
        />
      </Container>

      <Box pb={{ xs: 2, sm: 4 }}>
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          <RequestDetail id={id} />
        </Container>
      </Box>
    </>
  );
}
