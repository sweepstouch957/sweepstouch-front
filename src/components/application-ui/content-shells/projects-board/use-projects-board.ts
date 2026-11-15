'use client';

import { usersApi } from '@/mocks/users';
import { taskClient, type Project, type WorkflowStatus } from '@/services/task.service';
import { textHas } from '@/utils/text';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { statusOptions } from './constants';

export function useProjectsBoard() {
  const queryClient = useQueryClient();
  const { push } = useRouter();

  /* ── UI state ── */
  const [toggleView, setToggleView] = useState<string | null>('grid_view');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(9);

  /* ── Dialogs ── */
  const [newProjectOpen, setNewProjectOpen] = useState(false);
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
    queryFn: () => usersApi.getUsers({ lean: true }),
    staleTime: 120_000,
  });

  /* ── Mutations ── */
  const createProjectMut = useMutation({
    mutationFn: (p: any) => taskClient.createProject(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewProjectOpen(false);
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
    if (query)
      result = result.filter(
        (p) => textHas(p.name, query.toLowerCase()) || textHas(p.description, query.toLowerCase())
      );
    if (statusFilter) result = result.filter((p) => p.workflowStatus === statusFilter);
    return result;
  }, [projects, query, statusFilter]);

  const paginated = filtered.slice(page * limit, page * limit + limit);

  const getStatusName = () =>
    statusFilter ? statusOptions.find((o) => o.id === statusFilter)?.name ?? 'All' : 'All';

  function handleOpenBoard(projectId: string) {
    push(`/admin/applications/tasks?projectId=${projectId}`);
  }

  /* ── Summary stats ── */
  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => p.workflowStatus === 'in_progress').length,
      completed: projects.filter((p) => p.workflowStatus === 'completed').length,
      totalTasks: projects.reduce((acc, p) => acc + (p.taskStats?.total ?? 0), 0),
    }),
    [projects]
  );

  return {
    toggleView,
    setToggleView,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    statusAnchorEl,
    setStatusAnchorEl,
    page,
    setPage,
    limit,
    setLimit,
    newProjectOpen,
    setNewProjectOpen,
    aiDialogOpen,
    setAiDialogOpen,
    editingProject,
    setEditingProject,
    projects,
    isLoading,
    aiContext,
    allUsers,
    createProjectMut,
    updateProjectMut,
    deleteProjectMut,
    filtered,
    paginated,
    getStatusName,
    handleOpenBoard,
    stats,
  };
}
