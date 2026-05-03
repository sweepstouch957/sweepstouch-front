'use client';

import React, { FC, memo, useMemo, useState } from 'react';
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
} from '@hello-pangea/dnd';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';

import { Department } from '@/services/department.service';
import { User } from '@/contexts/auth/user';
import DepartmentManager from 'src/components/departments/DepartmentManager';
import { useDepartmentBoard, getUserId, getInitials, ROLE_STYLE } from '@/hooks/useDepartmentBoard';

// ─── UserCard (memoized) ─────────────────────────────────────────────────────
interface UserCardProps {
  user: User;
  isDragging: boolean;
  innerRef: any;
  draggableProps: any;
  dragHandleProps: any;
}

const UserCard: FC<UserCardProps> = memo(({ user, isDragging, innerRef, draggableProps, dragHandleProps }) => {
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
});

UserCard.displayName = 'UserCard';

// ─── AddMemberSearch ──────────────────────────────────────────────────────────
interface AddMemberSearchProps {
  options: User[];
  onAssign: (user: User) => void;
  onClose: () => void;
  accentColor: string;
}

const AddMemberSearch: FC<AddMemberSearchProps> = memo(({ options, onAssign, onClose }) => (
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
));

AddMemberSearch.displayName = 'AddMemberSearch';

// ─── DeptColumn (memoized) ───────────────────────────────────────────────────
interface DeptColumnProps {
  deptId: string;
  dept: Department | null;
  users: User[];
  searchableUsers: User[];
  onAddMember: (userId: string, deptId: string | null) => void;
  search: string;
}

const DeptColumn: FC<DeptColumnProps> = memo(({ deptId, dept, users, searchableUsers, onAddMember, search }) => {
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
              minHeight: 0,
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
});

DeptColumn.displayName = 'DeptColumn';

// ─── Page ─────────────────────────────────────────────────────────────────────
function Page() {
  const theme = useTheme();
  const {
    search,
    setSearch,
    deptManagerOpen,
    departments,
    isLoading,
    columnUsers,
    unassignedUsers,
    totalUsers,
    handleDragEnd,
    handleAddMember,
    refresh,
    openDeptManager,
    closeDeptManager,
  } = useDepartmentBoard();

  return (
    <Box
      sx={{
        flex: 1,
        height: '100%',
        minHeight: 0,
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
            onClick={refresh}
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
          onClick={openDeptManager}
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

      {/* ── Kanban board area ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 2,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.primary, 0.12),
            borderRadius: 3,
          },
        }}
      >
        {isLoading ? (
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2.5,
                height: '100%',
                minWidth: 'max-content',
                alignItems: 'stretch',
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
        onClose={closeDeptManager}
      />
    </Box>
  );
}

export default Page;
