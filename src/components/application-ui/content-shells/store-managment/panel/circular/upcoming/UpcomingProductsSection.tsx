'use client';

/**
 * Próximos: productos que ya están en el catálogo pero salen en una fecha (vienen de una
 * campaña agendada o de un circular que todavía no arrancó). Se revisan ANTES de que el
 * cliente los vea: precio que va a salir, fecha, imagen (recortada del arte de SU campaña
 * o circular), letra chica. Se pueden publicar ya o sacar.
 *
 * Contenedor: única pieza que conoce React Query; las vistas y diálogos reciben props.
 */
import {
  EmptyBlock,
  PanelCard,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { StoreProduct, UpcomingGroup } from '@/services/circular.service';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import { Box, Stack } from '@mui/material';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useUpcoming } from '../hooks';
import { ProductEditorDialog } from '../ProductImageTools';
import { UpcomingGroupSkeleton } from '../skeletons';
import AgentsDialog from './AgentsDialog';
import ArtPreviewDialog from './ArtPreviewDialog';
import ConfirmDialog from './ConfirmDialog';
import ScheduledBanners from './ScheduledBanners';
import UpcomingGroupCard from './UpcomingGroupCard';
import UpcomingSummary from './UpcomingSummary';
import { useUpcomingActions } from './use-upcoming-actions';
import type { AgentsOptions, Confirm, EditorTarget, UpcomingBanner } from './utils';

// Constantes estables: un `?? []` nuevo por render invalidaba el useMemo de abajo.
const EMPTY_GROUPS: UpcomingGroup[] = [];
const EMPTY_BANNERS: UpcomingBanner[] = [];

