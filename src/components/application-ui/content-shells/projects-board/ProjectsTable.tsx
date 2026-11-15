'use client';

import { useConfirm } from '@/components/base/confirm';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Avatar,
  AvatarGroup,
  Box,
  Card,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { LinearProgressSlim } from 'src/components/base/styles/progress-bar';
import { PROJECT_COLORS } from './constants';
import { StatusChip } from './StatusChip';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<
  ReturnType<typeof useProjectsBoard>,
  | 'toggleView'
  | 'page'
  | 'setPage'
  | 'limit'
  | 'setLimit'
  | 'setEditingProject'
  | 'isLoading'
  | 'deleteProjectMut'
  | 'filtered'
  | 'paginated'
  | 'handleOpenBoard'
>;

/** Vista tabla con acciones editar / abrir tablero / borrar y paginación. */
export function ProjectsTable({
  toggleView,
  page,
  setPage,
  limit,
  setLimit,
  setEditingProject,
  isLoading,
  deleteProjectMut,
  filtered,
  paginated,
  handleOpenBoard,
}: Props) {
  const theme = useTheme();
  const confirm = useConfirm();

  return (
    <>
      {!isLoading && filtered.length > 0 && toggleView === 'table_view' && (
        <>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Tags</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((project) => (
                    <TableRow
                      hover
                      key={project._id}
                    >
                      <TableCell>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: project.color || PROJECT_COLORS[0],
                              flexShrink: 0,
                            }}
                          />
                          <Box>
                            <Typography
                              noWrap
                              variant="h6"
                              fontWeight={600}
                              sx={{ maxWidth: 180 }}
                            >
                              {project.name}
                            </Typography>
                            {project.description && (
                              <Typography
                                color="text.secondary"
                                noWrap
                                sx={{ maxWidth: 180, fontSize: 12 }}
                              >
                                {project.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {project.identifier ? (
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              bgcolor: alpha(project.color || theme.palette.primary.main, 0.1),
                              color: project.color || 'primary.main',
                              px: 0.75,
                              py: 0.3,
                              borderRadius: 1,
                            }}
                          >
                            {project.identifier}
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                          >
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.4}
                        >
                          {(project.tags || []).slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {(project.members || []).length > 0 ? (
                          <AvatarGroup
                            max={4}
                            sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11 } }}
                          >
                            {(project.members || []).map((m) => (
                              <Tooltip
                                key={m.id}
                                title={m.name}
                                arrow
                                placement="top"
                              >
                                <Avatar
                                  src={m.avatar || undefined}
                                  sx={{ width: 28, height: 28 }}
                                >
                                  {m.name.charAt(0)}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                          >
                            No members
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ minWidth: 130 }}
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          <LinearProgressSlim
                            sx={{ flex: 1 }}
                            value={project.progress ?? 0}
                            color={
                              (project.progress ?? 0) >= 100
                                ? 'success'
                                : (project.progress ?? 0) >= 50
                                  ? 'primary'
                                  : 'warning'
                            }
                            variant="determinate"
                          />
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ minWidth: 36, color: 'text.secondary' }}
                          >
                            {project.progress ?? 0}%
                          </Typography>
                        </Box>
                        {project.taskStats && (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                          >
                            {project.taskStats.done}/{project.taskStats.total} done
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={project.workflowStatus || 'not_started'} />
                      </TableCell>
                      <TableCell>
                        {project.dueDate ? (
                          <>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              noWrap
                            >
                              {format(new Date(project.dueDate), 'dd MMM yyyy')}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}
                            </Typography>
                          </>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                          >
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        <Tooltip
                          title="Edit project"
                          arrow
                        >
                          <IconButton
                            size="small"
                            onClick={() => setEditingProject(project)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title="Open board"
                          arrow
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenBoard(project._id)}
                          >
                            <ViewKanbanRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title="Delete"
                          arrow
                        >
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              void confirm({
                                title: `¿Eliminar el proyecto «${project.name}»?`,
                                description:
                                  'Se borra el proyecto con su tablero y sus tareas. No se puede deshacer.',
                                severity: 'error',
                                confirmLabel: 'Eliminar proyecto',
                              }).then((ok) => ok && deleteProjectMut.mutate(project._id))
                            }
                          >
                            <DeleteTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          <Box pt={2}>
            <TablePagination
              component="div"
              count={filtered.length}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(0);
              }}
              page={page}
              rowsPerPage={limit}
              rowsPerPageOptions={[6, 9, 15]}
              slotProps={{ select: { variant: 'outlined', size: 'small' } }}
            />
          </Box>
        </>
      )}
    </>
  );
}
