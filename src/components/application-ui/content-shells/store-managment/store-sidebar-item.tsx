import { alpha, Box, ListItemButton, Typography } from '@mui/material';
import type { FC } from 'react';
import { RouterLink } from 'src/components/base/router-link';

interface StoreSidebarItemProps {
  section: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    /** Dato al final de la fila: "6", "2 activas". Sólo si aporta. */
    meta?: string;
  };
  active?: boolean;
  onClick?: () => void;
}

/**
 * Fila del rail de secciones (Store Panel 2.0). Compacta, con el icono a color
 * sólo cuando está activa: doce filas todas encendidas se leen como ruido.
 */
export const StoreSidebarItem: FC<StoreSidebarItemProps> = ({ section, active, onClick }) => (
  <ListItemButton
    selected={active}
    component={RouterLink}
    href={`?tag=${section.id}`}
    onClick={onClick}
    sx={(theme) => ({
      borderRadius: '10px',
      minHeight: 36,
      px: 1.25,
      py: 0.75,
      gap: 1.25,
      mb: '2px',
      color: active ? theme.palette.text.primary : theme.palette.text.secondary,
      bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
      '&.Mui-selected, &.Mui-selected:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.1),
      },
      '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.045) },
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: active ? theme.palette.primary.main : theme.palette.text.disabled,
      },
    })}
  >
    {section.icon}
    <Typography
      sx={{
        fontSize: 12.5,
        fontWeight: active ? 750 : 600,
        minWidth: 0,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {section.label}
    </Typography>
    {section.meta && (
      <Box
        component="span"
        sx={{
          fontSize: 10,
          fontWeight: 800,
          color: active ? 'primary.main' : 'text.disabled',
          flexShrink: 0,
        }}
      >
        {section.meta}
      </Box>
    )}
  </ListItemButton>
);
