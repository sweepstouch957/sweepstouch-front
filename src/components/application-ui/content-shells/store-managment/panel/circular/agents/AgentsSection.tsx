'use client';

/**
 * Pestaña Agentes IA: todo lo de los robots en un solo lugar, separado de agendar/subir el
 * circular. 1 la oficina (quién trabaja y qué dice) · 2 reglas de la tienda · 3 auditoría por
 * página · 4-6 revisión diaria (lo que arregló solo y lo que queda para decidir).
 *
 * Contenedor: el único de la carpeta que toca React Query; las tarjetas reciben datos y
 * callbacks por props.
 */
import { Stack } from '@mui/material';
import { useCallback, useState } from 'react';
import { useCircularBusy } from '../hooks';
import { circularLabel } from '../shared';
import AuditCard from './AuditCard';
import ReviewSection from './ReviewSection';
import RobotsCard from './RobotsCard';
import StoreRulesCard from './StoreRulesCard';
import {
  useActivePipeline,
  useCircularAudit,
  usePipelineSync,
  useRerunAudit,
} from './use-pipeline';
import { useProductReview, useReviewActions, useRunProductReview } from './use-product-review';
import {
  useAddStoreLesson,
  useRemoveStoreLesson,
  useSaveStoreRules,
  useSendInstruction,
  useStoreProfile,
} from './use-store-profile';

export default function AgentsSection({
  storeSlug,
  storeName,
}: {
  storeSlug: string;
  storeName?: string;
}) {
  const { busy } = useCircularBusy(storeSlug);

  // 1 · Robots: el circular (o flyer) sobre el que trabajan y su bitácora.
  const { circular, pipeline, loading } = useActivePipeline(storeSlug);
  const [feedOpen, setFeedOpen] = useState(false);
  usePipelineSync(pipeline, storeSlug, feedOpen);
  const instruction = useSendInstruction(storeSlug);
  const officeReview = useRunProductReview(storeSlug, 'office');
  const sendInstruction = useCallback(
    (text: string, agent?: string) => instruction.mutateAsync({ text, agent }),
    [instruction.mutateAsync]
  );

  // 2 · Reglas y lecciones de la tienda.
  const profile = useStoreProfile(storeSlug);
  const saveRules = useSaveStoreRules(storeSlug);
  const addLesson = useAddStoreLesson(storeSlug);
  const removeLesson = useRemoveStoreLesson(storeSlug);

  // 3 · Auditoría por página.
  const audit = useCircularAudit(circular);
  const rerunAudit = useRerunAudit(circular?._id, audit.refetch);

  // 4-6 · Revisión diaria.
  const review = useProductReview(storeSlug);
  const runReview = useRunProductReview(storeSlug);
  const { applySafe, apply, ignore } = useReviewActions(storeSlug);

  return (
    <Stack spacing={1.5}>
      <RobotsCard
        step={1}
        circularName={circular ? circularLabel(circular, storeSlug, storeName) : null}
        pipeline={pipeline}
        loading={loading}
        feedOpen={feedOpen}
        onToggleFeed={setFeedOpen}
        onSendInstruction={sendInstruction}
        sending={instruction.isPending}
        onStartReview={officeReview.mutateAsync}
        starting={officeReview.isPending}
      />

      <StoreRulesCard
        step={2}
        profile={profile.data?.profile}
        loading={profile.isLoading}
        onSaveRules={saveRules.mutateAsync}
        onAddLesson={addLesson.mutateAsync}
        onRemoveLesson={removeLesson.mutate}
      />

      <AuditCard
        step={3}
        hasFile={!!circular?.fileUrl}
        running={!!audit.data?.running}
        pages={audit.data?.pages || []}
        accuracy={audit.data?.accuracy}
        verification={audit.data?.verification}
        disabled={busy || rerunAudit.isPending}
        onRerun={rerunAudit.mutate}
      />

      <ReviewSection
        firstStep={4}
        data={review.data}
        loading={review.isLoading}
        onRun={runReview.mutate}
        runPending={runReview.isPending}
        onApplySafe={applySafe.mutate}
        applySafePending={applySafe.isPending}
        onApply={apply.mutate}
        onIgnore={ignore.mutate}
      />
    </Stack>
  );
}
