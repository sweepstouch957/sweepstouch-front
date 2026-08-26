'use client';

import { BriefFormRHF } from '@/components/application-ui/form-layouts/brief';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import { CreateOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Container, Stack } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import { routes } from 'src/router/routes';

// Valores iniciales — sin dependencias del componente, se crean una sola vez
const initialValues = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  winnersCount: 1,
  image: '',
  hasQr: false,
  rules: '',
  participationMessage:
    'Thank you for participating in the #StoreName!. Your participation code is: #Codigo',
  sweeptakeDescription: '',
  prizeIds: [] as string[],
  bannerDesktop: '',
  bannerMobile: '',
  mainColor: '#D4AF37',
  secondaryColor: '#C1121F',
};

// Metadata estática de la página, sin dependencias del componente
const pageMeta = {
  title: 'Create Sweepstake',
  description: 'Manage and monitor Sweepstake',
  icon: <CreateOutlined />,
};

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const { push } = useRouter();
  const qc = useQueryClient();

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: 'success' | 'error' | 'info';
  } | null>(null);

  // 🔧 Mutación de creación
  const createSweepstakeMutation = useMutation({
    mutationFn: async (values: any) => {
      // mapear prizeIds -> prize (lo que espera el backend)
      const { eventStore, ...rest } = values;
      const payload = {
        ...rest,
        prize: values.prizeIds,
      };
      const created = await sweepstakesClient.createSweepstake(payload);

      // Sorteo de evento (NSA, tradeshows): la tienda se crea y se engancha acá
      // mismo. Si falla, el sorteo ya existe — se avisa y se asigna a mano desde
      // el checklist en vez de perder lo creado.
      let eventStoreCreated = false;
      if (eventStore?.create) {
        try {
          await sweepstakesClient.createEventStore(created.id || (created as any)._id, {
            name: eventStore.name?.trim() || values.name,
            address: eventStore.address,
            zipCode: eventStore.zipCode,
          });
          eventStoreCreated = true;
        } catch {
          // ponytail: alert y no snackbar — el onSuccess redirige y se comería
          // cualquier toast. Cambiar a snackbar si el redirect se demora.
          window.alert(
            'El sorteo se creó, pero no se pudo crear la tienda del evento. Agregala desde Eventos con "Agregar existente".'
          );
        }
      }

      return { created, eventStoreCreated };
    },
    onSuccess: async ({ created, eventStoreCreated }: any) => {
      const id = created.id || created._id;
      // refresca listados si los tienes cacheados
      await qc.invalidateQueries({ queryKey: ['sweepstakes'] });

      // Con tienda de evento va a Eventos, no al checklist: ahí sale el link de
      // kiosko que soporte técnico necesita para configurar las tablets, más el
      // de opt-in y el QR. En el checklist esos links no están.
      if (eventStoreCreated) {
        await qc.invalidateQueries({ queryKey: ['event-stores'] });
        push(routes.admin.management.events.listing);
        return;
      }

      push(`/admin/management/sweepstakes/${id}/checklist`);
    },
    onError: () => setSnack({ open: true, msg: 'No se pudo crear el sweepstake', sev: 'error' }),
  });

  return (
    <>
      {pageMeta.title && (
        <Container
          sx={{
            py: {
              xs: 2,
            },
          }}
          maxWidth={customization.stretch ? false : 'xl'}
        >
          <PageHeading
            sx={{
              px: 0,
            }}
            title={t(pageMeta.title)}
            description={pageMeta.description && pageMeta.description}
          />
        </Container>
      )}
      <Box
        pb={{
          xs: 2,
          sm: 3,
        }}
        px={{
          xs: 2,
          sm: 3,
        }}
      >
        <Card>
          <CardContent>
            <Stack >
              <BriefFormRHF
                mode="create"
                initialValues={initialValues}
                onSubmit={(values) => createSweepstakeMutation.mutate(values)}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
export default Page;
