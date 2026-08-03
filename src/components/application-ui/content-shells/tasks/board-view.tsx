import { Department } from '@/services/department.service';
import { type Epic } from '@/services/epic.service';
import { Task, type Project } from '@/services/task.service';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Unstable_Grid2 as Grid,
  InputAdornment,
  lighten,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useCustomization } from 'src/hooks/use-customization';
import {
  cbChecked,
  cbIcon,
  priorityEntries,
  PROJECT_COLORS,
  boardStatusEntries,
} from './constants';
import { KanbanColumn } from './kanban-column';

/** Referencia estable: `|| []` inline creaba un array nuevo y tumbaba el memo. */
const NO_TASKS: Task[] = [];

export type FilteredBoard = {
  byStatus: Record<string, Task[]>;
  total: number;
  allTotal: number;
};

type BoardViewProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  loadingProjects: boolean;
  loadingBoard: boolean;
  filteredBoard: FilteredBoard | null;
  statusCounts: Record<string, number>;
  departments: Department[];
  selectedDepts: Department[];
  onDeptsChange: (v: Department[]) => void;
  teamMembers: any[];
  selectedUsers: any[];
  onUsersChange: (v: any[]) => void;
  onlyMine: boolean;
  onToggleOnlyMine: () => void;
  onlyMentions: boolean;
  onToggleOnlyMentions: () => void;
  epics: Epic[];
  epicFilter: string;
  onEpicFilterChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  onClearFilters: () => void;
  onDragEnd: (result: DropResult) => void;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (status: string) => void;
  onCreateProject: () => void;
};

