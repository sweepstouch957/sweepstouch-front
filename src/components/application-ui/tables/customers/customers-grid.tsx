'use client';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Unstable_Grid2 as Grid,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Results from './results';
import { customerClient } from '@/services/customerService';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/libs/axios';
import { getStoreById } from '@/services/store.service';
import { listCashiers } from '@/services/cashier.service';

type ExportKind = 'completa' | 'parcial' | 'datos';

interface CustomersGridProps {
  storeId: string;
  storeName?: string;
}

function slugifyName(s?: string) {
  return (s || 'store')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin acentos
    .replace(/[^\w\s-]/g, '')                         // sin caracteres raros
    .trim()
    .replace(/\s+/g, '_')                             // espacios -> _
    .toLowerCase();
}

/**
 * Utilidad: cambia exactamente DOS d\u00edgitos del string,
 * preservando posiciones no num\u00e9ricas (espacios, guiones, +, etc.).
 * NUEVA REGLA: No modifica los primeros 3 d\u00edgitos reales del n\u00famero.
 */
function obfuscateLastTwoDigitsKeepFormat(input: string): string {
  if (!input) return input;

  // \u00cdndices (en el string) donde hay d\u00edgitos
  const digitIdx: number[] = [];
  for (let i = 0; i < input.length; i++) {
    if (/\d/.test(input[i])) digitIdx.push(i);
  }
  // Si hay menos de 5 d\u00edgitos, podr\u00eda no haber 2 elegibles luego de los primeros 3
  if (digitIdx.length < 2) return input;

  // Elegibles = todos los d\u00edgitos excepto los 3 primeros por orden
  const pos1 = digitIdx[digitIdx.length - 2];
  const pos2 = digitIdx[digitIdx.length - 1];

  const chars = input.split('');
  const randomDigit = () => Math.floor(Math.random() * 10).toString();

  // Reemplazos: intenta que no repitan exactamente el d\u00edgito anterior
  const old1 = chars[pos1];
  let rep1 = randomDigit();
  let tries = 5;
  while (tries-- > 0 && rep1 === old1) rep1 = randomDigit();
  chars[pos1] = rep1;

  const old2 = chars[pos2];
  let rep2 = randomDigit();
  tries = 5;
  while (tries-- > 0 && rep2 === old2) rep2 = randomDigit();
  chars[pos2] = rep2;

  return chars.join('');
}

const last10 = (p: string) => (p || '').replace(/\D/g, '').slice(-10);

/** Cambia los últimos 3 dígitos al azar, evitando caer en otro número que sí está en la base. */
function scrambleLastThreeDigits(input: string, taken: Set<string>): string {
  const idx: number[] = [];
  for (let i = 0; i < input.length; i++) if (/\d/.test(input[i])) idx.push(i);
  if (idx.length < 3) return input;
  const tail = idx.slice(-3);
  const chars = input.split('');
  let out = input;
  for (let tries = 0; tries < 50 && (out === input || taken.has(last10(out))); tries++) {
    const next = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    tail.forEach((pos, k) => { chars[pos] = next[k]; });
    out = chars.join('');
  }
  return out;
}

/**
 * Base parcial: los números VIP (cajeras, dueño, contactos) salen reales siempre,
 * y se completa con reales al azar hasta el 20%; el resto lleva los últimos 3 dígitos cambiados.
 * Los VIP que no están en la base se agregan igual, para que el dueño reconozca los suyos.
 */
export function buildPartialBase(phones: string[], vipPhones: string[]): string[] {
  const vipByDigits = new Map(vipPhones.filter((p) => last10(p).length === 10).map((p) => [last10(p), p]));
  const vip = new Set(vipByDigits.keys());
  const inBase = new Set(phones.map(last10));
  const extra = [...vipByDigits].filter(([d]) => !inBase.has(d)).map(([, p]) => p);
  const all = [...phones, ...extra];
  const realTarget = Math.max(Math.round(all.length * 0.2), 0);
  const order = all.map((_, i) => i).sort(() => Math.random() - 0.5);
  const real = new Set(order.filter((i) => vip.has(last10(all[i]))));
  for (const i of order) {
    if (real.size >= realTarget) break;
    real.add(i);
  }
  const taken = new Set([...inBase, ...vip]);
  return order.map((i) => (real.has(i) ? all[i] : scrambleLastThreeDigits(all[i], taken)));
}

/**
 * Utilidad: agrupar una lista en filas de N columnas (rellena con '')
 */
