'use client';

import * as React from 'react';
import { Box, Card, Stack, Typography, Chip, Button } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

/* ─────────────────────────────────────────────────────────────────────────
   Date range (global filter para los frentes del monitor)
   ───────────────────────────────────────────────────────────────────────── */
export interface DateRange {
  from?: string; // ISO
  to?: string;   // ISO
  label: string;
}

export const DATE_PRESETS: { key: string; label: string; days: number | null }[] = [
  { key: '7d', label: '7 días', days: 7 },
  { key: '30d', label: '30 días', days: 30 },
  { key: '90d', label: '90 días', days: 90 },
  { key: 'all', label: 'Todo', days: null },
];

export function rangeFromDays(days: number | null, label: string): DateRange {
  if (days == null) return { label };
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  return { from: from.toISOString(), to: to.toISOString(), label };
}

export function DateRangeChips({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75}>
      {DATE_PRESETS.map((p) => {
        const active = value.label === p.label;
        return (
          <Chip
            key={p.key}
            label={p.label}
            onClick={() => onChange(rangeFromDays(p.days, p.label))}
            color={active ? 'primary' : 'default'}
            variant={active ? 'filled' : 'outlined'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        );
      })}
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CSV export
   ───────────────────────────────────────────────────────────────────────── */
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvButton({ filename, rows, label = 'CSV' }: { filename: string; rows: Record<string, unknown>[]; label?: string }) {
  return (
    <Button
      size="small"
      startIcon={<DownloadRoundedIcon />}
      onClick={() => exportCsv(filename, rows)}
      disabled={!rows.length}
      sx={{ textTransform: 'none' }}
    >
      {label}
    </Button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Card de sección reutilizable
   ───────────────────────────────────────────────────────────────────────── */
export function SectionCard({
  title,
  icon,
  action,
  children,
  empty,
  emptyText = 'Sin datos aún.',
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
}) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" rowGap={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
          <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
        </Stack>
        {action}
      </Stack>
      {empty ? (
        <Box sx={{ py: 4, display: 'grid', placeItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
        </Box>
      ) : (
        children
      )}
    </Card>
  );
}

/* Formato moneda desde centavos */
export const centsToUsd = (c?: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((c || 0) / 100);
