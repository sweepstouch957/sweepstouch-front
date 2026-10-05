'use client';

/**
 * Pestaña Agentes IA: todo lo de los robots en un solo lugar, separado de agendar/subir el
 * circular. 1 la oficina (quién trabaja y qué dice) · 2 reglas de la tienda · 3 auditoría por
 * página · 4-6 revisión diaria (lo que arregló solo y lo que queda para decidir).
 */
import { circularService } from '@/services/circular.service';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AgentFeed from './AgentFeed';
import AgentOffice from './AgentOffice';
import { useCircularBusy, useStoreCirculars } from './hooks';
import { SectionHeader, Surface } from './panelUi';
import ReviewSection from './ReviewSection';
import { circularLabel } from './shared';
import StoreRulesCard from './StoreRulesCard';

export default function AgentsSection({
  storeSlug,
  storeName,
}: {
  storeSlug: string;
  storeName?: string;
}) {
  const { top: circular, isLoading } = useStoreCirculars(storeSlug);
  const { busy } = useCircularBusy(storeSlug);

  // Misma query que AgentFeed (React Query la comparte): la oficina dibuja, el feed avisa.
  const pipeline = useQuery({
    queryKey: ['circular-pipeline', circular?._id],
    queryFn: () => circularService.getPipeline(circular!._id),
    enabled: !!circular?._id,
    refetchInterval: (q) => (q.state.data?.running ? 3000 : false),
  });

  // Auditoría por página: % de efectividad de la extracción y correcciones hechas.
  const audit = useQuery({
    queryKey: ['circular-audit', circular?._id],
    queryFn: () => circularService.getAudit(circular!._id),
    enabled: !!circular?._id && !!circular?.fileUrl,
    refetchInterval: (q) => (q.state.data?.running ? 4000 : false),
  });
  const rerunAudit = useMutation({
    mutationFn: () => circularService.runAudit(circular!._id),
    onSuccess: () => {
      toast.success('Atenea está revisando página por página… el % aparece acá al terminar');
      setTimeout(() => audit.refetch(), 1500);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo auditar'),
  });
  const pages = audit.data?.pages || [];

  return (
    <Stack spacing={2}>
      <Surface sx={{ p: { xs: 2, md: 2.5 } }}>
        <SectionHeader
          step={1}
          title="Los robots del circular"
          description={
            circular
              ? `Siete agentes trabajan en cadena sobre "${circularLabel(
                  circular,
                  storeSlug,
                  storeName
                )}". Acá ves quién está trabajando, qué dice y dónde se trabó. Corren solos al subir un circular o agendar una campaña con arte.`
              : 'Siete agentes trabajan en cadena cada vez que subes un circular o agendas una campaña con arte. Ahora están esperando: la tienda no tiene circular todavía.'
          }
        />
        <Stack
          sx={{ mt: 2 }}
          spacing={1.5}
        >
          <AgentOffice
            data={pipeline.data}
            loading={isLoading || pipeline.isLoading}
            storeSlug={storeSlug}
          />
          <Accordion
            disableGutters
            elevation={0}
            slotProps={{ transition: { unmountOnExit: true } }}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '12px !important',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Typography
                variant="body2"
                fontWeight={700}
              >
                Bitácora completa (texto)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <AgentFeed
                circularId={circular?._id || null}
                storeSlug={storeSlug}
              />
              {!pipeline.data?.steps?.length && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Todavía no hay movimientos para este circular.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Surface>

      <StoreRulesCard
        storeSlug={storeSlug}
        step={2}
      />

      <Surface sx={{ p: { xs: 2, md: 2.5 } }}>
        <SectionHeader
          step={3}
          title="Auditoría por página (Atenea)"
          description="Cuánto acertó la lectura en cada página del circular y qué corrigió sola. Si una página baja de 85 %, vale la pena mirar sus productos en la pestaña Productos."
          action={
            circular?.fileUrl && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy || !!audit.data?.running || rerunAudit.isPending}
                onClick={() => rerunAudit.mutate()}
              >
                {audit.data?.running ? 'Revisando…' : 'Auditar de nuevo'}
              </Button>
            )
          }
        />
        {!circular?.fileUrl ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5 }}
          >
            Sin archivo de circular no hay nada que auditar.
          </Typography>
        ) : pages.length || audit.data?.running ? (
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{ mt: 1.5 }}
          >
            {audit.data?.running && !pages.length ? 'Revisando…' : null}
            {pages.map((p) => (
              <span
                key={p.page}
                title={`${p.matched}/${p.checked} datos correctos · ${p.fixed} corregidos · ${p.imageMismatches} fotos que no eran`}
                style={{ marginRight: 10 }}
              >
                p{p.page}{' '}
                <strong
                  style={{
                    color: p.accuracy >= 95 ? '#2e7d32' : p.accuracy >= 85 ? '#ed6c02' : '#d32f2f',
                  }}
                >
                  {p.accuracy}%
                </strong>
                {p.fixed || p.imageMismatches
                  ? ` (${p.fixed} fix${
                      p.imageMismatches
                        ? `, ${p.imageMismatches} foto${p.imageMismatches === 1 ? '' : 's'}`
                        : ''
                    })`
                  : ''}
              </span>
            ))}
            {audit.data?.accuracy != null && pages.length > 1 ? (
              <>
                · total <strong>{audit.data.accuracy}%</strong>
              </>
            ) : null}
            {audit.data?.running && pages.length ? ' · revisando…' : ''}
          </Typography>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5 }}
          >
            Todavía no se auditó este circular.
          </Typography>
        )}
      </Surface>

      <ReviewSection
        storeSlug={storeSlug}
        firstStep={4}
      />
    </Stack>
  );
}
