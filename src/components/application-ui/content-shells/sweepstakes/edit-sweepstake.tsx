'use client';

import { BriefFormRHF, type BriefFormValues } from '@/components/application-ui/form-layouts/brief';
import { useSweepstake } from '@/hooks/fetching/sweepstakes/useSweepstakesById';
import { sweepstakesClient, type Sweepstakes } from '@/services/sweepstakes.service';
import { Alert, Box, Card, CardContent, CircularProgress, Snackbar, Stack } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import PageHeading from 'src/components/base/page-heading';

/**
 * Edición de un sweepstake existente.
 *
 * Reusa `BriefFormRHF` — el mismo formulario de la creación, que ya traía
 * `mode: 'edit'` y el reset para cuando los valores llegan por red. La ruta
 * `routes.admin.management.sweepstakes.edit(id)` también existía desde antes;
 * lo único que faltaba era la pantalla.
 */

interface Props {
  id: string;
}

/**
 * Documento del backend → valores del formulario.
 *
 * Dos formas distintas del mismo dato: el backend guarda `prize` (que puede
 * venir poblado con los objetos o como lista de ids) y el formulario trabaja
 * con `prizeIds`. Las fechas ya viajan en ISO de los dos lados.
 */
function toFormValues(sweepstake: Sweepstakes): Partial<BriefFormValues> {
  const prizeIds = (sweepstake.prize || [])
    .map((p: any) => (typeof p === 'string' ? p : p?._id || p?.id))
    .filter(Boolean) as string[];

  return {
    name: sweepstake.name || '',
    description: sweepstake.description || '',
    startDate: sweepstake.startDate || null,
    endDate: sweepstake.endDate || null,
    winnersCount: sweepstake.winnersCount ?? 1,
    image: sweepstake.image || '',
    hasQr: !!sweepstake.hasQr,
    optinType: (sweepstake as any).optinType || '',
    rules: sweepstake.rules || '',
    participationMessage: sweepstake.participationMessage || '',
    sweeptakeDescription: (sweepstake as any).sweeptakeDescription || '',
    prizeIds,
    bannerDesktop: sweepstake.bannerDesktop || '',
    bannerMobile: sweepstake.bannerMobile || '',
    mainColor: sweepstake.mainColor || undefined,
    secondaryColor: sweepstake.secondaryColor || undefined,
  };
}

export function EditSweepstake({ id }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const { data: sweepstake, isLoading, isError } = useSweepstake(id);
  const [saved, setSaved] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const update = useMutation({
    mutationFn: (values: BriefFormValues) =>
      // El backend guarda `prize`; el formulario habla de `prizeIds`.
      sweepstakesClient.updateSweepstake(id, { ...values, prize: values.prizeIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sweepstake', id] });
      queryClient.invalidateQueries({ queryKey: ['sweepstakes'] });
      // La tarjeta del panel de tienda muestra nombre y fechas de este mismo
      // sweepstake: sin esto sigue mostrando los viejos hasta recargar.
      queryClient.invalidateQueries({ queryKey: ['active-sweepstake'] });
      setSaved(true);
    },
    onError: () => setFailed(true),
  });

  const initialValues = React.useMemo(
    () => (sweepstake ? toFormValues(sweepstake) : undefined),
    [sweepstake]
  );

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
      <PageHeading
        sx={{ px: 0 }}
        title={sweepstake?.name || 'Editar sweepstake'}
        description="Los cambios se aplican a todas las tiendas que tengan este sorteo activo."
      />

      <Card>
        <CardContent>
          {isLoading && (
            <Stack
              alignItems="center"
              sx={{ py: 6 }}
            >
              <CircularProgress />
            </Stack>
          )}

          {isError && <Alert severity="error">No se pudo cargar el sweepstake.</Alert>}

          {/* El form se monta recién con los valores: `initialValues` sin datos
              lo dejaría en blanco y el diseñador guardaría un sorteo vacío. */}
          {!isLoading && !isError && initialValues && (
            <BriefFormRHF
              mode="edit"
              initialValues={initialValues}
              onSubmit={async (values) => {
                await update.mutateAsync(values);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">Sweepstake actualizado.</Alert>
      </Snackbar>

      <Snackbar
        open={failed}
        autoHideDuration={6000}
        onClose={() => setFailed(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error">No se pudieron guardar los cambios.</Alert>
      </Snackbar>
    </Box>
  );
}

export default EditSweepstake;
