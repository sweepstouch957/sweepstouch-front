'use client';

/**
 * Zona para soltar el PDF del circular. Varios archivos = páginas (página 1, página 2…): se
 * ordenan por nombre (natural) y se suben como un solo circular. Un archivo solo sigue por la
 * subida de siempre.
 */
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { alpha, Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { mb, sortFilesByName } from './utils';

export default function PdfDropzone({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const file = files[0] ?? null;
  const many = files.length > 1;

  const addFiles = (list: FileList | File[] | null | undefined) => {
    const arr = Array.from(list || []);
    if (arr.length) onChange(sortFilesByName([...files, ...arr]));
  };

  const title = many
    ? `${files.length} archivos (páginas), en este orden:`
    : file
      ? file.name
      : 'Arrastra el PDF del circular (o sus páginas sueltas), o haz clic';
  const hint = many
    ? `${mb(files.reduce((n, f) => n + f.size, 0))} en total · se leen en este orden como un solo circular`
    : file
      ? `${mb(file.size)} · la IA extrae los productos al agendar`
      : 'El circular siempre es PDF. Si te lo mandan por páginas, suéltalas todas juntas. Las fotos del cliente van abajo, como referencia.';

  return (
    <>
      <Box
        component="label"
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          cursor: 'pointer',
          border: '1.5px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: (t) => (dragOver ? alpha(t.palette.primary.main, 0.04) : 'transparent'),
          transition: 'border-color .15s, background-color .15s',
          '&:hover': { borderColor: 'primary.main' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <CloudUploadOutlinedIcon color={file ? 'primary' : 'disabled'} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 12.5 }}
          >
            {hint}
          </Typography>
        </Box>
        {file && (
          <IconButton
            size="small"
            aria-label="Quitar archivo"
            onClick={(e) => {
              e.preventDefault();
              onChange([]);
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <input
          hidden
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </Box>
      {many && (
        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
        >
          {files.map((f, i) => (
            <Chip
              key={f.name + i}
              size="small"
              variant="outlined"
              label={`${i + 1} · ${f.name} (${mb(f.size)})`}
              onDelete={() => onChange(files.filter((x) => x.name !== f.name))}
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Stack>
      )}
    </>
  );
}
