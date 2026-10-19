'use client';

/**
 * Comparativo: lo que el cliente ve HOY vs. lo que va a ver cuando entre el próximo circular o
 * flyer agendado. Producto por producto (nombre normalizado): sigue igual, cambia de precio,
 * entra nuevo, sale. Es lo que la encargada necesita para aprobar la semana que viene de un
 * vistazo, sin abrir los dos PDFs.
 *
 * Contenedor: el único de la carpeta que toca React Query.
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { Button, Collapse, Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useStoreCirculars } from '../hooks';
import { fmtDate } from '../shared';
import CompareColumn from './CompareColumn';
import DiffChips from './DiffChips';
import DiffTable from './DiffTable';
import { useCircularDetail } from './use-circular-detail';
import { diffProducts, pickTodayAndNext, type DiffKind } from './utils';

type Props = {
  storeSlug: string;
  storeName?: string;
  onOpenUpcoming: () => void;
};

export default function CircularCompare({ storeSlug, storeName, onOpenUpcoming }: Props) {
  const { items, flyers } = useStoreCirculars(storeSlug);
  const { current, next } = useMemo(
    () => pickTodayAndNext([...flyers, ...items], Date.now()),
    [items, flyers]
  );

  const curQ = useCircularDetail(current?._id);
  const nextQ = useCircularDetail(next?._id);
  const [open, setOpen] = useState<DiffKind | null>(null);
  const toggle = useCallback((k: DiffKind) => setOpen((o) => (o === k ? null : k)), []);

  const diff = useMemo(
    () => diffProducts(curQ.data?.products || [], nextQ.data?.products || []),
    [curQ.data, nextQ.data]
  );

  // Sin nada agendado no hay qué comparar: la sección no se muestra.
  if (!next) return null;

  const from = fmtDate(next.startDate);

  return (
    <PanelCard>
      <SectionHeader
        icon={<CompareArrowsRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Hoy vs. lo que sigue"
        action={
          <Button
            size="small"
            variant="outlined"
            onClick={onOpenUpcoming}
          >
            Revisar en Próximos
          </Button>
        }
      />
      <Stack
        spacing={1.5}
        sx={{ p: 2.25 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          El {from} la lista cambia. Esto es lo que entra, lo que sale y qué precios cambian.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.5}
        >
          <CompareColumn
            circular={current}
            tag="Hoy"
            storeSlug={storeSlug}
            storeName={storeName}
          />
          <CompareColumn
            circular={next}
            tag={`Desde el ${from}`}
            storeSlug={storeSlug}
            storeName={storeName}
          />
        </Stack>
        <DiffChips
          diff={diff}
          loading={curQ.isLoading || nextQ.isLoading}
          open={open}
          onToggle={toggle}
        />
        <Collapse
          in={!!open}
          unmountOnExit
        >
          <DiffTable rows={open ? diff[open] : []} />
        </Collapse>
      </Stack>
    </PanelCard>
  );
}
