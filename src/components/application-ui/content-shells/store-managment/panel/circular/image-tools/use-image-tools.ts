'use client';

/**
 * Lógica de las herramientas de imagen: mutaciones (con sus toasts) y el "banco de trabajo"
 * de la imagen del editor (subir, pegar, recortar, limpiar, generar, rescanear).
 */
import { circularService, type StoreProduct } from '@/services/circular.service';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CLEANING, type CropSource, type PctBox, type ProductFormValues } from './constants';
import { aiClean, hostImage } from './image-api';
import { errMsg, imageFromPaste, pendingOf, productBody, toDayInput } from './utils';

/* ─────────────── Pegar sobre una fila ─────────────── */

export function useReplaceProductImage() {
  return useMutation({
    mutationFn: async (v: { file: File; product: StoreProduct; clean: boolean }) => {
      const url = await hostImage(v.file, { clean: v.clean, name: v.product.name });
      await circularService.updateStoreProduct(v.product._id, { imageUrl: url });
    },
    onSuccess: (_d, v) => toast.success(`Imagen de "${v.product.name}" reemplazada`),
    onError: (e) => toast.error(errMsg(e, 'No se pudo reemplazar la imagen')),
  });
}

/* ─────────────── Guardar alta / edición ─────────────── */

export function useSaveProduct(storeSlug: string) {
  return useMutation({
    mutationFn: async ({
      product,
      values,
      imageUrl,
    }: {
      product: StoreProduct | null;
      values: ProductFormValues;
      imageUrl: string;
    }) => {
      const body = productBody(values, imageUrl);
      const pending = pendingOf(product);
      if (product && pending) {
        // Producto que todavía no sale: el precio que se edita es el que VA a salir (pending),
        // no el de hoy. Si se guardara en `price`, el día de la fecha el pendiente lo pisaría.
        const {
          price: pPrice,
          originalPrice: pRegular,
          packQty: pQty,
          packUnit: pUnit,
          ...rest
        } = body;
        await circularService.updateStoreProduct(product._id, rest as any);
        const day = values.pendingDay;
        const movedDay = day && day !== toDayInput(pending.from);
        await circularService.updatePending(product._id, {
          price: pPrice,
          originalPrice: pRegular,
          packQty: pQty,
          packUnit: pUnit,
          // 00:00 hora del Este del día elegido (04:00 UTC), igual que el import de campañas.
          ...(movedDay ? { from: `${day}T04:00:00.000Z` } : {}),
        });
      } else if (product) {
        await circularService.updateStoreProduct(product._id, {
          ...body,
          hasOffer: !!body.originalPrice || product.hasOffer,
        } as any);
      } else {
        await circularService.createStoreProduct({ storeSlug, ...body });
      }
    },
    onSuccess: (_d, v) => toast.success(v.product ? 'Producto actualizado' : 'Producto agregado'),
    onError: (e) => toast.error(errMsg(e, 'No se pudo guardar el producto')),
  });
}

/* ─────────────── Imagen del editor ─────────────── */

type Task = { label: string; fn: () => Promise<void>; fail: string };

/**
 * Estado de la imagen del editor + las acciones que la cambian. `busy` es el texto de lo que
 * se está haciendo (se muestra debajo de la imagen). `hints()` lee nombre e indicaciones IA
 * del formulario en el momento de usar el botón (sin re-render por tecla).
 */
export function useImageWorkbench({
  open,
  product,
  cropping,
  cropUrl,
  hints,
  onCropped,
}: {
  open: boolean;
  product: StoreProduct | null;
  cropping: CropSource;
  cropUrl?: string;
  hints: () => { name?: string; prompt: string };
  onCropped: () => void;
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setImageUrl(product?.imageUrl ?? '');
    setBusy(null);
  }, [open, product]);

  const task = useMutation({
    mutationFn: (t: Task) => t.fn(),
    onMutate: (t) => setBusy(t.label),
    onError: (e, t) => toast.error(errMsg(e, t.fail)),
    onSettled: () => setBusy(null),
  });
  const { mutate } = task;
  const run = useCallback((t: Task) => mutate(t), [mutate]);

  // Subida o soltada: se aloja tal cual (suele ser una foto ya buena; "Quitar fondo" la limpia).
  // Pegada: casi siempre es una captura del flyer con precio → se muestra y se limpia sola con IA.
  // Si la IA falla queda la captura alojada, no se pierde nada.
  const takeFile = useCallback(
    (file: File, clean = false) =>
      run({
        label: clean ? 'Subiendo captura…' : 'Subiendo imagen…',
        fn: async () => {
          const raw = await hostImage(file, { clean: false });
          setImageUrl(raw);
          if (!clean) return;
          setBusy(CLEANING);
          const h = hints();
          setImageUrl(await aiClean(raw, h.name, undefined, h.prompt));
        },
        fail: clean
          ? 'La IA no pudo limpiar la captura; quedó tal cual'
          : 'No se pudo subir la imagen',
      }),
    [run, hints]
  );

  // Ctrl+V en cualquier parte del modal (salvo dentro de un campo de texto con texto en el portapapeles).
  useEffect(() => {
    if (!open || cropping) return;
    const onPaste = (e: ClipboardEvent) => {
      const f = imageFromPaste(e);
      if (!f) return; // texto: que lo maneje el campo
      e.preventDefault();
      takeFile(f, true);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, cropping, takeFile]);

  const removeBg = () =>
    run({
      label: CLEANING,
      fn: async () => {
        const h = hints();
        setImageUrl(await aiClean(imageUrl, h.name, undefined, h.prompt));
      },
      fail: 'No se pudo limpiar la imagen',
    });

  const generate = () =>
    run({
      label: 'Generando con IA…',
      fn: async () => {
        const h = hints();
        const r = await circularService.aiProductImage(
          h.name ?? '',
          product?.category,
          h.prompt || undefined
        );
        setImageUrl(r.imageUrl);
      },
      fail: 'La IA no pudo generar la imagen',
    });

  const cropFromFlyer = (box: PctBox) =>
    run({
      label: CLEANING,
      fn: async () => {
        const h = hints();
        setImageUrl(await aiClean(cropUrl as string, h.name, box, h.prompt));
        onCropped();
      },
      fail:
        cropping === 'campaign' ? 'No se pudo recortar el flyer' : 'No se pudo recortar el circular',
    });

  const rescan = () =>
    product?._id &&
    run({
      label: 'Buscando el producto en el circular y recortando su foto…',
      fn: async () => {
        const r = await circularService.rescanProductPhoto(product._id);
        setImageUrl(r.item.imageUrl || '');
        toast.success(
          r.relocated
            ? 'Foto re-ubicada en el circular y limpiada'
            : 'No estaba en el circular: foto generada desde el nombre'
        );
      },
      fail: 'No se pudo rescanear la foto',
    });

  return {
    imageUrl,
    busy,
    takeFile,
    removeBg,
    generate,
    cropFromFlyer,
    rescan,
    clear: () => setImageUrl(''),
  };
}
