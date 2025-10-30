import CashiersTable from '@/components/application-ui/tables/cashiers/cashiers-table';
import { Box } from '@mui/material';
import type { FC } from 'react';

interface CajerasPanelProps {
  storeId: string;
  storeName?: string;
}

const CajerasPanel: FC<CajerasPanelProps> = ({ storeId }) => {
  return (
    <Box p={3}>
      <CashiersTable
        storeId={storeId}
        endDate={new Date().toISOString().split('T')[0]}
        startDate={
          new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0]
        }
      />
    </Box>
  );
};

export default CajerasPanel;
