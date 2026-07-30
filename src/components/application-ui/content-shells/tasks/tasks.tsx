'use client';

import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/mocks/users';
import { isInternalStaff } from '@/utils/staff';
import { Department, departmentService } from '@/services/department.service';
import { Task, taskClient, type BoardData } from '@/services/task.service';
import { type DropResult } from '@hello-pangea/dnd';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useCustomization } from 'src/hooks/use-customization';
import { AiDialog } from './ai-dialog';
import { BoardView } from './board-view';
import {
  EMPTY_TASK_FORM,
  PROJECT_COLORS,
  STATUS_LABEL,
  type ProjectFormState,
  type TaskFormState,
} from './constants';
import { MyTasksView } from './my-tasks-view';
import { ProjectDialog } from './project-dialog';
import { RoutinesView } from './routines-view';
import { TaskDialog } from './task-dialog';

function Tasks(): React.JSX.Element {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';
  const customization = useCustomization();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { push } = useRouter();
  const urlProjectId = searchParams.get('projectId');
  /** Deep link de los avisos de WhatsApp: /admin/applications/tasks?taskId=<id> */
  const urlTaskId = searchParams.get('taskId');
  const openedDeepLink = React.useRef<string | null>(null);

  /* ── UI state ── */
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedDepts, setSelectedDepts] = useState<Department[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewTab, setViewTab] = useState<'board' | 'my_tasks' | 'routines'>('board');
  const [onlyMine, setOnlyMine] = useState(false);
  const { user: authUser } = useAuth();
  const myUserId = authUser?._id || authUser?.id;

  /* ── Project ── */
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /* ── Task detail dialog ── */
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [taskForm, setTaskForm] = useState<TaskFormState>({ ...EMPTY_TASK_FORM });

  /* ── New project dialog ── */
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  });

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
    queryFn: () => usersApi.getUsers({ lean: true }),
    staleTime: 120_000,
  });

  // Sólo equipo interno: los managers de promotoras de campo no llevan tareas
  const teamMembers = useMemo(() => allUsers.filter(isInternalStaff), [allUsers]);

  /* ── Auto-select project from URL or first ── */
  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      const target = urlProjectId && projects.find((p) => p._id === urlProjectId);
      setSelectedProjectId(target ? target._id : projects[0]._id);
    }
  }, [projects, selectedProjectId, urlProjectId]);

  /* ── Deep link ?taskId= — abre la tarea que venía en el aviso de WhatsApp ── */
  const { data: deepLinkedTask } = useQuery({
    queryKey: ['task', urlTaskId],
    queryFn: () => taskClient.getTask(urlTaskId!),
    enabled: !!urlTaskId,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (!deepLinkedTask || openedDeepLink.current === deepLinkedTask._id) return;
    openedDeepLink.current = deepLinkedTask._id;
    if (deepLinkedTask.projectId) setSelectedProjectId(deepLinkedTask.projectId);
    handleEditTask(deepLinkedTask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkedTask]);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  /* ── Compute filter params for backend ── */
  const activeDeptIds = useMemo(() => selectedDepts.map((d) => d._id), [selectedDepts]);

  const activeUserIds = useMemo(
    () => selectedUsers.map((u: any) => String(u.id || u._id)),
    [selectedUsers]
  );

  // Stabilize array keys with JSON.stringify to prevent reference-change refetches
  const deptKey = JSON.stringify(activeDeptIds);
  const userKey = JSON.stringify(activeUserIds);

  const { data: board, isLoading: loadingBoard } = useQuery({
    queryKey: ['board', selectedProjectId, deptKey, userKey, onlyMine],
    queryFn: () => {
      const filterIds =
        onlyMine && myUserId
          ? [myUserId, ...activeUserIds].filter((v, i, a) => a.indexOf(v) === i)
          : activeUserIds;
      return taskClient.getBoard(selectedProjectId!, {
        assigneeIds: filterIds.length > 0 ? filterIds : undefined,
        departmentIds: activeDeptIds.length > 0 ? activeDeptIds : undefined,
      });
    },
    enabled: !!selectedProjectId,
    staleTime: 30_000,
  });

  const { data: aiContext } = useQuery({
    queryKey: ['ai-context'],
    queryFn: () => taskClient.getAiContext(),
    enabled: aiDialogOpen,
  });

  /* ── My Tasks query ── */
  const { data: myTasks = [], isLoading: loadingMyTasks } = useQuery({
    queryKey: ['my-tasks', myUserId],
    queryFn: () => taskClient.getMyTasks(myUserId!),
    enabled: viewTab === 'my_tasks' && !!myUserId,
    staleTime: 30_000,
  });

  /* ── Rutinarias (plantillas — no salen en el board) ── */
  const { data: routines = [], isLoading: loadingRoutines } = useQuery({
    queryKey: ['routines', selectedProjectId],
    queryFn: () => taskClient.getRoutines(selectedProjectId || undefined),
    enabled: viewTab === 'routines',
    staleTime: 30_000,
  });

  /* ── Client-side filter: search + priority only (dept/user handled by backend) ── */
  const filteredBoard = useMemo(() => {
    if (!board) return null;
    let filtered = Object.values(board.tasks);

    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.identifier?.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'all') filtered = filtered.filter((t) => t.priority === priorityFilter);

    const byStatus: Record<string, Task[]> = {};
    Object.keys(STATUS_LABEL).forEach((k) => {
      byStatus[k] = [];
    });
    filtered.forEach((t) => {
      if (byStatus[t.status]) byStatus[t.status].push(t);
      else byStatus.backlog.push(t);
    });
    Object.keys(byStatus).forEach((k) =>
      byStatus[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    );

    return { byStatus, total: filtered.length, allTotal: Object.values(board.tasks).length };
  }, [board, deferredSearch, priorityFilter]);

  const statusCounts = useMemo(() => {
    if (!board) return {} as Record<string, number>;
    const c: Record<string, number> = {};
    Object.keys(STATUS_LABEL).forEach((k) => {
      c[k] = 0;
    });
    Object.values(board.tasks).forEach((t) => {
      if (c[t.status] !== undefined) c[t.status]++;
    });
    return c;
  }, [board]);

  /* ── Mutations ── */
  const createTaskMut = useMutation({
    mutationFn: (p: any) => taskClient.createTask(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Tarea creada');
      closeDialog();
    },
    // 409 = rompe una regla del manual (urgencias, 3 en curso): se dice cuál
    onError: (err: any) => toast.error(err?.response?.data?.error || 'No se pudo crear la tarea'),
  });
  const updateTaskMut = useMutation({
    mutationFn: ({ id, ...p }: any) => taskClient.updateTask(id, p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Tarea actualizada');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'No se pudo actualizar la tarea'),
  });
  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => taskClient.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Task deleted');
    },
  });
  const handleDeleteTask = useCallback(
    (id: string) => {
      deleteTaskMut.mutate(id);
    },
    [deleteTaskMut]
  );
  const createProjectMut = useMutation({
    mutationFn: (p: any) => taskClient.createProject(p),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjectId(d._id);
      setNewProjectOpen(false);
      setProjectForm({ name: '', description: '', color: PROJECT_COLORS[0] });
      toast.success('Project created');
    },
  });

  /* ── Drag & Drop ── */
  const handleDragEnd = useCallback(
    async ({ source, destination, draggableId }: DropResult): Promise<void> => {
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index)
        return;

      const destStatus = destination.droppableId as Task['status'];
      const qKey = ['board', selectedProjectId, deptKey, userKey, onlyMine];

      // Bloquear exige decir qué falta y quién destraba → se abre el diálogo
      const dragged = board?.tasks?.[draggableId];
      if (destStatus === 'blocked' && dragged && !(dragged.blockedReason && dragged.blockerOwner)) {
        handleEditTask({ ...dragged, status: 'blocked' });
        toast('Indica qué se necesita y quién lo destraba', { icon: '🚧' });
        return;
      }

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
          tasks: {
            ...old.tasks,
            [draggableId]: { ...task, status: destStatus, position: destination.index },
          },
        };
      });

      try {
        await taskClient.moveTask(draggableId, destStatus, destination.index);
      } catch (err: any) {
        // Rollback
        if (previousBoard) queryClient.setQueryData(qKey, previousBoard);
        // El back frena el movimiento cuando rompe una regla del manual (3 En
        // curso por persona, bloqueo sin nombre): se muestra el motivo real.
        toast.error(err?.response?.data?.error || 'No se pudo mover la tarea');
      }
    },
    // handleEditTask se declara más abajo: se referencia dentro del cuerpo (ya
    // inicializado cuando el usuario arrastra), no en las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, selectedProjectId, deptKey, userKey, onlyMine, board]
  );

  /* ── Dialog helpers ── */
  function closeDialog() {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setTaskForm({ ...EMPTY_TASK_FORM });
  }

  const handleOpenNewTask = useCallback((status: string) => {
    closeDialog();
    setNewTaskStatus(status);
    setTaskDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      assigneeName: task.assigneeName || '',
      assigneeAvatar: task.assigneeAvatar || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      closureCriteria: task.closureCriteria || '',
      blockedReason: task.blockedReason || '',
      blockerOwner: task.blockerOwner || '',
      aiContext: task.aiContext || '',
      tags: task.tags?.join(', ') || '',
      progress: task.progress || 0,
      recurrence: task.recurrence || 'none',
    });
    setNewTaskStatus(task.status);
    setTaskDialogOpen(true);
  }, []);

  function handleSubmitTask() {
    const tagsArr = taskForm.tags
      ? taskForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const payload: any = {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      assigneeId: taskForm.assigneeId || null,
      assigneeName: taskForm.assigneeName,
      assigneeAvatar: taskForm.assigneeAvatar,
      dueDate: taskForm.dueDate || null,
      closureCriteria: taskForm.closureCriteria,
      // Sólo viajan cuando la tarea queda bloqueada; al salir el back los limpia
      ...(newTaskStatus === 'blocked'
        ? { blockedReason: taskForm.blockedReason, blockerOwner: taskForm.blockerOwner }
        : {}),
      aiContext: taskForm.aiContext,
      tags: tagsArr,
      progress: taskForm.progress,
      status: newTaskStatus,
      projectId: selectedProjectId,
      recurrence: taskForm.recurrence,
      // Una rutinaria es plantilla: la fecha la pone el generador en cada copia
      ...(taskForm.recurrence !== 'none' ? { dueDate: null } : {}),
    };
    if (editingTask) updateTaskMut.mutate({ id: editingTask._id, ...payload });
    else createTaskMut.mutate(payload);
  }

  const handleOpenMyTask = useCallback(
    (task: Task) => {
      if (task.projectId) setSelectedProjectId(task.projectId);
      setViewTab('board');
      handleEditTask(task);
    },
    [handleEditTask]
  );

  const totalTasks = filteredBoard?.allTotal || 0;
  const doneTasks = statusCounts['done'] || 0;
  const projectProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Box
      display="flex"
      flex={1}
      position="relative"
      flexDirection="column"
      overflow="hidden"
      sx={{
        bgcolor: isDark
          ? alpha(theme.palette.common.black, 0.2)
          : alpha(theme.palette.common.black, 0.015),
      }}
      p={{ xs: 1.5, sm: 2 }}
    >
      {/* ═══ Compact Header ═══ */}
      <Container
        sx={{ mb: 0.75 }}
        disableGutters={!mdUp}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flex={1}
            minWidth={0}
          >
            <IconButton
              size="small"
              onClick={() => push('/admin/applications/projects-board')}
              sx={{ p: 0.5 }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight={800}
              letterSpacing={-0.5}
              noWrap
            >
              {selectedProject?.name || 'Tasks'}
            </Typography>
            {selectedProject?.identifier && (
              <Chip
                label={selectedProject.identifier}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: 10,
                  bgcolor: alpha(selectedProject.color || theme.palette.primary.main, 0.12),
                  color: selectedProject.color || theme.palette.primary.main,
                  height: 20,
                }}
              />
            )}
            {totalTasks > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.5, fontSize: 11, whiteSpace: 'nowrap' }}
              >
                {doneTasks}/{totalTasks} done · {projectProgress}%
              </Typography>
            )}
          </Stack>
          <Stack
            direction="row"
            spacing={0.75}
            flexShrink={0}
          >
            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<SmartToyRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => setAiDialogOpen(true)}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 11,
                py: 0.3,
                px: 1.25,
              }}
            >
              AI
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => setNewProjectOpen(true)}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 11,
                py: 0.3,
                px: 1.25,
              }}
            >
              Project
            </Button>
            <Button
              variant="contained"
              size="small"
              disableElevation
              startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleOpenNewTask('todo')}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 11,
                py: 0.3,
                px: 1.25,
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
        <Container
          disableGutters={!mdUp}
          maxWidth={customization.stretch ? false : 'xl'}
          sx={{ mb: 0.5 }}
        >
          <LinearProgress
            variant="determinate"
            value={projectProgress}
            sx={{
              height: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.divider, 0.15),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${
                  projectProgress === 100 ? theme.palette.success.main : theme.palette.primary.light
                })`,
              },
            }}
          />
        </Container>
      )}
      {/* ═══ View Toggle: Board vs My Tasks ═══ */}
      <Container
        disableGutters={!mdUp}
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ mb: 1 }}
      >
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
              minHeight: 32,
              py: 0,
              px: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 12,
              gap: 0.5,
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
          <Tab
            value="routines"
            icon={<RepeatRoundedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label="Rutinarias"
          />
        </Tabs>
      </Container>
      {/* ═══ MY TASKS VIEW ═══ */}
      {viewTab === 'my_tasks' && (
        <Container
          disableGutters={!mdUp}
          maxWidth={customization.stretch ? false : 'xl'}
          sx={{ flex: 1, overflow: 'auto', pb: 4 }}
        >
          <MyTasksView
            loading={loadingMyTasks}
            tasks={myTasks}
            onOpenTask={handleOpenMyTask}
          />
        </Container>
      )}
      {/* ═══ RUTINARIAS ═══ */}
      {viewTab === 'routines' && (
        <Container
          disableGutters={!mdUp}
          maxWidth={customization.stretch ? false : 'xl'}
          sx={{ flex: 1, overflow: 'auto', pb: 4 }}
        >
          <RoutinesView
            loading={loadingRoutines}
            routines={routines}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </Container>
      )}
      {/* ═══ BOARD VIEW: Project Tabs + Kanban ═══ */}
      {viewTab === 'board' && (
        <BoardView
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          loadingProjects={loadingProjects}
          loadingBoard={loadingBoard}
          filteredBoard={filteredBoard}
          statusCounts={statusCounts}
          departments={departments}
          selectedDepts={selectedDepts}
          onDeptsChange={setSelectedDepts}
          teamMembers={teamMembers}
          selectedUsers={selectedUsers}
          onUsersChange={setSelectedUsers}
          onlyMine={onlyMine}
          onToggleOnlyMine={() => setOnlyMine(!onlyMine)}
          search={search}
          onSearchChange={setSearch}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onClearFilters={() => {
            setSelectedDepts([]);
            setSelectedUsers([]);
            setSearch('');
            setPriorityFilter('all');
          }}
          onDragEnd={handleDragEnd}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleOpenNewTask}
          onCreateProject={() => setNewProjectOpen(true)}
        />
      )}
      {/* ═══ Task Detail Dialog ═══ */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          editingTask={editingTask}
          form={taskForm}
          setForm={setTaskForm}
          status={newTaskStatus}
          onStatusChange={setNewTaskStatus}
          teamMembers={teamMembers}
          submitting={createTaskMut.isPending || updateTaskMut.isPending}
          onClose={closeDialog}
          onSubmit={handleSubmitTask}
        />
      )}
      {/* ═══ New Project Dialog ═══ */}
      {newProjectOpen && (
        <ProjectDialog
          open={newProjectOpen}
          form={projectForm}
          setForm={setProjectForm}
          submitting={createProjectMut.isPending}
          onClose={() => setNewProjectOpen(false)}
          onSubmit={() => createProjectMut.mutate(projectForm)}
        />
      )}
      {/* ═══ AI Dialog ═══ */}
      {aiDialogOpen && (
        <AiDialog
          open={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          aiContext={aiContext}
        />
      )}
    </Box>
  );
}

export default Tasks;
