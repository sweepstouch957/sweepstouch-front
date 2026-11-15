'use client';

import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  LinearProgress,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format, isPast } from 'date-fns';
import { CardWrapper } from 'src/components/application-ui/tables/users/styles';
import { tint, tintBorder } from 'src/theme/semantic';
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
  | 'filtered'
  | 'paginated'
  | 'handleOpenBoard'
>;

/** Vista grilla de tarjetas de proyecto con paginación. */
export function ProjectsGrid({
  toggleView,
  page,
  setPage,
  limit,
  setLimit,
  setEditingProject,
  isLoading,
  filtered,
  paginated,
  handleOpenBoard,
}: Props) {
  const theme = useTheme();

  return (
    <>
      {!isLoading && filtered.length > 0 && toggleView === 'grid_view' && (
        <>
          <Grid
            container
            spacing={{ xs: 2, sm: 3 }}
          >
            {paginated.map((project) => (
              <Grid
                xs={12}
                md={6}
                lg={4}
                key={project._id}
              >
                <CardWrapper
                  elevation={0}
                  sx={{
                    position: 'relative',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    '&:hover': {
                      borderColor: tintBorder(theme, 'primary'),
                      bgcolor: tint(theme, 'primary', 0.04),
                    },
                  }}
                >
                  <Box
                    position="relative"
                    zIndex={2}
                  >
                    {/* Card header */}
                    <Box
                      pl={2}
                      py={1.25}
                      pr={1.5}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
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
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.4}
                          alignItems="center"
                        >
                          {project.identifier && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: 10,
                                color: project.color || 'primary.main',
                                opacity: 0.8,
                              }}
                            >
                              {project.identifier}
                            </Typography>
                          )}
                          {(project.tags || []).slice(0, 2).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: 9 }}
                            />
                          ))}
                        </Stack>
                      </Stack>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.25}
                      >
                        <StatusChip status={project.workflowStatus || 'not_started'} />
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Card body */}
                    <Box
                      p={2}
                      pb={1}
                    >
                      <Typography
                        noWrap
                        gutterBottom
                        variant="h5"
                        fontWeight={700}
                        lineHeight={1.3}
                      >
                        {project.name}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          display: '-webkit-box',
                          overflow: 'hidden',
                          whiteSpace: 'initial',
                          minHeight: 38,
                          fontSize: 12.5,
                        }}
                      >
                        {project.description || 'No description'}
                      </Typography>
                    </Box>

                    {/* Dates */}
                    <Box
                      px={2}
                      pb={1.5}
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          STARTED
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          fontSize={12}
                        >
                          {project.startDate
                            ? format(new Date(project.startDate), 'MMM dd, yyyy')
                            : '—'}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          DUE
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          fontSize={12}
                          sx={{
                            color:
                              project.dueDate &&
                              isPast(new Date(project.dueDate)) &&
                              project.workflowStatus !== 'completed'
                                ? 'error.main'
                                : 'text.primary',
                          }}
                        >
                          {project.dueDate
                            ? format(new Date(project.dueDate), 'MMM dd, yyyy')
                            : '—'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Progress */}
                    <Box
                      px={2}
                      pb={1.5}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={0.75}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                          textTransform="uppercase"
                          fontSize={10}
                        >
                          Progress
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: (project.progress ?? 0) >= 100 ? 'success.main' : 'primary.main',
                          }}
                        >
                          {project.progress ?? 0}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        value={project.progress ?? 0}
                        color={
                          (project.progress ?? 0) >= 100
                            ? 'success'
                            : (project.progress ?? 0) >= 50
                              ? 'primary'
                              : 'warning'
                        }
                        variant="determinate"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      {project.taskStats && (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          mt={0.5}
                          display="block"
                          fontSize={11}
                        >
                          {project.taskStats.done} of {project.taskStats.total} tasks completed
                          {project.taskStats.in_progress > 0 &&
                            ` · ${project.taskStats.in_progress} in progress`}
                        </Typography>
                      )}
                    </Box>

                    <Divider />

                    {/* Footer */}
                    <Box
                      px={2}
                      py={1.5}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
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
                          fontSize={11}
                        >
                          No members
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={0.5}
                      >
                        <Tooltip
                          title="Edit project"
                          arrow
                        >
                          <IconButton
                            size="small"
                            onClick={() => setEditingProject(project)}
                            sx={{
                              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                              borderRadius: 1.5,
                            }}
                          >
                            <EditRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="contained"
                          disableElevation
                          startIcon={<ViewKanbanRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleOpenBoard(project._id)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 12,
                            borderRadius: 1.5,
                            background: `linear-gradient(135deg, ${
                              project.color || theme.palette.primary.dark
                            } 0%, ${alpha(project.color || theme.palette.primary.main, 0.8)} 100%)`,
                          }}
                        >
                          Board
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </CardWrapper>
              </Grid>
            ))}
          </Grid>

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
