'use client';

/**
 * Validar la lista de la próxima semana por adelantado: "Aprobar" → aviso con "revisé todo" →
 * sus productos salen solos en su fecha. Aprobado se ve en verde con quién y cuándo, y se
 * puede deshacer. Sin aprobar, ese día quedan "Por revisar" (el cliente no los ve).
 */
import type { UpcomingGroup } from '@/services/circular';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useApproveReview } from './use-approve-review';
import { fmtDay } from './utils';

export function ApproveFlyerButton({ group }: { group: UpcomingGroup }) {
  const c = group.circular;
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  const approve = useApproveReview();
  if (!c) return null;

  if (c.reviewApprovedAt) {
    const when = new Date(c.reviewApprovedAt).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
    });
    return (
      <Tooltip
        title={`Aprobado${
          c.reviewApprovedBy ? ` por ${c.reviewApprovedBy}` : ''
        } el ${when}. Sale solo en su fecha. Clic para quitar la aprobación.`}
      >
        <Chip
          color="success"
          icon={<TaskAltRoundedIcon />}
          label="Aprobado · sale solo"
          onClick={() => approve.mutate({ circularId: c._id, approve: false })}
          disabled={approve.isPending}
          sx={{ fontWeight: 700 }}
        />
      </Tooltip>
    );
  }

  const close = () => {
    setOk(false);
    setOpen(false);
  };
  return (
    <>
      <Button
        size="small"
        variant="contained"
        color="success"
        startIcon={<TaskAltRoundedIcon />}
        onClick={() => setOpen(true)}
      >
        Aprobar
      </Button>
      <Dialog
        open={open}
        onClose={close}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={800}>Aprobar la lista de {fmtDay(group.day)}</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 1.5 }}
          >
            Estos <strong>{group.items.length}</strong> productos van a aparecer solos en las listas
            de los clientes ese día, sin que nadie tenga que entrar. Si algo cambia antes, puedes
            quitar la aprobación.
          </Typography>
          <Alert
            severity="warning"
            sx={{ mb: 1.5 }}
          >
            Revisa contra el arte (botón flotante <strong>Ver flyer</strong> o menú ⋯ → Ver arte)
            nombre, precio, foto y letra chica de cada uno. Lo que esté mal, corrígelo en su tarjeta
            antes de aprobar.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={ok}
                onChange={(e) => setOk(e.target.checked)}
              />
            }
            label="Revisé todos los productos: están correctos"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!ok || approve.isPending}
            onClick={() =>
              approve.mutate({ circularId: c._id, approve: true }, { onSuccess: close })
            }
          >
            {approve.isPending ? 'Aprobando…' : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
