'use client';

/**
 * Botón "Plantillas" del formulario de campaña. Nunca aplica nada solo:
 *  · De esta tienda: las guardadas (backend), las más usadas primero. Cargan título + texto.
 *  · Base: las comunes a todas las tiendas (sólo texto).
 *  · Guardar el mensaje actual como plantilla / administrar las de la tienda.
 * Si el formulario ya tiene texto, confirma antes de reemplazarlo.
 */
import type { CampaignTemplate, TemplateChannel } from '@/services/campaignTemplates.service';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import PostAddRoundedIcon from '@mui/icons-material/PostAddRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { BASE_TEMPLATES, previewText } from './baseTemplates';
import ManageTemplatesDialog from './ManageTemplatesDialog';
import TemplateFormDialog from './TemplateFormDialog';
import { useCampaignTemplates } from './useCampaignTemplates';

/** Lo que una plantilla carga en el formulario (sin imagen: cambia en cada campaña). */
export type AppliedTemplate = {
  name: string;
  content: string;
  title?: string;
  description?: string;
  channel?: TemplateChannel;
};

type Props = {
  storeId?: string;
  /** El formulario ya tiene texto: aplicar pide confirmación. */
  hasContent: boolean;
  /** Mensaje actual del formulario, para "Guardar como plantilla". */
  getCurrent: () => {
    title: string;
    content: string;
    description: string;
    channel: TemplateChannel;
  };
  onApply: (t: AppliedTemplate) => void;
};

const itemSx = { alignItems: 'flex-start', whiteSpace: 'normal', py: 1, maxWidth: 440 } as const;

export default function CampaignTemplatePicker({
  storeId,
  hasContent,
  getCurrent,
  onApply,
}: Props) {
  const { templates, isLoading, create, markUsed } = useCampaignTemplates(storeId);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState<(AppliedTemplate & { id?: string }) | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [current, setCurrent] = useState<ReturnType<Props['getCurrent']> | null>(null);

  const apply = (t: AppliedTemplate & { id?: string }) => {
    setPending(null);
    onApply(t);
    if (t.id) markUsed(t.id);
  };
  const pick = (t: AppliedTemplate & { id?: string }) => {
    setAnchor(null);
    setManageOpen(false);
    if (hasContent) setPending(t);
    else apply(t);
  };
  const fromStore = (t: CampaignTemplate) =>
    pick({
      id: t._id,
      name: t.name,
      content: t.content,
      title: t.title,
      description: t.description,
      channel: t.channel,
    });

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PostAddRoundedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ flexShrink: 0 }}
      >
        Plantillas
      </Button>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { maxHeight: 480, minWidth: 320 } } }}
      >
        {storeId && <ListSubheader sx={{ lineHeight: '32px' }}>De esta tienda</ListSubheader>}
        {storeId && isLoading && (
          <MenuItem disabled>
            <Skeleton
              variant="rounded"
              width={260}
              height={36}
            />
          </MenuItem>
        )}
        {storeId && !isLoading && !templates.length && (
          <MenuItem
            disabled
            sx={itemSx}
          >
            <Typography variant="body2">Todavía no hay plantillas guardadas.</Typography>
          </MenuItem>
        )}
        {templates.map((t) => (
          <MenuItem
            key={t._id}
            onClick={() => fromStore(t)}
            sx={itemSx}
          >
            <ListItemText
              primary={t.name}
              secondary={[t.title, previewText(t.content)].filter(Boolean).join(' · ')}
              primaryTypographyProps={{ fontWeight: 700 }}
              secondaryTypographyProps={{
                sx: {
                  fontSize: 12,
                  mt: 0.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                },
              }}
            />
          </MenuItem>
        ))}

        <ListSubheader sx={{ lineHeight: '32px' }}>Base</ListSubheader>
        {BASE_TEMPLATES.map((t) => (
          <MenuItem
            key={t.key}
            onClick={() => pick({ name: t.name, content: t.content })}
            sx={itemSx}
          >
            <ListItemText
              primary={t.name}
              secondary={previewText(t.content)}
              primaryTypographyProps={{ fontWeight: 700 }}
              secondaryTypographyProps={{ sx: { fontFamily: 'monospace', fontSize: 12, mt: 0.25 } }}
            />
          </MenuItem>
        ))}

        {storeId && <Divider />}
        {storeId && (
          <MenuItem
            disabled={!hasContent}
            onClick={() => {
              setAnchor(null);
              setCurrent(getCurrent());
              setSaveOpen(true);
            }}
          >
            <ListItemIcon>
              <BookmarkAddOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Guardar mensaje actual como plantilla"
              secondary={!hasContent ? 'Escribe el mensaje primero' : undefined}
            />
          </MenuItem>
        )}
        {storeId && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              setManageOpen(true);
            }}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Administrar plantillas" />
          </MenuItem>
        )}
      </Menu>

      {/* Reemplazar lo escrito: se confirma */}
      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Reemplazar el mensaje?</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Se carga la plantilla &quot;{pending?.name}&quot;
            {pending?.title ? ' (título y texto)' : ''}. Lo que escribiste se reemplaza; después lo
            puedes editar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => pending && apply(pending)}
          >
            Reemplazar
          </Button>
        </DialogActions>
      </Dialog>

      {storeId && (
        <>
          <TemplateFormDialog
            storeId={storeId}
            open={saveOpen}
            mode="create"
            initial={current ?? {}}
            saving={create.isPending}
            onClose={() => setSaveOpen(false)}
            onSave={(input) =>
              create.mutate(
                { ...input, channel: current?.channel ?? 'sms' },
                { onSuccess: () => setSaveOpen(false) }
              )
            }
          />
          <ManageTemplatesDialog
            storeId={storeId}
            open={manageOpen}
            onClose={() => setManageOpen(false)}
            onUse={fromStore}
          />
        </>
      )}
    </>
  );
}
