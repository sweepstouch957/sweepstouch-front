'use client';

/**
 * Sorteos y eventos en una sola pantalla. Un evento ES un sorteo (el de tipo
 * evento/NSA); tenerlos en dos páginas del menú hacía buscar el mismo dato en dos
 * lados. El interruptor de arriba cambia la vista y queda en la URL (?vista=eventos)
 * para poder compartir el link.
 */
import EventStores from '@/components/application-ui/content-shells/event-stores/event-stores';
import SweepstakesTable from '@/components/application-ui/tables/sweepstakes/table';
import { Add } from '@mui/icons-material';
import EventRounded from '@mui/icons-material/EventRounded';
import LocalPlayRounded from '@mui/icons-material/LocalPlayRounded';
import { Box, Button, Container, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

type Vista = 'sorteos' | 'eventos';

function Content(): React.JSX.Element {
  const customization = useCustomization();
  const router = useRouter();
  const vista: Vista = useSearchParams().get('vista') === 'eventos' ? 'eventos' : 'sorteos';
  const maxWidth = customization.stretch ? false : 'xl';

  const toggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      color="primary"
      value={vista}
      aria-label="Qué ver"
      onChange={(_, v: Vista | null) =>
        v && router.replace(v === 'eventos' ? '?vista=eventos' : '?', { scroll: false })
      }
      sx={{ bgcolor: 'background.paper', '& .MuiToggleButton-root': { px: 2, gap: 0.75, fontWeight: 700 } }}
    >
      <ToggleButton value="sorteos">
        <LocalPlayRounded fontSize="small" />
        Sorteos
      </ToggleButton>
      <ToggleButton value="eventos">
        <EventRounded fontSize="small" />
        Eventos
      </ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <>
      <Container
        maxWidth={maxWidth}
        sx={{ pt: { xs: 2, sm: 3 } }}
      >
        {toggle}
      </Container>

      {vista === 'eventos' ? (
        // Trae su propio encabezado, métricas y tabla de tiendas de evento.
        <EventStores />
      ) : (
        <>
          <Container
            sx={{ py: { xs: 2, sm: 3 } }}
            maxWidth={maxWidth}
          >
            <PageHeading
              sx={{ px: 0 }}
              title="Sorteos"
              description="Crea, edita y sigue los sorteos de las tiendas"
              actions={
                <Button
                  sx={{ mt: { xs: 2, md: 0 } }}
                  variant="contained"
                  startIcon={<Add fontSize="small" />}
                  href="/admin/management/sweepstakes/create"
                >
                  Nuevo sorteo
                </Button>
              }
            />
          </Container>
          <Box pb={{ xs: 2, sm: 3 }}>
            <Container maxWidth={maxWidth}>
              <SweepstakesTable />
            </Container>
          </Box>
        </>
      )}
    </>
  );
}

export default function Page(): React.JSX.Element {
  // useSearchParams exige un límite de Suspense en el app router.
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
