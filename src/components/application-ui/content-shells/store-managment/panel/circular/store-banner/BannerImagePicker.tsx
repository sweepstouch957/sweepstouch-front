'use client';

/** Imagen del banner: clic o arrastrar. Muestra la elegida en el mismo marco 3:1. */
import { cloudinaryThumb } from '@/utils/cloudinary';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { bannerFrame } from './utils';

export default function BannerImagePicker({
  value,
  uploading,
  onFile,
}: {
  value: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
      <Box
        component="button"
        type="button"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith('image/'));
          if (f) onFile(f);
        }}
        sx={{
          ...bannerFrame,
          cursor: 'pointer',
          borderStyle: value ? 'solid' : 'dashed',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'transparent',
          color: 'inherit',
          font: 'inherit',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryThumb(value, 900, 300, 'fill')}
            alt=""
            decoding="async"
          />
        ) : (
          <Stack
            alignItems="center"
            gap={0.5}
            sx={{ color: 'text.secondary', px: 2 }}
          >
            <CloudUploadOutlinedIcon />
            <Typography
              variant="body2"
              fontWeight={600}
            >
              {uploading ? 'Subiendo…' : 'Sube o arrastra la imagen'}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: 12.5 }}
            >
              Apaisada 3:1 (ej. 2172×724)
            </Typography>
          </Stack>
        )}
      </Box>
      {uploading && <LinearProgress sx={{ borderRadius: 1 }} />}
    </>
  );
}
