'use client';

/** Alta o edición de una plantilla: nombre (para el menú) + lo que carga en la campaña. */
import type { CampaignTemplateInput } from '@/services/campaignTemplates.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const MAX = { name: 80, title: 200, content: 2047, description: 500 };

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initial: Partial<CampaignTemplateInput>;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CampaignTemplateInput) => void;
};

export default function TemplateFormDialog({
  open,
  mode,
  initial,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState({ name: '', title: '', content: '', description: '' });

  // Al abrir se carga lo que viene (el mensaje actual del formulario o la plantilla a editar).
  useEffect(() => {
    if (!open) return;
    setForm({
      name: initial.name || initial.title || '',
      title: initial.title || '',
      content: initial.content || '',
      description: initial.description || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = !!form.name.trim() && !!form.content.trim();

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        {mode === 'create' ? 'Guardar como plantilla' : 'Editar plantilla'}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Queda guardada para esta tienda. La imagen no se guarda: cada campaña lleva la suya.
        </Typography>
        <Stack gap={2}>
          <TextField
            label="Nombre de la plantilla"
            placeholder="Ej.: Fin de semana, VIP Sale"
            value={form.name}
            onChange={set('name')}
            inputProps={{ maxLength: MAX.name }}
            helperText="Así aparece en el menú de plantillas"
            autoFocus
            required
          />
          <TextField
            label="Título de la campaña"
            value={form.title}
            onChange={set('title')}
            inputProps={{ maxLength: MAX.title }}
          />
          <TextField
            label="Texto del mensaje"
            value={form.content}
            onChange={set('content')}
            multiline
            minRows={4}
            required
            inputProps={{ maxLength: MAX.content }}
            helperText={`${form.content.length} / ${MAX.content}`}
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 14 } }}
          />
          <TextField
            label="Nota interna (opcional)"
            value={form.description}
            onChange={set('description')}
            inputProps={{ maxLength: MAX.description }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!valid || saving}
          onClick={() =>
            onSave({
              name: form.name.trim(),
              title: form.title.trim(),
              content: form.content,
              description: form.description.trim(),
            })
          }
        >
          {saving ? 'Guardando…' : mode === 'create' ? 'Guardar plantilla' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
