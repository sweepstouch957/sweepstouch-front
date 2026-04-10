'use client';

import { budgetService } from '@/services/budget.service';
import { shiftService } from '@/services/shift.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReportIcon from '@mui/icons-material/Report';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import KpiCard from '../../card-shells/kpi-card';
import AdjustBudgetModal from '../../dialogs/budget/modal';
import { useAuth } from '@/hooks/use-auth';

interface KpiCardsProps {
  totalToPay?: number;
}
export default function KpiCards(props: KpiCardsProps) {
  const { totalToPay } = props;
  const { user } = useAuth();
  const canEditBudget = user?.role === 'admin' || user?.role === 'promotor_manager';

  // Turnos
  const { data: shiftData, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['shift-metrics'],
    queryFn: () => shiftService.getShiftMetrics(),
  });

  // Budget actual
  const { data: budgetData, isLoading: isBudgetLoading } = useQuery({
    queryKey: ['budget', 'current'],
    queryFn: () => budgetService.getCurrent(),
    staleTime: 30_000,
  });

  const fmtUsd = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    []
  );

  const isLoading = isShiftsLoading || isBudgetLoading;

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const kpis = [
    {
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 24 }} />,
      label: 'Disponible (USD)',
      value: budgetData?.availableUsd != null ? fmtUsd.format(budgetData.availableUsd) : '—',
      variant: 'success' as const,
      descriptions: totalToPay ? `A pagar: ${fmtUsd.format(totalToPay)}` : undefined,
      tooltip: canEditBudget ? 'Haz clic para ajustar el presupuesto semanal' : undefined,
      onClick: canEditBudget ? () => setIsAdjustModalOpen(true) : undefined,
    },
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 24 }} />,
      label: 'Total Turnos',
      value: shiftData?.total ?? 0,
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 24 }} />,
      label: 'En Progreso',
      value: shiftData?.inProgress ?? 0,
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 24 }} />,
      label: 'Programados',
      value: shiftData?.scheduled ?? 0,
    },
    {
      icon: <ReportIcon sx={{ fontSize: 24 }} />,
      label: 'Sin Asignar',
      value: shiftData?.unassigned ?? 0,
    },
  ];

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rounded"
                height={120}
                animation="wave"
              />
            ))
          : kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                icon={kpi.icon}
                label={kpi.label}
                value={kpi.value}
                variant={kpi.variant}
                descriptions={kpi.descriptions}
                tooltip={kpi.tooltip}
                onClick={kpi.onClick}
              />
            ))}
      </Box>

      <AdjustBudgetModal
        open={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        currentBudget={budgetData?.budgetUsd}
      />
    </>
  );
}
