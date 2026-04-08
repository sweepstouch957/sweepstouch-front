import KeyboardArrowRightTwoToneIcon from '@mui/icons-material/KeyboardArrowRightTwoTone';
import {
  alpha,
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListProps,
  ListSubheader,
  styled,
  Theme,
  useMediaQuery,
} from '@mui/material';

import React, { FC, useState } from 'react';
import { RouterLink } from 'src/components/base/router-link';
import { usePathname } from 'src/hooks/use-pathname';
import { MenuItem } from 'src/router/menuItem';
import { neutral } from 'src/theme/colors';

interface NavItemProps {
  item: MenuItem;
}

const ListSubheaderWrapper = styled(ListSubheader)<ListProps<'div', { component: 'div' }>>(
  ({ theme }) => ({
    background: neutral[900],
    textTransform: 'uppercase',
    fontWeight: 500,
    fontSize: 13,
    color: neutral[400],
    lineHeight: theme.spacing(5),
    padding: theme.spacing(0, 2),
  })
);

export const ListItemButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  color: neutral[300],
  borderRadius: theme.shape.borderRadius,
  transition: 'none',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: '2px',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'transparent',
  padding: theme.spacing(0.8, 1, 0.8, 2),

  '& .MuiListItemIcon-root': {
    color: neutral[500],
    minWidth: 44,
  },

  '& .MuiListItemText-root': {
    color: neutral[500],
  },

  '&:hover': {
    color: neutral[100],
    background: alpha(neutral[700], 0.08),
    borderColor: alpha(neutral[600], 0.08),

    '& .MuiListItemIcon-root': {
      color: neutral[100],
    },

    '& .MuiListItemText-root': {
      color: neutral[100],
    },
  },

  '&.Mui-selected, &.Mui-selected:hover': {
    color: neutral[50],
    background: alpha(neutral[500], 0.1),
    borderColor: alpha(neutral[700], 0.15),

    '& .MuiListItemIcon-root': {
      color: neutral[50],
    },

    '& .MuiListItemText-root': {
      color: neutral[50],
    },
  },
}));

const SubMenu = styled(List)<ListProps<'div', { component: 'div' }>>(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  position: 'relative',

  // Draw a subtle vertical line to act as a tree stem
  '&::before': {
    content: '""',
    position: 'absolute',
    left: theme.spacing(3.5),
    top: 0,
    bottom: 0,
    width: 1,
    background: alpha(neutral[700], 0.5),
    zIndex: 1,
  },

  '& .MuiListItemButton-root': {
    padding: theme.spacing(0.6, 2, 0.6, 6.5),
    fontWeight: 500,
    fontSize: 13, // Slightly smaller text for hierarchy
    minHeight: 36,
    color: neutral[400],

    '&::before': {
      content: '""',
      background: neutral[300],
      opacity: 0.5,
      position: 'absolute',
      left: theme.spacing(3.5), // Connects to the vertical line
      top: '50%',
      height: 1,
      width: theme.spacing(1.5),
      transition: theme.transitions.create(['background', 'opacity', 'width']),
      zIndex: 2,
    },

    '&.Mui-selected, &:hover': {
      color: neutral[50], // brighter text
      background: alpha(neutral[700], 0.1),

      '&::before': {
        opacity: 1,
        background: neutral[50], // brighter branch indicator
        width: theme.spacing(2),
      },
    },

    '& .MuiListItemText-root': {
      margin: 0,
    },
  },
}));

const NavItem: React.FC<NavItemProps> = ({ item }) => {
  const { title, icon, route, subMenu } = item;
  const pathname = usePathname();
  const isActive = route && pathname.includes(route);
  const isSubMenuActive = subMenu?.some((sub) => sub.route && pathname.includes(sub.route));

  const [open, setOpen] = useState(isSubMenuActive);

  const handleToggle = () => {
    if (subMenu) {
      setOpen(!open);
    }
  };

  return (
    <Box px={2}>
      <ListItemButtonWrapper
        selected={isActive || isSubMenuActive}
        onClick={handleToggle}
        //@ts-ignore
        component={route ? RouterLink : 'a'}
        href={route ? route : undefined}
      >
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        <ListItemText
          disableTypography
          primary={title}
        />
        {subMenu && (
          <Box
            sx={{

              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: (theme) => theme.transitions.create(['transform']),
            }}
          >
            <KeyboardArrowRightTwoToneIcon fontSize="small" />
          </Box>
        )}
      </ListItemButtonWrapper>
      {subMenu && (
        <Collapse in={open}>
          <SubMenu
            component="div"
            sx={{ mx: -2 }}
            disablePadding
          >
            {subMenu.map((subItem) => (
              <NavItem
                key={subItem.title}
                item={subItem}
              />
            ))}
          </SubMenu>
        </Collapse>
      )}
    </Box>
  );
};

interface SidebarNavMenuProps {
  menuItems?: MenuItem[];
}

export const SidebarNavMenu: FC<SidebarNavMenuProps> = ({ menuItems = [] }) => {
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  return (
    <Box>
      {menuItems.map((menuItem) => (
        <div key={menuItem.title}>
          <List
            component="nav"
            subheader={
              <ListSubheaderWrapper
                component="div"
                disableSticky={!mdUp}
              >
                {menuItem.title}
              </ListSubheaderWrapper>
            }
          >
            {menuItem.subMenu?.map((subItem) => (
              <NavItem
                key={subItem.title}
                item={subItem}
              />
            ))}
          </List>
        </div>
      ))}
    </Box>
  );
};

