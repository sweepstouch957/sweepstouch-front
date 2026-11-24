'use client';

/** Resumen de la pestaña: qué es, buscador y cuántos productos esperan fecha. */
import {
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { InputAdornment, Skeleton, Stack, TextField, Tooltip } from '@mui/material';
import { fmtDay, relDay } from './utils';

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  loading: boolean;
  total: number;
  nNew: number;
  /** Día (YYYY-MM-DD) del próximo grupo que sale. */
  nextDay?: string;
  /** Store.flyerOnly (se cambia en la cabecera): aquí sólo sale lo de los flyers. */
  flyerOnly: boolean;
};

export default function UpcomingSummary({
  query,
  onQueryChange,
  loading,
  total,
  nNew,
  nextDay,
  flyerOnly,
}: Props) {
  return (
    <PanelCard>
      <SectionHeader
        icon={
          <EventRoundedIcon
            color="primary"
            fontSize="small"
          />
        }
        title="Lo que sale pronto"
        hint={
          flyerOnly
            ? 'Sólo flyer: el circular semanal no se está cargando. Aquí salen únicamente los productos de los flyers.'
            : 'El cliente todavía NO ve esto. Sale solo en su fecha: no tienes que hacer nada. Si ves algo mal, toca “Corregir” en el producto.'
        }
        action={
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            gap={1.5}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <TextField
              size="small"
              placeholder="Buscar producto"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
              inputProps={{ 'aria-label': 'Buscar producto' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        }
      />
      {(loading || total > 0) && (
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
          sx={{ px: 2.25, py: 1.5 }}
        >
          {loading ? (
            [240, 150, 150].map((w) => (
              <Skeleton
                key={w}
                variant="rounded"
                width={w}
                height={22}
                sx={{ borderRadius: '7px' }}
              />
            ))
          ) : (
            <>
              {nextDay && (
                <StatusPill
                  tone="info"
                  label={`Lo primero sale ${relDay(nextDay)}: ${fmtDay(nextDay)}`}
                />
              )}
              {nNew > 0 && (
                <Tooltip title="No estaban en la lista: aparecen por primera vez ese día.">
                  <span>
                    <StatusPill
                      tone="success"
                      label={`${nNew} nuevo${nNew !== 1 ? 's' : ''}: no estaban en la lista`}
                    />
                  </span>
                </Tooltip>
              )}
              {total - nNew > 0 && (
                <Tooltip title="Ya están en la lista de hoy: ese día sólo les cambia el precio.">
                  <span>
                    <StatusPill
                      tone="warning"
                      label={`${total - nNew} ya están en la lista: sólo cambian de precio`}
                    />
                  </span>
                </Tooltip>
              )}
            </>
          )}
        </Stack>
      )}
    </PanelCard>
  );
}
