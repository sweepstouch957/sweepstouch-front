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
import type { AudienceExperimentResult } from '@/services/audienceExperiment.service';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Box,
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
const money = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ResultsView({ result, weekly }: { result: AudienceExperimentResult; weekly: number }) {
  const theme = useTheme();
  const s = result.summary;
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q.trim().toLowerCase());
  const rows = useMemo(
    () => result.targets.filter((t) => !dq || t.name?.toLowerCase().includes(dq)).slice(0, 300),
    [result.targets, dq]
  );
  const maxWeek = Math.max(1, ...result.timeline.map((w) => w.added));
  const line = panelDivider(theme);

  return (
    <Stack gap={2}>
      <KpiRow>
        <KpiCard
          label="Tiendas en el experimento"
          value={num(s.targets)}
          delta={s.atCap ? `${num(s.atCap)} ya llegaron al umbral` : `+${num(weekly)} números por semana cada una`}
        />
        <KpiCard
          label="Números sumados (simulado)"
          value={num(s.added)}
          delta={`en ${num(result.weeks)} ${result.weeks === 1 ? 'semana' : 'semanas'}`}
          tone="success"
        />
        <KpiCard
          label="Se habría facturado de más"
          value={money(s.revenueToDate)}
          delta="en las campañas que ya salieron"
          tone="success"
        />
        <KpiCard
          label="Ritmo actual"
          value={`${money(s.weeklyRevenueNow)}/sem`}
          delta={`${money(s.weeklyRevenueNow * 4.33)} al mes`}
        />
      </KpiRow>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 2 }}>
        <PanelCard>
          <SectionHeader
            icon={<InsightsRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
            title="Cómo van subiendo"
            hint="Total de números sumados al cierre de cada semana"
          />
          {result.timeline.length === 0 ? (
            <EmptyBlock
              title="Todavía no empezó"
              hint="La fecha de inicio es futura: la semana 1 suma ese día."
            />
          ) : (
            <Stack
              direction="row"
              alignItems="flex-end"
              gap={1}
              sx={{ px: 2.25, pt: 3, pb: 2, height: 220, overflowX: 'auto' }}
            >
              {result.timeline.map((w) => (
                <Tooltip
                  key={w.week}
                  title={`Semana ${w.week}: ${num(w.added)} números`}
                >
                  <Stack
                    alignItems="center"
                    gap={0.75}
                    sx={{ flex: '1 0 28px', height: '100%', justifyContent: 'flex-end' }}
                  >
                    <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {w.added >= 1000 ? `${(w.added / 1000).toFixed(1)}k` : w.added}
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: 40,
                        height: `${Math.max(3, (w.added / maxWeek) * 100)}%`,
                        bgcolor: w.week === result.weeks ? 'primary.main' : alpha(theme.palette.primary.main, 0.35),
                        borderRadius: '6px 6px 2px 2px',
                      }}
                    />
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>S{w.week}</Typography>
                  </Stack>
                </Tooltip>
              ))}
            </Stack>
          )}
        </PanelCard>

        <PanelCard>
          <SectionHeader
            icon={<StorefrontRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
            title="De dónde salen"
            hint={`${num(s.sourcePool)} números únicos disponibles`}
          />
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tienda fuente</TableCell>
                  <TableCell align="right">Clientes</TableCell>
                  <TableCell align="right">Aportados</TableCell>
                  <TableCell align="right">Usado</TableCell>
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
                    <TableCell align="right">{src.pool ? `${Math.round((src.provided / src.pool) * 100)}%` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </PanelCard>
      </Box>

      <PanelCard>
        <SectionHeader
          icon={<StorefrontRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          title="Tiendas que reciben números"
          count={num(result.targets.length)}
          action={
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
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
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
              sx={{ minWidth: 860 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Tienda</TableCell>
                  <TableCell align="right">Hoy tiene</TableCell>
                  <TableCell align="right">Sumados</TableCell>
                  <TableCell align="right">Quedaría en</TableCell>
                  <TableCell align="right">Crecimiento</TableCell>
                  <TableCell align="right">Campañas/sem</TableCell>
                  <TableCell align="right">Facturado de más</TableCell>
                  <TableCell align="right">Ritmo semanal</TableCell>
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
                        {t.reachedCap && (
                          <StatusPill
                            label="Umbral"
                            tone="success"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{num(t.audience)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: 'success.main', fontWeight: 700 }}
                    >
                      +{num(t.added)}
                    </TableCell>
                    <TableCell align="right">{num(t.simulatedAudience)}</TableCell>
                    <TableCell align="right">{t.growthPct == null ? '—' : `+${t.growthPct.toLocaleString('es')}%`}</TableCell>
                    <TableCell align="right">{t.campaignsPerWeek ? t.campaignsPerWeek.toLocaleString('es') : '—'}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      {money(t.revenueToDate)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: 'text.secondary' }}
                    >
                      {t.weeklyRevenueNow ? `${money(t.weeklyRevenueNow)}/sem` : 'sin campañas'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        <Typography sx={{ px: 2.25, py: 1.5, fontSize: 12, color: 'text.secondary', borderTop: `1px solid ${line}` }}>
          "Facturado de más" usa la tarifa real de cada campaña que ya salió (costo ÷ audiencia) por los números que la tienda
          habría tenido sumados ese día. "Ritmo semanal" = números sumados hoy × tarifa × campañas por semana (últimas 4 semanas).
        </Typography>
      </PanelCard>
    </Stack>
  );
}
