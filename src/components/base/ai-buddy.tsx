'use client';

/**
 * El asistente de IA acompaña en todo el panel: un botón flotante abajo a la derecha
 * que abre un chat sin salir de la pantalla. Sabe en qué página estás (se lo decimos
 * en cada pregunta), puede llevarte a otra y ejecutar acciones (crear tareas…).
 * La conversación vive mientras el panel esté abierto: navegar no la borra.
 */
import { RouterLink } from '@/components/base/router-link';
import { usePathname } from '@/hooks/use-pathname';
import type { MenuItem } from '@/router/menuItem';
import { currentModule, menuModules } from '@/router/nav';
import { routes } from '@/router/routes';
import { searchWithAI, type AISearchResult } from '@/services/ai.service';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Fab,
  Grow,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { tint } from 'src/theme/semantic';

type Turn = { id: number; from: 'me' | 'ai'; text: string; result?: AISearchResult; page?: string };

/** Markdown mínimo, escapando el HTML que venga en la respuesta. */
const md = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^(?:- |\d+\. )(.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');

export default function AiBuddy({ menuItems }: { menuItems: MenuItem[] }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { push } = useRouter();
  const modules = useMemo(() => menuModules(menuItems), [menuItems]);
  const aiRoute = routes.admin.applications['ai-assistant'];

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // En qué pantalla está la persona, con nombre: es el contexto que se le pasa a la IA.
  const here = currentModule(pathname, modules);
  const page = here?.module.pages.find((p) => p.route === here.route);
  const pageName = page ? (page.module ? `${page.module} › ${page.title}` : page.title) : '';

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns, busy]);

  // Sólo para quien tiene el asistente en su menú; en la página del chat completo sobra.
  const allowed = modules.some((m) => m.pages.some((p) => p.route === aiRoute));
  if (!allowed || pathname.startsWith(aiRoute)) return null;

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setText('');
    setTurns((t) => [...t, { id: Date.now(), from: 'me', text: q, page: pageName }]);
    setBusy(true);
    try {
      const context = `\n\n(Contexto: estoy en la pantalla "${pageName || pathname}" del panel, ruta ${pathname}.)`;
      const result = await searchWithAI(q + context);
      setTurns((t) => [
        ...t,
        { id: Date.now() + 1, from: 'ai', text: result.answer || (result.route ? 'Te llevo ahí:' : 'Listo.'), result },
      ]);
    } catch (e: any) {
      setTurns((t) => [
        ...t,
        {
          id: Date.now() + 1,
          from: 'ai',
          text: `No pude responder: ${e?.response?.data?.error || e?.message || 'sin conexión'}. Inténtalo de nuevo.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    pageName ? `¿Qué puedo hacer en ${pageName}?` : '¿Qué puedo hacer en esta pantalla?',
    '¿Cuántas tiendas activas hay?',
    'Crea una tarea para revisar las campañas de esta semana',
  ];

  const offset = {
    right: 'max(20px, env(safe-area-inset-right, 0px))',
    bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
  };

  return (
    <>
      <Grow
        in={open}
        unmountOnExit
        style={{ transformOrigin: 'bottom right' }}
      >
        <Paper
          role="dialog"
          aria-label="Asistente de IA"
          elevation={16}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          sx={{
            position: 'fixed',
            zIndex: theme.zIndex.speedDial,
            right: offset.right,
            bottom: `calc(${offset.bottom} + 68px)`,
            width: { xs: 'calc(100vw - 24px)', sm: 400 },
            maxWidth: 'calc(100vw - 24px)',
            height: 'min(560px, calc(100dvh - 140px))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }}
        >
          {/* Cabecera */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1.25}
            sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Box
              aria-hidden
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <SmartToyRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box
              flex={1}
              minWidth={0}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>Asistente</Typography>
              <Typography
                noWrap
                sx={{ fontSize: 11.5, color: 'text.secondary' }}
              >
                {pageName ? `Viendo: ${pageName}` : 'Te acompaña en todo el panel'}
              </Typography>
            </Box>
            {turns.length > 0 && (
              <Tooltip title="Borrar la conversación">
                <IconButton
                  size="small"
                  aria-label="Borrar la conversación"
                  onClick={() => setTurns([])}
                >
                  <DeleteSweepRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Abrir el chat completo">
              <IconButton
                size="small"
                aria-label="Abrir el chat completo"
                component={RouterLink}
                href={aiRoute}
                onClick={() => setOpen(false)}
              >
                <OpenInFullRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              aria-label="Cerrar el asistente"
              onClick={() => setOpen(false)}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Conversación */}
          <Stack
            gap={1.25}
            aria-live="polite"
            sx={{ flex: 1, overflowY: 'auto', px: 1.75, py: 1.5 }}
          >
            {turns.length === 0 && (
              <Stack
                gap={1}
                sx={{ my: 'auto' }}
              >
                <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>¿En qué te ayudo?</Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.5 }}>
                  Pregunta por datos, pide que te lleve a una pantalla o que cree una tarea.
                </Typography>
                {suggestions.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    variant="outlined"
                    onClick={() => void ask(s)}
                    sx={{
                      justifyContent: 'flex-start',
                      height: 'auto',
                      py: 0.75,
                      borderRadius: 2,
                      '& .MuiChip-label': { whiteSpace: 'normal', fontSize: 12.5 },
                    }}
                  />
                ))}
              </Stack>
            )}

            {turns.map((turn) =>
              turn.from === 'me' ? (
                <Box
                  key={turn.id}
                  sx={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    px: 1.5,
                    py: 1,
                    borderRadius: '14px 14px 4px 14px',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: 13.5,
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {turn.text}
                </Box>
              ) : (
                <Stack
                  key={turn.id}
                  gap={0.75}
                  sx={{ alignSelf: 'flex-start', maxWidth: '92%' }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: '14px 14px 14px 4px',
                      bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.05),
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      overflowWrap: 'anywhere',
                      '& code': {
                        fontFamily: 'monospace',
                        fontSize: 12,
                        px: 0.5,
                        borderRadius: 0.5,
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                      },
                      '& li': { ml: 2 },
                    }}
                    dangerouslySetInnerHTML={{ __html: md(turn.text) }}
                  />
                  {turn.result?.route && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewRoundedIcon />}
                      onClick={() => push(turn.result!.route!)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {turn.result.routeTitle || 'Abrir'}
                    </Button>
                  )}
                  {turn.result?.actions?.map((a, i) =>
                    a.result?.success ? (
                      <Stack
                        key={i}
                        direction="row"
                        alignItems="center"
                        gap={0.75}
                        sx={{
                          px: 1.25,
                          py: 0.75,
                          borderRadius: 2,
                          bgcolor: tint(theme, 'success', 0.08),
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        <TaskAltRoundedIcon sx={{ fontSize: 17, color: 'success.main' }} />
                        {a.result?.message || 'Acción completada'}
                      </Stack>
                    ) : null
                  )}
                </Stack>
              )
            )}

            {busy && (
              <Stack
                direction="row"
                gap={0.5}
                aria-label="Pensando"
                sx={{
                  alignSelf: 'flex-start',
                  px: 1.5,
                  py: 1.25,
                  borderRadius: '14px 14px 14px 4px',
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                  '& span': {
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'text.secondary',
                    animation: 'buddyDot 1s ease-in-out infinite',
                  },
                  '& span:nth-of-type(2)': { animationDelay: '0.15s' },
                  '& span:nth-of-type(3)': { animationDelay: '0.3s' },
                  '@keyframes buddyDot': {
                    '0%, 80%, 100%': { opacity: 0.25 },
                    '40%': { opacity: 1 },
                  },
                  '@media (prefers-reduced-motion: reduce)': { '& span': { animation: 'none', opacity: 0.6 } },
                }}
              >
                <span />
                <span />
                <span />
              </Stack>
            )}
            <div ref={endRef} />
          </Stack>

          {/* Entrada */}
          <Stack
            component="form"
            direction="row"
            alignItems="flex-end"
            gap={0.75}
            onSubmit={(e) => {
              e.preventDefault();
              void ask(text);
            }}
            sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <InputBase
              inputRef={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void ask(text);
                }
              }}
              multiline
              maxRows={4}
              placeholder="Escribe tu pregunta…"
              inputProps={{ 'aria-label': 'Pregunta para el asistente' }}
              sx={{
                flex: 1,
                px: 1.5,
                py: 1,
                fontSize: 14,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.04),
              }}
            />
            <IconButton
              type="submit"
              color="primary"
              aria-label="Enviar"
              disabled={busy || !text.trim()}
              sx={{ width: 40, height: 40 }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Paper>
      </Grow>

      <Tooltip
        title={open ? '' : 'Asistente de IA'}
        placement="left"
      >
        <Fab
          color="primary"
          aria-label={open ? 'Cerrar el asistente' : 'Abrir el asistente de IA'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          sx={{
            position: 'fixed',
            zIndex: theme.zIndex.speedDial,
            right: offset.right,
            bottom: offset.bottom,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            transition: 'transform 160ms ease-out',
            '&:hover': { transform: 'scale(1.06)' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
          }}
        >
          {open ? <CloseRoundedIcon /> : <SmartToyRoundedIcon />}
        </Fab>
      </Tooltip>
    </>
  );
}
