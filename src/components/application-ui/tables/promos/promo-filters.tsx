'use client';

import { FilterAltOff, FilterList, ImageSearch } from '@mui/icons-material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PromoFilters } from '@/services/promo.service';

/** Lo que el usuario toca. La paginación la maneja el panel, no esta barra. */
export type PromoFilterValues = Omit<PromoFilters, 'page' | 'limit' | 'storeId'>;

const EMPTY: PromoFilterValues = {
  q: '',
  imageUrl: '',
  status: undefined,
  type: undefined,
  category: undefined,
};

const isSet = (v: unknown) => v !== '' && v !== undefined && v !== null;

interface Props {
  value: PromoFilterValues;
  onChange: (next: PromoFilterValues) => void;
  /** Abre la herramienta de acciones masivas con la URL ya cargada */
  onBulkByImage: (imageUrl: string) => void;
  resultCount?: number;
}

/**
 * Filtros del listado de anuncios.
 *
 * En escritorio van en línea, que es donde hay ancho. En móvil sólo queda la
 * búsqueda y un botón: cinco campos apilados empujarían la lista fuera de la
 * pantalla, y a los filtros se entra de a ratos, no todo el tiempo.
 *
 * El filtro por URL de imagen no es un capricho: cuando una pieza sale mal en
 * las tablets, la URL es lo único que se tiene a mano — no el sorteo, no el id.
 */
export const PromoFiltersBar = ({ value, onChange, onBulkByImage, resultCount }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(false);

  // El texto se escribe local y sube con retardo: sin esto cada tecla dispara
  // una consulta al backend.
  const [q, setQ] = useState(value.q || '');
  const [imageUrl, setImageUrl] = useState(value.imageUrl || '');

  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== (value.q || '') || imageUrl !== (value.imageUrl || '')) {
        onChange({ ...value, q, imageUrl });
      }
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, imageUrl]);

  const set = (patch: Partial<PromoFilterValues>) => onChange({ ...value, ...patch });

  const activeCount = Object.values(value).filter(isSet).length;

  const clear = () => {
    setQ('');
    setImageUrl('');
    onChange(EMPTY);
    setOpen(false);
  };

  /* ─── Campos ─────────────────────────────────────────────────────────── */

  const search = (
    <TextField
      size="small"
      fullWidth
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={t('Search by title')}
      inputProps={{ 'aria-label': t('Search ads by title') }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );

  const selects = (
    <>
      <TextField
        size="small"
        select
        fullWidth={isMobile}
        label={t('Status')}
        value={value.status || ''}
        onChange={(e) => set({ status: (e.target.value || undefined) as any })}
        sx={{ minWidth: { md: 150 } }}
      >
        <MenuItem value="">{t('All')}</MenuItem>
        <MenuItem value="pending">{t('Pending')}</MenuItem>
        <MenuItem value="in_progress">{t('Active')}</MenuItem>
        <MenuItem value="completed">{t('Completed')}</MenuItem>
      </TextField>

      <TextField
        size="small"
        select
        fullWidth={isMobile}
        label={t('Type')}
        value={value.type || ''}
        onChange={(e) => set({ type: (e.target.value || undefined) as any })}
        sx={{ minWidth: { md: 140 } }}
      >
        <MenuItem value="">{t('All')}</MenuItem>
        <MenuItem value="tablet">Tablet</MenuItem>
        <MenuItem value="app">App</MenuItem>
        <MenuItem value="kiosk">Kiosk</MenuItem>
      </TextField>

      <TextField
        size="small"
        select
        fullWidth={isMobile}
        label={t('Category')}
        value={value.category || ''}
        onChange={(e) => set({ category: (e.target.value || undefined) as any })}
        sx={{ minWidth: { md: 150 } }}
      >
        <MenuItem value="">{t('All')}</MenuItem>
        <MenuItem value="generic">{t('Generic')}</MenuItem>
        <MenuItem value="custom">{t('Custom')}</MenuItem>
      </TextField>
    </>
  );

  const imageField = (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ md: 'flex-start' }}
      sx={{ width: '100%' }}
    >
      <TextField
        size="small"
        fullWidth
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder={t('Paste the image URL that came out wrong')}
        helperText={t('A generic ad is copied to every store: the same image lives in many records.')}
        inputProps={{ 'aria-label': t('Filter by image URL') }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ImageSearch fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Tooltip
        title={
          imageUrl.trim()
            ? t('Replace or remove this image everywhere it is used')
            : t('Paste an image URL first')
        }
        arrow
      >
        <Box component="span">
          <Button
            variant="contained"
            color="warning"
            disableElevation
            fullWidth={isMobile}
            disabled={!imageUrl.trim()}
            onClick={() => {
              onBulkByImage(imageUrl.trim());
              setOpen(false);
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              // 44px: el mínimo táctil, no el alto que le quede al texto
              minHeight: 44,
              px: 2.5,
            }}
          >
            {t('Fix in bulk')}
          </Button>
        </Box>
      </Tooltip>
    </Stack>
  );

  const summary = activeCount > 0 && (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
    >
      {typeof resultCount === 'number' && (
        <Chip
          size="small"
          label={t('{{count}} results', { count: resultCount })}
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        />
      )}
      <Button
        size="small"
        startIcon={<FilterAltOff fontSize="small" />}
        onClick={clear}
        sx={{ textTransform: 'none', minHeight: 36 }}
      >
        {t('Clear filters')}
      </Button>
    </Stack>
  );

  /* ─── Móvil: búsqueda + botón; el resto en un panel ──────────────────── */

  if (isMobile) {
    return (
      <>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2 }}
        >
          {search}
          <Tooltip
            title={t('Filters')}
            arrow
          >
            <Badge
              badgeContent={activeCount}
              color="primary"
              overlap="circular"
            >
              <IconButton
                onClick={() => setOpen(true)}
                aria-label={t('Open filters')}
                sx={{
                  width: 44,
                  height: 44,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <FilterList />
              </IconButton>
            </Badge>
          </Tooltip>
        </Stack>

        <Drawer
          anchor="bottom"
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              // Respeta la barra de gestos: sin esto el último botón queda debajo
              pb: 'calc(env(safe-area-inset-bottom) + 16px)',
              px: 2,
              pt: 2,
              maxHeight: '85dvh',
            },
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
              >
                {t('Filters')}
              </Typography>
              {activeCount > 0 && (
                <Button
                  size="small"
                  startIcon={<FilterAltOff fontSize="small" />}
                  onClick={clear}
                  sx={{ textTransform: 'none' }}
                >
                  {t('Clear')}
                </Button>
              )}
            </Stack>

            {selects}
            {imageField}

            <Button
              variant="contained"
              disableElevation
              onClick={() => setOpen(false)}
              sx={{ borderRadius: 2, minHeight: 48, fontWeight: 600, textTransform: 'none' }}
            >
              {typeof resultCount === 'number'
                ? t('Show {{count}} results', { count: resultCount })
                : t('Apply')}
            </Button>
          </Stack>
        </Drawer>
      </>
    );
  }

  /* ─── Escritorio: todo a la vista ────────────────────────────────────── */

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
      >
        {search}
        {selects}
      </Stack>

      {imageField}
      {summary}
    </Card>
  );
};
