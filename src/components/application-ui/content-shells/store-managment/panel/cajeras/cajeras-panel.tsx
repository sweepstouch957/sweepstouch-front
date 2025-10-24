import { Box } from '@mui/material';
import type { FC } from 'react';
import CashiersTable from '@/components/application-ui/tables/cashiers/cashiers-table';

interface CajerasPanelProps {
  storeId: string;
  storeName?: string;
}

const CajerasPanel: FC<CajerasPanelProps> = ({ storeId }) => {
  return (
    <Box p={3}>
      <CashiersTable storeId={storeId} />
    </Box>
  );
};

export default CajerasPanel;
