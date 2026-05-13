// components/cashiers/CajerasPanel.tsx
'use client';

import AudienceWeekSummary from '@/components/application-ui/metrics/AudienceWeekSummary';
import CashiersTable from '@/components/application-ui/tables/cashiers/cashiers-table';
import SmsAuditPanel from './SmsAuditPanel';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Assessment, ManageAccounts, Sms } from '@mui/icons-material';
import { endOfWeek, formatISO, startOfWeek } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

interface CajerasPanelProps {
  storeId: string;
  storeName?: string;
  customerCount?: number;
}

export default function CajerasPanel({ storeId, storeName, customerCount }: CajerasPanelProps) {
  const now = new Date();
  const s0 = startOfWeek(now, { weekStartsOn: 1 });
  const e0 = endOfWeek(now, { weekStartsOn: 1 });

  const [startDate, setStartDate] = useState(formatISO(s0, { representation: 'date' }));
  const [endDate, setEndDate] = useState(formatISO(e0, { representation: 'date' }));
  const [activeTab, setActiveTab] = useState(0);

  const handleRangeChange = useCallback((startISO: string, endISO: string) => {
    setStartDate(startISO);
    setEndDate(endISO);
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
        Análisis de Cajeras {storeName ? `· ${storeName}` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Selecciona una semana para ver crecimiento de audiencia, ranking y auditoría de SMS.
      </Typography>

      {/* Tab navigation */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" label="Ranking & Métricas" />
        <Tab icon={<ManageAccounts sx={{ fontSize: 18 }} />} iconPosition="start" label="Gestión de Cajeras" />
        <Tab icon={<Sms sx={{ fontSize: 18 }} />} iconPosition="start" label="Auditoría SMS" />
      </Tabs>

      {/* Tab 0 — Ranking & Audience */}
      {activeTab === 0 && (
        <>
          <AudienceWeekSummary
            cusomerCount={customerCount}
            storeId={storeId}
            startDate={startDate}
            endDate={endDate}
            onChange={handleRangeChange}
          />
        </>
      )}

      {/* Tab 1 — Cashier management table */}
      {activeTab === 1 && (
        <CashiersTable storeId={storeId} />
      )}

      {/* Tab 2 — SMS Audit */}
      {activeTab === 2 && (
        <SmsAuditPanel
          storeId={storeId}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </Box>
  );
}
