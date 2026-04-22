'use client';

import React, { useMemo, useState, useCallback, forwardRef } from 'react';
import {
  alpha,
  Autocomplete,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  lighten,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SubdirectoryArrowRightRoundedIcon from '@mui/icons-material/SubdirectoryArrowRightRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistance, format, isAfter } from 'date-fns';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { taskClient, Task, Project, type BoardData } from '@/services/task.service';
import { departmentService, Department } from '@/services/department.service';
import { usersApi } from '@/mocks/users';
import { useCustomization } from 'src/hooks/use-customization';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

/* ──────────────────────────── Constants ──────────────────────────── */

const PRIORITY_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  critical: { color: '#FF1744', label: 'Critical', icon: '🔴' },
  high: { color: '#FF6D00', label: 'High', icon: '🟠' },
  medium: { color: '#FFB300', label: 'Medium', icon: '🟡' },
  low: { color: '#00C853', label: 'Low', icon: '🟢' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  backlog: { label: 'Backlog', color: '#78909C', bg: 'rgba(120,144,156,0.08)' },
  todo: { label: 'To Do', color: '#42A5F5', bg: 'rgba(66,165,245,0.08)' },
  in_progress: { label: 'In Progress', color: '#FFA726', bg: 'rgba(255,167,38,0.08)' },
  in_review: { label: 'In Review', color: '#AB47BC', bg: 'rgba(171,71,188,0.08)' },
  done: { label: 'Done', color: '#66BB6A', bg: 'rgba(102,187,106,0.08)' },
};

const cbIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const cbChecked = <CheckBoxIcon fontSize="small" />;
const PROJECT_COLORS = ['#5569ff', '#E91E63', '#FF9800', '#4CAF50', '#9C27B0', '#00BCD4', '#F44336', '#795548'];

/* ── Physics-based tilt hook (Google Maps pegman style) ── */
function useDragTiltDom(dragging?: boolean, transformStr?: string) {
  const paperRef = React.useRef<HTMLDivElement>(null);
  const tiltRef = React.useRef(0);
  const targetTiltRef = React.useRef(0);
  const lastX = React.useRef<number | null>(null);
  const lastTime = React.useRef<number | null>(null);
  const rafId = React.useRef<number | null>(null);

  const tiltVelocityRef = React.useRef(0); // For spring physics

  React.useEffect(() => {
    if (!dragging || !transformStr) {
      targetTiltRef.current = 0;
      lastX.current = null;
      return;
    }
    const match = transformStr.match(/translate\(([^,]+)px/);
    if (match) {
      const x = parseFloat(match[1]);
      const now = performance.now();
      if (lastX.current !== null && lastTime.current !== null) {
        const dt = now - lastTime.current;
        if (dt > 0) {
          const velocity = (x - lastX.current) / dt;
          let target = velocity * 12; // Adjust sensitivity
          if (target > 25) target = 25;
          if (target < -25) target = -25;
          targetTiltRef.current = target;
        }
      }
      lastX.current = x;
      lastTime.current = now;
    }
  }, [dragging, transformStr]);

  React.useEffect(() => {
    let isActive = true;

    const animate = () => {
      if (!isActive) return;
      const now = performance.now();

      // If drag stops moving for a while, target goes to 0
      if (lastTime.current && now - lastTime.current > 50) {
        targetTiltRef.current = 0;
      }

      // Physics constants for dangling pendulum feel
      const stiffness = 0.08;
      const damping = 0.85;

      const current = tiltRef.current;
      const target = targetTiltRef.current;

      // Calculate spring force
      const force = (target - current) * stiffness;
      tiltVelocityRef.current = (tiltVelocityRef.current + force) * damping;

      let next = current + tiltVelocityRef.current;

      // Stop loop if at rest and virtually straight
      if (!dragging && Math.abs(next) < 0.1 && Math.abs(tiltVelocityRef.current) < 0.1) {
        next = 0;
        tiltRef.current = 0;
        tiltVelocityRef.current = 0;
        if (paperRef.current) paperRef.current.style.transform = `scale(1) rotate(0deg)`;
        return;
      }

      tiltRef.current = next;
      if (paperRef.current) {
        paperRef.current.style.transform = `scale(${dragging ? 1.03 : 1}) rotate(${next}deg)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      isActive = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [dragging]);

  return paperRef;
}

/* ──────────────────────────── Task Card ──────────────────────────── */

const KanbanTaskCard = forwardRef<
  HTMLDivElement,
  {
    task: Task;
    onEdit: (t: Task) => void;
    onDelete: (id: string) => void;
    dragging?: boolean;
    style?: React.CSSProperties;
    [key: string]: any;
  }
>(({ task, onEdit, onDelete, dragging, style, ...rest }, ref) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));

  const paperRef = useDragTiltDom(dragging, style?.transform);

  return (
    <Box ref={ref} style={style} {...rest} sx={{ mb: 1.5 }}>
      <Paper
        ref={paperRef}
        elevation={dragging ? 12 : 0}
        sx={{
          border: `1px solid ${dragging ? pri.color : alpha(theme.palette.divider, isDark ? 0.15 : 0.6)}`,
          borderLeft: `3px solid ${pri.color}`,
          borderRadius: 2,
          cursor: 'grab',
          bgcolor: dragging
            ? alpha(theme.palette.background.paper, 0.95)
            : theme.palette.background.paper,
          boxShadow: dragging
            ? `0 16px 40px ${alpha(theme.palette.common.black, 0.18)}`
            : `0 1px 3px ${alpha(theme.palette.common.black, isDark ? 0.2 : 0.04)}`,
          transformOrigin: 'bottom center', // Pegman hangs from the bottom or top depending on preference. Top is usually 'top center'
          transition: dragging ? 'none' : 'box-shadow 0.15s, border-color 0.15s',
          zIndex: dragging ? 9999 : 'auto',
          '&:hover': {
            boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, isDark ? 0.25 : 0.08)}`,
            borderColor: alpha(pri.color, 0.6),
          },
        }}
        onClick={() => onEdit(task)}
      >
        <Box sx={{ p: 1.5 }}>
          {/* Top row: identifier + priority + delete */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              {task.identifier && (
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 10,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    letterSpacing: 0.4,
                    bgcolor: isDark ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.04),
                    px: 0.75,
                    py: 0.2,
                    borderRadius: 0.75,
                  }}
                >
                  {task.identifier}
                </Typography>
              )}
              <Chip
                label={pri.label}
                size="small"
                sx={{
                  height: 17,
                  fontSize: 9,
                  fontWeight: 800,
                  bgcolor: alpha(pri.color, 0.12),
                  color: pri.color,
                  border: 'none',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Stack>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
              sx={{ opacity: 0, '.MuiPaper-root:hover &': { opacity: 0.4 }, '&:hover': { opacity: '1 !important', color: 'error.main' }, p: 0.25 }}
            >
              <DeleteRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>

          {/* Title */}
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ lineHeight: 1.4, fontSize: 12.5, mb: 0.5, wordBreak: 'break-word' }}
          >
            {task.title}
          </Typography>

          {/* Description snippet */}
          {task.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1.4, fontSize: 11, mb: 0.75, opacity: 0.75 }}
            >
              {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
            </Typography>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <Stack direction="row" spacing={0.4} flexWrap="wrap" gap={0.4} mb={0.75}>
              {task.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{ height: 16, fontSize: 9, fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', '& .MuiChip-label': { px: 0.5 } }}
                />
              ))}
            </Stack>
          )}

          {/* Progress */}
          {task.progress > 0 && (
            <Box mb={0.75}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.25}>
                <Typography variant="caption" fontSize={9} color="text.secondary">Progress</Typography>
                <Typography variant="caption" fontSize={9} fontWeight={700} color="text.secondary">{task.progress}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={task.progress}
                sx={{
                  height: 3,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.divider, 0.15),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: task.progress === 100 ? '#66BB6A' : 'primary.main',
                  },
                }}
              />
            </Box>
          )}

          {/* Footer: due date + assignee + meta icons */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {task.dueDate && (
                <Stack direction="row" alignItems="center" spacing={0.25}>
                  <CalendarTodayRoundedIcon sx={{ fontSize: 10, color: isOverdue ? 'error.main' : 'text.disabled' }} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 10, color: isOverdue ? 'error.main' : 'text.secondary', fontWeight: isOverdue ? 700 : 400 }}
                  >
                    {format(new Date(task.dueDate), 'MMM d')}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {(task.comments || 0) > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.2}>
                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{task.comments}</Typography>
                  </Stack>
                )}
                {(task.attachments || 0) > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.2}>
                    <AttachFileRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{task.attachments}</Typography>
                  </Stack>
                )}
                {(task.sub_items || 0) > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.2}>
                    <SubdirectoryArrowRightRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{task.sub_items}</Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>

            {task.assigneeName && (
              <Tooltip title={task.assigneeName} placement="top">
                <Avatar
                  src={task.assigneeAvatar}
                  sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: alpha(pri.color, 0.2), color: pri.color }}
                >
                  {task.assigneeName.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
});
KanbanTaskCard.displayName = 'KanbanTaskCard';

