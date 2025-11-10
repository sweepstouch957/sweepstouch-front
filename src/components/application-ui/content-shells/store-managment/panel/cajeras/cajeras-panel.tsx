// components/cashiers/CajerasPanel.tsx
'use client';

import AudienceWeekSummary from '@/components/application-ui/metrics/AudienceWeekSummary';
import CashiersTable from '@/components/application-ui/tables/cashiers/cashiers-table';
import { Box, Typography } from '@mui/material';
import { endOfWeek, formatISO, startOfWeek } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

interface CajerasPanelProps {
  storeId: string;
  storeName?: string;
}

export default function CajerasPanel({ storeId, storeName }: CajerasPanelProps) {
  // inicial: semana actual bloqueada (YYYY-MM-DD)
  const now = new Date();
  const s0 = startOfWeek(now, { weekStartsOn: 1 });
  const e0 = endOfWeek(now, { weekStartsOn: 1 });

  const [startDate, setStartDate] = useState(formatISO(s0, { representation: 'date' }));
  const [endDate, setEndDate] = useState(formatISO(e0, { representation: 'date' }));

  const startISOFull = useMemo(() => `${startDate}T00:00:00.000Z`, [startDate]);
  const endISOFull = useMemo(() => `${endDate}T23:59:59.999Z`, [endDate]);

  const handleRangeChange = useCallback((startISO: string, endISO: string) => {
    // vienen como YYYY-MM-DD
    setStartDate(startISO);
    setEndDate(endISO);
  }, []);

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{ mb: 0.5 }}
      >
        Análisis de Cajeras {storeName ? `· ${storeName}` : ''}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Selecciona una semana para ver crecimiento de audiencia y ranking.
      </Typography>

      {/* Resumen + selector semanal + gráfica */}
      <AudienceWeekSummary
        storeId={storeId}
        startDate={startDate}
        endDate={endDate}
        onChange={handleRangeChange}
      />

      <CashiersTable
        storeId={storeId}
      />
    </Box>
  );
}
