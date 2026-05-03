'use client';

import React, { FC, memo, useMemo, useState } from 'react';
import {
  alpha, Avatar, Box, Button, Card, Chip, Collapse, IconButton,
  InputAdornment, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';

import { Department } from '@/services/department.service';
import { User } from '@/contexts/auth/user';
import DepartmentManager from 'src/components/departments/DepartmentManager';
import { useDepartmentBoard, getUserId, getInitials, ROLE_STYLE } from '@/hooks/useDepartmentBoard';

/* ─── Compact user row ─────────────────────────────────────────────────────── */
const UserRow: FC<{
  user: User; isDragging: boolean; innerRef: any; draggableProps: any; dragHandleProps: any;
}> = memo(({ user, isDragging, innerRef, draggableProps, dragHandleProps }) => {
  const theme = useTheme();
  const r = ROLE_STYLE[user.role] ?? { label: user.role, color: '#78909c' };
  return (
    <Card ref={innerRef} {...draggableProps} elevation={0} sx={{
      mb: 0.5, borderRadius: 1.5,
      border: `1px solid ${isDragging ? alpha(r.color, 0.5) : theme.palette.divider}`,
      bgcolor: isDragging ? alpha(r.color, 0.06) : theme.palette.background.paper,
      boxShadow: isDragging ? `0 8px 24px ${alpha('#000', 0.18)}` : 'none',
      '&:hover': { borderColor: alpha(r.color, 0.35), boxShadow: `0 2px 8px ${alpha('#000', 0.06)}` },
      transition: 'all 0.15s',
    }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 0.75, py: 0.5 }}>
        <Box {...dragHandleProps} sx={{ color: alpha(theme.palette.text.primary, 0.15), cursor: 'grab', display: 'flex', flexShrink: 0 }}>
          <DragIndicatorRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
        <Avatar src={user.profileImage || (user as any).avatar || undefined} sx={{
          width: 24, height: 24, fontSize: 9, fontWeight: 700,
          bgcolor: alpha(r.color, 0.14), color: r.color, flexShrink: 0,
        }}>{getInitials(user)}</Avatar>
        <Typography fontSize={11} fontWeight={600} noWrap flex={1} minWidth={0} lineHeight={1.2}>
          {user.firstName} {user.lastName}
        </Typography>
        <Chip label={r.label} size="small" sx={{
          height: 15, fontSize: 8, fontWeight: 600, flexShrink: 0,
          bgcolor: alpha(r.color, 0.1), color: r.color,
          border: `1px solid ${alpha(r.color, 0.18)}`,
          '& .MuiChip-label': { px: 0.5 }, cursor: 'inherit',
        }} />
      </Stack>
    </Card>
  );
});
UserRow.displayName = 'UserRow';