/* ──────────────────────────── Kanban Column ──────────────────────────── */

const KanbanColumn: React.FC<{
  statusKey: string;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onAdd: (status: string) => void;
}> = ({ statusKey, tasks, onEdit, onDelete, onAdd }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const meta = STATUS_META[statusKey] || STATUS_META.todo;

  return (
    <Box
      sx={{
        minWidth: { xs: '100%', md: 260 },
        maxWidth: { md: 300 },
        flex: { md: '1 1 260px' },
        mr: { md: 1.5 },
        mb: { xs: 2, md: 0 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column Header */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        mb={1.25} px={0.5}
        sx={{ flexShrink: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: meta.color, boxShadow: `0 0 0 3px ${alpha(meta.color, 0.2)}` }} />
          <Typography variant="subtitle2" fontWeight={700} fontSize={12.5} color="text.primary">
            {meta.label}
          </Typography>
          <Box
            sx={{
              minWidth: 22,
              height: 20,
              px: 0.75,
              borderRadius: 1,
              bgcolor: alpha(meta.color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={800} fontSize={10} color={meta.color}>
              {tasks.length}
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Add task">
          <IconButton
            size="small"
            onClick={() => onAdd(statusKey)}
            sx={{
              opacity: 0.4,
              '&:hover': { opacity: 1, bgcolor: alpha(meta.color, 0.1), color: meta.color },
              width: 24, height: 24,
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Droppable area */}
      <Droppable droppableId={statusKey}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              minHeight: 140,
              maxHeight: { xs: 'none', md: 'calc(100vh - 400px)' },
              overflowY: 'auto',
              p: 1,
              borderRadius: 2,
              bgcolor: snapshot.isDraggingOver
                ? alpha(meta.color, 0.07)
                : isDark ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.common.black, 0.015),
              border: `2px dashed ${snapshot.isDraggingOver ? alpha(meta.color, 0.4) : 'transparent'}`,
              transition: 'all 0.15s ease',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha(meta.color, 0.2), borderRadius: 2 },
            }}
          >
            {tasks.map((t, index) => (
              <Draggable key={t._id} draggableId={t._id} index={index}>
                {(draggableProvided, draggableSnapshot) => (
                  <KanbanTaskCard
                    task={t}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    dragging={draggableSnapshot.isDragging}
                    ref={draggableProvided.innerRef}
                    style={draggableProvided.draggableProps.style}
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  py: 5,
                  opacity: 0.35,
                  border: `1px dashed ${alpha(meta.color, 0.3)}`,
                  borderRadius: 2,
                }}
              >
                <ViewKanbanRoundedIcon sx={{ fontSize: 24, color: meta.color, mb: 0.5 }} />
                <Typography variant="caption" color="text.disabled" textAlign="center" fontSize={11}>
                  Drop tasks here
                </Typography>
              </Stack>
            )}
          </Box>
        )}
      </Droppable>

      {/* Quick-add */}
      <Button
        size="small"
        startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
        onClick={() => onAdd(statusKey)}
        fullWidth
        sx={{
          mt: 0.75, py: 0.5, borderRadius: 1.5, textTransform: 'none',
          fontSize: 11, fontWeight: 600, color: alpha(meta.color, 0.7),
          border: `1px dashed ${alpha(meta.color, 0.2)}`,
          '&:hover': { bgcolor: alpha(meta.color, 0.06), borderColor: meta.color, color: meta.color },
        }}
      >
        Add task
      </Button>
    </Box>
  );
};

/* ──────────────────────────── MAIN PAGE ──────────────────────────── */

function TasksPage(): React.JSX.Element {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';
  const customization = useCustomization();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlProjectId = searchParams.get('projectId');

  /* ── UI state ── */
  const [search, setSearch] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<Department[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewTab, setViewTab] = useState<'board' | 'my_tasks'>('board');
  const [onlyMine, setOnlyMine] = useState(false);
  const { user: authUser } = useAuth();

  /* ── Project ── */
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /* ── Task detail dialog ── */
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium',
    assigneeId: '', assigneeName: '', assigneeAvatar: '',
    dueDate: '', aiContext: '', tags: '', progress: 0,
  });

  /* ── New project dialog ── */
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', color: '#5569ff' });

  /* ── AI dialog ── */
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  /* ── Data ── */
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => taskClient.getProjects(),
    staleTime: 60_000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 120_000,
  });

  const teamMembers = useMemo(() => {
    const excluded = ['merchant', 'cashier', 'promotor'];
    return allUsers.filter((u: any) => !excluded.includes(u.role));
  }, [allUsers]);

  /* ── Auto-select project from URL or first ── */
  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      const target = urlProjectId && projects.find((p) => p._id === urlProjectId);
      setSelectedProjectId(target ? target._id : projects[0]._id);
    }
  }, [projects, selectedProjectId, urlProjectId]);

  const selectedProject = useMemo(() => projects.find((p) => p._id === selectedProjectId), [projects, selectedProjectId]);

  /* ── Compute filter params for backend ── */
  const activeDeptIds = useMemo(() =>
    selectedDepts.map((d) => d._id),
    [selectedDepts]);

  const activeUserIds = useMemo(() =>
    selectedUsers.map((u: any) => String(u.id || u._id)),
    [selectedUsers]);

  const { data: board, isLoading: loadingBoard } = useQuery({
    queryKey: ['board', selectedProjectId, activeDeptIds, activeUserIds, onlyMine],
    queryFn: () => {
      const filterIds = onlyMine && myUserId
        ? [myUserId, ...activeUserIds].filter((v, i, a) => a.indexOf(v) === i)
        : activeUserIds;
      return taskClient.getBoard(selectedProjectId!, {
        assigneeIds: filterIds.length > 0 ? filterIds : undefined,
        departmentIds: activeDeptIds.length > 0 ? activeDeptIds : undefined,
      });
    },
    enabled: !!selectedProjectId,
  });

  const { data: aiContext } = useQuery({
    queryKey: ['ai-context'],
    queryFn: () => taskClient.getAiContext(),
    enabled: aiDialogOpen,
  });

  /* ── My Tasks query ── */
  const myUserId = authUser?._id || authUser?.id;
  const { data: myTasks = [], isLoading: loadingMyTasks } = useQuery({
    queryKey: ['my-tasks', myUserId],
    queryFn: () => taskClient.getMyTasks(myUserId!),
    enabled: viewTab === 'my_tasks' && !!myUserId,
    staleTime: 30_000,
  });

  /* ── Client-side filter: search + priority only (dept/user handled by backend) ── */
  const filteredBoard = useMemo(() => {
    if (!board) return null;
    let filtered = Object.values(board.tasks);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.identifier?.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'all') filtered = filtered.filter((t) => t.priority === priorityFilter);

    const byStatus: Record<string, Task[]> = {};
    Object.keys(STATUS_META).forEach((k) => { byStatus[k] = []; });
    filtered.forEach((t) => {
      if (byStatus[t.status]) byStatus[t.status].push(t);
      else byStatus.backlog.push(t);
    });
    Object.keys(byStatus).forEach((k) => byStatus[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));

    return { byStatus, total: filtered.length, allTotal: Object.values(board.tasks).length };
  }, [board, search, priorityFilter]);

  const statusCounts = useMemo(() => {
    if (!board) return {} as Record<string, number>;
    const c: Record<string, number> = {};
    Object.keys(STATUS_META).forEach((k) => { c[k] = 0; });
    Object.values(board.tasks).forEach((t) => { if (c[t.status] !== undefined) c[t.status]++; });
    return c;
  }, [board]);

  /* ── Mutations ── */
  const createTaskMut = useMutation({
    mutationFn: (p: any) => taskClient.createTask(p),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); toast.success('Task created'); closeDialog(); },
  });
  const updateTaskMut = useMutation({
    mutationFn: ({ id, ...p }: any) => taskClient.updateTask(id, p),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); toast.success('Task updated'); closeDialog(); },
  });
  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => taskClient.deleteTask(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); toast.success('Task deleted'); },
  });
  const createProjectMut = useMutation({
    mutationFn: (p: any) => taskClient.createProject(p),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjectId(d._id);
      setNewProjectOpen(false);
      setProjectForm({ name: '', description: '', color: '#5569ff' });
      toast.success('Project created');
    },
  });

  /* ── Drag & Drop ── */
  const handleDragEnd = useCallback(async ({ source, destination, draggableId }: DropResult): Promise<void> => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destStatus = destination.droppableId as Task['status'];
    const qKey = ['board', selectedProjectId, activeDeptIds, activeUserIds];

    // Snapshot for rollback and stop ongoing fetches to avoid race conditions (snap-back)
    await queryClient.cancelQueries({ queryKey: qKey });
    const previousBoard = queryClient.getQueryData<BoardData>(qKey);

    // Optimistic: immediately move the card to the new column
    queryClient.setQueryData(qKey, (old: BoardData | undefined) => {
      if (!old) return old;
      const task = old.tasks[draggableId];
      if (!task) return old;
      return {
        ...old,
        tasks: { ...old.tasks, [draggableId]: { ...task, status: destStatus, position: destination.index } },
      };
    });

    try {
      await taskClient.moveTask(draggableId, destStatus, destination.index);
      // Optional: sync server quietly
      queryClient.invalidateQueries({ queryKey: ['board', selectedProjectId] });
    } catch {
      // Rollback
      if (previousBoard) queryClient.setQueryData(qKey, previousBoard);
      toast.error('Failed to move task');
    }
  }, [queryClient, selectedProjectId, activeDeptIds, activeUserIds]);

  /* ── Dialog helpers ── */
  function closeDialog() {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', assigneeId: '', assigneeName: '', assigneeAvatar: '', dueDate: '', aiContext: '', tags: '', progress: 0 });
  }

  function handleOpenNewTask(status: string) {
    closeDialog();
    setNewTaskStatus(status);
    setTaskDialogOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      assigneeName: task.assigneeName || '',
      assigneeAvatar: task.assigneeAvatar || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      aiContext: task.aiContext || '',
      tags: task.tags?.join(', ') || '',
      progress: task.progress || 0,
    });
    setNewTaskStatus(task.status);
    setTaskDialogOpen(true);
  }

  function handleSubmitTask() {
    const tagsArr = taskForm.tags ? taskForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const payload: any = {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      assigneeId: taskForm.assigneeId || null,
      assigneeName: taskForm.assigneeName,
      assigneeAvatar: taskForm.assigneeAvatar,
      dueDate: taskForm.dueDate || null,
      aiContext: taskForm.aiContext,
      tags: tagsArr,
      progress: taskForm.progress,
      status: newTaskStatus,
      projectId: selectedProjectId,
    };
    if (editingTask) updateTaskMut.mutate({ id: editingTask._id, ...payload });
    else createTaskMut.mutate(payload);
  }

  const selectedAssignee = useMemo(
    () => teamMembers.find((u: any) => (u.id || u._id) === taskForm.assigneeId),
    [teamMembers, taskForm.assigneeId]
  );

  const totalTasks = filteredBoard?.allTotal || 0;
  const doneTasks = statusCounts['done'] || 0;
  const projectProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Box
      display="flex" flex={1} position="relative" flexDirection="column" overflow="hidden"
      sx={{ bgcolor: isDark ? alpha(theme.palette.common.black, 0.2) : alpha(theme.palette.common.black, 0.015) }}
      p={{ xs: 1.5, sm: 2 }}
    >
      {/* ═══ Compact Header ═══ */}
      <Container sx={{ mb: 0.75 }} disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" alignItems="center" spacing={1} flex={1} minWidth={0}>
            <IconButton
              size="small"
              onClick={() => router.push('/admin/applications/projects-board')}
              sx={{ p: 0.5 }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5} noWrap>
              {selectedProject?.name || 'Tasks'}
            </Typography>
            {selectedProject?.identifier && (
              <Chip
                label={selectedProject.identifier}
                size="small"
                sx={{
                  fontFamily: 'monospace', fontWeight: 700, fontSize: 10,
                  bgcolor: alpha(selectedProject.color || theme.palette.primary.main, 0.12),
                  color: selectedProject.color || theme.palette.primary.main,
                  height: 20,
                }}
              />
            )}
            {totalTasks > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: 11, whiteSpace: 'nowrap' }}>
                {doneTasks}/{totalTasks} done · {projectProgress}%
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={0.75} flexShrink={0}>
            <Button
              variant="outlined" size="small" color="warning"
              startIcon={<SmartToyRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => setAiDialogOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 11, py: 0.3, px: 1.25 }}
            >
              AI
            </Button>
            <Button
              variant="outlined" size="small"
              startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => setNewProjectOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 11, py: 0.3, px: 1.25 }}
            >
              Project
            </Button>
            <Button
              variant="contained" size="small" disableElevation
              startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleOpenNewTask('todo')}
              sx={{
                borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.3, px: 1.25,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              }}
            >
              Task
            </Button>
          </Stack>
        </Stack>
      </Container>

      {/* ═══ Project progress bar ═══ */}
      {totalTasks > 0 && (
        <Container disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'} sx={{ mb: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={projectProgress}
            sx={{
              height: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.divider, 0.15),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${projectProgress === 100 ? '#66BB6A' : theme.palette.primary.light})`,
              },
            }}
          />
        </Container>
      )}

      {/* ═══ View Toggle: Board vs My Tasks ═══ */}
      <Container disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'} sx={{ mb: 1 }}>
        <Tabs
          value={viewTab}
          onChange={(_, v) => setViewTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 32, py: 0, px: 1.5, textTransform: 'none',
              fontWeight: 700, fontSize: 12, gap: 0.5,
            },
          }}
        >
          <Tab
            value="board"
            icon={<ViewKanbanRoundedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label="Board"
          />
          <Tab
            value="my_tasks"
            icon={<AssignmentIndRoundedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label={`My Tasks${myTasks.length > 0 ? ` (${myTasks.length})` : ''}`}
          />
        </Tabs>
      </Container>

      {/* ═══ MY TASKS VIEW ═══ */}
      {viewTab === 'my_tasks' && (
        <Container disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'} sx={{ flex: 1, overflow: 'auto', pb: 4 }}>
          {loadingMyTasks ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : myTasks.length === 0 ? (
            <Card sx={{ borderRadius: 3, mt: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <AssignmentIndRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>No pending tasks</Typography>
                <Typography variant="body2" color="text.secondary">You're all caught up! 🎉</Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={1.5} mt={1}>
              {Object.entries(STATUS_META).filter(([key]) => key !== 'done').map(([statusKey, meta]) => {
                const tasksInStatus = myTasks.filter((t) => t.status === statusKey);
                if (tasksInStatus.length === 0) return null;
                return (
                  <Card key={statusKey} sx={{ borderRadius: 2.5, border: `1px solid ${alpha(meta.color, 0.2)}`, overflow: 'visible' }}>
                    <Box px={2} py={1} sx={{ borderBottom: `1px solid ${alpha(meta.color, 0.12)}`, bgcolor: alpha(meta.color, 0.04) }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: meta.color }} />
                        <Typography variant="subtitle2" fontWeight={800} fontSize={13}>{meta.label}</Typography>
                        <Chip label={tasksInStatus.length} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: alpha(meta.color, 0.15), color: meta.color }} />
                      </Stack>
                    </Box>
                    <Stack divider={<Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}` }} />}>
                      {tasksInStatus.map((task) => {
                        const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        const isOverdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));
                        return (
                          <Box
                            key={task._id}
                            px={2} py={1.5}
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                              borderLeft: `3px solid ${pri.color}`,
                            }}
                            onClick={() => {
                              if (task.projectId) setSelectedProjectId(task.projectId);
                              setViewTab('board');
                              handleEditTask(task);
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Stack direction="row" alignItems="center" spacing={1.5} flex={1} minWidth={0}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace', fontWeight: 700, fontSize: 10,
                                    color: alpha(theme.palette.text.secondary, 0.7),
                                    bgcolor: isDark ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.04),
                                    px: 0.75, py: 0.2, borderRadius: 0.75, flexShrink: 0,
                                  }}
                                >
                                  {task.identifier}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} fontSize={13} noWrap sx={{ flex: 1 }}>
                                  {task.title}
                                </Typography>
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                                <Chip
                                  label={pri.label}
                                  size="small"
                                  sx={{
                                    height: 20, fontSize: 10, fontWeight: 800,
                                    bgcolor: alpha(pri.color, 0.12), color: pri.color,
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                                {task.dueDate && (
                                  <Stack direction="row" alignItems="center" spacing={0.3}>
                                    <CalendarTodayRoundedIcon sx={{ fontSize: 12, color: isOverdue ? 'error.main' : 'text.disabled' }} />
                                    <Typography variant="caption" sx={{ fontSize: 11, color: isOverdue ? 'error.main' : 'text.secondary', fontWeight: isOverdue ? 700 : 400 }}>
                                      {format(new Date(task.dueDate), 'MMM d')}
                                    </Typography>
                                  </Stack>
                                )}
                                <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                              </Stack>
                            </Stack>
                            {task.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block', fontSize: 11, opacity: 0.7, pl: 7 }}>
                                {task.description.slice(0, 120)}{task.description.length > 120 ? '…' : ''}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Container>
      )}

      {/* ═══ BOARD VIEW: Project Tabs + Kanban ═══ */}
      {viewTab === 'board' && (<>

      {/* ═══ Project Tabs ═══ */}
      <Container disableGutters={!mdUp} maxWidth={customization.stretch ? false : 'xl'}>
        {mdUp ? (
          <Tabs
            value={selectedProjectId || false}
            onChange={(_, v) => setSelectedProjectId(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 0, minHeight: 40,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 36, py: 0, px: 2, mr: 0.5,
                borderRadius: '8px 8px 0 0',
                textTransform: 'none', fontWeight: 600, fontSize: 12.5,
                color: 'text.secondary',
                border: `1px solid transparent`,
                borderBottom: 'none',
                transition: 'all 0.15s',
                '&.Mui-selected': {
                  bgcolor: isDark ? lighten(theme.palette.neutral[900], 0.04) : 'common.white',
                  color: 'text.primary',
                  borderColor: isDark ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.1),
                },
                '&:hover:not(.Mui-selected)': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
              },
            }}
          >
            {projects.map((p) => (
              <Tab
                key={p._id}
                value={p._id}
                label={
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || '#5569ff', flexShrink: 0 }} />
                    <span>{p.name}</span>
                    {p.identifier && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 9.5, opacity: 0.5 }}>
                        {p.identifier}
                      </Typography>
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>
        ) : (
          <Select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            fullWidth size="small"
            sx={{ mb: 2, borderRadius: 1.5 }}
          >
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || '#5569ff' }} />
                  <span>{p.name}</span>
                  {p.identifier && <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.5 }}>{p.identifier}</Typography>}
                </Stack>
              </MenuItem>
            ))}
          </Select>
        )}
      </Container>

      {/* ═══ Board card ═══ */}
      <Box
        sx={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          bgcolor: isDark ? lighten(theme.palette.neutral[900], 0.03) : 'common.white',
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.08)}`,
          borderRadius: '0 8px 8px 8px',
          pt: 1.25,
        }}
      >
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          {/* ── Filters ── */}
          <Grid container spacing={1} mb={1}>
            <Grid xs={12} md={4}>
              <Autocomplete
                multiple limitTags={2} size="small" options={departments}
                value={selectedDepts} onChange={(_, v) => setSelectedDepts(v)}
                getOptionLabel={(o) => o.name} disableCloseOnSelect
                renderOption={({ key, ...props }, option, { selected }) => (
                  <li {...props} key={option._id}>
                    <Checkbox icon={cbIcon} checkedIcon={cbChecked} sx={{ mr: 1, p: 0 }} checked={selected} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: option.color, mr: 1 }} />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Filter by department…" />
                )}
                renderTags={(tags, getTagProps) =>
                  tags.map((d, i) => (
                    <Chip key={d._id} label={d.name} size="small" {...getTagProps({ index: i })}
                      sx={{ bgcolor: alpha(d.color, 0.1), color: d.color, fontWeight: 600, fontSize: 11 }}
                    />
                  ))
                }
              />
            </Grid>
            <Grid xs={12} md={4}>
              <Autocomplete
                multiple limitTags={2} size="small" options={teamMembers}
                value={selectedUsers} onChange={(_, v) => setSelectedUsers(v)}
                getOptionLabel={(o: any) => `${o.firstName} ${o.lastName || ''}`} disableCloseOnSelect
                renderOption={(props, option: any, { selected }) => (
                  <li {...props}>
                    <Checkbox icon={cbIcon} checkedIcon={cbChecked} sx={{ mr: 1, p: 0 }} checked={selected} />
                    <Avatar src={option.profileImage} sx={{ width: 22, height: 22, mr: 1, fontSize: 10 }}>
                      {option.firstName?.[0]}
                    </Avatar>
                    {option.firstName} {option.lastName?.[0] || ''}
                  </li>
                )}
                renderInput={(params) => <TextField {...params} placeholder="Filter by member…" />}
                renderTags={(tags, getTagProps) =>
                  tags.map((u: any, i: number) => (
                    <Chip key={u.id || u._id} size="small" {...getTagProps({ index: i })}
                      label={`${u.firstName} ${u.lastName?.[0] || ''}`}
                      avatar={<Avatar src={u.profileImage}>{u.firstName?.[0]}</Avatar>}
                    />
                  ))
                }
              />
            </Grid>
            <Grid xs={12} md={4}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Chip
                  icon={<PersonOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label="Only mine"
                  size="small"
                  variant={onlyMine ? 'filled' : 'outlined'}
                  color={onlyMine ? 'primary' : 'default'}
                  onClick={() => setOnlyMine(!onlyMine)}
                  sx={{
                    height: 28, fontWeight: 700, fontSize: 11,
                    borderRadius: 1.5,
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                />
                <TextField
                  size="small" placeholder="Search…" value={search}
                  onChange={(e) => setSearch(e.target.value)} fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 16, opacity: 0.4 }} /></InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <Select
                  size="small" value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  sx={{ minWidth: 110, borderRadius: 1.5, fontSize: 11 }}
                >
                  <MenuItem value="all">All priority</MenuItem>
                  {Object.entries(PRIORITY_CONFIG).map(([k, c]) => (
                    <MenuItem key={k} value={k}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <FlagRoundedIcon sx={{ fontSize: 13, color: c.color }} />
                        <span>{c.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
          </Grid>

          {/* ── Status summary bar ── */}
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <Box
                key={key}
                sx={{
                  px: 1.25, py: 0.4,
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(meta.color, 0.2)}`,
                  bgcolor: alpha(meta.color, 0.05),
                  display: 'flex', alignItems: 'center', gap: 0.75,
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />
                <Typography variant="caption" fontWeight={700} fontSize={11} color={meta.color}>
                  {statusCounts[key] || 0}
                </Typography>
                <Typography variant="caption" fontSize={11} color="text.secondary">
                  {meta.label}
                </Typography>
              </Box>
            ))}
            {(activeDeptIds.length > 0 || activeUserIds.length > 0 || search || priorityFilter !== 'all') && (
              <>
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {filteredBoard?.total || 0} of {filteredBoard?.allTotal || 0} tasks shown
                  </Typography>
                  <Button size="small" variant="text" sx={{ fontSize: 11, textTransform: 'none', py: 0 }}
                    onClick={() => { setSelectedDepts([]); setSelectedUsers([]); setSearch(''); setPriorityFilter('all'); }}
                  >
                    Clear
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Container>

        {/* ── Kanban Board ── */}
        <Box sx={{ flex: 1, overflowY: 'hidden', overflowX: 'auto' }}>
          <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ pb: 2 }}>
            {loadingBoard || loadingProjects ? (
              <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
            ) : filteredBoard ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', md: 'row' }}
                  alignItems="flex-start"
                  sx={{ minWidth: { md: 1100 }, pb: 1 }}
                >
                  {Object.entries(STATUS_META).map(([statusKey]) => (
                    <KanbanColumn
                      key={statusKey}
                      statusKey={statusKey}
                      tasks={filteredBoard.byStatus[statusKey] || []}
                      onEdit={handleEditTask}
                      onDelete={(id) => deleteTaskMut.mutate(id)}
                      onAdd={handleOpenNewTask}
                    />
                  ))}
                </Box>
              </DragDropContext>
            ) : (
              <Box textAlign="center" py={8}>
                <ViewKanbanRoundedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h6" color="text.secondary" mb={0.5}>
                  {loadingProjects ? 'Loading projects…' : 'Select or create a project to start'}
                </Typography>
                <Button variant="contained" size="small" startIcon={<AddRoundedIcon />}
                  onClick={() => setNewProjectOpen(true)}
                  sx={{ mt: 2, borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                  disableElevation
                >
                  Create Project
                </Button>
              </Box>
            )}
          </Container>
        </Box>
      </Box>

      </>)} {/* end viewTab === 'board' */}

      {/* ═══ Task Detail Dialog ═══ */}
      <Dialog
        open={taskDialogOpen} onClose={closeDialog}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'visible' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {editingTask?.identifier && (
                <Chip
                  label={editingTask.identifier}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                />
              )}
              <Typography variant="h6" fontWeight={700}>
                {editingTask ? 'Edit Task' : 'New Task'}
              </Typography>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* Title */}
            <TextField
              label="Title" fullWidth autoFocus required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="What needs to be done?"
              sx={{ '& .MuiOutlinedInput-root': { fontWeight: 600 } }}
            />

            {/* Description */}
            <TextField
              label="Description" fullWidth multiline rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Add more details…"
            />

            {/* Priority + Status */}
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Priority" select fullWidth size="small"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, c]) => (
                  <MenuItem key={k} value={k}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FlagRoundedIcon sx={{ fontSize: 15, color: c.color }} />
                      <span>{c.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Status" select fullWidth size="small"
                value={newTaskStatus}
                onChange={(e) => setNewTaskStatus(e.target.value)}
              >
                {Object.entries(STATUS_META).map(([k, m]) => (
                  <MenuItem key={k} value={k}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
                      <span>{m.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Assignee + Due date */}
            <Stack direction="row" spacing={1.5}>
              <Autocomplete
                fullWidth size="small"
                options={teamMembers}
                value={selectedAssignee || null}
                onChange={(_, v: any) => {
                  if (v) {
                    setTaskForm({
                      ...taskForm,
                      assigneeId: v.id || v._id,
                      assigneeName: `${v.firstName} ${v.lastName || ''}`.trim(),
                      assigneeAvatar: v.profileImage || '',
                    });
                  } else {
                    setTaskForm({ ...taskForm, assigneeId: '', assigneeName: '', assigneeAvatar: '' });
                  }
                }}
                getOptionLabel={(o: any) => `${o.firstName} ${o.lastName || ''}`.trim()}
                renderOption={(props, option: any) => (
                  <li {...props}>
                    <Avatar src={option.profileImage} sx={{ width: 24, height: 24, mr: 1, fontSize: 10 }}>
                      {option.firstName?.[0]}
                    </Avatar>
                    {option.firstName} {option.lastName || ''}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assignee"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: taskForm.assigneeId ? (
                        <Avatar src={taskForm.assigneeAvatar} sx={{ width: 20, height: 20, mr: 0.5, ml: 0.5, fontSize: 9 }}>
                          {taskForm.assigneeName?.[0]}
                        </Avatar>
                      ) : undefined,
                    }}
                  />
                )}
              />
              <TextField
                label="Due Date" type="date" size="small" fullWidth
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {/* Tags */}
            <TextField
              label="Tags" size="small" fullWidth
              value={taskForm.tags}
              onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
              placeholder="frontend, bug, ux  (comma-separated)"
              InputProps={{
                startAdornment: <InputAdornment position="start"><TagRoundedIcon sx={{ fontSize: 15, opacity: 0.4 }} /></InputAdornment>,
              }}
            />

            {/* Progress */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="caption" fontWeight={800} color="primary.main">
                  {taskForm.progress}%
                </Typography>
              </Stack>
              <Slider
                value={taskForm.progress}
                onChange={(_, v) => setTaskForm({ ...taskForm, progress: v as number })}
                min={0} max={100} step={5}
                size="small"
                marks={[{ value: 0, label: '0' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
                sx={{ '& .MuiSlider-markLabel': { fontSize: 10 } }}
              />
            </Box>

            {/* AI Context */}
            <TextField
              label="AI Context"
              fullWidth multiline rows={2} size="small"
              value={taskForm.aiContext}
              onChange={(e) => setTaskForm({ ...taskForm, aiContext: e.target.value })}
              placeholder="Describe what this task involves so AI can learn your team's work…"
              helperText="AI training context — helps the assistant understand team activities"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 1.5, textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSubmitTask} disableElevation
            disabled={!taskForm.title || createTaskMut.isPending || updateTaskMut.isPending}
            sx={{
              fontWeight: 700, borderRadius: 1.5, textTransform: 'none',
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            {editingTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ New Project Dialog ═══ */}
      <Dialog
        open={newProjectOpen} onClose={() => setNewProjectOpen(false)}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New Project</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            <TextField
              label="Project Name" fullWidth autoFocus required
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            />
            <TextField
              label="Description" fullWidth multiline rows={2}
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            />
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.75} display="block">
                Color
              </Typography>
              <Stack direction="row" gap={0.75} flexWrap="wrap">
                {PROJECT_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setProjectForm({ ...projectForm, color: c })}
                    sx={{
                      width: 30, height: 30, borderRadius: 1.5, bgcolor: c, cursor: 'pointer',
                      border: projectForm.color === c ? `3px solid ${theme.palette.background.paper}` : '3px solid transparent',
                      boxShadow: projectForm.color === c ? `0 0 0 2px ${c}` : 'none',
                      transition: 'all 0.15s', '&:hover': { transform: 'scale(1.12)' },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewProjectOpen(false)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" disableElevation
            onClick={() => createProjectMut.mutate(projectForm)}
            disabled={!projectForm.name || createProjectMut.isPending}
            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ AI Dialog ═══ */}
      <Dialog
        open={aiDialogOpen} onClose={() => setAiDialogOpen(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <SmartToyRoundedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>AI Training Context</Typography>
              <Typography variant="caption" color="text.secondary">
                Export task data for AI assistants
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {aiContext ? (
            <>
              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={0.5}>
                <Chip label={`${aiContext.stats.projects} Projects`} color="primary" size="small" />
                <Chip label={`${aiContext.stats.tasks} Tasks`} color="info" size="small" />
                <Chip label={`${aiContext.stats.byStatus?.done || 0} Done`} color="success" size="small" />
                <Chip label={`${aiContext.stats.byStatus?.in_progress || 0} In Progress`} color="warning" size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={1.5} fontSize={12}>
                Copy this context and paste it into ChatGPT, Claude, Gemini, or any AI to get help with your team's tasks.
              </Typography>
              <Box
                sx={{
                  p: 2, maxHeight: 380, overflow: 'auto',
                  bgcolor: isDark ? alpha(theme.palette.common.black, 0.3) : alpha(theme.palette.common.black, 0.03),
                  fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.8,
                  whiteSpace: 'pre-wrap', borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                }}
              >
                {aiContext.context}
              </Box>
            </>
          ) : (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAiDialogOpen(false)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>Close</Button>
          <Button
            variant="contained" disableElevation
            startIcon={<ContentCopyRoundedIcon />}
            onClick={() => {
              if (aiContext?.context) { navigator.clipboard.writeText(aiContext.context); toast.success('Context copied to clipboard!'); }
            }}
            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
          >
            Copy Context
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TasksPage;