export default function UpcomingProductsSection({ storeSlug }: { storeSlug: string }) {
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agentsFor, setAgentsFor] = useState<UpcomingGroup | null>(null);

  const upcoming = useUpcoming(storeSlug);
  const { refresh, openEditor, openArt, agents, rephoto, patch, act } =
    useUpcomingActions(storeSlug);
  const { mutate: patchMutate } = patch;
  const handlePatch = useCallback(
    (id: string, body: { name?: string; brand?: string; size?: string }) =>
      patchMutate({ id, body }),
    [patchMutate]
  );
  // `mutate` de React Query es estable: las cards memoizadas no se repintan por esto.
  const { mutate: editMutate } = openEditor;
  const { mutate: artMutate } = openArt;
  const { mutate: rephotoMutate } = rephoto;

  const groups = upcoming.data?.groups ?? EMPTY_GROUPS;
  const banners = upcoming.data?.banners ?? EMPTY_BANNERS;

  // Banner de cada día (el primero si hubiera dos).
  const bannerByDay = useMemo(() => {
    const m = new Map<string, UpcomingBanner>();
    banners.forEach((b) => !m.has(b.day) && m.set(b.day, b));
    return m;
  }, [banners]);

  const stats = useMemo(() => {
    const all = groups.flatMap((g) => g.items);
    return { total: all.length, nNew: all.filter((p) => p.pending?.isNew).length };
  }, [groups]);

  // La búsqueda filtra en el cliente: diferida para que escribir no espere a la grilla.
  const needle = useDeferredValue(q.trim().toLowerCase());
  const filtered = useMemo(
    () =>
      needle
        ? groups
            .map((g) => ({
              ...g,
              items: g.items.filter((p) => p.name.toLowerCase().includes(needle)),
            }))
            .filter((g) => g.items.length)
        : groups,
    [groups, needle]
  );

  const handleEdit = useCallback(
    (product: StoreProduct, group: UpcomingGroup) =>
      editMutate({ product, group }, { onSuccess: setEditor }),
    [editMutate]
  );
  const handleOpenArt = useCallback(
    (g: UpcomingGroup) => artMutate(g, { onSuccess: (url) => url && setPreview(url) }),
    [artMutate]
  );
  const handleRephoto = useCallback((p: StoreProduct) => rephotoMutate(p._id), [rephotoMutate]);
  const handlePublishProduct = useCallback(
    (product: StoreProduct) => setConfirm({ kind: 'publish', product }),
    []
  );
  const handleCancelProduct = useCallback(
    (product: StoreProduct) => setConfirm({ kind: 'cancel', product }),
    []
  );
  const handlePublishGroup = useCallback(
    (group: UpcomingGroup) => setConfirm({ kind: 'group', group }),
    []
  );

  const runAgents = (values: AgentsOptions) =>
    agentsFor &&
    agents.mutate({ group: agentsFor, ...values }, { onSuccess: () => setAgentsFor(null) });
  const runConfirm = (c: Confirm) => act.mutate(c, { onSuccess: () => setConfirm(null) });

  const loading = upcoming.isLoading;
  const editingId = openEditor.isPending ? openEditor.variables?.product._id : undefined;
  const rephotoingId = rephoto.isPending ? rephoto.variables : undefined;

  return (
    <Stack spacing={1.5}>
      <UpcomingSummary
        query={q}
        onQueryChange={setQ}
        loading={loading}
        total={stats.total}
        nNew={stats.nNew}
        nextDay={groups[0]?.day}
        flyerOnly={upcoming.data?.flyerOnly === true}
      />

      {loading && (
        <>
          <UpcomingGroupSkeleton />
          <UpcomingGroupSkeleton cards={3} />
        </>
      )}

      {!!banners.length && (
        <ScheduledBanners
          banners={banners}
          onPreview={setPreview}
        />
      )}

      {!loading && !groups.length && !banners.length && (
        <PanelCard>
          <Box sx={{ pt: 3, textAlign: 'center' }}>
            <EventRoundedIcon
              color="disabled"
              sx={{ fontSize: 40 }}
            />
          </Box>
          <EmptyBlock
            title="No hay productos esperando fecha"
            hint="Cuando agendes una campaña con arte o un circular a futuro, sus productos aparecen aquí antes de salir."
          />
        </PanelCard>
      )}

      {!!needle && !!groups.length && !filtered.length && (
        <PanelCard>
          <EmptyBlock
            title="Ningún producto coincide"
            hint={`No hay productos próximos que contengan “${q.trim()}”.`}
          />
        </PanelCard>
      )}

      {filtered.map((g) => (
        <UpcomingGroupCard
          key={g.key}
          group={g}
          banner={bannerByDay.get(g.day)}
          editingId={editingId}
          rephotoingId={rephotoingId}
          artBusy={openArt.isPending}
          agentsBusy={agents.isPending}
          onEdit={handleEdit}
          onRephoto={handleRephoto}
          onPatch={handlePatch}
          onPublishProduct={handlePublishProduct}
          onCancelProduct={handleCancelProduct}
          onPublishGroup={handlePublishGroup}
          onOpenArt={handleOpenArt}
          onOpenAgents={setAgentsFor}
          onPreview={setPreview}
        />
      ))}

      <ProductEditorDialog
        open={!!editor}
        product={editor?.product ?? null}
        storeSlug={storeSlug}
        // El arte del grupo va al botón que corresponde: antes un flyer de campaña caía en
        // "Recortar circular" y "Recortar flyer" quedaba apagado (Paterson, oct 2026).
        flyerUrl={editor && !editor.fromCampaign ? editor.flyerUrl || undefined : undefined}
        campaignUrl={editor?.fromCampaign ? editor.flyerUrl || undefined : undefined}
        onClose={() => setEditor(null)}
        onSaved={refresh}
      />

      <ArtPreviewDialog
        url={preview}
        onClose={() => setPreview(null)}
      />

      {/* Poner a los agentes a trabajar sobre un flyer que todavía no salió. */}
      {agentsFor && (
        <AgentsDialog
          group={agentsFor}
          pending={agents.isPending}
          onClose={() => setAgentsFor(null)}
          onSubmit={runAgents}
        />
      )}

      <ConfirmDialog
        confirm={confirm}
        pending={act.isPending}
        groupBannerAuto={confirm?.kind === 'group' && !!bannerByDay.get(confirm.group.day)?.auto}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </Stack>
  );
}
