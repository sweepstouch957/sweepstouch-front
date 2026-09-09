'use client';

// Analítica de LISTAS Pre-RCS por tienda — el gemelo de campaign-analytics
// pero para el flujo de listas: listas armadas, recibos escaneados por OCR,
// puntos acreditados y qué compra cada cliente. Datos de /tracking/list-admin.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Autocomplete,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import type { Store } from '@/services/store.service';
import { shoppingListsService, shoppingListsQK } from '@/services/shopping-lists.service';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (v: number) => usd.format(v || 0);
const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('es', { day: '2-digit', month: 'short' });
const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;

export default function ListsAnalyticsPage() {
  const theme = useTheme();
  const [term, setTerm] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const [days, setDays] = useState(30);
  const search = useStoreSearch(term);
  const storeSlug = store?.slug || '';

  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled: !!storeSlug,
  });
  const timeline = useQuery({
    queryKey: ['shopping-lists', 'timeline', storeSlug, days],
    queryFn: () => shoppingListsService.timeline(storeSlug, days),
    enabled: !!storeSlug,
  });
  const purchases = useQuery({
    queryKey: shoppingListsQK.purchases(storeSlug),
    queryFn: () => shoppingListsService.purchases(storeSlug),
    enabled: !!storeSlug,
    refetchInterval: 30_000,
  });
  const surveys = useQuery({
    queryKey: ['shopping-lists', 'surveys', storeSlug],
    queryFn: () => shoppingListsService.surveys(storeSlug),
    enabled: !!storeSlug,
    refetchInterval: 60_000,
  });

  const s = summary.data;
  const p = purchases.data;
  const tdays = timeline.data?.days ?? [];
  const max = Math.max(1, ...tdays.map((d) => Math.max(d.listsCreated, d.receipts)));
  const H = 150;

  const kpis: Array<[string, string | number]> = [
    ['Listas creadas', s?.total ?? '—'],
    ['Validadas', s?.validated ?? '—'],
    ['Pendientes', s?.pending ?? '—'],
    ['Recibos', p?.totals.receipts ?? '—'],
    ['Puntos dados', Math.round(s?.pointsAwarded ?? 0)],
    ['Gasto en tickets', money(p?.totals.spend ?? 0)],
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 2.5 }}
      >
        <FactCheckRoundedIcon color="primary" />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h5"
fontWeight={800}>
            Listas Pre-RCS
          </Typography>
          <Typography variant="caption"
