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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { memo } from 'react';
import { PanelCard } from '../../../panel-kit';
import PreRcsPreviewButton from '../preview';
import { PANEL_TABS, type PanelTab } from './tabs';
import { useFlyerOnly } from './use-flyer-only';

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
  const flyer = useFlyerOnly(storeId, storeSlug);
  const shownFlyerOnly = flyer.isPending ? !!flyer.variables : !!flyerOnly;
  const onSource = (on: boolean) => {
    if (on === !!flyerOnly) return;
    // ponytail: confirm nativo; prender borra las altas del circular que esperaban fecha.
    if (
      on &&
      !window.confirm(
        'Sólo flyer: se ocultan todos los productos del circular y se quita de Próximos lo que el circular dejó esperando fecha. El circular semanal deja de cargar. ¿Seguir?'
      )
    )
      return;
    flyer.mutate(on);
  };
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
            {/* De dónde salen los productos: se decide SÓLO acá y aplica a todo (vigentes,
                Próximos, Productos, cron). */}
            <Tooltip
              title={
                shownFlyerOnly
                  ? 'Sólo flyer: el circular semanal no carga ni muestra nada, ni hoy ni en Próximos.'
                  : 'Se cargan el circular semanal y los flyers (el flyer manda cuando hay uno vigente).'
              }
            >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={shownFlyerOnly ? 'flyer' : 'both'}
                disabled={flyer.isPending}
                onChange={(_e, v: 'flyer' | 'both' | null) => v && onSource(v === 'flyer')}
                aria-label="De dónde salen los productos"
                sx={{ '& .MuiToggleButton-root': { py: 0.1, px: 1.25, fontSize: 11.5, fontWeight: 700, textTransform: 'none' } }}
              >
                <ToggleButton value="both">Circular + flyer</ToggleButton>
                <ToggleButton
                  value="flyer"
                  color="primary"
                >
                  Sólo flyer
                </ToggleButton>
              </ToggleButtonGroup>
            </Tooltip>
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
