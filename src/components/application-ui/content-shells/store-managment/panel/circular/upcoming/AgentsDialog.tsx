'use client';

/**
 * Poner a los agentes a trabajar sobre un flyer que todavía no salió. Se monta al abrir
 * (`{group && <AgentsDialog/>}`): el form arranca con sus valores por defecto cada vez.
 */
import type { UpcomingGroup } from '@/services/circular.service';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { fmtDay, type AgentsOptions } from './utils';

function AgentCheck({
  field,
  defaultChecked,
  disabled,
  label,
}: {
  field: UseFormRegisterReturn;
  defaultChecked: boolean;
  disabled: boolean;
  label: ReactNode;
}) {
  const { ref, ...rest } = field;
  return (
    <FormControlLabel
      sx={{ alignItems: 'flex-start', ml: 0, mt: 1 }}
      control={
        <Checkbox
          {...rest}
          inputRef={ref}
          defaultChecked={defaultChecked}
          disabled={disabled}
          sx={{ mt: -0.5 }}
        />
      }
      label={<Typography variant="body2">{label}</Typography>}
    />
  );
}

export default function AgentsDialog({
  group,
  pending,
  onClose,
  onSubmit,
}: {
  group: UpcomingGroup;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: AgentsOptions) => void;
}) {
  // Un flyer de supermercado trae 80–120 productos y la primera lectura suele sacar 30–40:
  // la segunda pasada (Argos, por secciones) es lo primero que hay que correr.
  const defaultValues: AgentsOptions = { missing: true, photos: false };
  const { register, handleSubmit } = useForm<AgentsOptions>({ defaultValues });

  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit(onSubmit) }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToyOutlinedIcon color="primary" />
        Revisar con los agentes
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {`${group.items.length} productos leídos del ${fmtDay(
            group.day
          )}. Un flyer de supermercado suele traer 80–120.`}
        </Typography>
        <AgentCheck
          field={register('missing')}
          defaultChecked={defaultValues.missing}
          disabled={pending}
          label={
            <>
              <b>Argos</b> vuelve a leer el arte por secciones y suma los productos que la primera
              lectura se saltó. Lo que ya está no se toca.
            </>
          }
        />
        <Typography
          variant="body2"
          sx={{ mt: 1.5 }}
        >
          <b>Atenea</b> coteja precios, nombres y letra chica contra el arte. Lo seguro lo
          corrige; lo dudoso queda en Agentes IA para decidir.
        </Typography>
        <AgentCheck
          field={register('photos')}
          defaultChecked={defaultValues.photos}
          disabled={pending}
          label={
            <>
              <b>Iris</b> rehace TODAS las fotos de este flyer buscando cada producto en su página
              (una por producto, tarda varios minutos). Si sólo son una o dos, mejor el ícono de
              cámara en la card.
            </>
          }
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={pending}
        >
          {pending ? 'Arrancando…' : 'A trabajar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
