'use client';

import React from 'react';
import { EmptyBlock, PanelCard } from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import Recapture from 'src/components/application-ui/content-shells/recapture/recapture';
import { useAuth } from 'src/hooks/use-auth';

function Page(): React.JSX.Element {
  const { user } = useAuth();
  // Agenda campañas masivas a números de otras tiendas: sólo admin.
  if (user?.role !== 'admin') {
    return (
      <PanelCard sx={{ m: 3 }}>
        <EmptyBlock
          title="Sin acceso"
          hint="Esta página es sólo para administradores."
        />
      </PanelCard>
    );
  }
  return <Recapture />;
}

export default Page;
