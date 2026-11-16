'use client';

/**
 * Todos los clientes que armaron listas en la tienda, con nombre y teléfono reales. Cada
 * fila se abre y muestra qué productos puso en sus listas. Buscador por nombre/teléfono.
 */
import type { ListCustomer } from '@/services/shopping-lists.service';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Fragment, useMemo, useState } from 'react';
import { displayName, formatPhone } from './people';

const PREVIEW = 15;
const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es') : '—');

export default function ListCustomersTable({ customers }: { customers: ListCustomer[] }) {
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    if (!t) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.email.toLowerCase().includes(t) ||
        (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits))
    );
  }, [customers, q]);
  const rows = showAll || q ? filtered : filtered.slice(0, PREVIEW);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, mb: 2.5, overflowX: 'auto' }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 1 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Clientes que han hecho listas
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            {customers.length} clientes · abre una fila para ver sus productos
          </Typography>
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar nombre o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: { xs: '100%', sm: 240 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 17 }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cell, width: 36 }} />
            <TableCell sx={cell}>Cliente</TableCell>
            <TableCell sx={cell}>Teléfono</TableCell>
            <TableCell
              sx={cell}
              align="right"
            >
              Listas
            </TableCell>
            <TableCell
              sx={cell}
              align="right"
            >
              Validadas
            </TableCell>
            <TableCell
              sx={cell}
              align="right"
            >
              Productos
            </TableCell>
            <TableCell
              sx={cell}
              align="right"
            >
              Puntos
            </TableCell>
            <TableCell
              sx={cell}
              align="right"
            >
              Ahorro est.
            </TableCell>
            <TableCell sx={cell}>Última lista</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((c) => {
            const isOpen = open === c.customerId;
            return (
              <Fragment key={c.customerId}>
                <TableRow
                  hover
                  onClick={() => setOpen(isOpen ? null : c.customerId)}
                  sx={{
                    cursor: 'pointer',
                    '& > td': { borderBottom: isOpen ? 'none' : undefined },
                  }}
                >
                  <TableCell sx={cell}>
                    <IconButton
                      size="small"
                      aria-label={isOpen ? 'Cerrar productos' : 'Ver productos'}
                    >
                      <KeyboardArrowDownRoundedIcon
                        sx={{
                          fontSize: 18,
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform .2s',
                        }}
                      />
                    </IconButton>
                  </TableCell>
                  <TableCell sx={cell}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      {displayName(c.name, c.phone)}
                    </Typography>
                    {c.email && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {c.email}
                      </Typography>
                    )}
                    {!c.inDatabase && (
                      <Chip
                        size="small"
                        label="fuera de la base"
                        sx={{ height: 18, fontSize: 11, ml: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={cell}>{formatPhone(c.phone) || '—'}</TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {c.lists}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {c.validated}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {c.items}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {Math.round(c.points)}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {c.savings ? usd.format(c.savings) : '—'}
                  </TableCell>
                  <TableCell sx={cell}>{day(c.lastAt)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={9}
                    sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}
                  >
                    <Collapse
                      in={isOpen}
                      unmountOnExit
                    >
                      <Box sx={{ py: 1.25, pl: 5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.75 }}
                        >
                          Primera lista {day(c.firstAt)} · {c.products.length} productos distintos
                        </Typography>
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.75}
                        >
                          {c.products.map((p) => (
                            <Chip
                              key={p.name}
                              size="small"
                              variant="outlined"
                              label={`${p.name} · ${p.quantity} u${
                                p.lists > 1 ? ` · ${p.lists} listas` : ''
                              }`}
                              sx={{ height: 24, fontSize: 12 }}
                            />
                          ))}
                          {!c.products.length && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sus listas no tienen productos.
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
          {!rows.length && (
            <TableRow>
              <TableCell
                colSpan={9}
                sx={{ py: 3, textAlign: 'center' }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {q ? 'Ningún cliente coincide.' : 'Todavía nadie armó una lista en esta tienda.'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!q && filtered.length > PREVIEW && (
        <Button
          size="small"
          onClick={() => setShowAll(!showAll)}
          sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
        >
          {showAll ? 'Ver menos' : `Ver todos (${filtered.length})`}
        </Button>
      )}
    </Paper>
  );
}
