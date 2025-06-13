'use client';

import PreviewModal from '@/components/application-ui/dialogs/preview/preview-modal';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { Sms } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Divider,
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
  startDate: Date;
  estimatedCost: number;
  image?: FileList;
  customAudience?: number;
}

const placeholders = [
  { key: '#n', label: 'Nombre del cliente' },
  { key: '#storeName', label: 'Nombre de la tienda' },
  { key: '#referralLink', label: 'Link de referido' },
  { key: '#disclaimer', label: 'Texto legal' },
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
}: {
  onSubmit: (data: CampaignFormInputs) => void;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
}) {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormInputs>({
    defaultValues: {
      estimatedCost: 0.0015,
      startDate: new Date(),
    },
    mode: 'onBlur',
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [useFullAudience, setUseFullAudience] = useState(true);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const image = watch('image');
  const content = watch('content');
  const estimatedCost = watch('estimatedCost');
  const customAudience = watch('customAudience');
  const startDate = watch('startDate');

  useEffect(() => {
    if (image && image.length > 0) {
      setValue('estimatedCost', 0.06);
    } else {
      setValue('estimatedCost', 0.04);
    }
  }, [image, setValue]);

  return (
    <Box>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            md={7}
          >
            <Card
              variant="outlined"
              sx={{ p: 2}}
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
                      render={({ field }) => (
                        <DateTimePicker
                          {...field}
                          label="Start Date"
                          sx={{
                            width: '100%',
                          }}
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
                      value={image?.length ? 'MMS' : 'SMS'}
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
                      render={({ field }) => (
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
                          sx={{
                            '& .MuiInputBase-root': {
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                            },
                          }}
                        />
                      )}
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
                      onSelect={(file) => {
                        if (file) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          setValue('image', dt.files as FileList, { shouldValidate: true });
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
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={useFullAudience}
                          onChange={(e) => {
                            setUseFullAudience(e.target.checked);
                            if (e.target.checked) setValue('customAudience', undefined);
                          }}
                        />
                      }
                      label={`Enviar a toda la audiencia (${totalAudience} clientes)`}
                    />
                    {!useFullAudience && (
                      <Controller
                        name="customAudience"
                        control={control}
                        rules={{
                          required: 'Debe especificar una cantidad',
                          min: { value: 1, message: 'Debe ser al menos 1' },
                          max: {
                            value: totalAudience,
                            message: `No puede superar ${totalAudience} clientes`,
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Cantidad de clientes"
                            fullWidth
                            error={!!errors.customAudience}
                            helperText={errors.customAudience?.message}
                            sx={{ mt: 2 }}
                          />
                        )}
                      />
                    )}
                  </Grid>
                </Grid>

                <Box
                  mt={4}
                  display="flex"
                  justifyContent="flex-end"
                  gap={2}
                >
                  <Button variant="outlined">Create Draft</Button>
                  <Button
                    variant="contained"
                    type="submit"
                  >
                    Create Campaign
                  </Button>
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
              type={image?.length ? 'MMS' : 'SMS'}
              useFullAudience={true}
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
        image={image?.[0]}
      />
    </Box>
  );
}
