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
  Container,
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
import PageHeading from 'src/components/base/page-heading';
import DepartmentManager from 'src/components/departments/DepartmentManager';
import { useCustomization } from 'src/hooks/use-customization';

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

const UserCard: FC<UserCardProps> = ({
  user,
  isDragging,
  innerRef,
  draggableProps,
  dragHandleProps,
}) => {
  const theme = useTheme();
  const role = ROLE_STYLE[user.role] ?? { label: user.role, color: '#78909c' };

  return (
    <Card
      ref={innerRef}
      {...draggableProps}
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        border: `1px solid ${
          isDragging ? alpha(role.color, 0.45) : theme.palette.divider
        }`,
        bgcolor: isDragging
          ? alpha(role.color, 0.05)
          : theme.palette.background.paper,
        boxShadow: isDragging
          ? `0 12px 32px ${alpha(theme.palette.common.black, 0.2)}`
          : `0 1px 4px ${alpha(theme.palette.common.black, 0.06)}`,
        transition: 'box-shadow 0.2s, border-color 0.2s, background-color 0.2s',
        '&:hover': {
          borderColor: alpha(role.color, 0.35),
          boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 1.5, py: 1.25 }}
      >
        <Box
          {...dragHandleProps}
          sx={{
            color: alpha(theme.palette.text.primary, 0.2),
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            flexShrink: 0,
            '&:hover': { color: alpha(theme.palette.text.primary, 0.5) },
          }}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: 18 }} />
        </Box>

        <Avatar
          src={user.profileImage || user.avatar || undefined}
          sx={{
            width: 36,
            height: 36,
            fontSize: 13,
            fontWeight: 700,
            bgcolor: alpha(role.color, 0.15),
            color: role.color,
            flexShrink: 0,
          }}
        >
          {getInitials(user)}
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} fontSize={13} noWrap>
            {user.firstName} {user.lastName}
          </Typography>
          <Chip
            label={role.label}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              bgcolor: alpha(role.color, 0.1),
              color: role.color,
              border: `1px solid ${alpha(role.color, 0.2)}`,
              '& .MuiChip-label': { px: 1 },
              mt: 0.25,
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

const AddMemberSearch: FC<AddMemberSearchProps> = ({
  options,
  onAssign,
  onClose,
  accentColor,
}) => (
  <Box sx={{ mt: 1.5 }}>
    <Autocomplete
      options={options}
      autoHighlight
      size="small"
      getOptionLabel={(u) => `${u.firstName} ${u.lastName}`}
      onChange={(_, user) => {
        if (user) onAssign(user);
      }}
      renderOption={(props, user) => {
        const role = ROLE_STYLE[user.role] ?? { label: user.role, color: '#78909c' };
        return (
          <Box component="li" {...props} key={getUserId(user)}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                src={user.profileImage || user.avatar || undefined}
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(role.color, 0.15),
                  color: role.color,
                }}
              >
                {getInitials(user)}
              </Avatar>
              <Box>
                <Typography fontSize={12} fontWeight={600} lineHeight={1.3}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography fontSize={10} color="text.secondary">
                  {role.label}
                </Typography>
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
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: 12,
              borderColor: alpha(accentColor, 0.4),
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      )}
      noOptionsText={
        <Typography fontSize={12} color="text.secondary">
          No users found
        </Typography>
      }
    />
    <Button
      size="small"
      onClick={onClose}
      fullWidth
      sx={{ mt: 0.5, borderRadius: 1.5, fontSize: 11, color: 'text.secondary' }}
    >
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

