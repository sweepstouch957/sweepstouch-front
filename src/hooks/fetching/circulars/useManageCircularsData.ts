// src/components/circulars/useManageCircularsData.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { circularService, type Circular } from '@services/circular.service';

export type RowItem = {
  slug: string;
  storeName: string;
  storeImage?: string;
  audience?: number;
  current: Circular | null;
  next: Circular | null;
};

export type ManageCircularsResult = {
  totals: { active: number; scheduled: number; expired: number };
  rows: RowItem[];
};

export function useManageCircularsData(search: string) {
  const query = useQuery<ManageCircularsResult>({
    queryKey: ['circulars', 'manage', search],
    queryFn: async () => {
      const overview = await circularService.getOverview(
        search ? { q: search } : undefined
      ); // { totals, byStore }

      const perStore: RowItem[] = await Promise.all(
        (overview?.byStore || []).map(async (item) => {
          const slug = item._id;
          const store = item.store;

          const storeName = store?.name || slug;
          const storeImage = store?.image;
          const audience = store?.customerCount;      

          const { items } = await circularService.getByStore(slug);

          const now = Date.now();
          const current = items.find((i) => i.status === 'active') || null;
          const next =
            items.find(
              (i) =>
                i.status === 'scheduled' &&
                new Date(i.startDate).getTime() > now
            ) || null;

          return {
            slug,
            storeName,
            storeImage,
            audience,
            current,
            next,
          };
        })
      );

      return {
        totals: overview?.totals || { active: 0, scheduled: 0, expired: 0 },
        rows: perStore,
      };
    },
    staleTime: 60 * 1000,
  });

  return query;
}
