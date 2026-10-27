'use client';

/**
 * Qué le llega al cliente cuando se registra en el sorteo / opt-in de esta tienda:
 * MMS (con la imagen del sorteo), SMS (sólo texto) o nada. Hay tiendas que no pagan el
 * opt-in, otras sólo SMS y otras nada porque no están activas. Guarda al elegir.
 */
import { updateStorePatch, type Store } from '@/services/store.service';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { Card, CardContent, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

type Mode = NonNullable<Store['optinConfirmation']>;

const OPTIONS: { value: Mode; label: string; hint: string }[] = [
  { value: 'mms', label: 'MMS', hint: 'Mensaje con la imagen del sorteo.' },
  { value: 'sms', label: 'Sólo SMS', hint: 'Sólo texto, sin imagen.' },
  { value: 'none', label: 'Nada', hint: 'No se manda confirmación y no se cobra el opt-in.' },
];

export default function OptinConfirmationCard({ store }: { store: Store }) {
  const qc = useQueryClient();
  const storeId = store._id || store.id;
  const current: Mode = store.optinConfirmation || 'mms';
  const save = useMutation({
    mutationFn: (v: Mode) => updateStorePatch(storeId, { optinConfirmation: v }),
    onSuccess: (_r, v) => {
      toast.success(`Confirmación del opt-in: ${OPTIONS.find((o) => o.value === v)?.label}`);
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });
  const shown = save.isPending ? save.variables : current;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ mb: 0.5 }}
        >
          <SmsOutlinedIcon color="primary" />
          <Typography
            variant="subtitle1"
            fontWeight={700}
          >
            Confirmación al registrarse
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5 }}
        >
          Lo que le llega al cliente cuando entra al sorteo u opt-in de esta tienda. Si la tienda
          está inactiva no se manda nada, elijas lo que elijas.
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={shown}
          disabled={save.isPending}
          onChange={(_e, v: Mode | null) => v && v !== current && save.mutate(v)}
          aria-label="Confirmación al registrarse"
        >
          {OPTIONS.map((o) => (
            <ToggleButton
              key={o.value}
              value={o.value}
              sx={{ px: 2 }}
            >
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, fontSize: 12.5 }}
        >
          {OPTIONS.find((o) => o.value === shown)?.hint}
        </Typography>
      </CardContent>
    </Card>
  );
}
