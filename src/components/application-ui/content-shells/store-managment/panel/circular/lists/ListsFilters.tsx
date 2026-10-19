'use client';

import type { ShoppingListSummary } from '@/services/shopping-lists.service';
import { Chip, Stack } from '@mui/material';
import { LIST_FILTERS, type ListsFilter } from './constants';

export default function ListsFilters({
  value,
  summary,
  onChange,
}: {
  value: ListsFilter;
  summary?: ShoppingListSummary;
  onChange: (v: ListsFilter) => void;
}) {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
    >
      {LIST_FILTERS.map((f) => (
        <Chip
          key={f.value}
          size="small"
          label={summary ? `${f.label} (${f.count(summary)})` : f.label}
          color={value === f.value ? 'primary' : 'default'}
          variant={value === f.value ? 'filled' : 'outlined'}
          onClick={() => onChange(f.value)}
        />
      ))}
    </Stack>
  );
}
