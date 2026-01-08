import { api } from '@/libs/axios';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BriefFormRHF } from '../application-ui/form-layouts/brief';
import { DeadlineHeader } from '../application-ui/progress-indicators/dead-line';
import { StepEditor } from '../application-ui/steppers/biref';
import AvatarUploadLogo from '../application-ui/upload/avatar/avatar-upload-logo';

export type ChecklistStepKey =
  | 'clientBrief'
  | 'designAssets'
  | 'optinMedia'
  | 'storeInfra'
  | 'physicalMaterials'
  | 'campaignSend'
  | 'monitoring';

interface Props {
  /** ID del sweepstake existente para editar/gestionar el checklist */
  sweepstakeId: string;
}

const STEPS: { key: ChecklistStepKey; label: string; subtitle?: string; owner: string }[] = [
  {
    key: 'clientBrief',
    label: 'Recepción de brief del cliente',
    subtitle: 'Incluye premio, fechas, reglas, mecánica',
    owner: 'Accounts',
  },
  {
    key: 'designAssets',
    label: 'Diseño gráfico',
    subtitle: 'Flyer, línea gráfica, portada opt-in, tablets (ETA 48h)',
    owner: 'Diseño',
  },
  {
    key: 'optinMedia',
    label: 'Medios de Opt-in',
    subtitle: 'Formulario, base de datos, reglas de sorteo',
    owner: 'Plataforma',
  },
  {
    key: 'storeInfra',
    label: 'Infraestructura en tienda',
    subtitle: 'Tablets y tickets de impresora (pruebas en kioskos)',
    owner: 'IT',
  },
  {
    key: 'physicalMaterials',
    label: 'Materiales físicos',
    subtitle: 'Banners, camisas, stands (arte final + impresión)',
    owner: 'Producción',
  },
  {
    key: 'campaignSend',
    label: 'Enviar campaña SMS/MMS',
    subtitle: 'Segmentación y programación (CTA al Opt-in)',
    owner: 'Marketing',
  },
  {
    key: 'monitoring',
    label: 'Monitoreo & soporte',
    subtitle: 'Opt-ins diarios y soporte a tiendas',
    owner: 'Operaciones',
  },
];

