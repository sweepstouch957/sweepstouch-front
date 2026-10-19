'use client';

/**
 * Cómo funciona ESTA tienda para los agentes: reglas fijas (Argos las lee al extraer, Atenea al
 * auditar, Iris al rescanear fotos), lecciones de lo que salió mal y los departamentos que
 * aprendió Mnemósine. Antes vivía mezclado con las indicaciones de una sola extracción.
 */
import type { StoreLesson, StoreProfile } from '@/services/circular.service';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { memo, useEffect, useRef } from 'react';
import { useForm, useWatch, type Control } from 'react-hook-form';
import AgentCard from './AgentCard';
import { AGENT_NAME, LESSON_MAX, RULES_MAX } from './constants';

type Props = {
  step: number;
  profile?: StoreProfile;
  loading: boolean;
  /** Rechaza si falla (el toast lo pone la mutación). */
  onSaveRules: (rules: string) => Promise<unknown>;
  onAddLesson: (text: string) => Promise<unknown>;
  onRemoveLesson: (index: number) => void;
};

/** Las reglas se guardan solas al salir del campo, sólo si cambiaron. */
function RulesForm({
  rules,
  onSave,
}: {
  rules: string;
  onSave: (rules: string) => Promise<unknown>;
}) {
  // `values` sigue al servidor (p. ej. tras anotar una lección) sin pisar lo que se está
  // escribiendo y todavía no se guardó.
  const { register, getValues, reset, formState } = useForm({
    values: { rules },
    resetOptions: { keepDirtyValues: true },
  });
  // Último valor guardado: el blur lo lee en el momento (el proxy de formState no).
  const saved = useRef(rules);
  useEffect(() => {
    saved.current = rules;
  }, [rules]);
  const { ref, ...field } = register('rules', {
    onBlur: async () => {
      const value = getValues('rules');
      if (value === saved.current) return;
      try {
        await onSave(value);
        saved.current = value;
        reset({ rules: value });
      } catch {
        /* el toast de error lo pone la mutación; queda "sin guardar" */
      }
    },
  });
  return (
    <TextField
      {...field}
      inputRef={ref}
      size="small"
      fullWidth
      multiline
      minRows={3}
      label="Reglas de la tienda"
      placeholder="Las carnes son por libra aunque no lo diga · los precios 2/$5 son por unidad, no combinables · la letra chica va en rojo bajo el precio · ignora la página de cerveza · los productos Cherry Valley son marca propia · 'c/u' significa cada uno"
      inputProps={{ maxLength: RULES_MAX }}
      helperText={
        formState.isDirty
          ? 'Sin guardar: se guarda al salir del campo'
          : 'Argos la lee al extraer, Atenea al auditar e Iris al rescanear fotos'
      }
    />
  );
}

function LessonSubmit({ control }: { control: Control<{ lesson: string }> }) {
  const lesson = useWatch({ control, name: 'lesson' });
  return (
    <Button
      type="submit"
      size="small"
      variant="outlined"
      disabled={!lesson.trim()}
      sx={{ whiteSpace: 'nowrap', mt: 0.25, flexShrink: 0 }}
    >
      Anotar
    </Button>
  );
}

function LessonForm({ onAdd }: { onAdd: (text: string) => Promise<unknown> }) {
  const { register, control, handleSubmit, reset } = useForm({ defaultValues: { lesson: '' } });
  const { ref, ...field } = register('lesson');
  const submit = handleSubmit(async ({ lesson }) => {
    const text = lesson.trim();
    if (!text) return;
    try {
      await onAdd(text);
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
      alignItems="flex-start"
    >
      <TextField
        {...field}
        inputRef={ref}
        size="small"
        fullWidth
        label="Dile a los agentes qué salió mal"
        placeholder="Ej.: las fotos de bebidas salen con varios productos, recorta sólo una botella · los precios 2/$5 los leen como $2.50"
        inputProps={{ maxLength: LESSON_MAX }}
      />
      <LessonSubmit control={control} />
    </Stack>
  );
}

const LessonRow = memo(function LessonRow({
  lesson,
  index,
  onRemove,
}: {
  lesson: StoreLesson;
  index: number;
  onRemove: (index: number) => void;
}) {
  const manual = lesson.source === 'manual';
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      gap={0.75}
    >
      <Chip
        size="small"
        variant={manual ? 'filled' : 'outlined'}
        color={manual ? 'primary' : 'default'}
        label={AGENT_NAME[lesson.agent] || lesson.agent}
        sx={{ height: 18, fontSize: 10, flexShrink: 0, mt: 0.25 }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flex: 1, overflowWrap: 'anywhere' }}
      >
        {lesson.text}
      </Typography>
      <IconButton
        size="small"
        aria-label="Borrar lección"
        onClick={() => onRemove(index)}
        sx={{ p: 0.25 }}
      >
        <CloseRoundedIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Stack>
  );
});

export default function StoreRulesCard({
  step,
  profile,
  loading,
  onSaveRules,
  onAddLesson,
  onRemoveLesson,
}: Props) {
  const lessons = profile?.lessons ?? [];
  const departments = profile?.departments ?? [];

  return (
    <AgentCard
      step={step}
      title="Cómo funciona esta tienda"
      description="Instrucciones fijas que los agentes leen en cada lectura, auditoría y rescaneo. Cada tienda tiene las suyas; lo de una sola extracción va en la pestaña Circular."
    >
      <Stack spacing={2.25}>
        {loading ? (
          <Skeleton
            variant="rounded"
            height={104}
          />
        ) : (
          <RulesForm
            rules={profile?.rules ?? ''}
            onSave={onSaveRules}
          />
        )}

        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Lecciones aprendidas ({lessons.length})
          </Typography>
          <LessonForm onAdd={onAddLesson} />
          {lessons.length > 0 && (
            <Stack
              gap={0.75}
              sx={{ mt: 1.25, maxHeight: 260, overflowY: 'auto', pr: 0.5 }}
            >
              {lessons.map((l, i) => (
                <LessonRow
                  key={`${i}-${l.at}`}
                  lesson={l}
                  index={i}
                  onRemove={onRemoveLesson}
                />
              ))}
            </Stack>
          )}
        </Box>

        {departments.length > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            flexWrap="wrap"
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              Departamentos que Mnemósine aprendió:
            </Typography>
            {departments.map((d) => (
              <Chip
                key={d}
                size="small"
                variant="outlined"
                label={d}
                sx={{ height: 20, fontSize: 11 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </AgentCard>
  );
}
