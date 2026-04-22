'use client';

import React, { useState, useEffect } from 'react';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import { useRouter } from 'next/navigation';
import { useCustomization } from 'src/hooks/use-customization';
import toast from 'react-hot-toast';
import {
  getAIConfig,
  updateAIConfig,
  addRule,
  removeRule,
  addRestriction,
  removeRestriction,
  refreshContext,
  previewContext,
  getAdminConversations,
  type AIConfig,
  type Conversation,
} from '@/services/ai.service';
import { formatDistanceToNow } from 'date-fns';

export default function AIConfigPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const router = useRouter();
  const customization = useCustomization();

  const [tab, setTab] = useState(0);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [contextSources, setContextSources] = useState({
    team: true, tasks: true, campaigns: true, stores: true, audience: true,
  });

  // Rules/restrictions input
  const [newRule, setNewRule] = useState('');
  const [newRestriction, setNewRestriction] = useState('');

  // Admin conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convTotal, setConvTotal] = useState(0);

  // Context preview
  const [contextPreview, setContextPreview] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load config
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await getAIConfig();
      setConfig(cfg);
      setSystemPrompt(cfg.systemPrompt || '');
      setTemperature(cfg.temperature || 0.7);
      setMaxTokens(cfg.maxTokens || 4096);
      setContextSources(cfg.contextSources || { team: true, tasks: true, campaigns: true, stores: true, audience: true });
    } catch (err) {
      console.error('Failed to load config:', err);
      toast.error('Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  // Save config
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAIConfig({ systemPrompt, temperature, maxTokens, contextSources });
      toast.success('Configuration saved!');
      loadConfig();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Rules
  const handleAddRule = async () => {
    if (!newRule.trim()) return;
    await addRule(newRule.trim());
    setNewRule('');
    loadConfig();
    toast.success('Rule added');
  };

  const handleRemoveRule = async (index: number) => {
    await removeRule(index);
    loadConfig();
    toast.success('Rule removed');
  };

  // Restrictions
  const handleAddRestriction = async () => {
    if (!newRestriction.trim()) return;
    await addRestriction(newRestriction.trim());
    setNewRestriction('');
    loadConfig();
    toast.success('Restriction added');
  };

  const handleRemoveRestriction = async (index: number) => {
    await removeRestriction(index);
    loadConfig();
    toast.success('Restriction removed');
  };

  // Load conversations for admin tab
  const loadConversations = async () => {
    try {
      const data = await getAdminConversations();
      setConversations(data.data || []);
      setConvTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Context preview
  const handlePreviewContext = async () => {
    setLoadingPreview(true);
    try {
      const data = await previewContext();
      setContextPreview(data.context || 'No context available');
    } catch {
      toast.error('Failed to load context preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRefreshContext = async () => {
    try {
      const data = await refreshContext();
      toast.success(`Context refreshed! (${data.length} chars)`);
    } catch {
      toast.error('Failed to refresh context');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  const cardSx = {
    borderRadius: 2.5,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, isDark ? 0.2 : 0.04)}`,
  };

  return (
    <Box
      sx={{
        flex: 1, overflow: 'auto',
        bgcolor: isDark ? alpha(theme.palette.common.black, 0.2) : alpha(theme.palette.common.black, 0.015),
        py: 3,
      }}
    >
      <Container maxWidth={customization.stretch ? false : 'lg'}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              size="small"
              startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 14 }} />}
              onClick={() => router.push('/admin/applications/ai-assistant')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, color: 'text.secondary', borderRadius: 1.5 }}
            >
              Back to Chat
            </Button>
            <Divider orientation="vertical" flexItem />
            <SmartToyRoundedIcon sx={{ color: accent, fontSize: 24 }} />
            <Typography variant="h5" fontWeight={700}>AI Configuration</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleRefreshContext}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: 12 }}
            >
              Refresh Context
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={saving ? <CircularProgress size={14} /> : <SaveRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: 12,
              }}
            >
              Save Changes
            </Button>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            if (v === 3) loadConversations();
            if (v === 4) handlePreviewContext();
          }}
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 } }}
        >
          <Tab icon={<TuneRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="General" />
          <Tab icon={<RuleRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Rules" />
          <Tab icon={<BlockRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Restrictions" />
          <Tab icon={<PeopleRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Conversations" />
          <Tab icon={<PreviewRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Context Preview" />
        </Tabs>

        {/* Tab 0: General */}
        {tab === 0 && (
          <Stack spacing={3}>
            {/* System Prompt */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>System Prompt</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  This is the base instruction given to Claude before every conversation. It defines the AI's personality, behavior, and scope.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  maxRows={20}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13, fontFamily: 'monospace' },
                  }}
                />
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Model Parameters</Typography>

                <Stack spacing={3}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600}>Temperature</Typography>
                      <Chip label={temperature.toFixed(2)} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Lower = more focused/deterministic. Higher = more creative/random.
                    </Typography>
                    <Slider
                      value={temperature}
                      onChange={(_, v) => setTemperature(v as number)}
                      min={0} max={1} step={0.05}
                      sx={{ color: accent }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600}>Max Tokens</Typography>
                      <Chip label={maxTokens} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Maximum length of AI response. Higher = longer responses allowed.
                    </Typography>
                    <Slider
                      value={maxTokens}
                      onChange={(_, v) => setMaxTokens(v as number)}
                      min={256} max={8192} step={256}
                      sx={{ color: accent }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Context Sources */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Context Sources</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Toggle which data sources are included in the AI's context. Disabling sources reduces token usage.
                </Typography>

                {Object.entries(contextSources).map(([key, enabled]) => (
                  <Stack key={key} direction="row" alignItems="center" justifyContent="space-between" py={0.5}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} textTransform="capitalize">{key}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {key === 'team' && 'Team member profiles, roles, departments, CVs'}
                        {key === 'tasks' && 'Projects, task boards, assignments, status'}
                        {key === 'campaigns' && 'Active and past campaigns, brands'}
                        {key === 'stores' && 'Store locations, brands, customers'}
                        {key === 'audience' && 'Tracking metrics, scan counts'}
                      </Typography>
                    </Box>
                    <Switch
                      checked={enabled}
                      color="primary"
                      onChange={(e) => setContextSources({ ...contextSources, [key]: e.target.checked })}
                    />
                  </Stack>
                ))}
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Tab 1: Rules */}
        {tab === 1 && (
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Active Rules</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Rules are instructions that Claude must follow. They are included in every conversation.
              </Typography>

              <Stack direction="row" spacing={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a new rule..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddRule(); }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleAddRule}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                >
                  Add
                </Button>
              </Stack>

              <List>
                {config?.rules?.map((rule, i) => (
                  <ListItem
                    key={i}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveRule(i)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{ bgcolor: alpha(accent, 0.04), borderRadius: 1.5, mb: 0.75 }}
                  >
                    <ListItemText
                      primary={`${i + 1}. ${rule.text}`}
                      primaryTypographyProps={{ fontSize: 13 }}
                    />
                  </ListItem>
                ))}
                {(!config?.rules || config.rules.length === 0) && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No rules configured yet
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Restrictions */}
        {tab === 2 && (
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Restrictions</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Things Claude should NOT do. These are enforced as "DO NOT" instructions.
              </Typography>

              <Stack direction="row" spacing={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a restriction..."
                  value={newRestriction}
                  onChange={(e) => setNewRestriction(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddRestriction(); }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleAddRestriction}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
                >
                  Add
                </Button>
              </Stack>

              <List>
                {config?.restrictions?.map((r, i) => (
                  <ListItem
                    key={i}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveRestriction(i)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{ bgcolor: alpha(theme.palette.error.main, 0.04), borderRadius: 1.5, mb: 0.75 }}
                  >
                    <ListItemText
                      primary={`${i + 1}. ${r.text}`}
                      primaryTypographyProps={{ fontSize: 13 }}
                    />
                  </ListItem>
                ))}
                {(!config?.restrictions || config.restrictions.length === 0) && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No restrictions configured yet
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Conversations (Admin) */}
        {tab === 3 && (
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  All Conversations ({convTotal})
                </Typography>
              </Stack>

              <List>
                {conversations.map((conv) => (
                  <ListItem
                    key={conv._id}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      borderRadius: 1.5, mb: 0.75,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                    }}
                    onClick={() => router.push(`/admin/applications/ai-assistant?conv=${conv._id}`)}
                  >
                    <ListItemText
                      primary={conv.title}
                      secondary={`${conv.userName} (${conv.userRole}) • ${formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })} • ${conv.totalTokens} tokens`}
                      primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItem>
                ))}
                {conversations.length === 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No conversations found
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Context Preview */}
        {tab === 4 && (
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={700}>Context Preview</Typography>
                <Button
                  size="small"
                  startIcon={<RefreshRoundedIcon sx={{ fontSize: 14 }} />}
                  onClick={handlePreviewContext}
                  sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600 }}
                >
                  Reload
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                This is the live context data that Claude receives. It includes data from all enabled sources.
              </Typography>

              {loadingPreview ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    maxHeight: 600,
                    overflow: 'auto',
                    bgcolor: isDark ? alpha(theme.palette.common.black, 0.3) : alpha(theme.palette.common.black, 0.03),
                    fontFamily: 'monospace',
                    fontSize: 11.5,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                  }}
                >
                  {contextPreview || 'Click "Reload" to load context preview'}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
