import type { UserRole } from '@/contexts/auth/user';
import {
  AccountBalanceRounded,
  AdsClickOutlined,
  BookOutlined,
  BrushRounded,
  BuildRounded,
  Campaign,
  CelebrationRounded,
  DescriptionRounded,
  Diversity3Rounded,
  EventRounded,
  InsightsRounded,
  ListAltRounded,
  LocalOfferRounded,
  LocalPlayRounded,
  MapRounded,
  PendingActionsRounded,
  ReceiptLongRounded,
  RuleRounded,
  Store,
} from '@mui/icons-material';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { MenuItem } from 'src/router/menuItem';
import { routes } from 'src/router/routes';

/**
 * Espejo de STAFF_ROLES del api-gateway (routes/index.js). Es el equipo interno:
 * lo que cuelga de la seccion General (AI, Dashboards, Applications) pega contra
 * /api/tasks, /api/hub y /api/ai, y todos exigen este set. Sin este filtro un
 * cashier o una promotora veian el menu completo y cada click volvia 403.
 * Si se toca alla, se toca aca.
 */
const STAFF_ROLES: UserRole[] = [
  'admin', 'general_manager', 'campaign_manager', 'design', 'marketing',
  'it', 'tecnico', 'support', 'billing', 'operations', 'assistant',
  'promotor_manager', 'merchant_manager',
];

/** Roles con acceso completo al panel administrativo. */
const ADMIN_ACCESS_ROLES: UserRole[] = ['admin', 'general_manager'];

/**
 * Criterio del sidebar — si agregás algo, seguilo:
 *
 * 1. Todo en español. Antes convivían "Listing/Create/Prizes" con "Listado de
 *    tiendas/Crear tienda/Marcas" en la misma columna.
 * 2. Crear NO es un ítem de menú. Es un botón del listado. Cuatro entradas
 *    "Crear X" eran ruido puro; las rutas siguen existiendo para quien las tenga
 *    guardadas.
 * 3. Ícono en el módulo siempre. En los hijos, sólo si distingue: seis títulos
 *    sueltos se reconocen mejor con ícono, pero el mismo `<List />` repetido
 *    cinco veces no informa nada.
 * 4. Dos niveles como máximo. Un submenú dentro de un submenú esconde cosas.
 * 5. Un destino, un ítem. Nada de la misma ruta en dos módulos.
 * 6. Un módulo con una sola página va como ruta directa, sin submenú.
 */
const buildMenu = (
  title: string,
  icon: React.ReactNode,
  subMenu: MenuItem[] = [],
  route?: string,
  roles?: UserRole[]
): MenuItem => ({ title, icon, subMenu, route, roles });

/* ═══════════════════════ General ═══════════════════════ */

// Todas las métricas del negocio en un solo lugar. "Promotoras" vivía acá Y en
// el módulo Promotoras apuntando a la misma ruta; queda sólo acá.
const dashboardsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Métricas'), <InsightsRounded />, [
    { title: t('Reportes'), route: routes.admin.dashboards.reports },
    { title: t('Sweepstakes'), route: routes.admin.dashboards.sweepstakes },
    { title: t('Mensajes enviados'), route: routes.admin.dashboards['messages-sent'] },
    { title: t('Audiencia'), route: routes.admin.dashboards.audience },
    { title: t('Promotoras'), route: routes.admin.management.promotors.metrics },
    { title: t('Facturación'), route: routes.admin.dashboards.billing },
  ], undefined, STAFF_ROLES);

// Herramientas internas del equipo. No es un módulo de negocio: es lo que no
// pertenece a ninguno. "Store Maps" salió de acá y se fue a Tiendas, que es
// donde lo busca quien lo necesita.
const applicationsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Aplicaciones'), <AppsRoundedIcon />, [
    { title: t('Tareas'), route: routes.admin.applications.tasks },
    { title: t('Proyectos'), route: routes.admin.applications['projects-board'] },
    { title: t('Reuniones'), route: routes.admin.applications.meetings },
    { title: t('Calendario'), route: routes.admin.applications.calendar },
    { title: t('Optin Cajeros'), route: routes.admin.applications['optin-cashiers'] },
    { title: t('Buscar número'), route: routes.admin.applications['debug-numbers'] },
    { title: t('Códigos QR'), route: routes.admin.management.qr },
    { title: t('Demos'), route: routes.admin.applications.demos },
    { title: t('Utilidades'), route: routes.admin.applications.utilities },
  ], undefined, STAFF_ROLES);

const designsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(
    t('Designs Studio'),
    <BrushRounded />,
    [
      { title: t('Flyers'), route: routes.admin.designs.flyers },
      { title: t('Shelfsigns'), route: routes.admin.designs.shelfsigns },
    ],
    undefined,
    [...ADMIN_ACCESS_ROLES, 'design']
  );

/* ═══════════════════════ Management ═══════════════════════ */

const storesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Tiendas'), <Store />, [
    { title: t('Listado'), route: routes.admin.management.stores.listing, icon: <ListAltRounded /> },
    { title: t('Mapa'), route: routes.admin.applications.maps, icon: <MapRounded /> },
    { title: t('Marcas'), route: routes.admin.management.stores.brands, icon: <LocalOfferRounded /> },
    { title: t('Citas y agenda'), route: routes.admin.management.stores.appointments, icon: <EventRounded /> },
    { title: t('Contratos'), route: routes.admin.management.stores.contracts, icon: <DescriptionRounded /> },
  ]);

const campaignsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Campañas'), <Campaign />, [
    { title: t('Listado'), route: routes.admin.management.campaings.listing },
    // Enviar prueba salió del menú: es una acción sobre campañas, no una sección.
    // Vive en el botón "Enviar prueba" de la portada del listado.
    { title: t('Solicitudes'), route: routes.admin.management['campaign-requests'].listing, roles: ['admin', 'campaign_manager', 'design', 'general_manager'] },
    { title: t('Opt-in MMS'), route: routes.admin.management.campaings.optin, roles: ['admin', 'general_manager', 'campaign_manager'] },
    { title: t('Generador MMS'), route: routes.admin.management.campaings.mms, roles: ADMIN_ACCESS_ROLES },
    { title: t('Monitoreo RCS'), route: routes.admin.dashboards['campaign-analytics'], roles: ADMIN_ACCESS_ROLES },
    // Ads era un módulo entero para una sola página. Los `roles` replican
    // exactamente quién lo veía cuando estaba arriba: admin, dirección y marketing.
    { title: t('Ads'), route: routes.admin.management.promos.listing, icon: <AdsClickOutlined />, roles: [...ADMIN_ACCESS_ROLES, 'marketing'] },
  ]);

const circularsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Circulares'), <BookOutlined />, [
    { title: t('Panel'), route: routes.admin.management.circulars['info-dashboard'] },
    { title: t('Gestionar'), route: routes.admin.management.circulars.manage },
    { title: t('Programar'), route: routes.admin.management.circulars.schedule },
  ]);

const sweepstakesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Sweepstakes'), <LocalPlayRounded />, [
    { title: t('Listado'), route: routes.admin.management.sweepstakes.listing },
    { title: t('Premios'), route: routes.admin.management.prizes.listing },
  ]);

// Una sola página: va como ruta directa. Las tiendas de evento no viven en el
// listado de tiendas ni reciben campañas, por eso es módulo aparte y no cuelga
// de Sweepstakes.
const eventsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Eventos'), <CelebrationRounded />, [], routes.admin.management.events.listing);

// Plano. Antes eran dos submenús anidados ("Personnel management" / "shift
// management") con `<List />` repetido en cada nieto: tres niveles para llegar a
// un listado.
const promotorsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Promotoras'), <Diversity3Rounded />, [
    { title: t('Listado'), route: routes.admin.management.promotors.listing },
    { title: t('Postulaciones'), route: routes.admin.management.solicitudes.promotoras },
    { title: t('Turnos'), route: routes.admin.management.promotors.turnos },
    { title: t('Solicitudes de turno'), route: routes.admin.management.solicitudes.turnos },
    { title: t('Plan de ganancias'), route: routes.admin.management.promotors.earningsTiers },
    { title: t('Tiendas candidatas'), route: routes.admin.management.promotors.featuredStores },
  ]);

const supportMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Soporte Técnico'), <BuildRounded />, [
    { title: t('Panel'), route: routes.admin.management.support.dashboard },
    { title: t('Tickets'), route: routes.admin.management.support.tickets },
    { title: t('Visitas'), route: routes.admin.management.support.visits },
  ]);

/** Facturación y QuickBooks. Es la URL que Intuit tiene registrada en el perfil de la app. */
const billingMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Facturación'), <AccountBalanceRounded />, [
    { title: t('Cartera'), route: routes.admin.management['billing-receivables'], icon: <ReceiptLongRounded /> },
    { title: t('Prefacturas'), route: routes.admin.management['billing-drafts'], icon: <PendingActionsRounded /> },
    { title: t('Conciliación'), route: routes.admin.management['billing-reconcile'], icon: <RuleRounded /> },
  ]);

const usersMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Usuarios'), <PeopleRoundedIcon />, [
    { title: t('Listado'), route: routes.admin.management.users.listing },
    { title: t('Merchants'), route: routes.admin.management.merchants.listing },
    { title: t('Departamentos'), route: routes.admin.management.departments.listing },
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
    ...(ADMIN_ACCESS_ROLES.includes(role)
      ? [{ title: t('Configuración'), route: routes.admin.applications['ai-config'] }]
      : []),
  ];
  const aiMenu: MenuItem[] = [
    // El gateway permite merchant en /api/ai, no en el resto del staff-only.
    buildMenu(t('AI Assistant'), <SmartToyRoundedIcon />, aiSubItems, undefined, [
      ...STAFF_ROLES,
      'merchant',
    ]),
  ];

  const general: MenuItem[] = [
    ...aiMenu,
    dashboardsMenu(t),
    applicationsMenu(t),
    designsMenu(t),
  ];

  // Orden por uso: lo de todos los días arriba, la administración abajo.
  // Usuarios y Facturación se tocan una vez por semana y estaban primeros.
  const adminManagementMenus = [
    storesMenu(t),
    campaignsMenu(t),
    circularsMenu(t),
    sweepstakesMenu(t),
    eventsMenu(t),
    promotorsMenu(t),
    supportMenu(t),
    billingMenu(t),
    usersMenu(t),
  ];

  const roleMenus: Record<UserRole, MenuItem[]> = {
    admin: adminManagementMenus,
    general_manager: adminManagementMenus,
    promotor_manager: [
      storesMenu(t),
      sweepstakesMenu(t),
      eventsMenu(t),
      promotorsMenu(t),
      circularsMenu(t),
    ],
    campaign_manager: [storesMenu(t), campaignsMenu(t), circularsMenu(t)],
    marketing: [storesMenu(t), campaignsMenu(t), circularsMenu(t)],
    cashier: [],
    merchant: [],
    promotor: [storesMenu(t)],
    design: [storesMenu(t), circularsMenu(t)],
    merchant_manager: [storesMenu(t)],
    tecnico: [supportMenu(t)],

    // Roles del organigrama nuevo. Sin entrada acá el panel abría sin sección
    // Management y la persona sólo veía Dashboards y Applications.
    operations: [storesMenu(t), campaignsMenu(t), circularsMenu(t), promotorsMenu(t), supportMenu(t)],
    it: [storesMenu(t), campaignsMenu(t), supportMenu(t), usersMenu(t)],
    // Cada rol entra directo a SU centro: el orden general (tiendas primero) es
    // para quien ve todo el panel, no para quien sólo trabaja en un módulo.
    support: [supportMenu(t), storesMenu(t)],
    billing: [billingMenu(t), storesMenu(t)],
    // Asistencia de Dirección conserva el acceso operativo definido para su rol.
    assistant: [storesMenu(t), campaignsMenu(t), promotorsMenu(t), supportMenu(t)],
  };

  const visible = filterByRole(role);
  const management = visible(roleMenus[role] || []);

  return [
    { title: t('General'), subMenu: visible(general) },
    ...(management.length > 0 ? [{ title: t('Management'), subMenu: management }] : []),
  ];
};

export default useMenuItemsCollapsedShells;
