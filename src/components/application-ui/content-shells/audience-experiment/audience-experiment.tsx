'use client';

/**
 * Experimento de audiencia. Es una SIMULACIÓN: calcula cuánto crecerían las tiendas chicas
 * sumándoles N números por semana de unas tiendas fuente, y cuánto más se facturaría.
 * No agrega clientes, no toca audiencias ni campañas, no envía ni cobra nada.
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

  const save = useMutation({
    mutationFn: (dto: SaveAudienceExperimentDto) => audienceExperimentService.save(dto),
    onSuccess: () => {
      toast.success('Configuración guardada');
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const cfg = data?.config;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 3 } }}>
      <Stack gap={2}>
        <PageHero
          eyebrow="Campañas · Experimento"
          title="Crecimiento de audiencia"
          subtitle={
            cfg
              ? `Tiendas con menos de ${cfg.threshold.toLocaleString('es')} números reciben +${cfg.weeklyPerStore.toLocaleString('es')} por semana, tomados parejo de las tiendas fuente.`
              : 'Cuánto crecerían las tiendas chicas y cuánto más se facturaría.'
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
          <Alert severity="error">No se pudo cargar el experimento.</Alert>
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
                  weekly={cfg.weeklyPerStore}
                />
              ) : (
                <PanelCard>
                  <EmptyBlock
                    title={cfg.active ? 'Faltan datos' : 'Experimento apagado'}
                    hint={
                      cfg.active
                        ? 'Elige al menos una tienda fuente y la fecha de inicio, y guarda.'
                        : 'Elige las tiendas fuente, enciéndelo y guarda para ver la simulación.'
                    }
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
