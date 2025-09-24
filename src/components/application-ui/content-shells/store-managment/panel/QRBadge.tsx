'use client';
import * as React from 'react';
import Link from 'next/link';
import { Box } from '@mui/material';

type QRBadgeProps = {
  href: string;        // URL externa (sweepstakes)
  src?: string;        // URL de la imagen del QR (opcional)
  alt?: string;        // Texto alternativo
  size?: number;       // Tamaño del recuadro px
};

export default function QRBadge({
  href,
  src,
  alt = 'QR',
  size = 40,
}: QRBadgeProps) {
  return (
    <Box
      component={Link}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir sorteo (QR)"
      sx={{
        ml: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        boxShadow: 0,
        '&:hover': { transform: 'translateY(-1px)', boxShadow: 2 },
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            fontSize: 10,
            color: 'text.secondary',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'background.default',
          }}
        >
          QR
        </Box>
      )}
    </Box>
  );
}
