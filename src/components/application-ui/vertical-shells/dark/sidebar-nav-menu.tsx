import KeyboardArrowRightTwoToneIcon from '@mui/icons-material/KeyboardArrowRightTwoTone';
import {
  alpha,
  Box,
  Collapse,
  IconButton,
  InputBase,
  List,
  ListItemIcon,
  ListItemText,
  ListProps,
  ListSubheader,
  styled,
  Theme,
  useMediaQuery } from '@mui/material';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { bestRoute, matchRoute, menuModules, norm } from 'src/router/nav';
import { RouterLink } from 'src/components/base/router-link';
import { usePathname } from 'src/hooks/use-pathname';
import { MenuItem } from 'src/router/menuItem';
import { ListItemButtonWrapper } from './sidebar-nav-menu-wrappers';
import { neutral } from 'src/theme/colors';

interface NavItemProps {
  item: MenuItem;
  /** Lo decide el padre entre hermanos; si no viene, se calcula con la ruta propia. */
  selected?: boolean;
}

/**
 * Encabezado de grupo: 9.5px con tracking amplio, como en el diseño.
 *
 * Alto y padding recortados: con cinco secciones, los 46px que ocupaba cada
 * encabezado sumaban una pantalla entera de aire y Tareas quedaba abajo del
 * fold. El tamaño de letra no se toca, sólo el espacio muerto.
 */
const ListSubheaderWrapper = styled(ListSubheader)<ListProps<'div', { component: 'div' }>>(
  ({ theme }) => ({
    background: neutral[900],
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: 9.5,
    letterSpacing: '1.4px',
    color: alpha(neutral[400], 0.75),
    lineHeight: theme.spacing(2.2),
    padding: theme.spacing(1.1, 1.25, 0.35),
  })
);

// ListItemButtonWrapper imported from ./sidebar-nav-menu-wrappers

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

  // Con icono, la sangría de 6 dejaba el texto en el borde derecho. El icono
  // ocupa el lugar de la viñeta, así que la fila arranca antes.
  '& .MuiListItemButton-root': {
    padding: theme.spacing(0.4, 1.25, 0.4, 4.6),
    gap: theme.spacing(1.1),
    fontWeight: 600,
    fontSize: 12.5,
    minHeight: 30,
    color: neutral[500],
    borderRadius: 10,

    '& .MuiListItemIcon-root': {
      minWidth: 0,
      color: 'inherit',
      '& .MuiSvgIcon-root': { fontSize: 16 },
    },

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

const NavItem: React.FC<NavItemProps> = ({ item, selected }) => {
  const { title, icon, route, subMenu } = item;
  const pathname = usePathname();
  // Con `includes`, "/stores" quedaba encendido también en "/stores/brands".
  // "/admin" (Inicio) sólo cuenta exacto: si no, estaría activo en todo el panel.
  const isActive = selected ?? (route === '/admin' ? pathname === route : matchRoute(pathname, route));
  const activeChild = bestRoute(pathname, (subMenu || []).map((sub) => sub.route));
  const isSubMenuActive = !!activeChild;

  const [open, setOpen] = useState(isSubMenuActive);
  // Al llegar por un link o por el buscador, el módulo de la página se abre solo.
  useEffect(() => {
    if (isSubMenuActive) setOpen(true);
  }, [isSubMenuActive]);

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
                selected={subItem.route === activeChild}
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

const EMPTY_MENU_ITEMS: MenuItem[] = [];

export const SidebarNavMenu: FC<SidebarNavMenuProps> = ({ menuItems = EMPTY_MENU_ITEMS }) => {
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const pathname = usePathname();
  const [filter, setFilter] = useState('');
  const q = norm(filter);
  const found = useMemo(
    () =>
      q
        ? menuModules(menuItems)
            .flatMap((m) => m.pages)
            .filter((p) => q.split(/s+/).every((w) => norm(`${p.module} ${p.title} ${p.section}`).includes(w)))
        : [],
    [q, menuItems]
  );

  return (
    <Box>
      <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, position: 'sticky', top: 0, zIndex: 3, background: neutral[900] }}>
        <InputBase
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setFilter('')}
          placeholder="Filtrar el menú…"
          inputProps={{ 'aria-label': 'Filtrar el menú' }}
          startAdornment={<SearchRoundedIcon sx={{ fontSize: 16, mr: 0.75, opacity: 0.6 }} />}
          endAdornment={
            filter ? (
              <IconButton
                size="small"
                aria-label="Borrar filtro"
                onClick={() => setFilter('')}
                sx={{ p: 0.25, color: 'inherit' }}
              >
                <CloseRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            ) : undefined
          }
          sx={{
            width: '100%',
            height: 32,
            px: 1.1,
            fontSize: 12.5,
            borderRadius: '10px',
            color: neutral[200],
            background: alpha(neutral[500], 0.1),
            border: `1px solid ${alpha(neutral[500], 0.14)}`,
            '&.Mui-focused': { borderColor: alpha(neutral[300], 0.45) },
            '& input::placeholder': { color: neutral[400], opacity: 0.9 },
          }}
        />
      </Box>

      {q && (
        <List
          component="nav"
          aria-label="Resultados del menú"
          disablePadding
          sx={{ px: 1.5, pb: 1 }}
        >
          {found.length === 0 && (
            <Box sx={{ px: 1.25, py: 1.5, fontSize: 12.5, color: neutral[400] }}>
              Nada con «{filter.trim()}». Prueba Ctrl+K para buscar tiendas.
            </Box>
          )}
          {found.map((p) => (
            <ListItemButtonWrapper
              key={p.route}
              selected={matchRoute(pathname, p.route) && p.route !== '/admin'}
              //@ts-ignore
              component={RouterLink}
              href={p.route}
            >
              {p.icon && <ListItemIcon>{p.icon}</ListItemIcon>}
              <ListItemText
                disableTypography
                primary={p.module ? `${p.module} · ${p.title}` : p.title}
              />
            </ListItemButtonWrapper>
          ))}
        </List>
      )}

      {!q && menuItems.map((menuItem) => (
        <div key={menuItem.title}>
          <List
            component="nav"
            // MUI mete 8px arriba y abajo por lista: por cinco secciones son
            // 80px de nada. La separación la da el padding del encabezado.
            disablePadding
            sx={{ pb: 0.75 }}
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
