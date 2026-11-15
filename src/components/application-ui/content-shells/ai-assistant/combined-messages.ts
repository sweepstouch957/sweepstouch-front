/** Modo Combinado: recordar qué modelo dio cada respuesta y reagrupar el historial. */
import { type Message } from '@/services/ai.service';
import { COMBINED_MODEL_CACHE_KEY } from './constants';
import { BASE_AI_MODELS, BaseAIModel, MODEL_META } from './models';

export const getResponseCacheKey = (content: string) => content.trim().slice(0, 5000);

export const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const getCachedCombinedModel = (content: string): BaseAIModel | null => {
  if (typeof window === 'undefined') return null;

  try {
    const cache = JSON.parse(localStorage.getItem(COMBINED_MODEL_CACHE_KEY) || '{}') as Record<
      string,
      BaseAIModel
    >;
    return cache[getResponseCacheKey(content)] || null;
  } catch {
    return null;
  }
};

export const cacheCombinedModel = (model: BaseAIModel, content: string) => {
  if (typeof window === 'undefined' || !content.trim()) return;

  try {
    const cache = JSON.parse(localStorage.getItem(COMBINED_MODEL_CACHE_KEY) || '{}') as Record<
      string,
      BaseAIModel
    >;
    const entries = Object.entries({ ...cache, [getResponseCacheKey(content)]: model }).slice(-120);
    localStorage.setItem(COMBINED_MODEL_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* localStorage can be unavailable in private or restricted contexts */
  }
};

export const buildCombinedContentFromMessages = (assistantMessages: Message[]) => {
  const usedModels = new Set<BaseAIModel>();

  return assistantMessages
    .map((message, index) => {
      let model = getCachedCombinedModel(message.content);

      if (!model || usedModels.has(model)) {
        model =
          BASE_AI_MODELS.find((candidate) => !usedModels.has(candidate)) || BASE_AI_MODELS[index];
      }

      usedModels.add(model);
      return `## Respuesta de: ${MODEL_META[model].label}\n\n${message.content}`;
    })
    .join('\n\n---\n\n');
};

export const normalizeCombinedMessages = (rawMessages: Message[]) => {
  const messages = rawMessages.filter((m: Message) => m.role !== 'system');
  const normalized: Message[] = [];

  for (let i = 0; i < messages.length; i += 1) {
    const userMessage = messages[i];
    const assistantMessages: Message[] = [];
    let cursor = i;

    while (
      messages[cursor]?.role === 'user' &&
      messages[cursor + 1]?.role === 'assistant' &&
      messages[cursor].content === userMessage?.content &&
      assistantMessages.length < BASE_AI_MODELS.length
    ) {
      assistantMessages.push(messages[cursor + 1]);
      cursor += 2;
    }

    if (userMessage?.role === 'user' && assistantMessages.length >= 2) {
      normalized.push(userMessage);
      normalized.push({
        role: 'assistant',
        content: buildCombinedContentFromMessages(assistantMessages),
        tokens:
          assistantMessages.reduce((total, message) => total + (message.tokens || 0), 0) ||
          undefined,
        timestamp:
          assistantMessages[assistantMessages.length - 1].timestamp ||
          assistantMessages[0].timestamp,
      });
      i = cursor - 1;
      continue;
    }

    normalized.push(userMessage);
  }

  return normalized;
};
