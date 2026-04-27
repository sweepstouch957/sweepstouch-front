'use client';

import CampaignOverview from '@/components/application-ui/dialogs/campaing';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Breadcrumbs, Button, Container, Link, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  if (!id || typeof id !== 'string') {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h5" color="text.secondary">
          No campaign ID provided.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 1, sm: 0 }, pb: { xs: 2, sm: 3 } }}>
      {/* Back navigation */}
      <Box mb={1.5} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.back()}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          Volver
        </Button>

        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="text.secondary"
            href="/admin/management/campaings"
            sx={{ fontSize: 13, fontWeight: 600 }}
          >
            Campañas
          </Link>
          <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 700 }}>
            Estadísticas
          </Typography>
        </Breadcrumbs>
      </Box>

      <CampaignOverview campaignId={id} />
    </Container>
  );
}
