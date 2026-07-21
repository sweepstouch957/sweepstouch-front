'use client';

import { Box, Card, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { tint, type SemanticRole } from 'src/theme/semantic';

interface SectionCardProps {
  /** Icono del encabezado. Se pinta con el rol semántico, no con un color fijo. */
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Acción a la derecha del encabezado (botón, chip, filtro...). */
  action?: ReactNode;
  role?: SemanticRole;
  children: ReactNode;
  /** Quita el padding del cuerpo — para tablas que van pegadas al borde. */
  disableBodyPadding?: boolean;
}

/**
 * Card con encabezado — el patrón más repetido del panel (estaba copiado a mano
 * en cada página con estilos distintos).
 *
 * Radio, borde y ausencia de sombra vienen del theme (`MuiCard`), no se
 * hardcodean acá.
 */
export default function SectionCard({
  icon,
  title,
  subtitle,
  action,
  role = 'primary',
  children,
  disableBodyPadding = false,
}: SectionCardProps) {
  const theme = useTheme();

  return (
    <Card>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          {icon && (
            <Box
              aria-hidden
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                bgcolor: tint(theme, role),
                color: `${role}.main`,
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action}
      </Stack>

      <Box sx={disableBodyPadding ? undefined : { p: 2.5 }}>{children}</Box>
    </Card>
  );
}
