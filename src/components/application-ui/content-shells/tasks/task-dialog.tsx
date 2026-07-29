import { RECURRENCE_LABEL, Task, type Recurrence } from '@/services/task.service';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo } from 'react';
import { priorityEntries, statusEntries, type TaskFormState } from './constants';

type TaskDialogProps = {
  open: boolean;
  editingTask: Task | null;
  form: TaskFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskFormState>>;
  status: string;
  onStatusChange: (s: string) => void;
  teamMembers: any[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function TaskDialog({
  open,
  editingTask,
  form,
  setForm,
  status,
  onStatusChange,
  teamMembers,
  submitting,
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const theme = useTheme();

  const selectedAssignee = useMemo(
    () => teamMembers.find((u: any) => (u.id || u._id) === form.assigneeId),
    [teamMembers, form.assigneeId]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'visible' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
          >
            {editingTask?.identifier && (
              <Chip
                label={editingTask.identifier}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              />
            )}
            <Typography
              variant="h6"
              fontWeight={700}
            >
              {editingTask ? 'Edit Task' : 'New Task'}
            </Typography>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ pt: 2 }}
      >
        <Stack spacing={2}>
          {/* Title */}
          <TextField
            label="Title"
            fullWidth
            autoFocus
            required
            value={form.title}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, title: v })); }}
            placeholder="What needs to be done?"
            sx={{ '& .MuiOutlinedInput-root': { fontWeight: 600 } }}
          />

          {/* Description */}
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, description: v })); }}
            placeholder="Add more details…"
          />

          {/* Priority + Status */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <TextField
              label="Priority"
              select
              fullWidth
              size="small"
              value={form.priority}
              onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, priority: v })); }}
            >
              {priorityEntries(theme).map(([k, c]) => (
                <MenuItem
                  key={k}
                  value={k}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <FlagRoundedIcon sx={{ fontSize: 15, color: c.color }} />
                    <span>{c.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Status"
              select
              fullWidth
              size="small"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {statusEntries(theme).map(([k, m]) => (
                <MenuItem
                  key={k}
                  value={k}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
                    <span>{m.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Assignee + Due date */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <Autocomplete
              fullWidth
              size="small"
              options={teamMembers}
              value={selectedAssignee || null}
              onChange={(_, v: any) => {
                if (v) {
                  setForm(prev => ({
                    ...prev,
                    assigneeId: v.id || v._id,
                    assigneeName: `${v.firstName} ${v.lastName || ''}`.trim(),
                    assigneeAvatar: v.profileImage || '',
                  }));
                } else {
                  setForm(prev => ({
                    ...prev,
                    assigneeId: '',
                    assigneeName: '',
                    assigneeAvatar: '',
                  }));
                }
              }}
              getOptionLabel={(o: any) => `${o.firstName} ${o.lastName || ''}`.trim()}
              renderOption={(props, option: any) => (
                <li {...props}>
                  <Avatar
                    src={option.profileImage}
                    sx={{ width: 24, height: 24, mr: 1, fontSize: 10 }}
                  >
                    {option.firstName?.[0]}
                  </Avatar>
                  {option.firstName} {option.lastName || ''}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: form.assigneeId ? (
                      <Avatar
                        src={form.assigneeAvatar}
                        sx={{ width: 20, height: 20, mr: 0.5, ml: 0.5, fontSize: 9 }}
                      >
                        {form.assigneeName?.[0]}
                      </Avatar>
                    ) : undefined,
                  }}
                />
              )}
            />
            <TextField
              label="Due Date"
              type="date"
              size="small"
              fullWidth
              disabled={form.recurrence !== 'none'}
              value={form.recurrence !== 'none' ? '' : form.dueDate}
              onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, dueDate: v })); }}
              InputLabelProps={{ shrink: true }}
              helperText={form.recurrence !== 'none' ? 'La pone el sistema cada día' : undefined}
            />
          </Stack>

          {/* Rutinaria */}
          <TextField
            label="Repetir"
            select
            fullWidth
            size="small"
            value={form.recurrence}
            onChange={(e) => {
              const v = e.target.value as Recurrence;
              setForm((prev) => ({ ...prev, recurrence: v }));
            }}
            helperText={
              form.recurrence !== 'none'
                ? 'Plantilla rutinaria: no sale en el board, se copia sola cada día que toca.'
                : undefined
            }
          >
            {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((k) => (
              <MenuItem
                key={k}
                value={k}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <RepeatRoundedIcon
                    sx={{ fontSize: 15, opacity: k === 'none' ? 0.25 : 1, color: k === 'none' ? undefined : 'primary.main' }}
                  />
                  <span>{RECURRENCE_LABEL[k]}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>

          {/* Tags */}
          <TextField
            label="Tags"
            size="small"
            fullWidth
            value={form.tags}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, tags: v })); }}
            placeholder="frontend, bug, ux  (comma-separated)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TagRoundedIcon sx={{ fontSize: 15, opacity: 0.4 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Progress */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={0.5}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
              >
                Progress
              </Typography>
              <Typography
                variant="caption"
                fontWeight={800}
                color="primary.main"
              >
                {form.progress}%
              </Typography>
            </Stack>
            <Slider
              value={form.progress}
              onChange={(_, v) => setForm(prev => ({ ...prev, progress: v as number }))}
              min={0}
              max={100}
              step={5}
              size="small"
              marks={[
                { value: 0, label: '0' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
              sx={{ '& .MuiSlider-markLabel': { fontSize: 10 } }}
            />
          </Box>

          {/* AI Context */}
          <TextField
            label="AI Context"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={form.aiContext}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, aiContext: v })); }}
            placeholder="Describe what this task involves so AI can learn your team's work…"
            helperText="AI training context — helps the assistant understand team activities"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disableElevation
          disabled={!form.title || submitting}
          sx={{
            fontWeight: 700,
            borderRadius: 1.5,
            textTransform: 'none',
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          }}
        >
          {editingTask ? 'Save Changes' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
