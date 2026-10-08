'use client';

import type { Movement, PageResult } from '@/services/material-control.service';
import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
  StatusPill,
} from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import { useMaterials } from './materials-context';
import { getErrorMessage, typeLabels } from './materials-utils';

export const grid2 = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
};
export const grid3 = {
  ...grid2,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(3, minmax(0, 1fr))',
  },
};
export const rowLayout = { display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' };
export function Section({
  title,
  hint,
  icon,
  action,
  children,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PanelCard>
      <SectionHeader
        title={title}
        hint={hint}
        icon={icon}
        action={action}
      />
      <Box sx={{ p: 2 }}>{children}</Box>
    </PanelCard>
  );
}
export function QueryFeedback({
  pending,
  error,
  children,
}: {
  pending: boolean;
  error: unknown;
  children: ReactNode;
}) {
  if (pending)
    return (
      <Stack
        alignItems="center"
        sx={{ py: 3 }}
      >
        <CircularProgress
          size={24}
          aria-label="Cargando materiales"
        />
      </Stack>
    );
  if (error) return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  return <>{children}</>;
}
export function PageControls({
  result,
  page,
  onChange,
}: {
  result?: PageResult<unknown>;
  page: number;
  onChange: (page: number) => void;
}) {
  if (!result) return null;
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ mt: 2 }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {result.docs.length} de {result.total} registros · Página {result.page}
      </Typography>
      {result.total > result.limit && (
        <Pagination
          count={Math.ceil(result.total / result.limit)}
          page={page}
          onChange={(_, value) => onChange(value)}
          color="primary"
        />
      )}
    </Stack>
  );
}
export function useDebouncedValue(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}
export function MovementTable({
  rows,
  action,
}: {
  rows: Movement[];
  action?: (row: Movement) => ReactNode;
}) {
  const { materials, stores } = useMaterials();
  if (!rows.length)
    return (
      <EmptyBlock
        title="Sin movimientos"
        hint="Registra un movimiento o ajusta los filtros para ver resultados."
      />
    );
  return (
    <TableContainer>
      <Table
        size="small"
        aria-label="Movimientos de materiales"
      >
        <TableHead>
          <TableRow>
            {['Fecha', 'Tipo', 'Tienda', 'Materiales', 'Motivo', 'Responsable', 'Registró'].map(
              (label) => (
                <TableCell key={label}>{label}</TableCell>
              )
            )}
            {action && <TableCell>Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.fecha}</TableCell>
              <TableCell>
                <StatusPill
                  label={typeLabels[row.tipo]}
                  tone={
                    row.tipo === 'entrada' ? 'success' : row.tipo === 'retiro' ? 'warning' : 'info'
                  }
                />
              </TableCell>
              <TableCell>
                {row.tipo === 'entrada'
                  ? 'Bodega'
                  : stores.find((store) => store.id === row.tiendaId)?.nombre ||
                    'Tienda no disponible'}
              </TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  {row.items.map((item, index) => (
                    <Box key={`${item.m}-${index}`}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {item.q}{' '}
                        {materials.find((material) => material.id === item.m)?.nombre || item.m}
                        {item.cond ? ` (${item.cond === 'danado' ? 'dañado' : 'buen estado'})` : ''}
                      </Typography>
                      {item.series?.length > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {item.series
                            .map(
                              (serial) =>
                                serial.v + (serial.iccid ? ` · ICCID ${serial.iccid}` : '')
                            )
                            .join(', ')}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {row.nota && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {row.nota}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>{row.motivo}</TableCell>
              <TableCell>{row.responsable}</TableCell>
              <TableCell>{row.creadoPor || 'Autor no disponible'}</TableCell>
              {action && <TableCell>{action(row)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
