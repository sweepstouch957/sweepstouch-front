import { api } from '@/libs/axios';

/**
 * Reuniones (Otter.ai) — gateway /api/otter → ai-service /otter.
 * El Public API de Otter no publica OpenAPI y los nombres de campo varían entre
 * cuentas, así que los tipos marcan opcional casi todo y la UI usa `pick()`
 * para leer el primer campo que exista.
 */

/* ══════════ Types ══════════ */

export interface OtterStatus {
  ok: boolean;
  configured: boolean;
  code?: 'no_key' | 'unauthorized' | 'forbidden' | 'rate_limited' | 'network' | string;
  status?: number;
  message?: string;
}

export interface OtterSpeaker {
  id?: string;
  name?: string;
  email?: string;
}

export interface OtterConversation {
  id: string;
  title?: string;
  summary?: string;
  /** epoch segundos o ISO según el campo */
  created_at?: string | number;
  start_time?: string | number;
  end_time?: string | number;
  duration?: number;
  speakers?: OtterSpeaker[];
  owner?: OtterSpeaker;
  channel_id?: string;
  share_url?: string;
  otid?: string;
}

export interface OtterListResponse<T> {
  data?: T[];
  conversations?: T[];
  items?: T[];
  results?: T[];
  next_cursor?: string;
  cursor?: string;
  has_more?: boolean;
}

export interface OtterTranscriptSegment {
  speaker?: string | OtterSpeaker;
  speaker_name?: string;
  text?: string;
  start_offset?: number;
  end_offset?: number;
}

export interface OtterTranscript {
  text: string;
  segments?: OtterTranscriptSegment[];
  transcript?: OtterTranscriptSegment[] | string;
}

export interface OtterChannel {
  id: string;
  name?: string;
  description?: string;
  member_count?: number;
}

export interface OtterActionItem {
  id?: string;
  text?: string;
  title?: string;
  assignee?: string | OtterSpeaker;
  due_date?: string;
  completed?: boolean;
}

/* ── Digest propio (Claude sobre el transcript) ── */

export type DigestAudience = 'po' | 'general';

export interface DigestPerson {
  persona: string;
  hizo?: string;
  hara?: string;
  bloqueos?: string | null;
}

export interface DigestBlocker {
  que: string;
  quien?: string;
  impacto?: 'alto' | 'medio' | 'bajo';
}

export interface DigestActionItem {
  tarea: string;
  responsable?: string | null;
  fecha?: string | null;
}

export interface MeetingDigest {
  resumen: string;
  porPersona: DigestPerson[];
  decisiones: string[];
  bloqueos: DigestBlocker[];
  actionItems: DigestActionItem[];
  riesgos: string[];
  temas: string[];
}

export interface DigestResponse {
  audience: DigestAudience;
  truncated: boolean;
  digest: MeetingDigest;
  usage?: { inputTokens: number; outputTokens: number };
}

/* ══════════ Helpers ══════════ */

/** La lista viene bajo `data`, `conversations`, `items` o `results` según endpoint. */
export function unwrapList<T>(payload: OtterListResponse<T> | undefined): T[] {
  if (!payload) return [];
  return payload.data ?? payload.conversations ?? payload.items ?? payload.results ?? [];
}

export function nextCursor(payload: OtterListResponse<unknown> | undefined): string | undefined {
  return payload?.next_cursor ?? payload?.cursor ?? undefined;
}

/** Otter manda fechas como epoch (s o ms) o ISO. Normalizamos a Date. */
export function toDate(value?: string | number): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return new Date(value < 1e12 ? value * 1000 : value);
  const asNum = Number(value);
  if (!Number.isNaN(asNum) && value.trim() !== '') {
    return new Date(asNum < 1e12 ? asNum * 1000 : asNum);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function speakerName(s?: string | OtterSpeaker): string {
  if (!s) return '';
  return typeof s === 'string' ? s : s.name || s.email || '';
}

/* ══════════ API ══════════ */

const BASE = '/otter';

export const otterService = {
  status: async (): Promise<OtterStatus> => {
    const { data } = await api.get(`${BASE}/status`);
    return data;
  },

  listConversations: async (params: {
    workspaceId?: string;
    channelId?: string;
    cursor?: string;
    limit?: number;
  } = {}): Promise<OtterListResponse<OtterConversation>> => {
    const { data } = await api.get(`${BASE}/conversations`, { params });
    return data.data;
  },

  getConversation: async (id: string, include = 'all'): Promise<OtterConversation & Record<string, unknown>> => {
    const { data } = await api.get(`${BASE}/conversations/${id}`, { params: { include } });
    return data.data;
  },

  getTranscript: async (id: string): Promise<OtterTranscript> => {
    const { data } = await api.get(`${BASE}/conversations/${id}/transcript`);
    return data.data;
  },

  getActionItems: async (id: string): Promise<OtterListResponse<OtterActionItem>> => {
    const { data } = await api.get(`${BASE}/conversations/${id}/action-items`);
    return data.data;
  },

  getOutline: async (id: string): Promise<unknown> => {
    const { data } = await api.get(`${BASE}/conversations/${id}/outline`);
    return data.data;
  },

  getInsights: async (id: string): Promise<unknown> => {
    const { data } = await api.get(`${BASE}/conversations/${id}/insights`);
    return data.data;
  },

  getAudio: async (id: string): Promise<{ url?: string; audio_url?: string }> => {
    const { data } = await api.get(`${BASE}/conversations/${id}/audio`);
    return data.data;
  },

  listChannels: async (params: { cursor?: string; limit?: number } = {}): Promise<OtterListResponse<OtterChannel>> => {
    const { data } = await api.get(`${BASE}/channels`, { params });
    return data.data;
  },

  listChannelMembers: async (id: string): Promise<OtterListResponse<OtterSpeaker>> => {
    const { data } = await api.get(`${BASE}/channels/${id}/members`);
    return data.data;
  },

  digest: async (id: string, audience: DigestAudience = 'po'): Promise<DigestResponse> => {
    const { data } = await api.post(`${BASE}/conversations/${id}/digest`, { audience });
    return data.data;
  },

  /** Escape hatch: cualquier endpoint de Otter todavía no mapeado. */
  raw: async (path: string, params: Record<string, string | number> = {}): Promise<unknown> => {
    const { data } = await api.get(`${BASE}/raw`, { params: { path, ...params } });
    return data.data;
  },
};
