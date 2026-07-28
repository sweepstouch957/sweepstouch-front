import { api } from '@/libs/axios';

export interface DemoEntry {
  _id: string;
  name: string;
  prompt: string;
  status: 'generating' | 'ready' | 'error';
  errorMsg?: string;
  pinned?: boolean;
  createdBy: { id: string; name: string; role: string };
  views: number;
  lastViewed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoDetail extends DemoEntry {
  html: string | null;
  pinned?: boolean;
}

export const demoService = {
  list: () =>
    api.get<DemoEntry[]>('/ai/demos').then((r) => r.data),

  create: (payload: { name: string; prompt: string }) =>
    api.post<DemoEntry>('/ai/demos', payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/ai/demos/${id}`).then((r) => r.data),

  update: (id: string, payload: { name?: string; generatedHtml?: string }) =>
    api.patch<DemoEntry>(`/ai/demos/${id}`, payload).then((r) => r.data),

  /** Público — sin auth. Llama directo al gateway /api/demo-view/:id */
  getPublic: (id: string): Promise<DemoDetail> => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
    return fetch(`${base}/demo-view/${id}`, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('Demo no encontrado');
      return r.json();
    });
  },

  trackView: (id: string) => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
    fetch(`${base}/demo-view/${id}/view`, { method: 'POST' }).catch(() => {});
  },
};
