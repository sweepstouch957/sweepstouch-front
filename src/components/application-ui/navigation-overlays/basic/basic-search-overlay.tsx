/**
 * Buscador global (Ctrl+K).
 *
 * Antes filtraba 24 páginas escritas a mano y en inglés, varias con la ruta rota.
 * Ahora busca en TODO lo que el rol puede abrir (sale del mismo menú de la barra
 * lateral), sin distinguir acentos, y también tiendas por nombre para ir directo a
 * su panel. Flechas para moverse, Enter para abrir, Tab para preguntarle a la IA.
 */
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { useAuth } from '@/hooks/use-auth';
import useMenuItemsCollapsedShells from '@/hooks/use-routes';
import { menuModules, norm } from '@/router/nav';
import { searchWithAI, type AISearchResult } from '@/services/ai.service';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SearchOffTwoToneIcon from '@mui/icons-material/SearchOffTwoTone';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  OutlinedInput,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tint } from 'src/theme/semantic';

type Result = {
  key: string;
  group: 'Tiendas' | 'Acciones' | 'Páginas';
  title: string;
  hint: string;
  route: string;
  icon: React.ReactNode;
};

/** Acciones que no son un ítem del menú (crear es un botón, no una sección). */
const ACTIONS: { title: string; hint: string; route: string; needs: string; words: string }[] = [
  { title: 'Nueva campaña', hint: 'Elegir tienda y armar el mensaje', route: '/admin/management/campaings/create', needs: '/admin/management/campaings', words: 'crear campana sms mms rcs enviar' },
  { title: 'Enviar prueba', hint: 'Probar un mensaje antes de agendarlo', route: '/admin/management/campaings/send-test', needs: '/admin/management/campaings', words: 'test prueba mensaje' },
  { title: 'Crear tienda', hint: 'Registrar una tienda nueva', route: '/admin/management/stores/create', needs: '/admin/management/stores', words: 'nueva tienda alta registrar' },
  { title: 'Mi cuenta', hint: 'Perfil y contraseña', route: '/admin/management/account', needs: '', words: 'perfil password clave cuenta' },
];

/* ─── Markdown mínimo para las respuestas de la IA ─── */
function renderSimpleMarkdown(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin:1px 0;margin-left:14px;font-size:13px">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:1px 0;margin-left:14px;font-size:13px">$2</li>')
    .replace(/\n/g, '<br/>');
}

interface BasicSpotlightSearchProps {
  onClose?: () => void;
  open?: boolean;
}

