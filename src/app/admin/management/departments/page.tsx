'use client';

import React, { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
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
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

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
  compact?: boolean;
}

const UserCard: FC<UserCardProps> = memo(({ user, isDragging, innerRef, draggableProps, dragHandleProps, compact }) => {
  const theme = useTheme();
  const role = ROLE_STYLE[user.role] ?? { label: user.role, color: '#78909c' };

  return (
    <Card
      ref={innerRef}
      {...draggableProps}
      elevation={0}
      sx={{
        mb: 0.75,
        borderRadius: 1.5,
        border: `1px solid ${isDragging ? alpha(role.color, 0.5) : theme.palette.divider}`,
        bgcolor: isDragging ? alpha(role.color, 0.06) : theme.palette.background.paper,
        boxShadow: isDragging
          ? `0 10px 28px ${alpha(theme.palette.common.black, 0.18)}`
          : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: alpha(role.color, 0.4),
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.07)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: compact ? 0.5 : 0.75 }}>
        <Box
          {...dragHandleProps}
          sx={{
            color: alpha(theme.palette.text.primary, 0.15),
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            flexShrink: 0,
            '&:hover': { color: alpha(theme.palette.text.primary, 0.45) },
          }}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: 14 }} />
        </Box>

        <Avatar
          src={user.profileImage || (user as any).avatar || undefined}
          sx={{
            width: 26,
            height: 26,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: alpha(role.color, 0.14),
            color: role.color,
            flexShrink: 0,
          }}
        >
          {getInitials(user)}
        </Avatar>

        <Typography variant="body2" fontWeight={600} fontSize={11} noWrap lineHeight={1.2} flex={1} minWidth={0}>
          {user.firstName} {user.lastName}
        </Typography>

        <Chip
          label={role.label}
          size="small"
          sx={{
            height: 16,
            fontSize: 8,
            fontWeight: 600,
            bgcolor: alpha(role.color, 0.1),
            color: role.color,
            border: `1px solid ${alpha(role.color, 0.18)}`,
            '& .MuiChip-label': { px: 0.5 },
            cursor: 'inherit',
            flexShrink: 0,
          }}
        />
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
}

const AddMemberSearch: FC<AddMemberSearchProps> = memo(({ options, onAssign, onClose }) => (
  <Box sx={{ mt: 0.75 }}>
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
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                src={user.profileImage || (user as any).avatar || undefined}
                sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: alpha(role.color, 0.14), color: role.color }}
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
          placeholder="Buscar usuario..."
          autoFocus
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 11 } }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      )}
      noOptionsText={<Typography fontSize={11} color="text.secondary">Sin resultados</Typography>}
    />
    <Button size="small" onClick={onClose} fullWidth
      sx={{ mt: 0.5, borderRadius: 1.5, fontSize: 10, color: 'text.secondary' }}>
      Cancelar
    </Button>
  </Box>
));

AddMemberSearch.displayName = 'AddMemberSearch';

// ─── DeptCard — Grid-based department card with collapse ─────────────────────
interface DeptCardProps {
  deptId: string;
  dept: Department | null;
  users: User[];
  searchableUsers: User[];
  onAddMember: (userId: string, deptId: string | null) => void;
  search: string;
  defaultExpanded?: boolean;
}