/* ─── Department accordion section ─────────────────────────────────────────── */
const DeptSection: FC<{
  dept: Department; users: User[]; search: string; defaultOpen?: boolean;
}> = memo(({ dept, users, search, defaultOpen = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(defaultOpen);
  const c = dept.color;

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <Box sx={{ mb: 1 }}>
      {/* Header — always visible */}
      <Box onClick={() => setOpen(v => !v)} sx={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
        px: 1.25, py: 0.75, borderRadius: open ? '10px 10px 0 0' : 2,
        background: `linear-gradient(135deg, ${alpha(c, isDark ? 0.16 : 0.07)} 0%, ${alpha(c, isDark ? 0.06 : 0.02)} 100%)`,
        border: `1px solid ${alpha(c, isDark ? 0.22 : 0.12)}`,
        borderBottom: open ? `1px solid ${alpha(c, isDark ? 0.15 : 0.08)}` : undefined,
        '&:hover': { background: `linear-gradient(135deg, ${alpha(c, isDark ? 0.22 : 0.1)} 0%, ${alpha(c, isDark ? 0.1 : 0.04)} 100%)` },
        userSelect: 'none', transition: 'all 0.15s',
      }}>
        <Avatar sx={{
          width: 26, height: 26, fontSize: 11, fontWeight: 800,
          bgcolor: alpha(c, isDark ? 0.22 : 0.1), color: c,
          border: `2px solid ${alpha(c, 0.22)}`, flexShrink: 0,
        }}>{dept.name[0]}</Avatar>
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography fontWeight={700} fontSize={12} noWrap>{dept.name}</Typography>
            <Chip label={filtered.length} size="small" sx={{
              height: 16, fontSize: 9, fontWeight: 700, minWidth: 20,
              bgcolor: alpha(c, isDark ? 0.2 : 0.1), color: c,
              '& .MuiChip-label': { px: 0.4 }, flexShrink: 0,
            }} />
          </Stack>
        </Box>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c, boxShadow: `0 0 5px ${alpha(c, 0.5)}`, flexShrink: 0 }} />
        {open ? <ExpandLessRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
      </Box>

      {/* Droppable body */}
      <Collapse in={open} unmountOnExit>
        <Droppable droppableId={dept._id}>
          {(provided, snapshot) => (
            <Box ref={provided.innerRef} {...provided.droppableProps} sx={{
              px: 1, py: 0.75, minHeight: 36,
              bgcolor: snapshot.isDraggingOver ? alpha(c, isDark ? 0.08 : 0.035) : 'transparent',
              border: `1px solid ${alpha(c, isDark ? 0.15 : 0.08)}`,
              borderTop: 'none', borderRadius: '0 0 10px 10px',
              transition: 'background 0.15s',
            }}>
              {filtered.length === 0 && !snapshot.isDraggingOver && (
                <Typography fontSize={10} color="text.disabled" textAlign="center" py={1.5}>
                  {search ? 'Sin coincidencias' : 'Arrastra usuarios aquí'}
                </Typography>
              )}
              {filtered.map((user, i) => (
                <Draggable key={getUserId(user)} draggableId={getUserId(user)} index={i}>
                  {(p, s) => <UserRow user={user} isDragging={s.isDragging} innerRef={p.innerRef} draggableProps={p.draggableProps} dragHandleProps={p.dragHandleProps} />}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Collapse>
    </Box>
  );
});
DeptSection.displayName = 'DeptSection';

/* ─── Mobile tab type ──────────────────────────────────────────────────────── */
type MobileTab = 'users' | 'depts';

/* ─── Page ─────────────────────────────────────────────────────────────────── */
function Page() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileTab, setMobileTab] = useState<MobileTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  const {
    deptManagerOpen, departments, isLoading,
    columnUsers, unassignedUsers, totalUsers,
    handleDragEnd, handleAddMember, refresh,
    openDeptManager, closeDeptManager,
  } = useDepartmentBoard();

  // Filter unassigned users
  const filteredUnassigned = useMemo(() => {
    if (!userSearch) return unassignedUsers;
    const q = userSearch.toLowerCase();
    return unassignedUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q));
  }, [unassignedUsers, userSearch]);

  // Filter departments
  const filteredDepts = useMemo(() => {
    if (!deptSearch) return departments;
    const q = deptSearch.toLowerCase();
    return departments.filter(d => d.name.toLowerCase().includes(q));
  }, [departments, deptSearch]);

  const assignedCount = totalUsers - unassignedUsers.length;

  /* ── Left panel: Unassigned users ── */
  const usersPanel = (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
    }}>
      {/* Panel header */}
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
          <PersonOffRoundedIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          <Typography fontWeight={700} fontSize={13} flex={1}>Sin Asignar</Typography>
          <Chip label={unassignedUsers.length} size="small" sx={{
            height: 20, fontSize: 10, fontWeight: 700,
            bgcolor: alpha(theme.palette.warning.main, 0.12),
            color: 'warning.main',
          }} />
        </Stack>
        <TextField
          size="small" placeholder="Buscar usuario..." fullWidth
          value={userSearch} onChange={e => setUserSearch(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 11, height: 30 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} /></InputAdornment>,
            endAdornment: userSearch ? <InputAdornment position="end">
              <IconButton size="small" onClick={() => setUserSearch('')} sx={{ p: 0.15 }}>
                <CloseRoundedIcon sx={{ fontSize: 11 }} />
              </IconButton>
            </InputAdornment> : null,
          }}
        />
      </Box>

      {/* Droppable user list */}
      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <Box ref={provided.innerRef} {...provided.droppableProps} sx={{
            flex: 1, minHeight: 0, overflowY: 'auto', px: 1.25, py: 0.75,
            bgcolor: snapshot.isDraggingOver ? alpha(theme.palette.warning.main, 0.04) : 'transparent',
            '&::-webkit-scrollbar': { width: 3 },
            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.primary, 0.1), borderRadius: 2 },
          }}>
            {filteredUnassigned.length === 0 && (
              <Typography fontSize={10} color="text.disabled" textAlign="center" py={3}>
                {userSearch ? 'Sin coincidencias' : 'Todos asignados ✓'}
              </Typography>
            )}
            {filteredUnassigned.map((user, i) => (
              <Draggable key={getUserId(user)} draggableId={getUserId(user)} index={i}>
                {(p, s) => <UserRow user={user} isDragging={s.isDragging} innerRef={p.innerRef} draggableProps={p.draggableProps} dragHandleProps={p.dragHandleProps} />}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );

  /* ── Right panel: Departments ── */
  const deptsPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Panel header */}
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
          <FolderRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography fontWeight={700} fontSize={13} flex={1}>Departamentos</Typography>
          <Chip label={`${assignedCount} asignados`} size="small" sx={{
            height: 20, fontSize: 10, fontWeight: 600,
            bgcolor: alpha(theme.palette.success.main, 0.12),
            color: 'success.main',
          }} />
        </Stack>
        <TextField
          size="small" placeholder="Buscar departamento..." fullWidth
          value={deptSearch} onChange={e => setDeptSearch(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 11, height: 30 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} /></InputAdornment>,
            endAdornment: deptSearch ? <InputAdornment position="end">
              <IconButton size="small" onClick={() => setDeptSearch('')} sx={{ p: 0.15 }}>
                <CloseRoundedIcon sx={{ fontSize: 11 }} />
              </IconButton>
            </InputAdornment> : null,
          }}
        />
      </Box>

      {/* Department accordion list */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: 'auto', px: 1.25, py: 0.75,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.primary, 0.1), borderRadius: 2 },
      }}>
        {filteredDepts.map(dept => (
          <DeptSection
            key={dept._id}
            dept={dept}
            users={columnUsers[dept._id] ?? []}
            search={userSearch}
            defaultOpen={(columnUsers[dept._id] ?? []).length > 0}
          />
        ))}
        {filteredDepts.length === 0 && (
          <Typography fontSize={11} color="text.disabled" textAlign="center" py={4}>
            Sin departamentos encontrados
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <Box sx={{
        flexShrink: 0, px: { xs: 1.5, sm: 2 }, py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Avatar variant="rounded" sx={{
          width: 30, height: 30, borderRadius: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main,
          display: { xs: 'none', sm: 'flex' },
        }}><GroupsRoundedIcon sx={{ fontSize: 16 }} /></Avatar>
        <Box flex={1} minWidth={0}>
          <Typography fontWeight={800} fontSize={14} lineHeight={1.2}>Departamentos</Typography>
          <Typography fontSize={9} color="text.secondary">
            {isLoading ? 'Cargando...' : `${totalUsers} usuarios · ${departments.length} departamentos · ${assignedCount} asignados`}
          </Typography>
        </Box>
        <Tooltip title="Actualizar"><IconButton size="small" onClick={refresh} sx={{
          border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, width: 28, height: 28,
        }}><RefreshRoundedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
        <Tooltip title="Administrar"><IconButton size="small" onClick={openDeptManager} sx={{
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 1.5,
          width: 28, height: 28, color: theme.palette.primary.main,
        }}><SettingsRoundedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
      </Box>

      {/* ── Mobile tabs ── */}
      {isMobile && (
        <Stack direction="row" sx={{ borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
          {([['users', 'Usuarios', PeopleRoundedIcon, unassignedUsers.length], ['depts', 'Departamentos', FolderRoundedIcon, departments.length]] as const).map(([key, label, Icon, count]) => (
            <Box key={key} onClick={() => setMobileTab(key as MobileTab)} sx={{
              flex: 1, py: 1, cursor: 'pointer', textAlign: 'center', userSelect: 'none',
              borderBottom: mobileTab === key ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
              bgcolor: mobileTab === key ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
              transition: 'all 0.15s',
            }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <Icon sx={{ fontSize: 14, color: mobileTab === key ? 'primary.main' : 'text.secondary' }} />
                <Typography fontSize={11} fontWeight={mobileTab === key ? 700 : 500}
                  color={mobileTab === key ? 'primary.main' : 'text.secondary'}>
                  {label} ({count})
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {/* ── Main content: two-panel layout ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {isMobile ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {mobileTab === 'users' ? usersPanel : deptsPanel}
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
            {usersPanel}
            {deptsPanel}
          </Box>
        )}
      </DragDropContext>

      <DepartmentManager open={deptManagerOpen} onClose={closeDeptManager} />
    </Box>
  );
}

export default Page;
