'use client';

import CampaignStats from '@/components/application-ui/content-shells/campaign-stats/campaign-stats';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 1.5, sm: 3, lg: 5 }, pt: { xs: 1, sm: 2.5 } }}>
      {id && <CampaignStats campaignId={id} />}
    </Box>
  );
}
