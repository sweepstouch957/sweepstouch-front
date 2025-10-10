'use client';

import { Box, CircularProgress, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Results from './results';
import { customerClient } from '@/services/customerService';

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
    .toLowerCase()
}

export default function CustomersGrid({ storeId, storeName }: CustomersGridProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);


  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['customers', storeId, { page, limit, search }],
    queryFn: () => customerClient.getCustomersByStore(storeId, page, limit),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  if (isPending) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        py={4}>
        <Typography
          color="error"
          variant="body1">
          Failed to load customers.
        </Typography>
      </Box>
    );
  }


  async function handleExportPdf() {
    try {
      setExporting(true);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable: any = (autoTableModule as any).default || (autoTableModule as any);

      // Recolectar TODOS los registros pero solo el phoneNumber (formateado)
      let all: any[] = [];
      let pageCursor = 1;
      const pageSize = 500;

      while (true) {
        const res: any = await customerClient.getCustomersByStore(storeId, pageCursor, pageSize);
        const pageData = (res?.data || []).map((c: any) => {
          const phone = (c?.phoneNumber);
          return [phone];
        });
        all = all.concat(pageData);

        if (!res?.total || all.length >= res.total || (res?.data || []).length === 0) break;
        pageCursor += 1;
        if (pageCursor > 2000) break; // safety
      }
      const safeName = slugifyName(storeName) || storeId || 'store';
      const doc = new jsPDF();

      // Solo una columna y sin colores/striped
      autoTable(doc, {
        body: all,
        theme: 'plain',              // elimina striped y fondos
        styles: { fontSize: 10, textColor: [0, 0, 0] },  // negro
        headStyles: { textColor: [0, 0, 0] },            // header en negro
        // Si quieres sin bordes: styles: { lineWidth: 0 }
      });

      doc.save(`customers_phones_${safeName}.pdf`);
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('No se pudo generar el PDF. Revisa la consola para más detalles.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Grid
      container
      spacing={2}>
      <Grid xs={12}>
        <Results
          onExportPdf={handleExportPdf}
          exporting={exporting}
          customers={data?.data || []}
          total={data?.total || 0}
          page={data?.page || page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          search={search}
          onSearchChange={(s) => { setSearch(s); setPage(1); }}
          isLoading={isFetching}
        />
      </Grid>
    </Grid>
  );
}
