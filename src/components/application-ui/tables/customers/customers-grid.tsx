'use client';

import { Box, CircularProgress, Unstable_Grid2 as Grid, Typography, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Results from './results';
import { customerClient } from '@/services/customerService';
import { useAuth } from '@/hooks/use-auth';

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

export default function CustomersGrid({ storeId, storeName }: CustomersGridProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const { user } = useAuth();
  const isJuan = user?.email === 'juancarlos@sweepstouch.com';

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['customers', storeId, { page, limit, search }],
    queryFn: () => customerClient.getCustomersByStore(storeId, page, limit),
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
   * Utilidad: cambia exactamente DOS dígitos del string,
   * preservando posiciones no numéricas (espacios, guiones, +, etc.).
   * NUEVA REGLA: No modifica los primeros 3 dígitos reales del número.
   */
  function obfuscateTwoDigitsKeepFormat(input: string): string {
    if (!input) return input;

    // Índices (en el string) donde hay dígitos
    const digitIdx: number[] = [];
    for (let i = 0; i < input.length; i++) {
      if (/\d/.test(input[i])) digitIdx.push(i);
    }
    // Si hay menos de 5 dígitos, podría no haber 2 elegibles luego de los primeros 3
    if (digitIdx.length <= 3) return input;

    // Elegibles = todos los dígitos excepto los 3 primeros por orden
    const eligible = digitIdx.slice(3);
    if (eligible.length < 2) return input;

    // Elegir dos posiciones distintas dentro de eligible
    const pickIndex = () => Math.floor(Math.random() * eligible.length);
    let i1 = pickIndex();
    let i2 = pickIndex();
    while (i2 === i1) i2 = pickIndex();

    const pos1 = eligible[i1];
    const pos2 = eligible[i2];

    const chars = input.split('');
    const randomDigit = () => Math.floor(Math.random() * 10).toString();

    // Reemplazos: intenta que no repitan exactamente el dígito anterior
    const old1 = chars[pos1];
    let rep1 = randomDigit();
    if (eligible.length > 2) {
      let tries = 5;
      while (tries-- > 0 && rep1 === old1) rep1 = randomDigit();
    }
    chars[pos1] = rep1;

    const old2 = chars[pos2];
    let rep2 = randomDigit();
    if (eligible.length > 2) {
      let tries = 5;
      while (tries-- > 0 && (rep2 === old2 || rep2 === rep1)) rep2 = randomDigit();
    }
    chars[pos2] = rep2;

    return chars.join('');
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
      const obfuscated = allPhones.map((p) => obfuscateTwoDigitsKeepFormat(p));

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

  return (
    <Grid container
      spacing={2}>
      <Grid xs={12}>
        {/* Botón alterno SOLO para usuarios distintos de juancarlos@sweepstouch.com */}
        {!isJuan && (
          <Box mb={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportDatos}
              disabled={exporting}
            >
              Exportar datos
            </Button>
          </Box>
        )}

        <Results
          onExportPdf={isJuan ? handleExportPdf : (undefined as any)}
          exporting={exporting}
          customers={data?.data || []}
          total={data?.total || 0}
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
        />
      </Grid>
    </Grid>
  );
}
