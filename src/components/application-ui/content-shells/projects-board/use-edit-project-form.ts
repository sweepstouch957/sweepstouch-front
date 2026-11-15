'use client';

import { departmentService } from '@/services/department.service';
import type { Project } from '@/services/task.service';
import { isInternalStaff } from '@/utils/staff';
import { useQuery } from '@tanstack/react-query';
import { isPast } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EMPTY_FORM, PROJECT_COLORS } from './constants';
import type { ProjectFormValues } from './project-form';

/** Formulario del drawer de edición: valores del proyecto, área dueña y miembros. */
export function useEditProjectForm({
  project,
  allUsers,
  onSave,
}: {
  project: Project | null;
  allUsers: any[];
  onSave: (id: string, data: any) => void;
}) {
  const { register, control, handleSubmit, reset } = useForm<ProjectFormValues>({
    defaultValues: EMPTY_FORM,
  });
  const [memberIds, setMemberIds] = useState<string[]>([]);

  // Áreas para elegir la dueña del proyecto (misma queryKey que el resto: se comparte)
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  /* sync form when project changes — antes era un setState dentro de useMemo
     (state derivado en pleno render); ahora es un reset del form en un efecto. */
  useEffect(() => {
    if (!project) return;
    reset({
      name: project.name || '',
      description: project.description || '',
      color: project.color || PROJECT_COLORS[0],
      tags: (project.tags || []).join(', '),
      workflowStatus: project.workflowStatus || 'not_started',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
      type: project.type || 'project',
      departmentId: project.departmentId || '',
    });
    setMemberIds(project.memberIds || []);
  }, [project, reset]);

  const teamMembers = useMemo(() => allUsers.filter(isInternalStaff), [allUsers]);

  const memberObjects = useMemo(() => {
    const memberIdSet = new Set(memberIds);
    return teamMembers.filter((u: any) => memberIdSet.has(u.id || u._id));
  }, [teamMembers, memberIds]);

  const nonMembers = useMemo(() => {
    const memberIdSet = new Set(memberIds);
    return teamMembers.filter((u: any) => !memberIdSet.has(u.id || u._id));
  }, [teamMembers, memberIds]);

  function addMember(user: any) {
    setMemberIds((prev) => [...prev, user.id || user._id]);
  }
  function removeMember(userId: string) {
    setMemberIds((prev) => prev.filter((id) => id !== userId));
  }

  const handleSave = handleSubmit((values) => {
    if (!project) return;
    onSave(project._id, {
      ...values,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      startDate: values.startDate || null,
      dueDate: values.dueDate || null,
      departmentId: values.departmentId || null,
      memberIds,
    });
  });

  const isOverdue =
    project?.dueDate && isPast(new Date(project.dueDate)) && project.workflowStatus !== 'completed';

  return {
    register,
    control,
    memberIds,
    departments,
    memberObjects,
    nonMembers,
    addMember,
    removeMember,
    handleSave,
    isOverdue,
  };
}
