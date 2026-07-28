import { alpha, lighten, ListItemButton, styled } from '@mui/material';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: alpha(theme.palette.common.white, 0.8),
  borderRadius: theme.shape.borderRadius,
  transition: 'none',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: '2px',
  padding: theme.spacing(0.8, 1, 0.8, 1.5),

  '& .MuiListItemIcon-root': {
    minWidth: 38,
    color: alpha(theme.palette.common.white, 0.6),
  },

  '& .MuiListItemText-root': {
    color: alpha(theme.palette.common.white, 0.6),
  },

  '&:hover': {
    color: alpha(theme.palette.common.white, 0.95),
    background: alpha(lighten(theme.palette.primary.main, 0.3), 0.1),

    '& .MuiListItemIcon-root': {
      color: alpha(theme.palette.common.white, 0.95),
    },

    '& .MuiListItemText-root': {
      color: alpha(theme.palette.common.white, 0.95),
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
