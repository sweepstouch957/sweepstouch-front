'use client';

/**
 * Indicaciones para la IA antes de leer un circular: texto ("sólo los productos de Cherry
 * Valley") y fotos de apoyo (la lista escrita a mano que manda el cliente, una foto de la
 * góndola…). Valen para ESTA extracción. Las reglas fijas de la tienda y las lecciones viven
 * en la pestaña Agentes IA (StoreRulesCard).
 *
 * `AiGuidanceFields` es presentacional (sirve con react-hook-form: el texto va por `register`,
 * las fotos por `Controller`). `useAiGuidance` lo envuelve con estado propio para quien no
 * tiene un formulario.
 */
import { uploadCampaignImage } from '@/services/upload.service';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  type TextFieldProps,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

export const MAX_GUIDANCE_CHARS = 500;
export const MAX_REFERENCE_IMAGES = 5;

/** Sube fotos de referencia (hasta 5 en total) y devuelve sus URLs. */
function useUploadReferences() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const urls: string[] = [];
      for (const f of files) urls.push((await uploadCampaignImage(f, 'circular-refs')).url);
      return urls;
    },
    onError: () => toast.error('No se pudo subir la foto de referencia'),
  });
}

function ReferencePhotos({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const upload = useUploadReferences();
  const full = value.length >= MAX_REFERENCE_IMAGES;

  const addPhotos = (list: FileList | null | undefined) => {
    const files = Array.from(list || []).slice(0, MAX_REFERENCE_IMAGES - value.length);
    if (!files.length) return;
    upload.mutate(files, {
      onSuccess: (urls) => onChange([...value, ...urls].slice(0, MAX_REFERENCE_IMAGES)),
    });
  };

  return (
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
        disabled={upload.isPending || full}
      >
        {upload.isPending ? 'Subiendo…' : 'Adjuntar fotos de referencia'}
        <input
          hidden
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addPhotos(e.target.files);
            e.target.value = '';
          }}
        />
      </Button>
      {value.map((url) => (
        <Box
          key={url}
          sx={{ position: 'relative' }}
        >
          <Box
            component="img"
            src={url}
            alt=""
            sx={{
              height: 44,
              display: 'block',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          <IconButton
            size="small"
            aria-label="Quitar foto"
            onClick={() => onChange(value.filter((u) => u !== url))}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              p: 0.25,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ))}
      {!value.length && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flex: 1, minWidth: 200 }}
        >
          Lo que manda el cliente: una lista escrita a mano, una foto de los productos. La IA busca
          eso en el circular.
        </Typography>
      )}
    </Stack>
  );
}

/** Texto + fotos de apoyo. `guidanceProps` va directo al TextField (p. ej. `register`). */
export function AiGuidanceFields({
  guidanceProps,
  referenceImages,
  onReferenceImagesChange,
}: {
  guidanceProps: TextFieldProps;
  referenceImages: string[];
  onReferenceImagesChange: (urls: string[]) => void;
}) {
  return (
    <Stack gap={1}>
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={2}
        label="Indicaciones para esta lectura (opcional)"
        placeholder="Ej.: sólo los productos de Cherry Valley · ignora las bebidas · los precios son por libra"
        helperText="Sólo para esta extracción. Las reglas fijas de la tienda van en la pestaña Agentes IA."
        {...guidanceProps}
        inputProps={{ maxLength: MAX_GUIDANCE_CHARS, ...guidanceProps.inputProps }}
      />
      <ReferencePhotos
        value={referenceImages}
        onChange={onReferenceImagesChange}
      />
    </Stack>
  );
}

/** Estado propio de las indicaciones, para pantallas sin formulario (mismo contrato de siempre). */
export function useAiGuidance(_storeSlug?: string) {
  const [guidance, setGuidance] = useState('');
  const [refs, setRefs] = useState<string[]>([]);

  const fields = (
    <AiGuidanceFields
      guidanceProps={{
        value: guidance,
        onChange: (e) => setGuidance(e.target.value.slice(0, MAX_GUIDANCE_CHARS)),
      }}
      referenceImages={refs}
      onReferenceImagesChange={setRefs}
    />
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
