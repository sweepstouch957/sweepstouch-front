'use client';

/**
 * Agendar circular (con o sin PDF). El estado del formulario vive acá: escribir un título o
 * arrastrar un PDF no re-renderiza el resto de la pestaña. El padre lo vuelve a montar (key)
 * cuando el alta sale bien, y así queda limpio.
 */
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Controller, useForm, useWatch, type Control, type UseFormRegister } from 'react-hook-form';
import { AiGuidanceFields } from '../AiGuidanceFields';
import PdfDropzone from './PdfDropzone';
import { blockSx } from './styles';
import { isBadRange, scheduleDefaults, type ScheduleValues } from './utils';

export default function ScheduleForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (values: ScheduleValues) => void;
}) {
  const { control, register, handleSubmit } = useForm<ScheduleValues>({
    defaultValues: scheduleDefaults(),
  });
  const { ref: titleRef, ...title } = register('title');
  // El tope de 500 caracteres lo pone el propio campo (maxLength).
  const { ref: guidanceRef, ...guidance } = register('guidance');

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((v) => {
        if (!isBadRange(v.start, v.end)) onSubmit(v);
      })}
      sx={blockSx}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
      >
        <EventAvailableOutlinedIcon
          color="primary"
          fontSize="small"
        />
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Agendar circular
        </Typography>
      </Stack>
      <Controller
        control={control}
        name="files"
        render={({ field }) => (
          <PdfDropzone
            files={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {/* Indicaciones y fotos de referencia: van con la extracción que arranca al agendar. */}
      <Controller
        control={control}
        name="referenceImages"
        render={({ field }) => (
          <AiGuidanceFields
            guidanceProps={{ ...guidance, inputRef: guidanceRef }}
            referenceImages={field.value}
            onReferenceImagesChange={field.onChange}
          />
        )}
      />
      <Box
        sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1.3fr 1fr 1fr' } }}
      >
        <TextField
          size="small"
          label="Título (opcional)"
          inputRef={titleRef}
          {...title}
        />
        <DateFields
          control={control}
          register={register}
        />
      </Box>
      <SubmitBar
        control={control}
        pending={pending}
      />
    </Box>
  );
}

/** Inicio / fin: observan las fechas acá abajo para marcar el rango inválido sin repintar el form. */
function DateFields({
  control,
  register,
}: {
  control: Control<ScheduleValues>;
  register: UseFormRegister<ScheduleValues>;
}) {
  const [start, end] = useWatch({ control, name: ['start', 'end'] });
  const { ref: startRef, ...startField } = register('start');
  const { ref: endRef, ...endField } = register('end');
  return (
    <>
      <TextField
        size="small"
        label="Inicio"
        type="date"
        inputRef={startRef}
        {...startField}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        size="small"
        label="Fin"
        type="date"
        inputRef={endRef}
        {...endField}
        InputLabelProps={{ shrink: true }}
        error={isBadRange(start, end)}
        helperText={isBadRange(start, end) ? 'El fin no puede ser antes del inicio' : undefined}
      />
    </>
  );
}

function SubmitBar({ control, pending }: { control: Control<ScheduleValues>; pending: boolean }) {
  const [start, end, files] = useWatch({ control, name: ['start', 'end', 'files'] });
  const hasFile = files.length > 0;
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending || !start || !end || isBadRange(start, end)}
      sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
    >
      {pending ? 'Agendando…' : hasFile ? 'Agendar y extraer' : 'Agendar'}
    </Button>
  );
}
