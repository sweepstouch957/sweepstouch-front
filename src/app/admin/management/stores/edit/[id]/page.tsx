'use client';

import StoreManagementPage from '@/components/application-ui/content-shells/store-managment/store-panel';
import { Divider } from '@mui/material';
import React from 'react';

function Page(): React.JSX.Element {
  return (
    <>
      <Divider />
      <StoreManagementPage />
    </>
  );
}
export default Page;
