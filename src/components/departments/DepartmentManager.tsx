'use client';

import React, { FC, useState } from 'react';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentService, Department, CreateDepartmentDto } from '@/services/department.service';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#E91E63', '#FF9800', '#2196F3', '#9C27B0', '#F44336',
  '#4CAF50', '#00BCD4', '#FF5722', '#607D8B', '#795548',
  '#3F51B5', '#009688', '#CDDC39', '#FFC107', '#673AB7',
];

interface DepartmentManagerProps {
  open: boolean;
  onClose: () => void;
}

const DepartmentManager: FC<DepartmentManagerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateDepartmentDto>({ name: '', color: '#5569ff', description: '' });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  const seedMutation = useMutation({
    mutationFn: departmentService.seed,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`${res.created} departments created`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateDepartmentDto) => departmentService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
      setCreating(false);
      setForm({ name: '', color: '#5569ff', description: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateDepartmentDto> }) =>
      departmentService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated');
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department removed');
    },
  });

  const handleSave = () => {
    if (editing) {
      updateMutation.mutate({ id: editing._id, dto: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleStartEdit = (dept: Department) => {
    setEditing(dept);
    setCreating(true);
    setForm({ name: dept.name, color: dept.color, description: dept.description });
  };

  const handleCancel = () => {
    setEditing(null);
    setCreating(false);
    setForm({ name: '', color: '#5569ff', description: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <GroupsRoundedIcon color="primary" />
        <Typography variant="h6" fontWeight={700} flex={1}>
          Departments
        </Typography>
        {departments.length === 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            Seed Defaults
          </Button>
        )}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {/* ─── Department List ─── */}
        <List dense disablePadding>
          {departments.map((dept) => (
            <ListItem
              key={dept._id}
              sx={{
                px: 2.5,
                py: 1.2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                '&:hover': { bgcolor: alpha(dept.color, 0.04) },
              }}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit" arrow>
                    <IconButton size="small" onClick={() => handleStartEdit(dept)}>
                      <EditRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(dept._id)}
                    >
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: alpha(dept.color, 0.15),
                    color: dept.color,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {dept.name[0]}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight={600} fontSize={13}>
                      {dept.name}
                    </Typography>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: dept.color,
                        border: `2px solid ${alpha(dept.color, 0.3)}`,
                      }}
                    />
                  </Stack>
                }
                secondary={dept.description}
                secondaryTypographyProps={{ fontSize: 11, color: 'text.disabled' }}
              />
            </ListItem>
          ))}
          {departments.length === 0 && !isLoading && (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No departments yet. Click "Seed Defaults" or create one.
              </Typography>
            </Box>
          )}
        </List>

        {/* ─── Create / Edit Form ─── */}
        {creating ? (
          <Box px={2.5} py={2} sx={{ bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02) }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              {editing ? `Edit: ${editing.name}` : 'New Department'}
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Name"
                size="small"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Description"
                size="small"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                  <PaletteRoundedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  Color
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {PRESET_COLORS.map((c) => (
                    <Box
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: c,
                        cursor: 'pointer',
                        border: form.color === c ? `3px solid ${theme.palette.background.paper}` : '3px solid transparent',
                        boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                        transition: 'all 0.15s',
                        '&:hover': { transform: 'scale(1.2)' },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={handleCancel}>Cancel</Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
                  disableElevation
                  sx={{ borderRadius: 1.5 }}
                >
                  {editing ? 'Update' : 'Create'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : (
          <Box px={2.5} py={1.5}>
            <Button
              startIcon={<AddRoundedIcon />}
              size="small"
              onClick={() => setCreating(true)}
              sx={{ borderRadius: 1.5 }}
            >
              Add Department
            </Button>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 1.5 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentManager;
