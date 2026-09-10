'use client';

// Pre-RCS de la tienda desde el panel admin: la misma lógica que el merchant
// tiene en su portal (circular + catálogo + validación de listas), más las
// métricas de compras por recibo. Todo contra endpoints ya existentes de
// circular-service y tracking-service.

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  circularService,
  type Circular,
  type StoreProduct,
} from '@/services/circular.service';
import {
  shoppingListsService,
  shoppingListsQK,
  type AdminShoppingList,
  type ShoppingListStatus,
} from '@/services/shopping-lists.service';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import TestMmsShoppingListModal from '@/components/mms/TestMmsShoppingListModal';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (v: number | null | undefined) => usd.format(Number(v ?? 0));

/** Precio por unidad desde el string del flyer: "$2.99", "99¢/lb", "2/$5". */
function parsePriceNum(price?: string | null): number {
  if (!price) return 0;
  const s = String(price);
  const multi = s.match(/(\d+)\s*\/\s*\$?([\d.]+)/);
  if (multi) {
    const n = parseInt(multi[1], 10);
    const t = parseFloat(multi[2]);
    return n > 0 ? t / n : t;
  }
  if (s.includes('¢')) return (parseFloat(s.replace(/[^0-9.]/g, '')) || 0) / 100;
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

/** Regular estimado = oferta × 1.25 — misma regla que circular-service. */
function regularFromPrice(price?: string | null): string | null {
  const unit = parsePriceNum(price);
  return unit > 0 ? `$${(unit * 1.25).toFixed(2)}` : null;
}
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'default' | 'info' }> = {
  active: { label: 'Activo', color: 'success' },
  scheduled: { label: 'Agendado', color: 'info' },
  expired: { label: 'Vencido', color: 'default' },
  draft: { label: 'Borrador', color: 'warning' },
  archived: { label: 'Archivado', color: 'default' },
  pending: { label: 'Pendiente', color: 'warning' },
  validated: { label: 'Validada', color: 'success' },
};

const cell = { py: 0.75, px: 1.25, whiteSpace: 'nowrap' } as const;

type Props = {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  provider?: string;
  infobipSenderId?: string;
};

/* ═══════════════ 1 · Circular (agendar + mensaje de prueba) ═══════════════ */

