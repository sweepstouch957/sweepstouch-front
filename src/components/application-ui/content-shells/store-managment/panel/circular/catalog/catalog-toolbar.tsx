'use client';

/** Búsqueda + acciones secundarias del catálogo. La principal (sincronizar visibilidad) va
 *  en la cabecera; lo demás (IA sobre el catálogo, borrar todo) va en un menú. */
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Button, Chip, InputAdornment, Stack, TextField } from '@mui/material';
import { MoreMenu, type MoreMenuItem } from '../panelUi';
import type { CatalogShow } from './constants';
import { plural } from './utils';

const SHOW_OPTIONS: { label: string; value: CatalogShow | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Sólo visibles', value: 'visible' },
  { label: 'Ocultos', value: 'hidden' },
  { label: 'Esperan fecha', value: 'pending' },
];

export function CatalogToolbar({
  search,
  onSearch,
  show,
  onShow,
  missingRegular,
  filling,
  onFillRegulars,
  onAdd,
  menu,
}: {
  search: string;
  onSearch: (v: string) => void;
  show?: CatalogShow;
  onShow: (v: CatalogShow | undefined) => void;
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
        gap={0.75}
        flexWrap="wrap"
      >
        {SHOW_OPTIONS.map((o) => (
          <Chip
            key={o.label}
            size="small"
            label={o.label}
            color={show === o.value ? 'primary' : 'default'}
            variant={show === o.value ? 'filled' : 'outlined'}
            onClick={() => onShow(o.value)}
          />
        ))}
      </Stack>
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
