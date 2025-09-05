import { ChecklistStepKey } from '@/services/sweepstakes.service';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';

export function StepEditor({
  stepKey,
  stepData,
  onMarkDone,
  onSaveLink,
  patchLoading,
}: {
  stepKey: ChecklistStepKey;
  stepData: any;
  onMarkDone: (extra?: any) => void;
  onUploadDesign: () => void;
  onSaveLink: (url: string) => void;
  patchLoading: boolean;
  designUploading: boolean;
}) {
  const [notesValue, setNotesValue] = useState('');
  const [linkValue, setLinkValue] = useState(
    stepKey === 'optinMedia' ? stepData?.confirmationLink || '' : ''
  );
  const done = Boolean(stepData?.done);

  return (
    <Stack
      gap={2}
      sx={{ mt: 1, mb: 2 }}
    >
      {stepKey === 'clientBrief' && (
        <Alert severity="info">
          Este paso ya quedó marcado al crear el sorteo. Puedes agregar notas adicionales.
        </Alert>
      )}

      {stepKey === 'optinMedia' && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={2}
          alignItems={{ md: 'center' }}
        >
          <TextField
            label="Confirmation Link (Landing de Opt‑in)"
            fullWidth
            value={linkValue}
            placeholder={stepData?.confirmationLink || ''}
            onChange={(e) => setLinkValue(e.target.value)}
            InputProps={{ endAdornment: <LinkIcon /> }}
          />
          <Button
            variant="contained"
            onClick={() => onSaveLink(linkValue)}
            disabled={!linkValue}
          >
            Guardar link
          </Button>
        </Stack>
      )}

      {/* Notas comunes */}
      <TextField
        label="Notas"
        fullWidth
        multiline
        minRows={2}
        value={notesValue}
        onChange={(e) => setNotesValue(e.target.value)}
        placeholder={stepData?.notes || ''}
      />

      <Stack
        direction="row"
        gap={1}
      >
        {!done && (
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => onMarkDone({ notes: notesValue || undefined })}
            disabled={patchLoading}
          >
            Marcar como completado
          </Button>
        )}
        <Button
          variant="text"
          onClick={() => {
            setNotesValue('');
            setLinkValue('');
          }}
        >
          Limpiar campos
        </Button>
      </Stack>
    </Stack>
  );
}
