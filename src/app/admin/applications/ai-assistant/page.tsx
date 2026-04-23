'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  sendChatMessage,
  generateImage,
  transcribeAudio,
  getConversations,
  getConversation,
  deleteConversation,
  uploadFile,
  refreshConversationContext,
  type Conversation,
  type Message,
  type Attachment,
} from '@/services/ai.service';
import { HEADER_HEIGHT } from 'src/theme/utils';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

/* ─── Sweepstouch S Icon ─── */
const SIcon: React.FC<{
  size?: number;
  color?: string;
  spin?: boolean;
  pulse?: boolean;
}> = ({ size = 24, color, spin = false, pulse = false }) => {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  const animationStyle = spin
    ? {
      animation: 'sIconSpin 1.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
      '@keyframes sIconSpin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    }
    : pulse
      ? {
        animation: 'sIconPulse 1.4s ease-in-out infinite',
        '@keyframes sIconPulse': {
          '0%, 100%': { opacity: 0.5, transform: 'scale(0.85)' },
          '50%': { opacity: 1, transform: 'scale(1.15)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }
      : {};

  return (
    <Box
      component="svg"
      viewBox="0 0 237 258"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0, ...animationStyle }}
    >
      <path
        d="M105 61.7v9l-8.5 2.1C86 75.4 78.4 79.6 71.1 86.9c-10 10-15.1 22.8-15.1 37.6 0 13.9 3.3 23 13.3 36.2l5.4 7.3 34.2-25.5c18.8-14 34.6-25.5 35.2-25.5 2.2 0 4.9 8.5 4.9 15.3 0 10.1-3.5 16.9-10.8 21.4-6.5 4-7.2 3.5-7.2-5.8 0-4.4-.4-7.9-.8-7.7-2.6 1-42.2 31.2-42 32 .2.4 9.8 7.8 21.3 16.4l21 15.6.3-9.4.3-9.4 6.1-1.1c9.7-1.9 18.3-6.7 26.4-14.7 10.9-10.9 15.4-21.6 15.4-37.1 0-8.8-1.8-17.2-5.1-23.8S161.6 90 160.4 90.4c-.6.2-15.9 11.5-34.1 25S92.5 140 91.6 140c-2.9 0-5.6-7.6-5.6-15.6 0-5.9.5-8.1 2.8-12.5 2.9-5.6 8.4-10.3 13.4-11.5l2.7-.6.3 9 .3 9 21.1-15.7c11.6-8.6 21.2-16 21.3-16.4.1-.5-8.9-7.6-20.1-15.9s-20.9-15.5-21.5-16c-1-.8-1.3.9-1.3 7.9"
        fill={c}
      />
    </Box>
  );
};

/* ─── Markdown rendering ─── */
type AIModel = 'openai' | 'claude' | 'gemini';

const MODEL_META: Record<AIModel, { label: string; icon: string }> = {
  openai: { label: 'ChatGPT', icon: '/chatgpt.png' },
  claude: { label: 'Claude', icon: '/claude.png' },
  gemini: { label: 'Gemini', icon: '/gemini.png' },
};

const ModelIcon: React.FC<{ model: AIModel; size?: number }> = ({ model, size = 16 }) => {
  return (
    <Box
      component="img"
      src={MODEL_META[model].icon}
      alt={MODEL_META[model].label}
      sx={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        borderRadius: 0.5,
      }}
    />
  );
};

const ModelOption: React.FC<{ model: AIModel }> = ({ model }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <ModelIcon model={model} />
    <Box component="span">{MODEL_META[model].label}</Box>
  </Stack>
);

function renderMarkdown(text: string) {
  const codeBlocks: string[] = [];
  let processed = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code);
    return `%%CODE_BLOCK_${codeBlocks.length - 1}%%`;
  });

  processed = processed.replace(
    /(?:^|\n)((?:\|[^\n]+\|\n)+)/g,
    (_, tableBlock: string) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim());
      if (rows.length < 2) return tableBlock;
      const isSep = /^\|[\s\-:|]+\|$/.test(rows[1].trim());
      const dataRows = isSep ? [rows[0], ...rows.slice(2)] : rows;
      const html = dataRows.map((row, ri) => {
        const cells = row.split('|').filter((c, i, a) => i > 0 && i < a.length - 1);
        const tag = ri === 0 && isSep ? 'th' : 'td';
        const cellsHtml = cells.map(c =>
          `<${tag} style="padding:6px 12px;border:1px solid rgba(128,128,128,0.2);font-size:12px">${c.trim()}</${tag}>`
        ).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');
      return `\n<table style="border-collapse:collapse;margin:8px 0;width:100%">${html}</table>\n`;
    }
  );

  processed = processed.replace(/^-{3,}$/gm, '<hr style="border:none;border-top:1px solid rgba(128,128,128,0.2);margin:12px 0"/>');
  processed = processed.replace(/^### (.+)$/gm, '<h4 style="margin:10px 0 4px;font-size:14px;font-weight:600">$1</h4>');
  processed = processed.replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;font-size:15px;font-weight:600">$1</h3>');
  processed = processed.replace(/^# (.+)$/gm, '<h2 style="margin:12px 0 4px;font-size:16px;font-weight:700">$1</h2>');
  processed = processed.replace(/^- (.+)$/gm, '<li style="margin:1px 0;margin-left:16px;font-size:13px">$1</li>');
  processed = processed.replace(/^\d+\. (.+)$/gm, '<li style="margin:1px 0;margin-left:16px;list-style-type:decimal;font-size:13px">$1</li>');
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  processed = processed.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px;font-size:12px;font-family:monospace">$1</code>');
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    '<div style="margin:8px 0"><img src="$2" alt="$1" style="max-width:100%;max-height:400px;border-radius:12px;border:1px solid rgba(128,128,128,0.2)" /><div style="font-size:10px;color:rgba(128,128,128,0.7);margin-top:4px">$1</div></div>'
  );
  processed = processed.replace(/\n{3,}/g, '\n\n');
  processed = processed.replace(/\n\n/g, '<br/>');
  processed = processed.replace(/\n/g, '<br/>');
  processed = processed.replace(/(<\/h[234]>|<\/table>|<\/pre>|<\/li>|<hr[^>]*\/>)<br\/>/g, '$1');
  processed = processed.replace(/<br\/>(<h[234]|<table|<pre|<hr|<li)/g, '$1');
  processed = processed.replace(/%%CODE_BLOCK_(\d+)%%/g, (_, i) =>
    `<pre style="background:rgba(0,0,0,0.05);padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;margin:8px 0;line-height:1.5"><code>${codeBlocks[Number(i)]}</code></pre>`
  );

  return processed;
}

