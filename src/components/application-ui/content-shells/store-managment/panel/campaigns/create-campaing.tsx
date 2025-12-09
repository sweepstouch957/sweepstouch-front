// components/campaigns/CreateCampaignForm.tsx
'use client';

import PreviewModal from '@/components/application-ui/dialogs/preview/preview-modal';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { Sms } from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import CampaignResume from './campaing-resume';

interface CampaignFormInputs {
  title: string;
  description: string;
  content: string;
  type: string;
  startDate: Date;
  estimatedCost: number;
  image?: string;
  imageUrl?: string;
  imagePublicId?: string;
  customAudience?: number;
  linktree?: boolean; // 👈 nuevo parámetro
}

const placeholders = [
  { key: '#n', label: 'Salto de línea' },
  { key: '#storeName', label: 'Nombre de la tienda' },
  { key: '#referralLink', label: 'Link de referido' },
  { key: '#disclaimer', label: 'Texto legal' },
  { key: '#linktree', label: 'Linktree de la tienda' }, // 👈 nuevo placeholder
];

const insertAtCursor = (inputEl: HTMLTextAreaElement, text: string) => {
  const [start, end] = [inputEl.selectionStart, inputEl.selectionEnd];
  const currentText = inputEl.value;
  const newText = currentText.substring(0, start) + text + currentText.substring(end);
  inputEl.value = newText;
  inputEl.setSelectionRange(start + text.length, start + text.length);
  inputEl.focus();
  return newText;
};