const DeptCard: FC<DeptCardProps> = memo(({
  deptId, dept, users, searchableUsers, onAddMember, search, defaultExpanded = true,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [addingMember, setAddingMember] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const color = dept?.color ?? (isDark ? '#546e7a' : '#90a4ae');
  const name = dept?.name ?? 'Sin asignar';

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q));
  }, [users, search]);

  // On mobile, hide empty departments when searching
  if (search && filteredUsers.length === 0 && isMobile) return null;

  const maxVisibleUsers = 200; // Show all users, column scrolls internally

  return (
    <Paper
      ref={cardRef}
      id={`dept-${deptId}`}
      elevation={0}
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        border: `1px solid ${alpha(color, isDark ? 0.25 : 0.15)}`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: expanded ? { xs: 500, sm: 420, md: 460 } : 'auto',
        transition: 'max-height 0.3s ease',
      }}
    >
      {/* ── Header (always visible, clickable to toggle) ── */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          cursor: 'pointer',
          px: 1.5,
          py: 1.25,
          background: dept
            ? `linear-gradient(135deg, ${alpha(color, isDark ? 0.18 : 0.08)} 0%, ${alpha(color, isDark ? 0.08 : 0.03)} 100%)`
            : alpha(theme.palette.action.hover, isDark ? 0.45 : 0.35),
          borderBottom: expanded ? `1px solid ${alpha(color, isDark ? 0.2 : 0.12)}` : 'none',
          userSelect: 'none',
          '&:hover': { background: dept
            ? `linear-gradient(135deg, ${alpha(color, isDark ? 0.24 : 0.12)} 0%, ${alpha(color, isDark ? 0.12 : 0.06)} 100%)`
            : alpha(theme.palette.action.hover, isDark ? 0.55 : 0.45),
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: dept ? alpha(color, isDark ? 0.25 : 0.12) : theme.palette.action.selected,
              color,
              fontWeight: 800,
              fontSize: 13,
              border: `2px solid ${alpha(color, 0.25)}`,
              flexShrink: 0,
            }}
          >
            {dept ? dept.name[0] : <PersonOffRoundedIcon sx={{ fontSize: 15 }} />}
          </Avatar>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontWeight={700} fontSize={12} noWrap>{name}</Typography>
              <Chip
                label={filteredUsers.length}
                size="small"
                sx={{
                  height: 16, fontSize: 9, fontWeight: 700, minWidth: 22,
                  bgcolor: alpha(color, isDark ? 0.22 : 0.1),
                  color,
                  border: `1px solid ${alpha(color, 0.18)}`,
                  '& .MuiChip-label': { px: 0.5 },
                  flexShrink: 0,
                }}
              />
            </Stack>
            {dept?.description && (
              <Typography fontSize={8} color="text.secondary" noWrap mt={0.15}>{dept.description}</Typography>
            )}
          </Box>

          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0, boxShadow: `0 0 5px ${alpha(color, 0.6)}` }} />

          {expanded
            ? <ExpandLessRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            : <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
          }
        </Stack>
      </Box>

      {/* ── Collapsible body ── */}
      <Collapse in={expanded} unmountOnExit>
        {/* Add member button */}
        {dept && !addingMember && (
          <Box sx={{ px: 1.25, pt: 1, pb: 0.25 }}>
            <Button
              size="small"
              startIcon={<PersonAddRoundedIcon sx={{ fontSize: 11 }} />}
              onClick={(e) => { e.stopPropagation(); setAddingMember(true); }}
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: 1.5,
                fontSize: 10,
                py: 0.3,
                color,
                borderColor: alpha(color, 0.22),
                '&:hover': { borderColor: alpha(color, 0.45), bgcolor: alpha(color, 0.04) },
              }}
            >
              Agregar Miembro
            </Button>
          </Box>
        )}

        {dept && addingMember && (
          <Box sx={{ px: 1.25, pt: 0.75 }}>
            <AddMemberSearch
              options={searchableUsers}
              onAssign={(user) => { onAddMember(getUserId(user), dept._id); setAddingMember(false); }}
              onClose={() => setAddingMember(false)}
            />
          </Box>
        )}

        {/* ── Droppable user list ── */}
        <Droppable droppableId={deptId}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                flex: 1,
                minHeight: 48,
                maxHeight: { xs: 340, sm: 280, md: 320 },
                overflowY: 'auto',
                overflowX: 'hidden',
                px: 1.25,
                py: 0.75,
                bgcolor: snapshot.isDraggingOver
                  ? alpha(color, isDark ? 0.09 : 0.04)
                  : 'transparent',
                transition: 'background-color 0.18s',
                // Thin scrollbar
                '&::-webkit-scrollbar': { width: 3 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha(color, 0.22),
                  borderRadius: 2,
                },
                '&::-webkit-scrollbar-thumb:hover': { bgcolor: alpha(color, 0.4) },
              }}
            >
              {filteredUsers.length === 0 && !snapshot.isDraggingOver && (
                <Box sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', py: 2.5, opacity: 0.25, gap: 0.25,
                }}>
                  <PeopleAltRoundedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                  <Typography fontSize={9} color="text.secondary">
                    {search ? 'Sin coincidencias' : 'Arrastra usuarios aquí'}
                  </Typography>
                </Box>
              )}

              {filteredUsers.slice(0, maxVisibleUsers).map((user, index) => (
                <Draggable key={getUserId(user)} draggableId={getUserId(user)} index={index}>
                  {(prov, snap) => (
                    <UserCard
                      user={user}
                      isDragging={snap.isDragging}
                      innerRef={prov.innerRef}
                      draggableProps={prov.draggableProps}
                      dragHandleProps={prov.dragHandleProps}
                      compact={isMobile}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Collapse>
    </Paper>
  );
});

DeptCard.displayName = 'DeptCard';

// ─── Department Navigation Chips ──────────────────────────────────────────────
interface DeptNavProps {
  departments: Department[];
  unassignedCount: number;
  columnUsers: Record<string, User[]>;
  activeDept: string | null;
  onSelect: (id: string | null) => void;
}

const DeptNav: FC<DeptNavProps> = memo(({ departments, unassignedCount, columnUsers, activeDept, onSelect }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.75,
        overflowX: 'auto',
        py: 0.5,
        '&::-webkit-scrollbar': { height: 0 },
        flexShrink: 0,
      }}
    >
      {/* All button */}
      <Chip
        label={`Todos`}
        size="small"
        onClick={() => onSelect(null)}
        sx={{
          height: 26,
          fontSize: 10,
          fontWeight: activeDept === null ? 700 : 500,
          bgcolor: activeDept === null
            ? alpha(theme.palette.primary.main, isDark ? 0.25 : 0.12)
            : 'transparent',
          color: activeDept === null ? theme.palette.primary.main : 'text.secondary',
          border: `1px solid ${activeDept === null
            ? alpha(theme.palette.primary.main, 0.35)
            : alpha(theme.palette.divider, 0.6)}`,
          cursor: 'pointer',
          flexShrink: 0,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.06),
          },
        }}
      />

      {/* Unassigned */}
      <Chip
        label={`Sin asignar (${unassignedCount})`}
        size="small"
        onClick={() => onSelect('unassigned')}
        sx={{
          height: 26,
          fontSize: 10,
          fontWeight: activeDept === 'unassigned' ? 700 : 500,
          bgcolor: activeDept === 'unassigned'
            ? alpha('#90a4ae', isDark ? 0.25 : 0.12)
            : 'transparent',
          color: activeDept === 'unassigned' ? '#90a4ae' : 'text.secondary',
          border: `1px solid ${activeDept === 'unassigned'
            ? alpha('#90a4ae', 0.35)
            : alpha(theme.palette.divider, 0.6)}`,
          cursor: 'pointer',
          flexShrink: 0,
          '&:hover': { bgcolor: alpha('#90a4ae', isDark ? 0.15 : 0.06) },
        }}
      />

      {/* Department chips */}
      {departments.map((dept) => {
        const count = (columnUsers[dept._id] ?? []).length;
        const isActive = activeDept === dept._id;
        return (
          <Chip
            key={dept._id}
            label={`${dept.name} (${count})`}
            size="small"
            onClick={() => onSelect(dept._id)}
            sx={{
              height: 26,
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              bgcolor: isActive
                ? alpha(dept.color, isDark ? 0.25 : 0.12)
                : 'transparent',
              color: isActive ? dept.color : 'text.secondary',
              border: `1px solid ${isActive
                ? alpha(dept.color, 0.35)
                : alpha(theme.palette.divider, 0.6)}`,
              cursor: 'pointer',
              flexShrink: 0,
              '&:hover': { bgcolor: alpha(dept.color, isDark ? 0.15 : 0.06) },
            }}
          />
        );
      })}
    </Box>
  );
});

