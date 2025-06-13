import CampaignsGrid from '@/components/application-ui/tables/campaings/campaings';
import { Box, Typography } from '@mui/material';
import type { FC } from 'react';

interface CampaignsPanelProps {
  storeId: string;
  storeName: string;
  onCreate?: () => void;
}

interface CampaignsHeaderProps {
  storeName: string;
}

const CampaignsHeader: FC<CampaignsHeaderProps> = () => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      mb={2}
    >
      <Typography
        variant="h4"
        fontWeight={600}
      >
        Campañas
      </Typography>
    </Box>
  );
};

const CampaignsPanel: FC<CampaignsPanelProps> = ({ storeId, storeName, onCreate }) => {
  return (
    <Box p={3}>
      <CampaignsHeader storeName={storeName} />
      <CampaignsGrid storeId={storeId} />
    </Box>
  );
};

export default CampaignsPanel;
