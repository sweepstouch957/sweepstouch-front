'use client';

import { BriefFormRHF } from '@/components/application-ui/form-layouts/brief';
import SweepstakeChecklist from '@/components/website/sweeptake-checklist';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import { CreateOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Container, Stack } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const router = useRouter();
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
      const payload = {
        ...values,
        prize: values.prizeIds,
      };
      const created = await sweepstakesClient.createSweepstake(payload);
      return created;
    },
    onSuccess: async (created: any) => {
      const id = created.id || created._id;
      // refresca listados si los tienes cacheados
      await qc.invalidateQueries({ queryKey: ['sweepstakes'] });
      // 🚀 redirige al checklist del sweepstake creado
      router.push(`/admin/management/sweepstakes/${id}/checklist`);
    },
    onError: () => setSnack({ open: true, msg: 'No se pudo crear el sweepstake', sev: 'error' }),
  });

  // Valores iniciales (puedes dejarlos en blanco si tu BriefFormRHF ya setea defaults)
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
      'Thank you for participating in the #StoreName For a Car Labor Day!. Your participation code is: #Codigo',
    sweeptakeDescription: '',
    prizeIds: [] as string[],
  };

  const pageMeta = {
    title: 'Create Sweepstake',
    description: 'Manage and monitor Sweepstake',
    icon: <CreateOutlined />,
  };
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
