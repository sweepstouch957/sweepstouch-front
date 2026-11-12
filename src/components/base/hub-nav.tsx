'use client';

/**
 * Pestañas entre las pantallas de un mismo módulo. Sale sola arriba de cada página
 * que pertenece a un módulo del menú (Tiendas: Listado · Mapa · Marcas…), así se
 * salta entre pantallas hermanas sin volver a la barra lateral. Se alimenta del
 * mismo menú: no hay que registrar nada por página.
 */
import { RouterLink } from '@/components/base/router-link';
import { usePathname } from '@/hooks/use-pathname';
import type { MenuItem } from '@/router/menuItem';
import { currentModule, menuModules } from '@/router/nav';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useMemo } from 'react';

export default function HubNav({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const modules = useMemo(() => menuModules(menuItems), [menuItems]);
  const here = currentModule(pathname, modules);

  // Un módulo de una sola página no tiene hermanas a las que saltar.
  if (!here || here.module.pages.length < 2) return null;
  const { module, route } = here;

  return (
    <Box
      component="nav"
      aria-label={`Secciones de ${module.title}`}
      sx={{
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: { xs: 1, md: 2.5 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        sx={{ minWidth: 0 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexShrink: 0,
            pr: 1.5,
            borderRight: '1px solid',
            borderColor: 'divider',
            color: 'text.secondary',
            '& .MuiSvgIcon-root': { fontSize: 18 },
          }}
        >
          {module.icon}
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            {module.title}
          </Typography>
        </Stack>

        <Tabs
          value={route}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 44,
            minWidth: 0,
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          {module.pages.map((p) => (
            <Tab
              key={p.route}
              value={p.route}
              label={p.title}
              component={RouterLink}
              href={p.route}
              sx={{
                minHeight: 44,
                minWidth: 0,
                px: 1.5,
                fontSize: 13.5,
                fontWeight: 600,
                textTransform: 'none',
                '&.Mui-selected': { fontWeight: 800 },
              }}
            />
          ))}
        </Tabs>
      </Stack>
    </Box>
  );
}
