import type { UserRole } from '@/contexts/auth/user';
import {
  AdsClickOutlined,
  BookOutlined,
  Campaign,
  Person2Outlined,
  Redeem,
  Store,
  StorefrontOutlined,
} from '@mui/icons-material';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { List } from '@mui/material';
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
  buildMenu(t('Dashboards'), <Person2Outlined />, [
    { title: t('Billing'), route: routes.admin.dashboards.billing },
    buildMenu(t('Metrics'), undefined, [
      { title: t('Reports'), icon: <List />, route: routes.admin.dashboards.reports },
      {
        title: t('Sweepstakes'),
        icon: <List />,
        route: routes.admin.dashboards.sweepstakes,
      },
      {
        title: t('Messages sent'),
        icon: <List />,
        route: routes.admin.dashboards['messages-sent'],
      },
      { title: t('Audience'), icon: <List />, route: routes.admin.dashboards.audience },
    ]),
  ]);

const applicationsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Applications'), <AppsRoundedIcon />, [
    { title: t('Projects Board'), route: routes.admin.applications['projects-board'] },
    { title: t('Tasks'), route: routes.admin.applications.tasks },
    { title: t('Store Maps'), route: routes.admin.applications.maps },
    { title: t('Calendar'), route: routes.admin.applications.calendar },
    //{ title: t('debug'), route: routes.admin.applications['debug-numbers'] },
    //{ title: t('File manager'), route: routes.admin.applications['file-manager'] },
    //{ title: t('Messenger'), route: routes.admin.applications.messenger },
  ]);

const usersMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Users'), <PeopleRoundedIcon />, [
    { title: t('Listing'), route: routes.admin.management.users.listing },
    { title: t('Merchants'), route: routes.admin.management.merchants.listing },
    //{ title: t('User profile'), route: routes.admin.management.users.profile },
  ]);

const merchantsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Merchants'), <StorefrontOutlined />, [
    { title: t('Listing'), route: routes.admin.management.merchants.listing },
  ]);

const campaignsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Campaigns'), <Campaign />, [
    { title: t('Listing'), route: routes.admin.management.campaings.listing },
    { title: t('Send Test'), route: routes.admin.management.campaings['send-test'], roles: ['admin'] },
    { title: t('MMS Generator'), route: routes.admin.management.campaings.mms, roles: ['admin'] },
  ]);

const promotorsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Promotors'), <Person2Outlined />, [
    buildMenu(t('Personnel management'), undefined, [
      {
        title: t('Listing'),
        icon: <List />,
        route: routes.admin.management.promotors.listing,
      },

      {
        title: t('Applies'),
        icon: <List />,
        route: routes.admin.management.solicitudes.promotoras,
      },
    ]),

    buildMenu(t('shift management'), undefined, [
      {
        title: t('Listing'),
        icon: <List />,
        route: routes.admin.management.promotors.turnos,
      },

      {
        title: t('Applies'),
        icon: <List />,
        route: routes.admin.management.solicitudes.turnos,
      },
    ]),

    { title: t('featured stores'), route: routes.admin.management.promotors.featuredStores },
  ]);

//const requestMenu = (t: (token: string) => string): MenuItem =>
// buildMenu(t('Solicitudes'), <Assignment />, [

//]);

const sweepstakesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Sweepstakes'), <Redeem />, [
    { title: t('Listing'), route: routes.admin.management.sweepstakes.listing },
    { title: t('Create Sweepstakes'), route: routes.admin.management.sweepstakes.create },
    { title: t('Prizes'), route: routes.admin.management.prizes.listing },
  ]);

const storesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Stores'), <Store />, [
    { title: t('Listing'), route: routes.admin.management.stores.listing },
    { title: t('Create Store'), route: routes.admin.management.stores.create },
    { title: t('Brands'), route: routes.admin.management.stores.brands },
    { title: t('Appointments & Schedule'), route: routes.admin.management.stores.appointments },
    { title: t('Contracts'), route: routes.admin.management.stores.contracts },
    { title: t('New Contract'), route: routes.admin.management.stores['contracts-create'] },
  ]);

const addsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Ads'), <AdsClickOutlined />, [], routes.admin.management.promos.listing);

const circularsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Circulars'), <BookOutlined />, [
    { title: t('Info Dashboard'), route: routes.admin.management.circulars['info-dashboard'] },
    { title: t('Manage Circulars'), route: routes.admin.management.circulars.manage },
    { title: t('Schedule Circulars'), route: routes.admin.management.circulars.schedule },
  ]);

export const useMenuItemsCollapsedShells = (
  t: (token: string) => string,
  role: UserRole
): MenuItem[] => {
  const aiSubItems: MenuItem[] = [
    { title: t('Chat'), route: routes.admin.applications['ai-assistant'] },
    ...(role === 'admin'
      ? [{ title: t('Configuration'), route: routes.admin.applications['ai-config'] }]
      : []),
  ];
  const aiMenu: MenuItem[] = [
    buildMenu(t('AI Assistant'), <SmartToyRoundedIcon />, aiSubItems),
  ];

  const general: MenuItem[] = [
    ...aiMenu,
    dashboardsMenu(t),
    applicationsMenu(t),
  ];

  const roleMenus: Record<UserRole, MenuItem[]> = {
    admin: [
      usersMenu(t),
      storesMenu(t),
      campaignsMenu(t),
      sweepstakesMenu(t),
      promotorsMenu(t),
      addsMenu(t),
      circularsMenu(t),
      //requestMenu(t),
    ],
    general_manager: [campaignsMenu(t), promotorsMenu(t), storesMenu(t)],
    promotor_manager: [sweepstakesMenu(t), promotorsMenu(t), storesMenu(t), circularsMenu(t)],
    campaign_manager: [campaignsMenu(t), circularsMenu(t), storesMenu(t)],
    marketing: [campaignsMenu(t), circularsMenu(t), storesMenu(t), addsMenu(t)],
    cashier: [],
    merchant: [],
    promotor: [storesMenu(t)],
    design: [storesMenu(t), circularsMenu(t)],
    merchant_manager: [storesMenu(t)],
  };

  const management = roleMenus[role] || [];

  return [
    { title: t('General'), subMenu: general },
    ...(management.length > 0 ? [{ title: t('Management'), subMenu: management }] : []),
  ];
};

export default useMenuItemsCollapsedShells;
