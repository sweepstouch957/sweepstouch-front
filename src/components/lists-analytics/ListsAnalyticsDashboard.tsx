'use client';

/**
 * Dashboard de clientes de una tienda: listas armadas, recibos escaneados, puntos dados y
 * canjeados, qué compra cada cliente, qué productos ponen en sus listas y cuáles compran.
 * Datos de /tracking/list-admin. Lo usan la página de analítica de listas (con selector
 * de tienda) y la pestaña Clientes del panel de la tienda.
 */
import { shoppingListsQK, shoppingListsService } from '@/services/shopping-lists.service';
import {
  alpha,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ListCustomersTable from './ListCustomersTable';
import { displayName } from './people';

const PREVIEW = 15;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (v: number) => usd.format(v || 0);
const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('es', { day: '2-digit', month: 'short' });
const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;

export default function ListsAnalyticsDashboard({ storeSlug }: { storeSlug: string }) {
  const theme = useTheme();
  const [days, setDays] = useState(30);
  const [allListed, setAllListed] = useState(false);
  const [allBought, setAllBought] = useState(false);
  const [allBuyers, setAllBuyers] = useState(false);
  const enabled = !!storeSlug;

  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled,
  });
  const insights = useQuery({
    queryKey: shoppingListsQK.insights(storeSlug),
    queryFn: () => shoppingListsService.insights(storeSlug),
    enabled,
    staleTime: 60_000,
  });
  const timeline = useQuery({
    queryKey: shoppingListsQK.timeline(storeSlug, days),
    queryFn: () => shoppingListsService.timeline(storeSlug, days),
    enabled,
  });
  const purchases = useQuery({
    queryKey: shoppingListsQK.purchases(storeSlug),
    queryFn: () => shoppingListsService.purchases(storeSlug),
    enabled,
    refetchInterval: 30_000,
  });
  const surveys = useQuery({
    queryKey: shoppingListsQK.surveys(storeSlug),
    queryFn: () => shoppingListsService.surveys(storeSlug),
    enabled,
    refetchInterval: 60_000,
  });
  const productRequests = useQuery({
    queryKey: shoppingListsQK.productRequests(storeSlug),
    queryFn: () => shoppingListsService.productRequests(storeSlug),
    enabled,
    refetchInterval: 60_000,
  });

  const s = summary.data;
  const p = purchases.data;
  const ins = insights.data;
  const tdays = timeline.data?.days ?? [];
  const max = Math.max(1, ...tdays.map((d) => Math.max(d.listsCreated, d.receipts)));
  const H = 150;

  const kpis: Array<[string, string | number]> = [
    ['Listas creadas', s?.total ?? '—'],
    ['Validadas', s?.validated ?? '—'],
    ['Pendientes', s?.pending ?? '—'],
    ['Clientes con listas', ins?.listCustomers ?? '—'],
    ['Productos por lista', ins?.avgItemsPerList ?? '—'],
    ['Recibos', p?.totals.receipts ?? '—'],
    ['Puntos dados', Math.round(s?.pointsAwarded ?? 0).toLocaleString()],
    [
      'Canjes (pts canjeados)',
      ins ? `${ins.redeemed.claims} (${Math.round(ins.redeemed.points).toLocaleString()})` : '—',
    ],
    ['Gasto en tickets', money(p?.totals.spend ?? 0)],
  ];

  return (
    <Box>
      {(summary.isLoading || purchases.isLoading) && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
      )}

      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1.5}
        sx={{ mb: 2.5 }}
      >
        {kpis.map(([label, value]) => (
          <Paper
            key={label}
            variant="outlined"
            sx={{ p: 1.75, borderRadius: 2, minWidth: 140, flex: '1 1 140px', textAlign: 'center' }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {label}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Actividad diaria */}
      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 2, mb: 2.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              Actividad diaria
            </Typography>
            <Stack
              direction="row"
              gap={1.5}
              sx={{ mt: 0.5 }}
            >
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
              <ToggleButton
                key={d}
                value={d}
                sx={{ px: 1.5 }}
              >
                {d} d
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.5,
            height: H + 26,
            overflowX: 'auto',
            pt: 1,
          }}
        >
          {tdays.map((d) => (
            <Tooltip
              key={d.date}
              arrow
              title={`${fmtDay(d.date)} · ${d.listsCreated} listas (${
                d.listsValidated
              } validadas) · ${d.receipts} recibos · ${Math.round(d.points)} pts`}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  minWidth: 22,
                  flex: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: H }}>
                  <Box
                    sx={{
                      width: 8,
                      borderRadius: 0.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.85),
                      height: Math.max(3, (d.listsCreated / max) * H),
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      borderRadius: 0.5,
                      bgcolor: 'success.main',
                      height: Math.max(3, (d.listsValidated / max) * H),
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      borderRadius: 0.5,
                      bgcolor: alpha(theme.palette.info.main, 0.8),
                      height: Math.max(3, (d.receipts / max) * H),
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ fontSize: 9, color: 'text.secondary', whiteSpace: 'nowrap' }}
                >
                  {fmtDay(d.date)}
                </Typography>
              </Box>
            </Tooltip>
          ))}
          {!tdays.length && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ m: 'auto' }}
            >
              Sin actividad en el periodo.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Todos los clientes que armaron listas */}
      <ListCustomersTable customers={ins?.customers ?? []} />

      {/* Compras por cliente */}
      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 2, mb: 2.5, overflowX: 'auto' }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mb: 1 }}
        >
          Clientes que más compran
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            según recibos — tenga o no puntos, esté o no en la base
          </Typography>
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={cell}>Cliente</TableCell>
              <TableCell
                sx={cell}
                align="right"
              >
                Recibos
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
                Gasto
              </TableCell>
              <TableCell sx={cell}>Último recibo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(allBuyers ? p?.customers ?? [] : (p?.customers ?? []).slice(0, PREVIEW)).map((c) => (
              <TableRow
                key={c.customerId}
                hover
              >
                <TableCell sx={cell}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {displayName(c.customerName, c.customerPhone)}
                  </Typography>
                  {!c.inDatabase && (
                    <Chip
                      size="small"
                      label="fuera de la base"
                      sx={{ height: 18, fontSize: 11 }}
                    />
                  )}
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  {c.receipts}
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  {c.products}
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
                  {money(c.spend)}
                </TableCell>
                <TableCell sx={cell}>
                  {new Date(c.lastReceiptAt).toLocaleDateString('es')}
                </TableCell>
              </TableRow>
            ))}
            {!p?.customers.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  sx={{ py: 3, textAlign: 'center' }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Todavía no hay recibos escaneados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {(p?.customers.length ?? 0) > PREVIEW && (
          <Button
            size="small"
            onClick={() => setAllBuyers(!allBuyers)}
            sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
          >
            {allBuyers ? 'Ver menos' : `Ver todos (${p!.customers.length})`}
          </Button>
        )}
      </Paper>

      {/* Encuesta post-compra */}
      {(surveys.data?.totals.responses ?? 0) > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 2.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              Encuesta post-compra
            </Typography>
            <Stack
              direction="row"
              gap={1}
            >
              <Chip
                size="small"
                label={`${surveys.data!.totals.responses} respuestas`}
              />
              <Chip
                size="small"
                label={`${surveys.data!.totals.last7d} esta semana`}
              />
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
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ mb: 0.75 }}
                >
                  {q.question}
                </Typography>
                <Stack spacing={0.5}>
                  {q.answers.map((a) => {
                    const pct = q.total ? Math.round((a.count / q.total) * 100) : 0;
                    return (
                      <Box key={a.answer}>
                        <Box
                          sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}
                        >
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{ fontSize: 12.5 }}
                          >
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
                    <Typography
                      variant="caption"
                      noWrap
                      fontWeight={600}
                    >
                      {displayName(r.customerName, r.customerPhone)} — {r.answers[0]?.answer || ''}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flexShrink: 0 }}
                    >
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

      {/* Productos pedidos desde Mi Toque */}
      {(productRequests.data?.totals.requests ?? 0) > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 2.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              Productos pedidos (Mi Toque)
            </Typography>
            <Stack
              direction="row"
              gap={1}
            >
              <Chip
                size="small"
                label={`${productRequests.data!.totals.requests} pedidos`}
              />
              <Chip
                size="small"
                label={`${productRequests.data!.totals.last7d} esta semana`}
              />
            </Stack>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Producto</TableCell>
                <TableCell sx={cell}>Nacionalidades</TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Pedidos
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Último
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productRequests.data!.top.map((t) => (
                <TableRow
                  key={t._id}
                  hover
                >
                  <TableCell sx={cell}>{t.product}</TableCell>
                  <TableCell sx={{ ...cell, whiteSpace: 'normal' }}>
                    {t.nationalities.join(', ') || '—'}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {t.count}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {new Date(t.lastAt).toLocaleDateString('es')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Lo que más se pone en las listas (intención), distinto de lo que se compra (recibos) */}
      {(ins?.topListed.length ?? 0) > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 2.5, overflowX: 'auto' }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Productos que más ponen en sus listas
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              lo que quieren comprar, aunque todavía no haya recibo
            </Typography>
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Producto</TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  En listas
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Clientes
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Unidades
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Precio
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(allListed ? ins!.topListed : ins!.topListed.slice(0, PREVIEW)).map((t) => (
                <TableRow
                  key={t.name}
                  hover
                >
                  <TableCell sx={{ ...cell, maxWidth: 320 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1}
                    >
                      {t.imageUrl ? (
                        <Box
                          component="img"
                          src={t.imageUrl}
                          alt=""
                          loading="lazy"
                          sx={{
                            width: 28,
                            height: 28,
                            objectFit: 'contain',
                            borderRadius: 1,
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                      <Typography
                        variant="body2"
                        noWrap
                      >
                        {t.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {t.lists}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {t.customers ?? '—'}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {t.quantity}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {t.price || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {ins!.topListed.length > PREVIEW && (
            <Button
              size="small"
              onClick={() => setAllListed(!allListed)}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
            >
              {allListed ? 'Ver menos' : `Ver todos (${ins!.topListed.length})`}
            </Button>
          )}
        </Paper>
      )}

      {/* Top productos */}
      {(p?.topProducts.length ?? 0) > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, overflowX: 'auto' }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Productos más comprados (ticket completo)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Producto</TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Unidades
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Recibos
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  De la lista
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Ingreso
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(allBought ? p!.topProducts : p!.topProducts.slice(0, PREVIEW)).map((tp) => (
                <TableRow
                  key={tp.name}
                  hover
                >
                  <TableCell sx={{ ...cell, maxWidth: 300 }}>
                    <Typography
                      variant="body2"
                      noWrap
                    >
                      {tp.name}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {tp.quantity}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {tp.receipts}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {tp.matchedReceipts}
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    {money(tp.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {p!.topProducts.length > PREVIEW && (
            <Button
              size="small"
              onClick={() => setAllBought(!allBought)}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
            >
              {allBought ? 'Ver menos' : `Ver todos (${p!.topProducts.length})`}
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
}
