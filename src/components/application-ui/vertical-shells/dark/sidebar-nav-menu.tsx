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
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.08em',
    color: alpha(neutral[400], 0.6),
    lineHeight: theme.spacing(4),
    padding: theme.spacing(1, 2, 0.25),
  })
);

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

const SubMenu = styled(List)<ListProps<'div', { component: 'div' }>>(({ theme }) => ({
  paddingTop: theme.spacing(0.25),
  paddingBottom: theme.spacing(0.25),
  position: 'relative',

  '&::before': {
    content: '""',
    position: 'absolute',
    left: theme.spacing(3.2),
    top: 0,
    bottom: 0,
    width: 1,
    background: alpha(neutral[600], 0.2),
    zIndex: 1,
  },

  '& .MuiListItemButton-root': {
    padding: theme.spacing(0.5, 2, 0.5, 6),
    fontWeight: 400,
    fontSize: 13,
    minHeight: 34,
    color: neutral[500],
    borderRadius: theme.spacing(0.75),

    '&::before': {
      content: '""',
      background: neutral[600],
      opacity: 0.3,
      position: 'absolute',
      left: theme.spacing(3.2),
      top: '50%',
      height: 1,
      width: theme.spacing(1.2),
      transition: theme.transitions.create(['background', 'opacity', 'width']),
      zIndex: 2,
    },

    '&.Mui-selected, &:hover': {
      color: neutral[100],
      background: alpha(neutral[500], 0.05),

      '&::before': {
        opacity: 1,
        background: theme.palette.primary.main,
        width: theme.spacing(1.5),
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
    <Box px={1.5}>
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
              '& .MuiSvgIcon-root': { fontSize: 16, opacity: 0.5 },
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
            sx={{ mx: -1.5 }}
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
