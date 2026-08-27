'use client';

/**
 * Compartir la base de un negocio parado con un vecino que sí manda campañas.
 *
 * El dashboard ya decía qué números están parados y quién los tiene al lado;
 * lo que faltaba era el botón. Se abre desde la fila (elegís destino) o desde
 * un chip de vecino (ese destino ya viene elegido).
 *
 * Tres pasos, uno por pantalla, porque la operación toca decenas de miles de
 * clientes y el paso 2 es el que evita el "¿qué acabo de hacer?": dice cuántos
 * se agregan de verdad, cuántos ya estaban y muestra una muestra de números.
 */

import { useApplyShare, useSharePreview } from '@/hooks/fetching/customers/useCustomerShare';
import type { NearbyStore, NonSenderNearbyRow } from '@/services/campaing.service';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { tint, tintBorder, toneText } from 'src/theme/semantic';
import { BusinessTypeIcon, businessTypeMeta } from '@/components/audience/business-types';
import { numeric } from '@/components/audience/ui';

const nf = new Intl.NumberFormat('es-US');

export type ShareAudienceDialogProps = {
  open: boolean;
  onClose: () => void;
  /** La tienda parada. Es siempre el origen: su base es la que no se usa. */
  row: NonSenderNearbyRow | null;
  /** Vecino preseleccionado cuando se abre desde un chip. */
  initialTargetId?: string | null;
};

/** Sólo los vecinos nuestros pueden recibir: a un lead de afuera no le podemos dar nada. */
function eligibleNeighbors(row: NonSenderNearbyRow | null): NearbyStore[] {
  if (!row) return [];
  return row.nearby.filter((n) => n.kind === 'own_sender' || n.kind === 'own_idle');
}

