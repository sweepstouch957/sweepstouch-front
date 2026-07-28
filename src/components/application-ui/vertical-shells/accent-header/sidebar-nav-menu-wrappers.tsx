import { alpha, ListItemButton, styled } from '@mui/material';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.neutral[700] : theme.palette.neutral[500],
  borderTopRightRadius: theme.shape.borderRadius * 4,
  borderBottomRightRadius: theme.shape.borderRadius * 4,
  transition: 'none',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: '2px',
  padding: theme.spacing(1, 1.5, 1, 2),

  '& .MuiListItemIcon-root': {
    minWidth: 44,
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[800] : theme.palette.neutral[800],
  },

  '& .MuiListItemText-root': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[600] : theme.palette.neutral[800],
  },

  '&:hover': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[300] : theme.palette.neutral[800],
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.04)
        : alpha(theme.palette.neutral[200], 0.4),

    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },

    '& .MuiListItemText-root': {
      color:
        theme.palette.mode === 'dark' ? theme.palette.neutral[400] : theme.palette.primary.main,
    },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.primary.main,
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.neutral[100],

    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },

    '& .MuiListItemText-root': {
      color:
        theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
    },
  },
}));
