'use client';

/**
 * Primitivas visuales del dashboard de audiencia.
 *
 * Antes cada tarjeta pintaba su propio `radial-gradient` de 1200px y usaba
 * `fontWeight: 950/1000`. El degradado no aportaba dato y ensuciaba el fondo
 * detrás de las gráficas; los pesos inventados no existen en la escala del
 * theme y se renderizaban como 900 igual. Acá queda una sola superficie: card
 * outlined, plana, y la jerarquía la dan tamaño y espacio, no efectos.
 */
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import React from 'react';
import { tint, tintBorder, toneText, type SemanticRole } from 'src/theme/semantic';

/** Cifras en tabular: los anchos no bailan al refrescar. */
export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

export function TonePill(props: { label: string; tone?: SemanticRole; icon?: React.ReactNode }) {
  const { label, tone = 'primary', icon } = props;
  return (
    <Chip
      size="small"
      icon={
        icon ? <Box sx={{ display: 'flex', color: 'inherit !important' }}>{icon}</Box> : undefined
      }
      label={label}
      sx={(t) => ({
        fontWeight: 600,
        ...numeric,
        bgcolor: tint(t, tone),
        color: toneText(t, tone),
        border: `1px solid ${tintBorder(t, tone, 0.2)}`,
      })}
    />
  );
}

/** Tile de icono. Un solo tamaño en toda la página. */
export function IconTile(props: { tone?: SemanticRole; children: React.ReactNode }) {
  const { tone = 'primary', children } = props;
  return (
    <Box
      sx={(t) => ({
        width: 36,
        height: 36,
        borderRadius: 1.5,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        bgcolor: tint(t, tone),
        color: toneText(t, tone),
      })}
    >
      {children}
    </Box>
  );
}

export function SectionHeader(props: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: SemanticRole;
  right?: React.ReactNode;
}) {
  const { title, subtitle, icon, tone, right } = props;
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      gap={1.5}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
        minWidth={0}
      >
        {icon ? <IconTile tone={tone}>{icon}</IconTile> : null}
        <Box minWidth={0}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            lineHeight={1.25}
            noWrap
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {right}
    </Stack>
  );
}

/**
 * Superficie base de la página. Plana y outlined: la separación la da el borde,
 * no una sombra. `padded={false}` para bloques que manejan su propio padding.
 */
export function PanelCard(props: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: SemanticRole;
  right?: React.ReactNode;
  children: React.ReactNode;
  sx?: any;
}) {
  const { title, subtitle, icon, tone, right, children, sx } = props;
  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', boxShadow: 'none', ...sx }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {title || right ? (
          <Box sx={{ mb: 2 }}>
            <SectionHeader
              title={title}
              subtitle={subtitle}
              icon={icon}
              tone={tone}
              right={right}
            />
          </Box>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
