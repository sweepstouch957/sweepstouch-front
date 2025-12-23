import { usePrizes } from '@/hooks/fetching/sweepstakes/usePrizes';
import { prizesClient, type Prize } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import LexicalRHFEditor from '../../editors/LexicalRHFEditor';
import AvatarUploadLogo from '../../upload/avatar/avatar-upload-logo';

type BriefFormValues = {
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  image?: string;
  hasQr: boolean;
  rules?: string;
  participationMessage: string;
  sweeptakeDescription?: string;
  prizeIds: string[];
};

type Props = {
  mode: 'create' | 'edit';
  initialValues?: Partial<BriefFormValues>;
  onSubmit: (payload: BriefFormValues) => Promise<void> | void;
};

export function BriefFormRHF({ mode, initialValues, onSubmit }: Props) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const defaultMsg =
    'Thank you for participating in the #StoreName For a ...!. Your participation code is: #Codigo';

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BriefFormValues>({
    defaultValues: {
      name: '',
      description: '',
      startDate: null,
      endDate: null,
      image: initialValues?.image || '',
      hasQr: false,
      rules: '',
      participationMessage: defaultMsg,
      sweeptakeDescription: '',
      prizeIds: [],
      ...initialValues,
    },
  });

  // Snackbar UI
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: 'success' | 'error' | 'info';
  } | null>(null);

  // Premios
  const { data: prizes = [], isLoading: loadingPrizes } = usePrizes();

  // Participation placeholders
  const participationRef = useRef<HTMLInputElement | null>(null);
  const insertAtCaret = (token: string) => {
    const input = participationRef.current;
    const msg = getValues('participationMessage') || '';
    if (!input) {
      setValue('participationMessage', `${msg}${token}`, { shouldValidate: true });
      return;
    }
    const start = input.selectionStart ?? msg.length;
    const end = input.selectionEnd ?? msg.length;
    const next = msg.slice(0, start) + token + msg.slice(end);
    setValue('participationMessage', next, { shouldValidate: true });
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + token.length, start + token.length);
    });
  };
  const restoreTemplate = () =>
    setValue('participationMessage', defaultMsg, { shouldValidate: true });

  const participationMessage = watch('participationMessage') || '';
  const hasStore = participationMessage.includes('#StoreName');
  const hasCode = participationMessage.includes('#Codigo');

  // Modal Crear Premio
  const [openPrizeDialog, setOpenPrizeDialog] = useState(false);
  const [newPrize, setNewPrize] = useState<Prize>({
    name: '',
    description: '',
    value: undefined,
    image: '',
  });
  const [prizeFile, setPrizeFile] = useState<File | null>(null);

  const selectedIds = watch('prizeIds') || [];
  const missingPrizeSelected = useMemo(() => {
    if (!selectedIds.length) return false;
    const ids = new Set(prizes.map((p) => p._id));
    return selectedIds.some((id) => !ids.has(id));
  }, [selectedIds, prizes]);

  const handleCreatePrize = async () => {
    try {
      let imageUrl = newPrize.image;
      if (prizeFile) {
        const resp = await uploadCampaignImage(prizeFile, 'prizes');
        imageUrl = resp.url;
      }
      const created = await prizesClient.createPrize({ ...newPrize, image: imageUrl });
      const next = Array.from(new Set([...selectedIds, created._id]));
      setValue('prizeIds', next, { shouldValidate: true });
      setOpenPrizeDialog(false);
      setNewPrize({ name: '', description: '', value: undefined, image: '' });
      setPrizeFile(null);
      setSnack({ open: true, msg: 'Premio creado ✨', sev: 'success' });
    } catch {
      setSnack({ open: true, msg: 'No se pudo crear el premio', sev: 'error' });
    }
  };

  // Select premios
  const handlePrizeChange = (e: SelectChangeEvent<string[]>) => {
    setValue('prizeIds', (e.target.value as unknown as string[]) || [], { shouldValidate: true });
  };
  const handleRemovePrize = (id: string) => {
    const next = (getValues('prizeIds') || []).filter((x) => x !== id);
    setValue('prizeIds', next, { shouldValidate: true });
  };

  // Submit
  const handleFormSubmit = async (values: BriefFormValues) => {
    if (!values.name?.trim()) return;
    if (!values.startDate || !values.endDate) return;
    if (new Date(values.endDate) < new Date(values.startDate)) return;
    if (!values.prizeIds?.length) return;
    if (!hasStore || !hasCode) return;

    const maybeFileList = (values as any).image as unknown as FileList | string | undefined;
    let finalImageUrl = typeof maybeFileList === 'string' ? maybeFileList : '';

    if (maybeFileList && typeof maybeFileList !== 'string') {
      const file = (maybeFileList as FileList)[0];
      if (file) {
        const resp = await uploadCampaignImage(file, 'campaigns');
        finalImageUrl = resp.url;
      }
    }

    const payload: BriefFormValues = {
      ...values,
      image: finalImageUrl || (initialValues?.image ?? ''),
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
    };

    await onSubmit(payload);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Stack gap={2}>
          <Grid
            container
            spacing={2}
          >
            {/* Nombre */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre del sorteo"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            {/* Premios + Crear */}
            <Grid
              item
              xs={12}
              md={5}
            >
              <Controller
                name="prizeIds"
                control={control}
                rules={{ validate: (v) => (v?.length ? true : 'Selecciona al menos un premio') }}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    error={!!errors.prizeIds}
                  >
                    <InputLabel id="prize-label">Premios (obligatorio)</InputLabel>
                    <Select
                      labelId="prize-label"
                      label="Premios (obligatorio)"
                      multiple
                      value={field.value}
                      onChange={(e) => {
                        handlePrizeChange(e);
                        field.onChange(e.target.value as unknown as string[]);
                      }}
                      renderValue={(selected) => (
                        <Stack
                          direction="row"
                          gap={0.5}
                          flexWrap="wrap"
                        >
                          {(selected as string[]).map((id) => {
                            const p = prizes.find((x) => x._id === id);
                            return (
                              <Chip
                                key={id}
                                label={p?.name || id}
                                size="small"
                                onDelete={() => handleRemovePrize(id)}
                              />
                            );
                          })}
                        </Stack>
                      )}
                      disabled={loadingPrizes}
                    >
                      {(prizes || []).map((p) => (
                        <MenuItem
                          key={p._id}
                          value={p._id}
                        >
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.prizeIds && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {String(errors.prizeIds.message)}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md="auto"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Tooltip
                title={
                  missingPrizeSelected
                    ? 'Algún premio seleccionado no está en la lista. Crea uno nuevo.'
                    : 'Crear premio'
                }
              >
                <IconButton
                  color={missingPrizeSelected ? 'warning' : 'primary'}
                  onClick={() => setOpenPrizeDialog(true)}
                  aria-label="Crear premio"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Grid>

            {/* Descripción */}
            <Grid
              item
              xs={12}
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}
              />
            </Grid>

            {/* Fechas */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Controller
                name="startDate"
                control={control}
                rules={{ required: 'Requerida' }}
                render={({ field }) => {
                  const valueDate = field.value ? new Date(field.value) : null;
                  const DateCmp = isSmall ? MobileDatePicker : DatePicker;
                  return (
                    <DateCmp
                      label="Fecha de inicio"
                      value={valueDate}
                      onChange={(val) => field.onChange(val ? new Date(val).toISOString() : null)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startDate,
                          helperText: errors.startDate?.message,
                        },
                      }}
                    />
                  );
                }}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <Controller
                name="endDate"
                control={control}
                rules={{
                  required: 'Requerida',
                  validate: (v) => {
                    const s = getValues('startDate');
                    if (s && v && new Date(v) < new Date(s))
                      return 'La fecha fin debe ser ≥ inicio';
                    return true;
                  },
                }}
                render={({ field }) => {
                  const valueDate = field.value ? new Date(field.value) : null;
                  const DateCmp = isSmall ? MobileDatePicker : DatePicker;
                  return (
                    <DateCmp
                      label="Fecha de fin"
                      value={valueDate}
                      onChange={(val) => field.onChange(val ? new Date(val).toISOString() : null)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.endDate,
                          helperText: errors.endDate?.message,
                        },
                      }}
                    />
                  );
                }}
              />
            </Grid>

            {/* Imagen + QR bonito */}
            <Grid
              item
              xs={12}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={2}
                alignItems={{ sm: 'center' }}
              >
                <AvatarUploadLogo
                  label="Imagen de Sweepstake"
                  initialUrl={initialValues?.image}
                  onSelect={(file) => {
                    if (file) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      setValue('image', dt.files as any, { shouldValidate: true });
                    } else {
                      setValue('image', '', { shouldValidate: true });
                    }
                  }}
                />
                <Controller
                  name="hasQr"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      sx={{ ml: { sm: 'auto' } }}
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="¿Tiene QR en Ticket?"
                    />
                  )}
                />
              </Stack>
            </Grid>

            {/* Reglas */}
            <Grid
              item
              xs={12}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 0.5 }}
              >
                Reglas del sorteo
              </Typography>
              <Controller
                name="rules"
                control={control}
                render={({ field }) => (
                  <LexicalRHFEditor
                    value={field.value || ''}
                    onChange={(html) => field.onChange(html)}
                    placeholder="Escribe las reglas…"
                    minHeight={180}
                  />
                )}
              />
            </Grid>

            {/* Participation Message + chips */}
            <Grid
              item
              xs={12}
              md={8}
            >
              <Controller
                name="participationMessage"
                control={control}
                rules={{
                  validate: (v) =>
                    (v?.includes('#StoreName') && v?.includes('#Codigo')) ||
                    'Debe incluir #StoreName y #Codigo',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mensaje de participación"
                    fullWidth
                    inputRef={participationRef}
                    error={!!errors.participationMessage}
                    helperText={
                      errors.participationMessage?.message || 'Debe incluir #StoreName y #Codigo'
                    }
                  />
                )}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
            >
              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                <Tooltip title="Insertar #StoreName en el cursor">
                  <Chip
                    label="#StoreName"
                    variant="outlined"
                    onClick={() => insertAtCaret('#StoreName')}
                  />
                </Tooltip>
                <Tooltip title="Insertar #Codigo en el cursor">
                  <Chip
                    label="#Codigo"
                    variant="outlined"
                    onClick={() => insertAtCaret('#Codigo')}
                  />
                </Tooltip>
                <Tooltip title="Restaurar plantilla base">
                  <Chip
                    label="Plantilla base"
                    onClick={restoreTemplate}
                    color="primary"
                  />
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>

          {/* Footer */}
          <Stack
            direction="row"
            gap={2}
            justifyContent="flex-end"
            alignItems="center"
          >
            <Button
              variant="outlined"
              onClick={() =>
                reset({
                  name: '',
                  description: '',
                  startDate: null,
                  endDate: null,
                  image: '',
                  hasQr: false,
                  rules: '',
                  participationMessage: defaultMsg,
                  sweeptakeDescription: '',
                  prizeIds: [],
                })
              }
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={<CheckCircleIcon />}
            >
              {mode === 'create' ? 'Crear sweepstake' : 'Guardar cambios'}
            </Button>
          </Stack>
        </Stack>
      </form>

      {/* Modal Crear Premio */}
      <Dialog
        open={openPrizeDialog}
        onClose={() => setOpenPrizeDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6 }}>
          Crear premio
          <IconButton
            onClick={() => setOpenPrizeDialog(false)}
            size="small"
            sx={{ position: 'absolute', right: 8, top: 8 }}
            aria-label="Cerrar"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack
            gap={2}
            sx={{ mt: 1 }}
          >
            <TextField
              label="Nombre"
              value={newPrize.name}
              onChange={(e) => setNewPrize((p) => ({ ...p, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={newPrize.description || ''}
              onChange={(e) => setNewPrize((p) => ({ ...p, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              type="number"
              label="Valor (opcional)"
              value={newPrize.value ?? ''}
              onChange={(e) => setNewPrize((p) => ({ ...p, value: Number(e.target.value) }))}
              fullWidth
            />
            <AvatarUploadLogo
              label="Imagen del premio"
              initialUrl={newPrize.image || undefined}
              onSelect={(file) => {
                setPrizeFile(file || null);
                if (!file) setNewPrize((p) => ({ ...p, image: '' }));
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrizeDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!newPrize.name}
            onClick={handleCreatePrize}
            startIcon={<AddIcon />}
          >
            Crear premio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snack?.open}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity={snack?.sev || 'info'}
          variant="filled"
        >
          {snack?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
