import type { UserRole } from '@/contexts/auth/user';
import {
  AdsClickOutlined,
  Announcement,
  Campaign,
  Person2Outlined,
  Redeem,
  Store,
} from '@mui/icons-material';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import { MenuItem } from 'src/router/menuItem';
import { routes } from 'src/router/routes';

const buildMenu = (
  title: string,
  icon: React.ReactNode,
  subMenu: MenuItem[] = [],
  route?: string,
  roles?: UserRole[]
): MenuItem => ({ title, icon, subMenu, route, roles });

const dashboardsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Dashboards'), <DashboardRoundedIcon />, [
    { title: t('Reports'), route: routes.admin.dashboards.reports },
    { title: t('Sweepstakes'), route: routes.admin.dashboards.sweepstakes },
    { title: t('Productivity'), route: routes.admin.dashboards.prouctivity },
  ]);

const applicationsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Applications'), <AppsRoundedIcon />, [
    { title: t('Store Maps'), route: routes.admin.applications.maps },
    { title: t('Calendar'), route: routes.admin.applications.calendar },
    { title: t('File manager'), route: routes.admin.applications['file-manager'] },
    { title: t('Messenger'), route: routes.admin.applications.messenger },
  ]);

const usersMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Users'), <PeopleRoundedIcon />, [
    { title: t('Listing'), route: routes.admin.management.users.listing },
    { title: t('User profile'), route: routes.admin.management.users.profile },
  ]);

const campaignsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Campaigns'), <Campaign />, [
    { title: t('Listing'), route: routes.admin.management.campaings.listing },
  ]);

const promotorsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Impulsadoras'), <Person2Outlined />, [
    { title: t('Promotoras'), route: routes.admin.management.promotors.listing },
    { title: t('Turnos'), route: routes.admin.management.promotors.turnos },
    {
      title: t('Solicitudes'),
      subMenu: [
        {
          title: t('Turnos'),
          route: routes.admin.management.promotors.solicitudes.turnos,
        },

        {
          title: t('Creacion Promotoras'),
          route: routes.admin.management.promotors.solicitudes.promotoras,
        },
      ],
    },
  ]);

const sweepstakesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(
    t('Sweepstakes'),
    <Redeem />,
    [{ title: t('Listing'), route: routes.admin.management.sweepstakes.listing }],
    routes.admin.management.sweepstakes.listing
  );

const storesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Stores'), <Store />, [
    { title: t('Listing'), route: routes.admin.management.stores.listing },
  ]);

const addsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Ads'), <AdsClickOutlined />, [], routes.admin.management.promos.listing);

export const useMenuItemsCollapsedShells = (
  t: (token: string) => string,
  role: UserRole
): MenuItem[] => {
  const general: MenuItem[] = [dashboardsMenu(t), applicationsMenu(t)];

  const roleMenus: Record<UserRole, MenuItem[]> = {
    admin: [addsMenu(t), promotorsMenu(t), campaignsMenu(t), sweepstakesMenu(t), storesMenu(t)],
    general_manager: [campaignsMenu(t), promotorsMenu(t), storesMenu(t)],
    promotor_manager: [sweepstakesMenu(t), promotorsMenu(t)],
    campaign_manager: [campaignsMenu(t)],
    cashier: [],
    merchant: [],
    promotor: [],
    design: [],
  };

  const management = roleMenus[role] || [];

  return [
    { title: t('General'), subMenu: general },
    ...(management.length > 0 ? [{ title: t('Management'), subMenu: management }] : []),
  ];
};

export default useMenuItemsCollapsedShells;
