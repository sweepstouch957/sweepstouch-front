import { alpha, ListItemButton, styled } from '@mui/material';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.neutral[300] : theme.palette.neutral[500],
  borderRadius: theme.shape.borderRadius,
  transition: 'none',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: '2px',
  padding: theme.spacing(0.8, 1, 0.8, 2),

  '& .MuiListItemIcon-root': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[600] : theme.palette.neutral[700],
    minWidth: 36,
  },

  '& .MuiListItemText-root': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[500] : theme.palette.neutral[700],
  },

  '&:hover': {
    color: theme.palette.mode === 'dark' ? theme.palette.neutral[300] : theme.palette.neutral[900],
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.neutral[50],

    '& .MuiListItemIcon-root': {
      color:
        theme.palette.mode === 'dark' ? theme.palette.neutral[200] : theme.palette.neutral[900],
    },

    '& .MuiListItemText-root': {
      color: theme.palette.mode === 'dark' ? theme.palette.neutral[25] : theme.palette.neutral[900],
    },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color:
      theme.palette.mode === 'dark'
        ? theme.palette.primary.contrastText
        : theme.palette.primary.main,
    background:
      theme.palette.mode === 'dark'
        ? theme.palette.primary.main
        : alpha(theme.palette.neutral[100], 0.9),

    '& .MuiListItemIcon-root': {
      color:
        theme.palette.mode === 'dark'
          ? theme.palette.primary.contrastText
          : theme.palette.primary.main,
    },

    '& .MuiListItemText-root': {
      color:
        theme.palette.mode === 'dark'
          ? theme.palette.primary.contrastText
          : theme.palette.primary.main,
    },
  },
}));
