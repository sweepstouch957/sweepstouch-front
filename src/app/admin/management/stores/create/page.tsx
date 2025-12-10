'use client';

import { useCreateStoreState } from '@/components/admin/stores/create/useCreateStoreState';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { createTheme, styled, ThemeProvider, useTheme } from '@mui/material/styles';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import * as React from 'react';


const pinkTheme = createTheme({
  palette: {
    primary: { main: '#FF008A' },
    secondary: { main: '#FF4D9E' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none' },
      },
    },
  },
});

const steps = ['Información General', 'Equipos y Materiales'];

const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

function UploadDrop({
  label,
  accept,
  onChange,
  file,
}: {
  label: string;
  accept: string;
  onChange: (f: File | null) => void;
  file: File | null;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const open = () => inputRef.current?.click();

  return (
    <Box
      onClick={open}
      sx={{
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: 'pointer',
      }}
    >
      <Typography
        variant="body2"
        sx={{ mb: 1 }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          p: { xs: 2, md: 4 },
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <div style={{ fontSize: 20 }}>☁️</div>
        <div>Haz clic para seleccionar un archivo</div>
        <Typography variant="caption">
          {accept.includes('image') ? 'PNG, JPG, JPEG, GIF o WEBP' : 'PDF, PNG, JPG O JPEG'}
        </Typography>
      </Box>

      {file && (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          {file.name}
        </Typography>
      )}

      <input
        hidden
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </Box>
  );
}

function LogoPreview() {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        height: { xs: 150, md: 200 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'text.secondary',
        background:
          'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 10px, transparent 10px, transparent 20px)',
      }}
    >
      <Box>
        <div
          style={{
            fontSize: 36,
            lineHeight: 1,
          }}
        >
          🏪
        </div>

        <Typography
          variant="body2"
          sx={{ mt: 1, fontWeight: 600 }}
        >
          Logo de la Tienda (preview)
        </Typography>

        <Typography variant="caption">
          El logo real se cargará desde el backend posteriormente
        </Typography>
      </Box>
    </Box>
  );
}

