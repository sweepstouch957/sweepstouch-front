'use client';

/** Datos del postcard: la lista guardada, la búsqueda en el catálogo, guardar y bajar el QR. */
import { circularService } from '@/services/circular';
import { postcardService, type PostcardItem } from '@/services/postcard.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { circularKeys } from '../query-keys';

export function usePostcard(storeSlug: string, search: string) {
  const qc = useQueryClient();
  const postcard = useQuery({
    queryKey: circularKeys.postcard(storeSlug),
    queryFn: () => postcardService.get(storeSlug),
  });
  const [items, setItems] = useState<PostcardItem[]>([]);
  useEffect(() => {
    if (postcard.data) setItems(postcard.data.items);
  }, [postcard.data]);

  const { data: found, isFetching: searching } = useQuery({
    queryKey: circularKeys.postcardSearch(storeSlug, search.trim()),
    queryFn: () => circularService.getCatalogAdmin(storeSlug, { page: 1, limit: 20, q: search }),
    enabled: search.trim().length >= 2,
  });

  const save = useMutation({
    mutationFn: () => postcardService.save(storeSlug, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: circularKeys.postcard(storeSlug) }),
  });

  async function downloadQr() {
    const url = URL.createObjectURL(await postcardService.qrBlob(storeSlug));
    const a = document.createElement('a');
    a.href = url;
    a.download = `postcard-qr-${storeSlug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { postcard, items, setItems, found, searching, save, downloadQr };
}