export const BasicSpotlightSearch: FC<BasicSpotlightSearchProps> = (props) => {
  const { onClose, open = false, ...other } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [cursor, setCursor] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { push } = useRouter();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const listRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const { user } = useAuth();
  const menu = useMenuItemsCollapsedShells(t, (user?.role || '') as any);
  const pages = useMemo(() => menuModules(menu).flatMap((m) => m.pages), [menu]);

  const q = norm(searchTerm);
  const stores = useStoreSearch(searchTerm, { limit: 6, enabled: open && !aiMode });

  const results = useMemo<Result[]>(() => {
    if (aiMode) return [];
    const canOpen = (prefix: string) => !prefix || pages.some((p) => p.route.startsWith(prefix));
    const actions = ACTIONS.filter((a) => canOpen(a.needs));

    // Sin texto: lo de todos los días, no una lista de 60 páginas.
    if (!q) {
      return [
        { key: 'home', group: 'Páginas', title: 'Inicio', hint: 'Números del día y todos los módulos', route: '/admin', icon: <HomeRoundedIcon fontSize="small" /> },
        ...actions.slice(0, 3).map<Result>((a) => ({ key: a.route, group: 'Acciones', title: a.title, hint: a.hint, route: a.route, icon: <AddCircleOutlineRoundedIcon fontSize="small" /> })),
        ...pages
          .filter((p) => /tiendas|campa|tareas/.test(norm(p.module || p.title)) && /listado|tareas/.test(norm(p.title)))
          .map<Result>((p) => ({ key: p.route, group: 'Páginas', title: p.module ? `${p.module} · ${p.title}` : p.title, hint: p.section, route: p.route, icon: p.icon })),
      ];
    }

    const words = q.split(/\s+/);
    const hit = (text: string) => words.every((w) => text.includes(w));
    return [
      ...(q.length >= 2 ? stores.options : []).map<Result>((s: any) => ({
        key: `store-${s._id || s.id}`,
        group: 'Tiendas',
        title: s.name,
        hint: s.address || 'Abrir el panel de la tienda',
        route: `/admin/management/stores/edit/${s._id || s.id}`,
        icon: <StoreRoundedIcon fontSize="small" />,
      })),
      ...actions
        .filter((a) => hit(norm(`${a.title} ${a.words}`)))
        .map<Result>((a) => ({ key: a.route, group: 'Acciones', title: a.title, hint: a.hint, route: a.route, icon: <AddCircleOutlineRoundedIcon fontSize="small" /> })),
      ...pages
        .filter((p) => hit(norm(`${p.module} ${p.title} ${p.section}`)))
        .map<Result>((p) => ({
          key: p.route,
          group: 'Páginas',
          title: p.module ? `${p.module} · ${p.title}` : p.title,
          hint: p.section,
          route: p.route,
          icon: p.icon,
        })),
    ];
  }, [aiMode, q, pages, stores.options]);

  useEffect(() => setCursor(0), [q, aiMode]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${cursor}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const handleNavigate = (route: string) => {
    push(route);
    setSearchTerm('');
    setAiResult(null);
    onClose?.();
  };

  const handleAISearch = async () => {
    if (!searchTerm.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      setAiResult(await searchWithAI(searchTerm));
    } catch (err: any) {
      setAiResult({ type: 'answer', answer: `No se pudo consultar a la IA: ${err?.message || 'sin conexión'}` });
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setAiMode((prev) => !prev);
      setAiResult(null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (aiMode) void handleAISearch();
      else if (results[cursor]) handleNavigate(results[cursor].route);
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setAiResult(null);
    setAiMode(false);
    onClose?.();
  };

  const searchingStores = !aiMode && q.length >= 2 && stores.loading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      scroll="paper"
      maxWidth="sm"
      sx={{
        '.MuiDialog-container': {
          alignItems: 'flex-start',
          pt: { xs: 0, md: 4, lg: 6 },
          maxHeight: { xs: 'unset', md: 620 },
          height: { xs: '100%', md: '80%' },
        },
        '.MuiPaper-root': {
          borderRadius: { xs: 0, md: 3 },
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.97) : 'background.paper',
        },
      }}
      {...other}
    >
      <DialogTitle sx={{ p: 0 }}>
        <OutlinedInput
          sx={{
            fontSize: 15,
            fontWeight: 500,
            '.MuiOutlinedInput-input': { height: '44px' },
            '.MuiOutlinedInput-notchedOutline': { border: 'none' },
          }}
          autoFocus
          margin="none"
          type="text"
          autoComplete="off"
          fullWidth
          inputProps={{ 'aria-label': 'Buscar en el panel' }}
          placeholder={
            aiMode
              ? 'Pregúntale a la IA: crea tareas, busca datos…'
              : 'Busca una tienda, una pantalla o una acción…'
          }
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!aiMode) setAiResult(null);
          }}
          onKeyDown={handleKeyDown}
          startAdornment={
            <InputAdornment position="start">
              {aiMode ? (
                <SmartToyRoundedIcon sx={{ color: accent, fontSize: 22 }} />
              ) : searchingStores ? (
                <CircularProgress size={20} />
              ) : (
                <SearchTwoToneIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              )}
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
              >
                <Tooltip
                  title={aiMode ? 'Volver a buscar (Tab)' : 'Preguntar a la IA (Tab)'}
                  arrow
                >
                  <IconButton
                    size="small"
                    aria-label={aiMode ? 'Volver a buscar' : 'Preguntar a la IA'}
                    onClick={() => {
                      setAiMode((p) => !p);
                      setAiResult(null);
                    }}
                    sx={{
                      borderRadius: 1.5,
                      bgcolor: aiMode ? alpha(accent, 0.12) : 'transparent',
                      color: aiMode ? accent : 'text.secondary',
                      border: aiMode ? `1px solid ${alpha(accent, 0.3)}` : '1px solid transparent',
                      '&:hover': { bgcolor: alpha(accent, 0.1) },
                    }}
                  >
                    <SmartToyRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (searchTerm) {
                      setSearchTerm('');
                      setAiResult(null);
                    } else handleClose();
                  }}
                  sx={{ mr: 0.5 }}
                  aria-label={searchTerm ? 'Borrar búsqueda' : 'Cerrar'}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </InputAdornment>
          }
        />
      </DialogTitle>

      {aiMode && (
        <Box sx={{ px: 2, py: 0.5, bgcolor: alpha(accent, 0.04), borderBottom: `1px solid ${alpha(accent, 0.1)}` }}>
          <Typography
            variant="caption"
            sx={{ color: accent, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            <AutoAwesomeRounded
              fontSize="small"
              sx={{ mr: 1, verticalAlign: 'middle' }}
            />
            Modo IA: pregunta lo que sea o pega notas de una reunión para crear tareas
          </Typography>
        </Box>
      )}

      <Divider />
      <DialogContent
        ref={listRef}
        sx={{ overflowX: 'hidden', p: 0 }}
      >
        {/* ═══ IA ═══ */}
        {aiMode && (
          <>
            {aiLoading && (
              <Stack
                spacing={1.5}
                p={3}
                alignItems="center"
              >
                <CircularProgress
                  size={28}
                  sx={{ color: accent }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize={13}
                >
                  Pensando…
                </Typography>
                <Stack
                  spacing={1}
                  width="100%"
                >
                  <Skeleton variant="rounded"
height={16}
width="80%" />
                  <Skeleton variant="rounded"
height={16}
width="60%" />
                  <Skeleton variant="rounded"
height={16}
width="70%" />
                </Stack>
              </Stack>
            )}

            {aiResult && !aiLoading && (
              <Box p={2}>
                {aiResult.answer && (
                  <Box
                    sx={{
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(accent, 0.04),
                      border: `1px solid ${alpha(accent, 0.1)}`,
                      fontSize: 13,
                      lineHeight: 1.7,
                      '& strong': { color: accent },
                      '& code': { fontFamily: 'monospace' },
                      '& li': { listStyleType: 'disc' },
                    }}
                    dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(aiResult.answer) }}
                  />
                )}

                {aiResult.route && (
                  <ListItemButton
                    onClick={() => handleNavigate(aiResult.route!)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: alpha(accent, 0.06),
                      border: `1px solid ${alpha(accent, 0.15)}`,
                      '&:hover': { bgcolor: alpha(accent, 0.12) },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: accent }}>
                      <OpenInNewRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={aiResult.routeTitle || 'Abrir'}
                      secondary={aiResult.route}
                      primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 700, color: accent }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', fontSize: 11 }}
                    />
                  </ListItemButton>
                )}

                {aiResult.actions?.flatMap((action, i) =>
                  action.result?.success
                    ? [
                        <ListItemButton
                          key={i}
                          onClick={() => {
                            if (action.result?.projectId) {
                              handleNavigate(`/admin/applications/tasks?projectId=${action.result.projectId}`);
                            }
                          }}
                          sx={{
                            py: 1,
                            px: 2,
                            borderRadius: 2,
                            mb: 0.5,
                            bgcolor: tint(theme, 'success', 0.06),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                            '&:hover': { bgcolor: tint(theme, 'success', 0.12) },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <TaskAltRoundedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={action.result?.message || 'Acción completada'}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontSize: 12 }}
                          />
                          <CheckCircleOutlineRoundedIcon sx={{ color: 'success.main', fontSize: 16, opacity: 0.7 }} />
                        </ListItemButton>,
                      ]
                    : []
                )}
              </Box>
            )}

            {!aiResult && !aiLoading && (
              <Stack
                minHeight={120}
                justifyContent="center"
                alignItems="center"
                spacing={1}
                py={4}
                px={2}
                textAlign="center"
              >
                <SmartToyRoundedIcon sx={{ fontSize: 36, color: alpha(accent, 0.3) }} />
                {searchTerm.trim() ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontSize={13}
                  >
                    Pulsa <strong>Enter</strong> para preguntar
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={600}
                      fontSize={13}
                    >
                      Pregunta lo que sea sobre Sweepstouch
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontSize={11.5}
                    >
                      «Crea una tarea para revisar las campañas» · «¿Cuántas tiendas activas hay?»
                    </Typography>
                  </>
                )}
              </Stack>
            )}
          </>
        )}

        {/* ═══ BÚSQUEDA ═══ */}
        {!aiMode && results.length > 0 && (
          <Box
            role="listbox"
            aria-label="Resultados"
            sx={{ py: 0.75 }}
          >
            {results.map((r, i) => (
              <React.Fragment key={r.key}>
                {(i === 0 || results[i - 1].group !== r.group) && (
                  <Typography
                    sx={{
                      px: 2.5,
                      pt: 1.25,
                      pb: 0.5,
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    {r.group}
                  </Typography>
                )}
                <ListItemButton
                  role="option"
                  aria-selected={i === cursor}
                  data-i={i}
                  selected={i === cursor}
                  onMouseMove={() => i !== cursor && setCursor(i)}
                  onClick={() => handleNavigate(r.route)}
                  sx={{ py: 0.9, px: 1.5, mx: 1, borderRadius: 1.5 }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 38,
                      color: r.group === 'Tiendas' ? 'success.main' : r.group === 'Acciones' ? 'warning.main' : 'primary.main',
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}
                  >
                    {r.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={r.title}
                    secondary={r.hint}
                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 700, noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
                  />
                  {i === cursor && (
                    <KeyboardReturnRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                  )}
                </ListItemButton>
              </React.Fragment>
            ))}
          </Box>
        )}

        {!aiMode && q && results.length === 0 && !searchingStores && (
          <Stack
            minHeight={164}
            justifyContent="center"
            alignItems="center"
            spacing={1}
            py={4}
            px={2}
            textAlign="center"
          >
            <SearchOffTwoToneIcon sx={{ fontSize: 42, color: 'text.disabled' }} />
            <Typography fontWeight={700}>Nada con «{searchTerm.trim()}»</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Prueba con el nombre de la tienda o de la pantalla, o pulsa Tab para preguntarle a la IA.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      {!aiMode && (
        <Stack
          direction="row"
          gap={1}
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          {[
            ['↑ ↓', 'moverse'],
            ['Enter', 'abrir'],
            ['Tab', 'IA'],
            ['Esc', 'cerrar'],
          ].map(([k, label]) => (
            <Stack
              key={k}
              direction="row"
              alignItems="center"
              gap={0.5}
            >
              <Chip
                label={k}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: 10, fontWeight: 700, borderRadius: 1 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Dialog>
  );
};