export default function CreateStoreStepperPage(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { state, setState } = useCreateStoreState();

  const { data: swRaw, isLoading: swLoading } = useSweepstakes();

  const sweepstakes = React.useMemo(() => {
    const arr: any[] = Array.isArray((swRaw as any)?.data)
      ? (swRaw as any).data
      : Array.isArray(swRaw)
        ? (swRaw as any)
        : [];

    return arr.map((x: any) => ({
      id: String(x.id ?? x._id ?? x.uuid ?? x.sweepstakeId ?? x.sorteoId ?? Math.random()),
      name: String(x.name ?? x.title ?? x.nombre ?? 'Sorteo'),
    }));
  }, [swRaw]);

  const [touched, setTouched] = React.useState(false);

  const isValid = Boolean(
    state.storeName &&
    state.storeName.trim() &&
    state.address &&
    state.address.trim() &&
    state.zipCode &&
    state.zipCode.trim() &&
    state.phone &&
    state.phone.trim() &&
    state.startDate &&
    state.startDate.trim() &&
    state.sweepstakeId &&
    state.sweepstakeId !== ''
  );

  const next = () => {
    setTouched(true);
    if (!isValid) return;
    router.push('/admin/management/stores/create/step-2');
  };

  const err = (cond: boolean) => (touched && !cond ? true : false);
  const helper = (cond: boolean) => (touched && !cond ? 'Campo obligatorio' : '');

  return (
    <ThemeProvider theme={pinkTheme}>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, md: 3 } }}
      >
        <Box sx={{ mb: '30px' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button
              onClick={() => router.push('/admin/management/stores')}
              sx={{
                minWidth: 0,
                p: 0.5,
                color: 'text.primary',
                '&:hover': { backgroundColor: 'transparent', color: 'primary.main' },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </Button>

            <Typography
              variant="h5"
              sx={{
                fontSize: '26px',
                fontWeight: 600,
              }}
            >
              Create Store
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: '20px',
              color: 'text.secondary',
              mt: 0.5,
            }}
          >
            Registra una nueva tienda
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stepper
              activeStep={0}
              connector={<ColorConnector />}
              sx={{
                mb: { xs: 2, md: 3 },
                px: { xs: 0, md: 1 },
                '& .MuiStep-root': { px: { xs: 0.5, md: 2 } },
                '& .MuiStepLabel-label': { fontSize: { xs: 13, md: 14 } },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600 }}
              >
                Información General de la Tienda
              </Typography>

              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    label="Nombre de la Tienda *"
                    fullWidth
                    value={state.storeName ?? ''}
                    error={err(Boolean(state.storeName))}
                    helperText={helper(Boolean(state.storeName))}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        storeName: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    label="Email (opcional)"
                    fullWidth
                    placeholder="storeName@sweeptouch.com"
                    value={state.email ?? ''}
                    onChange={(e) => setState((s: any) => ({ ...s, email: e.target.value }))}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={8}
                >
                  <TextField
                    label="Dirección Completa *"
                    fullWidth
                    helperText={
                      helper(Boolean(state.address)) ||
                      'La dirección se usará para calcular latitud y longitud'
                    }
                    error={err(Boolean(state.address))}
                    value={state.address ?? ''}
                    onChange={(e) => setState((s: any) => ({ ...s, address: e.target.value }))}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <TextField
                    label="Código Postal *"
                    fullWidth
                    error={err(Boolean(state.zipCode))}
                    helperText={helper(Boolean(state.zipCode))}
                    value={state.zipCode ?? ''}
                    onChange={(e) => setState((s: any) => ({ ...s, zipCode: e.target.value }))}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    label="Teléfono *"
                    fullWidth
                    error={err(Boolean(state.phone))}
                    helperText={helper(Boolean(state.phone))}
                    value={state.phone ?? ''}
                    onChange={(e) => setState((s: any) => ({ ...s, phone: e.target.value }))}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={es}
                  >
                    <DatePicker
                      label="Fecha Inicio de Contrato *"
                      value={state.startDate ? new Date(state.startDate) : null}
                      onChange={(date) => {
                        const val =
                          date instanceof Date && !isNaN(date.getTime())
                            ? date.toISOString().slice(0, 10)
                            : '';
                        setState((s) => ({ ...s, startDate: val }));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: isMobile ? 'small' : 'medium',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    select
                    label="Membresía *"
                    fullWidth
                    error={err(Boolean(state.membership))}
                    helperText={helper(Boolean(state.membership))}
                    value={state.membership ?? ''}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        membership: e.target.value as any,
                      }))
                    }
                  >
                    <MenuItem value="Semanal">Semanal</MenuItem>
                    <MenuItem value="Mensual">Mensual</MenuItem>
                  </TextField>
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    select
                    label="Sorteo Activo *"
                    fullWidth
                    error={err(Boolean(state.sweepstakeId))}
                    helperText={helper(Boolean(state.sweepstakeId))}
                    value={state.sweepstakeId ?? ''}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        sweepstakeId: e.target.value,
                      }))
                    }
                  >
                    {swLoading && <MenuItem disabled>Cargando sorteos…</MenuItem>}

                    {!swLoading && sweepstakes.length === 0 && (
                      <MenuItem disabled>No hay sorteos</MenuItem>
                    )}

                    {sweepstakes.map((s: any) => (
                      <MenuItem
                        key={s.id}
                        value={s.id}
                      >
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Logo de la Tienda
                  </Typography>

                  <LogoPreview />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <UploadDrop
                    label="Contrato (PDF o Imagen)"
                    accept="application/pdf,image/*"
                    file={state.contractFile ?? null}
                    onChange={(file) => {
                      if (!file) {
                        setState((s: any) => ({
                          ...s,
                          contractFile: null,
                          contractFileB64: null,
                        }));
                        return;
                      }

                      const reader = new FileReader();

                      reader.onload = () => {
                        const res = (reader.result as string) || '';
                        setState((s: any) => ({
                          ...s,
                          contractFile: file,
                          contractFileB64: res.split(',')[1],
                        }));
                      };

                      reader.readAsDataURL(file);
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: { xs: 2, md: 3 } }} />

              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600 }}
              >
                Información Adicional
              </Typography>

              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    label="Sitio Web (opcional)"
                    fullWidth
                    value={state.website ?? ''}
                    onChange={(e) => setState((s: any) => ({ ...s, website: e.target.value }))}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    label="Facebook (opcional)"
                    fullWidth
                    value={state.facebook ?? ''}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        facebook: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <TextField
                    label="Instagram (opcional)"
                    fullWidth
                    value={state.instagram ?? ''}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        instagram: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                >
                  <TextField
                    label="Descripción (opcional)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={state.description ?? ''}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        description: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                >
                  <TextField
                    label="Información Adicional (opcional)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={state.extraInfo ?? ''}
                    onChange={(e) =>
                      setState((s: any) => ({
                        ...s,
                        extraInfo: e.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: { xs: 2, md: 3 },
                }}
              >
                <Button
                  variant="outlined"
                  disabled
                >
                  Atrás
                </Button>

                <Button
                  variant="contained"
                  onClick={next}
                  disabled={!isValid}
                >
                  Siguiente
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}
