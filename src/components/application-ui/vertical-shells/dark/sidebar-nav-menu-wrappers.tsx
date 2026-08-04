import { alpha, ListItemButton, styled } from '@mui/material';
import { neutral } from 'src/theme/colors';

/**
 * Fila del menú lateral — métricas del Store Panel 2.0 (Claude Design).
 *
 * Radio 10, alto 38, etiqueta 13/600 e icono 19. El activo se marca con un
 * relleno plano del rosa de marca al 14% y una barra a la izquierda: el
 * degradado anterior no se distinguía del hover en pantallas con poco brillo,
 * y sin barra había que comparar tonos para saber dónde estabas.
 */
export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  position: 'relative',
  color: neutral[400],
  borderRadius: 10,
  transition: 'background-color .18s, color .18s',
  fontWeight: 600,
  fontSize: 13,
  minHeight: 38,
  marginBottom: 2,
  border: 'none',
  padding: theme.spacing(0.9, 1.25),
  gap: theme.spacing(1.4),

  '& .MuiListItemIcon-root': {
    color: neutral[500],
    minWidth: 0,
    '& .MuiSvgIcon-root': {
      fontSize: 19,
    },
  },

  '& .MuiListItemText-root': {
    margin: 0,
    color: neutral[400],
    '& .MuiTypography-root': {
      fontSize: 13,
      fontWeight: 600,
    },
  },

  '&:hover': {
    color: neutral[100],
    background: alpha(neutral[500], 0.07),

    '& .MuiListItemIcon-root': { color: neutral[200] },
    '& .MuiListItemText-root': { color: neutral[200] },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color: theme.palette.common.white,
    background: alpha(theme.palette.primary.main, 0.14),

    // Marca de posición: se lee sin comparar tonos
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 3,
      height: 18,
      borderRadius: '0 3px 3px 0',
      background: theme.palette.primary.main,
    },

    '& .MuiListItemIcon-root': { color: theme.palette.primary.light },
    '& .MuiListItemText-root': {
      color: theme.palette.common.white,
      '& .MuiTypography-root': { fontWeight: 700 },
    },
  },

  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
}));
