'use client';

import CampaignsGrid from '@/components/application-ui/tables/campaings/campaings';
import PostAddRoundedIcon from '@mui/icons-material/PostAddRounded';
import { Box, Button, Stack } from '@mui/material';
import { useState, type FC } from 'react';
import ManageTemplatesDialog from './templates/ManageTemplatesDialog';

interface CampaignsPanelProps {
  storeId: string;
  storeName: string;
  onCreate?: () => void;
}

const CampaignsPanel: FC<CampaignsPanelProps> = ({ storeId }) => {
  // Plantillas de mensaje de la tienda: también se administran desde acá, no sólo al crear.
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{ mb: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<PostAddRoundedIcon />}
          onClick={() => setTemplatesOpen(true)}
        >
          Plantillas de mensaje
        </Button>
      </Stack>
      <CampaignsGrid
        storeId={storeId}
        forceCards
      />
      <ManageTemplatesDialog
        storeId={storeId}
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
    </Box>
  );
};

export default CampaignsPanel;
