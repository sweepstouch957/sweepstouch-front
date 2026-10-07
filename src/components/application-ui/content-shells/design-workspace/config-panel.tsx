'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { WEEKDAYS, WEEKDAY_LABEL } from './constants';
import { uid, useDesignStore } from './store';
import type { DesignStore, WeekDay } from './types';
import { dateTime } from './ui-helpers';
import { useDesignStores } from './use-design-data';

/**
 * Configuración del módulo — sólo admins.
 *
 * Dos apartados: el equipo de diseño (alimenta el selector "Diseñador asignado"
 * y el dashboard) y la automatización de Modalidad circular.
 */

/* ── Equipo de diseño ──────────────────────────────────────────────────── */

function DesignersSection(): React.JSX.Element {
  const designers = useDesignStore((s) => s.designers);
  const addDesigner = useDesignStore((s) => s.addDesigner);
  const removeDesigner = useDesignStore((s) => s.removeDesigner);
  const cards = useDesignStore((s) => s.cards);

  const [name, setName] = React.useState('');

  const submit = () => {
    if (!name.trim()) return;
    addDesigner(name);
    setName('');
  };

  return (
    <Card>
      <CardContent>
        <Typography
          variant="h6"
          fontWeight={700}
        >
          Diseñadores
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          El equipo que aparece en &quot;Diseñador asignado&quot; y en el dashboard.
        </Typography>

        <List dense>
          {designers.map((d) => {
            const assigned = cards.filter((c) => c.designerId === d.id).length;
            return (
              <ListItem
                key={d.id}
                divider
                secondaryAction={
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => removeDesigner(d.id)}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32 }}>{d.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={d.name}
                  secondary={`${assigned} tarjeta(s) asignadas`}
                />
              </ListItem>
            );
          })}
          {designers.length === 0 && (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ py: 1 }}
            >
              No hay diseñadores cargados.
            </Typography>
          )}
        </List>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2 }}
        >
          <TextField
            size="small"
            label="Nombre del diseñador"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            sx={{ maxWidth: 280 }}
          />
          <Button
            variant="contained"
            startIcon={<PersonRoundedIcon />}
            onClick={submit}
            disabled={!name.trim()}
          >
            Agregar
          </Button>
        </Stack>

        <Alert
          severity="info"
          sx={{ mt: 2 }}
        >
          Quitar a alguien del equipo no borra sus tarjetas ni sus métricas: el historial sigue
          siendo válido.
        </Alert>
      </CardContent>
    </Card>
  );
}

/* ── Modalidad circular ────────────────────────────────────────────────── */

function CircularSection(): React.JSX.Element {
  const circular = useDesignStore((s) => s.circular);
  const setCircular = useDesignStore((s) => s.setCircular);
  const upsertGroup = useDesignStore((s) => s.upsertGroup);
  const removeGroup = useDesignStore((s) => s.removeGroup);
  const runCircularWeek = useDesignStore((s) => s.runCircularWeek);
  const { stores, loadingStores } = useDesignStores();

  const [toast, setToast] = React.useState('');

  const totalStores = new Set(circular.groups.flatMap((g) => g.storeIds)).size;

  const run = () => {
    const n = runCircularWeek(stores);
    setToast(
      n > 0
        ? `${n} tarjeta(s) de Modalidad circular creadas en "Nuevo requerimiento"`
        : 'No hay tiendas configuradas'
    );
  };

  return (
    <>
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Automatización de Modalidad circular
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {totalStores} tienda(s) configuradas · última corrida:{' '}
                {circular.lastRunAt ? dateTime(circular.lastRunAt) : 'nunca'}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={circular.enabled}
                    onChange={(e) => setCircular({ enabled: e.target.checked })}
                  />
                }
                label="Activa"
              />
              <TextField
                select
                size="small"
                label="Día global"
                value={circular.defaultDay}
                onChange={(e) => setCircular({ defaultDay: Number(e.target.value) as WeekDay })}
                sx={{ minWidth: 150 }}
              >
                {WEEKDAYS.map((d) => (
                  <MenuItem
                    key={d}
                    value={d}
                  >
                    {WEEKDAY_LABEL[d]}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                startIcon={<PlayArrowRoundedIcon />}
                onClick={run}
                disabled={!circular.enabled || loadingStores}
              >
                Simular ejecución semanal
              </Button>
            </Stack>
          </Stack>

          <Alert
            severity="info"
            sx={{ mt: 2 }}
          >
            El día global aplica a las tiendas que no estén en ningún grupo; cada grupo puede tener
            el suyo. En fase 2 esto lo dispara un cron — acá se simula con el botón.
          </Alert>
        </CardContent>
      </Card>

      {circular.groups.map((group) => (
        <Card key={group.id}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <TextField
                size="small"
                label="Grupo"
                value={group.name}
                onChange={(e) => upsertGroup({ ...group, name: e.target.value })}
                sx={{ maxWidth: 200 }}
              />
              <TextField
                select
                size="small"
                label="Día de creación"
                value={group.day}
                onChange={(e) => upsertGroup({ ...group, day: Number(e.target.value) as WeekDay })}
                sx={{ minWidth: 150 }}
              >
                {WEEKDAYS.map((d) => (
                  <MenuItem
                    key={d}
                    value={d}
                  >
                    {WEEKDAY_LABEL[d]}
                  </MenuItem>
                ))}
              </TextField>
              <Chip
                size="small"
                label={`${group.storeIds.length} tienda(s)`}
              />
              <Box sx={{ flex: 1 }} />
              <IconButton
                color="error"
                onClick={() => removeGroup(group.id)}
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Stack>

            <Autocomplete
              multiple
              size="small"
              options={stores}
              loading={loadingStores}
              getOptionLabel={(s: DesignStore) => s.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={stores.filter((s) => group.storeIds.includes(s.id))}
              onChange={(_, value) => upsertGroup({ ...group, storeIds: value.map((s) => s.id) })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tiendas del grupo"
                  placeholder="Agregar tienda"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStores ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </CardContent>
        </Card>
      ))}

      <Box>
        <Button
          startIcon={<AddRoundedIcon />}
          onClick={() =>
            upsertGroup({
              id: uid(),
              name: `Grupo ${String.fromCharCode(65 + circular.groups.length)}`,
              day: circular.defaultDay,
              storeIds: [],
            })
          }
        >
          Agregar grupo
        </Button>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

export function ConfigPanel(): React.JSX.Element {
  return (
    <Stack spacing={2.5}>
      <DesignersSection />
      <Divider textAlign="left">
        <Typography
          variant="overline"
          color="text.secondary"
        >
          Modalidad circular
        </Typography>
      </Divider>
      <CircularSection />
    </Stack>
  );
}

export default ConfigPanel;
