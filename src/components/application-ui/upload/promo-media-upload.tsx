'use client';

/**
 * Subida de media para un Ad: imagen o video (mp4/webm/mov, hasta 200 MB).
 * El video sube directo del navegador a Cloudinary con firma; acá sólo se ve el progreso.
 */
import { isVideoUrl, PROMO_VIDEO_MAX_BYTES, uploadPromoMedia } from '@/services/upload.service';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type Props = {
  value: string;
  onChange: (url: string) => void;
  onBusy?: (busy: boolean) => void;
  onError?: (msg: string) => void;
};

export default function PromoMediaUpload({ value, onChange, onBusy, onError }: Props) {
  const [pct, setPct] = useState<number | null>(null);
  const [fileInfo, setFileInfo] = useState('');

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setPct(0);
      onBusy?.(true);
      setFileInfo(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
      try {
        const { url } = await uploadPromoMedia(file, setPct);
        onChange(url);
      } catch (e: any) {
        onError?.(e?.message || 'No se pudo subir el archivo');
      } finally {
        setPct(null);
        onBusy?.(false);
      }
    },
    [onChange, onBusy, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: PROMO_VIDEO_MAX_BYTES,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/mp4': ['.mp4', '.m4v'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov'],
    },
    onDropRejected: () => onError?.('Archivo no válido: imagen, o video mp4/webm/mov de hasta 200 MB.'),
  });

  const uploading = pct !== null;
  const video = isVideoUrl(value);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Imagen o video
      </Typography>
      {value ? (
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            position: 'relative',
          }}
        >
          {video ? (
            <video
              src={value}
              controls
              muted
              playsInline
              preload="metadata"
              style={{ width: '100%', maxHeight: 280, display: 'block', background: '#000' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }}
            />
          )}
        </Box>
      ) : null}

      {!uploading && (
        <Box
          {...getRootProps()}
          sx={{
            mt: value ? 1 : 0,
            p: 2,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <input {...getInputProps()} />
          <Stack alignItems="center" gap={0.5}>
            <CloudUploadIcon color="action" />
            <Typography variant="body2" fontWeight={600}>
              {value ? 'Reemplazar archivo' : 'Arrastra o haz clic para subir'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Imagen (jpg, png, webp) o video mp4 / webm / mov hasta 200 MB. El video se
              reproduce en la tablet sin sonido, en loop.
            </Typography>
          </Stack>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={pct ?? 0} sx={{ height: 8, borderRadius: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Subiendo {fileInfo} · {pct}%
          </Typography>
        </Box>
      )}

      {value && !uploading && (
        <Button
          size="small"
          color="error"
          startIcon={<DeleteOutlineRoundedIcon />}
          onClick={() => onChange('')}
          sx={{ mt: 0.5, textTransform: 'none' }}
        >
          Quitar
        </Button>
      )}
    </Box>
  );
}
