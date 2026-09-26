'use client';

/**
 * Piezas de layout del tab Circular & Listas: todas las secciones se leen igual
 * (número de paso + título + una línea de ayuda + acciones a la derecha).
 * Colores planos del tema, sin degradados. Los textos de ayuda van en body2: el
 * `caption` del tema es MAYÚSCULAS y en párrafos largos no se lee.
 */
import { alpha, Box, Paper, Stack, Typography, type PaperProps } from '@mui/material';
import type { ReactNode } from 'react';

export function SectionHeader({
  step,
  title,
  description,
  action,
}: {
  step: number | string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      gap={1.5}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        gap={1.5}
        sx={{ minWidth: 0 }}
      >
        <Box
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            mt: 0.25,
            flexShrink: 0,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: 'primary.main',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          }}
        >
          {step}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            lineHeight={1.3}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {action && (
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
          sx={{ flexShrink: 0 }}
        >
          {action}
        </Stack>
      )}
    </Stack>
  );
}

/** Tarjeta base: borde fino, radio grande, fondo plano. */
export function Surface({ sx, children, ...rest }: PaperProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, ...sx }}
      {...rest}
    >
      {children}
    </Paper>
  );
}

/** Dato corto con ícono: "📅 20 sept → 27 sept", "📦 40 productos". */
export function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{
        color: 'text.secondary',
        '& svg': { fontSize: 16 },
        fontSize: 13.5,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      <span>{children}</span>
    </Stack>
  );
}

/** Rótulo chico de subsección (sin mayúsculas forzadas). */
export function Label({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="body2"
      fontWeight={700}
      color="text.secondary"
      sx={{ mb: 1 }}
    >
      {children}
    </Typography>
  );
}
