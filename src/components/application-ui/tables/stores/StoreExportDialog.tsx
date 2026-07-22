'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  DEFAULT_EXPORT_KEYS,
  STORE_EXPORT_FIELDS,
  STORE_EXPORT_GROUPS,
} from './storeExport';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Recibe las columnas elegidas; resuelve cuando el archivo terminó. */
  onExport: (keys: string[]) => Promise<void>;
};

export function StoreExportDialog({ open, onClose, onExport }: Props) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string[]>(DEFAULT_EXPORT_KEYS);
  const [exporting, setExporting] = useState(false);

  const total = STORE_EXPORT_FIELDS.length;
  const count = selected.length;

  const byGroup = useMemo(
    () =>
      STORE_EXPORT_GROUPS.map((group) => ({
        group,
        fields: STORE_EXPORT_FIELDS.filter((f) => f.group === group),
      })),
    []
  );

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const toggleGroup = (groupKeys: string[]) => {
    const allOn = groupKeys.every((k) => selected.includes(k));
    setSelected((prev) =>
      allOn
        ? prev.filter((k) => !groupKeys.includes(k))
        : Array.from(new Set([...prev, ...groupKeys]))
    );
  };

  const handleExport = async () => {
    if (!count || exporting) return;
    setExporting(true);
    try {
      await onExport(selected);
      onClose();
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={exporting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="div" fontSize={17} fontWeight={800}>
          Exportar tiendas
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Elige las columnas del archivo. Se exportan todas las tiendas, sin importar los filtros de pantalla.
        </Typography>
      </DialogTitle>

      <Divider />

      {/* Barra de selección */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 3, py: 1.25, gap: 1, flexWrap: 'wrap' }}
      >
        <Chip
          size="small"
          label={`${count} de ${total} columnas`}
          variant="outlined"
          color={count ? 'primary' : 'default'}
          sx={{ fontSize: 11, fontWeight: 700, height: 26 }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          onClick={() => setSelected(STORE_EXPORT_FIELDS.map((f) => f.key))}
          sx={{ fontSize: 12, fontWeight: 700, minWidth: 0 }}
        >
          Todo
        </Button>
        <Button
          size="small"
          color="inherit"
          onClick={() => setSelected([])}
          sx={{ fontSize: 12, fontWeight: 700, minWidth: 0, color: 'text.secondary' }}
        >
          Ninguno
        </Button>
        <Button
          size="small"
          color="inherit"
          onClick={() => setSelected(DEFAULT_EXPORT_KEYS)}
          sx={{ fontSize: 12, fontWeight: 700, minWidth: 0, color: 'text.secondary' }}
        >
          Sugeridas
        </Button>
      </Stack>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={2}>
          {byGroup.map(({ group, fields }) => {
            const groupKeys = fields.map((f) => f.key);
            const allOn = groupKeys.every((k) => selected.includes(k));
            return (
              <Box key={group}>
                <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                    }}
                  >
                    {group}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small"
                    onClick={() => toggleGroup(groupKeys)}
                    sx={{ fontSize: 11, fontWeight: 700, minWidth: 0, py: 0 }}
                  >
                    {allOn ? 'Quitar' : 'Todas'}
                  </Button>
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    columnGap: 1,
                  }}
                >
                  {fields.map((f) => (
                    <FormControlLabel
                      key={f.key}
                      sx={{
                        m: 0,
                        borderRadius: 1.5,
                        px: 0.5,
                        '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.03) },
                        '& .MuiFormControlLabel-label': { fontSize: 13 },
                      }}
                      control={
                        <Checkbox
                          size="small"
                          checked={selected.includes(f.key)}
                          onChange={() => toggle(f.key)}
                        />
                      }
                      label={f.label}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 1.75, gap: 1 }}>
        <Button onClick={onClose} disabled={exporting} color="inherit" sx={{ fontWeight: 700 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!count || exporting}
          startIcon={
            exporting ? (
              <CircularProgress size={15} color="inherit" />
            ) : (
              <FileDownloadOutlinedIcon fontSize="small" />
            )
          }
          sx={{ fontWeight: 700 }}
        >
          {exporting ? 'Exportando…' : `Exportar ${count || ''}`.trim()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StoreExportDialog;
