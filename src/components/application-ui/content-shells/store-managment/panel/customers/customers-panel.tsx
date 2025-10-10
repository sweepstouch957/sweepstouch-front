import CustomersGrid from '@/components/application-ui/tables/customers/customers-grid';
import { Box } from '@mui/material';
import type { FC } from 'react';

interface CustomersPanelProps {
  storeId: string;
  storeName?: string;
}

const CustomersPanel: FC<CustomersPanelProps> = ({ storeId, storeName }) => {
  return (
    <Box p={3}>
      <CustomersGrid
        storeId={storeId}
        storeName={storeName} />
    </Box>
  );
};

export default CustomersPanel;