DeptNav.displayName = 'DeptNav';

// ─── Page ─────────────────────────────────────────────────────────────────────
function Page() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filterDept, setFilterDept] = useState<string | null>(null);
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

  // Filter visible departments
  const visibleDepts = useMemo(() => {
    if (!filterDept) return departments;
    if (filterDept === 'unassigned') return [];
    return departments.filter((d) => d._id === filterDept);
  }, [departments, filterDept]);

  const showUnassigned = !filterDept || filterDept === 'unassigned';

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
          px: { xs: 1.5, sm: 2.5 },
          pt: { xs: 1.25, sm: 1.75 },
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Top row: title + actions */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Avatar
            variant="rounded"
            sx={{
              width: 32, height: 32, borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            <GroupsRoundedIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2} letterSpacing={-0.2}>
              Departamentos
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize={9}>
              {isLoading ? 'Cargando...' : `${totalUsers} usuarios · ${departments.length} departamentos`}
            </Typography>
          </Box>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: 120, sm: 180 },
              '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 11, height: 30 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.15 }}>
                    <CloseRoundedIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Tooltip title="Actualizar">
            <IconButton
              size="small"
              onClick={refresh}
              sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, width: 30, height: 30 }}
            >
              <RefreshRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Administrar departamentos">
            <IconButton
              size="small"
              onClick={openDeptManager}
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 1.5, width: 30, height: 30,
                color: theme.palette.primary.main,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              }}
            >
              <SettingsRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Department navigation chips */}
        {!isLoading && (
          <DeptNav
            departments={departments}
            unassignedCount={unassignedUsers.length}
            columnUsers={columnUsers}
            activeDept={filterDept}
            onSelect={setFilterDept}
          />
        )}
      </Box>

      {/* ── Grid board area — scrolls vertically, NO horizontal scroll ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: { xs: 1.5, sm: 2.5 },
          pt: 1.5,
          pb: 3,
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.primary, 0.1),
            borderRadius: 3,
          },
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 2.5 }}
              />
            ))}
          </Box>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 1.5,
                alignItems: 'start',
              }}
            >
              {/* Unassigned column */}
              {showUnassigned && (
                <DeptCard
                  deptId="unassigned"
                  dept={null}
                  users={unassignedUsers}
                  searchableUsers={[]}
                  onAddMember={handleAddMember}
                  search={search}
                  defaultExpanded={filterDept === 'unassigned' || !filterDept}
                />
              )}

              {/* Department columns */}
              {visibleDepts.map((dept) => {
                const hasUsers = (columnUsers[dept._id] ?? []).length > 0;
                // Auto-expand: when filtered to this dept, or when it has users
                // Auto-collapse: empty departments when viewing all
                const expanded = !!filterDept || hasUsers;
                return (
                  <DeptCard
                    key={dept._id}
                    deptId={dept._id}
                    dept={dept}
                    users={columnUsers[dept._id] ?? []}
                    searchableUsers={unassignedUsers}
                    onAddMember={handleAddMember}
                    search={search}
                    defaultExpanded={expanded}
                  />
                );
              })}
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
