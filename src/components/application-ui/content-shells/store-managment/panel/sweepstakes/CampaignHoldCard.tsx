'use client';

/**
 * Pausa de campañas por opt-in (medición). Con la pausa prendida, los números que se
 * registren en cualquier sorteo de esta tienda desde la fecha elegida NO reciben sus
 * campañas (ni cuentan en su audiencia/costo). Se habilitan por sorteo o todos juntos
 * apagando la pausa. No toca nada del cliente: se filtra al armar la lista de envío.
 */
import { useConfirm } from '@/components/base/confirm';
import { getCampaignHold, updateStorePatch, type CampaignHold, type Store } from '@/services/store.service';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

const num = (n: number) => Number(n || 0).toLocaleString('es');
const today = () => new Date().toISOString().slice(0, 10);

export default function CampaignHoldCard({ store }: { store: Store }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const storeId = (store._id || store.id) as string;
  const key = ['campaign-hold', storeId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => getCampaignHold(storeId) });
  const hold: CampaignHold = data?.hold ?? store.campaignHold ?? { active: false, since: null, releasedSweepstakes: [] };
  const [since, setSince] = useState(() => (hold.since ? String(hold.since).slice(0, 10) : today()));

  const save = useMutation({
    mutationFn: (next: CampaignHold) => updateStorePatch(storeId, { campaignHold: next }),
    onSuccess: () => {
      toast.success('Guardado');
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const turnOn = () =>
    save.mutate({ active: true, since: new Date(`${since}T00:00:00`).toISOString(), releasedSweepstakes: hold.releasedSweepstakes || [] });

  const turnOff = () =>
    void confirm({
      title: '¿Habilitar todos los números?',
      details: [
        ['Tienda', store.name],
        ['Vuelven a recibir campañas', `${num(data?.held ?? 0)} números`],
      ],
      confirmLabel: 'Habilitar todos',
    }).then((ok) => ok && save.mutate({ ...hold, active: false }));

  const release = (id: string, name: string, count: number) =>
    void confirm({
      title: '¿Habilitar este sorteo?',
      details: [
        ['Sorteo', name],
        ['Vuelven a recibir campañas', `${num(count)} números`],
      ],
      confirmLabel: 'Habilitar',
    }).then((ok) => ok && save.mutate({ ...hold, releasedSweepstakes: [...new Set([...(hold.releasedSweepstakes || []), id])] }));

  const pause = (id: string) =>
    save.mutate({ ...hold, releasedSweepstakes: (hold.releasedSweepstakes || []).filter((x) => x !== id) });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
          <PauseCircleOutlineRoundedIcon color="warning" />
          <Typography variant="subtitle1" fontWeight={700}>
            Pausar campañas a los nuevos registros
          </Typography>
          {hold.active && <Chip size="small" color="warning" label={`${num(data?.held ?? 0)} en pausa`} />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Para medir el opt-in: los números que se registren en un sorteo de esta tienda desde la fecha elegida no reciben sus
          campañas ni cuentan en su audiencia, hasta que los habilites. La confirmación del registro sí les llega.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={1.5} sx={{ mb: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={hold.active}
                disabled={save.isPending || isLoading}
                onChange={(e) => (e.target.checked ? turnOn() : turnOff())}
              />
            }
            label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>{hold.active ? 'Pausa activa' : 'Pausa apagada'}</Typography>}
          />
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            disabled={hold.active || save.isPending}
            InputLabelProps={{ shrink: true }}
            helperText={hold.active ? 'Para cambiarla, apaga y vuelve a prender.' : 'Registros desde este día.'}
          />
        </Stack>

        {isLoading ? (
          <Skeleton variant="rounded" height={80} />
        ) : hold.active && (data?.sweepstakes.length ?? 0) === 0 ? (
          <Alert severity="info" sx={{ fontSize: 12.5 }}>
            Todavía nadie se registró desde {new Date(hold.since as string).toLocaleDateString('es')}.
          </Alert>
        ) : hold.active ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sorteo</TableCell>
                <TableCell align="right">Números</TableCell>
                <TableCell align="right">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data!.sweepstakes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell align="right">{num(s.count)}</TableCell>
                  <TableCell align="right">
                    {s.released ? (
                      <Button size="small" color="inherit" disabled={save.isPending} onClick={() => pause(s.id)}>
                        Habilitado · volver a pausar
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        disabled={save.isPending}
                        onClick={() => release(s.id, s.name, s.count)}
                      >
                        Habilitar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
