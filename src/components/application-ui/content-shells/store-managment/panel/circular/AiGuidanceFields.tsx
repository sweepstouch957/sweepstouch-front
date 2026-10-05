'use client';

/**
 * Indicaciones para la IA antes de leer un circular: texto ("sólo los productos de Cherry
 * Valley") y fotos de apoyo (la lista escrita a mano que manda el cliente, una foto de la
 * góndola…). Valen para ESTA extracción. Las reglas fijas de la tienda y las lecciones viven
 * en la pestaña Agentes IA (StoreRulesCard).
 */
import { uploadCampaignImage } from '@/services/upload.service';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function useAiGuidance(_storeSlug?: string) {
  const [guidance, setGuidance] = useState('');
  const [refs, setRefs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addPhotos = async (list: FileList | null | undefined) => {
    const files = Array.from(list || []).slice(0, 5 - refs.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push((await uploadCampaignImage(f, 'circular-refs')).url);
      setRefs((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error('No se pudo subir la foto de referencia');
    } finally {
      setUploading(false);
    }
  };

  const fields = (
    <Stack gap={1}>
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={2}
        label="Indicaciones para esta lectura (opcional)"
        placeholder="Ej.: sólo los productos de Cherry Valley · ignora las bebidas · los precios son por libra"
        helperText="Sólo para esta extracción. Las reglas fijas de la tienda van en la pestaña Agentes IA."
        value={guidance}
        onChange={(e) => setGuidance(e.target.value.slice(0, 500))}
      />
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <Button
          component="label"
          size="small"
          variant="outlined"
          startIcon={<AddPhotoAlternateOutlinedIcon />}
          disabled={uploading || refs.length >= 5}
        >
          {uploading ? 'Subiendo…' : 'Adjuntar fotos de referencia'}
          <input
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              void addPhotos(e.target.files);
              e.target.value = '';
            }}
          />
        </Button>
        {refs.map((url) => (
          <Box
            key={url}
            sx={{ position: 'relative' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              style={{ height: 44, borderRadius: 6, border: '1px solid #e5e5e5', display: 'block' }}
            />
            <IconButton
              size="small"
              aria-label="Quitar foto"
              onClick={() => setRefs((p) => p.filter((u) => u !== url))}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                p: 0.25,
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        {!refs.length && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Lo que manda el cliente: una lista escrita a mano, una foto de los productos. La IA
            busca eso en el circular.
          </Typography>
        )}
      </Stack>
    </Stack>
  );

  return {
    guidance,
    referenceImages: refs,
    fields,
    reset: () => {
      setGuidance('');
      setRefs([]);
    },
  };
}
