
'use client';

import { generateImage } from '@/services/ai.service';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ColorLensOutlinedIcon from '@mui/icons-material/ColorLensOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import PageHeading from '@/components/base/page-heading';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useCustomization } from '@/hooks/use-customization';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { uploadCampaignImage } from '@/services/upload.service';
import { prizesClient, type Prize } from '@/services/sweepstakes.service';
import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';

const DEFAULT_MAIN_COLOR = '#D4AF37';
const DEFAULT_SECONDARY_COLOR = '#C1121F';

type PrizeForm = {
  name: string;
  description?: string;
  value?: number | string;
  image?: string;
  details?: string;
  mainColor?: string;
  secondaryColor?: string;
};

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
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
                onClick={() => colorRef.current?.click()}
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
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
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
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

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const customization = useCustomization();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [generatedImagePreview, setGeneratedImagePreview] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' | 'info' }>({ open: false, msg: '', sev: 'success' });

  const { control, getValues, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PrizeForm>({
    defaultValues: {
      name: '',
      description: '',
      value: undefined,
      image: '',
      details: '',
      mainColor: DEFAULT_MAIN_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: PrizeForm) => {
      let imageUrl = values.image || '';
      if (file) {
        const resp = await uploadCampaignImage(file, 'prizes');
        imageUrl = resp.url;
      }
      const payload: Prize = {
        name: values.name.trim(),
        description: values.description || '',
        value: values.value === '' ? undefined : (typeof values.value === 'string' ? Number(values.value) : values.value),
        image: imageUrl || undefined,
        details: values.details || ''
      };
      const created = await prizesClient.createPrize(payload);
      return created;
    },
    onSuccess: () => {
      setSnack({ open: true, msg: t('Prize created successfully'), sev: 'success' });
      router.push('/admin/management/prizes');
    },
    onError: (e: any) => {
      setSnack({ open: true, msg: e?.message || t('Error creating prize'), sev: 'error' });
    }
  });

  const onSubmit = (values: PrizeForm) => createMutation.mutate(values);

  const getExistingPrizeImageReferences = async () => {
    try {
      const existingPrizes = await prizesClient.getPrizes();
      return existingPrizes
        .filter((prize) => prize.image?.includes('res.cloudinary.com'))
        .slice(0, 5)
        .map((prize) => `${prize.name}: ${prize.image}`);
    } catch {
      return [];
    }
  };

  const handleGeneratePrizeImage = async () => {
    const values = getValues();
    const name = values.name?.trim();
    const description = values.description?.trim();
    const details = values.details?.trim();
    const value = values.value ? String(values.value) : '';

    if (!name && !description && !details) {
      setSnack({
        open: true,
        msg: 'Agrega al menos nombre, descripcion o detalles antes de generar la imagen.',
        sev: 'info',
      });
      return;
    }

    setGeneratingImage(true);

    const mainColor = values.mainColor || DEFAULT_MAIN_COLOR;
    const secondaryColor = values.secondaryColor || DEFAULT_SECONDARY_COLOR;
    const referenceImages = await getExistingPrizeImageReferences();
    const prompt = [
      'Create a polished product-style prize image for a sweepstakes platform.',
      'Generate the final image as a PNG with a transparent background and no backdrop, no scenery, no frame, no shadowed floor.',
      'Use premium retail product photography style, clean isolated composition, high contrast, no small unreadable text, no logos unless explicitly described.',
      referenceImages.length
        ? `Use these existing Cloudinary prize images as visual inspiration for product framing, lighting, retail giveaway style, and excitement, without copying their backgrounds exactly: ${referenceImages.join(' | ')}.`
        : '',
      `Use this two-color palette as the main visual identity: primary ${mainColor}, secondary ${secondaryColor}.`,
      name ? `Prize name: ${name}.` : '',
      description ? `Description: ${description}.` : '',
      details ? `Details: ${details}.` : '',
      value ? `Estimated value: ${value}.` : '',
      'The image should clearly communicate the prize and feel exciting for a giveaway campaign while keeping the background fully transparent.',
    ]
      .filter(Boolean)
      .join(' ');

    let generatedUrl = '';

    await generateImage(
      { prompt, provider: 'gemini' },
      () => undefined,
      (img) => {
        generatedUrl = img.url;
        setGeneratedImagePreview(img.url);
      },
      (meta) => {
        const fallbackUrl = meta.images?.[0]?.url;
        if (!generatedUrl && fallbackUrl) {
          generatedUrl = fallbackUrl;
          setGeneratedImagePreview(fallbackUrl);
        }
        setGeneratingImage(false);
        if (generatedUrl) {
          setSnack({ open: true, msg: 'Imagen generada lista para preview o descarga.', sev: 'success' });
        }
      },
      (error) => {
        setGeneratingImage(false);
        setSnack({ open: true, msg: `No se pudo generar la imagen: ${error}`, sev: 'error' });
      }
    );
  };

  const handleDownloadPrizeImage = async () => {
    if (!generatedImagePreview) return;

    try {
      const response = await fetch(generatedImagePreview);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const extension = blob.type.split('/')[1] || 'png';

      link.href = url;
      link.download = `prize-image.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImagePreview, '_blank', 'noopener,noreferrer');
    }
  };


  if (user && user.role !== 'admin') {
    return (
      <Container
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ py: 2 }}>
        <Alert severity="error">No tienes permisos para crear premios.</Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ py: 2 }}>
      <PageHeading
        title={t('Create prize')}
        description={t('Add a new prize to be used in sweepstakes')}
      />
      <Box mt={2}>
        <Card>
          <CardContent>
            <Box
              component="form"
              gap={2}
              onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); (handleSubmit(onSubmit) as any)(e); }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: t('Name is required') as any }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('Name')}
                    error={!!errors.name}
                    helperText={(errors.name?.message as string) || ''}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('Description')}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}
              />
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('Value (optional)')}
                    fullWidth
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                )}
              />
              <Grid
                container
                spacing={2}
                alignItems="flex-start"
              >
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <AvatarUploadLogo
                    key={imagePreview || 'empty-prize-image'}
                    label={t('Prize image') as string}
                    initialUrl={imagePreview}
                    onSelect={(f, url) => {
                      setFile(f);
                      setImagePreview(url || '');
                      setValue('image', url || '', { shouldValidate: false });
                    }}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <Card
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                <Stack gap={1.5}>
                  <Alert severity="info">
                    La imagen generada no se guarda automaticamente. Para guardar una imagen en la base de datos, subela en Prize image.
                  </Alert>
                  <Grid
                    container
                    spacing={1.5}
                  >
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
                            label="Color IA principal"
                            value={field.value || DEFAULT_MAIN_COLOR}
                            onChange={(value) => field.onChange(value)}
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
                            label="Color IA secundario"
                            value={field.value || DEFAULT_SECONDARY_COLOR}
                            onChange={(value) => field.onChange(value)}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    gap={1}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={
                        generatingImage ? (
                          <CircularProgress
                            size={16}
                            color="inherit"
                          />
                        ) : (
                          <AutoFixHighRoundedIcon />
                        )
                      }
                      onClick={handleGeneratePrizeImage}
                      disabled={generatingImage}
                    >
                      {generatingImage ? 'Generando imagen...' : 'Generar imagen con IA'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => setPreviewOpen(true)}
                      disabled={!generatedImagePreview}
                    >
                      Ver preview
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadOutlinedIcon />}
                      onClick={handleDownloadPrizeImage}
                      disabled={!generatedImagePreview}
                    >
                      Descargar
                    </Button>
                  </Stack>
                  {generatedImagePreview && (
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Box
                        component="img"
                        src={generatedImagePreview}
                        alt="Imagen generada con Gemini"
                        sx={{
                          width: '100%',
                          height: { xs: 180, sm: 220 },
                          display: 'block',
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                  )}
                </Stack>
                  </Card>
                </Grid>
              </Grid>
              <Controller
                name="details"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('Details (optional)')}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}
              />
              <Stack
                direction="row"
                gap={2}>
                <Button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={isSubmitting || createMutation.isPending}>
                  {t('Create prize')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}>
                  {t('Cancel')}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Preview de imagen generada</DialogTitle>
        <DialogContent>
          {generatedImagePreview && (
            <Box
              component="img"
              src={generatedImagePreview}
              alt="Preview de imagen generada para el premio"
              sx={{
                width: '100%',
                maxHeight: '72vh',
                objectFit: 'contain',
                borderRadius: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert
          severity={snack.sev}
          onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
