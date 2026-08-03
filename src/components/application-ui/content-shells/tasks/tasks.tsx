'use client';

import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/mocks/users';
import { isInternalStaff, STAFF_ROLE_QUERY } from '@/utils/staff';
import { combineDueDate } from '@/utils/due-date';
import { Department, departmentService } from '@/services/department.service';
import { epicService } from '@/services/epic.service';
import { Task, taskClient, type BoardData } from '@/services/task.service';
import { type DropResult } from '@hello-pangea/dnd';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import DashboardCustomizeRoundedIcon from '@mui/icons-material/DashboardCustomizeRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Fab,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
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
import { HEADER_HEIGHT } from 'src/theme/utils';
import { AiDialog } from './ai-dialog';
import { BoardView } from './board-view';
import { BOARD_STATUSES, EpicsContext, STATUS_LABEL } from './constants';
import { MyTasksView } from './my-tasks-view';
import { ProjectDialog } from './project-dialog';
import { RoutinesView } from './routines-view';
import { TaskDialog, type TaskFormValues } from './task-dialog';
import { TemplateDialog } from './template-dialog';
import { TopicReportDialog } from './topic-report-dialog';

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
  /** Agrupadores: épica seleccionada y "donde me mencionaron". */
  const [epicFilter, setEpicFilter] = useState('all');
  const [onlyMentions, setOnlyMentions] = useState(false);
  const { user: authUser } = useAuth();

  /* ── Project ── */
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /* ── Task detail dialog ──
     El formulario vive dentro del diálogo (react-hook-form): aquí sólo se
     guarda QUÉ tarea se está editando, no lo que el usuario va escribiendo. */
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');

  /* ── New project dialog ── */
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  /* ── AI dialog ── */
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  /* ── Reporte por tema ("cómo va RCS") — sólo Dirección y CEO ── */
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);

  /* ── Plantillas de tarea ── */
  const [templatesOpen, setTemplatesOpen] = useState(false);

  /** Menú "más" de móvil: las acciones secundarias no caben en la cabecera. */
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);

  /* ── Data ── */
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
  });

  /** Épicas: pocas y estables, se traen todas y se resuelven en cliente. */
  const { data: epics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicService.list(),
    staleTime: 120_000,
  });

  const epicsById = useMemo(
    () => Object.fromEntries(epics.map((e) => [e._id, e])),
    [epics]
  );

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => taskClient.getProjects(),
    staleTime: 60_000,
  });

  /**
   * Sólo el equipo interno y sólo los campos que la pantalla pinta. Antes traía
   * TODOS los usuarios de la plataforma (merchants, cajeras, promotores) con el
   * documento completo: era lo más pesado de la página.
   */
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'task-board'],
    queryFn: () =>
      usersApi.getUsers({
        lean: true,
        role: STAFF_ROLE_QUERY.join(','),
        select: 'firstName,lastName,email,role,position,profileImage,departmentId',
      }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Sólo equipo interno: los managers de promotoras de campo no llevan tareas
  const teamMembers = useMemo(() => allUsers.filter(isInternalStaff), [allUsers]);

  /**
   * Reportes de estado ("cómo va X") = Dirección y CEO. Se resuelve por el área
   * del usuario y, como respaldo, por su rol de permisos.
   */
  const canSeeReports = useMemo(() => {
    const myDept = departments.find((d) => d._id === (authUser as any)?.departmentId);
    const slug = (myDept?.slug || myDept?.name || '').toLowerCase();
    if (['direccion', 'dirección', 'ceo', 'product'].includes(slug)) return true;
    return ['admin', 'general_manager', 'assistant'].includes((authUser as any)?.role);
  }, [departments, authUser]);

  /* ── Auto-select project from URL or first ── */
  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      const target = urlProjectId && projects.find((p) => p._id === urlProjectId);
      setSelectedProjectId(target ? target._id : projects[0]._id);
    }
  }, [projects, selectedProjectId, urlProjectId]);

  /**
   * Deep link ?taskId= — los avisos de WhatsApp y los correos de mención ya
   * enviados apuntan acá. Ahora la tarea vive en su propia página, así que se
   * redirige en vez de abrir un modal: los enlaces viejos siguen sirviendo.
   */
  React.useEffect(() => {
    if (!urlTaskId || openedDeepLink.current === urlTaskId) return;
    openedDeepLink.current = urlTaskId;
    push(`/admin/applications/tasks/${urlTaskId}`);
  }, [urlTaskId, push]);

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
    queryKey: ['board', selectedProjectId, deptKey, userKey],
    queryFn: () =>
      taskClient.getBoard(selectedProjectId!, {
        assigneeIds: activeUserIds.length > 0 ? activeUserIds : undefined,
        departmentIds: activeDeptIds.length > 0 ? activeDeptIds : undefined,
      }),
    enabled: !!selectedProjectId,
    staleTime: 60_000,
    // Al cambiar de filtro se mantiene el board anterior en pantalla: sin
    // parpadeo y sin spinner en cada toque.
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

  /**
   * Todos los ids con los que puede figurar el usuario logueado como asignado.
   * "Sólo mías" daba 0 porque comparaba contra un único id que no siempre es el
   * que quedó guardado en la tarea; ahora se resuelve también por email.
   */
  const myIds = useMemo(() => {
    const ids = new Set<string>();
    const a: any = authUser;
    if (a?._id) ids.add(String(a._id));
    if (a?.id) ids.add(String(a.id));
    if (a?.email) {
      for (const u of allUsers as any[]) {
        if (u?.email && String(u.email).toLowerCase() === String(a.email).toLowerCase()) {
          if (u._id) ids.add(String(u._id));
          if (u.id) ids.add(String(u.id));
        }
      }
    }
    return ids;
  }, [authUser, allUsers]);

  /** El id con el que realmente quedan guardadas mis tareas (para /tasks/my). */
  const myResolvedId = useMemo(() => {
    const a: any = authUser;
    const byEmail = (allUsers as any[]).find(
      (u) => a?.email && u?.email && String(u.email).toLowerCase() === String(a.email).toLowerCase()
    );
    return String(byEmail?._id || byEmail?.id || a?._id || a?.id || '');
  }, [authUser, allUsers]);

  const { data: aiContext } = useQuery({
    queryKey: ['ai-context'],
    queryFn: () => taskClient.getAiContext(),
    enabled: aiDialogOpen,
  });

  /* ── My Tasks query ── */
  const { data: myTasks = [], isLoading: loadingMyTasks } = useQuery({
    queryKey: ['my-tasks', myResolvedId],
    queryFn: () => taskClient.getMyTasks(myResolvedId),
    enabled: viewTab === 'my_tasks' && !!myResolvedId,
    staleTime: 30_000,
  });

  /* ── Rutinarias (plantillas — no salen en el board) ── */
  const { data: routines = [], isLoading: loadingRoutines } = useQuery({
    queryKey: ['routines', selectedProjectId],
    queryFn: () => taskClient.getRoutines(selectedProjectId || undefined),
    enabled: viewTab === 'routines',
    staleTime: 30_000,
  });

  /* ── Filtros de cliente: búsqueda, prioridad y "sólo mías" ──
     "Sólo mías" no vuelve al backend: es un toggle sobre lo ya cargado. */
  const filteredBoard = useMemo(() => {
    if (!board) return null;
    let filtered = Object.values(board.tasks);

    if (onlyMine) {
      filtered = filtered.filter((t) => t.assigneeId && myIds.has(String(t.assigneeId)));
    }

    // "Me mencionaron": dónde pidieron mi ayuda, aunque la tarea no sea mía
    if (onlyMentions) {
      filtered = filtered.filter((t) =>
        (t.mentionedUserIds || []).some((id) => myIds.has(String(id)))
      );
    }

    if (epicFilter !== 'all') {
      filtered =
        epicFilter === 'none'
          ? filtered.filter((t) => !t.epicId)
          : filtered.filter((t) => t.epicId === epicFilter);
    }

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
    BOARD_STATUSES.forEach((k) => {
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
  }, [board, deferredSearch, priorityFilter, onlyMine, onlyMentions, epicFilter, myIds]);

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
  const { mutate: createTask, isPending: creatingTask } = useMutation({
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
  const { mutate: updateTask, isPending: updatingTask } = useMutation({
    mutationFn: ({ id, ...p }: any) => taskClient.updateTask(id, p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Tarea actualizada');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'No se pudo actualizar la tarea'),
  });
  // `mutate` sí es estable en react-query v5; el objeto de la mutación NO. Antes
  // se dependía del objeto: el callback cambiaba en cada render y tumbaba el
  // React.memo de columnas y tarjetas.
  const { mutate: deleteTask } = useMutation({
    mutationFn: (id: string) => taskClient.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Task deleted');
    },
  });
  const handleDeleteTask = useCallback((id: string) => deleteTask(id), [deleteTask]);
  const { mutate: createProject, isPending: creatingProject } = useMutation({
    mutationFn: (p: any) => taskClient.createProject(p),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjectId(d._id);
      setNewProjectOpen(false);
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
      const qKey = ['board', selectedProjectId, deptKey, userKey];

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
    [queryClient, selectedProjectId, deptKey, userKey, board]
  );

  /* ── Dialog helpers ── */
  const closeDialog = useCallback(() => {
    setTaskDialogOpen(false);
    setEditingTask(null);
  }, []);

  const handleOpenNewTask = useCallback((status: string) => {
    setEditingTask(null);
    setNewTaskStatus(status);
    setTaskDialogOpen(true);
  }, []);

  /**
   * Abrir una tarea la lleva a su propia página. El modal se quedó sólo para
   * CREAR: ahí la captura rápida gana; para trabajarla hacen falta comentarios,
   * evidencias y bitácora, y eso no cabe en una ventanita.
   */
  const handleOpenTask = useCallback(
    (task: Task) => {
      /**
       * La tarea ya está en memoria: se siembra la caché con la copia del board
       * para que la página abra pintada y sin spinner. El fetch completo (que
       * suma bitácora y evidencias) llega después y sólo rellena.
       */
      queryClient.setQueryData(['task', task._id], (prev: Task | undefined) => prev ?? task);
      queryClient.prefetchQuery({
        queryKey: ['task', task._id],
        queryFn: () => taskClient.getTask(task._id),
      });
      push(`/admin/applications/tasks/${task._id}`);
    },
    [push, queryClient]
  );

  /** Bloquear exige motivo: eso sí se resuelve en el diálogo, sin salir del board. */
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setNewTaskStatus(task.status);
    setTaskDialogOpen(true);
  }, []);

  const handleSubmitTask = useCallback(
    (values: TaskFormValues) => {
      const tagsArr = values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const payload: any = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigneeId: values.assigneeId || null,
        assigneeName: values.assigneeName,
        assigneeAvatar: values.assigneeAvatar,
        // Con hora si la eligieron; sin hora vence al final del día
        dueDate: combineDueDate(values.dueDate, values.dueTime),
        closureCriteria: values.closureCriteria,
        beneficiary: values.beneficiary,
        nextStep: values.nextStep,
        impact: values.impact,
        // Sólo viaja si el usuario escribió un motivo al mover la fecha
        ...(values.rescheduleReason ? { rescheduleReason: values.rescheduleReason } : {}),
        // Sólo viajan cuando la tarea queda bloqueada; al salir el back los limpia
        ...(values.status === 'blocked'
          ? { blockedReason: values.blockedReason, blockerOwner: values.blockerOwner }
          : {}),
        epicId: values.epicId || null,
        storeId: values.storeId || null,
        storeName: values.storeName || '',
        // Sólo al crear: sirve para contar de qué molde salió cada tarea
        ...(editingTask ? {} : { templateId: values.templateId || null }),
        aiContext: values.aiContext,
        tags: tagsArr,
        progress: values.progress,
        status: values.status,
        projectId: selectedProjectId,
        recurrence: values.recurrence,
        // Una rutinaria es plantilla: la fecha la pone el generador en cada copia
        ...(values.recurrence !== 'none' ? { dueDate: null } : {}),
      };
      if (editingTask) updateTask({ id: editingTask._id, ...payload });
      else createTask(payload);
    },
    [editingTask, selectedProjectId, updateTask, createTask]
  );

  const handleOpenMyTask = handleOpenTask;

  /* Referencias estables para BoardView: si cambian en cada render, su memo y
     el de las columnas no sirven de nada. */
  const handleToggleOnlyMine = useCallback(() => setOnlyMine((v) => !v), []);
  const handleToggleOnlyMentions = useCallback(() => setOnlyMentions((v) => !v), []);
  const handleClearFilters = useCallback(() => {
    setSelectedDepts([]);
    setSelectedUsers([]);
    setSearch('');
    setPriorityFilter('all');
    setEpicFilter('all');
    setOnlyMentions(false);
  }, []);
  const handleCreateProjectDialog = useCallback(() => setNewProjectOpen(true), []);
  const handleCloseProjectDialog = useCallback(() => setNewProjectOpen(false), []);

  const totalTasks = filteredBoard?.allTotal || 0;
  const doneTasks = statusCounts['done'] || 0;
  const projectProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <EpicsContext.Provider value={epicsById}>
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
        // El shell reserva HEADER_HEIGHT * 1.5 y su navbar mide HEADER_HEIGHT:
        // esa media altura sobrante era la banda gris pegada al navbar.
        mt: `-${HEADER_HEIGHT / 2}px`,
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
          {/* En móvil las acciones secundarias van al menú "más": cinco botones
              apretados no se pueden tocar con el pulgar. */}
          <Stack
            direction="row"
            spacing={0.75}
            flexShrink={0}
            alignItems="center"
          >
            {mdUp ? (
              <>
                {/* "¿Cómo va RCS?" — reportes de estado: Dirección y CEO */}
                {canSeeReports && (
                  <ActionButton
                    color="info"
                    icon={<TravelExploreRoundedIcon sx={{ fontSize: 13 }} />}
                    onClick={() => setTopicDialogOpen(true)}
                    label="Cómo va…"
                  />
                )}
                <ActionButton
                  color="warning"
                  icon={<SmartToyRoundedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => setAiDialogOpen(true)}
                  label="AI"
                />
                <ActionButton
                  icon={<DashboardCustomizeRoundedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => setTemplatesOpen(true)}
                  label="Ajustes"
                />
                <ActionButton
                  icon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => setNewProjectOpen(true)}
                  label="Proyecto"
                />
                <Button
                  variant="contained"
                  size="small"
                  disableElevation
                  startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => handleOpenNewTask('todo')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 11.5,
                    py: 0.5,
                    px: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }}
                >
                  Tarea
                </Button>
              </>
            ) : (
              <IconButton
                aria-label="Más acciones"
                onClick={(e) => setMoreAnchor(e.currentTarget)}
                sx={{ width: 44, height: 44 }}
              >
                <MoreHorizRoundedIcon />
              </IconButton>
            )}
          </Stack>

          <Menu
            anchorEl={moreAnchor}
            open={!!moreAnchor}
            onClose={() => setMoreAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 210 } } }}
          >
            {canSeeReports && (
              <MenuItem
                onClick={() => {
                  setMoreAnchor(null);
                  setTopicDialogOpen(true);
                }}
                sx={{ minHeight: 48, gap: 1.5 }}
              >
                <TravelExploreRoundedIcon sx={{ fontSize: 18 }} /> Cómo va…
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                setAiDialogOpen(true);
              }}
              sx={{ minHeight: 48, gap: 1.5 }}
            >
              <SmartToyRoundedIcon sx={{ fontSize: 18 }} /> Asistente AI
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                setTemplatesOpen(true);
              }}
              sx={{ minHeight: 48, gap: 1.5 }}
            >
              <DashboardCustomizeRoundedIcon sx={{ fontSize: 18 }} /> Plantillas, épicas y etiquetas
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                setNewProjectOpen(true);
              }}
              sx={{ minHeight: 48, gap: 1.5 }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} /> Nuevo proyecto
            </MenuItem>
          </Menu>
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
          onToggleOnlyMine={handleToggleOnlyMine}
          onlyMentions={onlyMentions}
          onToggleOnlyMentions={handleToggleOnlyMentions}
          epics={epics}
          epicFilter={epicFilter}
          onEpicFilterChange={setEpicFilter}
          search={search}
          onSearchChange={setSearch}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onClearFilters={handleClearFilters}
          onDragEnd={handleDragEnd}
          onEditTask={handleOpenTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleOpenNewTask}
          onCreateProject={handleCreateProjectDialog}
        />
      )}
      {/* ═══ Task Detail Dialog ═══ */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          editingTask={editingTask}
          initialStatus={newTaskStatus}
          teamMembers={teamMembers}
          epics={epics}
          projectId={selectedProjectId}
          submitting={creatingTask || updatingTask}
          onClose={closeDialog}
          onSubmit={handleSubmitTask}
        />
      )}
      {/* ═══ New Project Dialog ═══ */}
      {newProjectOpen && (
        <ProjectDialog
          open
          submitting={creatingProject}
          onClose={handleCloseProjectDialog}
          onSubmit={createProject}
        />
      )}
      {/* ═══ Plantillas de tarea ═══ */}
      {templatesOpen && (
        <TemplateDialog
          open
          onClose={() => setTemplatesOpen(false)}
          departments={departments}
          projects={projects}
          epics={epics}
          teamMembers={teamMembers}
        />
      )}
      {/* ═══ AI Dialog ═══ */}
      {topicDialogOpen && (
        <TopicReportDialog
          open
          onClose={() => setTopicDialogOpen(false)}
        />
      )}

      {aiDialogOpen && (
        <AiDialog
          open={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          aiContext={aiContext}
        />
      )}

      {/* Crear tarea en móvil: al alcance del pulgar y por encima del scroll */}
      {!mdUp && (
        <Fab
          color="primary"
          aria-label="Nueva tarea"
          onClick={() => handleOpenNewTask('todo')}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(env(safe-area-inset-bottom) + 20px)',
            zIndex: 1200,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          }}
        >
          <AddRoundedIcon />
        </Fab>
      )}
    </Box>
    </EpicsContext.Provider>
  );
}

/** Botón secundario de la cabecera: mismo tamaño y radio en todos. */
function ActionButton({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: React.ReactElement;
  color?: 'info' | 'warning';
  onClick: () => void;
}) {
  return (
    <Button
      variant="outlined"
      size="small"
      color={color}
      startIcon={icon}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 11.5,
        py: 0.5,
        px: 1.5,
      }}
    >
      {label}
    </Button>
  );
}

export default Tasks;
