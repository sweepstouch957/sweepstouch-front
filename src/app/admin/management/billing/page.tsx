'use client';

import BillingManagement from '@/components/application-ui/content-shells/billing-management/billing-management';
import React, { Suspense } from 'react';

function Page(): React.JSX.Element {
  // Suspense porque el shell lee la pestaña activa con useSearchParams
  return (
    <Suspense fallback={null}>
      <BillingManagement />
    </Suspense>
  );
}

export default Page;
