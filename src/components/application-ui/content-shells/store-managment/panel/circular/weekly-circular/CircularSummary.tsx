'use client';

/** Ficha del circular: nombre, estado, de dónde vino, fechas, productos y archivos. */
import type { Circular } from '@/services/circular.service';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { productCount } from '../hooks';
import { Meta } from '../panelUi';
import { fmtDate, statusChip } from '../shared';

const filesLabel = (c: Circular) =>
  !c.fileUrl
    ? 'Sin archivo'
    : (c.files?.length ?? 0) > 1
      ? `${c.files!.length} archivos (páginas)`
      : 'Con archivo';

export default function CircularSummary({
  circular,
  label,
  receivedFromCampaign,
  addingPages,
  disabled,
  onAppendPages,
}: {
  circular: Circular;
  label: string;
  /** Cuántos productos le pasó la campaña, si este circular los recibió de ella. */
  receivedFromCampaign: number | null;
  addingPages: boolean;
  disabled: boolean;
  onAppendPages: (files: File[]) => void;
}) {
  const n = productCount(circular);
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mr: 0.5, minWidth: 0, overflowWrap: 'anywhere' }}
        >
          {label}
        </Typography>
        <Chip
          size="small"
          {...statusChip(circular.status)}
        />
        {receivedFromCampaign !== null && (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            icon={<CampaignOutlinedIcon />}
            label={`Recibió ${receivedFromCampaign} de la campaña`}
          />
        )}
        {circular.fileKey === 'campaign' && (
          <Chip
            size="small"
            variant="outlined"
            label="Creado por la campaña"
          />
        )}
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        columnGap={2.5}
        rowGap={0.5}
        flexWrap="wrap"
        sx={{ mt: 1 }}
      >
        <Meta icon={<CalendarMonthRoundedIcon />}>
          {fmtDate(circular.startDate)} → {fmtDate(circular.endDate)}
        </Meta>
        <Meta icon={<Inventory2OutlinedIcon />}>
          {n} producto{n !== 1 ? 's' : ''}
        </Meta>
        <Meta icon={<DescriptionOutlinedIcon />}>{filesLabel(circular)}</Meta>
        {/* Llegaron páginas después (o alguna falló al subir): se agregan al final, una por
            request, ordenadas por nombre (1, 2, 3…). */}
        {circular.fileUrl && (
          <Button
            component="label"
            size="small"
            variant="text"
            disabled={disabled || addingPages}
          >
            {addingPages ? 'Agregando páginas…' : '+ Agregar páginas'}
            <input
              hidden
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = '';
                if (files.length) onAppendPages(files);
              }}
            />
          </Button>
        )}
      </Stack>
      {circular.status === 'draft' && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{ mt: 1.5, py: 0 }}
        >
          Borrador: no sale en el linktree. Sus productos se ven en las listas sólo si los cargas
          al catálogo.
        </Alert>
      )}
    </Box>
  );
}
