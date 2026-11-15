/** Tiempos y textos del chat (streaming, recuperación, modo Combinado). */
export const COMBINED_MODEL_CACHE_KEY = 'sweepstouch-ai-combined-response-models';
export const COMBINED_FIRST_PASS_TIMEOUT_MS = 30000;
export const COMBINED_CONVERSATION_LOOKUP_ATTEMPTS = 12;
export const COMBINED_CONVERSATION_LOOKUP_DELAY_MS = 750;
export const STREAMING_TEXT_FLUSH_MS = 75;
export const CHAT_RECOVERY_INTERVAL_MS = 8000;
export const CHAT_POST_STREAM_RECOVERY_TIMEOUT_MS = 120000;
export const CHAT_SILENT_STREAM_TIMEOUT_MS = 240000;
export const NEW_CONVERSATION_LOOKUP_INTERVAL_MS = 1500;
export const EMPTY_RESPONSE_MESSAGE =
  'La API de IA no devolvió una respuesta a tiempo para esta consulta. Intenta de nuevo; si vuelve a pasar, revisa los logs del backend o de las herramientas de datos.';
