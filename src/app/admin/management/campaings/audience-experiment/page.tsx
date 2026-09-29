'use client';

import React from 'react';
import { EmptyBlock, PanelCard } from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import AudienceExperiment from 'src/components/application-ui/content-shells/audience-experiment/audience-experiment';
import { useAuth } from 'src/hooks/use-auth';

function Page(): React.JSX.Element {
  const { user } = useAuth();
  // Sólo admin (el backend también lo exige): ni siquiera se monta el shell, así no consulta nada.
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
  return <AudienceExperiment />;
}

export default Page;
