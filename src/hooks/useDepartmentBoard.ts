'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DropResult } from '@hello-pangea/dnd';

import { departmentService } from '@/services/department.service';
import { api } from '@/libs/axios';
import { User } from '@/contexts/auth/user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Stable user ID extraction */
export function getUserId(user: any): string {
  return user.id || user._id || '';
}

/** Initials from user name */
export function getInitials(user: User): string {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

/** Normalize department ID from different user shapes */
function normalizeDeptId(user: any): string | null {
  if (!user) return null;
  if (user.departmentId && typeof user.departmentId === 'string') return user.departmentId;
  if (user.department?._id) return user.department._id;
  if (user.departmentId?._id) return user.departmentId._id;
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

// ─── Slim user type (only fields we actually need) ────────────────────────────

type SlimUser = Pick<User, 'firstName' | 'lastName' | 'role' | 'profileImage'> & {
  id?: string;
  _id?: string;
  avatar?: string;
  departmentId?: any;
  department?: any;
};

/** Select only the fields we need to avoid holding full user objects in memory */
function selectSlimUsers(users: User[]): SlimUser[] {
  return users.map((u: any) => ({
    id: u.id || u._id,
    _id: u._id || u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    profileImage: u.profileImage,
    avatar: u.avatar,
    departmentId: u.departmentId,
    department: u.department,
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDepartmentBoard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptManagerOpen, setDeptManagerOpen] = useState(false);
  const [localAssignments, setLocalAssignments] = useState<Record<string, string | null>>({});

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
    queryKey: ['users-departments'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return selectSlimUsers(res.data);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // ── Mutations ────────────────────────────────────────────────────

  const assignMutation = useMutation({
    mutationFn: ({ userId, departmentId }: { userId: string; departmentId: string | null }) =>
      api.patch(`/auth/users/profile/${userId}`, { departmentId }),
  });

  // ── Derived state ────────────────────────────────────────────────

  const getEffectiveDeptId = useCallback(
    (user: any): string | null => {
      const uid = getUserId(user);
      if (uid in localAssignments) return localAssignments[uid];
      return normalizeDeptId(user);
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
      // Optimistic local update
      setLocalAssignments((prev) => ({ ...prev, [userId]: toId }));

      assignMutation.mutate(
        { userId, departmentId: toId },
        {
          onSuccess: () => {
            // Refetch ONCE (not twice like before)
            refetchUsers().then(() => {
              setLocalAssignments((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
              });
            });
            toast.success('Department updated');
          },
          onError: () => {
            // Rollback optimistic update
            setLocalAssignments((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
            toast.error('Failed to update department');
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
    users: users as User[],
    isLoading,
    columnUsers: columnUsers as Record<string, User[]>,
    unassignedUsers: unassignedUsers as User[],
    totalUsers: users.length,

    // Actions
    handleDragEnd,
    handleAddMember,
    refresh,
    openDeptManager,
    closeDeptManager,
  };
}
