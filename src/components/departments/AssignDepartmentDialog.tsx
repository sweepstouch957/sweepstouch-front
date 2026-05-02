'use client';

import React, { FC, useEffect, useState } from 'react';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService, Department } from '@/services/department.service';
import { api } from '@/libs/axios';
import toast from 'react-hot-toast';

interface AssignDepartmentDialogProps {
  open: boolean;
  onClose: () => void;
  user: any; // The user to assign
  onUpdated?: () => void;
}

const AssignDepartmentDialog: FC<AssignDepartmentDialogProps> = ({ open, onClose, user, onUpdated }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const normalizeDeptId = (u: any): string | null => {
    if (!u) return null;
    if (u.departmentId && typeof u.departmentId === 'string') return u.departmentId;
    if (u.department?._id) return u.department._id;
    if (u.departmentId?._id) return u.departmentId._id;
    return null;
  };

  const [selected, setSelected] = useState<string | null>(normalizeDeptId(user));

  useEffect(() => {
    setSelected(normalizeDeptId(user));
  }, [user?.id, user?._id]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  const assignMutation = useMutation({
    mutationFn: async (departmentId: string | null) => {
      await api.patch(`/auth/users/profile/${user.id || user._id}`, { departmentId });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      toast.success(`Department ${selected ? 'assigned' : 'removed'} for ${user.firstName}`);
      onUpdated?.();
      onClose();
    },
    onError: () => toast.error('Failed to assign department'),
  });

  const EXCLUDED_ROLES = ['merchant', 'cashier', 'promotor', 'admin'];
  const isExcluded = EXCLUDED_ROLES.includes(user?.role);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700} fontSize={16}>
          Assign Department
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize={12}>
          {user?.firstName} {user?.lastName}
          {isExcluded && (
            <Typography component="span" color="warning.main" fontSize={11} ml={1}>
              (Role "{user?.role}" typically doesn't have a department)
            </Typography>
          )}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <List dense disablePadding>
          {/* None option */}
          <ListItemButton
            selected={selected === null}
            onClick={() => setSelected(null)}
            sx={{
              px: 2.5,
              py: 1,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.disabled', fontSize: 12 }}>—</Avatar>
            </ListItemIcon>
            <ListItemText
              primary="No Department"
              primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
            />
            {selected === null && <CheckRoundedIcon color="primary" sx={{ fontSize: 18 }} />}
          </ListItemButton>

          {departments.map((dept) => (
            <ListItemButton
              key={dept._id}
              selected={selected === dept._id}
              onClick={() => setSelected(dept._id)}
              sx={{
                px: 2.5,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: alpha(dept.color, 0.06),
                  '&:hover': { bgcolor: alpha(dept.color, 0.1) },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: alpha(dept.color, 0.15),
                    color: dept.color,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {dept.name[0]}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography fontSize={13} fontWeight={600}>{dept.name}</Typography>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dept.color }} />
                  </Stack>
                }
                secondary={dept.description}
                secondaryTypographyProps={{ fontSize: 10, noWrap: true }}
              />
              {selected === dept._id && <CheckRoundedIcon sx={{ color: dept.color, fontSize: 18 }} />}
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button size="small" onClick={onClose} sx={{ borderRadius: 1.5 }}>
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          disableElevation
          onClick={() => assignMutation.mutate(selected)}
          disabled={assignMutation.isPending || selected === normalizeDeptId(user)}
          sx={{ borderRadius: 1.5 }}
        >
          {assignMutation.isPending ? 'Saving...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDepartmentDialog;
