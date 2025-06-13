'use client';

import { Divider } from '@mui/material';
import React from 'react';
import Mailbox from 'src/components/application-ui/content-shells/mailbox/mailbox';

function Page(): React.JSX.Element {
  return (
    <>
      <Divider />
      <Mailbox />
    </>
  );
}
export default Page;
