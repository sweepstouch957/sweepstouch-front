/**
 * Dominio circular (circulares, catálogo, próximos, agentes, banners).
 * Capa de datos: sólo HTTP vía `api` y tipos; nada de React ni toasts.
 * Cada subdominio vive en su `*.api.ts`; `circularService` los junta para el código existente.
 */
import { agentsApi } from './agents.api';
import { bannersApi } from './banners.api';
import { catalogApi } from './catalog.api';
import { circularsApi } from './circulars.api';
import { upcomingApi } from './upcoming.api';

export * from './types';
export * from './utils';
export { agentsApi, bannersApi, catalogApi, circularsApi, upcomingApi };

export const circularService = {
  ...circularsApi,
  ...upcomingApi,
  ...catalogApi,
  ...agentsApi,
  ...bannersApi,
};
export type CircularService = typeof circularService;
