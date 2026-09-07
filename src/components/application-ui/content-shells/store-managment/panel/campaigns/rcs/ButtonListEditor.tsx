'use client';

/** Lista de botones RCS con alta/edición/baja y tope según el contexto. */

import { Button, Stack, Typography } from '@mui/material';
import ButtonEditor from './ButtonEditor';
import { Btn } from './rcs-domain';

export default function ButtonListEditor({
  buttons,
  onChange,
  max,
  allowAdd,
  emptyHint,
}: {
  buttons: Btn[];
  onChange: (next: Btn[]) => void;
  max: number;
  allowAdd: boolean;
  emptyHint?: string;
}) {
  return (
    <Stack spacing={1}>
      {buttons.length === 0 && emptyHint && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {emptyHint}
        </Typography>
      )}
      {buttons.map((b, i) => (
        <ButtonEditor
          key={i}
          btn={b}
          allowAdd={allowAdd}
          onChange={(patch) => onChange(buttons.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))}
          onRemove={() => onChange(buttons.filter((_, idx) => idx !== i))}
        />
      ))}
      <Button
        size="small"
        variant="outlined"
        disabled={buttons.length >= max}
        onClick={() => onChange([...buttons, { text: '', kind: 'url', application: 'BROWSER' }])}
        sx={{ alignSelf: 'flex-start' }}
      >
        Agregar botón ({buttons.length}/{max})
      </Button>
    </Stack>
  );
}
