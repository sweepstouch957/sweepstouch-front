'use client';

import { money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import type { QboDraft } from '@/services/qbo.service';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

type Props = {
  open: boolean;
  drafts: QboDraft[];
  total: number;
  window?: { from: string; to: string; closesOn: string };
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Confirmación antes de emitir. Crear facturas en QuickBooks no se deshace desde
 * acá: hay que anularlas una por una en QuickBooks, así que el paso extra vale.
 */
export function ConfirmCreateDialog({
  open,
  drafts,
  total,
  window: win,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const withWarnings = drafts.filter((d) => d.warnings.length > 0);
  const lines = drafts.reduce((s, d) => s + d.lines.length, 0);

  return (
    <Dialog open={open}
onClose={busy ? undefined : onClose}
maxWidth="sm"
fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Crear facturas en QuickBooks</DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning"
sx={{ mb: 2 }}>
          <AlertTitle>Esto emite documentos contables</AlertTitle>
          Las facturas se crean en QuickBooks con fecha {win?.closesOn}. Para deshacerlo
          hay que anularlas una por una desde QuickBooks.
        </Alert>

        <Stack
          direction="row"
          divider={<Divider orientation="vertical"
flexItem />}
          spacing={2.5}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
              FACTURAS
            </Typography>
            <Typography variant="h5"
fontWeight={700}>
              {drafts.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
              CONCEPTOS
            </Typography>
            <Typography variant="h5"
fontWeight={700}>
              {lines}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
              TOTAL
            </Typography>
            <Typography variant="h5"
fontWeight={700}>
              {money(total)}
            </Typography>
          </Box>
        </Stack>

        {withWarnings.length > 0 && (
          <Alert severity="info"
icon={<WarningAmberRoundedIcon />}>
            <AlertTitle sx={{ mb: 0.5 }}>
              {`${withWarnings.length} con observaciones`}
            </AlertTitle>
            <Stack gap={0.25}>
              {withWarnings.slice(0, 6).map((d) => (
                <Typography key={d.storeId}
variant="caption">
                  <strong>{d.storeName}</strong>
                  {` — ${d.warnings.join(' · ')}`}
                </Typography>
              ))}
              {withWarnings.length > 6 && (
                <Typography variant="caption"
color="text.secondary">
                  {`y ${withWarnings.length - 6} más`}
                </Typography>
              )}
            </Stack>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}
disabled={busy}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          disabled={busy || !drafts.length}
          startIcon={busy ? <CircularProgress size={14}
color="inherit" /> : undefined}
          onClick={onConfirm}
        >
          {busy ? 'Creando…' : `Crear ${drafts.length}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmCreateDialog;
