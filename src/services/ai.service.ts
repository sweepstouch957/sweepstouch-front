/**
 * ai.service.ts
 *
 * Frontend API client for the AI assistant.
 * Uses the shared axios instance from @/libs/axios for consistent
 * auth headers, baseURL, and error handling.
 */
import { api } from '@/libs/axios';

/* ─── Types ─── */

export interface Attachment {
  type: 'image' | 'file' | 'document';
  url: string;
  name: string;
  mimeType: string;
  publicId?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  tokens?: number;
  timestamp?: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  title: string;
  messages: Message[];
  totalTokens: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIConfig {
  _id: string;
  systemPrompt: string;
  rules: { text: string; active: boolean }[];
  restrictions: { text: string; active: boolean }[];
  model: string;
  temperature: number;
  maxTokens: number;
  contextSources: {
    team: boolean;
    tasks: boolean;
    campaigns: boolean;
    stores: boolean;
    audience: boolean;
  };
  allowedRoles: string[];
}

/* ─── Chat (SSE Streaming) ─── */

export async function sendChatMessage(
  params: {
    conversationId?: string;
    message: string;
    attachments?: Attachment[];
    userId: string;
    userName: string;
    userRole: string;
    model?: 'claude' | 'gemini';
    signal?: AbortSignal;
  },
  onText: (text: string) => void,
  onDone: (meta: { inputTokens: number; outputTokens: number; toolResults?: any[]; images?: any[] }) => void,
  onError: (error: string) => void,
  onToolStart?: (data: { tool: string; input: Record<string, any> }) => void,
  onToolResult?: (data: { tool: string; result: Record<string, any> }) => void,
  onImage?: (data: { url: string; name: string }) => void,
): Promise<void> {
  const { signal, ...bodyParams } = params;
  const token = typeof window !== 'undefined' ? localStorage.getItem('uifort-authentication') : null;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/';

  let response: Response;
  try {
    response = await fetch(`${baseURL}ai/chat`, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': 'panel',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(bodyParams),
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Network error');
    return;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    onError(err.error || `Request failed (${response.status})`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') onText(data.text);
            else if (data.type === 'done') onDone(data);
            else if (data.type === 'error') onError(data.error);
            else if (data.type === 'tool_start') onToolStart?.(data);
            else if (data.type === 'tool_result') onToolResult?.(data);
            else if (data.type === 'image') onImage?.(data);
          } catch { /* skip invalid JSON */ }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Stream interrupted');
  }
}

/* ─── Conversations ─── */

export async function getConversations(userId?: string, page = 0) {
  const { data } = await api.get('/ai/conversations', { params: { userId, page } });
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await api.get(`/ai/conversations/${id}`);
  return data;
}

export async function deleteConversation(id: string) {
  const { data } = await api.delete(`/ai/conversations/${id}`);
  return data;
}

export async function renameConversation(id: string, title: string) {
  const { data } = await api.post(`/ai/conversations/${id}/title`, { title });
  return data;
}

export async function refreshConversationContext(id: string) {
  const { data } = await api.post(`/ai/conversations/${id}/refresh-context`);
  return data;
}

/* ─── File Upload ─── */

export async function uploadFile(file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/ai/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/* ─── Config ─── */

export async function getAIConfig(): Promise<AIConfig> {
  const { data } = await api.get('/ai/config');
  return data;
}

export async function updateAIConfig(updates: Partial<AIConfig>) {
  const { data } = await api.put('/ai/config', updates);
  return data;
}

export async function addRule(text: string) {
  const { data } = await api.post('/ai/config/rules', { text });
  return data;
}

export async function removeRule(index: number) {
  const { data } = await api.delete(`/ai/config/rules/${index}`);
  return data;
}

export async function addRestriction(text: string) {
  const { data } = await api.post('/ai/config/restrictions', { text });
  return data;
}

export async function removeRestriction(index: number) {
  const { data } = await api.delete(`/ai/config/restrictions/${index}`);
  return data;
}

/* ─── Admin ─── */

export async function getAdminConversations(page = 0, search?: string) {
  const { data } = await api.get('/ai/admin/conversations', { params: { page, search } });
  return data;
}

/* ─── Context ─── */

export async function refreshContext() {
  const { data } = await api.get('/ai/context/refresh');
  return data;
}

export async function previewContext() {
  const { data } = await api.get('/ai/context/preview');
  return data;
}

/* ─── Image Generation (SSE stream, same pattern as sendChatMessage) ─── */

export async function generateImage(
  params: { prompt: string; style?: string; signal?: AbortSignal },
  onText: (text: string) => void,
  onImage: (data: { url: string; name: string }) => void,
  onDone: (meta: { images?: any[] }) => void,
  onError: (error: string) => void,
): Promise<void> {
  const { signal, ...bodyParams } = params;
  const token = typeof window !== 'undefined' ? localStorage.getItem('uifort-authentication') : null;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/';

  let response: Response;
  try {
    response = await fetch(`${baseURL}ai/generate-image`, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': 'panel',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(bodyParams),
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Network error');
    return;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    onError(err.error || `Request failed (${response.status})`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') onText(data.text);
            else if (data.type === 'image') onImage(data);
            else if (data.type === 'done') onDone(data);
            else if (data.type === 'error') onError(data.error);
          } catch { /* skip */ }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Stream interrupted');
  }
}

/* ─── Audio Transcription ─── */

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('uifort-authentication') : null;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/';
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  const response = await fetch(`${baseURL}ai/transcribe`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'x-app-id': 'panel',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!response.ok) throw new Error('Transcription failed');
  const { text } = await response.json();
  return text || '';
}

/* ─── Spotlight Search (one-shot AI query with tool_use) ─── */

export interface AISearchResult {
  type: 'navigate' | 'answer' | 'both';
  answer?: string;
  route?: string;
  routeTitle?: string;
  actions?: { tool: string; input: Record<string, any>; result: Record<string, any> }[];
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export async function searchWithAI(query: string): Promise<AISearchResult> {
  const { data } = await api.post('/ai/search', { query });
  return data;
}
