import { alpha, lighten, ListItemButton, styled } from '@mui/material';

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  transform: 'scale(1)',
  background: theme.palette.background.paper,
  position: 'relative',
  zIndex: 5,

  '&:hover': {
    borderRadius: theme.shape.borderRadius,
    background: lighten(theme.palette.background.default, 0.05),
    zIndex: 6,
    // Sin sombra: el hover se marca con borde + tinte del primary.
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, 0.25),
    transform: 'scale(1.08)',
  },

  '&:last-child': {
    borderBottomRightRadius: theme.shape.borderRadius,
    borderBottomLeftRadius: theme.shape.borderRadius,
  },
}));

export const ListItemButtonWrapperLight = styled(ListItemButton)(({ theme }) => ({
  background: 'transparent',
  transition: 'none',

  '&:hover': {
    background: alpha(theme.palette.background.paper, 0.06),
  },
}));
