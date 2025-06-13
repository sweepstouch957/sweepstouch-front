import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { RouterLink } from 'src/components/base/router-link';
import PropTypes from 'prop-types';
import type { FC } from 'react';

interface StoreSidebarItemProps {
  section: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  };
  active?: boolean;
  onClick?: () => void;
}

export const StoreSidebarItem: FC<StoreSidebarItemProps> = ({
  section,
  active,
  onClick,
}) => {
  const href = `?tag=${section.id}`;

  return (
    <ListItemButton
      selected={active}
      component={RouterLink}
      href={href}
      onClick={onClick}
      sx={{
        borderRadius: (theme) => theme.shape.borderRadius + 'px',
        mb: '3px',
        pr: 1,
        '&.Mui-selected .MuiListItemText-root': {
          fontWeight: 600,
        },
      }}
    >
      {section.icon && (
        <ListItemIcon sx={{ minWidth: 38 }}>{section.icon}</ListItemIcon>
      )}
      <ListItemText
        primary={section.label}
        primaryTypographyProps={{ fontWeight: 500 }}
      />
    </ListItemButton>
  );
};
