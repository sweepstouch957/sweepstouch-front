'use client';

import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Ruling } from './utils';

/** Qué hace cada agente antes de mandarlos a arreglar la lista del flyer vigente. */
export default function AgentsFixDialog({
  ruling: r,
  pending,
  onClose,
  onOpenAgents,
  onConfirm,
}: {
  ruling: Ruling | null;
  pending: boolean;
  onClose: () => void;
  onOpenAgents: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToyOutlinedIcon color="primary" />
        Que los agentes lo arreglen
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ mb: 1 }}
        >
          Sobre <b>{r?.title}</b>
          {r ? ` (${r.products} productos leídos, ${r.uniqueProducts} distintos)` : ''}:
        </Typography>
        <Typography
          variant="body2"
          component="ul"
          sx={{ pl: 2.5, m: 0, '& li': { mb: 0.5 } }}
        >
          <li>
            <b>Hefesto</b> corrige de forma lo guardado: precios mal leídos (&quot;9$95&quot; →
            &quot;$9.95&quot;), regulares absurdos fuera, letra chica sin repetir mostrador, límite
            o compra mínima.
          </li>
          <li>
            <b>Temis</b> deja visibles sólo los productos de este flyer, oculta el resto y quita
            los repetidos.
          </li>
          <li>
            <b>Atenea</b> vuelve a leer el arte página por página y coteja precios, nombres y
            letra chica. Lo dudoso queda para decidir en Agentes IA.
          </li>
          <li>
            <b>Iris</b> rehace las fotos que falten o no se parezcan.
          </li>
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, fontSize: 12.5 }}
        >
          No toca precios a mano ni lo que ya corregiste. Tarda unos minutos; se ve avanzar en la
          oficina.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          variant="text"
          onClick={() => {
            onClose();
            onOpenAgents();
          }}
        >
          Ver la oficina
        </Button>
        <Button
          variant="contained"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? 'Arrancando…' : 'A trabajar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
