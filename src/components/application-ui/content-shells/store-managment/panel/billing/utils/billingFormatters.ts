// src/components/billing/utils/billingFormatters.ts

export const formatMoney = (
  n: number | undefined | null,
  currency = 'USD'
) => {
  if (n == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatDate = (iso?: string | Date) => {
  if (!iso) return '-';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};
