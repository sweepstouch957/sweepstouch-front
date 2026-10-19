'use client';

/**
 * Revisión IA (pasos 4-6): la última corrida del agente, lo que quedó para decidir y lo que
 * se aplicó hace poco. Presentacional: los datos y las acciones llegan del contenedor.
 */
import {
  KpiCard,
  KpiRow,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { ProductReviewState } from '@/services/circular.service';
import { Button, LinearProgress, Stack, Typography } from '@mui/material';
import { fmtDate } from '../shared';
import { KpiSkeleton } from '../skeletons';
import AgentCard, { EmptyLine } from './AgentCard';
import { REVIEW_KIND } from './constants';
import ReviewDecisions from './ReviewDecisions';
import { showFields } from './utils';

type Props = {
  firstStep: number;
  data?: ProductReviewState;
  loading: boolean;
  onRun: () => void;
  runPending: boolean;
  onApplySafe: () => void;
  applySafePending: boolean;
  onApply: (id: string) => void;
  onIgnore: (id: string) => void;
};

export default function ReviewSection({
  firstStep,
  data,
  loading,
  onRun,
  runPending,
  onApplySafe,
  applySafePending,
  onApply,
  onIgnore,
}: Props) {
  const r = data?.run;
  const running = !!r && !r.finishedAt;
  const open = data?.open ?? [];
  const safeOpen = open.filter(
    (it) => it.kind === 'price' && it.confidence >= (data?.autoConfidence ?? 0.9)
  ).length;

  return (
    <Stack spacing={1.5}>
      <AgentCard
        step={firstStep}
        title="El agente revisa los productos"
        description="Todos los días temprano, antes de las campañas, coteja precios, nombres y letra chica contra el flyer, aplica solo lo seguro y ordena qué se ve. Lo dudoso queda acá para decidir."
        action={
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
          >
            {safeOpen > 0 && (
              <Button
                size="small"
                variant="outlined"
                disabled={applySafePending}
                onClick={() => onApplySafe()}
              >
                Aplicar {safeOpen} precios seguros
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              disabled={running || runPending}
              onClick={() => onRun()}
            >
              {running ? 'Revisando…' : 'Revisar ahora'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={1.25}>
          {running && <LinearProgress sx={{ borderRadius: 1 }} />}
          {loading ? (
            <KpiSkeleton count={5} />
          ) : r ? (
            <KpiRow min={150}>
              <KpiCard
                label="Última corrida"
                value={fmtDate(r.startedAt)}
                delta={r.trigger === 'cron' ? 'automática' : 'a mano'}
              />
              <KpiCard
                label="Cotejados"
                value={r.productsChecked}
                delta={`${r.pagesChecked} páginas · ${r.circulars.length} flyer${
                  r.circulars.length === 1 ? '' : 's'
                }`}
              />
              <KpiCard
                label="Arreglados solos"
                value={r.autoApplied}
                delta="precios con confianza alta"
              />
              <KpiCard
                label="Por revisar"
                value={r.open}
                delta={`${r.duplicates} duplicados`}
              />
              <KpiCard
                label="Visibles / ocultos"
                value={`${r.visibility?.shown ?? 0} / ${r.visibility?.hidden ?? 0}`}
                delta={r.visibility?.flyers || 'sin flyer vivo'}
              />
            </KpiRow>
          ) : (
            <EmptyLine>
              Todavía no corrió para esta tienda. Con "Revisar ahora" arranca la primera.
            </EmptyLine>
          )}
          {r?.error && (
            <Typography
              color="error"
              variant="body2"
            >
              Falló: {r.error}
            </Typography>
          )}
          {r && r.missingPhotos > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {r.missingPhotos} productos visibles sin foto: se limpian desde Productos → "Limpiar
              imágenes con IA".
            </Typography>
          )}
        </Stack>
      </AgentCard>

      <AgentCard
        step={firstStep + 1}
        title="Para decidir"
        count={open.length}
        description="Lo que el flyer muestra distinto a lo guardado, o que no se pudo confirmar con seguridad."
      >
        {open.length === 0 ? (
          <EmptyLine>Nada pendiente.</EmptyLine>
        ) : (
          <ReviewDecisions
            items={open}
            onApply={onApply}
            onIgnore={onIgnore}
          />
        )}
      </AgentCard>

      {!!data?.recent?.length && (
        <AgentCard
          step={firstStep + 2}
          title="Aplicado recientemente"
          description="Lo que el agente arregló solo o se aplicó desde acá. Se puede corregir a mano en Productos."
        >
          <Stack gap={0.75}>
            {data.recent.map((it) => (
              <Typography
                key={it._id}
                variant="body2"
              >
                <b>{it.name}</b> · {REVIEW_KIND[it.kind]}: {showFields(it.current)} →{' '}
                {showFields(it.proposed)}{' '}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontSize: 12, color: 'text.secondary' }}
                >
                  ({it.status === 'auto' ? 'solo' : 'a mano'}
                  {it.appliedAt ? `, ${fmtDate(it.appliedAt)}` : ''})
                </Typography>
              </Typography>
            ))}
          </Stack>
        </AgentCard>
      )}
    </Stack>
  );
}