function StoreLine({
  label,
  name,
  businessType,
  detail,
  tone,
}: {
  label: string;
  name: string;
  businessType?: string | null;
  detail?: string;
  tone: 'warning' | 'success';
}) {
  return (
    <Box
      sx={(t) => ({
        p: 1.5,
        borderRadius: 1.5,
        border: `1px solid ${tintBorder(t, tone, 0.24)}`,
        bgcolor: tint(t, tone, 0.07),
      })}
    >
      <Typography
        variant="caption"
        sx={(t) => ({ color: toneText(t, tone), fontWeight: 600 })}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        sx={{ mt: 0.25 }}
      >
        <BusinessTypeIcon type={businessType} />
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          title={name}
        >
          {name}
        </Typography>
      </Stack>
      {detail ? (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {detail}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function ShareAudienceDialog({
  open,
  onClose,
  row,
  initialTargetId,
}: ShareAudienceDialogProps) {
  const theme = useTheme();
  const [targetId, setTargetId] = useState<string | null>(initialTargetId ?? null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const neighbors = useMemo(() => eligibleNeighbors(row), [row]);
  const apply = useApplyShare();

  // Cada apertura arranca limpia: si no, el destino y el resultado de la
  // operación anterior se ven en la siguiente tienda.
  useEffect(() => {
    if (!open) return;
    setTargetId(initialTargetId ?? null);
    setActiveOnly(true);
    setNote('');
    setConfirmed(false);
    apply.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTargetId, row?.store.id]);

  const preview = useSharePreview(row?.store.id, targetId ?? undefined, activeOnly);

  const target = neighbors.find((n) => n.id === targetId) || null;
  const done = apply.isSuccess ? apply.data : null;

  const handleApply = () => {
    if (!row || !targetId) return;
    apply.mutate({
      fromStoreId: row.store.id,
      toStoreId: targetId,
      activeOnly,
      note: note.trim() || undefined,
    });
  };

  const errorMessage =
    (apply.error as any)?.response?.data?.error ||
    (apply.isError ? 'No se pudo compartir la base.' : null);

  const previewError =
    (preview.error as any)?.response?.data?.error ||
    (preview.isError ? 'No se pudo calcular la vista previa.' : null);

  return (
    <Dialog
      open={open}
      onClose={apply.isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={1}
        >
          <Box minWidth={0}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
            >
              {done ? 'Base compartida' : 'Compartir base'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {done
                ? 'La operación quedó registrada y se puede revertir.'
                : 'Los contactos parados empiezan a recibir las campañas del vecino.'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            disabled={apply.isPending}
            aria-label="Cerrar"
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      {apply.isPending && <LinearProgress />}

      <DialogContent dividers>
        {!row ? null : done ? (
          /* ── Resultado ────────────────────────────────────────────── */
          <Stack
            gap={2}
            alignItems="center"
            sx={{ py: 2 }}
          >
            <CheckCircleRoundedIcon
              sx={{ fontSize: 44, color: theme.palette.success.main }}
            />
            <Typography
              variant="h5"
              fontWeight={700}
              sx={numeric}
            >
              {nf.format(done.shared)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              contactos de <b>{done.from.name}</b> ahora también reciben las campañas de{' '}
              <b>{done.to.name}</b>.
              {done.alreadyInTarget > 0 && (
                <>
                  {' '}
                  Otros {nf.format(done.alreadyInTarget)} ya estaban en el destino y no se
                  tocaron.
                </>
              )}
            </Typography>
            <Alert
              severity="info"
              sx={{ width: '100%' }}
              icon={<HistoryRoundedIcon fontSize="inherit" />}
            >
              ¿Te arrepentiste? Se revierte desde el historial y los contactos vuelven a estar
              sólo en su tienda.
            </Alert>
          </Stack>
        ) : (
          /* ── Formulario ───────────────────────────────────────────── */
          <Stack gap={2}>
            <StoreLine
              label="Base parada (origen)"
              name={row.store.name}
              businessType={row.store.businessType}
              detail={`${nf.format(row.store.audience)} contactos · ${
                businessTypeMeta(row.store.businessType).label
              }`}
              tone="warning"
            />

            <Stack alignItems="center">
              <SouthRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </Stack>

            {neighbors.length === 0 ? (
              <Alert severity="warning">
                Este negocio no tiene ningún vecino nuestro dentro del radio. Sólo hay negocios de
                afuera, y a esos primero hay que venderles.
              </Alert>
            ) : target ? (
              <StoreLine
                label="Destino"
                name={target.name}
                businessType={target.businessType}
                detail={[
                  target.kind === 'own_sender' ? 'Ya manda campañas' : 'Nuestro, sin campañas',
                  target.distanceKm !== null ? `a ${target.distanceKm} km` : 'zona cercana',
                ].join(' · ')}
                tone="success"
              />
            ) : null}

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                {target ? 'Cambiar destino' : 'Elegí el destino'}
              </Typography>
              <RadioGroup
                value={targetId ?? ''}
                onChange={(e) => {
                  setTargetId(e.target.value);
                  // El switch de confirmación dice un número. Si cambia el
                  // destino, ese número ya no es el que se confirmó.
                  setConfirmed(false);
                }}
              >
                <Stack
                  gap={0.5}
                  sx={{ maxHeight: 190, overflowY: 'auto', pr: 0.5 }}
                >
                  {neighbors.map((n) => (
                    <FormControlLabel
                      key={n.id}
                      value={n.id}
                      control={<Radio size="small" />}
                      sx={{
                        m: 0,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: n.id === targetId ? 'primary.main' : 'divider',
                        px: 1,
                        py: 0.5,
                        bgcolor:
                          n.id === targetId
                            ? alpha(theme.palette.primary.main, 0.06)
                            : 'transparent',
                      }}
                      label={
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={0.75}
                          minWidth={0}
                        >
                          {n.kind === 'own_sender' ? (
                            <BoltRoundedIcon
                              sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }}
                            />
                          ) : (
                            <BusinessTypeIcon type={n.businessType} />
                          )}
                          <Typography
                            variant="body2"
                            noWrap
                            title={n.name}
                          >
                            {n.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ ...numeric, flexShrink: 0 }}
                          >
                            {n.distanceKm !== null ? `${n.distanceKm}km` : 'zip'}
                          </Typography>
                        </Stack>
                      }
                    />
                  ))}
                </Stack>
              </RadioGroup>
            </Box>

            <Divider />

            {/* Vista previa: el número que se va a mover, antes de moverlo. */}
            {targetId && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {preview.isLoading ? (
                  <Skeleton
                    variant="text"
                    width="70%"
                    height={28}
                  />
                ) : previewError ? (
                  <Typography
                    variant="body2"
                    color="error"
                  >
                    {previewError}
                  </Typography>
                ) : preview.data ? (
                  <Stack gap={0.5}>
                    <Stack
                      direction="row"
                      alignItems="baseline"
                      gap={1}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={numeric}
                      >
                        {nf.format(preview.data.willShare)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        contactos se activan
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {nf.format(preview.data.alreadyInTarget)} ya estaban en el destino y no se
                      tocan. El origen conserva sus {nf.format(preview.data.totalInSource)}{' '}
                      contactos: compartir no mueve a nadie.
                    </Typography>
                    {preview.data.exceedsLimit && (
                      <Alert
                        severity="error"
                        sx={{ mt: 0.5 }}
                      >
                        Son más de {nf.format(preview.data.maxShare)} contactos, el máximo por
                        operación.
                      </Alert>
                    )}
                  </Stack>
                ) : null}
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={activeOnly}
                  onChange={(e) => {
                    setActiveOnly(e.target.checked);
                    setConfirmed(false);
                  }}
                />
              }
              label="Sólo contactos activos"
              slotProps={{ typography: { variant: 'body2' } }}
            />

            <TextField
              size="small"
              label="Nota (opcional)"
              placeholder="Por qué se comparte — queda en el historial"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
            />

            {/* Toca miles de clientes: el check obliga a leer el número de arriba. */}
            {preview.data && preview.data.willShare > 0 && !preview.data.exceedsLimit && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    color="success"
                  />
                }
                label={`Confirmo compartir ${nf.format(preview.data.willShare)} contactos`}
                slotProps={{ typography: { variant: 'body2', fontWeight: 600 } }}
              />
            )}

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        {done ? (
          <>
            <Button
              component={Link}
              href="/admin/applications/audience-share"
              size="small"
              startIcon={<HistoryRoundedIcon />}
              sx={{ textTransform: 'none' }}
            >
              Ver historial
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={onClose}
              sx={{ textTransform: 'none' }}
            >
              Listo
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onClose}
              disabled={apply.isPending}
              sx={{ textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ShareRoundedIcon />}
              onClick={handleApply}
              disabled={
                !targetId ||
                !confirmed ||
                apply.isPending ||
                preview.isLoading ||
                !preview.data ||
                preview.data.willShare === 0 ||
                preview.data.exceedsLimit
              }
              sx={{ textTransform: 'none' }}
            >
              {apply.isPending ? 'Compartiendo…' : 'Compartir base'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