function toColumns<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    const slice = items.slice(i, i + columns);
    while (slice.length < columns) slice.push('' as any);
    rows.push(slice);
  }
  return rows;
}

export default function CustomersGrid({ storeId, storeName }: CustomersGridProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  // Debounce: el backend busca con $regex — sin esto dispara una query por tecla.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const [exporting, setExporting] = useState(false);

  const { user } = useAuth();
  const isJuan = user?.email === 'juancarlos@sweepstouch.com';
  const [exportOpen, setExportOpen] = useState(false);
  // La base completa sigue siendo sólo para Juan; el resto ve las versiones con números cambiados.
  const exportOptions: { value: ExportKind; label: string; hint: string }[] = [
    ...(isJuan
      ? [{ value: 'completa' as const, label: 'Base completa', hint: 'Todos los números reales, una columna.' }]
      : []),
    {
      value: 'parcial',
      label: 'Base parcial',
      hint: '80% con los últimos 3 dígitos cambiados; 20% real, incluidas cajeras, dueño y contactos de la tienda.',
    },
    ...(!isJuan
      ? [{ value: 'datos' as const, label: 'Datos', hint: 'La mitad de los números con 2 dígitos cambiados.' }]
      : []),
  ];
  const [exportKind, setExportKind] = useState<ExportKind>('parcial');

  const queryClient = useQueryClient();

  // Activar/inactivar un cliente desde la fila (switch en la tabla).
  const toggleActive = useMutation({
    mutationFn: ({ phoneNumber, active }: { phoneNumber: string; active: boolean }) =>
      customerClient.setCustomerActiveByPhone(phoneNumber, active),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['customers', storeId] }),
  });

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['customers', storeId, { page, limit, search: debouncedSearch }],
    queryFn: () => customerClient.getCustomersByStore(storeId, page, limit, debouncedSearch || undefined),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  if (isPending) {
    return (
      <Box display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center"
        py={4}>
        <Typography color="error"
          variant="body1">
          Failed to load customers.
        </Typography>
      </Box>
    );
  }

  /**
   * Exportación original: todos los phones, 1 columna, sin cambios.
   * (se mantiene para juancarlos@sweepstouch.com)
   */
  async function handleExportPdf() {
    try {
      setExporting(true);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable: any = (autoTableModule as any).default || (autoTableModule as any);

      // Recolectar TODOS los registros pero solo el phoneNumber (formateado tal cual)
      let all: any[] = [];
      let pageCursor = 1;
      const pageSize = 500;

      while (true) {
        const res: any = await customerClient.getCustomersByStore(storeId, pageCursor, pageSize);
        const pageData = (res?.data || []).map((c: any) => {
          const phone = c?.phoneNumber ?? '';
          return [phone];
        });
        all = all.concat(pageData);

        if (!res?.total || all.length >= res.total || (res?.data || []).length === 0) break;
        pageCursor += 1;
        if (pageCursor > 2000) break; // safety
      }

      const safeName = slugifyName(storeName) || storeId || 'store';
      const doc = new jsPDF();

      autoTable(doc, {
        body: all,
        theme: 'plain',
        styles: { fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { textColor: [0, 0, 0] },
      });

      doc.save(`customers_phones_${safeName}.pdf`);
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('No se pudo generar el PDF. Revisa la consola para más detalles.');
    } finally {
      setExporting(false);
    }
  }

  /**
   * Exportación "Exportar datos" para NO-Juan:
   * - Toma phoneNumber
   * - Modifica 2 dígitos aleatorios por número, sin tocar los primeros 3 dígitos reales
   * - Exporta en PDF con 4 columnas
   */
  async function handleExportDatos() {
    try {
      setExporting(true);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable: any = (autoTableModule as any).default || (autoTableModule as any);

      // Recolectar todos los phoneNumber
      let allPhones: string[] = [];
      let pageCursor = 1;
      const pageSize = 500;

      while (true) {
        const res: any = await customerClient.getCustomersByStore(storeId, pageCursor, pageSize);
        const pageData = (res?.data || []).map((c: any) => (c?.phoneNumber ?? '').toString());
        allPhones = allPhones.concat(pageData);

        if (!res?.total || allPhones.length >= res.total || (res?.data || []).length === 0) break;
        pageCursor += 1;
        if (pageCursor > 2000) break; // safety
      }

      // Ofuscar 2 dígitos por número (sin tocar los primeros 3 dígitos reales)
      const shuffledIndexes = allPhones.map((_, index) => index);
      for (let i = shuffledIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndexes[i], shuffledIndexes[j]] = [shuffledIndexes[j], shuffledIndexes[i]];
      }

      const indexesToMask = new Set(shuffledIndexes.slice(0, Math.floor(allPhones.length / 2)));
      const obfuscated = allPhones.map((phone, index) =>
        indexesToMask.has(index) ? obfuscateLastTwoDigitsKeepFormat(phone) : phone
      );

      // Pasar a 4 columnas
      const body = toColumns<string>(obfuscated, 4);

      const safeName = slugifyName(storeName) || storeId || 'store';
      const doc = new jsPDF();

      autoTable(doc, {
        body,
        theme: 'plain',
        styles: { fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { textColor: [0, 0, 0] },
        // sin encabezados; solo valores en 4 columnas
      });

      doc.save(`customers_phones_masked_${safeName}.pdf`);
    } catch (err) {
      console.error('Export Datos failed', err);
      alert('No se pudo generar el PDF de datos. Revisa la consola para más detalles.');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportParcial() {
    try {
      setExporting(true);
      const [{ jsPDF }, autoTableModule, store, cashiers] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        getStoreById(storeId),
        listCashiers({ storeId, limit: 200 }),
      ]);
      const autoTable: any = (autoTableModule as any).default || (autoTableModule as any);

      let allPhones: string[] = [];
      for (let p = 1; p <= 2000; p++) {
        const res: any = await customerClient.getCustomersByStore(storeId, p, 500);
        const rows = res?.data || [];
        allPhones = allPhones.concat(rows.map((c: any) => (c?.phoneNumber ?? '').toString()));
        if (!res?.total || allPhones.length >= res.total || rows.length === 0) break;
      }

      const ownerIds = [store?.ownerId, (store as any)?.owner].filter(Boolean).join(',');
      const owners: any = ownerIds
        ? (await api.get('/auth/users', { params: { ids: ownerIds } }).catch(() => ({ data: [] }))).data
        : [];
      const vip = [
        ...(cashiers?.data || []).map((c) => c.phoneNumber || c.phone || ''),
        ...(Array.isArray(owners) ? owners : owners?.data || []).map((u: any) => u?.phoneNumber || ''),
        ...((store as any)?.contactInfo || []).map((c: any) => c?.phone || ''),
      ];

      const doc = new jsPDF();
      autoTable(doc, {
        body: toColumns<string>(buildPartialBase(allPhones, vip), 4),
        theme: 'plain',
        styles: { fontSize: 10, textColor: [0, 0, 0] },
      });
      doc.save(`customers_phones_parcial_${slugifyName(storeName) || storeId}.pdf`);
    } catch (err) {
      console.error('Export parcial failed', err);
      alert('No se pudo generar la base parcial. Revisa la consola para más detalles.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Grid container
      spacing={2}>
      <Grid xs={12}>
        <Results
          onExportPdf={() => setExportOpen(true)}
          exporting={exporting}
          customers={data?.data || []}
          total={data?.total || 0}
          stats={data?.stats}
          page={data?.page || page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          search={search}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(1);
          }}
          isLoading={isFetching}
          onToggleActive={(c, next) => {
            if (c.phoneNumber) toggleActive.mutate({ phoneNumber: c.phoneNumber, active: next });
          }}
          togglingPhone={toggleActive.isPending ? (toggleActive.variables?.phoneNumber ?? null) : null}
        />
      </Grid>

      <Dialog
        open={exportOpen}
        onClose={() => !exporting && setExportOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Exportar PDF</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={exportKind}
            onChange={(e) => setExportKind(e.target.value as ExportKind)}
          >
            {exportOptions.map((o) => (
              <FormControlLabel
                key={o.value}
                value={o.value}
                control={<Radio />}
                sx={{ alignItems: 'flex-start', mb: 1.5, '& .MuiRadio-root': { pt: 0.25 } }}
                label={
                  <Box>
                    <Typography fontWeight={600}>{o.label}</Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {o.hint}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setExportOpen(false)}
            disabled={exporting}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={16}
color="inherit" /> : <PictureAsPdf />}
            disabled={exporting}
            onClick={async () => {
              await { completa: handleExportPdf, parcial: handleExportParcial, datos: handleExportDatos }[exportKind]();
              setExportOpen(false);
            }}
          >
            {exporting ? 'Generando…' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
