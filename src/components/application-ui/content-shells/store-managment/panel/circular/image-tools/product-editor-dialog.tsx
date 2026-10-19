'use client';

/**
 * Alta/edición de un producto del catálogo con imagen pegada, subida, recortada del circular
 * (o del flyer de la campaña) o generada con IA, y quitar fondo.
 * El formulario vive acá (react-hook-form); la imagen, en useImageWorkbench.
 */
import type { StoreProduct } from '@/services/circular.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import type { CropSource, ProductFormValues } from './constants';
import { FlyerCropper } from './flyer-cropper';
import { ImageWorkbench } from './image-workbench';
import { ProductFields } from './product-fields';
import { useImageWorkbench, useSaveProduct } from './use-image-tools';
import { pendingOf, productDefaults } from './utils';

/** Guardar sólo con nombre y precio: lo observa el botón, no el diálogo entero. */
function SubmitButton({ busy, isNew }: { busy: boolean; isNew: boolean }) {
  const { control } = useFormContext<ProductFormValues>();
  const [name, price] = useWatch({ control, name: ['name', 'price'] });
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={!name.trim() || !price.trim() || busy}
    >
      {isNew ? 'Guardar producto' : 'Guardar cambios'}
    </Button>
  );
}

const titleFor = (cropping: CropSource, isNew: boolean) =>
  cropping === 'campaign'
    ? 'Recortar del flyer de la campaña'
    : cropping
      ? 'Recortar del circular'
      : isNew
        ? 'Agregar producto'
        : 'Editar producto';

export function ProductEditorDialog({
  open,
  product,
  storeSlug,
  flyerUrl,
  campaignUrl,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = producto nuevo */
  product: StoreProduct | null;
  storeSlug: string;
  /** Imagen del circular vigente (o su primera página renderizada) para "Recortar circular". */
  flyerUrl?: string;
  /** Arte del flyer de la campaña vigente para "Recortar flyer". */
  campaignUrl?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useForm<ProductFormValues>({ defaultValues: productDefaults(product) });
  const { reset, getValues, handleSubmit } = form;
  // false | 'circular' | 'campaign': de qué imagen se recorta.
  const [cropping, setCropping] = useState<CropSource>(false);
  const cropUrl = cropping === 'campaign' ? campaignUrl : flyerUrl;
  // Producto que todavía no sale: el precio que se edita es el que VA a salir (pending).
  const pending = pendingOf(product);
  const isNew = !product;

  useEffect(() => {
    if (!open) return;
    reset(productDefaults(product));
    setCropping(false);
  }, [open, product, reset]);

  // Los listeners y acciones de imagen leen nombre e indicaciones al usarse, no por render.
  const hints = useCallback(
    () => ({
      name: getValues('name').trim() || undefined,
      prompt: getValues('aiPrompt').trim(),
    }),
    [getValues]
  );
  const stopCropping = useCallback(() => setCropping(false), []);
  const wb = useImageWorkbench({
    open,
    product,
    cropping,
    cropUrl,
    hints,
    onCropped: stopCropping,
  });

  const save = useSaveProduct(storeSlug);
  const busy = wb.busy || (save.isPending ? 'Guardando…' : null);

  const onSubmit = (values: ProductFormValues) => {
    if (!values.name.trim() || !values.price.trim() || busy) return;
    save.mutate(
      { product, values, imageUrl: wb.imageUrl },
      {
        onSuccess: () => {
          onSaved();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth={cropping ? 'md' : 'sm'}
      fullWidth
      PaperProps={{ component: 'form', noValidate: true, onSubmit: handleSubmit(onSubmit) }}
    >
      <FormProvider {...form}>
        <DialogTitle sx={{ pb: 0.5 }}>
          {titleFor(cropping, isNew)}
          {!cropping && (
            <Typography
              component="span"
              display="block"
              variant="body2"
              color="text.secondary"
            >
              Verificá los datos y la imagen. Podés pegar una captura con Ctrl+V.
            </Typography>
          )}
        </DialogTitle>

        <DialogContent>
          {cropping && cropUrl ? (
            <FlyerCropper
              flyerUrl={cropUrl}
              busy={!!busy}
              onCancel={stopCropping}
              onCrop={wb.cropFromFlyer}
            />
          ) : (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={2.5}
              sx={{ mt: 1 }}
            >
              <ImageWorkbench
                imageUrl={wb.imageUrl}
                busy={busy}
                canCropCircular={!!flyerUrl}
                canCropCampaign={!!campaignUrl}
                canRescan={!!product?._id}
                onFile={wb.takeFile}
                onCropCircular={() => setCropping('circular')}
                onCropCampaign={() => setCropping('campaign')}
                onRemoveBg={wb.removeBg}
                onRescan={wb.rescan}
                onGenerate={wb.generate}
                onClear={wb.clear}
              />
              <ProductFields
                isNew={isNew}
                pending={pending}
                currentPrice={product?.price}
                busy={!!busy}
                canCrop={!!flyerUrl || !!campaignUrl}
              />
            </Stack>
          )}
        </DialogContent>

        {!cropping && (
          <DialogActions>
            <Button
              onClick={onClose}
              disabled={!!busy}
            >
              Cancelar
            </Button>
            <SubmitButton
              busy={!!busy}
              isNew={isNew}
            />
          </DialogActions>
        )}
      </FormProvider>
    </Dialog>
  );
}
