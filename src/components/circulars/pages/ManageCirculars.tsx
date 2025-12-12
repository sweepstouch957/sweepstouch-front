// src/components/circulars/ManageCirculars.tsx
'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

import { MetricCard } from '../MetricCard';

import type { Circular } from '@services/circular.service';
import { useManageCircularsData } from '@/hooks/fetching/circulars/useManageCircularsData';
import { PreviewCircularDialog, PreviewTarget } from '@/components/application-ui/dialogs/circular/circularPreview';
import { EditCircularDialog, EditTarget } from '@/components/application-ui/dialogs/circular/EditCircularDialog';
import { CircularsTable, PreviewLabel } from '../tables/CircularsTable';

const ManageCirculars: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error } = useManageCircularsData(search);

  const totals = data?.totals || { active: 0, scheduled: 0, expired: 0 };
  const rows = data?.rows || [];

  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const handlePreview = (circular: Circular, storeName: string, label: PreviewLabel) => {
    if (!circular.fileUrl) return;
    setPreviewTarget({ circular, storeName, label });
  };

  const handleEdit = (circular: Circular, storeName: string) => {
    setEditTarget({ circular, storeName });
  };

  const handleClosePreview = () => setPreviewTarget(null);
  const handleCloseEdit = () => setEditTarget(null);

  const handleSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['circulars', 'manage'] });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}
        >
          Manage Circulars
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: '#718096' }}
        >
          Manage circular schedule of stores
        </Typography>
      </Box>

      {/* Loading / Error */}
      {isLoading && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
          <CircularProgress size={20} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Cargando datos…
          </Typography>
        </Box>
      )}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          Error cargando circulares: {String((error as any)?.message || 'desconocido')}
        </Alert>
      )}

      {/* Metrics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <MetricCard
          title="Active Circulars"
          value={totals.active}
          icon={TrendingUpIcon}
          borderColor="#4CAF50"
        />
        <MetricCard
          title="Scheduled"
          value={totals.scheduled}
          icon={ScheduleIcon}
          borderColor="#FF9800"
        />
        <MetricCard
          title="Expired"
          value={totals.expired}
          icon={ErrorIcon}
          borderColor="#F44336"
        />
      </Box>

      {/* Tabla reusable */}
      <CircularsTable
        rows={rows}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        onPreview={handlePreview}
        onEdit={handleEdit}
      />

      {/* Preview modal */}
      <PreviewCircularDialog
        target={previewTarget}
        onClose={handleClosePreview}
      />

      {/* Edit modal */}
      <EditCircularDialog
        target={editTarget}
        onClose={handleCloseEdit}
        onSaved={handleSaved}
      />
    </Box>
  );
};

export { ManageCirculars };
