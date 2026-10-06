'use client';

/**
 * Comparativo: lo que el cliente ve HOY vs. lo que va a ver cuando entre el próximo circular o
 * flyer agendado. Producto por producto (nombre normalizado): sigue igual, cambia de precio,
 * entra nuevo, sale. Es lo que la encargada necesita para aprobar la semana que viene de un
 * vistazo, sin abrir los dos PDFs.
 */
import { circularService, type Circular } from '@/services/circular.service';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { qk, useStoreCirculars } from './hooks';
import { SectionHeader, Surface } from './panelUi';
import { circularLabel, fmtDate } from './shared';

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const keyOf = (p: any) => norm(p?.sku || p?.name);
const isFlyer = (c: Circular) => !!c.campaign || c.fileKey === 'campaign';

type Row = { name: string; from?: string; to?: string };
type Diff = { same: number; changed: Row[]; added: Row[]; removed: Row[] };

function diff(cur: any[], next: any[]): Diff {
  const a = new Map(cur.map((p) => [keyOf(p), p]));
  const b = new Map(next.map((p) => [keyOf(p), p]));
  const out: Diff = { same: 0, changed: [], added: [], removed: [] };
  for (const [k, p] of b) {
    const q = a.get(k);
    if (!q) out.added.push({ name: p.name, to: p.price });
    else if (norm(q.price) !== norm(p.price))
      out.changed.push({ name: p.name, from: q.price, to: p.price });
    else out.same += 1;
  }
  for (const [k, q] of a) if (!b.has(k)) out.removed.push({ name: q.name, from: q.price });
  return out;
}

function useDetail(id?: string) {
  return useQuery({
    queryKey: qk.circular(id),
    queryFn: () => circularService.getCircular(id!),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 60_000,
  });
}

export default function CircularCompare({
  storeSlug,
  storeName,
  onOpenUpcoming,
}: {
  storeSlug: string;
  storeName?: string;
  onOpenUpcoming: () => void;
}) {
  const { items, flyers } = useStoreCirculars(storeSlug);
  const now = Date.now();
  // Hoy: regla de la lista (flyer de campaña vivo gana; si no, el circular semanal vigente).
  // Después: lo primero que arranca más adelante, sea flyer o circular.
  const { current, next } = useMemo(() => {
    const all = [...flyers, ...items].filter((c) => ['active', 'scheduled'].includes(c.status));
    const live = all.filter((c) => Date.parse(c.startDate) <= now && Date.parse(c.endDate) >= now);
    const cur = live.find(isFlyer) || live.find((c) => !isFlyer(c)) || null;
    const nxt =
      all
        .filter((c) => Date.parse(c.startDate) > now)
        .sort((x, y) => Date.parse(x.startDate) - Date.parse(y.startDate))[0] || null;
    return { current: cur, next: nxt };
  }, [items, flyers, now]);

  const curQ = useDetail(current?._id);
  const nextQ = useDetail(next?._id);
  const [open, setOpen] = useState<'changed' | 'added' | 'removed' | null>(null);

  const d = useMemo(
    () => diff(curQ.data?.products || [], nextQ.data?.products || []),
    [curQ.data, nextQ.data]
  );

  if (!next) return null;

  const col = (c: Circular | null, tag: string) => (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        lineHeight={1.4}
      >
        {tag}
      </Typography>
      <Typography
        variant="subtitle2"
        fontWeight={800}
        noWrap
      >
        {c ? circularLabel(c, storeSlug, storeName) : 'Nada vigente hoy'}
      </Typography>
      {c && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {fmtDate(c.startDate)} → {fmtDate(c.endDate)} ·{' '}
          {c.productCount ?? c.products?.length ?? 0} productos ·{' '}
          {isFlyer(c) ? 'flyer de campaña' : 'circular semanal'}
        </Typography>
      )}
    </Box>
  );

  const rows = open ? d[open] : [];
  const loading = curQ.isLoading || nextQ.isLoading;

  return (
    <Surface>
      <Stack spacing={1.5}>
        <SectionHeader
          step={<CompareArrowsRoundedIcon fontSize="small" />}
          title="Hoy vs. lo que sigue"
          description={`El ${fmtDate(
            next.startDate
          )} la lista cambia. Esto es lo que entra, lo que sale y qué precios cambian.`}
          action={
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenUpcoming}
            >
              Revisar en Próximos
            </Button>
          }
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.5}
        >
          {col(current, 'Hoy')}
          {col(next, `Desde el ${fmtDate(next.startDate)}`)}
        </Stack>
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          <Chip
            label={loading ? 'Comparando…' : `${d.same} siguen igual`}
            variant="outlined"
          />
          <Chip
            color="warning"
            variant={open === 'changed' ? 'filled' : 'outlined'}
            label={`${d.changed.length} cambian de precio`}
            onClick={() => setOpen(open === 'changed' ? null : 'changed')}
            disabled={!d.changed.length}
          />
          <Chip
            color="success"
            variant={open === 'added' ? 'filled' : 'outlined'}
            label={`${d.added.length} nuevos`}
            onClick={() => setOpen(open === 'added' ? null : 'added')}
            disabled={!d.added.length}
          />
          <Chip
            color="default"
            variant={open === 'removed' ? 'filled' : 'outlined'}
            label={`${d.removed.length} salen`}
            onClick={() => setOpen(open === 'removed' ? null : 'removed')}
            disabled={!d.removed.length}
          />
        </Stack>
        <Collapse
          in={!!open}
          unmountOnExit
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Hoy</TableCell>
                <TableCell align="right">Después</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(0, 60).map((r, i) => (
                <TableRow key={`${r.name}-${i}`}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: 'text.secondary' }}
                  >
                    {r.from || '—'}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    {r.to || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > 60 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1, textTransform: 'none', letterSpacing: 0 }}
            >
              Se muestran 60 de {rows.length}. El detalle completo está en Próximos.
            </Typography>
          )}
        </Collapse>
      </Stack>
    </Surface>
  );
}
