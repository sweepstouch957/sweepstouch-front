'use client';

/** Búsqueda + acciones secundarias del catálogo. La principal (sincronizar visibilidad) va
 *  en la cabecera; lo demás (IA sobre el catálogo, borrar todo) va en un menú. */
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Button, InputAdornment, Stack, TextField } from '@mui/material';
import { MoreMenu, type MoreMenuItem } from '../panelUi';
import { plural } from './utils';

export function CatalogToolbar({
  search,
  onSearch,
  missingRegular,
  filling,
  onFillRegulars,
  onAdd,
  menu,
}: {
  search: string;
  onSearch: (v: string) => void;
  /** Productos de la página sin precio regular (se calcula +25%). */
  missingRegular: number;
  filling: boolean;
  onFillRegulars: () => void;
  onAdd: () => void;
  menu: MoreMenuItem[];
}) {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      gap={1}
    >
      <TextField
        size="small"
        placeholder="Buscar producto…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        inputProps={{ 'aria-label': 'Buscar producto' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ width: { xs: '100%', sm: 280 } }}
      />
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
        sx={{ ml: { sm: 'auto' } }}
      >
        {missingRegular > 0 && (
          <Button
            size="small"
            variant="outlined"
            disabled={filling}
            onClick={onFillRegulars}
          >
            {filling
              ? 'Calculando…'
              : `Completar ${missingRegular} regular${plural(missingRegular, '', 'es')} (+25%)`}
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          onClick={onAdd}
        >
          + Agregar producto
        </Button>
        <MoreMenu items={menu} />
      </Stack>
    </Stack>
  );
}
