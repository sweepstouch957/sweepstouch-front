'use client';

/**
 * Los tres estados que toda lista necesita y casi ninguna tenía: cargando (esqueleto,
 * no spinner), error (con "Reintentar", no una tabla vacía que parece verdad) y vacío
 * (qué hacer ahora). Envuelve la tabla o lista:
 *
 *   <DataState loading={q.isLoading} error={q.isError} onRetry={q.refetch}
 *              empty={!rows.length} emptyTitle="Sin facturas" emptyHint="Crea la primera.">
 *     <Table>…</Table>
 *   </DataState>
 */
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import { Box, Button, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { tint } from 'src/theme/semantic';

type Props = {
  loading?: boolean;
  /** true o el mensaje a mostrar. */
  error?: boolean | string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  /** Botón del estado vacío (ej. "Nueva campaña"). */
  emptyAction?: ReactNode;
  /** Filas del esqueleto. */
  rows?: number;
  children: ReactNode;
};

function Block({
  icon,
  role,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  role: 'error' | 'primary';
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Stack
      alignItems="center"
      textAlign="center"
      gap={1}
      sx={{ px: 2, py: 5 }}
      role={role === 'error' ? 'alert' : undefined}
    >
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: tint(theme, role),
          color: `${role}.main`,
          mb: 0.5,
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={700}>{title}</Typography>
      {hint && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, textWrap: 'balance' }}
        >
          {hint}
        </Typography>
      )}
      {action && <Box mt={1}>{action}</Box>}
    </Stack>
  );
}

export default function DataState({
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = 'Nada por aquí todavía',
  emptyHint,
  emptyAction,
  rows = 6,
  children,
}: Props) {
  if (loading)
    return (
      <Stack
        aria-busy
        aria-label="Cargando"
        sx={{ px: 2, py: 1 }}
      >
        {Array.from({ length: rows }, (_, i) => (
          <Stack
            key={i}
            direction="row"
            alignItems="center"
            gap={2}
            sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Skeleton
              variant="rounded"
              width={36}
              height={36}
              sx={{ flexShrink: 0 }}
            />
            <Box flex={1}>
              <Skeleton
                width={`${45 - (i % 3) * 8}%`}
                height={16}
              />
              <Skeleton
                width={`${28 - (i % 2) * 6}%`}
                height={12}
              />
            </Box>
            <Skeleton
              width={64}
              height={22}
            />
          </Stack>
        ))}
      </Stack>
    );

  if (error)
    return (
      <Block
        role="error"
        icon={<CloudOffRoundedIcon />}
        title="No se pudo cargar"
        hint={
          typeof error === 'string'
            ? error
            : 'Puede ser la conexión o el servidor. Lo que ves no es que esté vacío.'
        }
        action={
          onRetry && (
            <Button
              variant="outlined"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          )
        }
      />
    );

  if (empty)
    return (
      <Block
        role="primary"
        icon={<InboxRoundedIcon />}
        title={emptyTitle}
        hint={emptyHint}
        action={emptyAction}
      />
    );

  return <>{children}</>;
}
