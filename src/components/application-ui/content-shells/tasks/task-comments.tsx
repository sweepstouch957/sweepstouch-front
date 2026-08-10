'use client';

import { useAuth } from '@/hooks/use-auth';
import { avatarSrc } from '@/utils/avatar';
import {
  commentService,
  mentionToken,
  splitMentions,
  type CommentFile,
  type TaskComment,
} from '@/services/comment.service';
import { uploadCommentFile } from '@/services/upload.service';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Popper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

/* ─── Helpers de presentación ─────────────────────────────────────────────── */

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Un color estable por persona: el mismo nombre siempre pinta igual. */
function personColor(seed = '', palette: string[]) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, hoy)) return 'Hoy';
  if (same(d, ayer)) return 'Ayer';
  return d.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' });
}

const isImage = (f: CommentFile) => f.type?.startsWith('image/');

/* ─── Chat ────────────────────────────────────────────────────────────────── */

export function TaskComments({
  taskId,
  teamMembers,
}: {
  taskId: string;
  teamMembers: any[];
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const me = authUser as any;
  const myId = String(me?._id || me?.id || '');
  const myName = `${me?.firstName || ''} ${me?.lastName || ''}`.trim() || 'Yo';

  const AVATAR_PALETTE = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
    ],
    [theme]
  );

  const [text, setText] = useState('');
  const [pending, setPending] = useState<CommentFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Autocompletado de @menciones
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.list(taskId),
    enabled: !!taskId,
    staleTime: 15_000,
  });

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: (payload: { text: string; files: CommentFile[] }) =>
      commentService.create(taskId, {
        text: payload.text,
        authorId: myId,
        authorName: myName,
        authorAvatar: me?.profileImage || me?.avatar || '',
        files: payload.files,
      }),
    onSuccess: (_data, vars) => {
      setText('');
      setPending([]);
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      // Lo adjuntado acá entra como evidencia de la tarea: hay que repintar el panel
      if (vars.files.length) {
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        toast.success(
          vars.files.length === 1
            ? 'Adjunto guardado como evidencia'
            : `${vars.files.length} adjuntos guardados como evidencia`
        );
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo enviar'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => commentService.remove(id, myId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      // Borrar el comentario retira también su evidencia
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo borrar'),
  });

  /* ── Menciones ── */

  const candidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return teamMembers
      .filter((u: any) => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return !q || name.includes(q) || (u.position || '').toLowerCase().includes(q);
      })
      .slice(0, 6);
  }, [mentionQuery, teamMembers]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);

    // ¿El cursor viene escribiendo una @mención?
    const upToCaret = value.slice(0, e.target.selectionStart ?? value.length);
    const m = upToCaret.match(/(?:^|\s)@([\p{L}\s]{0,25})$/u);
    setMentionQuery(m ? m[1] : null);
    setHighlighted(0);
  }

  function pickMention(user: any) {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret);
    const after = text.slice(caret);
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const token = mentionToken(name, String(user._id || user.id));

    const replaced = before.replace(/(?:^|\s)@([\p{L}\s]{0,25})$/u, (match) =>
      match.startsWith(' ') ? ` ${token} ` : `${token} `
    );
    setText(replaced + after);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = replaced.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && candidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => (h + 1) % candidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => (h - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickMention(candidates[highlighted]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
    // Enter envía; Shift+Enter salta de línea
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  /* ── Adjuntos ── */

  async function attach(files: FileList | File[] | null) {
    const list = Array.from(files || []);
    if (!list.length) return;
    setUploading(true);
    try {
      const uploaded: CommentFile[] = [];
      for (const f of list) {
        const url = await uploadCommentFile(f);
        uploaded.push({ url, name: f.name, type: f.type, size: f.size });
      }
      setPending((p) => [...p, ...uploaded]);
    } catch {
      toast.error('No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (sending || uploading) return;
    if (!text.trim() && !pending.length) return;
    send({ text: text.trim(), files: pending });
  }

  /* ── Render ── */

  /** Ventana para agrupar mensajes seguidos de la misma persona. */
  const GROUP_WINDOW_MS = 5 * 60 * 1000;

  let lastDay = '';

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mb={1.25}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.7 }}
        >
          CONVERSACIÓN
        </Typography>
        {comments.length > 0 && (
          <Chip
            size="small"
            label={comments.length}
            sx={{ height: 17, fontSize: 9, fontWeight: 700 }}
          />
        )}
      </Stack>

      {/* Hilo */}
      <Stack
        sx={{
          maxHeight: 380,
          overflowY: 'auto',
          px: 1,
          mx: -1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.primary, 0.12),
            borderRadius: 2,
          },
        }}
      >
        {isLoading && (
          <Stack
            alignItems="center"
            py={2}
          >
            <CircularProgress size={18} />
          </Stack>
        )}

        {!isLoading && comments.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              px: 2,
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
            }}
          >
            <AlternateEmailRoundedIcon sx={{ fontSize: 22, color: 'text.disabled', mb: 0.5 }} />
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
            >
              Nadie ha comentado todavía
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
            >
              Escribí <b>@</b> y el nombre de alguien para pedirle ayuda: le llega notificación,
              correo y WhatsApp.
            </Typography>
          </Box>
        )}

        {comments.map((c: TaskComment, i: number) => {
          const prev = comments[i - 1];
          const color = personColor(c.authorName || c.authorId, AVATAR_PALETTE);
          const day = dayLabel(c.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;

          // Mensajes seguidos de la misma persona se agrupan: repetir el avatar
          // y el nombre cada dos líneas es lo que hace que un hilo parezca chat.
          const grouped =
            !showDay &&
            !!prev &&
            String(prev.authorId) === String(c.authorId) &&
            new Date(c.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;

          return (
            <React.Fragment key={c._id}>
              {showDay && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 1.25 }}
                >
                  <Box sx={{ flex: 1, height: '1px', bgcolor: alpha(theme.palette.divider, 0.7) }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: 0.7,
                      textTransform: 'uppercase',
                      color: 'text.disabled',
                    }}
                  >
                    {day}
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: alpha(theme.palette.divider, 0.7) }} />
                </Stack>
              )}

              <Stack
                direction="row"
                spacing={1.25}
                sx={{
                  alignItems: 'flex-start',
                  px: 1,
                  mx: -1,
                  py: grouped ? 0.3 : 0.85,
                  borderRadius: 1.5,
                  transition: 'background-color .12s',
                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, isDark ? 0.05 : 0.035) },
                  '&:hover .comment-actions': { opacity: 1 },
                }}
              >
                <Box sx={{ width: 30, flexShrink: 0 }}>
                  {grouped ? (
                    <Typography
                      className="comment-actions"
                      sx={{
                        opacity: 0,
                        transition: 'opacity .12s',
                        fontSize: 9.5,
                        color: 'text.disabled',
                        textAlign: 'right',
                        pr: 0.25,
                        lineHeight: '20px',
                      }}
                    >
                      {new Date(c.createdAt).toLocaleTimeString('es-HN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  ) : (
                    <Avatar
                      src={avatarSrc(c.authorAvatar)}
                      sx={{
                        width: 30,
                        height: 30,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: alpha(color, 0.16),
                        color,
                      }}
                    >
                      {initials(c.authorName)}
                    </Avatar>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {!grouped && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="baseline"
                      sx={{ mb: 0.15 }}
                    >
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>
                        {c.authorName || 'Alguien'}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                        {relativeTime(c.createdAt)}
                        {c.editedAt ? ' · editado' : ''}
                      </Typography>
                    </Stack>
                  )}

                  <Box>
                    {c.text && (
                      <Typography
                        variant="body2"
                        sx={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {splitMentions(c.text).map((part, i) =>
                          part.type === 'mention' ? (
                            <Box
                              key={i}
                              component="span"
                              sx={{
                                display: 'inline',
                                px: 0.5,
                                py: 0.1,
                                mx: 0.15,
                                borderRadius: 1,
                                fontWeight: 700,
                                fontSize: 12.5,
                                color:
                                  part.userId === myId
                                    ? theme.palette.warning.dark
                                    : theme.palette.primary.main,
                                bgcolor: alpha(
                                  part.userId === myId
                                    ? theme.palette.warning.main
                                    : theme.palette.primary.main,
                                  0.14
                                ),
                              }}
                            >
                              @{part.value}
                            </Box>
                          ) : (
                            <React.Fragment key={i}>{part.value}</React.Fragment>
                          )
                        )}
                      </Typography>
                    )}

                    {/* Adjuntos — son evidencia de la tarea, y se dice */}
                    {c.files?.length > 0 && (
                      <Box sx={{ mt: c.text ? 0.9 : 0 }}>
                        <Typography
                          sx={{ mb: 0.5, fontSize: 10, fontWeight: 700, color: 'text.disabled' }}
                        >
                          {c.files.length} ADJUNTO{c.files.length > 1 ? 'S' : ''} · EVIDENCIA DE LA
                          TAREA
                        </Typography>
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.75}
                        >
                          {c.files.map((f) =>
                            isImage(f) ? (
                              <Box
                                key={f.url}
                                component="a"
                                href={f.url}
                                target="_blank"
                                rel="noopener"
                                aria-label={f.name || 'Ver adjunto'}
                                sx={{
                                  display: 'block',
                                  width: 88,
                                  height: 88,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                  backgroundImage: `url(${f.url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  transition: 'transform .15s, border-color .15s',
                                  '&:hover': {
                                    transform: 'scale(1.03)',
                                    borderColor: theme.palette.primary.main,
                                  },
                                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                                }}
                              />
                            ) : (
                              <Chip
                                key={f.url}
                                icon={<DescriptionRoundedIcon sx={{ fontSize: 14 }} />}
                                label={f.name || 'archivo'}
                                size="small"
                                component="a"
                                href={f.url}
                                target="_blank"
                                clickable
                                sx={{ maxWidth: 220, fontSize: 11, borderRadius: 1.5 }}
                              />
                            )
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Box>

                {String(c.authorId) === myId && (
                  <Tooltip
                    title="Borrar comentario"
                    arrow
                  >
                    <IconButton
                      size="small"
                      className="comment-actions"
                      onClick={() => remove(c._id)}
                      sx={{ opacity: 0, transition: 'opacity .12s', p: 0.35, flexShrink: 0 }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </React.Fragment>
          );
        })}
      </Stack>

      {/* Composer */}
      <Box
        ref={anchorRef}
        sx={{
          mt: 2,
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          bgcolor: theme.palette.background.paper,
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
          transition: 'border-color .15s, box-shadow .15s',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          attach(e.dataTransfer.files);
        }}
      >
        {pending.length > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={0.5}
            sx={{ p: 1, pb: 0 }}
          >
            {pending.map((f, i) => (
              <Chip
                key={f.url}
                label={f.name}
                size="small"
                onDelete={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                icon={
                  isImage(f) ? (
                    <Avatar
                      src={f.url}
                      variant="rounded"
                      sx={{ width: 18, height: 18 }}
                    />
                  ) : (
                    <DescriptionRoundedIcon sx={{ fontSize: 14 }} />
                  )
                }
                sx={{ maxWidth: 180, fontSize: 11 }}
              />
            ))}
          </Stack>
        )}

        <Box
          component="textarea"
          ref={inputRef as any}
          value={text}
          onChange={handleChange as any}
          onKeyDown={handleKeyDown as any}
          onPaste={(e: React.ClipboardEvent) => {
            const files = Array.from(e.clipboardData.files || []);
            if (files.length) {
              e.preventDefault();
              attach(files);
            }
          }}
          placeholder="Escribí un comentario…  usá @ para pedirle ayuda a alguien"
          rows={2}
          sx={{
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            bgcolor: 'transparent',
            color: theme.palette.text.primary,
            font: 'inherit',
            fontSize: 13,
            lineHeight: 1.5,
            p: 1.25,
            '&::placeholder': { color: theme.palette.text.disabled },
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1, pb: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
          >
            <Tooltip
              title="Adjuntar foto o archivo · queda como evidencia de la tarea"
              arrow
            >
              <IconButton
                size="small"
                component="label"
                disabled={uploading}
              >
                {uploading ? (
                  <CircularProgress size={14} />
                ) : (
                  <AttachFileRoundedIcon sx={{ fontSize: 16 }} />
                )}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={(e) => {
                    attach(e.target.files);
                    e.target.value = '';
                  }}
                />
              </IconButton>
            </Tooltip>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontSize: 10 }}
            >
              Enter envía · Shift+Enter salta línea
            </Typography>
          </Stack>

          <IconButton
            size="small"
            onClick={submit}
            disabled={sending || uploading || (!text.trim() && !pending.length)}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              width: 30,
              height: 30,
              '&:hover': { bgcolor: theme.palette.primary.dark },
              '&.Mui-disabled': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
            }}
          >
            {sending ? <CircularProgress size={14}
color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Stack>
      </Box>

      {/* Autocompletado de menciones */}
      <Popper
        open={mentionQuery !== null && candidates.length > 0}
        anchorEl={anchorRef.current}
        placement="top-start"
        sx={{ zIndex: 2000, width: anchorRef.current?.clientWidth }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            mb: 0.5,
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{ px: 1.5, pt: 1, pb: 0.5, display: 'block', color: 'text.disabled', fontSize: 10 }}
          >
            MENCIONAR — le llega notificación, correo y WhatsApp
          </Typography>
          {candidates.map((u: any, i: number) => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            const color = personColor(name, AVATAR_PALETTE);
            return (
              <Stack
                key={u._id || u.id}
                direction="row"
                alignItems="center"
                spacing={1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMention(u);
                }}
                onMouseEnter={() => setHighlighted(i)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  cursor: 'pointer',
                  bgcolor: i === highlighted ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                }}
              >
                <Avatar
                  src={avatarSrc(u.profileImage)}
                  sx={{ width: 24, height: 24, fontSize: 10, bgcolor: alpha(color, 0.16), color }}
                >
                  {initials(name)}
                </Avatar>
                <Box flex={1}
minWidth={0}>
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    noWrap
                  >
                    {name}
                  </Typography>
                  {u.position && (
                    <Typography
                      fontSize={10}
                      color="text.secondary"
                      noWrap
                    >
                      {u.position}
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Paper>
      </Popper>
    </Box>
  );
}
