'use client';

import { useQboServices } from '@hooks/fetching/qbo/useQbo';
import type { QboServiceStoreRow } from '@/services/qbo.service';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { money, presetToRange, RANGE_PRESETS, type RangePreset } from './constants';

type Props = {
  /** Rango controlado por el padre (dashboard). Sin él, la tabla trae su propio selector. */
  range?: { from: string | null; to: string | null };
  /** Navegar al panel de la tienda. Solo filas vinculadas. */
  onSelectStore?: (row: QboServiceStoreRow) => void;
};

const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;

/**
 * Matriz tienda × servicio de QuickBooks: cada item del catálogo (membresía,
 * campañas, Design Fee, Merchant Set-Up, Promotional Items, Flyers…) es una
 * columna. Lo que antes se hundía en "otros" acá tiene nombre y monto.
 */
export function ServicesByStore({ range, onSelectStore }: Props) {
  const controlled = range !== undefined;
  const [preset, setPreset] = useState<RangePreset>('all');
  const effective = useMemo(
    () => (controlled ? range! : presetToRange(preset)),
    [controlled, range, preset]
  );

  const services = useQboServices(effective);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const rows = useMemo(() => {
    const all = services.data?.stores ?? [];
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((r) =>
      `${r.storeName ?? ''} ${r.customerName} ${r.storeSlug ?? ''}`.toLowerCase().includes(q)
    );
  }, [services.data, deferredSearch]);

  const items = services.data?.items ?? [];
  const totals = services.data?.totals;

  return (
    <PanelCard sx={{ overflow: 'hidden' }}>
      {services.isFetching && <LinearProgress sx={{ height: 2 }} />}
      <SectionHeader
        icon={<CategoryRoundedIcon />}
        title="Servicios por tienda (QuickBooks)"
        hint="Todo lo facturado, item por item del catálogo del contador"
        count={rows.length}
      />
      <Box sx={{ px: 2.25, pb: 2 }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          gap={1.5}
          sx={{ mb: 1.5 }}
        >
          {!controlled && (
            <TextField
              select
              size="small"
              label="Periodo"
              value={preset}
              onChange={(e) => setPreset(e.target.value as RangePreset)}
              sx={{ width: 170, flexShrink: 0 }}
            >
              {RANGE_PRESETS.filter((o) => o.value !== 'custom').map((o) => (
                <MenuItem key={o.value}
value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          )}

          {totals && (
            <Chip
              size="small"
              label={`Facturado ${money(totals.billed)} · ${totals.customers} clientes`}
              sx={{ fontWeight: 600 }}
            />
          )}

          <Box sx={{ flexGrow: 1, minWidth: 0 }} />

          <TextField
            size="small"
            placeholder="Buscar tienda…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: '1 1 180px', minWidth: 150, maxWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {services.isError && (
          <Alert severity="error">
            {(services.error as Error)?.message || 'No se pudieron leer los servicios.'}
          </Alert>
        )}

        {services.isLoading ? (
          <Stack gap={1}
sx={{ py: 1 }}
aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i}
variant="rounded"
height={36}
sx={{ opacity: 1 - i * 0.12 }} />
            ))}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small"
sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      ...cell,
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      bgcolor: 'background.paper',
                      minWidth: 190,
                    }}
                  >
                    Tienda
                  </TableCell>
                  {items.map((it) => (
                    <TableCell key={it.id}
align="right"
sx={cell}>
                      <Tooltip title={`${it.full} · ${money(it.total)} en el periodo`}
arrow>
                        <span>{it.label}</span>
                      </Tooltip>
                    </TableCell>
                  ))}
                  <TableCell align="right"
sx={{ ...cell, fontWeight: 700 }}>
                    Total
                  </TableCell>
                  <TableCell align="right"
sx={{ ...cell, fontWeight: 700 }}>
                    Debe
                  </TableCell>
                </TableRow>
                {totals && (
                  <TableRow>
                    <TableCell
                      sx={{
                        ...cell,
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        fontWeight: 700,
                      }}
                    >
                      Todas
                    </TableCell>
                    {items.map((it) => (
                      <TableCell key={it.id}
align="right"
sx={{ ...cell, fontWeight: 600 }}>
                        {money(it.total)}
                      </TableCell>
                    ))}
                    <TableCell align="right"
sx={{ ...cell, fontWeight: 700 }}>
                      {money(totals.billed)}
                    </TableCell>
                    <TableCell align="right"
sx={{ ...cell, fontWeight: 700 }}>
                      {money(totals.openBalance)}
                    </TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.qboCustomerId}
                    hover={Boolean(onSelectStore && r.storeId)}
                    onClick={onSelectStore && r.storeId ? () => onSelectStore(r) : undefined}
                    sx={onSelectStore && r.storeId ? { cursor: 'pointer' } : undefined}
                  >
                    <TableCell
                      sx={{
                        ...cell,
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        maxWidth: 240,
                      }}
                    >
                      <Stack direction="row"
alignItems="center"
gap={0.75}
sx={{ minWidth: 0 }}>
                        <Typography variant="body2"
noWrap
fontWeight={600}>
                          {r.storeName || r.customerName}
                        </Typography>
                        {!r.linked && (
                          <Chip size="small"
label="sin vincular"
sx={{ height: 18, fontSize: 11 }} />
                        )}
                        {r.storeActive === false && (
                          <Chip
                            size="small"
                            color="warning"
                            label="de baja"
                            sx={{ height: 18, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    {items.map((it) => {
                      const v = r.byItem[it.id];
                      return (
                        <TableCell key={it.id}
align="right"
sx={cell}>
                          {v ? (
                            money(v)
                          ) : (
                            <Typography component="span"
variant="caption"
color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell align="right"
sx={{ ...cell, fontWeight: 700 }}>
                      {money(r.total)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        ...cell,
                        fontWeight: 600,
                        color: r.openBalance > 0 ? 'error.main' : 'text.secondary',
                      }}
                    >
                      {r.openBalance > 0 ? money(r.openBalance) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={items.length + 3}
sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="body2"
color="text.secondary">
                        Sin facturación en el periodo.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </PanelCard>
  );
}

export default ServicesByStore;
