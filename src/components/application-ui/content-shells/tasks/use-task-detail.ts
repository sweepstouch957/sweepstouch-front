'use client';

import { usersApi } from '@/mocks/users';
import { departmentService } from '@/services/department.service';
import { epicService } from '@/services/epic.service';
import { Task, taskClient, type TaskFile } from '@/services/task.service';
import { uploadTaskEvidence } from '@/services/upload.service';
import { combineDueDate, timeInputValue, toDateInput } from '@/utils/due-date';
import { isInternalStaff, STAFF_ROLE_QUERY } from '@/utils/staff';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

/** Sólo se manda lo que cambió: un PATCH con todo pisa lo que otro acaba de tocar. */
export type Draft = Partial<Task> & { dueDateInput?: string; dueTimeInput?: string };

/**
 * Qué acción toca ahora. Se devuelve como dato, no como JSX: un hook que
 * devuelve elementos no es un hook, y así el icono lo elige quien pinta.
 */
export type PrimaryAction = {
  label: string;
  to: string;
  icon: 'start' | 'close' | 'reopen' | 'unblock';
  role: 'primary' | 'secondary' | 'success' | 'warning';
};

function primaryFor(status: string): PrimaryAction {
  if (status === 'done')
    return { label: 'Reabrir', to: 'in_progress', icon: 'reopen', role: 'secondary' };
  if (status === 'blocked')
    return { label: 'Destrabar', to: 'in_progress', icon: 'unblock', role: 'warning' };
  if (status === 'in_progress' || status === 'in_review')
    return { label: 'Cerrar tarea', to: 'done', icon: 'close', role: 'success' };
  return { label: 'Empezar ahora', to: 'in_progress', icon: 'start', role: 'primary' };
}

/**
 * Toda la lógica del detalle de una tarea: lecturas, escrituras y el borrador
 * de edición. La vista sólo compone y pinta.
 */
export function useTaskDetail(taskId: string) {
  const queryClient = useQueryClient();

  /**
   * El board siembra ['task', id] antes de navegar, así que normalmente esto ya
   * tiene datos y la página abre pintada. `isLoading` sólo es true cuando se
   * entra por link directo (WhatsApp, correo) y no hay nada en caché.
   */
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskClient.getTask(taskId),
    enabled: !!taskId,
    staleTime: 15_000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'task-board'],
    queryFn: () =>
      usersApi.getUsers({
        lean: true,
        role: STAFF_ROLE_QUERY.join(','),
        select: 'firstName,lastName,email,role,position,profileImage,departmentId',
      }),
    staleTime: 5 * 60_000,
  });
  const teamMembers = useMemo(() => allUsers.filter(isInternalStaff), [allUsers]);

  const { data: epics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicService.list(),
    staleTime: 120_000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
  });

  /* ── Edición: se escribe en un borrador y se guarda cuando el usuario decide ── */
  const [draft, setDraft] = useState<Draft>({});
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) setFiles(task.files || []);
  }, [task]);

  const dirty = Object.keys(draft).length > 0;

  /** El valor vigente: lo del borrador si se tocó, si no lo del servidor. */
  const value = <K extends keyof Task>(k: K): any =>
    draft[k as keyof Draft] !== undefined ? (draft as any)[k] : (task as any)?.[k];

  const set = (patch: Draft) => setDraft((d) => ({ ...d, ...patch }));
  const discard = () => setDraft({});

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (patch: Draft) => {
      const { dueDateInput, dueTimeInput, ...rest } = patch;
      const body: any = { ...rest };
      if (dueDateInput !== undefined || dueTimeInput !== undefined) {
        body.dueDate = combineDueDate(
          dueDateInput ?? toDateInput(task?.dueDate),
          dueTimeInput ?? timeInputValue(task?.dueDate)
        );
      }
      return taskClient.updateTask(taskId, body);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['task', taskId], updated);
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setDraft({});
      toast.success('Guardado');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  /** Cambiar de estado se aplica al toque: es lo que más se toca y no es "editar". */
  const { mutate: setStatus, isPending: changingStatus } = useMutation({
    mutationFn: (status: string) => taskClient.updateTask(taskId, { status } as any),
    onSuccess: (updated) => {
      queryClient.setQueryData(['task', taskId], updated);
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo cambiar el estado'),
  });

  async function uploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setUploading(true);
    try {
      for (const f of picked) {
        const url = await uploadTaskEvidence(f);
        const updated = await taskClient.addAttachment(taskId, {
          url,
          name: f.name,
          type: f.type,
          size: f.size,
        });
        setFiles(updated.files || []);
      }
      toast.success(picked.length === 1 ? 'Evidencia adjunta' : `${picked.length} evidencias`);
    } catch {
      toast.error('No se pudo subir la evidencia');
    } finally {
      setUploading(false);
    }
  }

  async function share(kind: 'pdf' | 'panel') {
    try {
      const links = await taskClient.getTaskLinks(taskId);
      if (kind === 'pdf') return window.open(links.pdf, '_blank', 'noopener');
      await navigator.clipboard.writeText(links.panel);
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudieron generar los enlaces');
    }
  }

  /* ── Derivados ─────────────────────────────────────────────────────────── */
  const status = value('status');
  const epic = epics.find((e) => e._id === value('epicId'));
  const assignee = teamMembers.find((u: any) => (u._id || u.id) === value('assigneeId'));
  const overdue = Boolean(
    task?.dueDate && status !== 'done' && new Date(task.dueDate).getTime() < Date.now()
  );

  return {
    // datos
    task,
    isLoading,
    teamMembers,
    epics,
    departments,
    // borrador
    draft,
    dirty,
    value,
    set,
    discard,
    // escrituras
    save,
    saving,
    setStatus,
    changingStatus,
    // evidencias y enlaces
    files,
    uploading,
    uploadEvidence,
    share,
    // derivados
    status,
    epic,
    assignee,
    overdue,
    primary: primaryFor(status),
  };
}

export type TaskDetailController = ReturnType<typeof useTaskDetail>;
