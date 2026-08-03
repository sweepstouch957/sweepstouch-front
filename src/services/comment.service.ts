import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export interface CommentFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface CommentMention {
  userId: string;
  name: string;
  email?: string;
}

export interface TaskComment {
  _id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  /** Texto crudo, con las menciones como @[Nombre](userId). */
  text: string;
  mentions: CommentMention[];
  files: CommentFile[];
  editedAt: string | null;
  createdAt: string;
}

export interface MentionRow {
  commentId: string;
  at: string;
  author: string;
  excerpt: string;
  task: {
    _id: string;
    identifier: string;
    title: string;
    status: string;
    priority: string;
    assigneeName: string;
    dueDate: string | null;
    projectId: string;
    epicId?: string | null;
  };
}

/* ══════════ Menciones ══════════
   Se guardan como @[Nombre](userId): el nombre es para leer, el id es el que
   manda. Dos personas pueden llamarse igual; el id no. */

export const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function mentionToken(name: string, userId: string): string {
  return `@[${name}](${userId})`;
}

/** Texto listo para mostrar: "@María José" en vez de la sintaxis cruda. */
export function plainText(text: string): string {
  return (text || '').replace(MENTION_RE, '@$1');
}

/** Parte el texto en trozos para pintar las menciones distinto. */
export function splitMentions(text: string): { type: 'text' | 'mention'; value: string; userId?: string }[] {
  const out: { type: 'text' | 'mention'; value: string; userId?: string }[] = [];
  let last = 0;
  const re = new RegExp(MENTION_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || '')) !== null) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) });
    out.push({ type: 'mention', value: m[1], userId: m[2] });
    last = m.index + m[0].length;
  }
  if (last < (text || '').length) out.push({ type: 'text', value: text.slice(last) });
  return out;
}

/* ══════════ API ══════════ */

export const commentService = {
  list: async (taskId: string): Promise<TaskComment[]> => {
    const { data } = await api.get(`/tasks/tasks/${taskId}/comments`);
    return data.data;
  },

  create: async (
    taskId: string,
    payload: {
      text: string;
      authorId: string;
      authorName: string;
      authorAvatar?: string;
      files?: CommentFile[];
    }
  ): Promise<TaskComment> => {
    const { data } = await api.post(`/tasks/tasks/${taskId}/comments`, payload);
    return data.data;
  },

  remove: async (commentId: string, authorId: string): Promise<void> => {
    await api.delete(`/tasks/comments/${commentId}`, { params: { authorId } });
  },

  /** Dónde me mencionaron: "en qué puedo ayudar". */
  myMentions: async (userId: string): Promise<MentionRow[]> => {
    const { data } = await api.get('/tasks/mentions', { params: { userId } });
    return data.data;
  },
};