export default function CreateCampaignForm({
  onSubmit,
  provider,
  phoneNumber,
  totalAudience,
  initialValues,
  isEditing = false,
}: {  
  onSubmit: (data: CampaignFormInputs) => void;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
  initialValues?: Partial<CampaignFormInputs>;
  isEditing?: boolean;
}) {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormInputs>({
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      content: initialValues?.content || '',
      estimatedCost: initialValues?.estimatedCost || 0.0015,
      startDate: initialValues?.startDate ? new Date(initialValues.startDate) : new Date(),
      linktree: initialValues?.linktree ?? false,
    },
    mode: 'onBlur',
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [useFullAudience, setUseFullAudience] = useState(!initialValues?.customAudience);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const isPhoneMissing = !phoneNumber || phoneNumber.trim() === '';

  const image = watch('image');
  const content = watch('content');
  const estimatedCost = watch('estimatedCost');
  const customAudience = watch('customAudience');
  const startDate = watch('startDate');

  useEffect(() => {
    if (image && (image as any).length > 0) {
      setValue('estimatedCost', 0.06);
    } else {
      setValue('estimatedCost', 0.04);
    }
  }, [image, setValue]);

  const currentLength = content?.length || 0;

  return (
    <Box>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            xs={12}
            md={7}
          >
            <Card
              variant="outlined"
              sx={{ p: 3 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                mb={3}
              >
                <Avatar>
                  <Sms />
                </Avatar>
                <Box>
                  <Typography variant="h6">Provider: {provider}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Sending from: {phoneNumber}
                  </Typography>
                </Box>
              </Stack>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    item
                    xs={12}
                  >
                    <Controller
                      name="title"
                      control={control}
                      rules={{ required: 'Title is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Campaign Title"
                          fullWidth
                          error={!!errors.title}
                          helperText={errors.title?.message}
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
                      name="startDate"
                      control={control}
                      rules={{ required: 'Start date is required' }}
                      render={({ field }) => (
                        <DateTimePicker
                          {...field}
                          label="Start Date"
                          sx={{ width: '100%' }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <TextField
                      label="Campaign Type"
                      value={initialValues?.type || ((image as any)?.length ? 'MMS' : 'SMS')}
                      disabled
                      fullWidth
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                  >
                    <Controller
                      name="content"
                      control={control}
                      rules={{ required: 'Message content is required' }}
                      render={({ field }) => {
                        const handleChange = (e: any) => {
                          const value = e.target.value || '';
                          if (value.length > 2047) {
                            alert('Message content cannot exceed 2047 characters (max 2047).');
                            return;
                          }
                          field.onChange(e);
                        };

                        return (
                          <>
                            <TextField
                              {...field}
                              inputRef={(el) => {
                                if (el) contentRef.current = el;
                              }}
                              label="Message Content"
                              fullWidth
                              multiline
                              rows={6}
                              placeholder={`Ej: Hola #n, aprovecha las ofertas en #storeName...`}
                              error={!!errors.content}
                              helperText={errors.content?.message}
                              onChange={handleChange}
                              sx={{
                                '& .MuiInputBase-root': {
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                },
                              }}
                            />
                            <Box
                              mt={0.5}
                              display="flex"
                              justifyContent="space-between"
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                100 to 2047 characters max
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {currentLength} / 2047
                              </Typography>
                            </Box>
                          </>
                        );
                      }}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                  >
                    <Box
                      display="flex"
                      flexWrap="wrap"
                      gap={1}
                    >
                      {placeholders.map((ph) => (
                        <Tooltip
                          title={ph.label}
                          key={ph.key}
                        >
                          <Chip
                            label={ph.key}
                            size="small"
                            clickable
                            color="secondary"
                            variant="outlined"
                            onClick={() => {
                              if (contentRef.current) {
                                const updatedText = insertAtCursor(
                                  contentRef.current,
                                  ` ${ph.key} `
                                );
                                if (updatedText.length > 2047) {
                                  alert(
                                    'Message content cannot exceed 2047 characters (max 2047).'
                                  );
                                  // revertimos visualmente al valor anterior del form
                                  contentRef.current.value = content || '';
                                  return;
                                }
                                setValue('content', updatedText);
                              }
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Grid>

                

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
                          label="Comment"
                          fullWidth
                          multiline
                          rows={2}
                        />
                      )}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                  >
                    <AvatarUploadLogo
                      label="Imagen de campaña"
                      initialUrl={initialValues?.image}
                      onSelect={(file) => {
                        if (file) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          setValue('image', dt.files as any, { shouldValidate: true });
                        } else {
                          setValue('image', undefined);
                        }
                      }}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                  >
                    <Paper
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={useFullAudience}
                              onChange={(e) => {
                                setUseFullAudience(e.target.checked);
                                if (e.target.checked) {
                                  setValue('customAudience', undefined);
                                }
                              }}
                            />
                          }
                          label={`Enviar a toda la audiencia (${totalAudience} clientes)`}
                        />

                        {!useFullAudience && (
                          <Controller
                            name="customAudience"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                type="number"
                                label="Tamaño de audiencia personalizada"
                                size="small"
                                inputProps={{ min: 1, max: totalAudience }}
                              />
                            )}
                          />
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Box
                  mt={4}
                  display="flex"
                  flexDirection="column"
                  alignItems="flex-end"
                  gap={1.5}
                >
                  {isPhoneMissing && (
                    <Tooltip title="No se puede crear una campaña para esta tienda ya que no tiene un numero asignado">
                      <Alert
                        severity="error"
                        icon={<ErrorOutlineIcon />}
                        sx={{
                          cursor: 'help',
                          p: 0.5,
                          minWidth: 'auto',
                          width: 'auto',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        No hay numero asignado
                      </Alert>
                    </Tooltip>
                  )}

                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    gap={2}
                  >
                    <Button variant="outlined">Borrador</Button>
                    <Tooltip
                      title={
                        isPhoneMissing
                          ? 'No se puede crear una campaña para esta tienda ya que no tiene un numero asignado'
                          : ''
                      }
                    >
                      <span>
                        <Button
                          variant="contained"
                          type="submit"
                          disabled={isPhoneMissing}
                        >
                          {isEditing ? 'Actualizar campaña' : 'Crear campaña'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </form>
            </Card>
          </Grid>

          <Grid
            item
            xs={12}
            md={5}
          >
            <CampaignResume
              estimatedCost={estimatedCost}
              startDate={startDate}
              totalAudience={totalAudience}
              type={(image as any)?.length ? 'MMS' : 'SMS'}
              useFullAudience={useFullAudience}
              customAudience={customAudience}
              onPreviewClick={() => setPreviewOpen(true)}
            />
          </Grid>
        </Grid>
      </Container>

      <PreviewModal
        open={previewOpen}
        handleClose={() => setPreviewOpen(false)}
        content={content}
        image={(image as any)?.[0] || initialValues?.image}
      />
    </Box>
  );
}
