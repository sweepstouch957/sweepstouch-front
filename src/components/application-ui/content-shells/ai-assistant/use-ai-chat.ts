'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  deleteConversation,
  generateImage,
  getAvailableModels,
  getConversation,
  getConversations,
  sendChatMessage,
  transcribeAudio,
  updateAIConfig,
  uploadFile,
  type Attachment,
  type AvailableModels,
  type Conversation,
  type Message,
} from '@/services/ai.service';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cacheCombinedModel, normalizeCombinedMessages, wait } from './combined-messages';
import {
  CHAT_POST_STREAM_RECOVERY_TIMEOUT_MS,
  CHAT_RECOVERY_INTERVAL_MS,
  CHAT_SILENT_STREAM_TIMEOUT_MS,
  COMBINED_CONVERSATION_LOOKUP_ATTEMPTS,
  COMBINED_CONVERSATION_LOOKUP_DELAY_MS,
  COMBINED_FIRST_PASS_TIMEOUT_MS,
  EMPTY_RESPONSE_MESSAGE,
  NEW_CONVERSATION_LOOKUP_INTERVAL_MS,
  STREAMING_TEXT_FLUSH_MS,
} from './constants';
import {
  AIModel,
  BASE_AI_MODELS,
  BaseAIModel,
  buildCombinedContent,
  CombinedResponse,
  CombinedResponses,
  CONFIG_FIELD,
  createCombinedResponses,
  MODEL_META,
  RunModelOptions,
  RunModelResult,
} from './models';

/**
 * Estado y lógica del asistente: conversaciones, envío con streaming (un modelo o los tres
 * en modo Combinado), recuperación si el stream se corta, adjuntos, voz e imágenes.
 * La vista (AIAssistant.tsx) sólo pinta lo que devuelve.
 */
