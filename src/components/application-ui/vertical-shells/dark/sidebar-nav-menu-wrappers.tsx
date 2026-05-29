import { alpha, ListItemButton, styled } from '@mui/material';
import { neutral } from 'src/theme/colors';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: neutral[400],
  borderRadius: theme.spacing(1),
  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  fontWeight: 500,
  fontSize: 13,
  marginBottom: '1px',
  border: 'none',
  padding: theme.spacing(0.7, 1, 0.7, 1.5),

  '& .MuiListItemIcon-root': {
    color: neutral[500],
    minWidth: 36,
    '& .MuiSvgIcon-root': {
      fontSize: 20,
    },
  },

  '& .MuiListItemText-root': {
    color: neutral[500],
  },

  '&:hover': {
    color: neutral[100],
    background: alpha(neutral[500], 0.06),

    '& .MuiListItemIcon-root': {
      color: neutral[200],
    },

    '& .MuiListItemText-root': {
      color: neutral[200],
    },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color: '#fff',
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.dark, 0.08)} 100%)`,

    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.light,
    },

    '& .MuiListItemText-root': {
      color: '#fff',
    },
  },
}));
