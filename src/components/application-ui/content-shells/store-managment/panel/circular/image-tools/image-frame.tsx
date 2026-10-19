'use client';

import { Box, type BoxProps } from '@mui/material';
import type { ReactNode } from 'react';
import { checkerSx } from './constants';

/** Marco con cuadriculado de transparencia: muestra la imagen entera o un contenido vacío. */
export function ImageFrame({
  src,
  height,
  dashed = false,
  empty,
  ...rest
}: {
  src?: string;
  height: number;
  dashed?: boolean;
  empty: ReactNode;
} & Omit<BoxProps, 'children'>) {
  return (
    <Box
      {...rest}
      sx={[
        (t) => checkerSx(t),
        {
          height,
          borderRadius: 2,
          border: '1px solid',
          borderStyle: dashed ? 'dashed' : 'solid',
          borderColor: 'divider',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          p: 1,
        },
      ]}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      ) : (
        empty
      )}
    </Box>
  );
}
