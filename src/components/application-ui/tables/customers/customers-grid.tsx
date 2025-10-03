'use client';

import { Box, CircularProgress, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Results from './results';
import { customerClient } from '@/services/customerService';

interface CustomersGridProps {
  storeId: string;
}

export default function CustomersGrid({ storeId }: CustomersGridProps) {
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
        import('jspdf-autotable')
      ]);
      const autoTable: any = (autoTableModule as any).default || (autoTableModule as any);

      let all: any[] = [];
      let pageCursor = 1;
      const pageSize = 500;
      while (true) {
        const res: any = await customerClient.getCustomersByStore(storeId, pageCursor, pageSize);
        all = all.concat(res?.data || []);
        if (!res?.total || all.length >= res.total || (res.data || []).length === 0) break;
        pageCursor += 1;
        if (pageCursor > 1000) break;
      }

      const doc = new jsPDF();
      const head = [['Name', 'Phone', 'ZIP', 'Created']];
      const body = all.map((c: any) => [
        [c.firstName, c.lastName].filter(Boolean).join(' ') || '—',
        ('+' + c.phoneNumber),
        c.zipCode || '',
        (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '')
      ]);

      autoTable(doc, { head, body, styles: { fontSize: 8 }, headStyles: { fillColor: [33, 150, 243] } });
      doc.save(`customers_${storeId}.pdf`);
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('No se pudo generar el PDF. Revisa la consola.');
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
