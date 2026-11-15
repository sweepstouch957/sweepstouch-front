'use client';

/**
 * Cabecera del panel: título, tienda, estado de "¿Quiere lista?" y vista previa; el
 * circular y el flyer vigentes; y las pestañas abajo en la misma tarjeta (así el título no
 * compite con el contenido). Las pestañas van agrupadas: 5 grupos en vez de 9 sueltas.
 */
import { Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { memo } from 'react';
import { PanelCard } from '../../../panel-kit';
import PreRcsPreviewButton from '../preview';
import CurrentArt from './CurrentArt';
import { groupOf, PANEL_GROUPS, type PanelTab } from './tabs';

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
  const group = groupOf(tab);
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

      {/* Circular y flyer vigentes: se ven desde cualquier pestaña. */}
      <CurrentArt
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName}
        onTab={onTab}
      />

      <Tabs
        value={group.id}
        onChange={(_, id: string) => {
          const next = PANEL_GROUPS.find((g) => g.id === id);
          if (next) onTab(next.tabs[0].id);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          px: { xs: 0.5, md: 1.5 },
          minHeight: 44,
          '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, fontSize: 14 },
        }}
      >
        {PANEL_GROUPS.map((g) => {
          const badge = g.tabs.reduce((n, t) => n + (badges?.[t.id] ?? 0), 0);
          return (
            <Tab
              key={g.id}
              value={g.id}
              icon={g.icon}
              iconPosition="start"
              label={
                badge > 0 ? (
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={0.75}
                  >
                    {g.label}
                    <Chip
                      size="small"
                      color="primary"
                      label={badge}
                      sx={{ height: 18, fontSize: 11 }}
                    />
                  </Stack>
                ) : (
                  g.label
                )
              }
            />
          );
        })}
      </Tabs>

      {/* Lo que hay dentro del grupo: sólo si tiene más de una vista. */}
      {group.tabs.length > 1 && (
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.75}
          role="tablist"
          aria-label={group.label}
          sx={{ px: { xs: 2, md: 2.5 }, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}
        >
          {group.tabs.map((t) => {
            const on = t.id === tab;
            const badge = badges?.[t.id] ?? 0;
            return (
              <Chip
                key={t.id}
                role="tab"
                aria-selected={on}
                clickable
                onClick={() => onTab(t.id)}
                color={on ? 'primary' : 'default'}
                variant={on ? 'filled' : 'outlined'}
                label={badge > 0 ? `${t.label} · ${badge}` : t.label}
                sx={{ fontWeight: 700, height: 30, px: 0.5 }}
              />
            );
          })}
        </Stack>
      )}
    </PanelCard>
  );
}

export default memo(PanelHeader);
