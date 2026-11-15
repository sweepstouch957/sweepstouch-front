'use client';

import { NSA_ROLE_LABEL, sweepstakesClient } from '@/services/sweepstakes.service';
import {
  alpha,
  Box,
  Card,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';

/* ── Tabla de registros ───────────────────────────────────────────────────────
   Reusa el endpoint de export (mismos rows que el CSV), así tabla y CSV nunca
   se desincronizan. La columna Rol solo aparece si el sweepstake es optinType 'nsa'.
   ponytail: trae todo el rango y pagina en cliente — ok a la escala actual;
   si un sorteo crece a decenas de miles, meter paginación server-side al endpoint. */
export function ParticipantRecordsTable({
  sweepstakeId,
  startDate,
  endDate,
}: {
  sweepstakeId: string;
  startDate: string;
  endDate: string;
}) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['sweepstake-participant-records', sweepstakeId, startDate, endDate],
    queryFn: () => sweepstakesClient.exportParticipants({ sweepstakeId, startDate, endDate }),
    enabled: Boolean(sweepstakeId),
  });

  const rows = data?.rows ?? [];
  const isNsa = Boolean(data?.isNsa);
  const paged = rows.slice(page * limit, page * limit + limit);

  return (
    <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography fontWeight={800}>Registros</Typography>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {isLoading ? 'Cargando…' : `${rows.length} participantes · ${startDate} → ${endDate}`}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Método</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tipo</TableCell>
              {isNsa && (
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Rol</TableCell>
              )}
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Cupón</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={isNsa ? 7 : 6}>
                    <Skeleton
                      variant="text"
                      height={28}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isNsa ? 7 : 6}>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    textAlign="center"
                    py={3}
                  >
                    Sin registros en este rango
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r, i) => (
                <TableRow
                  key={`${r.phone}-${r.registeredAt}`}
                  hover
                >
                  <TableCell>{page * limit + i + 1}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.phone}</TableCell>
                  <TableCell>{r.method}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.isNewUser ? 'Nuevo' : 'Existente'}
                      color={r.isNewUser ? 'success' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  {isNsa && (
                    <TableCell>
                      {r.nsaRole ? (
                        <Chip
                          size="small"
                          label={NSA_ROLE_LABEL[r.nsaRole]}
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(
                              r.nsaRole === 'owner_manager'
                                ? theme.palette.warning.main
                                : theme.palette.info.main,
                              0.14
                            ),
                            color:
                              r.nsaRole === 'owner_manager'
                                ? theme.palette.warning.dark
                                : theme.palette.info.dark,
                          }}
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                        >
                          Sin responder
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{r.coupon ?? 'N/A'}</TableCell>
                  <TableCell>
                    {r.registeredAt ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm') : ''}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > 0 && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Card>
  );
}
