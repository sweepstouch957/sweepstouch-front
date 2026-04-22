'use client';

import {
  useState,
  useMemo,
} from 'react';
import {
  alpha,
  Autocomplete,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import GridViewTwoToneIcon from '@mui/icons-material/GridViewTwoTone';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import TableRowsTwoToneIcon from '@mui/icons-material/TableRowsTwoTone';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import CheckTwoToneIcon from '@mui/icons-material/CheckTwoTone';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { taskClient, type Project, type WorkflowStatus } from '@/services/task.service';
import { useCustomization } from 'src/hooks/use-customization';
import { LinearProgressSlim } from 'src/components/base/styles/progress-bar';
import { CardWrapper } from 'src/components/application-ui/tables/users/results';
import { usersApi } from '@/mocks/users';

/* ─── Constants ─── */

const STATUS_MAP: Record<WorkflowStatus, { label: string; color: 'error' | 'info' | 'success' | 'warning' | 'default' }> = {
  not_started: { label: 'Not started', color: 'error' },
  in_progress:  { label: 'In progress',  color: 'info'    },
  completed:    { label: 'Completed',    color: 'success' },
};

const PROJECT_COLORS = ['#5569ff','#E91E63','#FF9800','#4CAF50','#9C27B0','#00BCD4','#F44336','#795548','#607D8B'];

const statusOptions: { id: WorkflowStatus; name: string }[] = [
  { id: 'not_started', name: 'Not started' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed',   name: 'Completed'   },
];

const EMPTY_FORM = {
  name: '', description: '', color: '#5569ff', tags: '',
  workflowStatus: 'not_started' as WorkflowStatus,
  startDate: '', dueDate: '',
};

/* ─── Sub-components ─── */

function StatusChip({ status }: { status: WorkflowStatus }) {
  const { label, color } = STATUS_MAP[status] || STATUS_MAP.not_started;
  return (
    <Chip
      size="small" variant="outlined" label={label} color={color}
      sx={{ borderRadius: (t) => t.shape.borderRadius, fontWeight: 600, fontSize: 11 }}
    />
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const theme = useTheme();
  return (
    <Stack direction="row" gap={0.75} flexWrap="wrap">
      {PROJECT_COLORS.map((c) => (
        <Box
          key={c}
          onClick={() => onChange(c)}
          sx={{
            width: 28, height: 28, borderRadius: 1.5, bgcolor: c, cursor: 'pointer',
            border: value === c ? `3px solid ${theme.palette.background.paper}` : '3px solid transparent',
            boxShadow: value === c ? `0 0 0 2px ${c}` : 'none',
            transition: 'all 0.15s', '&:hover': { transform: 'scale(1.12)' },
          }}
        />
      ))}
    </Stack>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  EDIT PROJECT DRAWER                                               */
/* ══════════════════════════════════════════════════════════════════ */

function EditProjectDrawer({
  open,
  project,
  allUsers,
  onClose,
  onSave,
  onDelete,
  isSaving,
}: {
  open: boolean;
  project: Project | null;
  allUsers: any[];
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  /* sync form when project changes */
  useMemo(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#5569ff',
        tags: (project.tags || []).join(', '),
        workflowStatus: project.workflowStatus || 'not_started',
        startDate: project.startDate ? project.startDate.slice(0, 10) : '',
        dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
      });
      setMemberIds(project.memberIds || []);
    }
  }, [project]);

  const teamMembers = useMemo(() => {
    const excluded = ['merchant', 'cashier', 'promotor'];
    return allUsers.filter((u: any) => !excluded.includes(u.role));
  }, [allUsers]);

  const memberObjects = useMemo(
    () => teamMembers.filter((u: any) => memberIds.includes(u.id || u._id)),
    [teamMembers, memberIds]
  );

  const nonMembers = useMemo(
    () => teamMembers.filter((u: any) => !memberIds.includes(u.id || u._id)),
    [teamMembers, memberIds]
  );

  function addMember(user: any) {
    setMemberIds((prev) => [...prev, user.id || user._id]);
  }
  function removeMember(userId: string) {
    setMemberIds((prev) => prev.filter((id) => id !== userId));
  }

  function handleSave() {
    if (!project) return;
    onSave(project._id, {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      memberIds,
    });
  }

  const isOverdue = project?.dueDate && isPast(new Date(project.dueDate)) && project.workflowStatus !== 'completed';

  if (!project) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 480 },
          bgcolor: isDark ? theme.palette.neutral[900] : 'common.white',
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3, py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: project.color || '#5569ff', flexShrink: 0 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Edit Project
            </Typography>
            {project.identifier && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 11 }}>
                {project.identifier}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
        <Stack spacing={2.5}>

          {/* Section: Basic info */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>
              Project Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Project Name *" fullWidth autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label="Description" fullWidth multiline rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this project about?"
              />
              <TextField
                label="Tags" fullWidth
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="design, frontend, backend"
                helperText="Separate with commas"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Section: Status + Color */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>
              Status & Color
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Workflow Status" select fullWidth
                value={form.workflowStatus}
                onChange={(e) => setForm({ ...form, workflowStatus: e.target.value as WorkflowStatus })}
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: STATUS_MAP[opt.id].color === 'error' ? 'error.main'
                          : STATUS_MAP[opt.id].color === 'info' ? 'info.main' : 'success.main',
                      }} />
                      <span>{opt.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">
                  Project Color
                </Typography>
                <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Section: Dates */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                Timeline
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Start Date" type="date" fullWidth
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Due Date" type="date" fullWidth
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!!isOverdue}
                helperText={isOverdue ? 'Overdue' : undefined}
              />
            </Stack>
            {/* Progress readout */}
            {project.taskStats && (
              <Box mt={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Task progress</Typography>
                  <Typography variant="caption" fontWeight={700} color={(project.progress ?? 0) >= 100 ? 'success.main' : 'primary.main'}>
                    {project.progress ?? 0}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={project.progress ?? 0}
                  color={(project.progress ?? 0) >= 100 ? 'success' : (project.progress ?? 0) >= 50 ? 'primary' : 'warning'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                  {project.taskStats.done} of {project.taskStats.total} tasks done
                  {project.taskStats.in_progress > 0 && ` · ${project.taskStats.in_progress} in progress`}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Section: Members */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <GroupRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                Team Members
              </Typography>
              <Chip label={memberIds.length} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
            </Stack>

            {/* Add member autocomplete */}
            {nonMembers.length > 0 && (
              <Autocomplete
                size="small"
                options={nonMembers}
                getOptionLabel={(u: any) => `${u.firstName} ${u.lastName || ''}`.trim()}
                onChange={(_, v: any) => v && addMember(v)}
                value={null}
                renderOption={(props, u: any) => (
                  <li {...props}>
                    <Avatar src={u.profileImage} sx={{ width: 26, height: 26, mr: 1, fontSize: 10 }}>
                      {u.firstName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName || ''}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.role}</Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Add team member…"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <InputAdornment position="start"><PersonAddRoundedIcon sx={{ fontSize: 16, opacity: 0.4 }} /></InputAdornment>,
                    }}
                  />
                )}
                sx={{ mb: 1.5 }}
              />
            )}

            {/* Current members list */}
            {memberObjects.length === 0 ? (
              <Box
                sx={{
                  p: 2, borderRadius: 2, textAlign: 'center',
                  border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.common.black, isDark ? 0 : 0.01),
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  No members yet. Add someone above.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0.75}>
                {memberObjects.map((u: any) => {
                  const uid = u.id || u._id;
                  return (
                    <Stack
                      key={uid}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 1.5, py: 0.75,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.25}>
                        <Avatar src={u.profileImage} sx={{ width: 34, height: 34, fontSize: 12 }}>
                          {u.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                            {u.firstName} {u.lastName || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize={11}>
                            {u.role || u.email || ''}
                          </Typography>
                        </Box>
                      </Stack>
                      <Tooltip title="Remove from project" arrow>
                        <IconButton
                          size="small"
                          onClick={() => removeMember(uid)}
                          sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                        >
                          <PersonRemoveRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Danger zone */}
          <Divider />
          <Box>
            <Typography variant="overline" color="error" fontWeight={700} sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>
              Danger Zone
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteTwoToneIcon />}
              onClick={() => { onDelete(project._id); onClose(); }}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Delete this project
            </Button>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
              This will permanently delete the project and all its tasks.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Footer actions ── */}
      <Box
        sx={{
          px: 3, py: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1,
        }}
      >
        <Button onClick={onClose} sx={{ borderRadius: 1.5, textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!form.name || isSaving}
          onClick={handleSave}
          sx={{
            fontWeight: 700, borderRadius: 1.5, textTransform: 'none',
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          }}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    </Drawer>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                          */
/* ══════════════════════════════════════════════════════════════════ */

export default function ProjectsBoardPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';

  /* ── UI state ── */
  const [toggleView, setToggleView] = useState<string | null>('grid_view');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(9);

  /* ── Dialogs ── */
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(EMPTY_FORM);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  /* ── Edit drawer ── */
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  /* ── Queries ── */
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => taskClient.getProjects(),
    staleTime: 30_000,
  });

  const { data: aiContext } = useQuery({
    queryKey: ['ai-context'],
    queryFn: () => taskClient.getAiContext(),
    enabled: aiDialogOpen,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 120_000,
  });

  /* ── Mutations ── */
  const createProjectMut = useMutation({
    mutationFn: (p: any) => taskClient.createProject(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewProjectOpen(false);
      setProjectForm(EMPTY_FORM);
      toast.success('Project created');
    },
  });

  const updateProjectMut = useMutation({
    mutationFn: ({ id, ...data }: any) => taskClient.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
      toast.success('Project updated');
    },
  });

  const deleteProjectMut = useMutation({
    mutationFn: (id: string) => taskClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
  });

  /* ── Filter + paginate ── */
  const filtered = useMemo(() => {
    let result = projects;
    if (query) result = result.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase()));
    if (statusFilter) result = result.filter((p) => p.workflowStatus === statusFilter);
    return result;
  }, [projects, query, statusFilter]);

  const paginated = filtered.slice(page * limit, page * limit + limit);

  const getStatusName = () => statusFilter
    ? statusOptions.find((o) => o.id === statusFilter)?.name ?? 'All'
    : 'All';

  function handleOpenBoard(projectId: string) {
    router.push(`/admin/applications/tasks?projectId=${projectId}`);
  }

  /* ── Summary stats ── */
  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.workflowStatus === 'in_progress').length,
    completed: projects.filter((p) => p.workflowStatus === 'completed').length,
    totalTasks: projects.reduce((acc, p) => acc + (p.taskStats?.total ?? 0), 0),
  }), [projects]);

  return (
    <Box
      display="flex" flex={1} flexDirection="column"
      sx={{ bgcolor: isDark ? alpha(theme.palette.neutral[25], 0.02) : 'neutral.25' }}
      p={{ xs: 2, sm: 3 }}
    >
      {/* ── Page heading ── */}
      <Container sx={{ mb: { xs: 2, sm: 3 } }} disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Projects</Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of all projects — progress, status, team members
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined" color="warning" size="small"
              startIcon={<SmartToyRoundedIcon />}
              onClick={() => setAiDialogOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              AI Context
            </Button>
            <Button
              variant="contained" size="small" disableElevation
              startIcon={<AddRoundedIcon />}
              onClick={() => setNewProjectOpen(true)}
              sx={{
                borderRadius: 2, textTransform: 'none', fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              }}
            >
              New Project
            </Button>
          </Stack>
        </Stack>
      </Container>

      {/* ── Stats row ── */}
      {projects.length > 0 && (
        <Container disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'} sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {[
              { label: 'Total projects', value: stats.total,     color: theme.palette.primary.main   },
              { label: 'In progress',    value: stats.active,    color: theme.palette.info.main       },
              { label: 'Completed',      value: stats.completed, color: theme.palette.success.main    },
              { label: 'Total tasks',    value: stats.totalTasks, color: theme.palette.warning.main   },
            ].map((s) => (
              <Box
                key={s.label}
                sx={{
                  px: 2, py: 1.25, borderRadius: 2,
                  border: `1px solid ${alpha(s.color, 0.2)}`,
                  bgcolor: alpha(s.color, 0.05),
                  minWidth: 120,
                }}
              >
                <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      )}

      <Container disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'}>
        {/* ── Toolbar ── */}
        <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" pb={2} gap={1.5}>
          <TextField
            fullWidth={!mdUp}
            margin="none" size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchTwoToneIcon /></InputAdornment>,
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')} edge="end">
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder={t('Search projects...')}
            value={query}
            sx={{ maxWidth: { md: 300 } }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            {(query || statusFilter) && (
              <Link href="" variant="body2" underline="hover" sx={{ alignSelf: 'center', px: 0.5 }}
                onClick={(e) => { e.preventDefault(); setQuery(''); setStatusFilter(null); }}
              >
                Clear
              </Link>
            )}

            <Button
              variant="outlined" color="secondary" size="small"
              endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
              onClick={(e) => setStatusAnchorEl(e.currentTarget)}
            >
              <Typography component="span" color="text.secondary" fontWeight={500} sx={{ pr: 0.5, display: { xs: 'none', sm: 'inline-flex' } }}>
                Status:
              </Typography>{' '}{getStatusName()}
            </Button>
            <Menu
              anchorEl={statusAnchorEl} keepMounted
              open={Boolean(statusAnchorEl)}
              onClose={() => setStatusAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                sx={{ borderRadius: (t) => `${t.shape.borderRadius}px` }}
                onClick={() => { setStatusFilter(null); setStatusAnchorEl(null); setPage(0); }}
                selected={!statusFilter}
              >
                <ListItemText primary="All" primaryTypographyProps={{ fontWeight: 600 }} />
                {!statusFilter && <CheckTwoToneIcon color="primary" sx={{ ml: 2 }} />}
              </MenuItem>
              {statusOptions.map((opt) => (
                <MenuItem
                  key={opt.id}
                  sx={{ borderRadius: (t) => `${t.shape.borderRadius}px` }}
                  onClick={() => { setStatusFilter(opt.id); setStatusAnchorEl(null); setPage(0); }}
                  selected={statusFilter === opt.id}
                >
                  <ListItemText primary={opt.name} primaryTypographyProps={{ fontWeight: 600 }} />
                  {statusFilter === opt.id && <CheckTwoToneIcon color="primary" sx={{ ml: 2 }} />}
                </MenuItem>
              ))}
            </Menu>

            <ToggleButtonGroup color="primary" value={toggleView} exclusive onChange={(_, v) => v && setToggleView(v)}>
              <ToggleButton value="table_view"><TableRowsTwoToneIcon /></ToggleButton>
              <ToggleButton value="grid_view"><GridViewTwoToneIcon /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        {/* ── Loading ── */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        )}

        {/* ── Empty ── */}
        {!isLoading && filtered.length === 0 && (
          <Box textAlign="center" py={8}>
            <ViewKanbanRoundedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h5" color="text.secondary" fontWeight={500}>
              {query || statusFilter ? 'No projects match your search' : 'No projects yet'}
            </Typography>
            {!query && !statusFilter && (
              <Button variant="contained" size="small" startIcon={<AddRoundedIcon />}
                onClick={() => setNewProjectOpen(true)}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }} disableElevation
              >
                Create your first project
              </Button>
            )}
          </Box>
        )}

        {/* ══ TABLE VIEW ══ */}
        {!isLoading && filtered.length > 0 && toggleView === 'table_view' && (
          <>
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Tags</TableCell>
                      <TableCell>Members</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((project) => (
                      <TableRow hover key={project._id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: project.color || '#5569ff', flexShrink: 0 }} />
                            <Box>
                              <Typography noWrap variant="h6" fontWeight={600} sx={{ maxWidth: 180 }}>{project.name}</Typography>
                              {project.description && (
                                <Typography color="text.secondary" noWrap sx={{ maxWidth: 180, fontSize: 12 }}>{project.description}</Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {project.identifier ? (
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: alpha(project.color || theme.palette.primary.main, 0.1), color: project.color || 'primary.main', px: 0.75, py: 0.3, borderRadius: 1 }}>
                              {project.identifier}
                            </Typography>
                          ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" flexWrap="wrap" gap={0.4}>
                            {(project.tags || []).slice(0, 3).map((tag) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {(project.members || []).length > 0 ? (
                            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11 } }}>
                              {(project.members || []).map((m) => (
                                <Tooltip key={m.id} title={m.name} arrow placement="top">
                                  <Avatar src={m.avatar || undefined} sx={{ width: 28, height: 28 }}>{m.name.charAt(0)}</Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          ) : (
                            <Typography variant="caption" color="text.disabled">No members</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 130 }} display="flex" alignItems="center" gap={1}>
                            <LinearProgressSlim
                              sx={{ flex: 1 }}
                              value={project.progress ?? 0}
                              color={(project.progress ?? 0) >= 100 ? 'success' : (project.progress ?? 0) >= 50 ? 'primary' : 'warning'}
                              variant="determinate"
                            />
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 36, color: 'text.secondary' }}>
                              {project.progress ?? 0}%
                            </Typography>
                          </Box>
                          {project.taskStats && (
                            <Typography variant="caption" color="text.disabled">
                              {project.taskStats.done}/{project.taskStats.total} done
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={project.workflowStatus || 'not_started'} />
                        </TableCell>
                        <TableCell>
                          {project.dueDate ? (
                            <>
                              <Typography variant="body2" color="text.primary" noWrap>
                                {format(new Date(project.dueDate), 'dd MMM yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Edit project" arrow>
                            <IconButton size="small" onClick={() => setEditingProject(project)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open board" arrow>
                            <IconButton size="small" color="primary" onClick={() => handleOpenBoard(project._id)}>
                              <ViewKanbanRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete" arrow>
                            <IconButton size="small" color="error" onClick={() => deleteProjectMut.mutate(project._id)}>
                              <DeleteTwoToneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
            <Box pt={2}>
              <TablePagination
                component="div" count={filtered.length}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value)); setPage(0); }}
                page={page} rowsPerPage={limit} rowsPerPageOptions={[6, 9, 15]}
                slotProps={{ select: { variant: 'outlined', size: 'small' } }}
              />
            </Box>
          </>
        )}

        {/* ══ GRID VIEW ══ */}
        {!isLoading && filtered.length > 0 && toggleView === 'grid_view' && (
          <>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {paginated.map((project) => (
                <Grid xs={12} md={6} lg={4} key={project._id}>
                  <CardWrapper elevation={0} sx={{ position: 'relative', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}` } }}>
                    <Box position="relative" zIndex={2}>
                      {/* Card header */}
                      <Box pl={2} py={1.25} pr={1.5} display="flex" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: project.color || '#5569ff', flexShrink: 0 }} />
                          <Stack direction="row" flexWrap="wrap" gap={0.4} alignItems="center">
                            {project.identifier && (
                              <Typography
                                variant="caption"
                                sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10, color: project.color || 'primary.main', opacity: 0.8 }}
                              >
                                {project.identifier}
                              </Typography>
                            )}
                            {(project.tags || []).slice(0, 2).map((tag) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: 9 }} />
                            ))}
                          </Stack>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.25}>
                          <StatusChip status={project.workflowStatus || 'not_started'} />
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Card body */}
                      <Box p={2} pb={1}>
                        <Typography noWrap gutterBottom variant="h5" fontWeight={700} lineHeight={1.3}>
                          {project.name}
                        </Typography>
                        <Typography
                          color="text.secondary" variant="body2"
                          sx={{
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            display: '-webkit-box', overflow: 'hidden',
                            whiteSpace: 'initial', minHeight: 38, fontSize: 12.5,
                          }}
                        >
                          {project.description || 'No description'}
                        </Typography>
                      </Box>

                      {/* Dates */}
                      <Box px={2} pb={1.5} display="flex" alignItems="flex-start" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>STARTED</Typography>
                          <Typography variant="subtitle2" fontWeight={600} fontSize={12}>
                            {project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : '—'}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>DUE</Typography>
                          <Typography
                            variant="subtitle2" fontWeight={600} fontSize={12}
                            sx={{ color: (project.dueDate && isPast(new Date(project.dueDate)) && project.workflowStatus !== 'completed') ? 'error.main' : 'text.primary' }}
                          >
                            {project.dueDate ? format(new Date(project.dueDate), 'MMM dd, yyyy') : '—'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress */}
                      <Box px={2} pb={1.5}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" fontSize={10}>
                            Progress
                          </Typography>
                          <Typography
                            variant="body2" fontWeight={700}
                            sx={{ color: (project.progress ?? 0) >= 100 ? 'success.main' : 'primary.main' }}
                          >
                            {project.progress ?? 0}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          value={project.progress ?? 0}
                          color={(project.progress ?? 0) >= 100 ? 'success' : (project.progress ?? 0) >= 50 ? 'primary' : 'warning'}
                          variant="determinate"
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        {project.taskStats && (
                          <Typography variant="caption" color="text.disabled" mt={0.5} display="block" fontSize={11}>
                            {project.taskStats.done} of {project.taskStats.total} tasks completed
                            {project.taskStats.in_progress > 0 && ` · ${project.taskStats.in_progress} in progress`}
                          </Typography>
                        )}
                      </Box>

                      <Divider />

                      {/* Footer */}
                      <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
                        {(project.members || []).length > 0 ? (
                          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11 } }}>
                            {(project.members || []).map((m) => (
                              <Tooltip key={m.id} title={m.name} arrow placement="top">
                                <Avatar src={m.avatar || undefined} sx={{ width: 28, height: 28 }}>{m.name.charAt(0)}</Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontSize={11}>
                            No members
                          </Typography>
                        )}

                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit project" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setEditingProject(project)}
                              sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.3)}`, borderRadius: 1.5 }}
                            >
                              <EditRoundedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small" variant="contained" disableElevation
                            startIcon={<ViewKanbanRoundedIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenBoard(project._id)}
                            sx={{
                              textTransform: 'none', fontWeight: 700, fontSize: 12, borderRadius: 1.5,
                              background: `linear-gradient(135deg, ${project.color || theme.palette.primary.dark} 0%, ${alpha(project.color || theme.palette.primary.main, 0.8)} 100%)`,
                            }}
                          >
                            Board
                          </Button>
                        </Stack>
                      </Box>
                    </Box>
                  </CardWrapper>
                </Grid>
              ))}
            </Grid>

            <Box pt={2}>
              <TablePagination
                component="div" count={filtered.length}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value)); setPage(0); }}
                page={page} rowsPerPage={limit} rowsPerPageOptions={[6, 9, 15]}
                slotProps={{ select: { variant: 'outlined', size: 'small' } }}
              />
            </Box>
          </>
        )}
      </Container>

      {/* ══ EDIT DRAWER ══ */}
      <EditProjectDrawer
        open={!!editingProject}
        project={editingProject}
        allUsers={allUsers}
        onClose={() => setEditingProject(null)}
        onSave={(id, data) => updateProjectMut.mutate({ id, ...data })}
        onDelete={(id) => deleteProjectMut.mutate(id)}
        isSaving={updateProjectMut.isPending}
      />

      {/* ══ NEW PROJECT DIALOG ══ */}
      <Dialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New Project</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} pt={1}>
            <TextField label="Project Name *" fullWidth autoFocus value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            />
            <TextField label="Description" fullWidth multiline rows={2} value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            />
            <TextField label="Tags (comma-separated)" fullWidth value={projectForm.tags}
              onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
              placeholder="design, frontend, api"
            />
            <TextField label="Status" select fullWidth value={projectForm.workflowStatus}
              onChange={(e) => setProjectForm({ ...projectForm, workflowStatus: e.target.value as WorkflowStatus })}
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="Start Date" type="date" fullWidth value={projectForm.startDate}
                onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField label="Due Date" type="date" fullWidth value={projectForm.dueDate}
                onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">Color</Typography>
              <ColorPicker value={projectForm.color} onChange={(c) => setProjectForm({ ...projectForm, color: c })} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewProjectOpen(false)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" disableElevation
            onClick={() => createProjectMut.mutate({
              ...projectForm,
              tags: projectForm.tags ? projectForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
              startDate: projectForm.startDate || undefined,
              dueDate: projectForm.dueDate || undefined,
            })}
            disabled={!projectForm.name || createProjectMut.isPending}
            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)` }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ AI CONTEXT DIALOG ══ */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SmartToyRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>AI Training Context</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Copy this context to ChatGPT, Claude, or any AI assistant to get help with your team's projects and tasks.
          </Typography>
          {aiContext ? (
            <>
              <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap" gap={0.5}>
                <Chip label={`${aiContext.stats.projects} Projects`} color="primary" size="small" />
                <Chip label={`${aiContext.stats.tasks} Tasks`} color="info" size="small" />
                <Chip label={`${aiContext.stats.byStatus?.done || 0} Done`} color="success" size="small" />
                <Chip label={`${aiContext.stats.byStatus?.in_progress || 0} Active`} color="warning" size="small" />
              </Stack>
              <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto', bgcolor: isDark ? 'neutral.900' : 'neutral.50', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.8, whiteSpace: 'pre-wrap', borderRadius: 2 }}>
                {aiContext.context}
              </Box>
            </>
          ) : (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAiDialogOpen(false)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>Close</Button>
          <Button variant="contained" disableElevation startIcon={<ContentCopyRoundedIcon />}
            onClick={() => { if (aiContext?.context) { navigator.clipboard.writeText(aiContext.context); toast.success('Copied!'); } }}
            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
          >
            Copy Context
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
