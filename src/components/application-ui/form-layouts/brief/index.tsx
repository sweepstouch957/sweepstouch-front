import { usePrizes } from '@/hooks/fetching/sweepstakes/usePrizes';
import { prizesClient, type Prize } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ColorLensOutlinedIcon from '@mui/icons-material/ColorLensOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { QuillEditor } from 'src/components/base/styles/quill-editor';
import 'react-quill/dist/quill.snow.css';
import AvatarUploadLogo from '../../upload/avatar/avatar-upload-logo';

/* ===================== Types ===================== */

export type BriefFormValues = {
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  winnersCount: number;
  image?: string;
  hasQr: boolean;
  rules?: string;
  participationMessage: string;
  sweeptakeDescription?: string;
  prizeIds: string[];
  // Branding (optional)
  bannerDesktop?: string;
  bannerMobile?: string;
  mainColor?: string;
  secondaryColor?: string;
};

type Props = {
  mode: 'create' | 'edit';
  initialValues?: Partial<BriefFormValues>;
  onSubmit: (payload: BriefFormValues) => Promise<void> | void;
};

/* ===================== Section header helper ===================== */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      sx={{ mb: 2.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.secondary.main, 0.18)})`,
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          lineHeight={1.2}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/* ===================== Banner Image Upload ===================== */

function BannerUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadCampaignImage(file, 'banners');
      setPreview(url);
      onChange(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="body2"
        color="text.secondary"
        gutterBottom
      >
        {label}
      </Typography>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Paper
        variant="outlined"
        onClick={() => inputRef.current?.click()}
        sx={{
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          borderStyle: 'dashed',
          transition: 'border-color 0.2s, background 0.2s',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
      >
        {uploading ? (
          <CircularProgress size={28} />
        ) : preview ? (
          <>
            <Box
              component="img"
              src={preview}
              alt={label}
              sx={{ width: '100%', height: 110, objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 },
              }}
            >
              <Typography
                color="white"
                variant="caption"
                fontWeight={700}
              >
                Cambiar imagen
              </Typography>
            </Box>
          </>
        ) : (
          <Stack
            alignItems="center"
            gap={0.5}
          >
            <ImageOutlinedIcon
              sx={{ fontSize: 32, color: 'text.disabled' }}
            />
            <Typography
              variant="caption"
              color="text.disabled"
            >
              Click para subir imagen
            </Typography>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

/* ===================== Color Picker Field ===================== */

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  const colorRef = useRef<HTMLInputElement>(null);
  const display = value || '#000000';
  return (
    <TextField
      label={label}
      fullWidth
      value={display}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Tooltip title="Abrir selector de color">
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => colorRef.current?.click()}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    border: '2px solid',
                    borderColor: 'divider',
                    bgcolor: display,
                  }}
                />
                <input
                  ref={colorRef}
                  type="color"
                  value={display}
                  onChange={(e) => onChange(e.target.value)}
                  style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Tooltip>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <ColorLensOutlinedIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
          </InputAdornment>
        ),
      }}
    />
  );
}

/* ===================== Main Form ===================== */

const DEFAULT_MSG =
  'Thank you for participating in the #StoreName!. Your participation code is: #Codigo';

export function BriefFormRHF({ mode, initialValues, onSubmit }: Props) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

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
      winnersCount: 1,
      image: '',
      hasQr: false,
      rules: '',
      participationMessage: DEFAULT_MSG,
      sweeptakeDescription: '',
      prizeIds: [],
      bannerDesktop: '',
      bannerMobile: '',
      mainColor: '',
      secondaryColor: '',
      ...initialValues,
    },
  });

  // ✅ Fix: when initialValues arrive asynchronously (edit mode), reset form
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      reset({
        name: '',
        description: '',
        startDate: null,
        endDate: null,
        winnersCount: 1,
        image: '',
        hasQr: false,
        rules: '',
        participationMessage: DEFAULT_MSG,
        sweeptakeDescription: '',
        prizeIds: [],
        bannerDesktop: '',
        bannerMobile: '',
        mainColor: '',
        secondaryColor: '',
        ...initialValues,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues)]);

  // Snackbar
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: 'success' | 'error' | 'info';
  } | null>(null);

  // Prizes
  const { data: prizes = [], isLoading: loadingPrizes, refetch: refetchPrizes } = usePrizes();
  const selectedIds = watch('prizeIds') || [];

  const selectedPrizeObjects = useMemo(
    () => selectedIds.map((id) => prizes.find((p) => p._id === id)).filter(Boolean) as Prize[],
    [selectedIds, prizes]
  );

  // Participation message
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
    setValue('participationMessage', DEFAULT_MSG, { shouldValidate: true });

  const participationMessage = watch('participationMessage') || '';
  const hasStore = participationMessage.includes('#StoreName');
  const hasCode = participationMessage.includes('#Codigo');

  // Modal Crear Premio
  const [openPrizeDialog, setOpenPrizeDialog] = useState(false);
  const [creatingPrize, setCreatingPrize] = useState(false);
  const [newPrize, setNewPrize] = useState<Prize>({
    name: '',
    description: '',
    value: undefined,
    image: '',
  });
  const [prizeFile, setPrizeFile] = useState<File | null>(null);

  const handleCreatePrize = async () => {
    if (!newPrize.name.trim()) return;
    setCreatingPrize(true);
    try {
      let imageUrl = newPrize.image;
      if (prizeFile) {
        const resp = await uploadCampaignImage(prizeFile, 'prizes');
        imageUrl = resp.url;
      }
      const created = await prizesClient.createPrize({ ...newPrize, image: imageUrl });
      await refetchPrizes();
      const next = Array.from(new Set([...selectedIds, created._id]));
      setValue('prizeIds', next, { shouldValidate: true });
      setOpenPrizeDialog(false);
      setNewPrize({ name: '', description: '', value: undefined, image: '' });
      setPrizeFile(null);
      setSnack({ open: true, msg: '¡Premio creado y seleccionado! ✨', sev: 'success' });
    } catch {
      setSnack({ open: true, msg: 'No se pudo crear el premio', sev: 'error' });
    } finally {
      setCreatingPrize(false);
    }
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

  const sectionPaperSx = {
    p: 2.5,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(8px)',
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          <Stack gap={3}>
            {/* ===== SECCIÓN 1: Información básica ===== */}
            <Paper
              elevation={0}
              sx={sectionPaperSx}
            >
              <SectionHeader
                icon={<InfoOutlinedIcon fontSize="small" />}
                title="Información básica"
                subtitle="Nombre, fechas y configuración del sorteo"
              />
              <Grid
                container
                spacing={2.5}
              >
                {/* Nombre */}
                <Grid
                  item
                  xs={12}
                  md={8}
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

                {/* Cantidad de ganadores */}
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <Controller
                    name="winnersCount"
                    control={control}
                    rules={{
                      required: 'Requerida',
                      min: { value: 1, message: 'Debe ser ≥ 1' },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Cantidad de ganadores"
                        fullWidth
                        inputProps={{ min: 1, step: 1 }}
                        error={!!errors.winnersCount}
                        helperText={errors.winnersCount?.message}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? 1 : Number(raw);
                          field.onChange(Number.isFinite(num) ? num : 1);
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Fecha inicio */}
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
                          onChange={(val) =>
                            field.onChange(val ? new Date(val).toISOString() : null)
                          }
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

                {/* Fecha fin */}
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
                          onChange={(val) =>
                            field.onChange(val ? new Date(val).toISOString() : null)
                          }
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
                        label="Descripción corta"
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="Breve descripción del sorteo..."
                      />
                    )}
                  />
                </Grid>

                {/* QR Switch */}
                <Grid
                  item
                  xs={12}
                >
                  <Controller
                    name="hasQr"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
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
                </Grid>
              </Grid>
            </Paper>

            {/* ===== SECCIÓN 2: Premios ===== */}
            <Paper
              elevation={0}
              sx={sectionPaperSx}
            >
              <SectionHeader
                icon={<EmojiEventsOutlinedIcon fontSize="small" />}
                title="Premios"
                subtitle="Selecciona o crea los premios del sorteo"
              />

              <Controller
                name="prizeIds"
                control={control}
                rules={{ validate: (v) => (v?.length ? true : 'Selecciona al menos un premio') }}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={prizes}
                    loading={loadingPrizes}
                    value={selectedPrizeObjects}
                    getOptionLabel={(option) =>
                      `${option.name}${option.value ? ` — $${option.value}` : ''}`
                    }
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    onChange={(_, newValues) => {
                      const ids = newValues.map((p) => p._id as string);
                      field.onChange(ids);
                      setValue('prizeIds', ids, { shouldValidate: true });
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            {...tagProps}
                            label={
                              <Stack
                                direction="row"
                                alignItems="center"
                                gap={0.5}
                              >
                                <EmojiEventsOutlinedIcon sx={{ fontSize: 14 }} />
                                <span>{option.name}</span>
                                {option.value ? (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ opacity: 0.7 }}
                                  >
                                    ${option.value}
                                  </Typography>
                                ) : null}
                              </Stack>
                            }
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: '8px' }}
                          />
                        );
                      })
                    }
                    renderOption={(props, option) => {
                      const { key, ...rest } = props as any;
                      return (
                        <Box
                          component="li"
                          key={option._id || key}
                          {...rest}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={1.5}
                            width="100%"
                          >
                            {option.image ? (
                              <Box
                                component="img"
                                src={option.image}
                                alt={option.name}
                                sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover' }}
                              />
                            ) : (
                              <EmojiEventsOutlinedIcon
                                sx={{ fontSize: 24, color: 'warning.main', opacity: 0.5 }}
                              />
                            )}
                            <Box flex={1}>
                              <Typography variant="body2">{option.name}</Typography>
                              {option.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option.description}
                                </Typography>
                              )}
                            </Box>
                            {option.value && (
                              <Chip
                                size="small"
                                label={`$${option.value}`}
                                color="success"
                                sx={{ borderRadius: 1 }}
                              />
                            )}
                          </Stack>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar y seleccionar premios *"
                        error={!!errors.prizeIds}
                        helperText={errors.prizeIds ? String(errors.prizeIds.message) : undefined}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingPrizes ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText={
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        px={1}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          No hay premios creados
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() => setOpenPrizeDialog(true)}
                        >
                          Crear premio
                        </Button>
                      </Stack>
                    }
                  />
                )}
              />

              <Box sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => setOpenPrizeDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Crear nuevo premio
                </Button>
              </Box>
            </Paper>

            {/* ===== SECCIÓN 3: Contenido ===== */}
            <Paper
              elevation={0}
              sx={sectionPaperSx}
            >
              <SectionHeader
                icon={<MessageOutlinedIcon fontSize="small" />}
                title="Contenido"
                subtitle="Reglas, mensaje de participación e imagen principal"
              />

              <Grid
                container
                spacing={2.5}
              >
                {/* Imagen principal */}
                <Grid
                  item
                  xs={12}
                >
                  <AvatarUploadLogo
                    label="Imagen principal del sorteo"
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
                      <QuillEditor
                        quillTheme="snow"
                        value={field.value || ''}
                        onChange={(val) => field.onChange(val)}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            [{ color: [] }, { background: [] }],
                            [{ align: [] }],
                            ['link', 'clean'],
                          ],
                        }}
                        style={{ background: 'white', borderRadius: 8 }}
                      />
                    )}
                  />
                </Grid>

                {/* Participation Message */}
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
                        label="Mensaje de participación (SMS/WhatsApp)"
                        fullWidth
                        multiline
                        rows={3}
                        inputRef={participationRef}
                        error={!!errors.participationMessage}
                        helperText={
                          errors.participationMessage?.message ||
                          'Usa los botones de abajo para insertar variables'
                        }
                        InputProps={{
                          sx: { fontFamily: 'monospace', fontSize: 13 },
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Tokens */}
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    Insertar variables:
                  </Typography>
                  <Stack
                    gap={1}
                    flexWrap="wrap"
                    direction={{ xs: 'row', md: 'column' }}
                  >
                    <Tooltip title="Insertar nombre de tienda en la posición del cursor">
                      <Chip
                        label="#StoreName"
                        variant="outlined"
                        color={hasStore ? 'success' : 'default'}
                        icon={hasStore ? <CheckCircleIcon /> : undefined}
                        onClick={() => insertAtCaret('#StoreName')}
                        clickable
                        sx={{ borderRadius: 2 }}
                      />
                    </Tooltip>
                    <Tooltip title="Insertar código de participación en la posición del cursor">
                      <Chip
                        label="#Codigo"
                        variant="outlined"
                        color={hasCode ? 'success' : 'default'}
                        icon={hasCode ? <CheckCircleIcon /> : undefined}
                        onClick={() => insertAtCaret('#Codigo')}
                        clickable
                        sx={{ borderRadius: 2 }}
                      />
                    </Tooltip>
                    <Tooltip title="Restaurar mensaje predeterminado">
                      <Chip
                        label="Restaurar plantilla"
                        onClick={restoreTemplate}
                        color="primary"
                        clickable
                        sx={{ borderRadius: 2 }}
                      />
                    </Tooltip>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* ===== SECCIÓN 4: Branding (opcional) ===== */}
            <Paper
              elevation={0}
              sx={sectionPaperSx}
            >
              <SectionHeader
                icon={<ColorLensOutlinedIcon fontSize="small" />}
                title="Branding"
                subtitle="Banners y colores de la campaña — todos opcionales"
              />

              <Grid
                container
                spacing={2.5}
              >
                {/* colores */}
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Controller
                    name="mainColor"
                    control={control}
                    render={({ field }) => (
                      <ColorPickerField
                        label="Color principal"
                        value={field.value || ''}
                        onChange={(v) => field.onChange(v)}
                      />
                    )}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Controller
                    name="secondaryColor"
                    control={control}
                    render={({ field }) => (
                      <ColorPickerField
                        label="Color secundario"
                        value={field.value || ''}
                        onChange={(v) => field.onChange(v)}
                      />
                    )}
                  />
                </Grid>

                {/* banners */}
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <Controller
                    name="bannerDesktop"
                    control={control}
                    render={({ field }) => (
                      <BannerUpload
                        label="Banner Desktop (recomendado 1920×600)"
                        value={field.value}
                        onChange={(url) => field.onChange(url)}
                      />
                    )}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <Controller
                    name="bannerMobile"
                    control={control}
                    render={({ field }) => (
                      <BannerUpload
                        label="Banner Mobile (recomendado 640×360)"
                        value={field.value}
                        onChange={(url) => field.onChange(url)}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ===== Footer ===== */}
            <Divider />
            <Stack
              direction="row"
              gap={2}
              justifyContent="flex-end"
              alignItems="center"
              pb={1}
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
                    participationMessage: DEFAULT_MSG,
                    sweeptakeDescription: '',
                    prizeIds: [],
                    bannerDesktop: '',
                    bannerMobile: '',
                    mainColor: '',
                    secondaryColor: '',
                  })
                }
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                sx={{ px: 4, borderRadius: 2 }}
              >
                {mode === 'create' ? 'Crear sweepstake' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </LocalizationProvider>

      {/* ===== Dialog: Crear Premio ===== */}
      <Dialog
        open={openPrizeDialog}
        onClose={() => setOpenPrizeDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 800 }}>
          🏆 Crear nuevo premio
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
            gap={2.5}
            sx={{ mt: 1 }}
          >
            <TextField
              label="Nombre del premio *"
              value={newPrize.name}
              onChange={(e) => setNewPrize((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              autoFocus
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
              label="Valor estimado (opcional)"
              value={newPrize.value ?? ''}
              onChange={(e) =>
                setNewPrize((p) => ({ ...p, value: e.target.value ? Number(e.target.value) : undefined }))
              }
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
              >
                Imagen del premio (opcional)
              </Typography>
              <AvatarUploadLogo
                label="Imagen del premio"
                initialUrl={newPrize.image || undefined}
                onSelect={(file) => {
                  setPrizeFile(file || null);
                  if (!file) setNewPrize((p) => ({ ...p, image: '' }));
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenPrizeDialog(false)}
            disabled={creatingPrize}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!newPrize.name.trim() || creatingPrize}
            onClick={handleCreatePrize}
            startIcon={
              creatingPrize ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />
            }
            sx={{ borderRadius: 2 }}
          >
            {creatingPrize ? 'Creando...' : 'Crear premio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Snackbar ===== */}
      <Snackbar
        open={!!snack?.open}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity={snack?.sev || 'info'}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snack?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
