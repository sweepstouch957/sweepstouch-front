'use client';

import { type Project } from '@/services/task.service';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import {
  alpha,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { PROJECT_COLORS } from './constants';
import { rhf } from './project-form';
import { ProjectMembersSection } from './ProjectMembersSection';
import { ProjectStatusSection } from './ProjectStatusSection';
import { SaveProjectButton } from './SaveProjectButton';
import { useEditProjectForm } from './use-edit-project-form';

/* ══════════════════════════════════════════════════════════════════ */
/*  EDIT PROJECT DRAWER                                               */
/* ══════════════════════════════════════════════════════════════════ */

export function EditProjectDrawer({
  open,
  project,
  allUsers,
  onClose,
  onSave,
  onDelete,
  isSaving,
}: {
  open: boolean;
  project: Project | null;
  allUsers: any[];
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    register,
    control,
    memberIds,
    departments,
    memberObjects,
    nonMembers,
    addMember,
    removeMember,
    handleSave,
    isOverdue,
  } = useEditProjectForm({ project, allUsers, onSave });

  if (!project) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 480 },
          bgcolor: isDark ? theme.palette.neutral[900] : 'common.white',
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: project.color || PROJECT_COLORS[0],
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              lineHeight={1.2}
            >
              Edit Project
            </Typography>
            {project.identifier && (
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 11 }}
              >
                {project.identifier}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={onClose}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
        <Stack spacing={2.5}>
          {/* Section: Basic info */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
              sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}
            >
              Project Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Project Name *"
                fullWidth
                autoFocus
                {...rhf(register, 'name')}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                {...rhf(register, 'description')}
                placeholder="What is this project about?"
              />
              <TextField
                label="Tags"
                fullWidth
                {...rhf(register, 'tags')}
                placeholder="design, frontend, backend"
                helperText="Separate with commas"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Section: Status + Color */}
          <ProjectStatusSection
            control={control}
            departments={departments}
          />

          <Divider />

          {/* Section: Dates */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              mb={1.5}
            >
              <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant="overline"
                color="text.secondary"
                fontWeight={700}
                sx={{ letterSpacing: 1 }}
              >
                Timeline
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={1.5}
            >
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                {...rhf(register, 'startDate')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                {...rhf(register, 'dueDate')}
                InputLabelProps={{ shrink: true }}
                error={!!isOverdue}
                helperText={isOverdue ? 'Overdue' : undefined}
              />
            </Stack>
            {/* Progress readout */}
            {project.taskStats && (
              <Box mt={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={0.75}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Task progress
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={(project.progress ?? 0) >= 100 ? 'success.main' : 'primary.main'}
                  >
                    {project.progress ?? 0}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={project.progress ?? 0}
                  color={
                    (project.progress ?? 0) >= 100
                      ? 'success'
                      : (project.progress ?? 0) >= 50
                        ? 'primary'
                        : 'warning'
                  }
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  mt={0.5}
                  display="block"
                >
                  {project.taskStats.done} of {project.taskStats.total} tasks done
                  {project.taskStats.in_progress > 0 &&
                    ` · ${project.taskStats.in_progress} in progress`}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Section: Members */}
          <ProjectMembersSection
            memberIds={memberIds}
            nonMembers={nonMembers}
            memberObjects={memberObjects}
            addMember={addMember}
            removeMember={removeMember}
          />

          {/* Danger zone */}
          <Divider />
          <Box>
            <Typography
              variant="overline"
              color="error"
              fontWeight={700}
              sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}
            >
              Danger Zone
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteTwoToneIcon />}
              onClick={() => {
                onDelete(project._id);
                onClose();
              }}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Delete this project
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={0.75}
            >
              This will permanently delete the project and all its tasks.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Footer actions ── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <SaveProjectButton
          control={control}
          isSaving={isSaving}
          onClick={handleSave}
        />
      </Box>
    </Drawer>
  );
}
