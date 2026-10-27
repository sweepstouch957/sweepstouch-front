'use client';

import type { MaterialStore } from '@/services/material-control.service';
import { Autocomplete, createFilterOptions, TextField } from '@mui/material';
import { storeAddress } from './materials-utils';

const filterStores = createFilterOptions<MaterialStore>({ trim: true });

export function MaterialStoreSearch({
  stores,
  value,
  onChange,
  required = false,
  disabled = false,
  helperText,
}: {
  stores: MaterialStore[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <Autocomplete
      options={stores}
      value={stores.find((store) => store.id === value) || null}
      onChange={(_, store) => onChange(store?.id || '')}
      getOptionLabel={(store) => [store.nombre, storeAddress(store)].filter(Boolean).join(' · ')}
      getOptionKey={(store) => store.id}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={filterStores}
      autoHighlight
      fullWidth
      size="small"
      disabled={disabled}
      noOptionsText="No se encontraron tiendas"
      clearText={required ? 'Limpiar selección' : 'Todas las tiendas'}
      openText="Mostrar tiendas"
      closeText="Cerrar tiendas"
      renderInput={(params) => (
        <TextField
          {...params}
          label="Tienda"
          required={required}
          placeholder={required ? 'Buscar por nombre o dirección' : 'Todas las tiendas'}
          helperText={helperText}
        />
      )}
    />
  );
}
