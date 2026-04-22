import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import SearchOffTwoToneIcon from '@mui/icons-material/SearchOffTwoTone';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import RedeemRoundedIcon from '@mui/icons-material/RedeemRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  OutlinedInput,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { FC, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { searchWithAI, type AISearchResult } from '@/services/ai.service';

/* ═══════════ Route-based search items ═══════════ */
interface SearchItem {
  title: string;
  description: string;
  route: string;
  category: 'navigation' | 'management' | 'actions' | 'tools';
  icon: React.ReactNode;
  keywords: string[];
}

const searchItems: SearchItem[] = [
  // ─── Navigation
  { title: 'Dashboard', description: 'Reports & analytics overview', route: '/admin/dashboards/reports', category: 'navigation', icon: <DashboardRoundedIcon fontSize="small" />, keywords: ['home', 'main', 'overview', 'inicio'] },
  { title: 'Messages Sent', description: 'Track message delivery stats', route: '/admin/dashboards/messages-sent', category: 'navigation', icon: <BarChartRoundedIcon fontSize="small" />, keywords: ['sms', 'mms', 'delivery', 'metrics'] },
  { title: 'Audience', description: 'Customer audience insights', route: '/admin/dashboards/audience', category: 'navigation', icon: <PeopleRoundedIcon fontSize="small" />, keywords: ['customers', 'reach', 'organic'] },
  { title: 'Billing', description: 'Financial overview', route: '/admin/dashboards/billing', category: 'navigation', icon: <DescriptionRoundedIcon fontSize="small" />, keywords: ['invoices', 'payments', 'money'] },

  // ─── Management
  { title: 'Stores', description: 'Manage all store locations', route: '/admin/management/stores', category: 'management', icon: <StoreRoundedIcon fontSize="small" />, keywords: ['tiendas', 'locations', 'shops'] },
  { title: 'Create Store', description: 'Register a new store', route: '/admin/management/stores/create', category: 'management', icon: <AddCircleOutlineRoundedIcon fontSize="small" />, keywords: ['new', 'add', 'crear tienda'] },
  { title: 'Campaigns', description: 'View all campaigns', route: '/admin/management/campaings', category: 'management', icon: <CampaignRoundedIcon fontSize="small" />, keywords: ['campañas', 'marketing', 'blast'] },
  { title: 'Create Campaign', description: 'Launch a new campaign', route: '/admin/management/campaings/create', category: 'actions', icon: <AddCircleOutlineRoundedIcon fontSize="small" />, keywords: ['new campaign', 'crear campaña', 'launch'] },
  { title: 'MMS Generator', description: 'Generate rich media messages', route: '/admin/management/mms', category: 'management', icon: <CampaignRoundedIcon fontSize="small" />, keywords: ['flyers', 'images', 'media'] },
  { title: 'Send Test Message', description: 'Test a campaign before launch', route: '/admin/management/campaings/send-test', category: 'actions', icon: <CampaignRoundedIcon fontSize="small" />, keywords: ['test', 'preview', 'prueba'] },
  { title: 'Sweepstakes', description: 'Manage sweepstakes & prizes', route: '/admin/management/sweepstakes', category: 'management', icon: <RedeemRoundedIcon fontSize="small" />, keywords: ['sorteos', 'prizes', 'premios', 'rewards'] },
  { title: 'Users', description: 'Manage team members', route: '/admin/management/users-listing', category: 'management', icon: <PeopleRoundedIcon fontSize="small" />, keywords: ['team', 'users', 'members', 'usuarios'] },
  { title: 'Merchants', description: 'Manage merchant accounts', route: '/admin/management/merchants', category: 'management', icon: <PeopleRoundedIcon fontSize="small" />, keywords: ['comerciantes', 'vendors'] },
  { title: 'Promoters', description: 'Manage promoter staff', route: '/admin/management/promotors', category: 'management', icon: <PeopleRoundedIcon fontSize="small" />, keywords: ['impulsadoras', 'promotoras', 'staff'] },
  { title: 'Contracts', description: 'Store contracts & agreements', route: '/admin/management/stores/contracts', category: 'management', icon: <DescriptionRoundedIcon fontSize="small" />, keywords: ['contratos', 'legal'] },
  { title: 'Circulars', description: 'Manage store circulars', route: '/admin/management/circulars/manage', category: 'management', icon: <DescriptionRoundedIcon fontSize="small" />, keywords: ['circulares', 'flyers'] },
  { title: 'Ads', description: 'Manage advertisements', route: '/admin/management/ads', category: 'management', icon: <CampaignRoundedIcon fontSize="small" />, keywords: ['promos', 'advertisements', 'anuncios'] },

  // ─── Tools
  { title: 'Projects Board', description: 'Kanban board for team tasks', route: '/admin/applications/projects-board', category: 'tools', icon: <ViewKanbanRoundedIcon fontSize="small" />, keywords: ['kanban', 'board', 'projects', 'jira', 'tablero'] },
  { title: 'Tasks', description: 'View & manage all tasks', route: '/admin/applications/tasks', category: 'tools', icon: <AssignmentRoundedIcon fontSize="small" />, keywords: ['tareas', 'todo', 'assignments'] },
  { title: 'Calendar', description: 'Schedule & appointments', route: '/admin/applications/calendar', category: 'tools', icon: <CalendarMonthRoundedIcon fontSize="small" />, keywords: ['agenda', 'schedule', 'citas'] },
  { title: 'Store Maps', description: 'Geographic store visualization', route: '/admin/applications/maps', category: 'tools', icon: <MapRoundedIcon fontSize="small" />, keywords: ['mapa', 'locations', 'geography'] },
  { title: 'My Account', description: 'Profile, CV upload, settings', route: '/admin/management/account', category: 'tools', icon: <AccountCircleRoundedIcon fontSize="small" />, keywords: ['profile', 'settings', 'account', 'perfil', 'cv'] },
  { title: 'AI Assistant', description: 'Chat with the AI assistant', route: '/admin/applications/ai-assistant', category: 'tools', icon: <SmartToyRoundedIcon fontSize="small" />, keywords: ['chat', 'ai', 'assistant', 'claude'] },
];

