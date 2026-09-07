'use client';

/** Paso 4 · Revisar y enviar — SMS de respaldo, opciones avanzadas y resumen. */

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MSG_TYPE_INFO } from './rcs-domain';
import type { RcsBuilderApi } from './use-rcs-builder';

export default function StepReview({ b }: { b: RcsBuilderApi }) {
  return (
    <>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        mb={0.5}
      >
        SMS de respaldo
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        Lo reciben los teléfonos sin RCS. #linkrcs = link personal del cliente.
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={b.failover}
        onChange={(e) => b.setFailover(e.target.value.slice(0, 2047))}
        error={b.attempted[3] && !b.failover.trim()}
        helperText={
          b.attempted[3] && !b.failover.trim()
            ? 'Obligatorio — sin esto los teléfonos sin RCS no reciben nada.'
            : undefined
        }
        sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace' }, mb: 1.5 }}
      />

      <Accordion
        disableGutters
        variant="outlined"
        sx={{ '&:before': { display: 'none' }, mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography
            variant="body2"
            fontWeight={600}
          >
            Opciones avanzadas
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={1}
          >
            Validez: si el mensaje no se entrega en este tiempo, se descarta (0 = sin límite).
          </Typography>
          <Stack
            direction="row"
            spacing={1}
          >
            <TextField
              size="small"
              type="number"
              label="Validez"
              value={b.validityAmount}
              onChange={(e) => b.setValidityAmount(Math.max(0, Number(e.target.value) || 0))}
              inputProps={{ min: 0 }}
              sx={{ maxWidth: 130 }}
            />
            <TextField
              size="small"
              select
              label="Unidad"
              value={b.validityUnit}
              onChange={(e) => b.setValidityUnit(e.target.value as any)}
              sx={{ minWidth: 130 }}
              disabled={b.validityAmount <= 0}
            >
              <MenuItem value="MINUTES">Minutos</MenuItem>
              <MenuItem value="HOURS">Horas</MenuItem>
            </TextField>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Card
        variant="outlined"
        sx={{ p: 1.5, mb: 1.5, bgcolor: 'action.hover' }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          display="block"
          mb={0.5}
        >
          Resumen
        </Typography>
        <Typography
          variant="caption"
          display="block"
        >
          • Mensaje: {MSG_TYPE_INFO[b.msgType].label}
          {b.msgType === 'CAROUSEL' ? ` (${b.cards.length} cards)` : ''} ·{' '}
          {b.globalButtons.filter((x) => x.text.trim()).length} botón(es)
        </Typography>
        <Typography
          variant="caption"
          display="block"
        >
          • Audiencia: {b.stepSummaries[2]}
        </Typography>
        <Typography
          variant="caption"
          display="block"
        >
          • {b.isTest ? 'Se envía AHORA MISMO' : `Programada: ${b.startDate.toLocaleString()}`} ·
          Sender: sweepstouch
        </Typography>
      </Card>
    </>
  );
}
