import CustomersGrid from '@/components/application-ui/tables/customers/customers-grid';
import { Box } from '@mui/material';
import type { FC } from 'react';

interface CustomersPanelProps {
  storeId: string;
}

const CustomersPanel: FC<CustomersPanelProps> = ({ storeId }) => {
  return (
    <Box p={3}>
      <CustomersGrid storeId={storeId} />
    </Box>
  );
};

export default CustomersPanel;