const DeptColumn: FC<DeptColumnProps> = ({
  deptId,
  dept,
  users,
  searchableUsers,
  onAddMember,
  search,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [addingMember, setAddingMember] = useState(false);

  const color = dept?.color ?? (isDark ? '#546e7a' : '#90a4ae');
  const name = dept?.name ?? 'Unassigned';

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <Box
      sx={{
        width: 288,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column Header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px 16px 0 0',
          background: dept
            ? `linear-gradient(135deg, ${alpha(color, isDark ? 0.22 : 0.1)} 0%, ${alpha(color, isDark ? 0.12 : 0.05)} 100%)`
            : alpha(theme.palette.action.hover, isDark ? 0.6 : 0.5),
          border: `1px solid ${alpha(color, isDark ? 0.3 : 0.18)}`,
          borderBottom: 'none',
          p: 2,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Avatar
            sx={{
              width: 42,
              height: 42,
              bgcolor: dept ? alpha(color, isDark ? 0.3 : 0.15) : theme.palette.action.selected,
              color,
              fontWeight: 800,
              fontSize: 17,
              border: `2px solid ${alpha(color, 0.3)}`,
              flexShrink: 0,
            }}
          >
            {dept ? dept.name[0] : <PersonOffRoundedIcon sx={{ fontSize: 22 }} />}
          </Avatar>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={700} fontSize={14} noWrap>
                {name}
              </Typography>
              <Chip
                label={filteredUsers.length}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 28,
                  bgcolor: alpha(color, isDark ? 0.25 : 0.12),
                  color,
                  border: `1px solid ${alpha(color, 0.25)}`,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Stack>

            {dept?.description && (
              <Typography fontSize={10} color="text.secondary" noWrap mt={0.3}>
                {dept.description}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              bgcolor: color,
              flexShrink: 0,
              mt: 0.75,
              boxShadow: `0 0 7px ${alpha(color, 0.7)}`,
            }}
          />
        </Stack>

        {/* Add Member */}
        {dept && !addingMember && (
          <Button
            size="small"
            startIcon={<PersonAddRoundedIcon sx={{ fontSize: 13 }} />}
            onClick={() => setAddingMember(true)}
            variant="outlined"
            fullWidth
            sx={{
              mt: 1.5,
              borderRadius: 2,
              fontSize: 11,
              color,
              borderColor: alpha(color, 0.3),
              '&:hover': {
                borderColor: alpha(color, 0.55),
                bgcolor: alpha(color, 0.07),
              },
            }}
          >
            Add Member
          </Button>
        )}

        {dept && addingMember && (
          <AddMemberSearch
            options={searchableUsers}
            accentColor={color}
            onAssign={(user) => {
              onAddMember(getUserId(user), dept._id);
              setAddingMember(false);
            }}
            onClose={() => setAddingMember(false)}
          />
        )}
      </Paper>

      {/* Droppable */}
      <Droppable droppableId={deptId}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1.5,
              bgcolor: snapshot.isDraggingOver
                ? alpha(color, isDark ? 0.12 : 0.06)
                : alpha(
                    theme.palette.background.default,
                    isDark ? 0.5 : 0.65
                  ),
              border: `1px solid ${
                snapshot.isDraggingOver
                  ? alpha(color, 0.45)
                  : alpha(color, isDark ? 0.25 : 0.15)
              }`,
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              transition: 'background-color 0.2s, border-color 0.2s',
              minHeight: 140,
              maxHeight: 'calc(100vh - 280px)',
            }}
          >
            {filteredUsers.length === 0 && !snapshot.isDraggingOver && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 5,
                  opacity: 0.35,
                  gap: 0.5,
                }}
              >
                <PeopleAltRoundedIcon
                  sx={{ fontSize: 30, color: 'text.secondary' }}
                />
                <Typography fontSize={11} color="text.secondary">
                  {search ? 'No matches' : 'Drop users here'}
                </Typography>
              </Box>
            )}

            {filteredUsers.map((user, index) => (
              <Draggable
                key={getUserId(user)}
                draggableId={getUserId(user)}
                index={index}
              >
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

// ─── Page ────────────────────────────────────────────────────────────────────
function Page() {
  const customization = useCustomization();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptManagerOpen, setDeptManagerOpen] = useState(false);
  const [localAssignments, setLocalAssignments] = useState<
    Record<string, string | null>
  >({});

  const { data: departments = [], refetch: refetchDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  const {
    data: users = [],
    isLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 30_000,
    refetchOnMount: true,
  });

  const assignMutation = useMutation({
    mutationFn: ({
      userId,
      departmentId,
    }: {
      userId: string;
      departmentId: string | null;
    }) => api.patch(`/auth/users/profile/${userId}`, { departmentId }),
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
    departments.forEach((d) => {
      deptMap[d._id] = [];
    });
    const unassigned: User[] = [];

    users.forEach((u) => {
      const dId = getEffectiveDeptId(u);
      if (dId && deptMap[dId]) {
        deptMap[dId].push(u);
      } else {
        unassigned.push(u);
      }
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
              setLocalAssignments((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
              });
            });
            queryClient.refetchQueries({ queryKey: ['users'] });
            toast.success('Department updated');
          },
          onError: () => {
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
    [assignMutation, refetchUsers, queryClient]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const userId = result.draggableId;
      const fromId =
        result.source.droppableId === 'unassigned'
          ? null
          : result.source.droppableId;
      const toId =
        result.destination.droppableId === 'unassigned'
          ? null
          : result.destination.droppableId;
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

  return (
    <>
      <Container
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ pt: { xs: 2, sm: 3 }, pb: 2 }}
      >
        <PageHeading
          sx={{ px: 0 }}
          title="Departments"
          description="Drag users between columns to reassign departments"
          actions={
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            >
              <TextField
                size="small"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  width: 210,
                  '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon
                        sx={{ fontSize: 17, color: 'text.secondary' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <CloseRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={() => {
                    refetchUsers();
                    refetchDepts();
                  }}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    width: 34,
                    height: 34,
                  }}
                >
                  <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                startIcon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setDeptManagerOpen(true)}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Manage Departments
              </Button>
            </Stack>
          }
        />
      </Container>

      {isLoading ? (
        <Box sx={{ overflowX: 'auto', pb: 4 }}>
          <Stack
            direction="row"
            spacing={2.5}
            sx={{ px: { xs: 2, sm: 3 }, minWidth: 'max-content' }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={288}
                height={460}
                sx={{ borderRadius: 3, flexShrink: 0 }}
              />
            ))}
          </Stack>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto', pb: 5 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Stack
              direction="row"
              spacing={2.5}
              sx={{
                px: { xs: 2, sm: 3 },
                minWidth: 'max-content',
                alignItems: 'flex-start',
              }}
            >
              <DeptColumn
                deptId="unassigned"
                dept={null}
                users={unassignedUsers}
                searchableUsers={[]}
                onAddMember={handleAddMember}
                search={search}
              />

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
            </Stack>
          </DragDropContext>
        </Box>
      )}

      <DepartmentManager
        open={deptManagerOpen}
        onClose={() => {
          setDeptManagerOpen(false);
          refetchDepts();
          refetchUsers();
        }}
      />
    </>
  );
}

export default Page;
