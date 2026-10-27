'use client';

/**
 * Pestaña Configuración: todo lo que se configura del circular y las listas de la tienda, en
 * un solo lugar y una tarjeta debajo de otra.
 */
import { Box } from '@mui/material';
import { CircularSourceCard } from './CircularSourceCard';
import { ListsCard } from './ListsCard';
import { ListsPhoneCard } from './ListsPhoneCard';
import { ProductSourceCard } from './ProductSourceCard';

export default function ConfigSection({
  storeId,
  storeSlug,
  flyerOnly,
  circularssUrl,
  circularPriority,
  listsEnabled,
  listsLinkUrl,
  listsPhone,
  listsPhoneEnabled,
}: {
  storeId: string;
  storeSlug: string;
  flyerOnly?: boolean;
  circularssUrl?: string;
  circularPriority?: 'circularss' | 'panel';
  listsEnabled?: boolean;
  listsLinkUrl?: string;
  listsPhone?: string;
  listsPhoneEnabled?: boolean;
}) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <ProductSourceCard
        storeId={storeId}
        storeSlug={storeSlug}
        flyerOnly={flyerOnly}
      />
      <CircularSourceCard
        storeId={storeId}
        circularssUrl={circularssUrl}
        circularPriority={circularPriority}
      />
      <ListsCard
        storeId={storeId}
        listsEnabled={listsEnabled}
        listsLinkUrl={listsLinkUrl}
      />
      <ListsPhoneCard
        storeId={storeId}
        listsPhone={listsPhone}
        listsPhoneEnabled={listsPhoneEnabled}
      />
    </Box>
  );
}
