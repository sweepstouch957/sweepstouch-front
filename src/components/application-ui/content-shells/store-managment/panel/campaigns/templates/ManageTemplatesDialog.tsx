'use client';

/**
 * Plantillas de la tienda: ver, crear, editar y borrar. Se abre desde el formulario de
 * campaña y desde la pestaña Campañas. Con `onUse` (formulario) cada una se puede aplicar.
 */
import type { CampaignTemplate } from '@/services/campaignTemplates.service';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PostAddRoundedIcon from '@mui/icons-material/PostAddRounded';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { previewText } from './baseTemplates';
import TemplateFormDialog from './TemplateFormDialog';
import { useCampaignTemplates } from './useCampaignTemplates';

type Props = {
  storeId: string;
  open: boolean;
  onClose: () => void;
  onUse?: (t: CampaignTemplate) => void;
};

export default function ManageTemplatesDialog({ storeId, open, onClose, onUse }: Props) {
  const { templates, isLoading, create, update, remove } = useCampaignTemplates(
    open ? storeId : undefined
  );
  const [editing, setEditing] = useState<CampaignTemplate | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<CampaignTemplate | null>(null);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              Plantillas de mensaje
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Título y texto guardados para esta tienda. La imagen cambia en cada campaña.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setEditing('new')}
              sx={{ flexShrink: 0 }}
            >
              Nueva
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {isLoading ? (
            <Stack gap={1.5}>
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={84}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Stack>
          ) : !templates.length ? (
            <Stack
              alignItems="center"
              gap={1}
              sx={{ py: 5, textAlign: 'center' }}
            >
              <PostAddRoundedIcon
                color="disabled"
                sx={{ fontSize: 40 }}
              />
              <Typography fontWeight={700}>Todavía no hay plantillas</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 420 }}
              >
                Guarda el mensaje de una campaña que funcionó con &quot;Guardar como plantilla&quot;
                en el formulario, o crea una acá.
              </Typography>
            </Stack>
          ) : (
            <Stack gap={1.25}>
              {templates.map((t) => (
                <Stack
                  key={t._id}
                  direction={{ xs: 'column', sm: 'row' }}
                  gap={1.5}
                  sx={{ p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1}
                      flexWrap="wrap"
                    >
                      <Typography fontWeight={700}>{t.name}</Typography>
                      {t.usageCount > 0 && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Usada ${t.usageCount} ${t.usageCount === 1 ? 'vez' : 'veces'}`}
                          sx={{ height: 22 }}
                        />
                      )}
                    </Stack>
                    {t.title && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Título: {t.title}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        fontFamily: 'monospace',
                        fontSize: 12.5,
                        color: 'text.secondary',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {previewText(t.content)}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={0.5}
                    sx={{ flexShrink: 0 }}
                  >
                    {onUse && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onUse(t)}
                      >
                        Usar
                      </Button>
                    )}
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => setEditing(t)}
                        aria-label={`Editar ${t.name}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => setToDelete(t)}
                        aria-label={`Eliminar ${t.name}`}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <TemplateFormDialog
        open={!!editing}
        mode={editing === 'new' ? 'create' : 'edit'}
        initial={editing && editing !== 'new' ? editing : {}}
        saving={create.isPending || update.isPending}
        onClose={() => setEditing(null)}
        onSave={(input) => {
          const done = { onSuccess: () => setEditing(null) };
          if (editing === 'new') create.mutate(input, done);
          else if (editing) update.mutate({ id: editing._id, patch: input }, done);
        }}
      />

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar la plantilla?</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            &quot;{toDelete?.name}&quot; deja de aparecer en el menú. Las campañas ya creadas con
            ella no cambian.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (toDelete) remove.mutate(toDelete);
              setToDelete(null);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
