'use client';

import { type Department } from '@/services/department.service';
import { type Epic } from '@/services/epic.service';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { cbChecked, cbIcon, priorityEntries } from './constants';

export type BoardFiltersProps = {
  departments: Department[];
  selectedDepts: Department[];
  onDeptsChange: (v: Department[]) => void;
  teamMembers: any[];
  selectedUsers: any[];
  onUsersChange: (v: any[]) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  onlyMine: boolean;
  onToggleOnlyMine: () => void;
  onlyMentions: boolean;
  onToggleOnlyMentions: () => void;
  epics: Epic[];
  epicFilter: string;
  onEpicFilterChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onClearFilters: () => void;
  shown: number;
  total: number;
};

const fullName = (u: any) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim();

/**
 * Barra de filtros del tablero.
 *
 * En escritorio: buscador ancho + los dos filtros de uso diario a la vista, y
 * el resto detrás de un botón con contador. En móvil: buscador pegado arriba y
 * todo lo demás en una hoja inferior con objetivos táctiles de 44px.
 *
 * Los filtros activos siempre se ven como fichas quitables: el problema real no
 * es poner un filtro, es no darse cuenta de que quedó puesto.
 */
export const BoardFilters = React.memo(function BoardFilters(props: BoardFiltersProps) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [sheet, setSheet] = React.useState(false);

  const {
    departments, selectedDepts, onDeptsChange,
    teamMembers, selectedUsers, onUsersChange,
    priorityFilter, onPriorityChange,
    onlyMine, onToggleOnlyMine,
    onlyMentions, onToggleOnlyMentions,
    epics, epicFilter, onEpicFilterChange,
    search, onSearchChange, onClearFilters,
    shown, total,
  } = props;

  const activeEpic = epics.find((e) => e._id === epicFilter);

  /** Cada ficha sabe cómo quitarse a sí misma. */
  const pills = React.useMemo(() => {
    const out: { key: string; label: string; color?: string; onRemove: () => void }[] = [];
    selectedDepts.forEach((d) =>
      out.push({
        key: `d-${d._id}`,
        label: d.name,
        color: d.color,
        onRemove: () => onDeptsChange(selectedDepts.filter((x) => x._id !== d._id)),
      })
    );
    selectedUsers.forEach((u: any) =>
      out.push({
        key: `u-${u.id || u._id}`,
        label: fullName(u),
        onRemove: () =>
          onUsersChange(selectedUsers.filter((x: any) => (x.id || x._id) !== (u.id || u._id))),
      })
    );
    if (priorityFilter !== 'all') {
      const meta = priorityEntries(theme).find(([k]) => k === priorityFilter)?.[1];
      out.push({
        key: 'prio',
        label: meta?.label || priorityFilter,
        color: meta?.color,
        onRemove: () => onPriorityChange('all'),
      });
    }
    if (onlyMine) out.push({ key: 'mine', label: 'Sólo mías', onRemove: onToggleOnlyMine });
    if (onlyMentions)
      out.push({ key: 'ment', label: 'Me mencionaron', onRemove: onToggleOnlyMentions });
    if (epicFilter === 'none')
      out.push({ key: 'epic', label: 'Sin épica', onRemove: () => onEpicFilterChange('all') });
    else if (activeEpic)
      out.push({
        key: 'epic',
        label: activeEpic.name,
        color: activeEpic.color,
        onRemove: () => onEpicFilterChange('all'),
      });
    if (search)
      out.push({ key: 'q', label: `“${search}”`, onRemove: () => onSearchChange('') });
    return out;
  }, [
    selectedDepts, selectedUsers, priorityFilter, onlyMine, onlyMentions,
    epicFilter, activeEpic, search, theme,
    onDeptsChange, onUsersChange, onPriorityChange, onToggleOnlyMine,
    onToggleOnlyMentions, onEpicFilterChange, onSearchChange,
  ]);

  const advancedCount =
    selectedDepts.length + selectedUsers.length + (priorityFilter !== 'all' ? 1 : 0);

  /* ── Contenido compartido entre el popover y la hoja móvil ── */
  const advanced = (
    <Stack
      spacing={2.25}
      sx={{ p: 2, width: mdUp ? 320 : 'auto' }}
    >
      <Field label="Área">
        <Autocomplete
          multiple
          size="small"
          options={departments}
          value={selectedDepts}
          onChange={(_, v) => onDeptsChange(v)}
          getOptionLabel={(o) => o.name}
          disableCloseOnSelect
          renderOption={({ key, ...p }, option, { selected }) => (
            <li
              key={option._id}
              {...p}
            >
              <Checkbox
                icon={cbIcon}
                checkedIcon={cbChecked}
                sx={{ mr: 1, p: 0 }}
                checked={selected}
              />
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: option.color, mr: 1 }} />
              {option.name}
            </li>
          )}
          renderTags={(tags, getTagProps) =>
            tags.map((d, i) => (
              <Chip
                key={d._id}
                label={d.name}
                size="small"
                {...getTagProps({ index: i })}
                sx={{ bgcolor: alpha(d.color, 0.12), color: d.color, fontWeight: 700, fontSize: 11 }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedDepts.length ? '' : 'Todas las áreas'}
            />
          )}
        />
      </Field>

      <Field label="Responsable">
        <Autocomplete
          multiple
          size="small"
          options={teamMembers}
          value={selectedUsers}
          onChange={(_, v) => onUsersChange(v)}
          getOptionLabel={(o: any) => fullName(o)}
          disableCloseOnSelect
          renderOption={(p, option: any, { selected }) => (
            <li {...p}>
              <Checkbox
                icon={cbIcon}
                checkedIcon={cbChecked}
                sx={{ mr: 1, p: 0 }}
                checked={selected}
              />
              <Avatar
                src={option.profileImage}
                sx={{ width: 24, height: 24, mr: 1, fontSize: 10 }}
              >
                {option.firstName?.[0]}
              </Avatar>
              <Box minWidth={0}>
                <Typography
                  fontSize={12.5}
                  noWrap
                >
                  {fullName(option)}
                </Typography>
                {option.position && (
                  <Typography
                    fontSize={10}
                    color="text.secondary"
                    noWrap
                  >
                    {option.position}
                  </Typography>
                )}
              </Box>
            </li>
          )}
          renderTags={(tags, getTagProps) =>
            tags.map((u: any, i: number) => (
              <Chip
                key={u.id || u._id}
                size="small"
                {...getTagProps({ index: i })}
                label={fullName(u)}
                avatar={<Avatar src={u.profileImage}>{u.firstName?.[0]}</Avatar>}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedUsers.length ? '' : 'Todo el equipo'}
            />
          )}
        />
      </Field>

      <Field label="Prioridad">
        <Stack
          direction="row"
          spacing={0.5}
          flexWrap="wrap"
          useFlexGap
        >
          <SegChip
            label="Todas"
            active={priorityFilter === 'all'}
            onClick={() => onPriorityChange('all')}
          />
          {priorityEntries(theme).map(([k, c]) => (
            <SegChip
              key={k}
              label={c.label}
              color={c.color}
              icon={<FlagRoundedIcon sx={{ fontSize: '12px !important' }} />}
              active={priorityFilter === k}
              onClick={() => onPriorityChange(priorityFilter === k ? 'all' : k)}
            />
          ))}
        </Stack>
      </Field>

      {!mdUp && (
        <Field label="Vista rápida">
          <Stack
            direction="row"
            spacing={0.75}
          >
            <SegChip
              label="Sólo mías"
              icon={<PersonOutlineRoundedIcon sx={{ fontSize: '13px !important' }} />}
              active={onlyMine}
              onClick={onToggleOnlyMine}
              big
            />
            <SegChip
              label="Me mencionaron"
              icon={<AlternateEmailRoundedIcon sx={{ fontSize: '13px !important' }} />}
              color={theme.palette.warning.main}
              active={onlyMentions}
              onClick={onToggleOnlyMentions}
              big
            />
          </Stack>
        </Field>
      )}

      {epics.length > 0 && (
        <Field label="Épica">
          <Stack
            direction="row"
            spacing={0.5}
            flexWrap="wrap"
            useFlexGap
          >
            <SegChip
              label="Todas"
              active={epicFilter === 'all'}
              onClick={() => onEpicFilterChange('all')}
            />
            {epics.map((e) => (
              <SegChip
                key={e._id}
                label={`${e.name} · ${e.done}/${e.total}`}
                color={e.color}
                active={epicFilter === e._id}
                onClick={() => onEpicFilterChange(epicFilter === e._id ? 'all' : e._id)}
              />
            ))}
            <SegChip
              label="Sin épica"
              active={epicFilter === 'none'}
              onClick={() => onEpicFilterChange(epicFilter === 'none' ? 'all' : 'none')}
            />
          </Stack>
        </Field>
      )}
    </Stack>
  );

  return (
    <Box>
      {/* ── Fila principal ── */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
      >
        <SearchField
          value={search}
          onChange={onSearchChange}
        />

        {/* Los dos filtros de todos los días quedan afuera en escritorio */}
        {mdUp && (
          <>
            <SegChip
              label="Sólo mías"
              icon={<PersonOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
              active={onlyMine}
              onClick={onToggleOnlyMine}
              big
            />
            <SegChip
              label="Me mencionaron"
              icon={<AlternateEmailRoundedIcon sx={{ fontSize: '14px !important' }} />}
              color={theme.palette.warning.main}
              active={onlyMentions}
              onClick={onToggleOnlyMentions}
              big
            />
          </>
        )}

        {/* Avatares de quienes están filtrados: se ve sin abrir nada */}
        {mdUp && selectedUsers.length > 0 && (
          <AvatarGroup
            max={4}
            sx={{
              '& .MuiAvatar-root': { width: 26, height: 26, fontSize: 10, borderWidth: 1.5 },
            }}
          >
            {selectedUsers.map((u: any) => (
              <Tooltip
                key={u.id || u._id}
                title={fullName(u)}
                arrow
              >
                <Avatar src={u.profileImage}>{u.firstName?.[0]}</Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        )}

        <Badge
          color="primary"
          badgeContent={advancedCount}
          overlap="circular"
          sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 15, minWidth: 15, fontWeight: 800 } }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => (mdUp ? setAnchor(e.currentTarget) : setSheet(true))}
            startIcon={<TuneRoundedIcon sx={{ fontSize: 15 }} />}
            aria-label="Abrir filtros"
            sx={{
              height: 38,
              minWidth: { xs: 44, sm: 'auto' },
              px: { xs: 1.25, sm: 1.75 },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
              borderColor: alpha(theme.palette.divider, 0.9),
              '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } },
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              Filtros
            </Box>
          </Button>
        </Badge>
      </Stack>

      {/* ── Fichas de lo que está filtrando ── */}
      {pills.length > 0 && (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.25 }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: 10.5, fontWeight: 700, mr: 0.25 }}
          >
            {shown} de {total}
          </Typography>
          {pills.map((p) => (
            <Chip
              key={p.key}
              size="small"
              label={p.label}
              onDelete={p.onRemove}
              deleteIcon={<CloseRoundedIcon sx={{ fontSize: '13px !important' }} />}
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 1.5,
                bgcolor: alpha(p.color || theme.palette.primary.main, 0.1),
                color: p.color || theme.palette.primary.main,
                '& .MuiChip-deleteIcon': {
                  color: 'inherit',
                  opacity: 0.6,
                  '&:hover': { opacity: 1, color: 'inherit' },
                },
              }}
            />
          ))}
          <Button
            size="small"
            onClick={onClearFilters}
            sx={{ fontSize: 10.5, textTransform: 'none', py: 0, minWidth: 0, fontWeight: 700 }}
          >
            Limpiar
          </Button>
        </Stack>
      )}

      {/* Escritorio: popover anclado al botón */}
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              boxShadow: 'none',
            },
          },
        }}
      >
        {advanced}
        <Divider />
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ px: 2, py: 1 }}
        >
          <Button
            size="small"
            onClick={onClearFilters}
            sx={{ textTransform: 'none', fontSize: 12 }}
          >
            Limpiar todo
          </Button>
          <Button
            size="small"
            variant="contained"
            disableElevation
            onClick={() => setAnchor(null)}
            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: 1.5 }}
          >
            Ver {shown}
          </Button>
        </Stack>
      </Popover>

      {/* Móvil: hoja inferior, se cierra deslizando */}
      <Drawer
        anchor="bottom"
        open={sheet}
        onClose={() => setSheet(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85dvh',
            pb: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <Box sx={{ pt: 1.25, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.18),
            }}
          />
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 2, pb: 0.5 }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={800}
            flex={1}
          >
            Filtros
          </Typography>
          <IconButton
            onClick={() => setSheet(false)}
            aria-label="Cerrar filtros"
            sx={{ width: 44, height: 44 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Box sx={{ overflowY: 'auto' }}>{advanced}</Box>
        <Divider />
        <Stack
          direction="row"
          spacing={1}
          sx={{ p: 2 }}
        >
          <Button
            fullWidth
            onClick={onClearFilters}
            sx={{ height: 46, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Limpiar
          </Button>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => setSheet(false)}
            sx={{ height: 46, borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
          >
            Ver {shown} tarea{shown === 1 ? '' : 's'}
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
});

/* ─── Piezas ──────────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ display: 'block', mb: 0.75, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5 }}
        color="text.secondary"
      >
        {label.toUpperCase()}
      </Typography>
      {children}
    </Box>
  );
}

/** Chip de selección: 100% del estado se lee sin color (texto + peso + borde). */
function SegChip({
  label,
  icon,
  color,
  active,
  onClick,
  big = false,
}: {
  label: string;
  icon?: React.ReactElement;
  color?: string;
  active: boolean;
  onClick: () => void;
  big?: boolean;
}) {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        height: big ? 38 : 28,
        px: big ? 0.75 : 0,
        fontSize: big ? 12 : 11,
        fontWeight: 700,
        borderRadius: 2,
        cursor: 'pointer',
        flexShrink: 0,
        bgcolor: active ? alpha(c, 0.14) : 'transparent',
        color: active ? c : theme.palette.text.secondary,
        border: `1px solid ${alpha(active ? c : theme.palette.divider, active ? 0.5 : 0.9)}`,
        '& .MuiChip-icon': { color: 'inherit' },
        transition: 'background-color .18s, border-color .18s, color .18s',
        '&:hover': { bgcolor: alpha(c, active ? 0.2 : 0.07) },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    />
  );
}

/**
 * El texto se pinta al instante (estado local) y el filtrado del board va en
 * `startTransition`: React prioriza la tecla sobre el repintado de las columnas.
 */
const SearchField = React.memo(function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();
  const [local, setLocal] = React.useState(value);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => setLocal(value), [value]);

  return (
    <TextField
      size="small"
      placeholder="Buscar tarea, SW-0123, tienda…"
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        startTransition(() => onChange(v));
      }}
      fullWidth
      inputProps={{ 'aria-label': 'Buscar tareas', enterKeyHint: 'search' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ fontSize: 18, opacity: 0.45 }} />
          </InputAdornment>
        ),
        endAdornment: local ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setLocal('');
                onChange('');
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: 38,
          borderRadius: 2,
          fontSize: 13,
          bgcolor: alpha(theme.palette.text.primary, 0.03),
          '& fieldset': { borderColor: alpha(theme.palette.divider, 0.8) },
        },
      }}
    />
  );
});
