'use client';

/**
 * Cabecera del panel: título, tienda, estado de "¿Quiere lista?" y vista previa, con las
 * pestañas abajo en la misma tarjeta (así el título no compite con el contenido).
 */
import {
  Box,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { memo } from 'react';
import { PanelCard } from '../../../panel-kit';
import PreRcsPreviewButton from '../preview';
import { PANEL_TABS, type PanelTab } from './tabs';

type Props = {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  listsEnabled?: boolean;
  /** Store.flyerOnly: los productos salen sólo de flyers. */
  flyerOnly?: boolean;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  /** Número junto a una pestaña (Próximos). */
  badges?: Partial<Record<PanelTab, number>>;
};

function PanelHeader({
  storeId,
  storeSlug,
  storeName,
  listsEnabled,
  flyerOnly,
  tab,
  onTab,
  badges,
}: Props) {
  const noList = listsEnabled === false;
  return (
    <PanelCard sx={{ mb: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            fontWeight={800}
            lineHeight={1.2}
            noWrap
          >
            Circular & Listas
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
            sx={{ mt: 0.5 }}
          >
            {storeName && (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
              >
                {storeName}
              </Typography>
            )}
            {/* "¿Quiere lista?" siempre a la vista: con No los agentes no cargan nada. Se edita en Configuración. */}
            <Chip
              size="small"
              clickable
              onClick={() => onTab('config')}
              color={noList ? 'warning' : 'success'}
              variant="outlined"
              label={noList ? 'Sin lista · agentes pausados' : 'Con lista'}
              sx={{ height: 22, fontSize: 11.5, fontWeight: 700 }}
            />
            {/* De dónde salen los productos: se ve acá, se cambia en Configuración. */}
            <Chip
              size="small"
              clickable
              onClick={() => onTab('config')}
              color={flyerOnly ? 'primary' : 'default'}
              variant="outlined"
              label={flyerOnly ? 'Sólo flyer' : 'Circular + flyer'}
              sx={{ height: 22, fontSize: 11.5, fontWeight: 700 }}
            />
          </Stack>
        </Box>
        {/* Ver la página tal cual la recibe el cliente. */}
        <PreRcsPreviewButton
          storeId={storeId}
          storeSlug={storeSlug}
        />
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, v: PanelTab) => onTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          px: { xs: 0.5, md: 1.5 },
          minHeight: 44,
          '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, fontSize: 14 },
        }}
      >
        {PANEL_TABS.map((t) => {
          const badge = badges?.[t.id] ?? 0;
          return (
            <Tab
              key={t.id}
              value={t.id}
              icon={t.icon}
              iconPosition="start"
              label={
                badge > 0 ? (
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={0.75}
                  >
                    {t.label}
                    <Chip
                      size="small"
                      color="primary"
                      label={badge}
                      sx={{ height: 18, fontSize: 11 }}
                    />
                  </Stack>
                ) : (
                  t.label
                )
              }
            />
          );
        })}
      </Tabs>
    </PanelCard>
  );
}

export default memo(PanelHeader);
