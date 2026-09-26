'use client';

/**
 * Arte de la campaña: arrastrar y soltar, clic o pegar (Ctrl+V). Acepta hasta 100 MB: al
 * guardar se sube el original (para leer productos y sacar el banner) y una copia de menos
 * de 500 KB para el MMS (uploadCampaignArt). Acá sólo se elige y se muestra qué va a pasar.
 * Diseño plano, sin degradados.
 */
import { CAMPAIGN_ART_MAX_BYTES, MMS_MAX_BYTES } from '@/services/upload.service';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CompressRoundedIcon from '@mui/icons-material/CompressRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import ArtConversionSummary from './ArtConversionSummary';
import type { ArtUploadState } from './useCampaignArtUpload';

const ACCEPT = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] };

const fmtSize = (b: number) =>
  b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

export default function CampaignArtDropzone({
  file,
  initialUrl,
  onChange,
  onError,
  allowRemoveInitial = true,
  upload,
  onRetry,
}: {
  /** Archivo elegido ahora (null = ninguno nuevo). */
  file: File | null;
  /** Arte guardado de la campaña (al editar). */
  initialUrl?: string;
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
  /** false = el arte guardado no se puede quitar (campaña rápida: sin archivo nuevo se reusa). */
  allowRemoveInitial?: boolean;
  /** Estado de la subida/compresión en vivo (useCampaignArtUpload): muestra el resumen. */
  upload?: ArtUploadState;
  onRetry?: () => void;
}) {
  const [preview, setPreview] = useState<string>('');
  // Ver la copia que viaja en el MMS (la de Cloudinary) en vez del archivo local.
  const [viewMms, setViewMms] = useState(false);
  const mmsUrl = upload?.status === 'done' && upload.result.compressed ? upload.result.url : '';
  useEffect(() => setViewMms(false), [file]);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  // Al quitar el arte guardado ya no se vuelve a mostrar el de antes.
  const [keepInitial, setKeepInitial] = useState(true);

  useEffect(() => {
    if (!file) {
      setPreview(keepInitial ? initialUrl || '' : '');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, initialUrl, keepInitial]);

  const take = (f: File) => {
    setDims(null);
    onChange(f);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: CAMPAIGN_ART_MAX_BYTES,
    multiple: false,
    noClick: !!preview, // con imagen, el clic no reabre: hay botón "Cambiar"
    onDropAccepted: (files) => files[0] && take(files[0]),
    onDropRejected: (rej: FileRejection[]) => {
      const code = rej[0]?.errors[0]?.code;
      onError(
        code === 'file-too-large'
          ? 'La imagen supera los 100 MB.'
          : code === 'file-invalid-type'
            ? 'Sólo JPG o PNG: son los que se ven bien en todos los teléfonos.'
            : 'No se pudo usar ese archivo.'
      );
    },
  });

  // Ctrl+V con una imagen en el portapapeles (fuera de un campo de texto).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const item = Array.from(e.clipboardData?.items || []).find((i) =>
        /^image\/(png|jpe?g)$/.test(i.type)
      );
      const f = item?.getAsFile();
      if (!f) return;
      e.preventDefault();
      take(new File([f], `pegado.${f.type === 'image/png' ? 'png' : 'jpg'}`, { type: f.type }));
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heavy = !!file && file.size > MMS_MAX_BYTES;

  return (
    <Box
      {...getRootProps()}
      sx={{
        position: 'relative',
        borderRadius: 3,
        border: '1.5px dashed',
        borderColor: isDragActive ? 'primary.main' : preview ? 'divider' : 'grey.300',
        borderStyle: preview && !isDragActive ? 'solid' : 'dashed',
        bgcolor: (t) => (isDragActive ? alpha(t.palette.primary.main, 0.05) : 'background.paper'),
        transition: 'border-color .15s, background-color .15s',
        outline: 'none',
        '&:focus-visible': {
          borderColor: 'primary.main',
          boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.2)}`,
        },
        ...(!preview && { cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }),
      }}
    >
      <input {...getInputProps()} />

      {!preview ? (
        // ── Vacío
        <Stack
          alignItems="center"
          justifyContent="center"
          gap={1.25}
          sx={{ py: { xs: 4, sm: 5 }, px: 2, textAlign: 'center' }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
            }}
          >
            <CloudUploadOutlinedIcon />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
            >
              {isDragActive ? 'Suelta el arte aquí' : 'Arrastra el arte de la campaña'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              o{' '}
              <Box
                component="span"
                sx={{ color: 'primary.main', fontWeight: 700 }}
              >
                haz clic para elegirlo
              </Box>{' '}
              · también puedes pegarlo con Ctrl+V
            </Typography>
          </Box>
          <Stack
            direction="row"
            gap={0.75}
            flexWrap="wrap"
            justifyContent="center"
          >
            <Chip
              size="small"
              variant="outlined"
              label="JPG o PNG"
            />
            <Chip
              size="small"
              variant="outlined"
              label="Hasta 100 MB"
            />
            <Chip
              size="small"
              variant="outlined"
              icon={<CompressRoundedIcon />}
              label="Se comprime sola para el MMS"
            />
          </Stack>
        </Stack>
      ) : (
        // ── Con imagen
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={2.5}
          sx={{ p: 2 }}
        >
          <Box
            sx={{
              width: { xs: '100%', sm: 180 },
              height: { xs: 240, sm: 220 },
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'grey.100',
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewMms && mmsUrl ? mmsUrl : preview}
              alt={viewMms ? 'Copia MMS del arte' : 'Arte de la campaña'}
              onLoad={(e) =>
                !viewMms &&
                setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {mmsUrl && (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={viewMms ? 'mms' : 'orig'}
                onChange={(e, v) => {
                  e.stopPropagation();
                  if (v) setViewMms(v === 'mms');
                }}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'background.paper',
                  '& .MuiToggleButton-root': {
                    px: 1.25,
                    py: 0.25,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'none',
                  },
                }}
              >
                <ToggleButton value="orig">Original</ToggleButton>
                <ToggleButton value="mms">MMS</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          <Stack
            sx={{ flex: 1, minWidth: 0 }}
            gap={1.25}
          >
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                noWrap
                title={file?.name}
              >
                {file ? file.name : 'Arte guardado'}
              </Typography>
              {(!upload || upload.status === 'idle') && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {[file ? fmtSize(file.size) : '', dims ? `${dims.w}×${dims.h}` : '']
                    .filter(Boolean)
                    .join(' · ') || 'Imagen actual de la campaña'}
                </Typography>
              )}
            </Box>

            {/* Con la subida en vivo: resumen real original → MMS. Sin ella (arte guardado):
                qué va a pasar al guardar. */}
            {upload && upload.status !== 'idle' ? (
              <ArtConversionSummary
                state={upload}
                onRetry={onRetry ?? (() => undefined)}
              />
            ) : (
              <Stack gap={0.75}>
                {file && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={1}
                    sx={{ color: heavy ? 'info.main' : 'success.main' }}
                  >
                    {heavy ? (
                      <CompressRoundedIcon fontSize="small" />
                    ) : (
                      <CheckCircleOutlineRoundedIcon fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color="text.primary"
                    >
                      {heavy
                        ? 'Al guardar se crea una copia de menos de 500 KB para el MMS'
                        : 'Ya pesa menos de 500 KB: viaja tal cual en el MMS'}
                    </Typography>
                  </Stack>
                )}
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{ color: 'primary.main' }}
                >
                  <AutoAwesomeOutlinedIcon fontSize="small" />
                  <Typography
                    variant="body2"
                    color="text.primary"
                  >
                    Al agendar, la IA carga sus productos y el banner a la lista de la tienda
                  </Typography>
                </Stack>
              </Stack>
            )}

            <Stack
              direction="row"
              gap={1}
              sx={{ mt: 'auto', pt: 0.5 }}
              flexWrap="wrap"
            >
              <Button
                variant="outlined"
                startIcon={<SwapHorizRoundedIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
              >
                Cambiar
              </Button>
              {(file || allowRemoveInitial) && (
                <Button
                  color="inherit"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Quitar el archivo nuevo vuelve al guardado; quitar el guardado deja sin arte.
                    if (!file) setKeepInitial(false);
                    setDims(null);
                    onChange(null);
                  }}
                >
                  {file && initialUrl && keepInitial ? 'Volver al anterior' : 'Quitar'}
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      )}

      {/* Soltar encima de una imagen ya elegida: aviso de que la reemplaza. */}
      {preview && isDragActive && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            bgcolor: (t) => alpha(t.palette.background.paper, 0.9),
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="primary.main"
          >
            Suelta para reemplazar el arte
          </Typography>
        </Box>
      )}
    </Box>
  );
}
