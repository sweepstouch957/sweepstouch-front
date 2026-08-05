import { Department } from '@/services/department.service';
import { type Epic } from '@/services/epic.service';
import { Task, type Project } from '@/services/task.service';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Box,
  Button,
  Container,
  lighten,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useCustomization } from 'src/hooks/use-customization';
import { BoardFilters } from './board-filters';
import { boardStatusEntries, PROJECT_COLORS } from './constants';
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

  const statuses = boardStatusEntries(theme);

  /**
   * En móvil no hay tablero: hay UNA columna a la vez. Seis columnas apiladas
   * obligan a scrollear media pantalla para llegar a la que importa, y en
   * horizontal se pierde el pulgar. Arranca en "En curso": es lo que se mira.
   */
  const [mobileStatus, setMobileStatus] = React.useState('in_progress');

  /**
   * Las columnas vacías no merecen el mismo espacio: Respaldo y Bloqueada casi
   * siempre están en cero y se comían media pantalla con un "drop here" enorme.
   * Siguen siendo destino de arrastre, sólo que discretas.
   */
  const isEmpty = (key: string) => (filteredBoard?.byStatus[key]?.length ?? 0) === 0;

  return (
    <>
      {/* ═══ Proyectos ═══ */}
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
                borderRadius: '10px 10px 0 0',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 12.5,
                color: 'text.secondary',
                border: `1px solid transparent`,
                borderBottom: 'none',
                transition: 'background-color .18s, color .18s, border-color .18s',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                '&.Mui-selected': {
                  bgcolor: isDark ? lighten(theme.palette.neutral[900], 0.04) : 'common.white',
                  color: 'text.primary',
                  borderColor: isDark
                    ? alpha(theme.palette.common.white, 0.08)
                    : alpha(theme.palette.common.black, 0.1),
                },
                '&:hover:not(.Mui-selected)': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
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
            sx={{ mb: 1.5, borderRadius: 2, '& .MuiSelect-select': { py: 1.25 } }}
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
                </Stack>
              </MenuItem>
            ))}
          </Select>
        )}
      </Container>

      {/* ═══ Tablero ═══ */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: isDark ? lighten(theme.palette.neutral[900], 0.03) : 'common.white',
          border: `1px solid ${
            isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.08)
          }`,
          borderRadius: { xs: 3, md: '0 12px 12px 12px' },
          pt: 1.5,
        }}
      >
        <Container
          maxWidth={customization.stretch ? false : 'xl'}
          disableGutters={!mdUp}
          sx={{ px: { xs: 1.5, md: 3 } }}
        >
          <BoardFilters
            departments={departments}
            selectedDepts={selectedDepts}
            onDeptsChange={onDeptsChange}
            teamMembers={teamMembers}
            selectedUsers={selectedUsers}
            onUsersChange={onUsersChange}
            priorityFilter={priorityFilter}
            onPriorityChange={onPriorityChange}
            onlyMine={onlyMine}
            onToggleOnlyMine={onToggleOnlyMine}
            onlyMentions={onlyMentions}
            onToggleOnlyMentions={onToggleOnlyMentions}
            epics={epics}
            epicFilter={epicFilter}
            onEpicFilterChange={onEpicFilterChange}
            search={search}
            onSearchChange={onSearchChange}
            onClearFilters={onClearFilters}
            shown={filteredBoard?.total || 0}
            total={filteredBoard?.allTotal || 0}
          />

          {/* Estados: en escritorio informan, en móvil además navegan */}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              mt: 1.5,
              mb: 1.5,
              overflowX: 'auto',
              pb: 0.5,
              mx: { xs: -1.5, md: 0 },
              px: { xs: 1.5, md: 0 },
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {statuses.map(([key, meta]) => {
              const count = statusCounts[key] || 0;
              const active = !mdUp && mobileStatus === key;
              return (
                <Box
                  key={key}
                  role={mdUp ? undefined : 'tab'}
                  aria-selected={mdUp ? undefined : active}
                  onClick={mdUp ? undefined : () => setMobileStatus(key)}
                  sx={{
                    px: 1.25,
                    height: { xs: 40, md: 30 },
                    borderRadius: 2,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    cursor: mdUp ? 'default' : 'pointer',
                    border: `1px solid ${alpha(meta.color, active ? 0.55 : 0.2)}`,
                    bgcolor: alpha(meta.color, active ? 0.16 : 0.05),
                    transition: 'background-color .18s, border-color .18s',
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  }}
                >
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    fontSize={11.5}
                    color={meta.color}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {count}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontSize={11.5}
                    fontWeight={active ? 700 : 400}
                    color={active ? 'text.primary' : 'text.secondary'}
                    noWrap
                  >
                    {meta.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Container>

        {/* ── Columnas ── */}
        <Box sx={{ flex: 1, overflowY: { xs: 'auto', md: 'hidden' }, overflowX: { md: 'auto' } }}>
          <Container
            maxWidth={customization.stretch ? false : 'xl'}
            disableGutters={!mdUp}
            sx={{ pb: { xs: 10, md: 2 }, px: { xs: 1.5, md: 3 } }}
          >
            {loadingBoard || loadingProjects ? (
              <BoardSkeleton mdUp={mdUp} />
            ) : filteredBoard ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', md: 'row' }}
                  alignItems="flex-start"
                  sx={{ minWidth: { md: 'max-content' }, pb: 1 }}
                >
                  {statuses.map(([statusKey]) =>
                    /* Móvil: sólo la columna elegida. Escritorio: todas. */
                    !mdUp && statusKey !== mobileStatus ? null : (
                      <KanbanColumn
                        key={statusKey}
                        statusKey={statusKey}
                        tasks={filteredBoard.byStatus[statusKey] || NO_TASKS}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onAdd={onAddTask}
                        compact={mdUp && isEmpty(statusKey)}
                      />
                    )
                  )}
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
                  {loadingProjects ? 'Cargando proyectos…' : 'Elegí o creá un proyecto para empezar'}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={onCreateProject}
                  sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  disableElevation
                >
                  Crear proyecto
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
 * Esqueleto con la forma real del tablero. Un spinner centrado deja la pantalla
 * en blanco y hace que la carga se sienta más larga de lo que es.
 */
function BoardSkeleton({ mdUp }: { mdUp: boolean }) {
  const theme = useTheme();
  const cols = mdUp ? boardStatusEntries(theme).slice(0, 5) : boardStatusEntries(theme).slice(0, 1);
  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', md: 'row' }}
      gap={1.5}
    >
      {cols.map(([key]) => (
        <Box
          key={key}
          sx={{ flex: 1, minWidth: { md: 260 } }}
        >
          <Skeleton
            variant="text"
            width={110}
            height={20}
          />
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={92}
              sx={{ mb: 1.25, borderRadius: 2, opacity: 1 - i * 0.25 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