color="text.secondary">
            Listas, recibos validados por OCR y compras por cliente
          </Typography>
        </Box>
        <Autocomplete
          size="small"
          sx={{ width: { xs: '100%', sm: 320 } }}
          options={search.options}
          loading={search.loading}
          value={store}
          onChange={(_, v) => setStore(v)}
          inputValue={term}
          onInputChange={(_, v) => setTerm(v)}
          filterOptions={(x) => x}
          getOptionLabel={(o) => o.name || o.slug || ''}
          isOptionEqualToValue={(a, b) => a._id === b._id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tienda"
              placeholder="Escribe 2+ letras…"
            />
          )}
        />
      </Stack>

      {!storeSlug ? (
        <Paper
          variant="outlined"
          sx={{ p: 6, borderRadius: 3, textAlign: 'center', color: 'text.secondary' }}
        >
          Elige una tienda para ver su analítica de listas.
        </Paper>
      ) : (
        <>
          {(summary.isLoading || purchases.isLoading) && (
            <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
          )}

          <Stack direction="row"
flexWrap="wrap"
gap={1.5}
sx={{ mb: 2.5 }}>
            {kpis.map(([label, value]) => (
              <Paper
                key={label}
                variant="outlined"
                sx={{ p: 1.75, borderRadius: 2, minWidth: 140, flex: '1 1 140px', textAlign: 'center' }}
              >
                <Typography variant="h6"
fontWeight={800}>
                  {value}
                </Typography>
                <Typography variant="caption"
color="text.secondary">
                  {label}
                </Typography>
              </Paper>
            ))}
          </Stack>

          {/* Actividad diaria */}
          <Paper variant="outlined"
sx={{ p: 2, borderRadius: 2, mb: 2.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="subtitle2"
fontWeight={700}>
                  Actividad diaria
                </Typography>
                <Stack direction="row"
gap={1.5}
sx={{ mt: 0.5 }}>
                  {(
                    [
                      ['Listas', theme.palette.primary.main],
                      ['Validadas', theme.palette.success.main],
                      ['Recibos', theme.palette.info.main],
                    ] as const
                  ).map(([label, color]) => (
                    <Typography
                      key={label}
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: color }} /> {label}
                    </Typography>
                  ))}
                </Stack>
              </Box>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={days}
                onChange={(_, v) => v && setDays(v)}
              >
                {[7, 30, 90].map((d) => (
                  <ToggleButton key={d}
value={d}
sx={{ px: 1.5 }}>
                    {d} d
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: H + 26, overflowX: 'auto', pt: 1 }}>
              {tdays.map((d) => (
                <Tooltip
                  key={d.date}
                  arrow
                  title={`${fmtDay(d.date)} · ${d.listsCreated} listas (${d.listsValidated} validadas) · ${d.receipts} recibos · ${Math.round(d.points)} pts`}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 22, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: H }}>
                      <Box sx={{ width: 8, borderRadius: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.85), height: Math.max(3, (d.listsCreated / max) * H) }} />
                      <Box sx={{ width: 8, borderRadius: 0.5, bgcolor: 'success.main', height: Math.max(3, (d.listsValidated / max) * H) }} />
                      <Box sx={{ width: 8, borderRadius: 0.5, bgcolor: alpha(theme.palette.info.main, 0.8), height: Math.max(3, (d.receipts / max) * H) }} />
                    </Box>
                    <Typography variant="caption"
sx={{ fontSize: 9, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {fmtDay(d.date)}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
              {!tdays.length && (
                <Typography variant="body2"
color="text.secondary"
sx={{ m: 'auto' }}>
                  Sin actividad en el periodo.
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Compras por cliente */}
          <Paper variant="outlined"
sx={{ p: 2, borderRadius: 2, mb: 2.5, overflowX: 'auto' }}>
            <Typography variant="subtitle2"
fontWeight={700}
sx={{ mb: 1 }}>
              Qué compró cada cliente
              <Typography component="span"
variant="caption"
color="text.secondary"
sx={{ ml: 1 }}>
                según recibos — tenga o no puntos, esté o no en la base
              </Typography>
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={cell}>Cliente</TableCell>
                  <TableCell sx={cell}
align="right">Recibos</TableCell>
                  <TableCell sx={cell}
align="right">Productos</TableCell>
                  <TableCell sx={cell}
align="right">Puntos</TableCell>
                  <TableCell sx={cell}
align="right">Gasto</TableCell>
                  <TableCell sx={cell}>Último recibo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(p?.customers ?? []).map((c) => (
                  <TableRow key={c.customerId}
hover>
                    <TableCell sx={cell}>
                      <Typography variant="body2"
fontWeight={600}>
                        {c.customerName || c.customerPhone || c.customerId}
                      </Typography>
                      {!c.inDatabase && (
                        <Chip size="small"
label="fuera de la base"
sx={{ height: 18, fontSize: 11 }} />
                      )}
                    </TableCell>
                    <TableCell sx={cell}
align="right">{c.receipts}</TableCell>
                    <TableCell sx={cell}
align="right">{c.products}</TableCell>
                    <TableCell sx={cell}
align="right">{Math.round(c.points)}</TableCell>
                    <TableCell sx={cell}
align="right">{money(c.spend)}</TableCell>
                    <TableCell sx={cell}>{new Date(c.lastReceiptAt).toLocaleDateString('es')}</TableCell>
                  </TableRow>
                ))}
                {!p?.customers.length && (
                  <TableRow>
                    <TableCell colSpan={6}
sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="body2"
color="text.secondary">
                        Todavía no hay recibos escaneados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Encuesta post-compra */}
          {(surveys.data?.totals.responses ?? 0) > 0 && (
            <Paper variant="outlined"
sx={{ p: 2, borderRadius: 2, mb: 2.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle2"
fontWeight={700}>
                  Encuesta post-compra
                </Typography>
                <Stack direction="row"
gap={1}>
                  <Chip size="small"
label={`${surveys.data!.totals.responses} respuestas`} />
                  <Chip size="small"
label={`${surveys.data!.totals.last7d} esta semana`} />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${Math.round(surveys.data!.totals.pointsAwarded)} pts pagados`}
                  />
                </Stack>
              </Stack>
              <Stack spacing={2}>
                {surveys.data!.questions.map((q) => (
                  <Box key={q.question}>
                    <Typography variant="body2"
fontWeight={700}
sx={{ mb: 0.75 }}>
                      {q.question}
                    </Typography>
                    <Stack spacing={0.5}>
                      {q.answers.map((a) => {
                        const pct = q.total ? Math.round((a.count / q.total) * 100) : 0;
                        return (
                          <Box key={a.answer}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                              <Typography variant="caption"
noWrap
sx={{ fontSize: 12.5 }}>
                                {a.answer}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ flexShrink: 0, ml: 1, fontSize: 12.5 }}
                              >
                                {a.count} · {pct}%
                              </Typography>
                            </Box>
                            <Box sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover', mt: 0.4 }}>
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  borderRadius: 1,
                                  bgcolor: 'primary.main',
                                  transition: 'width .4s ease',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
              {surveys.data!.recent.length > 0 && (
                <>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 2, mb: 0.5 }}
                  >
                    Últimas respuestas
                  </Typography>
                  <Stack spacing={0.5}>
                    {surveys.data!.recent.slice(0, 5).map((r, i) => (
                      <Box
                        key={`${r.customerId}-${i}`}
                        sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
                      >
                        <Typography variant="caption"
noWrap
fontWeight={600}>
                          {r.customerName || r.customerId} — {r.answers[0]?.answer || ''}
                        </Typography>
                        <Typography variant="caption"
color="text.secondary"
sx={{ flexShrink: 0 }}>
                          {new Date(r.createdAt).toLocaleDateString('es')}
                          {r.pointsAwarded > 0 ? ` · +${r.pointsAwarded} pts` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Paper>
          )}

          {/* Top productos */}
          {(p?.topProducts.length ?? 0) > 0 && (
            <Paper variant="outlined"
sx={{ p: 2, borderRadius: 2, overflowX: 'auto' }}>
              <Typography variant="subtitle2"
fontWeight={700}
sx={{ mb: 1 }}>
                Productos más comprados (ticket completo)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={cell}>Producto</TableCell>
                    <TableCell sx={cell}
align="right">Unidades</TableCell>
                    <TableCell sx={cell}
align="right">Recibos</TableCell>
                    <TableCell sx={cell}
align="right">De la lista</TableCell>
                    <TableCell sx={cell}
align="right">Ingreso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p!.topProducts.map((tp) => (
                    <TableRow key={tp.name}
hover>
                      <TableCell sx={{ ...cell, maxWidth: 300 }}>
                        <Typography variant="body2"
noWrap>
                          {tp.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={cell}
align="right">{tp.quantity}</TableCell>
                      <TableCell sx={cell}
align="right">{tp.receipts}</TableCell>
                      <TableCell sx={cell}
align="right">{tp.matchedReceipts}</TableCell>
                      <TableCell sx={cell}
align="right">{money(tp.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
