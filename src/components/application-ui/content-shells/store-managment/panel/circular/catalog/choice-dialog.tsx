'use client';

/** Base de los diálogos "elige cómo correrlo" del catálogo (IA sobre los productos):
 *  título con ícono, qué hace, una nota y las opciones como botones. La última opción
 *  es la principal (rosa); las otras van delineadas. */
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

export type ChoiceOption = { key: string; label: ReactNode; onClick: () => void };

export function ChoiceDialog({
  open,
  title,
  body,
  note,
  options,
  busy,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  note: ReactNode;
  options: ChoiceOption[];
  busy: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeOutlinedIcon
          color="primary"
          fontSize="small"
        />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ mb: 1 }}
        >
          {body}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {note}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, '& > :not(style) ~ :not(style)': { ml: 0 } }}>
        <Button
          size="small"
          onClick={onClose}
        >
          Cancelar
        </Button>
        {options.map((o, i) => (
          <Button
            key={o.key}
            size="small"
            variant={i === options.length - 1 ? 'contained' : 'outlined'}
            disabled={busy}
            onClick={o.onClick}
          >
            {o.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}
