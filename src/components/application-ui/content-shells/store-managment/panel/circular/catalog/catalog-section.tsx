'use client';

/** Productos: el catálogo de la tienda (lo que ve el cliente en sus listas).
 *  Contenedor: es el único que conoce React Query; lo demás recibe datos y callbacks. */
import type { StoreProduct } from '@/services/circular.service';
import type { DropResult } from '@hello-pangea/dnd';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { Box, Button, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { PanelCard, SectionHeader } from '../../../panel-kit';
import { useCatalogSummary } from '../hooks';
import type { MoreMenuItem } from '../panelUi';
import { PasteReplaceDialog, ProductEditorDialog } from '../ProductImageTools';
import { ImagePreviewDialog } from '../shared';
import { CatalogRowsSkeleton } from '../skeletons';
import { applyCatalogOrder, moveCatalogItem } from './catalog-order';
import { CatalogNotices } from './catalog-notices';
import { CatalogTable } from './catalog-table';
import { CatalogToolbar } from './catalog-toolbar';
import { ClearCatalogDialog } from './clear-catalog-dialog';
import { PAGE_SIZE, PASTE_HINT, type CatalogShow } from './constants';
import { DeleteProductDialog } from './delete-product-dialog';
import { FillDetailsDialog } from './fill-details-dialog';
import { RescanPhotosDialog } from './rescan-photos-dialog';
import { RulingBar } from './ruling-bar';
import { SyncVisibilityDialog } from './sync-visibility-dialog';
import { useCatalogPage, useCategoryOptions, useEditorSources } from './use-catalog-data';
import { useFillDetails, useOpenRuling, useRescanPhotos } from './use-catalog-jobs';
import {
  useCleanImages,
  useClearCatalog,
  useFillRegulars,
  useProductPatches,
  useRefreshCatalog,
  useRemoveProduct,
  useSaveOrder,
  useSyncVisibility,
} from './use-catalog-mutations';
import { useRowPaste } from './use-row-paste';
import { buildUpcomingSummary, isGeneratingImage, missingRegularOf } from './utils';

type Dialog = 'clear' | 'sync' | 'rescan' | 'details' | null;

export default function CatalogSection({ storeSlug }: { storeSlug: string }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [show, setShow] = useState<CatalogShow | undefined>();
  const deferredSearch = useDeferredValue(search);
  const catalog = useCatalogPage(storeSlug, page, deferredSearch, show);
  const categoryOptions = useCategoryOptions(storeSlug);
  const cleaning = !!catalog.data?.cleaning;

  // Un solo diálogo de acción abierto a la vez.
  const [dialog, setDialog] = useState<Dialog>(null);
  const closeDialog = useCallback(() => setDialog(null), []);
  // Imagen abierta en grande (para revisar recorte, calidad y que no tenga fondo)
  const [imgPreview, setImgPreview] = useState<{ url: string; title: string } | null>(null);
  const [toDelete, setToDelete] = useState<StoreProduct | null>(null);
  // Alta y edición con herramientas de imagen (pegar, subir, recortar del circular,
  // quitar fondo, generar con IA). `product: null` = producto nuevo.
  const [editor, setEditor] = useState<{ open: boolean; product: StoreProduct | null }>({
    open: false,
    product: null,
  });

  const { onPatch, onPatchPending, onCategory } = useProductPatches(storeSlug);
  const saveOrder = useSaveOrder();
  const removeProduct = useRemoveProduct(storeSlug);
  const cleanImages = useCleanImages(storeSlug);
  const clearAll = useClearCatalog(storeSlug);
  const syncVisibility = useSyncVisibility(storeSlug);
  const fillAll = useFillRegulars(storeSlug);

  // Qué flyer o circular manda hoy: para verlo desde acá y rescanear SÓLO sus productos.
  const ruling = useCatalogSummary(storeSlug).data?.ruling ?? null;
  const openPreview = useCallback((url: string, title: string) => setImgPreview({ url, title }), []);
  const openRuling = useOpenRuling(ruling, openPreview);
  const rescan = useRescanPhotos(storeSlug, ruling);
  const details = useFillDetails(storeSlug);

  const { flyerUrl, campaignUrl } = useEditorSources(storeSlug, editor.open);
  const { pasted, onActivate, clear: clearPasted } = useRowPaste(editor.open);

  // La búsqueda ya viene filtrada del servidor.
  const items = useMemo(
    () =>
      applyCatalogOrder(
        catalog.data?.items ?? [],
        saveOrder.pendingOrder?.store === storeSlug ? saveOrder.pendingOrder.ids : []
      ),
    [catalog.data, saveOrder.pendingOrder, storeSlug]
  );
  const total = catalog.data?.total ?? items.length;
  const pages = catalog.data?.pages ?? 1;
  const upcoming = useMemo(() => buildUpcomingSummary(items), [items]);
  const missingRegular = useMemo(() => missingRegularOf(catalog.data?.items ?? []), [catalog.data]);
  const generatingCount = cleaning ? items.filter((p) => isGeneratingImage(p, true)).length : 0;

  const onEdit = useCallback((p: StoreProduct) => setEditor({ open: true, product: p }), []);
  const onPreviewImage = useCallback(
    (p: StoreProduct) => setImgPreview({ url: p.imageUrl as string, title: p.name }),
    []
  );
  const refreshCatalog = useRefreshCatalog(storeSlug);

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index || saveOrder.isPending) return;
    const ids = items.map((p) => p._id);
    saveOrder.mutate({
      store: storeSlug,
      ids: moveCatalogItem(ids, ids, source.index, destination.index),
      offset: (page - 1) * PAGE_SIZE,
    });
  };

  const menu: MoreMenuItem[] = [
    {
      label: details.running
        ? `Completando marca / tamaño… ${details.progress}`
        : 'Completar marca / tamaño',
      hint: 'Relee el flyer o el circular SOLO para los productos sin marca o sin tamaño. No pisa lo que ya está escrito.',
      disabled: details.running,
      onClick: () => setDialog('details'),
    },
    {
      label: cleanImages.isPending ? 'Iniciando limpieza…' : 'Limpiar imágenes con IA',
      hint: 'Deja solo el producto, sin letras ni precios, con fondo transparente. Los sin foto se generan.',
      disabled: cleanImages.isPending,
      onClick: () => cleanImages.mutate(),
    },
    {
      label: rescan.running ? `Rescaneando fotos… ${rescan.progress}` : 'Rescanear fotos',
      hint: 'Vuelve a buscar cada producto en su página del circular, recorta su foto y verifica que sea él.',
      disabled: rescan.running,
      onClick: () => setDialog('rescan'),
    },
    {
      label: 'Borrar todos los productos',
      hint: 'Para volver a extraer desde cero (lectura o imágenes mal). Pide confirmación.',
      disabled: clearAll.isPending,
      danger: true,
      onClick: () => setDialog('clear'),
    },
  ];

  return (
    <Stack spacing={1.5}>
      <PanelCard>
        <SectionHeader
          title="Catálogo de la tienda"
          count={catalog.isLoading ? undefined : total}
          hint="Lo que ve el cliente en sus listas"
          action={
            <Tooltip title="Deja visibles en el Pre-RCS SOLO los productos del último flyer de campaña o SOLO los del último circular, y oculta el resto. Un click en vez de switch por switch.">
              <Button
                size="small"
                variant="contained"
                startIcon={<AutoAwesomeOutlinedIcon />}
                disabled={syncVisibility.isPending}
                onClick={() => setDialog('sync')}
              >
                {syncVisibility.isPending ? 'Sincronizando…' : 'Visibles = último flyer / circular'}
              </Button>
            </Tooltip>
          }
        />
        <Stack
          gap={1.5}
          sx={{ px: 2.25, py: 1.75 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Estos son los productos que ve el cliente en el flujo de listas (Pre-RCS). Solo salen
            los que tienen <strong>oferta</strong> y están <strong>visibles</strong>; los switches
            aplican al instante. {PASTE_HINT}
          </Typography>
          {ruling && (
            <RulingBar
              ruling={ruling}
              opening={openRuling.isPending}
              rescanning={rescan.running}
              rescanBusy={rescan.start.isPending}
              rescanProgress={rescan.progress}
              onOpen={() => openRuling.mutate()}
              onRescan={() => rescan.start.mutate('flyer')}
            />
          )}
          <CatalogToolbar
            search={search}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
            show={show}
            onShow={(v) => {
              setShow(v);
              setPage(1);
            }}
            missingRegular={missingRegular.length}
            filling={fillAll.isPending}
            onFillRegulars={() => fillAll.mutate(missingRegular)}
            onAdd={() => setEditor({ open: true, product: null })}
            menu={menu}
          />
          <CatalogNotices
            upcoming={upcoming}
            cleaning={cleaning}
            generatingCount={generatingCount}
          />
        </Stack>

        <Box sx={{ height: 4 }}>
          {saveOrder.isPending && <LinearProgress aria-label="Guardando orden de productos" />}
        </Box>
        {catalog.isLoading ? (
          <Box sx={{ px: 1 }}>
            <CatalogRowsSkeleton />
          </Box>
        ) : (
          <CatalogTable
            storeSlug={storeSlug}
            items={items}
            cleaning={cleaning}
            dragDisabled={saveOrder.isPending}
            onDragEnd={handleDragEnd}
            empty={
              deferredSearch.trim()
                ? { title: 'Nada coincide con la búsqueda.', hint: 'Prueba con otro nombre o marca.' }
                : {
                    title: 'Sin productos en el catálogo.',
                    hint: 'Carga un circular o usa "+ Agregar producto" para empezar.',
                  }
            }
            page={page}
            pages={pages}
            total={total}
            fetching={catalog.isFetching}
            onPage={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            categoryOptions={categoryOptions}
            onActivate={onActivate}
            onPatch={onPatch}
            onPatchPending={onPatchPending}
            onCategory={onCategory}
            onEdit={onEdit}
            onPreviewImage={onPreviewImage}
            onDelete={setToDelete}
          />
        )}
      </PanelCard>

      <ImagePreviewDialog
        key={imgPreview?.url || 'none'}
        url={imgPreview?.url ?? null}
        title={imgPreview?.title}
        onClose={() => setImgPreview(null)}
      />
      <ClearCatalogDialog
        open={dialog === 'clear'}
        count={items.length}
        busy={clearAll.isPending}
        onClose={closeDialog}
        onConfirm={(circulars) => clearAll.mutate(circulars, { onSuccess: closeDialog })}
      />
      <SyncVisibilityDialog
        open={dialog === 'sync'}
        busy={syncVisibility.isPending}
        onClose={closeDialog}
        onSync={(only) => syncVisibility.mutate(only, { onSuccess: closeDialog })}
      />
      <RescanPhotosDialog
        open={dialog === 'rescan'}
        busy={rescan.start.isPending}
        ruling={ruling}
        onClose={closeDialog}
        onRescan={(mode) => rescan.start.mutate(mode, { onSuccess: closeDialog })}
      />
      <FillDetailsDialog
        open={dialog === 'details'}
        busy={details.start.isPending}
        onClose={closeDialog}
        onFill={(source) => details.start.mutate(source, { onSuccess: closeDialog })}
      />
      <DeleteProductDialog
        product={toDelete}
        busy={removeProduct.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={(p) => removeProduct.mutate(p._id)}
      />
      <ProductEditorDialog
        open={editor.open}
        product={editor.product}
        storeSlug={storeSlug}
        flyerUrl={flyerUrl}
        campaignUrl={campaignUrl}
        onClose={() => setEditor((s) => ({ ...s, open: false }))}
        onSaved={refreshCatalog}
      />
      <PasteReplaceDialog
        file={pasted?.file ?? null}
        product={pasted?.product ?? null}
        onClose={clearPasted}
        onDone={refreshCatalog}
      />
    </Stack>
  );
}
