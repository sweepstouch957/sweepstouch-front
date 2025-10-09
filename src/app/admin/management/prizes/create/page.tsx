
'use client';

import { Box, Button, Card, CardContent, Container, Stack, TextField, Typography, Alert, Snackbar, FormHelperText, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import PageHeading from '@/components/base/page-heading';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useCustomization } from '@/hooks/use-customization';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { uploadCampaignImage } from '@/services/upload.service';
import { prizesClient, type Prize } from '@/services/sweepstakes.service';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';

type PrizeForm = {
  name: string;
  description?: string;
  value?: number | string;
  image?: string;
  details?: string;
};

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const customization = useCustomization();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' | 'info' }>({ open: false, msg: '', sev: 'success' });

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PrizeForm>({
    defaultValues: { name: '', description: '', value: undefined, image: '', details: '' }
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
              <AvatarUploadLogo
                label={t('Prize image') as string}
                initialUrl={''}
                onSelect={(f, url) => {
                  setFile(f);
                  setValue('image', url || '', { shouldValidate: false });
                }}
              />
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
