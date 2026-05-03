'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DropResult } from '@hello-pangea/dnd';

import { departmentService } from '@/services/department.service';
import { api } from '@/libs/axios';
import { User } from '@/contexts/auth/user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Stable user ID extraction */
export function getUserId(user: any): string {
  return user._id || user.id || '';
}

/** Initials from user name */
export function getInitials(user: any): string {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

/** Normalize department ID — handles all possible shapes from the API */
function normalizeDeptId(user: any): string | null {
  if (!user) return null;
  // departmentId is a plain string ObjectId in the User model
  const did = user.departmentId;
  if (did && typeof did === 'string') return did;
  // In case it's populated as an object
  if (did && typeof did === 'object' && did._id) return did._id;
  return null;
}

// ─── Role style map ───────────────────────────────────────────────────────────

export const ROLE_STYLE: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: '#f44336' },
  design: { label: 'Design', color: '#e91e63' },
  campaign_manager: { label: 'Campaign Mgr', color: '#9c27b0' },
  general_manager: { label: 'General Mgr', color: '#3f51b5' },
  marketing: { label: 'Marketing', color: '#ff9800' },
  merchant_manager: { label: 'Merchant Mgr', color: '#009688' },
  promotor_manager: { label: 'Promotor Mgr', color: '#00bcd4' },
  tecnico: { label: 'Técnico', color: '#607d8b' },
  cashier: { label: 'Cashier', color: '#795548' },
  merchant: { label: 'Merchant', color: '#4caf50' },
  promotor: { label: 'Promotor', color: '#8bc34a' },
};

/**
 * Only staff roles — we don't show merchants/cashiers/promotors in the department board.
 * This drastically reduces the number of users fetched + rendered.
 */
const STAFF_ROLES = [
  'admin', 'design', 'campaign_manager', 'general_manager',
  'marketing', 'merchant_manager', 'promotor_manager', 'tecnico',
];

// ─── Slim user type (only fields we actually need) ────────────────────────────

interface SlimUser {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  avatar?: string;
  departmentId?: string | null;
}

/** Select only the fields we need — avoids holding populated store objects etc. */
function selectSlimUsers(rawUsers: any[]): SlimUser[] {
  return rawUsers.map((u: any) => ({
    id: u._id || u.id,
    _id: u._id || u.id,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    role: u.role || '',
    profileImage: u.profileImage || u.avatar || undefined,
    avatar: u.avatar || undefined,
    departmentId: normalizeDeptId(u),
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDepartmentBoard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptManagerOpen, setDeptManagerOpen] = useState(false);
  const [localAssignments, setLocalAssignments] = useState<Record<string, string | null>>({});
  const mutatingRef = useRef(false);

  // ── Queries ──────────────────────────────────────────────────────

  const {
    data: departments = [],
    refetch: refetchDepts,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  const {
    data: users = [],
    isLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['dept-board-users'],
    queryFn: async () => {
      // Server-side: only staff roles, lean (no store populate), minimal fields
      const res = await api.get('/auth/users', {
        params: {
          role: STAFF_ROLES.join(','),
          lean: 'true',
          select: 'firstName,lastName,role,profileImage,departmentId',
        },
      });
      const allUsers: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return selectSlimUsers(allUsers);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  // ── Mutations ────────────────────────────────────────────────────

  const assignMutation = useMutation({
    mutationFn: ({ userId, departmentId }: { userId: string; departmentId: string | null }) =>
      api.patch(`/auth/users/profile/${userId}`, { departmentId }),
  });

  // ── Derived state ────────────────────────────────────────────────

  const getEffectiveDeptId = useCallback(
    (user: SlimUser): string | null => {
      const uid = getUserId(user);
      if (uid in localAssignments) return localAssignments[uid];
      return user.departmentId ?? null;
    },
    [localAssignments]
  );

  const { columnUsers, unassignedUsers } = useMemo(() => {
    const deptMap: Record<string, SlimUser[]> = {};
    for (const d of departments) {
      deptMap[d._id] = [];
    }
    const unassigned: SlimUser[] = [];

    for (const u of users) {
      const dId = getEffectiveDeptId(u);
      if (dId && deptMap[dId]) {
        deptMap[dId].push(u);
      } else {
        unassigned.push(u);
      }
    }
    return { columnUsers: deptMap, unassignedUsers: unassigned };
  }, [users, departments, getEffectiveDeptId]);

  // ── Actions ──────────────────────────────────────────────────────

  const doAssign = useCallback(
    (userId: string, toId: string | null, fromId: string | null) => {
      if (toId === fromId) return;
      if (mutatingRef.current) return; // Prevent double-clicks
      mutatingRef.current = true;

      // Optimistic local update — move card immediately
      setLocalAssignments((prev) => ({ ...prev, [userId]: toId }));

      assignMutation.mutate(
        { userId, departmentId: toId },
        {
          onSuccess: () => {
            toast.success('Departamento actualizado');
            // Refetch server data, then clear local override
            refetchUsers().finally(() => {
              setLocalAssignments((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
              });
              mutatingRef.current = false;
            });
          },
          onError: (err: any) => {
            console.error('[dept] Assignment failed:', err);
            // Rollback optimistic update
            setLocalAssignments((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
            toast.error(err?.response?.data?.message || 'Error al actualizar departamento');
            mutatingRef.current = false;
          },
        }
      );
    },
    [assignMutation, refetchUsers]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const userId = result.draggableId;
      const fromId = result.source.droppableId === 'unassigned' ? null : result.source.droppableId;
      const toId = result.destination.droppableId === 'unassigned' ? null : result.destination.droppableId;
      doAssign(userId, toId, fromId);
    },
    [doAssign]
  );

  const handleAddMember = useCallback(
    (userId: string, deptId: string | null) => {
      const user = users.find((u) => getUserId(u) === userId);
      const fromId = user ? getEffectiveDeptId(user) : null;
      doAssign(userId, deptId, fromId);
    },
    [users, getEffectiveDeptId, doAssign]
  );

  const refresh = useCallback(() => {
    refetchUsers();
    refetchDepts();
  }, [refetchUsers, refetchDepts]);

  const openDeptManager = useCallback(() => setDeptManagerOpen(true), []);
  const closeDeptManager = useCallback(() => {
    setDeptManagerOpen(false);
    refetchDepts();
    refetchUsers();
  }, [refetchDepts, refetchUsers]);

  return {
    // State
    search,
    setSearch,
    deptManagerOpen,

    // Data
    departments,
    users: users as unknown as User[],
    isLoading,
    columnUsers: columnUsers as unknown as Record<string, User[]>,
    unassignedUsers: unassignedUsers as unknown as User[],
    totalUsers: users.length,

    // Actions
    handleDragEnd,
    handleAddMember,
    refresh,
    openDeptManager,
    closeDeptManager,
  };
}
