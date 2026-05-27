import { alpha, ListItemButton, styled } from '@mui/material';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.neutral[700] : theme.palette.neutral[500],
  borderRadius: theme.shape.borderRadius * 4,
  transition: 'none',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: '3px',
  padding: theme.spacing(0.8, 1, 0.8, 2),

  '& .MuiListItemIcon-root': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[700] : theme.palette.neutral[800],
    minWidth: 38,
  },

  '& .MuiListItemText-root': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[500] : theme.palette.neutral[800],
  },

  '&:hover': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[500] : theme.palette.primary.dark,
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.04)
        : alpha(theme.palette.common.white, 0.8),

    '& .MuiListItemIcon-root': {
      color:
        theme.palette.mode === 'dark' ? theme.palette.neutral[300] : theme.palette.primary.main,
    },

    '& .MuiListItemText-root': {
      color: theme.palette.mode === 'dark' ? theme.palette.neutral[50] : theme.palette.primary.main,
    },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.common.white,
    background: theme.palette.primary.main,

    '& .MuiListItemIcon-root': {
      color: alpha(theme.palette.common.white, 0.95),
    },

    '& .MuiListItemText-root': {
      color: alpha(theme.palette.common.white, 0.95),
    },
  },
}));
