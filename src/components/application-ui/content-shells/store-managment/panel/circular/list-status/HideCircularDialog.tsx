'use client';

import type { CatalogSource } from '@/services/circular.service';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Skeleton,
  Typography,
} from '@mui/material';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { fmtDate } from '../shared';
import { defaultKeepId, WHEN_LABEL } from './utils';

type Values = { keepId: string };

/** Elegido = lo que marcó la encargada o, si no tocó nada, el de por defecto. */
const pick = (keepId: string, sources: CatalogSource[]) => keepId || defaultKeepId(sources);

function SubmitButton({
  control,
  sources,
  pending,
}: {
  control: Control<Values>;
  sources: CatalogSource[];
  pending: boolean;
}) {
  const chosen = pick(useWatch({ control, name: 'keepId' }), sources);
  const src = sources.find((x) => x.id === chosen);
  return (
    <Button
      type="submit"
      variant="contained"
      color="warning"
      disabled={pending || !chosen}
    >
      {pending
        ? 'Ocultando…'
        : src
          ? `Dejar sólo ${src.products} de "${src.title.slice(0, 28)}"`
          : 'Ocultar'}
    </Button>
  );
}

/**
 * "Ocultar los del circular": la encargada elige con qué flyer (o circular) quedarse y todo
 * lo demás se oculta. Por defecto el flyer con arte propio vigente; si no, el próximo.
 */
export default function HideCircularDialog({
  sources,
  loading,
  pending,
  onClose,
  onSubmit,
}: {
  sources: CatalogSource[];
  loading: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (keepId: string) => void;
}) {
  const { control, handleSubmit } = useForm<Values>({ defaultValues: { keepId: '' } });

  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit((v) => onSubmit(pick(v.keepId, sources))),
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VisibilityOffOutlinedIcon color="warning" />
        Ocultar los del circular
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ mb: 1.5 }}
        >
          Elige <b>con qué quedarte</b>. Sólo sus productos quedan visibles; todo lo demás se
          oculta (circular semanal, lo leído del link de circularss, lecturas viejas, cargado a
          mano).
        </Typography>
        {loading ? (
          <Skeleton
            variant="rounded"
            height={120}
          />
        ) : sources.length ? (
          <Controller
            name="keepId"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={pick(field.value, sources)}
                onChange={(e) => field.onChange(e.target.value)}
              >
                {sources.map((x) => (
                  <FormControlLabel
                    key={x.id}
                    value={x.id}
                    control={<Radio size="small" />}
                    sx={{ alignItems: 'flex-start', mb: 0.75, mr: 0 }}
                    label={
                      <Box sx={{ pt: 0.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                        >
                          {x.kind === 'flyer' ? 'Flyer' : 'Circular'}: {x.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: 12.5 }}
                        >
                          {fmtDate(x.startDate)} → {fmtDate(x.endDate)} · {WHEN_LABEL[x.when]} ·{' '}
                          {x.products} leídos · {x.count} en el catálogo
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            )}
          />
        ) : (
          <Typography
            variant="body2"
            color="warning.main"
          >
            Esta tienda no tiene flyer ni circular de los últimos días.
          </Typography>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, fontSize: 12.5 }}
        >
          No borra nada. El circular semanal no los vuelve a prender; sólo un flyer que los
          traiga, o prenderlos a mano en Productos.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </Button>
        <SubmitButton
          control={control}
          sources={sources}
          pending={pending}
        />
      </DialogActions>
    </Dialog>
  );
}
