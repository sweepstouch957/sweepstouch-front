'use client';
import * as React from 'react';
import { Box } from '@mui/material';
import CashiersTable from '@/components/application-ui/tables/cashiers/cashiers-table';

export default function Page(): JSX.Element {
  return (
    <Box p={3}>
      <CashiersTable />
    </Box>
  );
}
