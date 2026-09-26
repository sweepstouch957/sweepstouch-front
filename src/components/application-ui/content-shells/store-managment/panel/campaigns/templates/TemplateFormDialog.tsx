'use client';

/**
 * Alta o edición de una plantilla: nombre (para el menú) + lo que carga en la campaña, con
 * los placeholders de siempre y, al lado, el teléfono con el mensaje REAL (resuelto por el
 * backend con el mismo pipeline del envío) que se actualiza mientras se escribe.
 */
import type { CampaignTemplateInput } from '@/services/campaignTemplates.service';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import MessagePreviewPanel from '../messaging/MessagePreviewPanel';
import PlaceholderChips from '../messaging/PlaceholderChips';
import { smartInsert } from '../placeholderInsert';

const MAX = { name: 80, title: 200, content: 2047, description: 500 };

type Props = {
  storeId: string;
  open: boolean;
  mode: 'create' | 'edit';
  initial: Partial<CampaignTemplateInput>;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CampaignTemplateInput) => void;
};

export default function TemplateFormDialog({
  storeId,
  open,
  mode,
  initial,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState({ name: '', title: '', content: '', description: '' });
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Placeholder en el cursor, con sólo los espacios que hacen falta (smartInsert).
  const insert = useCallback(
    (key: string) => {
      const el = contentRef.current;
      const start = el?.selectionStart ?? form.content.length;
      const end = el?.selectionEnd ?? form.content.length;
      const { text, caret } = smartInsert(form.content, start, end, key);
      if (text.length > MAX.content) return;
      setForm((f) => ({ ...f, content: text }));
      // Después del render: el cursor queda justo después del placeholder.
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(caret, caret);
      });
    },
    [form.content]
  );

  const valid = !!form.name.trim() && !!form.content.trim();

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        {mode === 'create' ? 'Guardar como plantilla' : 'Editar plantilla'}
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Queda guardada para esta tienda. La imagen no se guarda: cada campaña lleva la suya.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            pt: 1,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' },
            alignItems: 'start',
          }}
        >
          {/* Formulario */}
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
            <Box>
              <TextField
                label="Texto del mensaje"
                value={form.content}
                onChange={set('content')}
                inputRef={contentRef}
                multiline
                minRows={6}
                fullWidth
                required
                inputProps={{ maxLength: MAX.content }}
                helperText={`${form.content.length} / ${MAX.content}`}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 14, lineHeight: 1.6 } }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 1, fontSize: 12.5 }}
              >
                Toca uno para insertarlo donde está el cursor. Se reemplaza por cliente al enviar.
              </Typography>
              <PlaceholderChips onInsert={insert} />
            </Box>
            <TextField
              label="Nota interna (opcional)"
              value={form.description}
              onChange={set('description')}
              inputProps={{ maxLength: MAX.description }}
            />
          </Stack>

          {/* Teléfono: el mensaje real, en vivo */}
          <Box sx={{ position: { md: 'sticky' }, top: { md: 0 } }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              Así lo recibe el cliente
            </Typography>
            <MessagePreviewPanel
              storeId={storeId}
              content={form.content}
            />
          </Box>
        </Box>
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
