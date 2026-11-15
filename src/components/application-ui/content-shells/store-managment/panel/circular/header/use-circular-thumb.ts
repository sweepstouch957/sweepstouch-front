'use client';

import { circularService, type Circular } from '@/services/circular';
import { useQuery } from '@tanstack/react-query';
import { circularKeys } from '../query-keys';

const isImage = (url?: string) => /\.(png|jpe?g|webp)(\?|$)/i.test(url || '');

/** Miniatura del circular: imagen directa o, si es PDF, la portada que cachea el servidor. */
export function useCircularThumb(c: Circular | null) {
  const direct = c?.previewImageUrl || (isImage(c?.fileUrl) ? c?.fileUrl : '');
  const q = useQuery({
    queryKey: circularKeys.circularThumb(c?._id),
    queryFn: () =>
      circularService
        .getPreviewImage(c!._id)
        .then((r) => r.url)
        .catch(() => ''),
    enabled: !!c?._id && !direct && !!c?.fileUrl,
    staleTime: 60 * 60_000,
  });
  return direct || q.data || '';
}
