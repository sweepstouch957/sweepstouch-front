'use client';

import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { SupportTicket, Technician } from 'src/services/support.service';
import { tint, tintBorder } from 'src/theme/semantic';
import { AREA_LABEL, areaColor, storeTypeColor, TYPE_LABEL } from './constants';
import { EvidenceField } from './EvidenceField';
import { ReporterField } from './ReporterField';
import { SaveTicketButton } from './SaveTicketButton';
import { rhf, ticketDefaults } from './ticket-form';
import { getAudienceInfo } from './ticket-utils';
import { FormState, StoreOption } from './types';

/**
 * Alta/edición de ticket. El formulario vive acá dentro (react-hook-form): antes su estado
 * estaba en la página y cada tecla repintaba la tabla de tickets entera.
 */
export function TicketDialog({
  open,
  editTicket,
  stores,
  loadingStores,
  storeSearch,
  onStoreInputChange,
  technicians,
  currentUserName,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTicket: SupportTicket | null;
  stores: StoreOption[];
  loadingStores: boolean;
  storeSearch: string;
  onStoreInputChange: (v: string) => void;
  technicians: Technician[];
  currentUserName: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => void;
}) {
  const theme = useTheme();
  // Se monta al abrir: los defaults se calculan una sola vez.
  const { register, control, handleSubmit, setValue } = useForm<FormState>({
    defaultValues: ticketDefaults(editTicket, stores, technicians, currentUserName),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit(onSubmit) }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editTicket ? `Editar ${editTicket.identifier}` : 'Nuevo Ticket'}
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Título *"
            {...rhf(register, 'title')}
            fullWidth
            size="small"
            autoFocus
          />

          <TextField
            label="Descripción"
            {...rhf(register, 'description')}
            fullWidth
            size="small"
            multiline
            rows={3}
          />

          {/* Area + Type */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <Controller
              control={control}
              name="area"
              render={({ field }) => (
                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>Área / Departamento *</InputLabel>
                  <Select
                    {...field}
                    label="Área / Departamento *"
                  >
                    {Object.entries(AREA_LABEL).map(([k, v]) => (
                      <MenuItem
                        key={k}
                        value={k}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Box
                            sx={{
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              bgcolor: areaColor(theme, k),
                              flexShrink: 0,
                            }}
                          />
                          <span>{v}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>Tipo de problema</InputLabel>
                  <Select
                    {...field}
                    label="Tipo de problema"
                  >
                    {Object.entries(TYPE_LABEL).map(([k, v]) => (
                      <MenuItem
                        key={k}
                        value={k}
                      >
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>

          {/* Priority + Status */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    {...field}
                    label="Prioridad"
                  >
                    <MenuItem value="low">Bajo</MenuItem>
                    <MenuItem value="medium">Medio</MenuItem>
                    <MenuItem value="high">Alto</MenuItem>
                    <MenuItem value="critical">Crítico</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            {editTicket && (
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <FormControl
                    size="small"
                    fullWidth
                  >
                    <InputLabel>Estado</InputLabel>
                    <Select
                      {...field}
                      label="Estado"
                    >
                      <MenuItem value="open">Abierto</MenuItem>
                      <MenuItem value="in_progress">En Progreso</MenuItem>
                      <MenuItem value="resolved">Resuelto</MenuItem>
                      <MenuItem value="closed">Cerrado</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            )}
          </Stack>

          {/* Store autocomplete */}
          <Controller
            control={control}
            name="store"
            render={({ field }) => (
              <Autocomplete
                options={stores}
                value={field.value}
                onChange={(_, val) => field.onChange(val)}
                onInputChange={(_, val) => onStoreInputChange(val)}
                filterOptions={(x) => x}
                loading={loadingStores}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a._id === b._id}
                renderOption={(props, o) => {
                  const color = storeTypeColor(theme, o.type);
                  const aud = getAudienceInfo(o.customerCount);
                  return (
                    <Box
                      component="li"
                      {...props}
                      sx={{ gap: 1.5, alignItems: 'flex-start !important', py: '8px !important' }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: 13,
                          fontWeight: 700,
                          bgcolor: alpha(color, 0.15),
                          color,
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        {o.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box
                        minWidth={0}
                        flex={1}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                            flex={1}
                          >
                            {o.name}
                          </Typography>
                          {aud && (
                            <Chip
                              label={aud.label}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 10,
                                fontWeight: 700,
                                flexShrink: 0,
                                bgcolor: tint(theme, aud.role),
                                color: `${aud.role}.main`,
                                border: `1px solid ${tintBorder(theme, aud.role, 0.3)}`,
                              }}
                            />
                          )}
                        </Stack>
                        {o.address && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {o.address}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tienda (opcional)"
                    size="small"
                    placeholder="Escribe para buscar..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStores ? (
                            <CircularProgress
                              size={14}
                              color="inherit"
                            />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText={storeSearch ? 'Sin resultados' : 'Escribe para buscar una tienda...'}
              />
            )}
          />

          {/* Assignee (technician) — notification on assign — only show when editing */}
          {editTicket && (
            <Controller
              control={control}
              name="assignee"
              render={({ field }) => (
                <Autocomplete
                  options={technicians}
                  value={field.value}
                  onChange={(_, val) => field.onChange(val)}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a._id === b._id}
                  renderOption={(props, o) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{ gap: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          bgcolor: 'secondary.main',
                          flexShrink: 0,
                        }}
                      >
                        {o.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                        >
                          {o.name}
                        </Typography>
                        {o.email && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {o.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Asignado a"
                      size="small"
                      placeholder="Buscar técnico..."
                      helperText="El técnico asignado recibirá una notificación automática"
                    />
                  )}
                  noOptionsText="Sin técnicos registrados"
                />
              )}
            />
          )}

          <ReporterField
            control={control}
            register={register}
            setValue={setValue}
            currentUserName={currentUserName}
            theme={theme}
          />

          <TextField
            label="Notas internas"
            {...rhf(register, 'notes')}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Notas para el equipo (no visibles al cliente)..."
            helperText="Solo visible para técnicos y administradores"
          />

          {/* ── Evidence section ── */}
          <Divider />
          <EvidenceField
            control={control}
            setValue={setValue}
          />
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Cancelar
        </Button>
        <SaveTicketButton
          control={control}
          isSaving={isSaving}
          isEdit={!!editTicket}
        />
      </DialogActions>
    </Dialog>
  );
}
