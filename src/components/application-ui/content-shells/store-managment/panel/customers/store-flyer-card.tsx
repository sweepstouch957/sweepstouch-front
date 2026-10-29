'use client';

/**
 * Flyer actual a mano (campaign-service StoreFlyer): cambia el flyer del linktree sin mandar
 * campaña. Sin flyer manual (o vencido, o con una campaña más nueva) sale el de la última campaña.
 */
import { api } from '@/libs/axios';
import { uploadCampaignImage } from '@/services/upload.service';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

type StoreFlyer = { image: string; title?: string; expiresAt?: string | null; updatedAt: string };

const errorMsg = (e: any) => e?.response?.data?.error || 'No se pudo guardar';

export default function StoreFlyerCard({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const key = ['store-flyer', storeId];
  const { data: flyer } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<StoreFlyer | null>(`/campaigns/store-flyer/${storeId}`)).data,
  });
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const save = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await uploadCampaignImage(file, 'campaigns');
      return api.put(`/campaigns/store-flyer/${storeId}`, {
        image: url,
        title,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast.success('Flyer actualizado: el linktree ya muestra éste');
      setTitle('');
      setExpiresAt('');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(errorMsg(e)),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/campaigns/store-flyer/${storeId}`),
    onSuccess: () => {
      toast.success('Vuelve el flyer de la última campaña');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(errorMsg(e)),
  });

  const vencido = !!flyer?.expiresAt && new Date(flyer.expiresAt) < new Date();

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 3 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        mb={1}
        color="text.secondary"
      >
        <ImageRoundedIcon fontSize="small" />
        <Typography
          variant="overline"
          fontWeight={700}
          letterSpacing={0.8}
        >
          Flyer actual
        </Typography>
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={2}
        alignItems={{ sm: 'flex-start' }}
      >
        {flyer?.image && (
          <Box
            component="img"
            src={flyer.image}
            alt="Flyer manual"
            sx={{ width: 120, borderRadius: 2, border: 1, borderColor: 'divider', opacity: vencido ? 0.5 : 1 }}
          />
        )}
        <Stack
          gap={1.5}
          flex={1}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {flyer
              ? `Flyer puesto a mano${flyer.title ? ` (“${flyer.title}”)` : ''}${
                  flyer.expiresAt
                    ? ` · ${vencido ? 'venció' : 'hasta'} ${new Date(flyer.expiresAt).toLocaleDateString()}`
                    : ''
                }. Si después se manda una campaña, sale el de la campaña.`
              : 'Sale el arte de la última campaña. Subí una imagen para cambiarlo sin mandar campaña.'}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1.5}
          >
            <TextField
              size="small"
              label="Título de campaña (titular de Mi cuenta y el flyer)"
              helperText="Vacío = queda el título de la última campaña"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              type="date"
              label="Vence (opcional)"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <Stack
            direction="row"
            gap={1.5}
          >
            <Button
              component="label"
              variant="contained"
              disableElevation
              disabled={save.isPending}
              startIcon={save.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {flyer ? 'Cambiar imagen' : 'Subir flyer'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) save.mutate(f);
                }}
              />
            </Button>
            {flyer && (
              <Button
                color="inherit"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Quitar (usar la de la última campaña)
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
