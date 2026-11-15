/** Límites y filtros del envío de prueba. */
import { createFilterOptions } from '@mui/material';

/* ────────────────────────────── constants ────────────────────────────── */
export const MAX_IMAGE_KB = 500;

// Capa el render del Autocomplete de tiendas a 50 opciones (miles de tiendas
// montarian miles de <li> con input vacio). Filtra por name al tipear.
export const storeAutocompleteFilter = createFilterOptions<any>({
  limit: 50,
  stringify: (o) => o?.name ?? '',
});
