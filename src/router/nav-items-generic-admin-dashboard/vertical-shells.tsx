import type { UserRole } from '@/contexts/auth/user';
import { AdsClickOutlined, Campaign, Redeem, Store } from '@mui/icons-material';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import React from 'react';
import { MenuItem } from 'src/router/menuItem';
import { routes } from 'src/router/routes';

// ---- CONFIGURACIÓN ----

type MenuConfig = {
  [key in UserRole]?: any[];
};

const commonMenus = {
  general: [
    {
      title: 'Dashboards',
      icon: <DashboardRoundedIcon />,
      subMenu: [
        {
          title: 'Reports',
          route: (r: typeof routes, role: UserRole) => r.admin.dashboards.reports,
        },
        {
          title: 'Sweepstakes',
          route: (r: typeof routes, role: UserRole) => r.admin.dashboards.sweepstakes,
        },
        {
          title: 'Productivity',
          route: (r: typeof routes, role: UserRole) => r.admin.dashboards.prouctivity,
        },
      ],
    },
    {
      title: 'Applications',
      icon: <AppsRoundedIcon />,
      subMenu: [
        {
          title: 'Calendar',
          route: (r: typeof routes, role: UserRole) => r.admin.applications.calendar,
        },
        {
          title: 'File manager',
          route: (r: typeof routes, role: UserRole) => r.admin.applications['file-manager'],
        },
        {
          title: 'Messenger',
          route: (r: typeof routes, role: UserRole) => r.admin.applications.messenger,
        },
      ],
    },
  ],
};

const menuConfig: MenuConfig = {
  admin: [
    {
      section: 'General',
      items: commonMenus.general,
    },
    {
      section: 'Management',
      items: [
        {
          title: 'Users',
          icon: <PeopleRoundedIcon />,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.users.listing,
            },
            {
              title: 'User profile',
              route: (r: typeof routes, role: UserRole) => r.admin.management.users.profile,
            },
          ],
        },
        {
          title: 'Ads',
          icon: <AdsClickOutlined />,
          route: (r: typeof routes, role: UserRole) => r.admin.management.promos.listing,
        },
        {
          title: 'Campaigns',
          icon: <Campaign />,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.campaings.listing,
            },
          ],
        },
        {
          title: 'Sweepstakes',
          icon: <Redeem />,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.sweepstakes.listing,
            },
            {
              title: 'Ver estadísticas',
              route: (r: typeof routes, role: UserRole) =>
                r.admin.management.sweepstakes.stats(':id'),
            },
          ],
        },
        {
          title: 'Stores',
          icon: <Store />,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.stores.listing,
            },
            {
              title: 'Create Store',
              route: (r: typeof routes, role: UserRole) => r.admin.management.stores.create,
            },
          ],
        },
      ],
    },
  ],
  general_manager: [
    {
      section: 'General',
      items: [
        {
          title: 'Dashboards',
          icon: <DashboardRoundedIcon />,
          subMenu: [
            {
              title: 'Reports',
              route: (r: typeof routes, role: UserRole) => r.admin.dashboards.reports,
            },
          ],
        },
        ...commonMenus.general.slice(1),
      ],
    },
    {
      section: 'Management',
      items: [
        {
          title: 'Ads',
          icon: <AdsClickOutlined />,
          route: (r: typeof routes, role: UserRole) => r.admin.management.promos.listing,
        },
        {
          title: 'Campaigns',
          icon: <Campaign />,
          route: (r: typeof routes, role: UserRole) => r.admin.management.campaings.listing,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.campaings.listing,
            },
          ],
        },
        {
          title: 'Stores',
          icon: <Store />,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.stores.listing,
            },
            {
              title: 'Create Store',
              route: (r: typeof routes, role: UserRole) => r.admin.management.stores.create,
            },
          ],
        },
      ],
    },
  ],
  promotor_manager: [
    {
      section: 'General',
      items: commonMenus.general,
    },
    {
      section: 'Management',
      items: [
        {
          title: 'Sweepstakes',
          icon: <Redeem />,
          route: (r: typeof routes, role: UserRole) => r.admin.management.sweepstakes.listing,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.sweepstakes.listing,
            },
          ],
        },
      ],
    },
  ],
  campaign_manager: [
    {
      section: 'General',
      items: commonMenus.general,
    },
    {
      section: 'Management',
      items: [
        {
          title: 'Campaigns',
          icon: <Campaign />,
          route: (r: typeof routes, role: UserRole) => r.admin.management.campaings.listing,
          subMenu: [
            {
              title: 'Listing',
              route: (r: typeof routes, role: UserRole) => r.admin.management.campaings.listing,
            },
          ],
        },
      ],
    },
  ],
};

// ---- FUNCIÓN GENÉRICA ----

function translateAndMap(menu: any[], t: (token: string) => string, role: UserRole): MenuItem[] {
  return menu.map((section) => ({
    title: t(section.section),
    subMenu: section.items.map((item: any) => ({
      title: t(item.title),
      icon: item.icon,
      route: typeof item.route === 'function' ? item.route(routes, role) : undefined,
      subMenu: item.subMenu
        ? item.subMenu.map((sub: any) => ({
            title: t(sub.title),
            route: typeof sub.route === 'function' ? sub.route(routes, role) : undefined,
          }))
        : undefined,
    })),
  }));
}

// ---- HOOK PRINCIPAL ----

const useMenuItemsCollapsedShells = (t: (token: string) => string, role: UserRole): MenuItem[] => {
  const menu = menuConfig[role];
  if (!menu) return [];
  return translateAndMap(menu, t, role);
};

export default useMenuItemsCollapsedShells;
