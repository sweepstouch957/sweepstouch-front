import type { UserRole } from '@/contexts/auth/user';
import {
  AccountBalanceRounded,
  AddBusinessRounded,
  AdsClickOutlined,
  BookOutlined,
  BuildRounded,
  Campaign,
  DescriptionRounded,
  EventRounded,
  ListAltRounded,
  LocalOfferRounded,
  NoteAddRounded,
  Person2Outlined,
  Redeem,
  Store,
} from '@mui/icons-material';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
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
      { title: t('Promotoras'), icon: <List />, route: routes.admin.management.promotors.metrics },
    ]),
  ]);

const applicationsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Applications'), <AppsRoundedIcon />, [
    // Sin iconos: el submenú ya se identifica por el ícono del padre (Applications)
    // y el guion de jerarquía. Los iconos por ítem agregaban ruido visual.
    { title: t('Optin Cashiers'), route: routes.admin.applications['optin-cashiers'] },
    { title: t('Projects Board'), route: routes.admin.applications['projects-board'] },
    { title: t('Tasks'), route: routes.admin.applications.tasks },
    { title: t('Store Maps'), route: routes.admin.applications.maps },
    { title: t('Calendar'), route: routes.admin.applications.calendar },
    { title: t('Search Number'), route: routes.admin.applications['debug-numbers'] },
    { title: t('Demos'), route: routes.admin.applications.demos },
    { title: t('QR'), route: routes.admin.management.qr },
    { title: t('Utilidades'), route: routes.admin.applications.utilities },
    //{ title: t('File manager'), route: routes.admin.applications['file-manager'] },
    //{ title: t('Messenger'), route: routes.admin.applications.messenger },
  ]);

const usersMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Users'), <PeopleRoundedIcon />, [
    { title: t('Listing'), route: routes.admin.management.users.listing },
    { title: t('Merchants'), route: routes.admin.management.merchants.listing },
    { title: t('Departments'), route: routes.admin.management.departments.listing },
    //{ title: t('User profile'), route: routes.admin.management.users.profile },
  ]);

const campaignsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Campaigns'), <Campaign />, [
    { title: t('Listing'), route: routes.admin.management.campaings.listing },
    // Send Test salió del menú: es una acción sobre campañas, no una sección.
    // Vive en el botón "Enviar prueba" de la portada del listado; la ruta sigue
    // existiendo para quien la tenga guardada.
    { title: t('MMS Generator'), route: routes.admin.management.campaings.mms, roles: ['admin'] },
    { title: t('RCS Monitoring'), route: routes.admin.dashboards['campaign-analytics'], roles: ['admin'] },
    { title: t('Opt-in MMS'), route: routes.admin.management.campaings.optin, roles: ['admin', 'general_manager', 'campaign_manager'] },
    { title: t('Solicitudes de Campaña'), route: routes.admin.management['campaign-requests'].listing, roles: ['admin', 'campaign_manager', 'design', 'general_manager'] },
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
      {
        title: t('Plan de Ganancias'),
        icon: <List />,
        route: routes.admin.management.promotors.earningsTiers,
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

    { title: t('Tiendas Candidatas'), route: routes.admin.management.promotors.featuredStores },
    { title: t('Métricas'), route: routes.admin.management.promotors.metrics },
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
  // Submenú "MÓDULO" del Store Panel 2.0: cada entrada con su icono. Seis
  // títulos sueltos en texto obligan a leerlos; con icono se reconocen de un ojo.
  buildMenu(t('Stores'), <Store />, [
    { title: t('Listado de tiendas'), route: routes.admin.management.stores.listing, icon: <ListAltRounded /> },
    { title: t('Crear tienda'), route: routes.admin.management.stores.create, icon: <AddBusinessRounded /> },
    { title: t('Marcas'), route: routes.admin.management.stores.brands, icon: <LocalOfferRounded /> },
    { title: t('Citas y agenda'), route: routes.admin.management.stores.appointments, icon: <EventRounded /> },
    { title: t('Contratos'), route: routes.admin.management.stores.contracts, icon: <DescriptionRounded /> },
    { title: t('Nuevo contrato'), route: routes.admin.management.stores['contracts-create'], icon: <NoteAddRounded /> },
  ]);

/** Facturación y QuickBooks. Es la URL que Intuit tiene registrada en el perfil de la app. */
const billingMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Facturación'), <AccountBalanceRounded />, [], routes.admin.management.billing);

const addsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Ads'), <AdsClickOutlined />, [], routes.admin.management.promos.listing);

const circularsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Circulars'), <BookOutlined />, [
    { title: t('Info Dashboard'), route: routes.admin.management.circulars['info-dashboard'] },
    { title: t('Manage Circulars'), route: routes.admin.management.circulars.manage },
    { title: t('Schedule Circulars'), route: routes.admin.management.circulars.schedule },
  ]);

const supportMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Soporte Técnico'), <BuildRounded />, [
    { title: t('Dashboard'), route: routes.admin.management.support.dashboard },
    { title: t('Tickets'), route: routes.admin.management.support.tickets },
    { title: t('Visitas'), route: routes.admin.management.support.visits },
  ]);

/**
 * Aplica el `roles` de cada ítem. Estaba en el tipo pero nadie lo leía: "MMS
 * Generator" y "RCS Monitoring" decían ser sólo de admin y los veía cualquiera
 * que tuviera el menú de campañas.
 */
const filterByRole = (role: UserRole) => {
  const keep = (item: MenuItem): MenuItem | null => {
    if (item.roles && !item.roles.includes(role)) return null;
    if (!item.subMenu?.length) return item;
    const subMenu = item.subMenu.map(keep).filter(Boolean) as MenuItem[];
    // Un padre que se quedó sin hijos y sin ruta propia no lleva a ningún lado
    if (!subMenu.length && !item.route) return null;
    return { ...item, subMenu };
  };
  return (items: MenuItem[]) => items.map(keep).filter(Boolean) as MenuItem[];
};

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
    // Optin Cashiers pasó a ser el primer item de Applications (ya no cuelga suelto acá)
    ...aiMenu,
    dashboardsMenu(t),
    applicationsMenu(t),
  ];

  const roleMenus: Record<UserRole, MenuItem[]> = {
    admin: [
      usersMenu(t),
      storesMenu(t),
      billingMenu(t),
      campaignsMenu(t),
      sweepstakesMenu(t),
      promotorsMenu(t),
      addsMenu(t),
      circularsMenu(t),
      supportMenu(t),
      //requestMenu(t),
    ],
    general_manager: [campaignsMenu(t), promotorsMenu(t), storesMenu(t), supportMenu(t)],
    promotor_manager: [sweepstakesMenu(t), promotorsMenu(t), storesMenu(t), circularsMenu(t)],
    campaign_manager: [campaignsMenu(t), circularsMenu(t), storesMenu(t)],
    marketing: [campaignsMenu(t), circularsMenu(t), storesMenu(t), addsMenu(t)],
    cashier: [],
    merchant: [],
    promotor: [storesMenu(t)],
    design: [storesMenu(t), circularsMenu(t)],
    merchant_manager: [storesMenu(t)],
    tecnico: [supportMenu(t)],

    // Roles del organigrama nuevo. Sin entrada acá el panel abría sin sección
    // Management y la persona sólo veía Dashboards y Applications.
    operations: [storesMenu(t), promotorsMenu(t), circularsMenu(t), campaignsMenu(t), supportMenu(t)],
    it: [usersMenu(t), storesMenu(t), campaignsMenu(t), supportMenu(t)],
    support: [supportMenu(t), storesMenu(t)],
    // El rol de facturación entra directo a su centro: cartera, vinculación y conexión.
    billing: [billingMenu(t), storesMenu(t)],
    // Asistencia de Dirección ve lo mismo que Gerencia General.
    assistant: [campaignsMenu(t), promotorsMenu(t), storesMenu(t), supportMenu(t)],
  };

  const visible = filterByRole(role);
  const management = visible(roleMenus[role] || []);

  return [
    { title: t('General'), subMenu: visible(general) },
    ...(management.length > 0 ? [{ title: t('Management'), subMenu: management }] : []),
  ];
};

export default useMenuItemsCollapsedShells;
