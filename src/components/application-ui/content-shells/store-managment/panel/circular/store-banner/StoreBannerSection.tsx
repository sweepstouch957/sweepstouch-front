'use client';

/**
 * Banner de campaña del Pre-RCS (lo que el cliente ve arriba de su lista en el linktree).
 * Por tienda y con vigencia: el vigente se muestra, los vencidos quedan de histórico y sin
 * banner vigente el linktree no muestra nada. Acá se sube, se previsualiza, se cambian
 * fechas/título y se borra. Contenedor: queries y mutaciones; las piezas reciben props.
 */
import { PanelCard } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { StoreBanner } from '@/services/circular.service';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { SectionHeader } from '../panelUi';
import ActiveBanner from './ActiveBanner';
import BannerForm from './BannerForm';
import BannerHistory from './BannerHistory';
import BannerPreviewDialog from './BannerPreviewDialog';
import DeleteBannerDialog from './DeleteBannerDialog';
import {
  useBannerFromFlyer,
  useDeleteBanner,
  useSaveBanner,
  useStoreBanners,
  useUploadBannerImage,
} from './use-store-banners';

export default function StoreBannerSection({
  storeSlug,
  storeId,
}: {
  storeSlug: string;
  storeId?: string;
}) {
  const { active, items, isLoading, campaignImage } = useStoreBanners(storeSlug, storeId);
  const fromFlyer = useBannerFromFlyer(storeSlug);
  const save = useSaveBanner(storeSlug);
  const remove = useDeleteBanner(storeSlug);
  const uploadImage = useUploadBannerImage();

  // Qué banner se edita (null = alta). El formulario se monta con key por banner y se vuelve
  // a montar al guardar: así queda limpio sin que el padre conozca sus campos.
  const [editing, setEditing] = useState<StoreBanner | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [preview, setPreview] = useState('');
  const [toDelete, setToDelete] = useState<StoreBanner | null>(null);

  return (
    <PanelCard>
      <Stack
        spacing={2.5}
        sx={{ p: { xs: 2, md: 2.5 } }}
      >
        <SectionHeader
          step={4}
          title="Banner de las listas"
          description="La imagen que el cliente ve arriba de su lista, sólo entre sus fechas. La IA la saca sola del encabezado del flyer o de la campaña."
          action={
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoAwesomeOutlinedIcon />}
                disabled={fromFlyer.isPending}
                onClick={() => fromFlyer.mutate(undefined)}
              >
                Del circular
              </Button>
              {campaignImage && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoAwesomeOutlinedIcon />}
                  disabled={fromFlyer.isPending}
                  onClick={() => fromFlyer.mutate(campaignImage)}
                >
                  De la campaña
                </Button>
              )}
            </>
          }
        />
        {fromFlyer.isPending && (
          <Box>
            <LinearProgress sx={{ borderRadius: 1 }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              La IA está ubicando el encabezado del flyer (unos 20 segundos)…
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <ActiveBanner
            active={active}
            isLoading={isLoading}
            onPreview={setPreview}
          />
          <BannerForm
            key={`${editing?._id ?? 'new'}-${formKey}`}
            editing={editing}
            saving={save.isPending}
            uploading={uploadImage.isPending}
            onUpload={(file) => uploadImage.mutateAsync(file).catch(() => null)}
            onSave={(values) =>
              save.mutate(
                { values, id: editing?._id },
                {
                  onSuccess: () => {
                    setEditing(null);
                    setFormKey((k) => k + 1);
                  },
                }
              )
            }
            onCancel={() => setEditing(null)}
          />
        </Box>

        <BannerHistory
          items={items}
          activeId={active?._id}
          editingId={editing?._id}
          isLoading={isLoading}
          deleting={remove.isPending}
          onPreview={setPreview}
          onEdit={setEditing}
          onDelete={setToDelete}
        />
      </Stack>

      <BannerPreviewDialog
        url={preview}
        onClose={() => setPreview('')}
      />
      <DeleteBannerDialog
        banner={toDelete}
        isActive={!!toDelete && toDelete._id === active?._id}
        deleting={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={(b) => {
          remove.mutate(b._id);
          setToDelete(null);
        }}
      />
    </PanelCard>
  );
}
