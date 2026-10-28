'use client';

/**
 * De dónde salen los productos (Store.flyerOnly). Es el ÚNICO lugar donde se cambia y aplica a
 * todo: lo vigente, Próximos, Productos y el cron. "Sólo flyer" oculta lo del circular y quita
 * de Próximos lo que el circular dejó esperando fecha.
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { FlyerOnlyDialog } from './FlyerOnlyDialog';
import { useFlyerOnly } from './use-flyer-only';

export function ProductSourceCard({
  storeId,
  storeSlug,
  flyerOnly = false,
}: {
  storeId: string;
  storeSlug: string;
  flyerOnly?: boolean;
}) {
  const save = useFlyerOnly(storeId, storeSlug);
  const shown = save.isPending ? !!save.variables : flyerOnly;

  const [asking, setAsking] = useState(false);
  // Prender pide confirmación (quita de Próximos lo del circular); apagar va directo.
  const onChange = (on: boolean) => {
    if (on === flyerOnly) return;
    if (on) setAsking(true);
    else save.mutate(false);
  };

  return (
    <PanelCard>
      <SectionHeader
        icon={<Inventory2OutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="¿De dónde salen los productos?"
        hint="Aplica a todo: lo que ve el cliente hoy, Próximos, Productos y la carga automática"
      />
      <Box sx={{ p: 2.25, display: 'grid', gap: 1.25 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={shown ? 'flyer' : 'both'}
          disabled={save.isPending}
          onChange={(_e, v: 'flyer' | 'both' | null) => v && onChange(v === 'flyer')}
          aria-label="De dónde salen los productos"
          sx={{ '& .MuiToggleButton-root': { px: 2, textTransform: 'none', fontWeight: 700 } }}
        >
          <ToggleButton value="both">Circular + flyer</ToggleButton>
          <ToggleButton value="flyer">Sólo flyer</ToggleButton>
        </ToggleButtonGroup>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {shown
            ? 'Sólo flyer: el circular semanal no carga productos ni cambia precios. Cada flyer nuevo entra solo con su fecha.'
            : 'Se cargan el circular semanal y los flyers. Cuando hay un flyer vigente, la lista es sólo ese flyer.'}
        </Typography>
      </Box>
      <FlyerOnlyDialog
        open={asking}
        busy={save.isPending}
        onClose={() => setAsking(false)}
        onConfirm={() => save.mutate(true, { onSuccess: () => setAsking(false) })}
      />
    </PanelCard>
  );
}
