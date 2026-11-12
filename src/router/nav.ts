/**
 * Navegación derivada del menú (use-routes): una sola fuente para la barra lateral,
 * las pestañas entre pantallas hermanas, el buscador global y la página de Inicio.
 * Si una página se agrega al menú, aparece sola en los cuatro lugares.
 */
import type { MenuItem } from './menuItem';

export { norm } from '@/utils/text';

/** La ruta es la página actual o un ancestro suyo (por segmento, no por texto). */
export const matchRoute = (pathname: string, route?: string) =>
  !!route && (pathname === route || pathname.startsWith(route.endsWith('/') ? route : `${route}/`));

/**
 * De varias rutas hermanas, la que corresponde a la página actual: la más larga
 * que calza. Con `includes` "/stores" quedaba marcada también en "/stores/brands".
 */
export const bestRoute = (pathname: string, routes: (string | undefined)[]) =>
  routes
    .filter((r): r is string => matchRoute(pathname, r))
    .sort((a, b) => b.length - a.length)[0];

export type NavPage = {
  title: string;
  route: string;
  /** Módulo al que pertenece ("Tiendas"); vacío si es una página suelta. */
  module: string;
  /** Sección de la barra ("Producción"). */
  section: string;
  icon?: React.ReactNode;
};

export type NavModule = {
  title: string;
  section: string;
  icon?: React.ReactNode;
  pages: NavPage[];
};

/** El menú (secciones › módulos › páginas) como lista de módulos con sus páginas. */
export function menuModules(menu: MenuItem[]): NavModule[] {
  const out: NavModule[] = [];
  for (const section of menu) {
    for (const mod of section.subMenu || []) {
      const children = (mod.subMenu || []).filter((c) => c.route);
      const pages: NavPage[] = children.length
        ? children.map((c) => ({
            title: c.title,
            route: c.route!,
            module: mod.title,
            section: section.title,
            icon: c.icon || mod.icon,
          }))
        : mod.route
          ? [{ title: mod.title, route: mod.route, module: '', section: section.title, icon: mod.icon }]
          : [];
      if (pages.length) out.push({ title: mod.title, section: section.title, icon: mod.icon, pages });
    }
  }
  return out;
}

/** El módulo de la página actual y cuál de sus páginas está abierta. */
export function currentModule(pathname: string, modules: NavModule[]) {
  let found: { module: NavModule; route: string } | undefined;
  for (const mod of modules) {
    const route = bestRoute(
      pathname,
      mod.pages.map((p) => p.route)
    );
    if (route && (!found || route.length > found.route.length)) found = { module: mod, route };
  }
  return found;
}
