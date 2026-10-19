'use client';

/** Resumen de la pestaña: qué es, buscador y cuántos productos esperan fecha. */
import {
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { InputAdornment, Skeleton, Stack, TextField } from '@mui/material';
import { fmtDay, relDay } from './utils';

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  loading: boolean;
  total: number;
  nNew: number;
  /** Día (YYYY-MM-DD) del próximo grupo que sale. */
  nextDay?: string;
};

export default function UpcomingSummary({
  query,
  onQueryChange,
  loading,
  total,
  nNew,
  nextDay,
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
        hint="Productos y banners ya cargados que el cliente todavía no ve. Revísalos antes de su fecha."
        action={
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
            [130, 90, 140, 200].map((w) => (
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
              <StatusPill label={`${total} esperando fecha`} />
              <StatusPill
                tone="success"
                label={`${nNew} nuevos`}
              />
              <StatusPill
                tone="warning"
                label={`${total - nNew} cambian de precio`}
              />
              {nextDay && (
                <StatusPill
                  tone="info"
                  label={`Próximo: ${fmtDay(nextDay)} (${relDay(nextDay)})`}
                />
              )}
            </>
          )}
        </Stack>
      )}
    </PanelCard>
  );
}
