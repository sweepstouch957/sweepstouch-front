import { alpha, ListItemButton, styled } from '@mui/material';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: alpha(theme.palette.common.white, 0.4),
  borderRadius: theme.shape.borderRadius,
  transition: 'none',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: '2px',
  padding: theme.spacing(0.8, 1, 0.8, 2),

  '& .MuiListItemIcon-root': {
    color: alpha(theme.palette.common.white, 0.7),
    minWidth: 44,
  },

  '& .MuiListItemText-root': {
    color: alpha(theme.palette.common.white, 0.7),
  },

  '&:hover': {
    color: theme.palette.common.white,
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.04)
        : alpha(theme.palette.common.white, 0.06),
    '& .MuiListItemIcon-root': {
      color: theme.palette.common.white,
    },

    '& .MuiListItemText-root': {
      color: theme.palette.common.white,
    },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.common.white,
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.04)
        : alpha(theme.palette.common.white, 0.06),
    '& .MuiListItemIcon-root': {
      color: theme.palette.common.white,
    },

    '& .MuiListItemText-root': {
      color: theme.palette.common.white,
    },
  },
}));