/* ─── Message Bubble ─── */
const MessageBubble: React.FC<{ msg: Message; isUser: boolean }> = ({ msg, isUser }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <Avatar
        sx={{
          width: 32, height: 32,
          bgcolor: isUser ? 'primary.main' : alpha(accent, 0.12),
          color: isUser ? 'primary.contrastText' : accent,
          fontSize: 14, fontWeight: 700, mt: 0.5,
        }}
      >
        {isUser
          ? <PersonRoundedIcon sx={{ fontSize: 18 }} />
          : <SIcon size={18} color={accent} />
        }
      </Avatar>

      <Box sx={{ maxWidth: '75%', minWidth: 60 }}>
        {msg.attachments && msg.attachments.length > 0 && (
          <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" gap={0.5}>
            {msg.attachments.map((att, i) => (
              <Box key={i}>
                {att.type === 'image' ? (
                  <Box component="img" src={att.url} alt={att.name}
                    sx={{ maxWidth: 200, maxHeight: 150, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}
                  />
                ) : (
                  <Chip icon={<AttachFileRoundedIcon sx={{ fontSize: 14 }} />}
                    label={att.name} size="small" variant="outlined"
                    component="a" href={att.url} target="_blank" clickable sx={{ fontSize: 11 }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        )}

        <Paper elevation={0} sx={{
          px: 2, py: 1.5, borderRadius: 2.5,
          bgcolor: isUser ? 'primary.main' : isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.04),
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderTopRightRadius: isUser ? 4 : undefined,
          borderTopLeftRadius: !isUser ? 4 : undefined,
        }}>
          {isUser ? (
            <Typography variant="body2" sx={{ fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
          ) : (
            <Typography variant="body2" component="div"
              sx={{ fontSize: 13, lineHeight: 1.65, '& pre': { my: 1 }, '& code': { fontFamily: 'monospace' } }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          )}
        </Paper>

        {!isUser && msg.content && (
          <Box sx={{ mt: 0.5 }}>
            <Tooltip title="Copy">
              <IconButton size="small"
                onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied!'); }}
                sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, p: 0.3 }}
              >
                <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/* ─── Streaming indicator ─── */
const StreamingIndicator: React.FC = () => {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(accent, 0.12) }}>
        <SIcon size={18} color={accent} pulse />
      </Avatar>
      <Paper elevation={0} sx={{
        borderRadius: 2.5, borderTopLeftRadius: 4,
        bgcolor: isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.04),
        px: 2, py: 1.5,
      }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{
              width: 6, height: 6, borderRadius: '50%',
              bgcolor: accent,
              animation: `streamDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              '@keyframes streamDot': {
                '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                '50%': { opacity: 1, transform: 'scale(1.2)' },
              },
            }} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function AIAssistantPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(mdUp);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'claude' | 'gemini'>('openai');
  const [attachAnchor, setAttachAnchor] = useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const userId = user?._id || user?.id || '';
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
  const userRole = user?.role || 'admin';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingText]);

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

  useEffect(() => { if (userId) loadConversations(); }, [userId, loadConversations]);

  const loadConversation = async (id: string) => {
    try {
      const conv = await getConversation(id);
      setActiveConvId(id);
      setMessages(conv.messages.filter((m: Message) => m.role !== 'system'));
    } catch { toast.error('Failed to load conversation'); }
  };

  const handleNewConversation = () => {
    setActiveConvId(null); setMessages([]); setInput('');
    setStreamingText(''); setPendingAttachments([]);
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
    } catch { toast.error('Failed to upload file'); }
    finally {
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
      recognition.onend = () => { setRecording(false); recognitionRef.current = null; };
      recognition.onerror = () => { setRecording(false); toast.error('Voice recognition failed'); };
      recognition.start();
    } else {
      // Fallback: MediaRecorder → Gemini transcription
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const chunks: Blob[] = [];
        mediaRecorderRef.current = recorder;
        setRecording(true);

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setRecording(false);
          setTranscribing(true);
          try {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const text = await transcribeAudio(blob);
            if (text) setInput((prev) => prev + (prev ? ' ' : '') + text);
          } catch { toast.error('Transcription failed'); }
          finally { setTranscribing(false); }
        };
        recorder.start();
      }).catch(() => toast.error('Microphone access denied'));
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamingTextRef.current) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamingTextRef.current }]);
    }
    streamingTextRef.current = '';
    setStreamingText('');
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
      setStreamingText('');
      streamingTextRef.current = '';

      const controller = new AbortController();
      abortRef.current = controller;
      let fullText = '';

      await generateImage(
        { prompt: trimmed, provider: selectedModel, signal: controller.signal },
        (text) => { fullText += text; streamingTextRef.current = fullText; setStreamingText(fullText); },
        (img) => { fullText += `\n\n![Generated Image](${img.url})\n\n`; streamingTextRef.current = fullText; setStreamingText(fullText); },
        () => {
          abortRef.current = null;
          setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
          streamingTextRef.current = ''; setStreamingText(''); setStreaming(false);
        },
        (error) => { abortRef.current = null; toast.error(`Image error: ${error}`); setStreaming(false); setStreamingText(''); streamingTextRef.current = ''; },
      );
      return;
    }

    const userMsg: Message = {
      role: 'user', content: trimmed,
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput(''); setPendingAttachments([]);
    setStreaming(true);
    setStreamingText('');
    streamingTextRef.current = '';

    const controller = new AbortController();
    abortRef.current = controller;

    let fullText = '';

    await sendChatMessage(
      {
        conversationId: activeConvId || undefined,
        message: trimmed,
        attachments: userMsg.attachments,
        userId, userName, userRole,
        model: selectedModel,
        signal: controller.signal,
      },
      (text) => {
        fullText += text;
        streamingTextRef.current = fullText;
        setStreamingText(fullText);
      },
      (meta) => {
        abortRef.current = null;
        setMessages((prev) => [...prev, { role: 'assistant', content: fullText, tokens: meta.outputTokens }]);
        streamingTextRef.current = '';
        setStreamingText('');
        setStreaming(false);
        getConversations(userId).then((data) => {
          setConversations(data.data || []);
          if (!activeConvId && data.data?.[0]) {
            setActiveConvId(data.data[0]._id);
          }
        });
      },
      (error) => {
        abortRef.current = null;
        toast.error(`AI Error: ${error}`);
        setStreaming(false);
        setStreamingText('');
        streamingTextRef.current = '';
      },
      (data) => {
        const toolLabels: Record<string, string> = {
          create_task: `🔧 Creating task: "${data.input?.title || ''}"...`,
          get_member_tasks: `🔍 Looking up tasks for ${data.input?.memberName || ''}...`,
          navigate: `🔗 Finding route...`,
          create_user: `👤 Creating user: ${data.input?.firstName || ''} ${data.input?.lastName || ''}...`,
          update_user: `✏️ Updating user: ${data.input?.userName || data.input?.userId || ''}...`,
          search_users: `🔍 Searching users${data.input?.q ? `: "${data.input.q}"` : ''}...`,
          search_campaigns: `📊 Searching campaigns${data.input?.q ? `: "${data.input.q}"` : ''}...`,
          search_stores: `🏪 Searching stores${data.input?.q ? `: "${data.input.q}"` : ''}...`,
        };
        const label = toolLabels[data.tool] || `⚙️ Running ${data.tool}...`;
        fullText += `\n\n${label}\n`;
        streamingTextRef.current = fullText;
        setStreamingText(fullText);
      },
      (data) => {
        if (data.result?.success) {
          fullText += `✅ ${data.result.message}\n\n`;
        } else if (data.result?.error) {
          fullText += `❌ ${data.result.error}\n\n`;
        } else if (data.result?.totalTasks !== undefined) {
          fullText += `📋 Found ${data.result.totalTasks} tasks for ${data.result.member}\n\n`;
        } else if (data.result?.user) {
          fullText += `✅ User created: ${data.result.user.firstName} ${data.result.user.lastName}\n\n`;
        }
        streamingTextRef.current = fullText;
        setStreamingText(fullText);
      },
      (data) => {
        fullText += `\n\n![${data.name}](${data.url})\n\n`;
        streamingTextRef.current = fullText;
        setStreamingText(fullText);
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const SIDEBAR_W = 280;

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ p: 2, pb: 1.5, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SIcon size={22} color={accent} />
            <Typography variant="subtitle1" fontWeight={700}>AI Chat</Typography>
          </Stack>
          {!mdUp && (
            <IconButton size="small" onClick={() => setSidebarOpen(false)}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} onClick={handleNewConversation}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          New Conversation
        </Button>
      </Box>

      <Divider />

      {/* Conversation list — scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, px: 1, py: 1 }}>
        {loadingConvs ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
        ) : conversations.length === 0 ? (
          <Box textAlign="center" py={4}>
            <SIcon size={36} color={theme.palette.text.disabled} />
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>No conversations yet</Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {conversations.map((conv) => (
              <ListItem key={conv._id} disablePadding
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={(e) => handleDeleteRequest(conv._id, e)}
                    sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 0.5 }, '&:hover': { opacity: '1 !important', color: 'error.main' } }}>
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }>
                <ListItemButton selected={activeConvId === conv._id}
                  onClick={() => { loadConversation(conv._id); if (!mdUp) setSidebarOpen(false); }}
                  sx={{
                    borderRadius: 1.5, mb: 0.5, py: 1,
                    '&.Mui-selected': { bgcolor: alpha(accent, 0.08), '&:hover': { bgcolor: alpha(accent, 0.12) } },
                  }}>
                  <ListItemText
                    primary={conv.title || 'Untitled'}
                    secondary={formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                    primaryTypographyProps={{ fontSize: 12.5, fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ fontSize: 10 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {isAdmin && (
        <>
          <Divider />
          <Box sx={{ p: 1.5, flexShrink: 0 }}>
            <Button fullWidth size="small" startIcon={<SettingsRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => router.push('/admin/applications/ai-assistant/config')}
              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: 'text.secondary', justifyContent: 'flex-start' }}>
              AI Configuration
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  const chatHeight = `calc(100vh - ${HEADER_HEIGHT * 1.5}px)`;

  return (
    <Box sx={{ display: 'flex', width: '100%', height: chatHeight, overflow: 'hidden' }}>
      {mdUp && (
        <Box sx={{
          width: SIDEBAR_W, minWidth: SIDEBAR_W, flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? alpha(theme.palette.common.black, 0.2) : alpha(theme.palette.common.black, 0.015),
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          {sidebarContent}
        </Box>
      )}

      {!mdUp && (
        <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} PaperProps={{ sx: { width: SIDEBAR_W } }}>
          {sidebarContent}
        </Drawer>
      )}

      {/* Main chat column */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

        {/* Header — fixed */}
        <Box sx={{
          px: 2, py: 1.5, flexShrink: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: isDark ? alpha(theme.palette.common.black, 0.15) : theme.palette.background.paper,
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {!mdUp && <IconButton size="small" onClick={() => setSidebarOpen(true)}><MenuRoundedIcon fontSize="small" /></IconButton>}
            <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(accent, 0.12) }}>
              <SIcon size={18} color={accent} pulse={streaming} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} fontSize={13}>Sweepstouch AI</Typography>
              <Typography variant="caption" color="text.secondary" fontSize={10}>
                {selectedModel === 'openai' ? 'OpenAI' : selectedModel === 'claude' ? 'Claude' : 'Gemini'} • {streaming ? 'Thinking...' : 'Online'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            {activeConvId && (
              <Tooltip title="Refresh context">
                <IconButton size="small" onClick={() => { refreshConversationContext(activeConvId); toast.success('Context refreshed!'); }}>
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Messages — scrollable, takes remaining space */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1, minHeight: 0,
            overflow: 'auto',
            p: { xs: 2, md: 3 },
            display: 'flex', flexDirection: 'column',
          }}
        >
          {messages.length === 0 && !streamingText ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <Box sx={{
                width: 72, height: 72, borderRadius: '50%',
                bgcolor: alpha(accent, 0.08),
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
                animation: 'welcomeGlow 3s ease-in-out infinite',
                '@keyframes welcomeGlow': {
                  '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(accent, 0)}` },
                  '50%': { boxShadow: `0 0 0 10px ${alpha(accent, 0.08)}` },
                },
              }}>
                <SIcon size={40} color={accent} spin />
              </Box>
              <Typography variant="h6" fontWeight={700} mb={0.5}>Sweepstouch AI</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={380} mb={2} fontSize={12}>
                Ask me about your team, campaigns, tasks, stores, or anything about the platform.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={0.75}>
                {['¿Qué tareas tiene cada persona del equipo?', 'Show me active campaigns', '¿Cuántas tiendas tenemos?', 'Summarize our audience metrics'].map((q) => (
                  <Chip key={q} label={q} variant="outlined"
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    sx={{
                      borderRadius: 2, fontSize: 11, fontWeight: 500,
                      borderColor: alpha(accent, 0.3), color: accent,
                      '&:hover': { bgcolor: alpha(accent, 0.08) },
                    }}
                  />
                ))}
                <Chip
                  label="🎨 Generate a banner"
                  variant="outlined"
                  icon={<AutoFixHighRoundedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => { setImageMode(true); setInput('promotional banner for a sweepstakes campaign'); inputRef.current?.focus(); }}
                  sx={{
                    borderRadius: 2, fontSize: 11, fontWeight: 500,
                    borderColor: alpha('#8E24AA', 0.3), color: '#8E24AA',
                    '&:hover': { bgcolor: alpha('#8E24AA', 0.08) },
                  }}
                />
              </Stack>
            </Box>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isUser={msg.role === 'user'} />)}
              {streamingText && <MessageBubble msg={{ role: 'assistant', content: streamingText }} isUser={false} />}
              {streaming && !streamingText && <StreamingIndicator />}
            </>
          )}
        </Box>

        {/* Pending attachments — fixed above input */}
        {pendingAttachments.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {pendingAttachments.map((att, i) => (
                <Chip key={i} label={att.name} size="small"
                  icon={att.type === 'image' ? <ImageRoundedIcon sx={{ fontSize: 14 }} /> : <DescriptionRoundedIcon sx={{ fontSize: 14 }} />}
                  onDelete={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
                  sx={{ fontSize: 11 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Input area — fixed at bottom */}
        <Box sx={{
          p: 2, flexShrink: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? alpha(theme.palette.common.black, 0.15) : theme.palette.background.paper,
        }}>
          <input type="file" ref={imageInputRef} hidden multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
          <input type="file" ref={fileInputRef} hidden multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.md" onChange={(e) => handleFileUpload(e, 'file')} />

          {/* Image mode banner */}
          {imageMode && (
            <Box sx={{
              mb: 1, px: 1.5, py: 0.75, borderRadius: 2,
              bgcolor: alpha('#8E24AA', 0.08),
              border: `1px solid ${alpha('#8E24AA', 0.25)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <AutoFixHighRoundedIcon sx={{ fontSize: 15, color: '#8E24AA' }} />
                <Typography variant="caption" sx={{ color: '#8E24AA', fontWeight: 600, fontSize: 11 }}>
                  Image Generation Mode — describe what you want to create
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setImageMode(false)} sx={{ p: 0.25 }}>
                <CloseRoundedIcon sx={{ fontSize: 14, color: '#8E24AA' }} />
              </IconButton>
            </Box>
          )}

          <Stack direction="row" spacing={1} alignItems="flex-end">
            {/* Attach */}
            <Tooltip title="Attach file">
              <IconButton size="small" aria-label="Attach file" onClick={(e) => setAttachAnchor(e.currentTarget)}
                disabled={uploading || streaming || imageMode} sx={{ color: accent }}>
                {uploading ? <CircularProgress size={18} /> : <AttachFileRoundedIcon />}
              </IconButton>
            </Tooltip>

            <Menu anchorEl={attachAnchor} open={Boolean(attachAnchor)} onClose={() => setAttachAnchor(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 160 } } }}>
              <MenuItem onClick={() => { imageInputRef.current?.click(); setAttachAnchor(null); }}
                sx={{ fontSize: 13, gap: 1 }}>
                <ImageRoundedIcon sx={{ fontSize: 18, color: accent }} /> Upload Image
              </MenuItem>
              <MenuItem onClick={() => { fileInputRef.current?.click(); setAttachAnchor(null); }}
                sx={{ fontSize: 13, gap: 1 }}>
                <DescriptionRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> Upload File
              </MenuItem>
            </Menu>

            {/* Image gen mode toggle */}
            <Tooltip title={imageMode ? 'Exit image mode' : 'Generate image with AI'}>
              <IconButton size="small" aria-label={imageMode ? 'Exit image mode' : 'Generate image'} disabled={streaming}
                onClick={() => setImageMode((v) => !v)}
                sx={{
                  color: imageMode ? '#8E24AA' : 'text.secondary',
                  bgcolor: imageMode ? alpha('#8E24AA', 0.1) : 'transparent',
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: alpha('#8E24AA', 0.12), color: '#8E24AA' },
                }}>
                <AutoFixHighRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Text field */}
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder={
                recording ? '🎙 Listening...' :
                  transcribing ? '⏳ Transcribing...' :
                    streaming ? 'Generating...' :
                      imageMode ? 'Describe the image you want to create...' :
                        'Ask anything about Sweepstouch...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming || transcribing}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5, fontSize: 13,
                  bgcolor: isDark ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.common.black, 0.03),
                  ...(imageMode && {
                    borderColor: alpha('#8E24AA', 0.4),
                    '& fieldset': { borderColor: alpha('#8E24AA', 0.3) },
                  }),
                },
              }}
            />

            <TextField
              select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as AIModel)}
              disabled={streaming || transcribing}
              size="small"
              SelectProps={{
                renderValue: (value) => <ModelOption model={value as AIModel} />,
                MenuProps: {
                  disablePortal: true,
                  anchorOrigin: { vertical: 'top', horizontal: 'left' },
                  transformOrigin: { vertical: 'bottom', horizontal: 'left' },
                  slotProps: {
                    paper: {
                      sx: {
                        mb: 0.75,
                        borderRadius: 2,
                        boxShadow: theme.shadows[6],
                        border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                        overflow: 'hidden',
                      },
                    },
                  },
                },
              }}
              sx={{
                minWidth: { xs: 118, sm: 132 },
                '& .MuiOutlinedInput-root': {
                  height: 40,
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: isDark ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.common.black, 0.03),
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                },
              }}
            >
              <MenuItem value="openai" sx={{ fontSize: 12, fontWeight: 600 }}>
                <ModelOption model="openai" />
              </MenuItem>
              <MenuItem value="claude" sx={{ fontSize: 12, fontWeight: 600 }}>
                <ModelOption model="claude" />
              </MenuItem>
              <MenuItem value="gemini" sx={{ fontSize: 12, fontWeight: 600 }}>
                <ModelOption model="gemini" />
              </MenuItem>
            </TextField>

            {/* Mic button */}
            <Tooltip title={recording ? 'Stop recording' : 'Voice input'}>
              <IconButton size="small" aria-label={recording ? 'Stop recording' : 'Voice input'} disabled={streaming || transcribing}
                onClick={handleVoice}
                sx={{
                  color: recording ? 'error.main' : 'text.secondary',
                  bgcolor: recording ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                  borderRadius: 1.5, width: 34, height: 34,
                  border: recording ? `1.5px solid ${alpha(theme.palette.error.main, 0.4)}` : '1.5px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' },
                  ...(recording && {
                    animation: 'micPulse 1s ease-in-out infinite',
                    '@keyframes micPulse': {
                      '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` },
                      '50%': { boxShadow: `0 0 0 5px ${alpha(theme.palette.error.main, 0.15)}` },
                    },
                  }),
                }}>
                {transcribing
                  ? <CircularProgress size={16} color="inherit" />
                  : <MicRoundedIcon sx={{ fontSize: 18 }} />
                }
              </IconButton>
            </Tooltip>

            {/* Send / Stop */}
            {streaming ? (
              <Tooltip title="Stop generating">
                <IconButton aria-label="Stop generation" onClick={handleStop} sx={{
                  bgcolor: isDark ? alpha(theme.palette.error.main, 0.15) : alpha(theme.palette.error.main, 0.08),
                  color: 'error.main', borderRadius: 2, width: 38, height: 38,
                  border: `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`,
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
                  animation: 'stopPulse 2s ease-in-out infinite',
                  '@keyframes stopPulse': {
                    '0%, 100%': { borderColor: alpha(theme.palette.error.main, 0.3) },
                    '50%': { borderColor: alpha(theme.palette.error.main, 0.7) },
                  },
                }}>
                  <StopRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton onClick={handleSend}
                disabled={(!input.trim() && pendingAttachments.length === 0) || transcribing}
                sx={{
                  bgcolor: imageMode ? '#8E24AA' : 'primary.main',
                  color: 'white', borderRadius: 2, width: 38, height: 38,
                  '&:hover': { bgcolor: imageMode ? '#6A1B9A' : 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: alpha(imageMode ? '#8E24AA' : theme.palette.primary.main, 0.3), color: 'white' },
                  transition: 'background-color 0.2s',
                }}>
                {imageMode
                  ? <AutoFixHighRoundedIcon sx={{ fontSize: 18 }} />
                  : <SendRoundedIcon sx={{ fontSize: 18 }} />
                }
              </IconButton>
            )}
          </Stack>

          <Typography variant="caption" color="text.disabled" fontSize={10} mt={0.75} display="block" textAlign="center">
            AI can make mistakes. Verify important information from the platform.
          </Typography>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 0.5 }}>
          Delete conversation?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" fontSize={13}>
            This action cannot be undone. The conversation and all its messages will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: 13 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: 13 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