const CATEGORY_LABELS: Record<string, string> = {
  navigation: '📊 Dashboards',
  management: '⚙️ Management',
  actions: '⚡ Quick Actions',
  tools: '🛠 Tools & Apps',
};

const CATEGORY_COLORS: Record<string, string> = {
  navigation: '#5569ff',
  management: '#44D600',
  actions: '#FFC400',
  tools: '#33C2FF',
};

/* ─── Simple markdown for AI answers ─── */
function renderSimpleMarkdown(text: string) {
  return text
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
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;

  const filtered = useMemo(() => {
    if (aiMode || !searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [searchTerm, aiMode]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  // Suggested items when no search term
  const suggestions = useMemo(
    () => [
      searchItems.find((i) => i.title === 'Dashboard')!,
      searchItems.find((i) => i.title === 'Campaigns')!,
      searchItems.find((i) => i.title === 'Stores')!,
      searchItems.find((i) => i.title === 'Projects Board')!,
      searchItems.find((i) => i.title === 'Tasks')!,
      searchItems.find((i) => i.title === 'AI Assistant')!,
    ].filter(Boolean),
    []
  );

  const handleNavigate = (route: string) => {
    router.push(route);
    setSearchTerm('');
    setAiResult(null);
    onClose?.();
  };

  const handleAISearch = async () => {
    if (!searchTerm.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await searchWithAI(searchTerm);
      setAiResult(result);
    } catch (err: any) {
      setAiResult({ type: 'answer', answer: `Error: ${err?.message || 'Failed to connect to AI'}` });
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && aiMode) {
      e.preventDefault();
      handleAISearch();
    }
    // Tab toggles AI mode
    if (e.key === 'Tab') {
      e.preventDefault();
      setAiMode((prev) => !prev);
      setAiResult(null);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setAiResult(null);
    setAiMode(false);
    onClose?.();
  };

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
          maxHeight: { xs: 'unset', md: 600 },
          height: { xs: '100%', md: '80%' },
        },
        '.MuiPaper-root': {
          borderRadius: { xs: 0, md: 3 },
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.95) : 'background.paper',
          backdropFilter: 'blur(20px)',
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
          id="search"
          type="text"
          autoComplete="off"
          fullWidth
          placeholder={aiMode ? 'Ask AI: create tasks, find data, navigate...' : 'Search pages, actions, tools...'}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); if (!aiMode) setAiResult(null); }}
          onKeyDown={handleKeyDown}
          startAdornment={
            <InputAdornment position="start">
              {aiMode
                ? <SmartToyRoundedIcon sx={{ color: accent, fontSize: 22 }} />
                : <SearchTwoToneIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              }
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <Stack direction="row" spacing={0.5} alignItems="center">
                {/* AI toggle button */}
                <Tooltip title={aiMode ? 'Switch to Search (Tab)' : 'Switch to AI (Tab)'} arrow>
                  <IconButton
                    size="small"
                    onClick={() => { setAiMode((p) => !p); setAiResult(null); }}
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
                {!searchTerm && (
                  <Chip
                    label="TAB"
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: 10, fontWeight: 700, opacity: 0.4, borderRadius: 1 }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={() => {
                    if (searchTerm) { setSearchTerm(''); setAiResult(null); }
                    else handleClose();
                  }}
                  sx={{ mr: 0.5 }}
                  aria-label="close search"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </InputAdornment>
          }
        />
      </DialogTitle>

      {/* Mode indicator */}
      {aiMode && (
        <Box sx={{ px: 2, py: 0.5, bgcolor: alpha(accent, 0.04), borderBottom: `1px solid ${alpha(accent, 0.1)}` }}>
          <Typography variant="caption" sx={{ color: accent, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            🤖 AI Mode — Ask anything or paste meeting notes to create tasks
          </Typography>
        </Box>
      )}

      <Divider />
      <DialogContent sx={{ overflowX: 'hidden', p: 0 }}>

        {/* ═══ AI MODE ═══ */}
        {aiMode && (
          <>
            {/* Loading state */}
            {aiLoading && (
              <Stack spacing={1.5} p={3} alignItems="center">
                <CircularProgress size={28} sx={{ color: accent }} />
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  Thinking...
                </Typography>
                <Stack spacing={1} width="100%">
                  <Skeleton variant="rounded" height={16} width="80%" />
                  <Skeleton variant="rounded" height={16} width="60%" />
                  <Skeleton variant="rounded" height={16} width="70%" />
                </Stack>
              </Stack>
            )}

            {/* AI Result */}
            {aiResult && !aiLoading && (
              <Box p={2}>
                {/* Answer text */}
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

                {/* Navigation link */}
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
                      '&:hover': { bgcolor: alpha(accent, 0.12), transform: 'translateX(4px)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: accent }}>
                      <OpenInNewRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={aiResult.routeTitle || 'Navigate'}
                      secondary={aiResult.route}
                      primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 700, color: accent }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', fontSize: 11 }}
                    />
                    <ChevronRightTwoToneIcon sx={{ opacity: 0.5, fontSize: 18 }} />
                  </ListItemButton>
                )}

                {/* Action results (created tasks, etc.) */}
                {aiResult.actions?.filter(a => a.result?.success).map((action, i) => (
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
                      bgcolor: alpha('#44D600', 0.06),
                      border: `1px solid ${alpha('#44D600', 0.15)}`,
                      '&:hover': { bgcolor: alpha('#44D600', 0.12) },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TaskAltRoundedIcon sx={{ color: '#44D600', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={action.result?.message || 'Action completed'}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontSize: 12 }}
                    />
                    <CheckCircleOutlineRoundedIcon sx={{ color: '#44D600', fontSize: 16, opacity: 0.7 }} />
                  </ListItemButton>
                ))}

                {/* Token usage */}
                {(aiResult.inputTokens || aiResult.outputTokens) && (
                  <Typography variant="caption" color="text.disabled" fontSize={10} mt={1} display="block" textAlign="right">
                    Tokens: {aiResult.inputTokens} in / {aiResult.outputTokens} out
                  </Typography>
                )}
              </Box>
            )}

            {/* Prompt when no result yet */}
            {!aiResult && !aiLoading && !searchTerm.trim() && (
              <Stack minHeight={120} justifyContent="center" alignItems="center" spacing={1} py={4}>
                <SmartToyRoundedIcon sx={{ fontSize: 36, color: alpha(accent, 0.3) }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600} fontSize={13}>
                  Ask me anything about Sweepstouch
                </Typography>
                <Stack spacing={0.5} alignItems="center">
                  <Typography variant="caption" color="text.disabled" fontSize={11}>
                    "Create a task for Allan to review campaigns"
                  </Typography>
                  <Typography variant="caption" color="text.disabled" fontSize={11}>
                    "How many active stores do we have?"
                  </Typography>
                  <Typography variant="caption" color="text.disabled" fontSize={11}>
                    "Show me Super Supermarket"
                  </Typography>
                </Stack>
              </Stack>
            )}

            {/* Prompt when query typed but not submitted */}
            {!aiResult && !aiLoading && searchTerm.trim() && (
              <Stack minHeight={80} justifyContent="center" alignItems="center" py={3}>
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  Press <strong>Enter</strong> to ask AI
                </Typography>
              </Stack>
            )}
          </>
        )}

        {/* ═══ NORMAL SEARCH MODE ═══ */}
        {!aiMode && (
          <>
            {/* ─── Results ─── */}
            {searchTerm.trim() && filtered.length > 0 && (
              <>
                {Object.entries(grouped).map(([category, items]) => (
                  <List
                    key={category}
                    dense
                    disablePadding
                    subheader={
                      <ListSubheader
                        component="div"
                        sx={{
                          lineHeight: '36px',
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          color: CATEGORY_COLORS[category] || 'text.secondary',
                          bgcolor: 'transparent',
                        }}
                      >
                        {CATEGORY_LABELS[category] || category}
                      </ListSubheader>
                    }
                  >
                    {items.map((item) => (
                      <ListItemButton
                        key={item.route}
                        onClick={() => handleNavigate(item.route)}
                        sx={{
                          py: 1.2,
                          px: 2.5,
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          transition: 'all 0.15s',
                          '&:hover': {
                            bgcolor: alpha(CATEGORY_COLORS[category] || theme.palette.primary.main, 0.08),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: CATEGORY_COLORS[category] || 'primary.main' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          secondary={item.description}
                          primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                        <ChevronRightTwoToneIcon sx={{ opacity: 0.3, fontSize: 18 }} />
                      </ListItemButton>
                    ))}
                  </List>
                ))}
              </>
            )}

            {/* ─── No results ─── */}
            {searchTerm.trim() && filtered.length === 0 && (
              <Stack minHeight={164} justifyContent="center" alignItems="center" spacing={1} py={4}>
                <SearchOffTwoToneIcon sx={{ fontSize: 42, color: 'neutral.400' }} />
                <Typography variant="h6" fontWeight={700}>No results found</Typography>
                <Typography variant="caption" color="text.secondary">
                  Try AI mode (Tab) for smarter search
                </Typography>
              </Stack>
            )}

            {/* ─── Suggestions (no search term) ─── */}
            {!searchTerm.trim() && (
              <List
                dense
                disablePadding
                subheader={
                  <ListSubheader
                    component="div"
                    sx={{
                      lineHeight: '36px',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: 'text.secondary',
                      bgcolor: 'transparent',
                    }}
                  >
                    ⚡ Quick navigation
                  </ListSubheader>
                }
              >
                {suggestions.map((item) => (
                  <ListItemButton
                    key={item.route}
                    onClick={() => handleNavigate(item.route)}
                    sx={{
                      py: 1.2,
                      px: 2.5,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                      primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                    <ChevronRightTwoToneIcon sx={{ opacity: 0.3, fontSize: 18 }} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
