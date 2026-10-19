'use client';

/** Paso 3 · Auditoría por página (Atenea): % de acierto por página y lo que corrigió sola. */
import type { PageAudit } from '@/services/circular.service';
import { Box, Button, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';
import AgentCard, { EmptyLine } from './AgentCard';
import { accuracyTone } from './utils';

const pageFixes = (p: PageAudit) =>
  p.fixed || p.imageMismatches
    ? `${p.fixed} fix${
        p.imageMismatches ? `, ${p.imageMismatches} foto${p.imageMismatches === 1 ? '' : 's'}` : ''
      }`
    : '';

const PagePill = memo(function PagePill({ p }: { p: PageAudit }) {
  const fixes = pageFixes(p);
  return (
    <Tooltip
      title={`${p.matched}/${p.checked} datos correctos · ${p.fixed} corregidos · ${p.imageMismatches} fotos que no eran`}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 0.75,
          px: 1.1,
          py: 0.5,
          borderRadius: 1.5,
          border: 1,
          borderColor: 'divider',
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        <Box
          component="span"
          sx={{ color: 'text.secondary' }}
        >
          p{p.page}
        </Box>
        <Box
          component="strong"
          sx={{ color: `${accuracyTone(p.accuracy)}.main` }}
        >
          {p.accuracy}%
        </Box>
        {fixes && (
          <Box
            component="span"
            sx={{ color: 'text.secondary', fontSize: 12 }}
          >
            ({fixes})
          </Box>
        )}
      </Box>
    </Tooltip>
  );
});

export default function AuditCard({
  step,
  hasFile,
  running,
  pages,
  accuracy,
  disabled,
  onRerun,
}: {
  step: number;
  hasFile: boolean;
  running: boolean;
  pages: PageAudit[];
  accuracy: number | null | undefined;
  /** Hay una extracción corriendo o el pedido de auditoría está en vuelo. */
  disabled: boolean;
  onRerun: () => void;
}) {
  return (
    <AgentCard
      step={step}
      title="Auditoría por página (Atenea)"
      description="Cuánto acertó la lectura en cada página del circular y qué corrigió sola. Si una página baja de 85 %, vale la pena mirar sus productos en la pestaña Productos."
      action={
        hasFile && (
          <Button
            size="small"
            variant="outlined"
            disabled={disabled || running}
            onClick={() => onRerun()}
          >
            {running ? 'Revisando…' : 'Auditar de nuevo'}
          </Button>
        )
      }
    >
      {!hasFile ? (
        <EmptyLine>Sin archivo de circular no hay nada que auditar.</EmptyLine>
      ) : pages.length || running ? (
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          useFlexGap
          gap={1}
        >
          {pages.map((p) => (
            <PagePill
              key={p.page}
              p={p}
            />
          ))}
          {accuracy != null && pages.length > 1 && (
            <Typography
              variant="body2"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              Total <strong>{accuracy}%</strong>
            </Typography>
          )}
          {running && (
            <Stack
              direction="row"
              alignItems="center"
              gap={0.75}
              sx={{ color: 'text.secondary' }}
            >
              <CircularProgress
                size={14}
                color="inherit"
              />
              <Typography variant="body2">Revisando…</Typography>
            </Stack>
          )}
        </Stack>
      ) : (
        <EmptyLine>Todavía no se auditó este circular.</EmptyLine>
      )}
    </AgentCard>
  );
}
