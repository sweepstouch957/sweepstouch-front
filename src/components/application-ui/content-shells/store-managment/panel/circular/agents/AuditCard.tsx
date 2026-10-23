'use client';

/** Paso 3 · Auditoría por página (Atenea): % de acierto por página y lo que corrigió sola. */
import type { AuditVerification, PageAudit } from '@/services/circular.service';
import { Box, Button, Chip, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
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
  verification,
  disabled,
  onRerun,
}: {
  step: number;
  hasFile: boolean;
  running: boolean;
  pages: PageAudit[];
  accuracy: number | null | undefined;
  /** Veredicto final: tras corregir, Atenea releyó el flyer y dice qué % coincide. */
  verification?: AuditVerification | null;
  /** Hay una extracción corriendo o el pedido de auditoría está en vuelo. */
  disabled: boolean;
  onRerun: () => void;
}) {
  const v = verification && verification.checked ? verification : null;
  return (
    <AgentCard
      step={step}
      title="Auditoría por página (Atenea)"
      description="Cuánto acertó la lectura en cada página, qué corrigió sola y el veredicto final: vuelve a leer el flyer con los datos corregidos y dice si lo guardado es lo que imprime."
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
        <Stack spacing={1}>
          {v && !running && (
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              gap={1}
            >
              <Chip
                size="small"
                color={v.mismatches.length ? accuracyTone(v.accuracy) : 'success'}
                label={`Verificado ${v.accuracy}% · ${v.matched}/${v.checked} datos`}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: 12.5 }}
              >
                {v.mismatches.length
                  ? `${v.mismatches.length} dato${
                      v.mismatches.length === 1 ? '' : 's'
                    } sin coincidir con el flyer:`
                  : 'Lo guardado es lo que imprime el flyer. Esto queda así.'}
              </Typography>
            </Stack>
          )}
          {v && !running && v.mismatches.length > 0 && (
            <Box
              component="ul"
              sx={{ m: 0, pl: 2.5, fontSize: 12.5, color: 'warning.main' }}
            >
              {v.mismatches.slice(0, 8).map((m) => (
                <li key={m}>{m}</li>
              ))}
              {v.mismatches.length > 8 && <li>…y {v.mismatches.length - 8} más</li>}
            </Box>
          )}
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
        </Stack>
      ) : (
        <EmptyLine>Todavía no se auditó este circular.</EmptyLine>
      )}
    </AgentCard>
  );
}