export const BoardView = React.memo(function BoardView({
  projects,
  selectedProjectId,
  onSelectProject,
  loadingProjects,
  loadingBoard,
  filteredBoard,
  statusCounts,
  departments,
  selectedDepts,
  onDeptsChange,
  teamMembers,
  selectedUsers,
  onUsersChange,
  onlyMine,
  onToggleOnlyMine,
  onlyMentions,
  onToggleOnlyMentions,
  epics,
  epicFilter,
  onEpicFilterChange,
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  onClearFilters,
  onDragEnd,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onCreateProject,
}: BoardViewProps) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';
  const customization = useCustomization();

  const hasActiveFilters =
    selectedDepts.length > 0 ||
    selectedUsers.length > 0 ||
    !!search ||
    priorityFilter !== 'all' ||
    epicFilter !== 'all' ||
    onlyMentions;

  return (
    <>
      {/* ═══ Project Tabs ═══ */}
      <Container
        disableGutters={!mdUp}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        {mdUp ? (
          <Tabs
            value={selectedProjectId || false}
            onChange={(_, v) => onSelectProject(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 0,
              minHeight: 40,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 36,
                py: 0,
                px: 2,
                mr: 0.5,
                borderRadius: '8px 8px 0 0',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 12.5,
                color: 'text.secondary',
                border: `1px solid transparent`,
                borderBottom: 'none',
                transition: 'all 0.15s',
                '&.Mui-selected': {
                  bgcolor: isDark ? lighten(theme.palette.neutral[900], 0.04) : 'common.white',
                  color: 'text.primary',
                  borderColor: isDark
                    ? alpha(theme.palette.common.white, 0.08)
                    : alpha(theme.palette.common.black, 0.1),
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                },
              },
            }}
          >
            {projects.map((p) => (
              <Tab
                key={p._id}
                value={p._id}
                label={
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: p.color || PROJECT_COLORS[0],
                        flexShrink: 0,
                      }}
                    />
                    <span>{p.name}</span>
                    {p.identifier && (
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', fontSize: 9.5, opacity: 0.5 }}
                      >
                        {p.identifier}
                      </Typography>
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>
        ) : (
          <Select
            value={selectedProjectId || ''}
            onChange={(e) => onSelectProject(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2, borderRadius: 1.5 }}
          >
            {projects.map((p) => (
              <MenuItem
                key={p._id}
                value={p._id}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: p.color || PROJECT_COLORS[0],
                    }}
                  />
                  <span>{p.name}</span>
                  {p.identifier && (
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace', opacity: 0.5 }}
                    >
                      {p.identifier}
                    </Typography>
                  )}
                </Stack>
              </MenuItem>
            ))}
          </Select>
        )}
      </Container>

      {/* ═══ Board card ═══ */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: isDark ? lighten(theme.palette.neutral[900], 0.03) : 'common.white',
          border: `1px solid ${
            isDark
              ? alpha(theme.palette.common.white, 0.06)
              : alpha(theme.palette.common.black, 0.08)
          }`,
          borderRadius: '0 8px 8px 8px',
          pt: 1.25,
        }}
      >
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          {/* ── Filters ── */}
          <Grid
            container
            spacing={1}
            mb={1}
          >
            <Grid
              xs={12}
              md={4}
            >
              <Autocomplete
                multiple
                limitTags={2}
                size="small"
                options={departments}
                value={selectedDepts}
                onChange={(_, v) => onDeptsChange(v)}
                getOptionLabel={(o) => o.name}
                disableCloseOnSelect
                renderOption={({ key, ...props }, option, { selected }) => (
                  <li
                    key={option._id}
                    {...props}
                  >
                    <Checkbox
                      icon={cbIcon}
                      checkedIcon={cbChecked}
                      sx={{ mr: 1, p: 0 }}
                      checked={selected}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: option.color,
                        mr: 1,
                      }}
                    />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Filter by department…"
                  />
                )}
                renderTags={(tags, getTagProps) =>
                  tags.map((d, i) => (
                    <Chip
                      key={d._id}
                      label={d.name}
                      size="small"
                      {...getTagProps({ index: i })}
                      sx={{
                        bgcolor: alpha(d.color, 0.1),
                        color: d.color,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  ))
                }
              />
            </Grid>
            <Grid
              xs={12}
              md={4}
            >
              <Autocomplete
                multiple
                limitTags={2}
                size="small"
                options={teamMembers}
                value={selectedUsers}
                onChange={(_, v) => onUsersChange(v)}
                getOptionLabel={(o: any) => `${o.firstName} ${o.lastName || ''}`}
                disableCloseOnSelect
                renderOption={(props, option: any, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={cbIcon}
                      checkedIcon={cbChecked}
                      sx={{ mr: 1, p: 0 }}
                      checked={selected}
                    />
                    <Avatar
                      src={option.profileImage}
                      sx={{ width: 22, height: 22, mr: 1, fontSize: 10 }}
                    >
                      {option.firstName?.[0]}
                    </Avatar>
                    {option.firstName} {option.lastName?.[0] || ''}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Filter by member…"
                  />
                )}
                renderTags={(tags, getTagProps) =>
                  tags.map((u: any, i: number) => (
                    <Chip
                      key={u.id || u._id}
                      size="small"
                      {...getTagProps({ index: i })}
                      label={`${u.firstName} ${u.lastName?.[0] || ''}`}
                      avatar={<Avatar src={u.profileImage}>{u.firstName?.[0]}</Avatar>}
                    />
                  ))
                }
              />
            </Grid>
            <Grid
              xs={12}
              md={4}
            >
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
              >
                <Chip
                  icon={<PersonOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label="Only mine"
                  size="small"
                  variant={onlyMine ? 'filled' : 'outlined'}
                  color={onlyMine ? 'primary' : 'default'}
                  onClick={onToggleOnlyMine}
                  sx={{
                    height: 28,
                    fontWeight: 700,
                    fontSize: 11,
                    borderRadius: 1.5,
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                />
                {/* Dónde pidieron mi ayuda, aunque la tarea no sea mía */}
                <Chip
                  icon={<AlternateEmailRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label="Me mencionaron"
                  size="small"
                  variant={onlyMentions ? 'filled' : 'outlined'}
                  color={onlyMentions ? 'warning' : 'default'}
                  onClick={onToggleOnlyMentions}
                  sx={{
                    height: 28,
                    fontWeight: 700,
                    fontSize: 11,
                    borderRadius: 1.5,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                />
                <SearchField
                  value={search}
                  onChange={onSearchChange}
                />
                <Select
                  size="small"
                  value={priorityFilter}
                  onChange={(e) => onPriorityChange(e.target.value)}
                  sx={{ minWidth: 110, borderRadius: 1.5, fontSize: 11 }}
                >
                  <MenuItem value="all">All priority</MenuItem>
                  {priorityEntries(theme).map(([k, c]) => (
                    <MenuItem
                      key={k}
                      value={k}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                      >
                        <FlagRoundedIcon sx={{ fontSize: 13, color: c.color }} />
                        <span>{c.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
          </Grid>

          {/* ── Épicas ──
              Agrupan tareas de distintas áreas bajo un mismo objetivo ("Manual
              de marca", "RCS"). No son otro tablero: filtran el que ya está. */}
          {epics.length > 0 && (
            <Stack
              direction="row"
              spacing={0.75}
              mb={1}
              sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 3 } }}
            >
              <Chip
                label="Todas"
                size="small"
                variant={epicFilter === 'all' ? 'filled' : 'outlined'}
                onClick={() => onEpicFilterChange('all')}
                sx={{ height: 24, fontSize: 10.5, fontWeight: 700, borderRadius: 1.5, flexShrink: 0 }}
              />
              {epics.map((e) => {
                const active = epicFilter === e._id;
                return (
                  <Chip
                    key={e._id}
                    size="small"
                    onClick={() => onEpicFilterChange(active ? 'all' : e._id)}
                    label={
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.6}
                      >
                        <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: e.color }} />
                        <span>{e.name}</span>
                        <Typography
                          component="span"
                          sx={{ fontSize: 9.5, opacity: 0.65 }}
                        >
                          {e.done}/{e.total}
                        </Typography>
                      </Stack>
                    }
                    sx={{
                      height: 24,
                      fontSize: 10.5,
                      fontWeight: 700,
                      borderRadius: 1.5,
                      flexShrink: 0,
                      border: `1px solid ${alpha(e.color, active ? 0.9 : 0.35)}`,
                      bgcolor: active ? alpha(e.color, 0.16) : 'transparent',
                      color: active ? e.color : 'text.secondary',
                      '&:hover': { bgcolor: alpha(e.color, 0.1) },
                    }}
                  />
                );
              })}
              <Chip
                label="Sin épica"
                size="small"
                variant={epicFilter === 'none' ? 'filled' : 'outlined'}
                onClick={() => onEpicFilterChange(epicFilter === 'none' ? 'all' : 'none')}
                sx={{ height: 24, fontSize: 10.5, fontWeight: 600, borderRadius: 1.5, flexShrink: 0 }}
              />
            </Stack>
          )}

          {/* ── Status summary bar ── */}
          <Stack
            direction="row"
            spacing={1}
            mb={2}
            flexWrap="wrap"
          >
            {boardStatusEntries(theme).map(([key, meta]) => (
              <Box
                key={key}
                sx={{
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(meta.color, 0.2)}`,
                  bgcolor: alpha(meta.color, 0.05),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  fontSize={11}
                  color={meta.color}
                >
                  {statusCounts[key] || 0}
                </Typography>
                <Typography
                  variant="caption"
                  fontSize={11}
                  color="text.secondary"
                >
                  {meta.label}
                </Typography>
              </Box>
            ))}
            {hasActiveFilters && (
              <>
                <Box sx={{ flex: 1 }} />
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {filteredBoard?.total || 0} of {filteredBoard?.allTotal || 0} tasks shown
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ fontSize: 11, textTransform: 'none', py: 0 }}
                    onClick={onClearFilters}
                  >
                    Clear
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Container>

        {/* ── Kanban Board ── */}
        <Box sx={{ flex: 1, overflowY: 'hidden', overflowX: 'auto' }}>
          <Container
            maxWidth={customization.stretch ? false : 'xl'}
            sx={{ pb: 2 }}
          >
            {loadingBoard || loadingProjects ? (
              <Box
                display="flex"
                justifyContent="center"
                py={8}
              >
                <CircularProgress />
              </Box>
            ) : filteredBoard ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', md: 'row' }}
                  alignItems="flex-start"
                  sx={{ minWidth: { md: 1100 }, pb: 1 }}
                >
                  {boardStatusEntries(theme).map(([statusKey]) => (
                    <KanbanColumn
                      key={statusKey}
                      statusKey={statusKey}
                      tasks={filteredBoard.byStatus[statusKey] || NO_TASKS}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onAdd={onAddTask}
                    />
                  ))}
                </Box>
              </DragDropContext>
            ) : (
              <Box
                textAlign="center"
                py={8}
              >
                <ViewKanbanRoundedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                <Typography
                  variant="h6"
                  color="text.secondary"
                  mb={0.5}
                >
                  {loadingProjects
                    ? 'Loading projects…'
                    : 'Select or create a project to start'}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={onCreateProject}
                  sx={{ mt: 2, borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                  disableElevation
                >
                  Create Project
                </Button>
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </>
  );
});

/**
 * El texto se pinta al instante (estado local) y el filtrado del board va en
 * `startTransition`: React prioriza la tecla sobre el repintado de las columnas.
 */
const SearchField = React.memo(function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = React.useState(value);
  const [, startTransition] = React.useTransition();

  // Reset externo ("Clear")
  React.useEffect(() => setLocal(value), [value]);

  return (
    <TextField
      size="small"
      placeholder="Search…"
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        startTransition(() => onChange(v));
      }}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ fontSize: 16, opacity: 0.4 }} />
          </InputAdornment>
        ),
      }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
    />
  );
});
