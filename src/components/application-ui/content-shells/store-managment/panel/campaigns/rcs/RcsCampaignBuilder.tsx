'use client';

/**
 * Editor de mensajes RCS — orquestador del wizard de 4 pasos.
 *
 * La lógica vive fuera de acá:
 *  - rcs-domain.ts       → tipos + armado puro del content v2 (testeable)
 *  - use-rcs-builder.ts  → estado del editor + validación por paso
 *  - use-rcs-submit.ts   → envío (prueba inmediata / campaña programada)
 *  - Step*.tsx           → cada paso del wizard
 *  - PhonePreview.tsx    → vista previa en vivo estilo Google Messages
 */

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Step,
  StepButton,
  StepContent,
  Stepper,
  Typography,
} from '@mui/material';
import PendingList from './PendingList';
import PhonePreview from './PhonePreview';
import { MSG_TYPE_INFO } from './rcs-domain';
import StepAudience from './StepAudience';
import StepButtons from './StepButtons';
import StepMessage from './StepMessage';
import StepReview from './StepReview';
import { useRcsBuilder } from './use-rcs-builder';
import { useRcsSubmit } from './use-rcs-submit';

const STEP_TITLES = ['El mensaje', 'Botones del mensaje', '¿A quién se lo mandamos?', 'Revisar y enviar'];

export default function RcsCampaignBuilder({
  storeId,
  storeSlug,
  storeName,
  phoneNumber,
  totalAudience,
  onCreate,
}: {
  storeId: string;
  storeSlug: string;
  storeName: string;
  phoneNumber: string;
  totalAudience: number;
  onCreate: () => void;
}) {
  const b = useRcsBuilder({ storeId, storeSlug, storeName, totalAudience });
  const submit = useRcsSubmit({ b, storeId, storeSlug, phoneNumber, onCreate });

  const stepBodies = [
    <StepMessage
      key={0}
      b={b}
      onCapError={(msg) => submit.setSnack({ open: true, msg, sev: 'error' })}
    />,
    <StepButtons
      key={1}
      b={b}
    />,
    <StepAudience
      key={2}
      b={b}
    />,
    <StepReview
      key={3}
      b={b}
    />,
  ];

  const navRow = (step: number) => {
    const isLast = step === 3;
    return (
      <Stack
        direction="row"
        spacing={1.5}
        mt={2}
      >
        {step > 0 && (
          <Button
            color="secondary"
            onClick={() => b.setActiveStep(step - 1)}
          >
            Atrás
          </Button>
        )}
        {isLast ? (
          <Button
            variant="contained"
            color="primary"
            disabled={submit.mutation.isPending}
            onClick={submit.requestSend}
          >
            {b.isTest ? 'Enviar prueba ahora' : 'Crear campaña RCS'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => b.tryAdvance(step)}
          >
            Continuar
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Card
        variant="outlined"
        sx={{ p: 2.5, mb: 2.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          flexWrap="wrap"
        >
          <Box
            flex={1}
            minWidth={220}
          >
            <Typography
              variant="h6"
              fontWeight={800}
            >
              Editor RCS
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sender «sweepstouch» (agente Google verificado) · {storeName}
            </Typography>
          </Box>
          <Chip
            variant="outlined"
            color="primary"
            label={`Base: ${totalAudience.toLocaleString()} clientes`}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Card>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 340px' }}
        gap={2.5}
        alignItems="start"
      >
        {/* Wizard */}
        <Card
          variant="outlined"
          sx={{ p: { xs: 2, sm: 2.5 } }}
        >
          <Stepper
            activeStep={b.activeStep}
            orientation="vertical"
            nonLinear
          >
            {STEP_TITLES.map((titleLabel, step) => {
              const isLast = step === 3;
              const problems = b.stepProblems[step];
              return (
                <Step
                  key={titleLabel}
                  completed={!isLast && problems.length === 0 && b.activeStep > step}
                >
                  <StepButton
                    onClick={() => b.setActiveStep(step)}
                    optional={
                      <Typography
                        variant="caption"
                        color={b.attempted[step] && problems.length ? 'error' : 'text.secondary'}
                      >
                        {b.stepSummaries[step]}
                      </Typography>
                    }
                  >
                    <Typography fontWeight={700}>{titleLabel}</Typography>
                  </StepButton>
                  <StepContent>
                    {stepBodies[step]}
                    {b.attempted[step] && (
                      <PendingList problems={isLast ? b.allProblems : problems} />
                    )}
                    {navRow(step)}
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Card>

        {/* Preview */}
        <PhonePreview b={b} />
      </Box>

      {/* Confirmación */}
      <Dialog
        open={submit.confirmOpen}
        onClose={() => submit.setConfirmOpen(false)}
      >
        <DialogTitle>{b.isTest ? 'Enviar prueba RCS ahora' : 'Confirmar campaña RCS'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {b.isTest ? 'Prueba' : `«${b.title}»`} — mensaje <b>{MSG_TYPE_INFO[b.msgType].label}</b>
            {b.msgType === 'CAROUSEL' ? ` de ${b.cards.length} cards` : ''} para{' '}
            <b>
              {b.audMode === 'numbers'
                ? `${b.parsedNumbers.length} número${b.parsedNumbers.length === 1 ? '' : 's'} de prueba`
                : `${b.audienceCount.toLocaleString()} clientes`}
            </b>{' '}
            de {storeName}.
            <br />
            {b.isTest
              ? 'Se envía AHORA MISMO por el canal RCS.'
              : `Programada para: ${b.startDate.toLocaleString()}.`}{' '}
            Sender: sweepstouch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            onClick={() => submit.setConfirmOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={submit.mutation.isPending}
            onClick={() => submit.mutation.mutate()}
          >
            {submit.mutation.isPending ? (b.isTest ? 'Enviando…' : 'Creando…') : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={submit.snack.open}
        autoHideDuration={5000}
        onClose={() => submit.setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={submit.snack.sev}
          variant="filled"
          onClose={() => submit.setSnack((s) => ({ ...s, open: false }))}
        >
          {submit.snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
