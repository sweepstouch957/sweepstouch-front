'use client';

import AttachFileTwoToneIcon from '@mui/icons-material/AttachFileTwoTone';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import React, { useRef, useState } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { uploadSupportEvidence } from 'src/services/upload.service';
import { isImageUrl } from './ticket-utils';
import { FormState } from './types';

/** Evidencias: el archivo va al servicio de upload; en el form sólo viven las URLs. */
export function EvidenceField({
  control,
  setValue,
}: {
  control: Control<FormState>;
  setValue: UseFormSetValue<FormState>;
}) {
  const evidenceUrls = useWatch({ control, name: 'evidenceUrls' }) ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadSupportEvidence));
      setValue('evidenceUrls', [...evidenceUrls, ...urls]);
    } catch {
      setError('Error al subir archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeEvidence = (idx: number) =>
    setValue(
      'evidenceUrls',
      evidenceUrls.filter((_, i) => i !== idx)
    );

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        mb={1.5}
      >
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            Evidencia{' '}
            {evidenceUrls.length > 0 &&
              `(${evidenceUrls.length} archivo${evidenceUrls.length !== 1 ? 's' : ''})`}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Fotos, capturas de pantalla o PDFs relacionados al ticket
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={14} /> : <AttachFileTwoToneIcon />}
          disabled={uploading}
          component="label"
          sx={{ flexShrink: 0 }}
        >
          {uploading ? 'Subiendo...' : 'Agregar'}
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleUpload}
          />
        </Button>
      </Stack>

      {error && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          mb={1.5}
        >
          {error}
        </Typography>
      )}

      {evidenceUrls.length > 0 ? (
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
        >
          {evidenceUrls.map((url, i) => (
            <Box
              key={url}
              sx={{ position: 'relative' }}
            >
              {isImageUrl(url) ? (
                <Box
                  component="img"
                  src={url}
                  alt={`evidencia-${i + 1}`}
                  onClick={() => window.open(url, '_blank')}
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1.5px solid',
                    borderColor: 'divider',
                    display: 'block',
                    cursor: 'pointer',
                    transition: 'opacity .15s',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
              ) : (
                <Box
                  onClick={() => window.open(url, '_blank')}
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 1,
                    border: '1.5px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    bgcolor: 'action.hover',
                    gap: 0.5,
                    transition: 'background .15s',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <AttachFileTwoToneIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: 9,
                      textAlign: 'center',
                      px: 0.5,
                      lineHeight: 1.2,
                      wordBreak: 'break-all',
                    }}
                  >
                    {url.split('/').pop()?.slice(-14) ?? 'Archivo'}
                  </Typography>
                </Box>
              )}
              <IconButton
                size="small"
                onClick={() => removeEvidence(i)}
                sx={{
                  position: 'absolute',
                  top: -7,
                  right: -7,
                  width: 18,
                  height: 18,
                  bgcolor: 'error.main',
                  color: 'common.white',
                  border: '1.5px solid white',
                  '&:hover': { bgcolor: 'error.dark' },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 10 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            border: '1.5px dashed',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2.5,
            textAlign: 'center',
            color: 'text.disabled',
          }}
        >
          <AttachFileTwoToneIcon sx={{ fontSize: 30, mb: 0.5 }} />
          <Typography
            variant="caption"
            display="block"
          >
            Sin archivos adjuntos. Agrega fotos, capturas o PDFs como evidencia del problema.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
