'use client';

import React, { useState, useMemo } from 'react';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  styled,
  Tab,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { useCustomization } from 'src/hooks/use-customization';
import { usersApi } from '@/mocks/users';
import { taskClient } from '@/services/task.service';
import { departmentService } from '@/services/department.service';
import { TabsPills } from 'src/components/base/styles/tabs';

/* ─── Styled components ─── */
const CardCover = styled(Card)(({ theme }) => `
  position: relative;
  .MuiCardMedia-root { height: ${theme.spacing(22)}; }
`);

const AvatarWrapper = styled(Card)(({ theme }) => `
  position: relative;
  overflow: visible;
  display: inline-block;
  margin-top: -${theme.spacing(8)};
  margin-left: ${theme.spacing(2)};
  .MuiAvatar-root { width: ${theme.spacing(14)}; height: ${theme.spacing(14)}; }
`);

/* ─── Priority config ─── */
const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#FF1744', label: 'Critical' },
  high: { color: '#FF9100', label: 'High' },
  medium: { color: '#FFC400', label: 'Medium' },
  low: { color: '#00E676', label: 'Low' },
};

const STATUS_COLORS: Record<string, string> = {
  backlog: '#9E9E9E', todo: '#42A5F5', in_progress: '#FFA726', in_review: '#AB47BC', done: '#66BB6A',
};

/* ─── Role metadata ─── */
const ROLE_META: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: '#F44336' },
  design: { label: 'Designer', color: '#E91E63' },
  campaign_manager: { label: 'Campaign Manager', color: '#FF9800' },
  promotor_manager: { label: 'Promotor Manager', color: '#9C27B0' },
  general_manager: { label: 'General Manager', color: '#2196F3' },
  merchant_manager: { label: 'Merchant Manager', color: '#009688' },
  merchant: { label: 'Merchant', color: '#4CAF50' },
  cashier: { label: 'Cashier', color: '#FF5722' },
  promotor: { label: 'Promotor', color: '#795548' },
  marketing: { label: 'Marketing', color: '#3F51B5' },
};

