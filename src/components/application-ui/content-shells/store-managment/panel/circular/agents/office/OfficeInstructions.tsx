'use client';

/**
 * El patrón habla con los robots: respuestas rápidas cuando preguntan "¿vuelvo a trabajar?" y
 * una caja de instrucciones que se guarda como lección de la tienda.
 */
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { Chip, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { LESSON_MAX } from '../constants';

type Values = { msg: string };

function SendButton({ control, sending }: { control: Control<Values>; sending: boolean }) {
  const msg = useWatch({ control, name: 'msg' });
  return (
    <IconButton
      type="submit"
      color="primary"
      aria-label="Enviar instrucción"
      disabled={!msg.trim() || sending}
      sx={{ border: 1, borderColor: 'divider', flexShrink: 0 }}
    >
      <SendRoundedIcon fontSize="small" />
    </IconButton>
  );
}

/** Caja de instrucciones: dueña de su texto; se limpia sólo si se guardó. */
function InstructionForm({
  target,
  sending,
  onSend,
}: {
  /** Nombre del agente elegido (si hay), para el placeholder. */
  target?: string;
  sending: boolean;
  onSend: (text: string) => Promise<unknown>;
}) {
  const { register, control, handleSubmit, reset } = useForm<Values>({
    defaultValues: { msg: '' },
  });
  const { ref, ...field } = register('msg');
  const submit = handleSubmit(async ({ msg }) => {
    const text = msg.trim();
    if (!text || sending) return;
    try {
      await onSend(text);
      reset();
    } catch {
      /* el toast de error lo pone la mutación */
    }
  });
  return (
    <Stack
      component="form"
      onSubmit={submit}
      direction="row"
      gap={1}
      alignItems="center"
      sx={{ px: 2, pt: 1.25 }}
    >
      <TextField
        {...field}
        inputRef={ref}
        size="small"
        fullWidth
        disabled={sending}
        inputProps={{ maxLength: LESSON_MAX, 'aria-label': 'Instrucción para los robots' }}
        placeholder={
          target
            ? `Dile algo a ${target}: lo que hizo mal o cómo hacerlo mejor…`
            : "Dile algo a los robots: 'las bebidas son por unidad', 'ignora la página de cerveza', 'los 2/$5 no son $2.50'…"
        }
      />
      <SendButton
        control={control}
        sending={sending}
      />
    </Stack>
  );
}

export default function OfficeInstructions({
  asking,
  answering,
  onAnswer,
  target,
  sending,
  onSend,
}: {
  /** Alguno terminó o está de brazos cruzados: se muestran las respuestas rápidas. */
  asking: boolean;
  answering: boolean;
  onAnswer: (kind: 'go' | 'rest') => void;
  target?: string;
  sending: boolean;
  onSend: (text: string) => Promise<unknown>;
}) {
  return (
    <>
      {/* El patrón contesta: cuando alguno pregunta "¿vuelvo a trabajar?" o están de brazos cruzados. */}
      {asking && (
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          flexWrap="wrap"
          sx={{ px: 2, pt: 1.5 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Te preguntan, patrón:
          </Typography>
          <Chip
            color="primary"
            label={answering ? 'Arrancando…' : 'Sí, dale: revisen el circular 💪'}
            disabled={answering}
            onClick={() => onAnswer('go')}
          />
          <Chip
            variant="outlined"
            label="Descansen ☕"
            onClick={() => onAnswer('rest')}
          />
        </Stack>
      )}

      {/* Instrucciones para los robots, desde la oficina. */}
      <InstructionForm
        target={target}
        sending={sending}
        onSend={onSend}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 2, pt: 0.75, pb: 1.5, fontSize: 12.5 }}
      >
        Queda guardado como lección de la tienda y los agentes lo leen en la próxima lectura. Se ve
        y se borra en "Cómo funciona esta tienda".
      </Typography>
    </>
  );
}
