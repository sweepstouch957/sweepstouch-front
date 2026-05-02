'use client';

import React, {
  FC,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';

import { Department, departmentService } from '@/services/department.service';
import { usersApi } from '@/mocks/users';
import { User } from '@/contexts/auth/user';
import { api } from '@/libs/axios';
import DepartmentManager from 'src/components/departments/DepartmentManager';

// ─── Role styling ─────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string, { label: string; color: string }> = {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUserId(user: any): string {
  return user.id || user._id || '';
}

function getInitials(user: User): string {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

function normalizeDeptId(user: any): string | null {
  if (!user) return null;
  if (user.departmentId && typeof user.departmentId === 'string') return user.departmentId;
  if (user.department?._id) return user.department._id;
  if (user.departmentId?._id) return user.departmentId._id;
  return null;
}

// ─── UserCard ────────────────────────────────────────────────────────────────
interface UserCardProps {
  user: User;
  isDragging: boolean;
  innerRef: any;
  draggableProps: any;
  dragHandleProps: any;
}

const UserCard: FC<UserCardProps> = ({ user, isDragging, innerRef, draggableProps, dragHandleProps }) => {
  const theme = useTheme();
  const role = ROLE_STYLE[user.role] ?? { label: user.role, color: '#78909c' };

  return (
    <Card
      ref={innerRef}
      {...draggableProps}
      elevation={0}
      sx={{
        mb: 1,
        borderRadius: 2,
        border: `1px solid ${isDragging ? alpha(role.color, 0.5) : theme.palette.divider}`,
        bgcolor: isDragging ? alpha(role.color, 0.06) : theme.palette.background.paper,
        boxShadow: isDragging
          ? `0 10px 28px ${alpha(theme.palette.common.black, 0.18)}`
          : `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: alpha(role.color, 0.4),
          boxShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.09)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 1.25, py: 1 }}>
        <Box
          {...dragHandleProps}
          sx={{
            color: alpha(theme.palette.text.primary, 0.18),
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            flexShrink: 0,
            '&:hover': { color: alpha(theme.palette.text.primary, 0.45) },
          }}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: 16 }} />
        </Box>

        <Avatar
          src={user.profileImage || (user as any).avatar || undefined}
          sx={{
            width: 32,
            height: 32,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: alpha(role.color, 0.14),
            color: role.color,
            flexShrink: 0,
          }}
        >
          {getInitials(user)}
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} fontSize={12} noWrap lineHeight={1.3}>
            {user.firstName} {user.lastName}
          </Typography>
          <Chip
            label={role.label}
            size="small"
            sx={{
              height: 16,
              fontSize: 9,
              fontWeight: 600,
              bgcolor: alpha(role.color, 0.1),
              color: role.color,
              border: `1px solid ${alpha(role.color, 0.2)}`,
              '& .MuiChip-label': { px: 0.75 },
              mt: 0.2,
              cursor: 'inherit',
            }}
          />
        </Box>
      </Stack>
    </Card>
  );
};

// ─── AddMemberSearch ──────────────────────────────────────────────────────────
interface AddMemberSearchProps {
  options: User[];
  onAssign: (user: User) => void;
  onClose: () => void;
  accentColor: string;
}

const AddMemberSearch: FC<AddMemberSearchProps> = ({ options, onAssign, onClose, accentColor }) => (
  <Box sx={{ mt: 1 }}>
    <Autocomplete
      options={options}
      autoHighlight
      size="small"
      getOptionLabel={(u) => `${u.firstName} ${u.lastName}`}
      onChange={(_, user) => { if (user) onAssign(user); }}
      renderOption={(props, user) => {
        const role = ROLE_STYLE[user.role] ?? { label: user.role, color: '#78909c' };
        return (
          <Box component="li" {...props} key={getUserId(user)}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar
                src={user.profileImage || (user as any).avatar || undefined}
                sx={{ width: 24, height: 24, fontSize: 9, fontWeight: 700, bgcolor: alpha(role.color, 0.14), color: role.color }}
              >
                {getInitials(user)}
              </Avatar>
              <Box>
                <Typography fontSize={11} fontWeight={600} lineHeight={1.2}>{user.firstName} {user.lastName}</Typography>
                <Typography fontSize={9} color="text.secondary">{role.label}</Typography>
              </Box>
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search user..."
          autoFocus
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 12 } }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      )}
      noOptionsText={<Typography fontSize={11} color="text.secondary">No users found</Typography>}
    />
    <Button size="small" onClick={onClose} fullWidth
      sx={{ mt: 0.5, borderRadius: 1.5, fontSize: 11, color: 'text.secondary' }}>
      Cancel
    </Button>
  </Box>
);

// ─── DeptColumn ───────────────────────────────────────────────────────────────
interface DeptColumnProps {
  deptId: string;
  dept: Department | null;
  users: User[];
  searchableUsers: User[];
  onAddMember: (userId: string, deptId: string | null) => void;
  search: string;
}

const DeptColumn: FC<DeptColumnProps> = ({ deptId, dept, users, searchableUsers, onAddMember, search }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [addingMember, setAddingMember] = useState(false);

  const color = dept?.color ?? (isDark ? '#546e7a' : '#90a4ae');
  const name = dept?.name ?? 'Sin asignar';

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q));
  }, [users, search]);

  return (
    // Column must fill parent height via flex
    <Box sx={{ width: 262, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Column header (fixed) ── */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          borderRadius: addingMember ? '14px 14px 0 0' : (filteredUsers.length === 0 ? 3 : '14px 14px 0 0'),
          background: dept
            ? `linear-gradient(135deg, ${alpha(color, isDark ? 0.2 : 0.09)} 0%, ${alpha(color, isDark ? 0.1 : 0.04)} 100%)`
            : alpha(theme.palette.action.hover, isDark ? 0.55 : 0.45),
          border: `1px solid ${alpha(color, isDark ? 0.28 : 0.17)}`,
          borderBottom: 'none',
          px: 1.75,
          pt: 1.75,
          pb: addingMember ? 1.75 : 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} mb={dept && !addingMember ? 1.25 : 0}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: dept ? alpha(color, isDark ? 0.28 : 0.14) : theme.palette.action.selected,
              color,
              fontWeight: 800,
              fontSize: 15,
              border: `2px solid ${alpha(color, 0.28)}`,
              flexShrink: 0,
            }}
          >
            {dept ? dept.name[0] : <PersonOffRoundedIcon sx={{ fontSize: 18 }} />}
          </Avatar>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography fontWeight={700} fontSize={13} noWrap>{name}</Typography>
              <Chip
                label={filteredUsers.length}
                size="small"
                sx={{
                  height: 18, fontSize: 10, fontWeight: 700, minWidth: 26,
                  bgcolor: alpha(color, isDark ? 0.25 : 0.12),
                  color,
                  border: `1px solid ${alpha(color, 0.22)}`,
                  '& .MuiChip-label': { px: 0.75 },
                  flexShrink: 0,
                }}
              />
            </Stack>
            {dept?.description && (
              <Typography fontSize={9} color="text.secondary" noWrap mt={0.2}>{dept.description}</Typography>
            )}
          </Box>

          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0, boxShadow: `0 0 6px ${alpha(color, 0.65)}` }} />
        </Stack>

        {dept && !addingMember && (
          <Button
            size="small"
            startIcon={<PersonAddRoundedIcon sx={{ fontSize: 12 }} />}
            onClick={() => setAddingMember(true)}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 1.75,
              fontSize: 11,
              py: 0.4,
              color,
              borderColor: alpha(color, 0.28),
              '&:hover': { borderColor: alpha(color, 0.5), bgcolor: alpha(color, 0.06) },
            }}
          >
            Add Member
          </Button>
        )}

        {dept && addingMember && (
          <AddMemberSearch
            options={searchableUsers}
            accentColor={color}
            onAssign={(user) => { onAddMember(getUserId(user), dept._id); setAddingMember(false); }}
            onClose={() => setAddingMember(false)}
          />
        )}
      </Paper>

      {/* ── Droppable (scrolls internally) ── */}
      <Droppable droppableId={deptId}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              minHeight: 0,          // ← critical: allows flex child to shrink + scroll
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 1.25,
              bgcolor: snapshot.isDraggingOver
                ? alpha(color, isDark ? 0.11 : 0.055)
                : alpha(theme.palette.background.default, isDark ? 0.45 : 0.6),
              border: `1px solid ${snapshot.isDraggingOver ? alpha(color, 0.45) : alpha(color, isDark ? 0.22 : 0.13)}`,
              borderTop: 'none',
              borderRadius: '0 0 14px 14px',
              transition: 'background-color 0.18s, border-color 0.18s',
              // Scrollbar styling
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(color, 0.28),
                borderRadius: 2,
              },
              '&::-webkit-scrollbar-thumb:hover': { bgcolor: alpha(color, 0.45) },
            }}
          >
            {filteredUsers.length === 0 && !snapshot.isDraggingOver && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.3, gap: 0.5 }}>
                <PeopleAltRoundedIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                <Typography fontSize={10} color="text.secondary">
                  {search ? 'No matches' : 'Drop users here'}
                </Typography>
              </Box>
            )}

            {filteredUsers.map((user, index) => (
              <Draggable key={getUserId(user)} draggableId={getUserId(user)} index={index}>
                {(prov, snap) => (
                  <UserCard
                    user={user}
                    isDragging={snap.isDragging}
                    innerRef={prov.innerRef}
                    draggableProps={prov.draggableProps}
                    dragHandleProps={prov.dragHandleProps}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
function Page() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptManagerOpen, setDeptManagerOpen] = useState(false);
  const [localAssignments, setLocalAssignments] = useState<Record<string, string | null>>({});

  const { data: departments = [], refetch: refetchDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  const { data: users = [], isLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 30_000,
    refetchOnMount: true,
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, departmentId }: { userId: string; departmentId: string | null }) =>
      api.patch(`/auth/users/profile/${userId}`, { departmentId }),
  });

  const getEffectiveDeptId = useCallback(
    (user: any): string | null => {
      const uid = getUserId(user);
      if (uid in localAssignments) return localAssignments[uid];
      return normalizeDeptId(user);
    },
    [localAssignments]
  );

  const { columnUsers, unassignedUsers } = useMemo(() => {
    const deptMap: Record<string, User[]> = {};
    departments.forEach((d) => { deptMap[d._id] = []; });
    const unassigned: User[] = [];
    users.forEach((u) => {
      const dId = getEffectiveDeptId(u);
      if (dId && deptMap[dId]) deptMap[dId].push(u);
      else unassigned.push(u);
    });
    return { columnUsers: deptMap, unassignedUsers: unassigned };
  }, [users, departments, getEffectiveDeptId]);

  const doAssign = useCallback(
    (userId: string, toId: string | null, fromId: string | null) => {
      if (toId === fromId) return;
      setLocalAssignments((prev) => ({ ...prev, [userId]: toId }));
      assignMutation.mutate(
        { userId, departmentId: toId },
        {
          onSuccess: () => {
            refetchUsers().then(() => {
              setLocalAssignments((prev) => { const n = { ...prev }; delete n[userId]; return n; });
            });
            queryClient.refetchQueries({ queryKey: ['users'] });
            toast.success('Department updated');
          },
          onError: () => {
            setLocalAssignments((prev) => { const n = { ...prev }; delete n[userId]; return n; });
            toast.error('Failed to update department');
          },
        }
      );
    },
    [assignMutation, refetchUsers, queryClient]
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

  const totalUsers = users.length;

  return (
    // ── Outer wrapper: fills all available height, no page scroll ──
    <Box
      sx={{
        flex: 1,           // fills remaining space in parent flex column (Shell layout)
        height: '100%',    // fallback for non-flex parents
        minHeight: 0,      // allows flex shrink + internal scroll
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Sticky toolbar ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.75, sm: 2 },
          pb: 1.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        {/* Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mr: 'auto' }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 36, height: 36, borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            }}
          >
            <GroupsRoundedIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2} letterSpacing={-0.2}>
              Departments
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize={10}>
              {isLoading ? 'Loading...' : `${totalUsers} users · ${departments.length} departments`}
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 12, height: 34 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25 }}>
                  <CloseRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Refresh */}
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={() => { refetchUsers(); refetchDepts(); }}
            sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, width: 34, height: 34 }}
          >
            <RefreshRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        {/* Manage Departments */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<GroupsRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={() => setDeptManagerOpen(true)}
          sx={{
            borderRadius: 2,
            height: 34,
            fontSize: 12,
            borderColor: alpha(theme.palette.primary.main, 0.35),
            '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) },
          }}
        >
          Manage
        </Button>
      </Box>

      {/* ── Kanban board area: fills remaining height, horizontal scroll only ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,          // critical for flex scroll
          overflowX: 'auto',
          overflowY: 'hidden',
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 2,
          // Horizontal scrollbar
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.primary, 0.12),
            borderRadius: 3,
          },
        }}
      >
        {isLoading ? (
          // Skeleton columns
          <Box sx={{ display: 'flex', gap: 2.5, height: '100%', minWidth: 'max-content', alignItems: 'flex-start' }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={262}
                height="80%"
                sx={{ borderRadius: 2.5, flexShrink: 0, minHeight: 320 }}
              />
            ))}
          </Box>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Row of columns — fills the full board height */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2.5,
                height: '100%',
                minWidth: 'max-content',
                alignItems: 'stretch',   // columns all same height
              }}
            >
              {/* Unassigned column */}
              <DeptColumn
                deptId="unassigned"
                dept={null}
                users={unassignedUsers}
                searchableUsers={[]}
                onAddMember={handleAddMember}
                search={search}
              />

              {/* Department columns */}
              {departments.map((dept) => (
                <DeptColumn
                  key={dept._id}
                  deptId={dept._id}
                  dept={dept}
                  users={columnUsers[dept._id] ?? []}
                  searchableUsers={unassignedUsers}
                  onAddMember={handleAddMember}
                  search={search}
                />
              ))}
            </Box>
          </DragDropContext>
        )}
      </Box>

      {/* ── Department Manager Dialog ── */}
      <DepartmentManager
        open={deptManagerOpen}
        onClose={() => {
          setDeptManagerOpen(false);
          refetchDepts();
          refetchUsers();
        }}
      />
    </Box>
  );
}

export default Page;
