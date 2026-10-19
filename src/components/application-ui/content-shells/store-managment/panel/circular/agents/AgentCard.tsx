'use client';

/**
 * Bloque de la pestaña Agentes IA sobre el lenguaje del Store Panel 2.0: PanelCard +
 * SectionHeader, con el número de paso como ícono y la explicación arriba del contenido (en
 * la cabecera no entra un párrafo sin desbordar en el teléfono).
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { alpha, Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function StepBadge({ step }: { step: ReactNode }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 24,
        height: 24,
        flexShrink: 0,
        borderRadius: 1.5,
        display: 'grid',
        placeItems: 'center',
        fontSize: 12,
        fontWeight: 800,
        color: 'primary.main',
        bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.16 : 0.1),
      }}
    >
      {step}
    </Box>
  );
}

export default function AgentCard({
  step,
  title,
  count,
  description,
  action,
  children,
}: {
  step: number;
  title: string;
  count?: number;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <PanelCard>
      <SectionHeader
        icon={<StepBadge step={step} />}
        title={title}
        count={count}
        action={action}
      />
      <Box sx={{ px: { xs: 2, md: 2.25 }, py: 2 }}>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 820 }}
          >
            {description}
          </Typography>
        )}
        {children && <Box sx={{ mt: description ? 1.75 : 0 }}>{children}</Box>}
      </Box>
    </PanelCard>
  );
}

/** Línea apagada para "todavía no hay nada": dice qué pasa, nunca un guion suelto. */
export function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
    >
      {children}
    </Typography>
  );
}