/* ============== Componente principal solo-EDICIÓN ============== */
export default function SweepstakeChecklist({ sweepstakeId }: Props) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carga del sweepstake
  const {
    data: sweepstake,
    isLoading: loadingSweep,
    refetch: refetchSweep,
  } = useQuery({
    queryKey: ['sweepstake', sweepstakeId],
    queryFn: () => sweepstakesClient.getSweepstakeById(sweepstakeId),
    staleTime: 1000 * 60 * 2,
  });

  console.log({ sweepstake });

  // Progreso checklist
  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ['sweepstake-progress', sweepstakeId],
    queryFn: () => sweepstakesClient.getChecklistProgress(sweepstakeId),
    staleTime: 15_000,
  });

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: 'success' | 'error' | 'info';
  } | null>(null);

  // Mutación: actualizar brief (desde BriefFormRHF)
  const updateBriefMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = { ...values, prize: values.prizeIds }; // map a backend
      const res = await api.patch(`/sweepstakes/${sweepstakeId}`, payload);
      return res.data;
    },
    onSuccess: async () => {
      setSnack({ open: true, msg: 'Brief actualizado ✅', sev: 'success' });
      await refetchSweep();
    },
    onError: () => setSnack({ open: true, msg: 'No se pudo actualizar el brief', sev: 'error' }),
  });

  // Mutación: patch de pasos
  const patchStepMutation = useMutation({
    mutationFn: ({ step, body }: { step: ChecklistStepKey; body: any }) =>
      sweepstakesClient.patchChecklistStep(sweepstakeId, step, body),
    onSuccess: async () => {
      setSnack({ open: true, msg: 'Checklist actualizado ✅', sev: 'success' });
      await Promise.all([refetchSweep(), refetchProgress()]);
    },
    onError: () =>
      setSnack({ open: true, msg: 'No se pudo actualizar el checklist', sev: 'error' }),
  });

  // Upload de imagen para diseño (marca designAssets como done con nota)
  const uploadDesignImageMutation = useMutation({
    mutationFn: async (file: File) => uploadCampaignImage(file, 'campaigns'),
    onSuccess: async (resp) => {
      await patchStepMutation.mutateAsync({
        step: 'designAssets',
        body: { done: true, notes: `Flyer subido: ${resp.url}` },
      });
      setSnack({ open: true, msg: 'Imagen subida y paso marcado ✅', sev: 'success' });
    },
    onError: () => setSnack({ open: true, msg: 'No se pudo subir la imagen', sev: 'error' }),
  });

  const pct = useMemo(() => progress?.progressPercent ?? 0, [progress]);

  // Valores iniciales para el Brief (edición)
  const initialBriefValues = sweepstake
    ? {
        name: sweepstake.name || '',
        description: sweepstake.description || '',
        startDate: sweepstake.startDate || null,
        endDate: sweepstake.endDate || null,
        image: (sweepstake.image as string) || '',
        hasQr: Boolean(sweepstake.hasQr),
        rules: sweepstake.rules || '',
        participationMessage: sweepstake.participationMessage || '',
        sweeptakeDescription: sweepstake.description || '',
        prizeIds: Array.isArray(sweepstake.prize)
          ? sweepstake.prize.map((p: any) => (typeof p === 'string' ? p : p._id))
          : [],
      }
    : undefined;

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
        >
          {sweepstake?.createdAt && (
            <DeadlineHeader
              createdAt={sweepstake.createdAt}
              value={pct}
            />
          )}
          <Tooltip title="Refrescar">
            <IconButton
              onClick={() => {
                refetchSweep();
                refetchProgress();
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ===== Paso 1: Brief (edición) ===== */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardHeader
          title="Información básica / Brief"
          subheader="Edita la información base del sweepstake"
          sx={{
            '& .MuiCardHeader-title': { fontWeight: 800 },
            background: 'linear-gradient(90deg, rgba(33,150,243,0.12), rgba(156,39,176,0.12))',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        />
        <CardContent>
          {loadingSweep && !sweepstake ? (
            <Stack
              alignItems="center"
              py={4}
            >
              <CircularProgress />
            </Stack>
          ) : (
            <BriefFormRHF
              mode="edit"
              initialValues={initialBriefValues}
              onSubmit={(values) => updateBriefMutation.mutate(values)}
            />
          )}
        </CardContent>
      </Card>

      {/* ===== Stepper ===== */}
      <Card sx={{ borderRadius: 3 }}>
        <CardHeader title="Checklist / Stepper" />
        <CardContent>
          {loadingSweep && !sweepstake ? (
            <Stack
              alignItems="center"
              py={4}
            >
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {/* input hidden para subir assets de diseño */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadDesignImageMutation.mutate(f);
                }}
              />

              <Stepper
                orientation="vertical"
                sx={{ pr: 2 }}
              >
                {STEPS.map((s, idx) => {
                  const stepData =
                    (sweepstake?.checklist && (sweepstake.checklist as any)[s.key]) || {};
                  const done = Boolean(stepData?.done);

                  return (
                    <Step
                      key={s.key}
                      active
                      completed={done}
                      expanded
                    >
                      <StepLabel>
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1}
                          flexWrap="wrap"
                        >
                          <Typography fontWeight={700}>
                            {idx + 1}. {s.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={`Owner: ${s.owner}`}
                          />
                          {s.subtitle && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {s.subtitle}
                            </Typography>
                          )}
                        </Stack>
                      </StepLabel>
                      <StepContent>
                        {/* Detalles específicos por paso */}
                        {s.key === 'designAssets' && (
                          <DesignExtras
                            stepData={stepData}
                            onSave={(body) =>
                              patchStepMutation.mutate({ step: 'designAssets', body })
                            }
                            onUploadDesign={() => fileInputRef.current?.click()}
                            loading={patchStepMutation.isPending}
                          />
                        )}

                        {s.key === 'storeInfra' && (
                          <StoreInfraExtras
                            stepData={stepData}
                            onPatch={(body) =>
                              patchStepMutation.mutate({ step: 'storeInfra', body })
                            }
                          />
                        )}

                        {/* Editor genérico: notas, marcar done, confirmationLink en optin */}
                        <StepEditor
                          stepKey={s.key as any}
                          stepData={stepData}
                          onMarkDone={(extra?: any) =>
                            patchStepMutation.mutate({
                              step: s.key,
                              body: { done: true, ...(extra || {}) },
                            })
                          }
                          onUploadDesign={() => fileInputRef.current?.click()}
                          onSaveLink={(url: string) =>
                            patchStepMutation.mutate({
                              step: 'optinMedia',
                              body: { confirmationLink: url },
                            })
                          }
                          patchLoading={patchStepMutation.isPending}
                          designUploading={uploadDesignImageMutation.isPending}
                        />
                        <Divider sx={{ my: 2 }} />
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </>
          )}
        </CardContent>
      </Card>

      {/* Snack */}
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
    </Box>
  );
}

/* ====== Extras específicos ====== */
function DesignExtras({
  stepData,
  onSave,
  loading,
}: {
  stepData: any;
  onSave: (body: any) => void;
  onUploadDesign: () => void;
  loading: boolean;
}) {
  const [driveLink, setDriveLink] = useState<string>(stepData?.mediaUrl || '');

  useEffect(() => {
    setDriveLink(stepData?.driveLink || '');
  }, [stepData]);

  return (
    <Stack
      gap={2}
      sx={{ mb: 2 }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={2}
      >
        <TextField
          label="Link de Drive (arte / piezas)"
          fullWidth
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </Stack>

      <Button
        variant="contained"
        onClick={() =>
          onSave({
            mediaUrl: driveLink || undefined,
          })
        }
        disabled={loading}
      >
        Guardar detalles de diseño
      </Button>
    </Stack>
  );
}

function StoreInfraExtras({ stepData, onPatch }: { stepData: any; onPatch: (body: any) => void }) {
  const [saving, setSaving] = React.useState(false);

  const handleSelect = async (file: File | null) => {
    try {
      setSaving(true);
      if (!file) {
        // quitar imagen
        onPatch({ imageYear: '' }); // o undefined si prefieres borrar el campo
        return;
      }
      const { url } = await uploadCampaignImage(file, 'sweepstakes-year');
      onPatch({ imageYear: url });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack
      gap={1.5}
      sx={{ mb: 2 }}
    >
      <Typography variant="subtitle2">Imagen del año (opcional)</Typography>

      <AvatarUploadLogo
        label={saving ? 'Subiendo…' : 'Imagen del año'}
        initialUrl={stepData?.imageYear || undefined}
        onSelect={handleSelect}
      />

      {stepData?.imageYear && (
        <Chip
          size="small"
          color="success"
          label="Imagen del año configurada"
          sx={{ alignSelf: 'flex-start' }}
        />
      )}

      <FormControlLabel
        sx={{ mt: 0.5 }}
        control={
          <Switch
            size="small"
            checked={!!stepData?.done}
            onChange={(e) => onPatch({ done: e.target.checked })}
          />
        }
        label="Marcar paso como completado"
      />
    </Stack>
  );
}
