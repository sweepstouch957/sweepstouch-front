/** Proveedores de IA del asistente y el modo Combinado (los tres a la vez). */
export type BaseAIModel = 'openai' | 'claude' | 'gemini';
export type AIModel = BaseAIModel | 'combined';

export const BASE_AI_MODELS: BaseAIModel[] = ['openai', 'claude', 'gemini'];

export const MODEL_META: Record<BaseAIModel, { label: string; icon: string }> = {
  openai: { label: 'ChatGPT', icon: '/chatgpt.png' },
  claude: { label: 'Claude', icon: '/claude.png' },
  gemini: { label: 'Gemini', icon: '/gemini.png' },
};

export type CombinedResponse = {
  content: string;
  status: 'loading' | 'done' | 'error';
  error?: string;
  tokens?: number;
};

export type CombinedResponses = Record<BaseAIModel, CombinedResponse>;
export type RunModelOptions = {
  timeoutMs?: number;
  keepLoadingOnTimeout?: boolean;
  retryLabel?: string;
};

export type RunModelResult = {
  completed: boolean;
  timedOut: boolean;
  errored: boolean;
};

export const createCombinedResponses = (): CombinedResponses => ({
  openai: { content: '', status: 'loading' },
  claude: { content: '', status: 'loading' },
  gemini: { content: '', status: 'loading' },
});

export const getModelLabel = (model: AIModel) =>
  model === 'combined' ? 'Combinado' : MODEL_META[model].label;

// Campo del AIConfig donde vive la versión elegida de cada proveedor
export const CONFIG_FIELD: Record<BaseAIModel, 'model' | 'openaiModel' | 'geminiModel'> = {
  claude: 'model',
  openai: 'openaiModel',
  gemini: 'geminiModel',
};

export const buildCombinedContent = (responses: CombinedResponses) =>
  BASE_AI_MODELS.map((model) => {
    const response = responses[model];
    const title = `## Respuesta de: ${MODEL_META[model].label}`;

    if (response.status === 'error') {
      return `${title}\n\nError: ${response.error || 'No se pudo obtener la respuesta.'}`;
    }

    return `${title}\n\n${response.content || 'Cargando respuesta...'}`;
  }).join('\n\n---\n\n');