/* ─── Info Row ─── */
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} py={0.75}>
    <Box sx={{ opacity: 0.5 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontSize={10} fontWeight={600}>{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
  </Stack>
);

/* ═══════ MAIN PAGE ═══════ */
export default function UserProfilePage() {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isDark = theme.palette.mode === 'dark';
  const customization = useCustomization();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const [currentTab, setCurrentTab] = useState(0);

  const tabs = [
    { value: 0, label: 'Overview' },
    { value: 1, label: 'Tasks' },
    { value: 2, label: 'Activity' },
  ];

  /* ── Queries ── */
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 120_000,
  });

  const user = useMemo(() => {
    if (!userId || allUsers.length === 0) return null;
    return allUsers.find((u: any) => u._id === userId || u.id === userId) || null;
  }, [userId, allUsers]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
  });

  const userDept = useMemo(() => {
    if (!user?.departmentId || departments.length === 0) return null;
    return departments.find((d) => d._id === user.departmentId) || null;
  }, [user, departments]);

  const { data: board } = useQuery({
    queryKey: ['all-tasks-profile'],
    queryFn: () => taskClient.getAiContext(),
    staleTime: 60_000,
  });

  // Get user's tasks (simulated by matching assigneeName)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => taskClient.getProjects(),
    staleTime: 60_000,
  });

  // Get ALL tasks across all projects for this user
  const { data: allBoardData } = useQuery({
    queryKey: ['board', projects?.[0]?._id],
    queryFn: () => projects?.[0] ? taskClient.getBoard(projects[0]._id) : null,
    enabled: !!projects?.[0],
  });

  const userTasks = useMemo(() => {
    if (!allBoardData || !user) return [];
    const name = `${user.firstName} ${(user.lastName || '')[0] || ''}`.trim();
    return Object.values(allBoardData.tasks).filter((t: any) => {
      if (!t.assigneeName) return false;
      return t.assigneeName.toLowerCase().includes(user.firstName?.toLowerCase()) ||
        t.assigneeName.toLowerCase() === name.toLowerCase();
    });
  }, [allBoardData, user]);

  const taskStats = useMemo(() => {
    const stats = { total: userTasks.length, done: 0, inProgress: 0, todo: 0 };
    userTasks.forEach((t: any) => {
      if (t.status === 'done') stats.done++;
      else if (t.status === 'in_progress') stats.inProgress++;
      else stats.todo++;
    });
    return stats;
  }, [userTasks]);

  const roleMeta = ROLE_META[user?.role || 'admin'] || { label: user?.role || 'Unknown', color: '#999' };

  if (loadingUsers || !userId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        {!userId ? (
          <Stack alignItems="center" spacing={2}>
            <Typography variant="h5" color="text.secondary">No user selected</Typography>
            <Button variant="outlined" onClick={() => router.push('/admin/management/users-listing')}>
              Go to Users
            </Button>
          </Stack>
        ) : <CircularProgress />}
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography variant="h5" color="text.secondary">User not found</Typography>
      </Box>
    );
  }

  const coverGradient = `linear-gradient(135deg, ${alpha(roleMeta.color, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`;

  return (
    <Box minWidth="100%">
      <Container maxWidth={customization.stretch ? false : 'xl'}>
        <Box py={{ xs: 2, sm: 3 }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* ═══ Profile Cover (8 cols) ═══ */}
            <Grid xs={12} md={8}>
              {/* Back button + title */}
              <Box display="flex" alignItems="center" mb={2}>
                <Tooltip arrow placement="top" title="Back to users">
                  <IconButton
                    onClick={() => router.push('/admin/management/users-listing')}
                    sx={{
                      mr: 1.5, width: 40, height: 40,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                    }}
                  >
                    <ArrowBackTwoToneIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team member profile & task overview
                  </Typography>
                </Box>
              </Box>

              {/* Cover card */}
              <CardCover elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <CardMedia sx={{ background: coverGradient }}>
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="h2" fontWeight={900}
                      sx={{ color: 'rgba(255,255,255,0.12)', letterSpacing: 8, textTransform: 'uppercase' }}
                    >
                      {user.firstName}
                    </Typography>
                  </Box>
                </CardMedia>
              </CardCover>

              {/* Avatar + Name */}
              <AvatarWrapper elevation={4} sx={{ borderRadius: 3 }}>
                <Avatar variant="rounded" alt={user.firstName} src={user.profileImage} />
              </AvatarWrapper>

              <Box pt={2} pl={2}>
                <Typography variant="h4" fontWeight={800}>
                  {user.firstName} {user.lastName}
                  <Typography variant="h6" fontWeight={500} sx={{ pl: 0.5 }} color="text.secondary" component="span">
                    ({roleMeta.label})
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>

                <Stack mt={1.5} gap={1} flexDirection="row" flexWrap="wrap">
                  <Chip variant="outlined" color="primary" size="small"
                    label={roleMeta.label}
                    sx={{ fontWeight: 700, borderColor: roleMeta.color, color: roleMeta.color }}
                  />
                  {userDept && (
                    <Chip size="small" label={userDept.name}
                      sx={{ fontWeight: 700, bgcolor: alpha(userDept.color, 0.1), color: userDept.color }}
                    />
                  )}
                  {user.active !== false && (
                    <Chip size="small" color="success" variant="outlined" label="Active" />
                  )}
                </Stack>

                <Divider sx={{ ml: -2.5, my: 2 }} />

                {/* Stats row */}
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={800} color="primary.main">{taskStats.total}</Typography>
                    <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={800} color="success.main">{taskStats.done}</Typography>
                    <Typography variant="caption" color="text.secondary">Completed</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={800} color="warning.main">{taskStats.inProgress}</Typography>
                    <Typography variant="caption" color="text.secondary">In Progress</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={800} color="info.main">{taskStats.todo}</Typography>
                    <Typography variant="caption" color="text.secondary">To Do</Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* ═══ Sidebar (4 cols) ═══ */}
            <Grid xs={12} md={4}>
              {/* User Info Card */}
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Contact Information
                  </Typography>
                  <InfoRow
                    icon={<EmailRoundedIcon fontSize="small" />}
                    label="Email"
                    value={user.email || 'Not set'}
                  />
                  <InfoRow
                    icon={<PhoneRoundedIcon fontSize="small" />}
                    label="Phone"
                    value={user.phoneNumber ? `${user.countryCode || ''} ${user.phoneNumber}` : 'Not set'}
                  />
                  <InfoRow
                    icon={<BadgeRoundedIcon fontSize="small" />}
                    label="Role"
                    value={
                      <Chip size="small" label={roleMeta.label}
                        sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha(roleMeta.color, 0.1), color: roleMeta.color }}
                      />
                    }
                  />
                  {userDept && (
                    <InfoRow
                      icon={<GroupsRoundedIcon fontSize="small" />}
                      label="Department"
                      value={
                        <Chip size="small" label={userDept.name}
                          sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha(userDept.color, 0.1), color: userDept.color }}
                        />
                      }
                    />
                  )}
                  <InfoRow
                    icon={<CalendarTodayRoundedIcon fontSize="small" />}
                    label="Member Since"
                    value={user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Unknown'}
                  />
                </CardContent>
              </Card>

              {/* Task Progress Card */}
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Task Progress
                  </Typography>
                  <Box mt={1}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}
                      sx={{
                        height: 8, borderRadius: 4,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'success.main' },
                      }}
                    />
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack spacing={1}>
                    {Object.entries({ done: 'Completed', in_progress: 'In Progress', todo: 'To Do', in_review: 'In Review', backlog: 'Backlog' }).map(([key, label]) => {
                      const count = userTasks.filter((t: any) => t.status === key).length;
                      if (count === 0) return null;
                      return (
                        <Stack key={key} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[key] || '#999' }} />
                            <Typography variant="caption" fontWeight={600}>{label}</Typography>
                          </Stack>
                          <Chip label={count} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                        </Stack>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* ═══ Tabs ═══ */}
            <Grid xs={12}>
              {smUp ? (
                <TabsPills
                  onChange={(_, v: number) => setCurrentTab(v)}
                  value={currentTab}
                  textColor="secondary"
                  indicatorColor="secondary"
                  sx={{
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14 },
                  }}
                >
                  {tabs.map((t) => <Tab key={t.value} label={t.label} value={t.value} />)}
                </TabsPills>
              ) : (
                <Select value={currentTab} onChange={(e) => setCurrentTab(e.target.value as number)} fullWidth>
                  {tabs.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              )}
            </Grid>

            {/* ═══ Tab Content ═══ */}
            <Grid xs={12}>
              {/* Overview Tab */}
              {currentTab === 0 && (
                <Grid container spacing={2}>
                  {userTasks.length > 0 ? userTasks.map((task: any) => (
                    <Grid xs={12} sm={6} md={4} key={task._id}>
                      <Card elevation={0} sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderLeft: `3px solid ${(PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium).color}`,
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] },
                      }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                              {task.title}
                            </Typography>
                          </Stack>
                          {task.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, mb: 1 }}>
                              {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            <Chip size="small" label={(PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium).label}
                              sx={{
                                height: 20, fontSize: 10, fontWeight: 700,
                                bgcolor: alpha((PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium).color, 0.1),
                                color: (PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium).color,
                              }}
                            />
                            <Chip size="small" variant="outlined"
                              label={task.status.replace('_', ' ')}
                              sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  )) : (
                    <Grid xs={12}>
                      <Box textAlign="center" py={6}>
                        <AssignmentRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary">No tasks assigned yet</Typography>
                        <Typography variant="body2" color="text.disabled">
                          Assign tasks from the Projects Board
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Tasks Tab */}
              {currentTab === 1 && (
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} mb={2}>
                      All Tasks ({userTasks.length})
                    </Typography>
                    <Stack spacing={1}>
                      {userTasks.map((task: any) => {
                        const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        return (
                          <Box key={task._id}
                            sx={{
                              p: 1.5, borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              borderLeft: `3px solid ${pri.color}`,
                              transition: 'all 0.15s',
                              '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.02) },
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box flex={1}>
                                <Typography variant="subtitle2" fontWeight={700}>{task.title}</Typography>
                                {task.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {task.description.slice(0, 100)}
                                  </Typography>
                                )}
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <Chip size="small" label={pri.label}
                                  sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha(pri.color, 0.1), color: pri.color }}
                                />
                                <Chip size="small" variant="outlined"
                                  label={task.status.replace('_', ' ')}
                                  sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
                                />
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                      {userTasks.length === 0 && (
                        <Box textAlign="center" py={4}>
                          <Typography variant="body2" color="text.disabled">No tasks assigned</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Activity Tab */}
              {currentTab === 2 && (
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} mb={2}>
                      Recent Activity
                    </Typography>
                    <Stack spacing={2}>
                      {user?.lastLogin && (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <AccessTimeRoundedIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Last Login</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                      {user.createdAt && (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <CalendarTodayRoundedIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Account Created</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                      {taskStats.done > 0 && (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <CheckCircleRoundedIcon fontSize="small" color="success" />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Tasks Completed</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {taskStats.done} tasks finished
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                      {taskStats.inProgress > 0 && (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <TrendingUpRoundedIcon fontSize="small" color="warning" />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Currently Working</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {taskStats.inProgress} tasks in progress
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
