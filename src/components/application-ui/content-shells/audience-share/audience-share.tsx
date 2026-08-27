'use client';

/**
 * Compartir base — la herramienta y su historial.
 *
 * Vive aparte del dashboard de audiencia a propósito: ahí el flujo arranca de
 * una tienda concreta que el cruce por zona marcó como parada, y acá se elige
 * cualquier par de negocios. El historial es el mismo para las dos entradas.
 */

import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import { Container, Stack } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import PageHeading from 'src/components/base/page-heading';
import ShareHistory from './share-history';
import ShareTool from './share-tool';

export default function AudienceShare(): React.JSX.Element {
  // `?from=<storeId>` lo pone el botón de la ficha de la tienda.
  const initialFromId = useSearchParams().get('from');

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 2 }}
    >
      <PageHeading
        sx={{ px: 0 }}
        iconBox={<ShareRoundedIcon />}
        title="Compartir base"
        description="Activar los contactos de un negocio que no manda campañas dándole acceso a otro que sí. Se puede deshacer."
      />

      <Stack
        gap={2.5}
        sx={{ mt: 2 }}
      >
        <ShareTool initialFromId={initialFromId} />
        <ShareHistory />
      </Stack>
    </Container>
  );
}
