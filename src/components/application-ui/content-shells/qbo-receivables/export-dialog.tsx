'use client';

import { qboService } from '@/services/qbo.service';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Alert,
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
  Paper,
  Radio,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { fmtDate } from './constants';

type Scope = 'stores' | 'invoices' | 'lines';
type Basis = 'issue' | 'service';

type Props = {
  open: boolean;
  onClose: () => void;
  range: { from: string | null; to: string | null };
  categories: string[];
  categoryLabels: string[];
  /** Base de fecha elegida en la barra; el diálogo arranca con la misma. */
  basis?: 'issue' | 'service';
};

const SCOPES: Array<{
  value: Scope;
  label: string;
  hint: string;
  icon: SvgIconComponent;
}> = [
  {
    value: 'stores',
    label: 'Resumen por tienda',
    hint: 'Una fila por tienda: cuánto debe, atraso y categorías',
    icon: StorefrontRoundedIcon,
  },
  {
    value: 'invoices',
    label: 'Facturas',
    hint: 'Una fila por factura, con su total, pagado y saldo',
    icon: ReceiptLongRoundedIcon,
  },
  {
    value: 'lines',
    label: 'Conceptos',
    hint: 'Una fila por cargo, con fecha de servicio y audiencia',
    icon: DescriptionRoundedIcon,
  },
];

export function ExportDialog({
  open,
  onClose,
  range,
  categories,
  categoryLabels,
  basis: initialBasis = 'issue',
}: Props) {
  const theme = useTheme();
  const [scope, setScope] = useState<Scope>('stores');
  // Hereda lo elegido en la barra: si estás mirando por servicio, exportar por
  // emisión daría otros números sin que se note.
  const [basis, setBasis] = useState<Basis>(initialBasis);
  const [includePaid, setIncludePaid] = useState(false);
  const [busy, setBusy] = useState<'csv' | 'xlsx' | null>(null);

  const hasRange = Boolean(range.from || range.to);

  const download = async (format: 'csv' | 'xlsx') => {
    setBusy(format);
    try {
      await qboService.downloadExport({
        scope,
        format,
        from: range.from,
        to: range.to,
        items: categories,
        includePaid,
        basis,
      });
      onClose();
    } catch (e: any) {
      // El export tarda (consulta QuickBooks) y puede fallar por sesión vencida;
      // sin este aviso el diálogo se quedaba mudo y parecía colgado.
      toast.error(
        e?.response?.status === 401
          ? 'Sesión expirada. Vuelve a entrar y reintenta.'
          : e?.message || 'No se pudo generar el archivo'
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open}
onClose={onClose}
maxWidth="sm"
fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>Exportar cartera</DialogTitle>

      <DialogContent dividers>
        {/* Qué se lleva el archivo. Exportar "todo" y recibir lo filtrado —o al
            revés— es de los errores más caros en cobranza. */}
        <Stack direction="row"
flexWrap="wrap"
useFlexGap
spacing={0.75}
alignItems="center"
sx={{ mb: 2.5 }}>
          <Typography variant="caption"
color="text.secondary">
            Se exporta:
          </Typography>
          {hasRange ? (
            <Chip
              size="small"
              variant="outlined"
              icon={<EventRoundedIcon />}
              label={`${range.from ? fmtDate(range.from) : '…'} – ${range.to ? fmtDate(range.to) : 'hoy'}`}
              sx={{ height: 22 }}
            />
          ) : (
            <Chip size="small"
variant="outlined"
label="Todo el histórico"
sx={{ height: 22 }} />
          )}
          {categoryLabels.map((c) => (
            <Chip key={c}
size="small"
color="primary"
variant="outlined"
label={c}
sx={{ height: 22 }} />
          ))}
        </Stack>

        <Typography variant="subtitle2"
fontWeight={700}
sx={{ mb: 1 }}>
          Nivel de detalle
        </Typography>

        <Stack spacing={1}
sx={{ mb: 2.5 }}>
          {SCOPES.map((s) => {
            const Icon = s.icon;
            const active = scope === s.value;
            return (
              <Paper
                key={s.value}
                variant="outlined"
                onClick={() => setScope(s.value)}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  cursor: 'pointer',
                  borderColor: active ? 'primary.main' : 'divider',
                  borderWidth: active ? 2 : 1,
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                }}
              >
                <Stack direction="row"
alignItems="center"
spacing={1}>
                  <Radio size="small"
checked={active}
sx={{ p: 0.5 }} />
                  <Icon fontSize="small"
color={active ? 'primary' : 'action'} />
                  <Box minWidth={0}>
                    <Typography variant="body2"
fontWeight={600}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption"
color="text.secondary">
                      {s.hint}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Typography variant="subtitle2"
fontWeight={700}
sx={{ mb: 1 }}>
          Fecha con la que se filtra
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          fullWidth
          value={basis}
          onChange={(_, v) => v && setBasis(v as Basis)}
          sx={{ mb: 1 }}
        >
          <ToggleButton value="issue">Emisión de la factura</ToggleButton>
          <ToggleButton value="service">Fecha del servicio</ToggleButton>
        </ToggleButtonGroup>

        {/* La diferencia no es obvia y cambia el resultado, así que se explica
            con el caso real en vez de dejarlo al criterio de quien exporta. */}
        <Alert severity="info"
sx={{ py: 0.25, mb: 2 }}>
          <Typography variant="caption">
            {basis === 'issue'
              ? 'Por emisión: una factura del 15/08 entra completa, aunque cobre campañas del 11 y del 13. Es lo que hace QuickBooks y lo que cuadra con sus reportes.'
              : 'Por servicio: cada cargo se ubica en el día en que se prestó, leído de la descripción. Cuadra contra tus campañas, no contra QuickBooks. Los cargos sin fecha en el texto (membresías, opt-in) usan la de emisión.'}
          </Typography>
        </Alert>

        {basis === 'service' && !hasRange && (
          <Alert severity="warning"
sx={{ py: 0.25, mb: 2 }}>
            <Typography variant="caption">
              Sin periodo seleccionado, filtrar por fecha de servicio no cambia nada.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ mb: 1 }} />

        <FormControlLabel
          control={
            <Switch size="small"
checked={includePaid}
onChange={(e) => setIncludePaid(e.target.checked)} />
          }
          label={
            <Box>
              <Typography variant="body2">Incluir facturas ya pagadas</Typography>
              <Typography variant="caption"
color="text.secondary">
                Por defecto solo sale lo que está sin cobrar
              </Typography>
            </Box>
          }
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}
disabled={Boolean(busy)}>
          Cancelar
        </Button>
        <Button
          variant="outlined"
          startIcon={
            busy === 'csv' ? <CircularProgress size={14}
color="inherit" /> : <TableChartRoundedIcon />
          }
          disabled={Boolean(busy)}
          onClick={() => download('csv')}
        >
          CSV
        </Button>
        <Button
          variant="contained"
          startIcon={
            busy === 'xlsx' ? <CircularProgress size={14}
color="inherit" /> : <GridOnRoundedIcon />
          }
          disabled={Boolean(busy)}
          onClick={() => download('xlsx')}
        >
          Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExportDialog;
