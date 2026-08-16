/**
 * shelfsigns.service.ts
 *
 * Única capa del módulo Shelfsigns que habla con la IA. Se apoya en la infra
 * que el panel ya tiene (`ai.service.ts`): sube el flyer a `/ai/upload` y hace
 * la extracción por `/ai/chat` con `model: 'claude'`.
 *
 * Por qué este rodeo y no una llamada directa a Anthropic: la CSP de
 * next.config.js sólo permite `connect-src` hacia *.sweepstouch.com.
 *
 * Deuda técnica conocida (ver docs/shelfsigns/FASE-2-Y-DEUDA-TECNICA.md):
 * cada extracción deja una conversación en el historial del AI Assistant, y
 * `max_tokens` lo fija AIConfig en el backend. Cuando exista el endpoint
 * dedicado (`/ai/extract-shelfsigns`), este archivo es el único que cambia.
 */
import { sendChatMessage, uploadFile, type Attachment } from '@/services/ai.service';

export interface ExtractionRequest {
  /** Flyer ya reducido (~1600px de lado) — el original se guarda para los recortes. */
  file: File;
  /** Prompt de extracción, con el sufijo de "continuar análisis" si aplica. */
  prompt: string;
  /** Identidad del usuario: /ai/chat la exige para registrar la conversación. */
  user: { id: string; name: string; role: string };
  signal?: AbortSignal;
}

export interface ExtractionResponse {
  /** Texto completo devuelto por el modelo (JSON, según lo validado). */
  text: string;
  /** Attachment subido: se reusa en "continuar análisis" sin volver a subir. */
  attachment: Attachment;
  inputTokens?: number;
  outputTokens?: number;
}

/** Sube el flyer una sola vez; las pasadas siguientes reusan el attachment. */
export async function uploadFlyer(file: File): Promise<Attachment> {
  const attachment = await uploadFile(file);
  // El backend clasifica por mimeType, pero si el upload no lo marcó como
  // imagen el modelo recibe el adjunto como archivo y no lo mira.
  return { ...attachment, type: 'image' };
}

/**
 * Manda el flyer al modelo y devuelve el texto crudo de la respuesta.
 *
 * No parsea: de eso se encarga el módulo (`parse.ts`), que sabe qué hacer con
 * un JSON truncado. Acá sólo transporte.
 */
export function extractFromFlyer(
  attachment: Attachment,
  { prompt, user, signal }: Omit<ExtractionRequest, 'file'>
): Promise<ExtractionResponse> {
  return new Promise((resolve, reject) => {
    let text = '';
    let settled = false;

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };

    sendChatMessage(
      {
        message: prompt,
        attachments: [attachment],
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        model: 'claude',
        signal,
      },
      (chunk) => {
        text += chunk;
      },
      (meta) => {
        if (settled) return;
        settled = true;
        resolve({
          text,
          attachment,
          inputTokens: meta?.inputTokens,
          outputTokens: meta?.outputTokens,
        });
      },
      (error) => fail(error || 'La IA no pudo procesar el flyer')
    ).then(
      () => {
        // El stream puede cerrarse sin evento `done` (corte de red, timeout del
        // proxy). Si alcanzó a llegar texto, se intenta parsear igual.
        if (settled) return;
        settled = true;
        if (text.trim()) resolve({ text, attachment });
        else reject(new Error('La IA no devolvió respuesta'));
      },
      (err: any) => fail(err?.message || 'Error de red al analizar el flyer')
    );
  });
}