export function useAiChat({ mdUp }: { mdUp: boolean }) {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [combinedResponses, setCombinedResponses] = useState<CombinedResponses | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(mdUp);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel>('openai');
  // Versiones por proveedor, en vivo de cada API (Anthropic/OpenAI/Google)
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [attachAnchor, setAttachAnchor] = useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // Listas de versiones por proveedor (los modelos nuevos aparecen solos)
  useEffect(() => {
    getAvailableModels()
      .then(setAvailableModels)
      .catch(() => {});
  }, []);

  // Elegir una versión concreta: queda seleccionado el proveedor y la versión
  // se persiste en el AIConfig global (misma config que usa el backend al chatear)
  const handlePickVersion = useCallback(async (provider: BaseAIModel, id: string) => {
    setSelectedModel(provider);
    setAvailableModels((prev) =>
      prev ? { ...prev, current: { ...prev.current, [provider]: id } } : prev
    );
    try {
      await updateAIConfig({ [CONFIG_FIELD[provider]]: id } as any);
      toast.success(`${MODEL_META[provider].label} → ${id}`);
    } catch {
      toast.error('No se pudo guardar el modelo');
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');
  const streamingFlushTimeoutRef = useRef<number | null>(null);
  const pendingStreamingTextRef = useRef('');
  const combinedResponsesRef = useRef<CombinedResponses>(createCombinedResponses());
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const userId = user?._id || user?.id || '';
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
  const userRole = user?.role || 'admin';
  const isAdmin = userRole === 'admin';

  const clearStreamingFlush = useCallback(() => {
    if (streamingFlushTimeoutRef.current) {
      window.clearTimeout(streamingFlushTimeoutRef.current);
      streamingFlushTimeoutRef.current = null;
    }
    pendingStreamingTextRef.current = '';
  }, []);

  const queueStreamingText = useCallback((nextText: string) => {
    pendingStreamingTextRef.current = nextText;
    if (streamingFlushTimeoutRef.current) return;

    streamingFlushTimeoutRef.current = window.setTimeout(() => {
      streamingFlushTimeoutRef.current = null;
      setStreamingText(pendingStreamingTextRef.current);
      pendingStreamingTextRef.current = '';
    }, STREAMING_TEXT_FLUSH_MS);
  }, []);

  const updateCombinedResponse = useCallback(
    (model: BaseAIModel, updates: Partial<CombinedResponse>) => {
      setCombinedResponses((prev) => {
        const current = prev || createCombinedResponses();
        const next: CombinedResponses = {
          ...current,
          [model]: { ...current[model], ...updates },
        };
        combinedResponsesRef.current = next;
        streamingTextRef.current = buildCombinedContent(next);
        return next;
      });
    },
    []
  );

  useEffect(() => () => clearStreamingFlush(), [clearStreamingFlush]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingText, combinedResponses]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations(userId);
      setConversations(data.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId, loadConversations]);

  const loadConversation = async (id: string) => {
    try {
      const conv = await getConversation(id);
      setActiveConvId(id);
      setMessages(normalizeCombinedMessages(conv.messages));
      setCombinedResponses(null);
      clearStreamingFlush();
      streamingTextRef.current = '';
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
    clearStreamingFlush();
    setStreamingText('');
    setCombinedResponses(null);
    streamingTextRef.current = '';
    setPendingAttachments([]);
    inputRef.current?.focus();
  };

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    await deleteConversation(id);
    if (activeConvId === id) handleNewConversation();
    loadConversations();
    toast.success('Conversation deleted');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, forceType?: string) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const att = await uploadFile(file);
        if (forceType) att.type = forceType as Attachment['type'];
        setPendingAttachments((prev) => [...prev, att]);
      }
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  /* ── Voice input ── */
  const handleVoice = () => {
    if (recording) {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      // Web Speech API — real-time, no backend needed
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';
      recognitionRef.current = recognition;
      setRecording(true);

      let finalTranscript = '';
      recognition.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setInput(finalTranscript + interim);
      };
      recognition.onend = () => {
        setRecording(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setRecording(false);
        toast.error('Voice recognition failed');
      };
      recognition.start();
    } else {
      // Fallback: MediaRecorder → Gemini transcription
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          const chunks: Blob[] = [];
          mediaRecorderRef.current = recorder;
          setRecording(true);

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            setRecording(false);
            setTranscribing(true);
            try {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const text = await transcribeAudio(blob);
              if (text) setInput((prev) => prev + (prev ? ' ' : '') + text);
            } catch {
              toast.error('Transcription failed');
            } finally {
              setTranscribing(false);
            }
          };
          recorder.start();
        })
        .catch(() => toast.error('Microphone access denied'));
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamingTextRef.current) {
      setMessages((prev) => [...prev, { role: 'assistant', content: streamingTextRef.current }]);
    }
    streamingTextRef.current = '';
    clearStreamingFlush();
    setStreamingText('');
    setCombinedResponses(null);
    setStreaming(false);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && pendingAttachments.length === 0) return;
    if (streaming) return;

    // Image generation mode — use the standalone endpoint
    if (imageMode && trimmed) {
      const userMsg: Message = { role: 'user', content: `🎨 ${trimmed}` };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setStreaming(true);
      clearStreamingFlush();
      setStreamingText('');
      streamingTextRef.current = '';

      const controller = new AbortController();
      abortRef.current = controller;
      let fullText = '';

      const imageProvider: BaseAIModel = selectedModel === 'combined' ? 'openai' : selectedModel;

      await generateImage(
        { prompt: trimmed, provider: imageProvider, signal: controller.signal },
        (text) => {
          fullText += text;
          streamingTextRef.current = fullText;
          queueStreamingText(fullText);
        },
        (img) => {
          fullText += `\n\n![Generated Image](${img.url})\n\n`;
          streamingTextRef.current = fullText;
          queueStreamingText(fullText);
        },
        () => {
          abortRef.current = null;
          setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
          streamingTextRef.current = '';
          clearStreamingFlush();
          setStreamingText('');
          setStreaming(false);
        },
        (error) => {
          abortRef.current = null;
          toast.error(`Image error: ${error}`);
          setStreaming(false);
          clearStreamingFlush();
          setStreamingText('');
          streamingTextRef.current = '';
        }
      );
      return;
    }

    const userMsg: Message = {
      role: 'user',
      content: trimmed,
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingAttachments([]);
    setStreaming(true);
    clearStreamingFlush();
    setStreamingText('');
    streamingTextRef.current = '';

    const controller = new AbortController();
    abortRef.current = controller;

    if (selectedModel === 'combined') {
      const initialResponses = createCombinedResponses();
      combinedResponsesRef.current = initialResponses;
      setCombinedResponses(initialResponses);
      streamingTextRef.current = buildCombinedContent(initialResponses);

      let combinedConversationId = activeConvId;
      const knownConversationIds = new Set(conversations.map((conversation) => conversation._id));

      const refreshConversationList = async () => {
        const data = await getConversations(userId);
        const nextConversations = data.data || [];
        setConversations(nextConversations);
        return nextConversations as Conversation[];
      };

      const ensureCombinedConversation = async () => {
        if (combinedConversationId || controller.signal.aborted) return combinedConversationId;

        for (let attempt = 0; attempt < COMBINED_CONVERSATION_LOOKUP_ATTEMPTS; attempt += 1) {
          const nextConversations = await refreshConversationList();
          const createdConversation = nextConversations.find(
            (conversation) => !knownConversationIds.has(conversation._id)
          );

          if (createdConversation?._id) {
            combinedConversationId = createdConversation._id;
            knownConversationIds.add(createdConversation._id);
            setActiveConvId(createdConversation._id);
            return combinedConversationId;
          }

          if (attempt < COMBINED_CONVERSATION_LOOKUP_ATTEMPTS - 1) {
            await wait(COMBINED_CONVERSATION_LOOKUP_DELAY_MS);
          }
        }

        return combinedConversationId;
      };

      const runModel = async (
        model: BaseAIModel,
        conversationId?: string | null,
        options: RunModelOptions = {}
      ): Promise<RunModelResult> => {
        let modelText = '';
        let completed = false;
        let timedOut = false;
        let errored = false;
        const modelController = new AbortController();
        const abortModel = () => modelController.abort();
        const timeoutId =
          options.timeoutMs && options.timeoutMs > 0
            ? window.setTimeout(() => {
                if (completed) return;
                timedOut = true;
                modelController.abort();
                updateCombinedResponse(model, {
                  content: options.keepLoadingOnTimeout ? options.retryLabel || '' : modelText,
                  status: options.keepLoadingOnTimeout
                    ? 'loading'
                    : modelText.trim()
                      ? 'done'
                      : 'error',
                  error: options.keepLoadingOnTimeout
                    ? undefined
                    : modelText.trim()
                      ? undefined
                      : 'Tiempo de espera agotado. El modelo no respondió a tiempo.',
                });
              }, options.timeoutMs)
            : null;

        if (controller.signal.aborted) {
          modelController.abort();
        } else {
          controller.signal.addEventListener('abort', abortModel, { once: true });
        }

        try {
          await sendChatMessage(
            {
              conversationId: conversationId || undefined,
              message: trimmed,
              attachments: userMsg.attachments,
              userId,
              userName,
              userRole,
              model,
              signal: modelController.signal,
            },
            (text) => {
              modelText += text;
              updateCombinedResponse(model, { content: modelText, status: 'loading' });
            },
            (meta) => {
              completed = true;
              if (timeoutId) window.clearTimeout(timeoutId);
              cacheCombinedModel(model, modelText);
              updateCombinedResponse(model, {
                content: modelText,
                status: 'done',
                tokens: meta.outputTokens,
              });
            },
            (error) => {
              errored = true;
              completed = true;
              if (timeoutId) window.clearTimeout(timeoutId);
              updateCombinedResponse(model, {
                content: options.keepLoadingOnTimeout ? options.retryLabel || '' : modelText,
                status: options.keepLoadingOnTimeout ? 'loading' : 'error',
                error: options.keepLoadingOnTimeout
                  ? undefined
                  : error === 'Failed to fetch'
                    ? 'No se pudo conectar con el servidor de IA. Revisa conexión, CORS o disponibilidad del backend.'
                    : error,
              });
            },
            (data) => {
              const toolLabels: Record<string, string> = {
                create_task: `Creating task: "${data.input?.title || ''}"...`,
                get_member_tasks: `Looking up tasks for ${data.input?.memberName || ''}...`,
                navigate: `Finding route...`,
                create_user: `Creating user: ${data.input?.firstName || ''} ${
                  data.input?.lastName || ''
                }...`,
                update_user: `Updating user: ${
                  data.input?.userName || data.input?.userId || ''
                }...`,
                search_users: `Searching users${data.input?.q ? `: "${data.input.q}"` : ''}...`,
                search_campaigns: `Searching campaigns${
                  data.input?.q ? `: "${data.input.q}"` : ''
                }...`,
                search_stores: `Searching stores${data.input?.q ? `: "${data.input.q}"` : ''}...`,
                store_info: `🏬 Consultando información de la tienda: "${
                  data.input?.q || data.input?.storeName || ''
                }"...`,
                all_stores_debt: `💰 Analizando la deuda total de todas las tiendas...`,
                stores_by_filter: `🔍 Filtrando tiendas con los criterios especificados...`,
                stores_no_campaigns: `⚠️ Buscando tiendas sin campañas activas...`,
                messaging_stats: `📊 Obteniendo estadísticas de envío de mensajes...`,
                store_averages: `📈 Calculando promedios generales de las tiendas...`,
                campaigns_list: `📋 Listando campañas del sistema...`,
                search_sweepstake: `🎟️ Buscando sorteos/sweepstakes...`,
                kiosk_status: `🖥️ Verificando el estado de los quioscos...`,
                forecast_projection: `🔮 Generando proyecciones de volumen y costos...`,
                sweepstake_analysis: `🔬 Analizando el rendimiento del sorteo...`,
                audience_overview: `👥 Obteniendo resumen general de la audiencia...`,
                audience_channels: `📱 Analizando efectividad de canales de comunicación...`,
                trends_analysis: `📉 Analizando tendencias de registros...`,
                current_date: `🕒 Consultando fecha y hora actual...`,
                search_meetings: `🎙️ Buscando reuniones en Otter${
                  data.input?.date ? ` (${data.input.date})` : ''
                }...`,
                meeting_content: `📝 Leyendo el transcript de la reunión...`,
                explore_all: `🧭 Explorando registros de la base de datos...`,
              };
              modelText += `\n\n${toolLabels[data.tool] || `Running ${data.tool}...`}\n`;
              updateCombinedResponse(model, { content: modelText, status: 'loading' });
            },
            (data) => {
              if (data.result?.success) {
                modelText += `${data.result.message}\n\n`;
              } else if (data.result?.error) {
                modelText += `${data.result.error}\n\n`;
              } else if (data.result?.totalTasks !== undefined) {
                modelText += `Found ${data.result.totalTasks} tasks for ${data.result.member}\n\n`;
              } else if (data.result?.user) {
                modelText += `User created: ${data.result.user.firstName} ${data.result.user.lastName}\n\n`;
              }
              if (data.result?._fileUrls) {
                const { excelUrl, pdfUrl } = data.result._fileUrls;
                if (excelUrl) {
                  modelText += `📄 **Reporte Excel Generado:** [Descargar Excel](${excelUrl})\n\n`;
                }
                if (pdfUrl) {
                  modelText += `📄 **Reporte PDF Generado:** [Descargar PDF](${pdfUrl})\n\n`;
                }
              }
              updateCombinedResponse(model, { content: modelText, status: 'loading' });
            },
            (data) => {
              modelText += `\n\n![${data.name}](${data.url})\n\n`;
              updateCombinedResponse(model, { content: modelText, status: 'loading' });
            }
          );
        } finally {
          if (timeoutId) window.clearTimeout(timeoutId);
          controller.signal.removeEventListener('abort', abortModel);
        }

        if (timedOut || controller.signal.aborted) {
          return { completed: false, timedOut, errored };
        }

        if (
          !controller.signal.aborted &&
          combinedResponsesRef.current[model].status === 'loading'
        ) {
          cacheCombinedModel(model, modelText);
          updateCombinedResponse(model, { content: modelText, status: 'done' });
          completed = true;
        }

        return { completed, timedOut, errored };
      };

      if (!combinedConversationId) {
        const currentConversations = await refreshConversationList();
        currentConversations.forEach((conversation) => knownConversationIds.add(conversation._id));
      }

      const pendingModels = new Set<BaseAIModel>(BASE_AI_MODELS);
      const firstPassOptions: RunModelOptions = {
        timeoutMs: COMBINED_FIRST_PASS_TIMEOUT_MS,
        keepLoadingOnTimeout: true,
        retryLabel: '',
      };
      const keepPendingIfNeeded = (model: BaseAIModel, result: RunModelResult) => {
        if (
          result.completed &&
          !result.errored &&
          combinedResponsesRef.current[model].status === 'done'
        ) {
          pendingModels.delete(model);
        }
      };

      while (!combinedConversationId && pendingModels.size > 0) {
        if (controller.signal.aborted) return;
        const model = Array.from(pendingModels)[0];
        const result = await runModel(model, combinedConversationId, firstPassOptions);
        keepPendingIfNeeded(model, result);
        await ensureCombinedConversation();
      }

      if (combinedConversationId && pendingModels.size > 0) {
        const firstPassResults = await Promise.all(
          Array.from(pendingModels).map(async (model) => ({
            model,
            result: await runModel(model, combinedConversationId, firstPassOptions),
          }))
        );
        firstPassResults.forEach(({ model, result }) => keepPendingIfNeeded(model, result));
      }

      if (controller.signal.aborted) return;

      if (pendingModels.size > 0) {
        if (combinedConversationId) {
          const retryResults = await Promise.all(
            Array.from(pendingModels).map(async (model) => ({
              model,
              result: await runModel(model, combinedConversationId),
            }))
          );
          retryResults.forEach(({ model, result }) => keepPendingIfNeeded(model, result));
        } else {
          for (const model of Array.from(pendingModels)) {
            if (controller.signal.aborted) return;
            const result = await runModel(model, combinedConversationId);
            keepPendingIfNeeded(model, result);
            if (!combinedConversationId) await ensureCombinedConversation();
          }
        }
      }

      if (controller.signal.aborted) return;

      const finalContent = buildCombinedContent(combinedResponsesRef.current);
      abortRef.current = null;
      setMessages((prev) => [...prev, { role: 'assistant', content: finalContent }]);
      streamingTextRef.current = '';
      clearStreamingFlush();
      setStreamingText('');
      setCombinedResponses(null);
      setStreaming(false);
      refreshConversationList().then((nextConversations) => {
        if (!combinedConversationId && nextConversations[0]?._id) {
          setActiveConvId(nextConversations[0]._id);
        }
      });
      return;
    }

    let fullText = '';
    let streamFinished = false;
    let recoveryInFlight = false;
    let recoveryIntervalId: number | null = null;
    let silentTimeoutId: number | null = null;
    let conversationLookupIntervalId: number | null = null;
    let timedOutStream = false;
    let lastStreamActivityAt = Date.now();
    let resolvedConversationId = activeConvId;
    const sentAt = Date.now();

    const clearRecoveryInterval = () => {
      if (recoveryIntervalId) {
        window.clearInterval(recoveryIntervalId);
        recoveryIntervalId = null;
      }
    };

    const clearSilentTimeout = () => {
      if (silentTimeoutId) {
        window.clearInterval(silentTimeoutId);
        silentTimeoutId = null;
      }
    };

    const clearConversationLookupInterval = () => {
      if (conversationLookupIntervalId) {
        window.clearInterval(conversationLookupIntervalId);
        conversationLookupIntervalId = null;
      }
    };

    const setResolvedConversationId = (conversationId?: string | null) => {
      if (!conversationId || resolvedConversationId === conversationId) return;
      resolvedConversationId = conversationId;
      setActiveConvId(conversationId);
    };

    const markStreamActivity = () => {
      lastStreamActivityAt = Date.now();
    };

    const finishSingleResponse = (content: string, outputTokens?: number) => {
      if (streamFinished) return;
      streamFinished = true;
      clearRecoveryInterval();
      clearSilentTimeout();
      clearConversationLookupInterval();
      abortRef.current = null;
      setMessages((prev) => [...prev, { role: 'assistant', content, tokens: outputTokens }]);
      streamingTextRef.current = '';
      clearStreamingFlush();
      setStreamingText('');
      setStreaming(false);
      getConversations(userId).then((data) => {
        setConversations(data.data || []);
        if (!resolvedConversationId && data.data?.[0]) {
          setResolvedConversationId(data.data[0]._id);
        }
      });
    };

    const findConversationForUserMessage = async (requiresAssistantResponse: boolean) => {
      const data = await getConversations(userId);
      const nextConversations = (data.data || []) as Conversation[];
      setConversations(nextConversations);

      const candidates = [
        ...(resolvedConversationId
          ? nextConversations.filter((conversation) => conversation._id === resolvedConversationId)
          : []),
        ...nextConversations.filter((conversation) => conversation._id !== resolvedConversationId),
      ].slice(0, 8);

      for (const candidate of candidates) {
        if (!candidate?._id) continue;

        const updatedAt = new Date(candidate.updatedAt).getTime();
        if (Number.isFinite(updatedAt) && updatedAt < sentAt - 30000) continue;

        const conv = await getConversation(candidate._id);
        const normalizedMessages = normalizeCombinedMessages(conv.messages);
        const matchingUserIndex = [...normalizedMessages]
          .reverse()
          .findIndex((message) => message.role === 'user' && message.content === trimmed);

        if (matchingUserIndex === -1) continue;

        setResolvedConversationId(conv._id);

        const userIndex = normalizedMessages.length - 1 - matchingUserIndex;
        const hasAssistantResponse = normalizedMessages
          .slice(userIndex + 1)
          .some((message) => message.role === 'assistant' && message.content.trim());

        if (!requiresAssistantResponse || hasAssistantResponse) {
          return { conv, normalizedMessages, hasAssistantResponse };
        }
      }

      return null;
    };

    const discoverNewConversation = async () => {
      if (streamFinished || resolvedConversationId || recoveryInFlight) return;

      try {
        await findConversationForUserMessage(false);
      } catch {
        /* best-effort lookup only */
      }
    };

    const recoverSavedSingleResponse = async () => {
      if (streamFinished || recoveryInFlight || (controller.signal.aborted && !timedOutStream)) {
        return false;
      }
      recoveryInFlight = true;

      try {
        const found = await findConversationForUserMessage(true);

        if (found?.hasAssistantResponse) {
          streamFinished = true;
          clearRecoveryInterval();
          clearConversationLookupInterval();
          controller.abort();
          abortRef.current = null;
          setMessages(found.normalizedMessages);
          streamingTextRef.current = '';
          clearStreamingFlush();
          setStreamingText('');
          setStreaming(false);
          return true;
        }

        return false;
      } catch {
        return false;
      } finally {
        recoveryInFlight = false;
      }
    };

    const waitForSavedSingleResponse = async () => {
      const deadline = Date.now() + CHAT_POST_STREAM_RECOVERY_TIMEOUT_MS;

      while (
        !streamFinished &&
        (!controller.signal.aborted || timedOutStream) &&
        Date.now() < deadline
      ) {
        const recovered = await recoverSavedSingleResponse();
        if (recovered) return true;
        await wait(2000);
      }

      return false;
    };

    recoveryIntervalId = window.setInterval(() => {
      recoverSavedSingleResponse();
    }, CHAT_RECOVERY_INTERVAL_MS);

    if (!resolvedConversationId) {
      conversationLookupIntervalId = window.setInterval(() => {
        discoverNewConversation();
      }, NEW_CONVERSATION_LOOKUP_INTERVAL_MS);
    }

    silentTimeoutId = window.setInterval(() => {
      if (streamFinished || controller.signal.aborted) return;
      if (Date.now() - lastStreamActivityAt < CHAT_SILENT_STREAM_TIMEOUT_MS) return;

      timedOutStream = true;
      controller.abort();
    }, 5000);

    await sendChatMessage(
      {
        conversationId: activeConvId || undefined,
        message: trimmed,
        attachments: userMsg.attachments,
        userId,
        userName,
        userRole,
        model: selectedModel,
        signal: controller.signal,
      },
      (text) => {
        markStreamActivity();
        fullText += text;
        streamingTextRef.current = fullText;
        queueStreamingText(fullText);
      },
      (meta) => {
        markStreamActivity();
        if (fullText.trim()) {
          finishSingleResponse(fullText, meta.outputTokens);
        }
      },
      (error) => {
        finishSingleResponse(
          fullText.trim() ? `${fullText}\n\nError: ${error}` : `Error de IA: ${error}`
        );
        toast.error(`AI Error: ${error}`);
      },
      (data) => {
        const toolLabels: Record<string, string> = {
          create_task: `🔧 Creating task: "${data.input?.title || ''}"...`,
          get_member_tasks: `🔍 Looking up tasks for ${data.input?.memberName || ''}...`,
          navigate: `🔗 Finding route...`,
          create_user: `👤 Creating user: ${data.input?.firstName || ''} ${
            data.input?.lastName || ''
          }...`,
          update_user: `✏️ Updating user: ${data.input?.userName || data.input?.userId || ''}...`,
          search_users: `🔍 Searching users${data.input?.q ? `: "${data.input.q}"` : ''}...`,
          search_campaigns: `📊 Searching campaigns${
            data.input?.q ? `: "${data.input.q}"` : ''
          }...`,
          search_stores: `🏪 Searching stores${data.input?.q ? `: "${data.input.q}"` : ''}...`,
          store_info: `🏬 Consultando información de la tienda: "${
            data.input?.q || data.input?.storeName || ''
          }"...`,
          all_stores_debt: `💰 Analizando la deuda total de todas las tiendas...`,
          stores_by_filter: `🔍 Filtrando tiendas con los criterios especificados...`,
          stores_no_campaigns: `⚠️ Buscando tiendas sin campañas activas...`,
          messaging_stats: `📊 Obteniendo estadísticas de envío de mensajes...`,
          store_averages: `📈 Calculando promedios generales de las tiendas...`,
          campaigns_list: `📋 Listando campañas del sistema...`,
          search_sweepstake: `🎟️ Buscando sorteos/sweepstakes...`,
          kiosk_status: `🖥️ Verificando el estado de los quioscos...`,
          forecast_projection: `🔮 Generando proyecciones de volumen y costos...`,
          sweepstake_analysis: `🔬 Analizando el rendimiento del sorteo...`,
          audience_overview: `👥 Obteniendo resumen general de la audiencia...`,
          audience_channels: `📱 Analizando efectividad de canales de comunicación...`,
          trends_analysis: `📉 Analizando tendencias de registros...`,
          current_date: `🕒 Consultando fecha y hora actual...`,
          search_meetings: `🎙️ Buscando reuniones en Otter${
            data.input?.date ? ` (${data.input.date})` : ''
          }...`,
          meeting_content: `📝 Leyendo el transcript de la reunión...`,
          explore_all: `🧭 Explorando registros de la base de datos...`,
        };
        const label = toolLabels[data.tool] || `⚙️ Running ${data.tool}...`;
        markStreamActivity();
        fullText += `\n\n${label}\n`;
        streamingTextRef.current = fullText;
        queueStreamingText(fullText);
      },
      (data) => {
        markStreamActivity();
        if (data.result?.success) {
          fullText += `✅ ${data.result.message}\n\n`;
        } else if (data.result?.error) {
          fullText += `❌ ${data.result.error}\n\n`;
        } else if (data.result?.totalTasks !== undefined) {
          fullText += `📋 Found ${data.result.totalTasks} tasks for ${data.result.member}\n\n`;
        } else if (data.result?.user) {
          fullText += `✅ User created: ${data.result.user.firstName} ${data.result.user.lastName}\n\n`;
        }
        if (data.result?._fileUrls) {
          const { excelUrl, pdfUrl } = data.result._fileUrls;
          if (excelUrl) {
            fullText += `📄 **Reporte Excel Generado:** [Descargar Excel](${excelUrl})\n\n`;
          }
          if (pdfUrl) {
            fullText += `📄 **Reporte PDF Generado:** [Descargar PDF](${pdfUrl})\n\n`;
          }
        }
        streamingTextRef.current = fullText;
        queueStreamingText(fullText);
      },
      (data) => {
        markStreamActivity();
        fullText += `\n\n![${data.name}](${data.url})\n\n`;
        streamingTextRef.current = fullText;
        queueStreamingText(fullText);
      },
      (conversationId) => {
        setResolvedConversationId(conversationId);
      }
    );

    clearRecoveryInterval();
    clearSilentTimeout();
    clearConversationLookupInterval();

    if (!streamFinished && (!controller.signal.aborted || timedOutStream)) {
      if (fullText.trim()) {
        finishSingleResponse(fullText);
      } else {
        const recovered = await waitForSavedSingleResponse();
        if (!recovered) {
          finishSingleResponse(EMPTY_RESPONSE_MESSAGE);
          toast.error('AI response finished without returning text.');
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    user,
    conversations,
    activeConvId,
    messages,
    input,
    setInput,
    streaming,
    streamingText,
    combinedResponses,
    pendingAttachments,
    setPendingAttachments,
    uploading,
    sidebarOpen,
    setSidebarOpen,
    loadingConvs,
    selectedModel,
    setSelectedModel,
    availableModels,
    attachAnchor,
    setAttachAnchor,
    deleteTarget,
    setDeleteTarget,
    imageMode,
    setImageMode,
    recording,
    transcribing,
    handlePickVersion,
    fileInputRef,
    imageInputRef,
    scrollRef,
    inputRef,
    isAdmin,
    loadConversation,
    handleNewConversation,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleFileUpload,
    handleVoice,
    handleStop,
    handleSend,
    handleKeyDown,
  };
}
