'use client';

/**
 * Relleno de audiencia. Lo que una tienda pierde por depuración en el mes se repone
 * (+extra %) con clientes de tiendas fuente dadas de baja, repartido día a día. Los
 * agregados quedan marcados como clientes INDIRECTOS de la tienda y se pueden deshacer.
 */

import { EmptyBlock, PageHero, PanelCard } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { audienceExperimentService, type SaveAudienceExperimentDto } from '@/services/audienceExperiment.service';
import { Alert, Box, Skeleton, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ConfigCard } from './config-card';
import { ResultsView } from './results-view';

const KEY = ['audience-experiment'];

export default function AudienceExperiment() {
  const qc = useQueryClient();
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: KEY,
    queryFn: audienceExperimentService.get,
    staleTime: 60_000,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const save = useMutation({
    mutationFn: (dto: SaveAudienceExperimentDto) => audienceExperimentService.save(dto),
    onSuccess: () => {
      toast.success('Configuración guardada');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const run = useMutation({
    mutationFn: audienceExperimentService.run,
    onSuccess: (r) => {
      const n = r.stores.reduce((a, s) => a + s.addedToday, 0);
      toast.success(n ? `Se agregaron ${n.toLocaleString('es')} referidos` : 'Hoy no había nada que reponer');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo correr'),
  });

  const undo = useMutation({
    mutationFn: ({ storeId, period }: { storeId: string; period?: string }) => audienceExperimentService.undo(storeId, period),
    onSuccess: (n) => {
      toast.success(`Se quitaron ${n.toLocaleString('es')} referidos`);
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo deshacer'),
  });

  const cfg = data?.config;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 3 } }}>
      <Stack gap={2}>
        <PageHero
          eyebrow="Campañas · Audiencia"
          title="Relleno de audiencia"
          subtitle={
            cfg
              ? `Lo que una tienda (con menos de ${cfg.threshold.toLocaleString('es')} números) pierde por depuración en el mes se repone +${cfg.extraPct}% con referidos tomados de las tiendas fuente, repartido día a día.`
              : 'Repone lo depurado con referidos de tiendas dadas de baja.'
          }
        />

        {isLoading ? (
          <>
            <Skeleton
              variant="rounded"
              height={260}
              sx={{ borderRadius: 4.5 }}
            />
            <Skeleton
              variant="rounded"
              height={120}
              sx={{ borderRadius: 4 }}
            />
          </>
        ) : isError || !cfg ? (
          <Alert severity="error">No se pudo cargar el relleno de audiencia.</Alert>
        ) : (
          <>
            <ConfigCard
              key={cfg.updatedAt ?? 'new'}
              config={cfg}
              saving={save.isPending}
              onSubmit={(dto) => save.mutate(dto)}
            />
            <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
              {data?.result ? (
                <ResultsView
                  result={data.result}
                  active={cfg.active}
                  ranToday={cfg.lastRunDay === data.result.day}
                  running={run.isPending}
                  onRun={() => run.mutate()}
                  undoing={undo.isPending}
                  onUndo={(storeId, period) => undo.mutate({ storeId, period })}
                />
              ) : (
                <PanelCard>
                  <EmptyBlock
                    title="Faltan datos"
                    hint="Elige al menos una tienda fuente y guarda."
                  />
                </PanelCard>
              )}
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
