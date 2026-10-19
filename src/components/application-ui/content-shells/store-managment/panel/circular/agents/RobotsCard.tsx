'use client';

/** Paso 1 · Los robots del circular: la oficina y, plegada, la bitácora en texto. */
import type { Pipeline } from '@/services/circular.service';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import type { ComponentProps } from 'react';
import AgentCard, { EmptyLine } from './AgentCard';
import AgentFeed from './AgentFeed';
import AgentOffice from './office/AgentOffice';

type OfficeActions = Pick<
  ComponentProps<typeof AgentOffice>,
  'onSendInstruction' | 'sending' | 'onStartReview' | 'starting'
>;

export default function RobotsCard({
  step,
  circularName,
  pipeline,
  loading,
  feedOpen,
  onToggleFeed,
  ...office
}: {
  step: number;
  /** Nombre legible del circular que miran los robots (null = la tienda no tiene). */
  circularName: string | null;
  pipeline: Pipeline | null;
  loading: boolean;
  feedOpen: boolean;
  onToggleFeed: (open: boolean) => void;
} & OfficeActions) {
  return (
    <AgentCard
      step={step}
      title="Los robots del circular"
      description={
        circularName
          ? `Siete agentes trabajan en cadena sobre "${circularName}". Acá ves quién está trabajando, qué dice y dónde se trabó. Corren solos al subir un circular o agendar una campaña con arte.`
          : 'Siete agentes trabajan en cadena cada vez que subes un circular o agendas una campaña con arte. Ahora están esperando: la tienda no tiene circular todavía.'
      }
    >
      <Stack spacing={1.5}>
        <AgentOffice
          data={pipeline}
          loading={loading}
          {...office}
        />
        <Accordion
          disableGutters
          elevation={0}
          expanded={feedOpen}
          onChange={(_, open) => onToggleFeed(open)}
          slotProps={{ transition: { unmountOnExit: true } }}
          sx={{
            border: 1,
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
            {pipeline?.steps?.length ? (
              <AgentFeed data={pipeline} />
            ) : (
              <EmptyLine>Todavía no hay movimientos para este circular.</EmptyLine>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>
    </AgentCard>
  );
}
