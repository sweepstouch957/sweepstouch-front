'use client';

/** Columna de la imagen en el editor de producto: vista previa + herramientas. */
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import CropRoundedIcon from '@mui/icons-material/CropRounded';
import LayersClearOutlinedIcon from '@mui/icons-material/LayersClearOutlined';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ProductFormValues } from './constants';
import { ImageFrame } from './image-frame';

/** "Generar IA" necesita el nombre: lo observa sólo este botón, no todo el editor. */
function GenerateButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  const { control } = useFormContext<ProductFormValues>();
  const name = useWatch({ control, name: 'name' });
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<AutoAwesomeOutlinedIcon />}
      disabled={busy || !name.trim()}
      onClick={onClick}
    >
      Generar IA
    </Button>
  );
}

export function ImageWorkbench({
  imageUrl,
  busy,
  canCropCircular,
  canCropCampaign,
  canRescan,
  onFile,
  onCropCircular,
  onCropCampaign,
  onRemoveBg,
  onRescan,
  onGenerate,
  onClear,
}: {
  imageUrl: string;
  /** Texto de lo que se está haciendo, o null. */
  busy: string | null;
  canCropCircular: boolean;
  canCropCampaign: boolean;
  canRescan: boolean;
  onFile: (f: File) => void;
  onCropCircular: () => void;
  onCropCampaign: () => void;
  onRemoveBg: () => void;
  onRescan: () => void;
  onGenerate: () => void;
  onClear: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const isBusy = !!busy;

  return (
    <Box sx={{ width: { xs: '100%', sm: 250 }, flexShrink: 0 }}>
      <ImageFrame
        src={imageUrl}
        height={230}
        dashed
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith('image/'));
          if (f) onFile(f);
        }}
        empty={
          <Stack
            alignItems="center"
            gap={0.5}
            sx={{ color: 'text.secondary', textAlign: 'center', px: 2 }}
          >
            <ContentPasteRoundedIcon />
            <Typography variant="body2">Pegá (Ctrl+V), soltá o subí una imagen</Typography>
          </Stack>
        }
      />
      {isBusy && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.5, minHeight: 20, fontSize: 12.5 }}
      >
        {busy || (imageUrl ? 'El cuadriculado indica transparencia.' : '')}
      </Typography>

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
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudUploadOutlinedIcon />}
          disabled={isBusy}
          onClick={() => fileInput.current?.click()}
        >
          Subir
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CropRoundedIcon />}
          disabled={isBusy || !canCropCircular}
          onClick={onCropCircular}
        >
          Recortar circular
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CropRoundedIcon />}
          disabled={isBusy || !canCropCampaign}
          onClick={onCropCampaign}
        >
          Recortar flyer
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<LayersClearOutlinedIcon />}
          disabled={isBusy || !imageUrl}
          onClick={onRemoveBg}
        >
          Quitar fondo
        </Button>
        {canRescan && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<CropRoundedIcon />}
            disabled={isBusy}
            onClick={onRescan}
          >
            Rescanear foto
          </Button>
        )}
        <GenerateButton
          busy={isBusy}
          onClick={onGenerate}
        />
      </Box>
      {imageUrl && (
        <Button
          size="small"
          color="inherit"
          disabled={isBusy}
          onClick={onClear}
          sx={{ mt: 0.5, color: 'text.secondary' }}
        >
          Quitar imagen
        </Button>
      )}
    </Box>
  );
}
