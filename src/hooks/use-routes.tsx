import type { UserRole } from '@/contexts/auth/user';
import {
  AccountBalanceRounded,
  AdsClickOutlined,
  BookOutlined,
  BrushRounded,
  BuildRounded,
  CalendarMonthRounded,
  Campaign,
  DescriptionRounded,
  Diversity3Rounded,
  EventRounded,
  GroupsRounded,
  HandymanRounded,
  InsightsRounded,
  ListAltRounded,
  LocalOfferRounded,
  LocalPlayRounded,
  MapRounded,
  PendingActionsRounded,
  PointOfSaleRounded,
  QrCode2Rounded,
  ReceiptLongRounded,
  RuleRounded,
  SearchRounded,
  SlideshowRounded,
  Store,
  TuneRounded,
  TaskAltRounded,
  ViewKanbanRounded,
} from '@mui/icons-material';
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

/**
 * Antes esto era un módulo "Aplicaciones" con nueve hijos sin relación entre sí:
 * un cajón de sastre que había que abrir para ver qué tenía adentro. Ahora las
 * dos mitades son secciones propias, planas, al estilo de la consola de AWS:
 * el encabezado agrupa y los ítems se ven de una.
 */
const workItems = (t: (token: string) => string): MenuItem[] => [
  { title: t('Tareas'), route: routes.admin.applications.tasks, icon: <TaskAltRounded />, roles: STAFF_ROLES },
  { title: t('Proyectos'), route: routes.admin.applications['projects-board'], icon: <ViewKanbanRounded />, roles: STAFF_ROLES },
  { title: t('Reuniones'), route: routes.admin.applications.meetings, icon: <GroupsRounded />, roles: STAFF_ROLES },
  { title: t('Calendario'), route: routes.admin.applications.calendar, icon: <CalendarMonthRounded />, roles: STAFF_ROLES },
];

/**
 * Herramientas sueltas, colapsadas en un módulo. Planas ocupaban cinco filas
 * fijas que empujaban todo lo demás abajo del fold; se entra a ellas una vez
 * por semana, no vale la pantalla que costaban.
 */
const toolsMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Herramientas'), <HandymanRounded />, [
    { title: t('Optin Cajeros'), route: routes.admin.applications['optin-cashiers'], icon: <PointOfSaleRounded /> },
    { title: t('Códigos QR'), route: routes.admin.management.qr, icon: <QrCode2Rounded /> },
    { title: t('Buscar número'), route: routes.admin.applications['debug-numbers'], icon: <SearchRounded /> },
    { title: t('Demos'), route: routes.admin.applications.demos, icon: <SlideshowRounded /> },
    { title: t('Utilidades'), route: routes.admin.applications.utilities, icon: <TuneRounded /> },
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

// Eventos va acá adentro: un evento ES un sweepstake, el de optinType
// 'event'/'nsa'. Como módulo aparte quedaban dos entradas pegadas diciendo
// casi lo mismo. Lo único distinto es su tienda, y eso se ve dentro de Eventos.
const sweepstakesMenu = (t: (token: string) => string): MenuItem =>
  buildMenu(t('Sweepstakes'), <LocalPlayRounded />, [
    { title: t('Listado'), route: routes.admin.management.sweepstakes.listing },
    { title: t('Eventos'), route: routes.admin.management.events.listing },
    { title: t('Premios'), route: routes.admin.management.prizes.listing },
  ]);

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

type MenuFactory = (t: (token: string) => string) => MenuItem;

/**
 * Secciones de Management, en orden. Cada módulo vive en UNA sección; el rol
 * decide cuáles ve (roleModules), la sección decide dónde caen. Antes había un
 * solo encabezado "Management" con ocho módulos apilados sin criterio.
 */
const MANAGEMENT_SECTIONS: { title: string; modules: MenuFactory[] }[] = [
  // Lo que se produce y se le manda al súper: campañas, circulares, la tienda
  { title: 'Producción', modules: [storesMenu, campaignsMenu, circularsMenu] },
  // Cómo entran los números a la base
  { title: 'Captación', modules: [sweepstakesMenu, promotorsMenu] },
  // Se toca una vez por semana, no todos los días
  { title: 'Administración', modules: [billingMenu, usersMenu, supportMenu] },
];

/**
 * Qué módulos ve cada rol. Mismo conjunto que antes — sólo cambió que ahora se
 * listan las factories y no los items ya construidos, para poder agruparlos por
 * sección sin duplicar la lista.
 */
const ALL_MODULES: MenuFactory[] = MANAGEMENT_SECTIONS.flatMap((s) => s.modules);

const roleModules: Record<UserRole, MenuFactory[]> = {
  admin: ALL_MODULES,
  general_manager: ALL_MODULES,
  promotor_manager: [storesMenu, sweepstakesMenu, promotorsMenu, circularsMenu],
  campaign_manager: [storesMenu, campaignsMenu, circularsMenu],
  marketing: [storesMenu, campaignsMenu, circularsMenu],
  cashier: [],
  merchant: [],
  promotor: [storesMenu],
  design: [storesMenu, circularsMenu],
  merchant_manager: [storesMenu],
  tecnico: [supportMenu],

  // Roles del organigrama nuevo. Sin entrada acá el panel abría sin sección
  // Management y la persona sólo veía Métricas y las herramientas.
  operations: [storesMenu, campaignsMenu, circularsMenu, promotorsMenu, supportMenu],
  it: [storesMenu, campaignsMenu, supportMenu, usersMenu],
  support: [supportMenu, storesMenu],
  billing: [billingMenu, storesMenu],
  assistant: [storesMenu, campaignsMenu, promotorsMenu, supportMenu],
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

  const allowed = new Set(roleModules[role] || []);

  const sections: MenuItem[] = [
    {
      title: t('Panel'),
      subMenu: [
        // El gateway permite merchant en /api/ai, no en el resto del staff-only.
        buildMenu(t('AI Assistant'), <SmartToyRoundedIcon />, aiSubItems, undefined, [
          ...STAFF_ROLES,
          'merchant',
        ]),
        dashboardsMenu(t),
        designsMenu(t),
        toolsMenu(t),
      ],
    },
    // Arriba de los módulos de negocio: Tareas se abre todos los días y estaba
    // al final de la barra, abajo del fold.
    { title: t('Trabajo'), subMenu: workItems(t) },
    ...MANAGEMENT_SECTIONS.map((section) => ({
      title: t(section.title),
      subMenu: section.modules.filter((m) => allowed.has(m)).map((m) => m(t)),
    })),
  ];

  // Una sección sin items es un encabezado huérfano: el rol no llega a nada de
  // lo que agrupa. Se cae entera.
  const visible = filterByRole(role);
  return sections
    .map((section) => ({ ...section, subMenu: visible(section.subMenu || []) }))
    .filter((section) => section.subMenu.length > 0);
};

export default useMenuItemsCollapsedShells;
