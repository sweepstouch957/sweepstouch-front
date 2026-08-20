'use client';

import { promoService, type ImageField, type ImageMatchPreview } from '@/services/promo.service';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Warning } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  /** Se llama cuando algo cambió, para refrescar el listado */
  onDone: () => void;
}

type Action = 'replace' | 'deactivate' | 'delete';

/**
 * Acciones masivas sobre una imagen.
 *
 * El caso que la motivó: se subió mal la foto de un ganador de sorteo. Como las
 * promos genéricas se copian a cada tienda, esa imagen quedó en más de cien
 * documentos y no había forma de reemplazarla ni de bajarla — el listado sólo
 * dejaba borrar de a una, y por id.
 *
 * El diálogo primero MUESTRA qué va a tocar y recién después deja actuar:
 * una acción masiva a ciegas sobre cien registros no es una herramienta.
 */
export const BulkByImageDialog = ({ open, imageUrl, onClose, onDone }: Props) => {
  const { t } = useTranslation();

  const [field, setField] = useState<ImageField>('any');
  const [action, setAction] = useState<Action>('replace');
  const [newMobile, setNewMobile] = useState('');
  const [newDesktop, setNewDesktop] = useState('');
  const [typed, setTyped] = useState('');

  // Sólo genéricas: una promo custom es de UNA tienda y se edita desde su fila.
  const match = { imageUrl, field, mode: 'exact' as const, category: 'generic' as const };

  const { data: preview, isFetching } = useQuery<ImageMatchPreview>({
    queryKey: ['promos-by-image', imageUrl, field],
    queryFn: () => promoService.findByImage(match),
    enabled: open && Boolean(imageUrl),
  });

  const total = preview?.total ?? 0;

  const run = useMutation({
    mutationFn: async () => {
      if (action === 'replace') {
        const patch: Record<string, string> = {};
        if (newMobile.trim()) patch.imageMobile = newMobile.trim();
        if (newDesktop.trim()) patch.imageDesktop = newDesktop.trim();
        return promoService.updateByImage({ ...match, ...patch });
      }
      return promoService.removeByImage({
        ...match,
        confirm: true,
        deactivate: action === 'deactivate',
      });
    },
    onSuccess: (res: any) => {
      const d = res?.data || {};
      const n =
        (d.promosModificadas ?? d.promosDesactivadas ?? d.promosEliminadas ?? 0) +
        (d.genericasModificadas ?? d.genericasDesactivadas ?? d.genericasEliminadas ?? 0);
      toast.success(t('{{count}} promotions updated', { count: n }));
      onDone();
      onClose();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || t('The bulk action could not be completed.')),
  });

  const nothingToReplace = action === 'replace' && !newMobile.trim() && !newDesktop.trim();
  // Borrar es lo único sin vuelta atrás: se escribe BORRAR para habilitarlo.
  const deleteUnconfirmed = action === 'delete' && typed.trim().toUpperCase() !== 'BORRAR';
  const blocked = total === 0 || nothingToReplace || deleteUnconfirmed || run.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t('Fix an image across every store')}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t('Image')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12.5 }}
          >
            {imageUrl}
          </Typography>
        </Box>

        <TextField
          size="small"
          select
          label={t('Look in')}
          value={field}
          onChange={(e) => setField(e.target.value as ImageField)}
        >
          <MenuItem value="any">{t('Mobile and desktop')}</MenuItem>
          <MenuItem value="mobile">{t('Mobile only')}</MenuItem>
          <MenuItem value="desktop">{t('Desktop only')}</MenuItem>
        </TextField>

        {/* Qué se va a tocar, antes de tocarlo */}
        {isFetching ? (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <CircularProgress size={16} />
            <Typography variant="body2">{t('Checking what uses this image…')}</Typography>
          </Stack>
        ) : total === 0 ? (
          <Alert severity="info">
            {t('No generic promotion uses this image. Custom promotions are edited one by one.')}
          </Alert>
        ) : (
          <Alert severity={action === 'delete' ? 'error' : 'warning'}>
            <AlertTitle sx={{ fontWeight: 700 }}>
              {action === 'replace' && t('{{count}} ads will be modified', { count: total })}
              {action === 'deactivate' && t('{{count}} ads will be taken off', { count: total })}
              {action === 'delete' && t('{{count}} ads will be deleted', { count: total })}
            </AlertTitle>

            {/* A qué sorteo pertenece: es lo que decide si el cambio va o no */}
            {(preview?.sweepstakes?.length ?? 0) > 0 && (
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, mb: 0.75 }}
              >
                {preview!.sweepstakes.length === 1
                  ? t('Sweepstake: {{name}}', { name: preview!.sweepstakes[0].name })
                  : t('Sweepstakes: {{names}}', {
                      names: preview!.sweepstakes.map((x) => x.name).join(', '),
                    })}
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                label={t('{{count}} per store', { count: preview?.promoTotal ?? 0 })}
              />
              <Chip
                size="small"
                label={t('{{count}} generic', { count: preview?.genericTotal ?? 0 })}
              />
            </Stack>

            {(preview?.stores?.length ?? 0) > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                {preview!.stores.slice(0, 6).join(' · ')}
                {preview!.stores.length > 6 && ` +${preview!.stores.length - 6}`}
              </Typography>
            )}
          </Alert>
        )}

        <Divider />

        <RadioGroup
          value={action}
          onChange={(e) => setAction(e.target.value as Action)}
        >
          <FormControlLabel
            value="replace"
            control={<Radio size="small" />}
            label={t('Replace it with another image')}
          />
          <FormControlLabel
            value="deactivate"
            control={<Radio size="small" />}
            label={t('Take it off the tablets (keeps the record)')}
          />
          <FormControlLabel
            value="delete"
            control={<Radio size="small" />}
            label={t('Delete the promotions permanently')}
          />
        </RadioGroup>

        {action === 'replace' && (
          <Stack spacing={1.5}>
            <TextField
              size="small"
              label={t('New mobile image URL')}
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value)}
              placeholder="https://…"
            />
            <TextField
              size="small"
              label={t('New desktop image URL')}
              value={newDesktop}
              onChange={(e) => setNewDesktop(e.target.value)}
              placeholder="https://…"
              helperText={t('Leave a field empty to keep that image as it is')}
            />
          </Stack>
        )}

        {action === 'delete' && (
          <Alert
            severity="error"
            icon={<Warning />}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>{t('This cannot be undone')}</AlertTitle>
            <Typography
              variant="body2"
              sx={{ mb: 1.5 }}
            >
              {t(
                'Taking it off the tablets does the same for the customer and keeps the history. Delete only if the promotion should never have existed.'
              )}
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              label={t('Type BORRAR to confirm')}
            />
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none' }}
        >
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          disableElevation
          color={action === 'delete' ? 'error' : 'primary'}
          disabled={blocked}
          onClick={() => run.mutate()}
          startIcon={run.isPending ? <CircularProgress size={14} /> : undefined}
          sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
        >
          {action === 'replace' && t('Replace in {{count}} promotions', { count: total })}
          {action === 'deactivate' && t('Take off {{count}} promotions', { count: total })}
          {action === 'delete' && t('Delete {{count}} promotions', { count: total })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
