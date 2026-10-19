'use client';

/** Pestaña Configuración: "¿Quiere lista?" y el número para listas, una tarjeta debajo de otra. */
import { Box } from '@mui/material';
import { ListsCard } from './ListsCard';
import { ListsPhoneCard } from './ListsPhoneCard';

export default function ConfigSection({
  storeId,
  listsEnabled,
  listsLinkUrl,
  listsPhone,
  listsPhoneEnabled,
}: {
  storeId: string;
  listsEnabled?: boolean;
  listsLinkUrl?: string;
  listsPhone?: string;
  listsPhoneEnabled?: boolean;
}) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
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