function CircularSection({ storeId, storeSlug, storeName, provider, infobipSenderId }: Props) {
  const qc = useQueryClient();
  const circulars = useQuery({
    queryKey: ['store-circulars', storeSlug],
    queryFn: () => circularService.getByStore(storeSlug),
    enabled: !!storeSlug,
  });

  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  // Extracción IA por circular. Tarda ~1 min; si el cliente corta antes, la
  // extracción sigue en el servidor y aparece al refrescar.
  const extract = useMutation({
    mutationFn: (circularId: string) => circularService.extractProducts(circularId, 0),
    onSuccess: (d: any) => {
      toast.success(`IA: ${d?.circular?.products?.length ?? 0} productos extraídos`);
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: () => {
      toast('La extracción sigue corriendo en el servidor — refresca en un minuto.', { icon: '⏳' });
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!start || !end) throw new Error('Fechas de inicio y fin son obligatorias');
      if (file) {
        return circularService.upload({ file, storeSlug, startDate: start, endDate: end, title: title || undefined });
      }
      return circularService.schedule({ storeSlug, startDate: start, endDate: end, title: title || undefined });
    },
    onSuccess: (d: any) => {
      setTitle(''); setStart(''); setEnd(''); setFile(null);
      qc.invalidateQueries({ queryKey: ['store-circulars', storeSlug] });
      // Con PDF la extracción arranca sola: antes el circular quedaba agendado
      // con 0 productos y el Pre-RCS salía vacío.
      if (file && d?.circular?._id) {
        toast.success('Circular subido — extrayendo productos con IA…');
        extract.mutate(d.circular._id);
      } else {
        toast.success('Circular agendado (sin archivo aún)');
      }
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || e.message || 'No se pudo agendar'),
  });

  const items: Circular[] = circulars.data?.items ?? [];
  // El circular vigente (o el próximo): sus productos alimentan el mensaje de prueba
  const activeCircular =
    items.find((c) => c.status === 'active' || c.status === 'scheduled') || items[0] || null;

  return (
    <Stack spacing={2}>
      {/* Mensaje de prueba — el mismo flujo que el merchant: crea la lista de
          compras del cliente elegido y le manda el SMS/MMS con su link. */}
      <Stack direction="row" justifyContent="flex-end">
        <Button
          size="small"
          variant="contained"
          disabled={!activeCircular}
          onClick={() => setTestOpen(true)}
        >
          Mensaje de prueba
        </Button>
      </Stack>
      <TestMmsShoppingListModal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName || storeSlug}
        products={((activeCircular as any)?.products ?? []) as any[]}
        headline={(activeCircular as any)?.headline || ''}
        circularId={activeCircular?._id}
        circularFileUrl={activeCircular?.fileUrl}
        storeProvider={provider}
        storeInfobipSenderId={infobipSenderId}
      />
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Agendar circular
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Misma lógica que el portal del merchant: con PDF extrae productos; sin PDF queda
          agendado y el archivo se adjunta después. El cron lo activa solo al llegar la fecha.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
          <TextField size="small" label="Título" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ width: 200 }} />
          <TextField size="small" label="Inicio" type="date" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Fin" type="date" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button component="label" size="small" variant="outlined">
            {file ? file.name : 'PDF / imagen'}
            <input hidden type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={create.isPending || !start || !end}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Agendando…' : 'Agendar'}
          </Button>
        </Stack>
      </Paper>

      {circulars.isLoading ? (
        <LinearProgress />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Circular</TableCell>
                <TableCell sx={cell}>Vigencia</TableCell>
                <TableCell sx={cell}>Estado</TableCell>
                <TableCell sx={cell} align="right">Productos</TableCell>
                <TableCell sx={cell}>Archivo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell sx={cell}>{c.title || '—'}</TableCell>
                  <TableCell sx={cell}>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</TableCell>
                  <TableCell sx={cell}>
                    <Chip size="small" {...(STATUS_CHIP[c.status] || { label: c.status, color: 'default' })} />
                  </TableCell>
                  <TableCell sx={cell} align="right">
                    {(c as any).products?.length ?? 0}
                    {/* Con archivo pero sin productos: la extracción no corrió (o falló) */}
                    {c.fileUrl && !((c as any).products?.length) && (
                      <Button
                        size="small"
                        sx={{ ml: 1, minWidth: 0 }}
                        disabled={extract.isPending}
                        onClick={() => extract.mutate(c._id)}
                      >
                        {extract.isPending ? 'Extrayendo…' : 'Extraer (IA)'}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell sx={cell}>
                    {c.fileUrl ? (
                      <MuiLink href={c.fileUrl} target="_blank" rel="noopener" variant="body2">Ver</MuiLink>
                    ) : (
                      <Typography variant="caption" color="text.disabled">sin archivo</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Esta tienda no tiene circulares.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Stack>
  );
}

/* ═══════════════ 2 · Productos (catálogo Pre-RCS) ═══════════════ */

function CatalogSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const catalog = useQuery({
    queryKey: ['store-catalog-admin', storeSlug],
    queryFn: () => circularService.getCatalogAdmin(storeSlug),
    enabled: !!storeSlug,
  });
  const [search, setSearch] = useState('');

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      circularService.updateStoreProduct(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] }),
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const items: StoreProduct[] = useMemo(() => {
    const all = catalog.data?.items ?? [];
    const q = search.trim().toLowerCase();
    return q ? all.filter((p) => `${p.name} ${p.brand ?? ''}`.toLowerCase().includes(q)) : all;
  }, [catalog.data, search]);

  // Productos con oferta pero sin precio regular calculable
  const missingRegular = useMemo(
    () => (catalog.data?.items ?? []).filter((p) => !p.originalPrice?.trim() && regularFromPrice(p.price)),
    [catalog.data]
  );

  // Completa TODOS los regulares faltantes con la regla del backend (+25%).
  const fillAll = useMutation({
    mutationFn: async () => {
      for (const p of missingRegular) {
        await circularService.updateStoreProduct(p._id, {
          originalPrice: regularFromPrice(p.price)!,
          hasOffer: true,
        } as any);
      }
      return missingRegular.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} precio${n === 1 ? '' : 's'} regular${n === 1 ? '' : 'es'} calculado${n === 1 ? '' : 's'}`);
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || 'No se pudieron calcular todos');
      qc.invalidateQueries({ queryKey: ['store-catalog-admin', storeSlug] });
    },
  });

  return (
    <Stack spacing={1.5}>
      <Alert severity="info" sx={{ py: 0.5 }}>
        Estos son los productos que ve el cliente en el flujo de listas (Pre-RCS). Solo salen los
        que tienen <strong>oferta</strong> y están <strong>visibles</strong>; los switches aplican al instante.
      </Alert>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5}>
        <TextField
          size="small"
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
        />
        {missingRegular.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            disabled={fillAll.isPending}
            onClick={() => fillAll.mutate()}
          >
            {fillAll.isPending
              ? 'Calculando…'
              : `Completar ${missingRegular.length} regular${missingRegular.length === 1 ? '' : 'es'} (+25%)`}
          </Button>
        )}
      </Stack>
      {catalog.isLoading ? (
        <LinearProgress />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Producto</TableCell>
                <TableCell sx={cell}>Precio oferta</TableCell>
                <TableCell sx={cell}>Precio regular</TableCell>
                <TableCell sx={cell}>Ahorro</TableCell>
                <TableCell sx={cell} align="center">En oferta</TableCell>
                <TableCell sx={cell} align="center">Visible</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p._id} hover>
                  <TableCell sx={{ ...cell, maxWidth: 260 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                    {(p.brand || p.size) && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {[p.brand, p.size].filter(Boolean).join(' · ')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={cell}>
                    <TextField
                      size="small"
                      variant="standard"
                      defaultValue={p.price ?? ''}
                      sx={{ width: 90 }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== String(p.price ?? '')) patch.mutate({ id: p._id, body: { price: v } });
                      }}
                    />
                  </TableCell>
                  <TableCell sx={cell}>
                    <TextField
                      size="small"
                      variant="standard"
                      defaultValue={p.originalPrice ?? ''}
                      sx={{ width: 90 }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== String(p.originalPrice ?? '')) {
                          patch.mutate({ id: p._id, body: { originalPrice: v, ...(v ? { hasOffer: true } : {}) } });
                        }
                      }}
                    />
                    {/* Sin regular: se estima con la misma regla del backend (+25%) */}
                    {!p.originalPrice?.trim() && regularFromPrice(p.price) && (
                      <Tooltip title={`Calcular: ${regularFromPrice(p.price)} (oferta + 25%)`}>
                        <Button
                          size="small"
                          sx={{ ml: 0.5, minWidth: 0, px: 0.75 }}
                          disabled={patch.isPending}
                          onClick={() =>
                            patch.mutate({
                              id: p._id,
                              body: { originalPrice: regularFromPrice(p.price)!, hasOffer: true },
                            })
                          }
                        >
                          +25%
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={cell}>{p.savings || '—'}</TableCell>
                  <TableCell sx={cell} align="center">
                    <Switch
                      size="small"
                      checked={!!p.onPromotion}
                      onChange={(e) => patch.mutate({ id: p._id, body: { onPromotion: e.target.checked } })}
                    />
                  </TableCell>
                  <TableCell sx={cell} align="center">
                    <Switch
                      size="small"
                      checked={p.visibleInRcs !== false}
                      onChange={(e) => patch.mutate({ id: p._id, body: { visibleInRcs: e.target.checked } })}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Sin productos en el catálogo.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Stack>
  );
}

/* ═══════════════ 3 · Listas Pre-RCS (validar) ═══════════════ */

function ListsSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ShoppingListStatus | 'all'>('all');
  const [detail, setDetail] = useState<AdminShoppingList | null>(null);

  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled: !!storeSlug,
  });
  const lists = useQuery({
    queryKey: shoppingListsQK.lists(storeSlug, status),
    queryFn: () =>
      shoppingListsService.lists({ storeSlug, status: status === 'all' ? undefined : status, limit: 50 }),
    enabled: !!storeSlug,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['shopping-lists'] });
  };

  const validate = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.validate(qrCode),
    onSuccess: (d) => { toast.success(`Lista validada · +${d.pointsAwarded} pts acreditados`); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo validar'),
  });
  const extend = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { extendHours: 24 }),
    onSuccess: () => { toast.success('Vigencia extendida 24 h'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo extender'),
  });
  const reopen = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { status: 'pending' }),
    onSuccess: () => { toast.success('Lista reabierta'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo reabrir'),
  });

  const s = summary.data;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(
          [
            ['all', `Todas${s ? ` (${s.total})` : ''}`],
            ['pending', `Pendientes${s ? ` (${s.pending})` : ''}`],
            ['validated', `Validadas${s ? ` (${s.validated})` : ''}`],
            ['expired', `Vencidas${s ? ` (${s.expired})` : ''}`],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            size="small"
            label={label}
            color={status === value ? 'primary' : 'default'}
            onClick={() => setStatus(value)}
          />
        ))}
        {s && (
          <Chip size="small" variant="outlined" label={`${s.pointsAwarded} pts acreditados`} sx={{ ml: 'auto' }} />
        )}
      </Stack>

      {lists.isLoading ? (
        <LinearProgress />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>QR</TableCell>
                <TableCell sx={cell}>Cliente</TableCell>
                <TableCell sx={cell} align="right">Items</TableCell>
                <TableCell sx={cell} align="right">Puntos</TableCell>
                <TableCell sx={cell}>Estado</TableCell>
                <TableCell sx={cell}>Creada</TableCell>
                <TableCell sx={cell} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(lists.data?.items ?? []).map((l) => (
                <TableRow key={l._id} hover sx={{ cursor: 'pointer' }} onClick={() => setDetail(l)}>
                  <TableCell sx={{ ...cell, fontFamily: 'monospace' }}>{l.qrCode}</TableCell>
                  <TableCell sx={cell}>
                    <Typography variant="body2" fontWeight={600}>{l.customerName || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.customerPhone}</Typography>
                  </TableCell>
                  <TableCell sx={cell} align="right">{l.totalItems}</TableCell>
                  <TableCell sx={cell} align="right">{l.pointsAwarded || '—'}</TableCell>
                  <TableCell sx={cell}>
                    <Chip size="small" {...(STATUS_CHIP[l.status] || { label: l.status, color: 'default' })} />
                  </TableCell>
                  <TableCell sx={cell}>{fmtDate(l.createdAt)}</TableCell>
                  <TableCell sx={cell} align="right" onClick={(e) => e.stopPropagation()}>
                    {l.status !== 'validated' && (
                      <Tooltip title="Validar todos los productos y acreditar puntos">
                        <Button size="small" onClick={() => validate.mutate(l.qrCode)} disabled={validate.isPending}>
                          Validar
                        </Button>
                      </Tooltip>
                    )}
                    {l.status === 'expired' && (
                      <Button size="small" onClick={() => extend.mutate(l.qrCode)} disabled={extend.isPending}>
                        +24h
                      </Button>
                    )}
                    {l.status === 'validated' && (
                      <Button size="small" color="warning" onClick={() => reopen.mutate(l.qrCode)} disabled={reopen.isPending}>
                        Reabrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!lists.data?.items?.length && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Sin listas.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'monospace' }}>{detail?.qrCode}</DialogTitle>
        <DialogContent dividers>
          <Stack divider={<Divider flexItem />}>
            {(detail?.items ?? []).map((it, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
                <Typography variant="body2">
                  {it.quantity}× {it.name}
                  {detail?.validatedItems?.some((n) => n.toLowerCase() === it.name.toLowerCase()) && ' ✓'}
                </Typography>
                <Typography variant="body2" color="text.secondary">{it.price}</Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

/* ═══════════════ 4 · Compras (recibos) ═══════════════ */

function PurchasesSection({ storeSlug }: { storeSlug: string }) {
  const purchases = useQuery({
    queryKey: shoppingListsQK.purchases(storeSlug),
    queryFn: () => shoppingListsService.purchases(storeSlug),
    enabled: !!storeSlug,
  });

  if (purchases.isLoading) return <LinearProgress />;
  const d = purchases.data;
  if (!d) return <Alert severity="warning">No se pudieron leer las compras.</Alert>;

  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        {(
          [
            ['Recibos escaneados', d.totals.receipts],
            ['Validados', d.totals.success],
            ['Rechazados', d.totals.failed],
            ['Puntos acreditados', d.totals.pointsAwarded],
            ['Gasto detectado', money(d.totals.spend)],
          ] as const
        ).map(([label, value]) => (
          <Grid item xs={6} sm={2.4} key={label}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={800}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle2" fontWeight={700}>
        Qué compró cada cliente
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          tenga o no puntos, esté o no en la base
        </Typography>
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={cell}>Cliente</TableCell>
              <TableCell sx={cell} align="right">Recibos</TableCell>
              <TableCell sx={cell} align="right">Productos</TableCell>
              <TableCell sx={cell} align="right">Puntos</TableCell>
              <TableCell sx={cell} align="right">Gasto</TableCell>
              <TableCell sx={cell}>Último recibo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {d.customers.map((c) => (
              <TableRow key={c.customerId} hover>
                <TableCell sx={cell}>
                  <Typography variant="body2" fontWeight={600}>
                    {c.customerName || c.customerPhone || c.customerId}
                  </Typography>
                  {!c.inDatabase && <Chip size="small" label="fuera de la base" sx={{ height: 18, fontSize: 11 }} />}
                </TableCell>
                <TableCell sx={cell} align="right">{c.receipts}</TableCell>
                <TableCell sx={cell} align="right">{c.products}</TableCell>
                <TableCell sx={cell} align="right">{c.points}</TableCell>
                <TableCell sx={cell} align="right">{money(c.spend)}</TableCell>
                <TableCell sx={cell}>{fmtDate(c.lastReceiptAt)}</TableCell>
              </TableRow>
            ))}
            {!d.customers.length && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Todavía no hay recibos escaneados.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {d.topProducts.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700}>Productos más comprados (según recibos)</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={cell}>Producto</TableCell>
                  <TableCell sx={cell} align="right">Unidades</TableCell>
                  <TableCell sx={cell} align="right">Recibos</TableCell>
                  <TableCell sx={cell} align="right">En oferta</TableCell>
                  <TableCell sx={cell} align="right">Ingreso</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.topProducts.map((p) => (
                  <TableRow key={p.name} hover>
                    <TableCell sx={{ ...cell, maxWidth: 280 }}>
                      <Typography variant="body2" noWrap>{p.name}</Typography>
                    </TableCell>
                    <TableCell sx={cell} align="right">{p.quantity}</TableCell>
                    <TableCell sx={cell} align="right">{p.receipts}</TableCell>
                    <TableCell sx={cell} align="right">{p.matchedReceipts}</TableCell>
                    <TableCell sx={cell} align="right">{money(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Stack>
  );
}

/* ═══════════════ Panel ═══════════════ */

export default function StoreCircularPanel({ storeId, storeSlug, storeName, provider, infobipSenderId }: Props) {
  const [tab, setTab] = useState(0);

  if (!storeSlug) {
    return (
      <Box p={3}>
        <Alert severity="warning">Esta tienda no tiene slug: el Pre-RCS trabaja por slug.</Alert>
      </Box>
    );
  }

  return (
    <Box px={{ xs: 1, md: 2 }} pt={2} pb={4}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Circular & Listas {storeName ? `· ${storeName}` : ''}
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
        <Tab icon={<CalendarMonthRoundedIcon fontSize="small" />} iconPosition="start" label="Circular" />
        <Tab icon={<Inventory2OutlinedIcon fontSize="small" />} iconPosition="start" label="Productos" />
        <Tab icon={<FactCheckOutlinedIcon fontSize="small" />} iconPosition="start" label="Listas" />
        <Tab icon={<ReceiptLongRoundedIcon fontSize="small" />} iconPosition="start" label="Compras" />
      </Tabs>
      {tab === 0 && (
        <CircularSection
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          provider={provider}
          infobipSenderId={infobipSenderId}
        />
      )}
      {tab === 1 && <CatalogSection storeSlug={storeSlug} />}
      {tab === 2 && <ListsSection storeSlug={storeSlug} />}
      {tab === 3 && <PurchasesSection storeSlug={storeSlug} />}
    </Box>
  );
}
