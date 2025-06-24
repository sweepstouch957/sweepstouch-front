import CampaignsGrid from '@/components/application-ui/tables/campaings/campaings';
import { Box, Typography } from '@mui/material';
import type { FC } from 'react';

interface CampaignsPanelProps {
  storeId: string;
  storeName: string;
  onCreate?: () => void;
}

const CampaignsPanel: FC<CampaignsPanelProps> = ({ storeId, storeName, onCreate }) => {
  return (
    <Box p={3}>
      <CampaignsGrid storeId={storeId} />
    </Box>
  );
};

export default CampaignsPanel;
