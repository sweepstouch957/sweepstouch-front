'use client';

import {
  EmptyBlock,
  KpiCard,
  KpiRow,
  panelDivider,
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { AudienceRefillResult } from '@/services/audienceExperiment.service';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useDeferredValue, useMemo, useState } from 'react';

const num = (n: number) => Number(n || 0).toLocaleString('es');

export function ResultsView({
  result,
  active,
  ranToday,
  running,
  onRun,
  undoing,
  onUndo,
}: {
  result: AudienceRefillResult;
  active: boolean;
  ranToday: boolean;
  running: boolean;
  onRun: () => void;
  undoing: boolean;
  onUndo: (storeId: string, period?: string) => void;
}) {
  const theme = useTheme();
  const line = panelDivider(theme);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q.trim().toLowerCase());
  const rows = useMemo(
    () => result.stores.filter((t) => !dq || t.name?.toLowerCase().includes(dq)).slice(0, 300),
    [result.stores, dq]
  );
  const sum = (k: 'purged' | 'quota' | 'added' | 'today') => result.stores.reduce((a, s) => a + s[k], 0);
  const withPurge = result.stores.filter((s) => s.purged > 0).length;

  return (
    <Stack gap={2}>
      <KpiRow>
        <KpiCard
          label="Depurados este mes"
          value={num(sum('purged'))}
          delta={`en ${num(withPurge)} ${withPurge === 1 ? 'tienda' : 'tiendas'}`}
          tone={sum('purged') ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="A reponer (cuota)"
          value={num(sum('quota'))}
          delta="depurados + extra"
        />
        <KpiCard
          label="Repuestos este mes"
          value={num(sum('added'))}
          delta={`faltan ${num(sum('quota') - sum('added'))}`}
          tone="success"
        />
        <KpiCard
          label="Tocan hoy"
          value={num(sum('today'))}
          delta={ranToday ? 'hoy ya corrió' : active ? 'corre solo en el día' : 'relleno apagado'}
          tone={sum('today') && !ranToday ? 'warning' : 'neutral'}
        />
      </KpiRow>

      <PanelCard>
        <SectionHeader
          icon={<StorefrontRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          title="Tiendas que reciben referidos"
          count={num(result.stores.length)}
          hint={`Período ${result.period}. Cuenta depuraciones desde ${new Date(result.since).toLocaleDateString('es')}.`}
          action={
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <TextField
                size="small"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar tienda"
                inputProps={{ 'aria-label': 'Buscar tienda' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 200 } }}
              />
              <Tooltip title={ranToday ? 'Hoy ya corrió; mañana vuelve a tocar' : 'Agrega ahora lo que toca hoy'}>
                <span>
                  <Button
                    variant="contained"
                    disableElevation
                    size="small"
                    disabled={!active || ranToday || running || !sum('today')}
                    onClick={onRun}
                    startIcon={running ? <CircularProgress size={14} color="inherit" /> : <PlayArrowRoundedIcon />}
                    sx={{ borderRadius: 2.5, fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    Correr hoy
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          }
        />
        {rows.length === 0 ? (
          <EmptyBlock
            title="Sin tiendas"
            hint={dq ? 'Ninguna tienda coincide con la búsqueda.' : 'No hay tiendas activas debajo del umbral.'}
          />
        ) : (
          <Box sx={{ overflowX: 'auto', maxHeight: 620 }}>
            <Table
              size="small"
              stickyHeader
              sx={{ minWidth: 820 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Tienda</TableCell>
                  <TableCell align="right">Hoy tiene</TableCell>
                  <TableCell align="right">Depurados</TableCell>
                  <TableCell align="right">Cuota</TableCell>
                  <TableCell align="right">Repuestos</TableCell>
                  <TableCell align="right">Faltan</TableCell>
                  <TableCell align="right">Tocan hoy</TableCell>
                  <TableCell align="right">Deshacer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => (
                  <TableRow
                    key={t.storeId}
                    hover
                  >
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        sx={{ minWidth: 0 }}
                      >
                        <Typography
                          noWrap
                          title={t.name}
                          sx={{ fontSize: 13, fontWeight: 600 }}
                        >
                          {t.name}
                        </Typography>
                        {t.quota > 0 && t.remaining === 0 && (
                          <StatusPill
                            label="Cubierta"
                            tone="success"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{num(t.audience)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: t.purged ? 'warning.main' : 'text.secondary', fontWeight: t.purged ? 700 : 400 }}
                    >
                      {t.purged ? `−${num(t.purged)}` : '0'}
                    </TableCell>
                    <TableCell align="right">{num(t.quota)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: 'success.main', fontWeight: 700 }}
                    >
                      {t.added ? `+${num(t.added)}` : '0'}
                    </TableCell>
                    <TableCell align="right">{num(t.remaining)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      {t.today ? `+${num(t.today)}` : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {t.added > 0 && (
                        <Tooltip title={`Quitar los ${num(t.added)} referidos de ${result.period}`}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={undoing}
                              onClick={() => {
                                if (window.confirm(`¿Quitar ${num(t.added)} referidos de ${t.name} (${result.period})?`)) {
                                  onUndo(t.storeId, result.period);
                                }
                              }}
                              aria-label="Deshacer"
                            >
                              <UndoRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        <Typography sx={{ px: 2.25, py: 1.5, fontSize: 12, color: 'text.secondary', borderTop: `1px solid ${line}` }}>
          "Depurados" = clientes de la tienda que quedaron inactivos este mes (depuración, STOP, opt-out). "Cuota" = depurados
          + extra. "Tocan hoy" = lo que falta repartido en los días que quedan del mes. Los agregados entran como
          referidos del sorteo activo de la tienda: cuentan en la audiencia y el costo de sus campañas, pero no reciben mensajes.
        </Typography>
      </PanelCard>

      <PanelCard>
        <SectionHeader
          icon={<StorefrontRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          title="De dónde salen"
          hint="Tiendas dadas de baja. Los números se toman parejo de todas."
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tienda fuente</TableCell>
                <TableCell align="right">Clientes activos</TableCell>
                <TableCell align="right">Aportados este mes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.sources.map((src) => (
                <TableRow key={src.storeId}>
                  <TableCell sx={{ fontWeight: 600, maxWidth: 260 }}>
                    <Typography
                      noWrap
                      title={src.name}
                      sx={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {src.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{num(src.pool)}</TableCell>
                  <TableCell align="right">{num(src.provided)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PanelCard>
    </Stack>
  );
}
