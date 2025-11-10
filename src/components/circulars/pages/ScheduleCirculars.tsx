'use client';

/* eslint-disable react/jsx-max-props-per-line */
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Help as HelpIcon,
  Save as SaveIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Modal,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  circularService,
  inferStoreSlugFromFilename,
  inferTitleFromFilename,
  type Circular,
} from '@services/circular.service';
import React, { useState } from 'react';
import { FileUploader } from '../FileUploader';
import { StatusBadge } from '../StatusBadge';

type Row = {
  id: string;
  storeSlug: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  file?: File;
  uploading?: boolean;
  saved?: boolean;
  status?: Circular['status'];
  error?: string | null;
};

const MAX_MB = 10;

export function ScheduleCirculars() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: 'success' | 'error' | 'info';
  }>({
    open: false,
    msg: '',
    sev: 'success',
  });

  const instructionsContent = [
    'Sube PDFs con el drag & drop (máximo 10MB por archivo).',
    'El nombre del archivo DEBE incluir el slug de la tienda (ej: new-rochelle.pdf).',
    'Configura fecha de inicio y fin por cada fila.',
    'Puedes Guardar por fila o usar Guardar Todo.',
    'Si no adjuntas archivo, puedes agendar solo con fechas y slug (adjunta luego).',
  ];

  // Helpers
  const prettySize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const setRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  // FileUploader (no se modifica el componente; filtramos aquí)
  const handleFileUpload = (files: File[]) => {
    const newRows: Row[] = [];

    for (const f of files) {
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      const tooBig = f.size > MAX_MB * 1024 * 1024;

      if (!isPdf) {
        newRows.push({
          id: crypto.randomUUID(),
          storeSlug: '',
          title: f.name,
          startDate: null,
          endDate: null,
          error: 'El archivo no es PDF',
        });
        continue;
      }

      if (tooBig) {
        newRows.push({
          id: crypto.randomUUID(),
          storeSlug: '',
          title: f.name,
          startDate: null,
          endDate: null,
          error: `El archivo supera ${MAX_MB}MB`,
        });
        continue;
      }

      const slug = inferStoreSlugFromFilename(f.name);
      const title = inferTitleFromFilename(f.name);

      newRows.push({
        id: crypto.randomUUID(),
        storeSlug: slug ?? '',
        title,
        startDate: null,
        endDate: null,
        file: f,
        error: slug ? null : 'No se pudo inferir el storeSlug desde el nombre',
      });
    }

    setRows((prev) => [...newRows, ...prev]);
  };

  // Guardados
  async function saveRow(r: Row) {
    if (!r.storeSlug) return setRow(r.id, { error: 'Falta storeSlug' });
    if (!r.startDate || !r.endDate) return setRow(r.id, { error: 'Selecciona rango de fechas' });
    if (r.file && r.error) return;

    try {
      setRow(r.id, { uploading: true, error: null });

      const payloadRange = {
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
      };

      let result: { ok: boolean; circular: Circular };

      if (r.file) {
        result = await circularService.upload({
          file: r.file,
          storeSlug: r.storeSlug,
          startDate: payloadRange.startDate,
          endDate: payloadRange.endDate,
          title: r.title || undefined,
        });
      } else {
        result = await circularService.schedule({
          storeSlug: r.storeSlug,
          startDate: payloadRange.startDate,
          endDate: payloadRange.endDate,
          title: r.title || undefined,
        });
      }

      setRow(r.id, { uploading: false, saved: true, status: result.circular.status });
      setSnack({ open: true, msg: `Circular guardado para ${r.storeSlug}`, sev: 'success' });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Error guardando circular';
      setRow(r.id, { uploading: false, error: msg });
      setSnack({ open: true, msg, sev: 'error' });
    }
  }

  async function saveAll() {
    for (const r of rows) {
      if (r.saved) continue;
      // eslint-disable-next-line no-await-in-loop
      await saveRow(r);
    }
  }

  function addEmptyRow() {
    setRows((prev) => [
      {
        id: crypto.randomUUID(),
        storeSlug: '',
        title: '',
        startDate: null,
        endDate: null,
      },
      ...prev,
    ]);
  }

  return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: '#1A202C', mb: 0.25 }}
            >
              Schedule Circulars
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: '#718096' }}
            >
              Upload and manage circular files
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
          >
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addEmptyRow}
            >
              Nueva fila
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={saveAll}
            >
              Guardar Todo
            </Button>
            <Button
              variant="contained"
              startIcon={<HelpIcon />}
              onClick={() => setShowInstructions(true)}
              sx={{ backgroundColor: '#E91E63', '&:hover': { backgroundColor: '#AD1457' } }}
            >
              Instructions
            </Button>
          </Stack>
        </Box>

        {/* Uploader Card */}
        <Paper
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            mb: 3,
            border: '1px solid #EDF2F7',
          }}
          elevation={0}
        >
          <Toolbar
            sx={{
              px: 3,
              py: 2,
              minHeight: 56,
              borderBottom: '1px solid #EDF2F7',
              bgcolor: '#FAFAFB',
              display: 'flex',
              gap: 1.5,
            }}
          >
            <UploadIcon sx={{ color: '#64748B' }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: '#2D3748' }}
            >
              Subir PDFs (drag & drop)
            </Typography>
            <Chip
              label={`Máx ${MAX_MB}MB`}
              size="small"
              sx={{ ml: 'auto', bgcolor: '#F1F5F9', color: '#334155', fontWeight: 600 }}
            />
          </Toolbar>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <FileUploader
              uploadedFiles={[]}
              onFileUpload={handleFileUpload}
            />
            <Divider sx={{ mt: 2 }} />
            <Typography
              variant="caption"
              sx={{ color: '#64748B', display: 'block', mt: 1.5 }}
            >
              Tip: el nombre del archivo debe incluir el <b>slug</b> de la tienda (ej.{' '}
              <i>new-rochelle.pdf</i>) para auto-rellenar la columna.
            </Typography>
          </Box>
        </Paper>

        {/* Tabla de gestión */}
        <Paper
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #EDF2F7',
          }}
          elevation={0}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #EDF2F7', bgcolor: '#FAFAFB' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#2D3748' }}
            >
              Circular Schedule Management
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 560 }}>
            <Table
              stickyHeader
              size="medium"
              sx={{ '& td, & th': { borderBottomColor: '#F1F5F9' } }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STORE</TableCell>
                  <TableCell sx={{ width: 220, fontWeight: 700, color: '#475569' }}>
                    START DATE
                  </TableCell>
                  <TableCell sx={{ width: 220, fontWeight: 700, color: '#475569' }}>
                    END DATE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>TITLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, color: '#475569' }}
                  >
                    ACCIONES
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{ py: 6 }}
                    >
                      <Stack
                        spacing={1}
                        alignItems="center"
                        sx={{ color: '#64748B' }}
                      >
                        <UploadIcon />
                        <Typography variant="body2">
                          Sube archivos o crea filas manualmente para agendar circulares.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((row) => {
                  const hasCoreError =
                    !!row.error && row.error !== 'No se pudo inferir el storeSlug desde el nombre';
                  const needsSlug = !row.storeSlug;

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': { bgcolor: '#FCFCFD' },
                        position: 'relative',
                      }}
                    >
                      {/* uploading bar */}
                      {row.uploading ? (
                        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
                          <LinearProgress />
                        </Box>
                      ) : null}

                      <TableCell sx={{ py: 2 }}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: needsSlug ? '#F59E0B' : '#E91E63',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                            }}
                          >
                            {row.storeSlug ? row.storeSlug.slice(0, 2).toUpperCase() : '??'}
                          </Avatar>

                          <Box sx={{ minWidth: 260 }}>
                            <TextField
                              size="small"
                              label="Store Slug"
                              value={row.storeSlug}
                              onChange={(e) =>
                                setRow(row.id, {
                                  storeSlug: e.target.value.trim().toLowerCase(),
                                  error: null,
                                })
                              }
                              fullWidth
                              error={needsSlug}
                              helperText={needsSlug ? 'Requerido' : ' '}
                            />

                            {row.file ? (
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mt: 0.25 }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#64748B',
                                    maxWidth: 260,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={row.file.name}
                                >
                                  {row.file.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={prettySize(row.file.size)}
                                  sx={{ bgcolor: '#F1F5F9', color: '#334155' }}
                                />
                              </Stack>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{ color: '#94A3B8' }}
                              >
                                (Sin archivo — solo fechas)
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <DatePicker
                          label="Start Date"
                          value={row.startDate}
                          onChange={(v) => setRow(row.id, { startDate: v ?? null })}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <DatePicker
                          label="End Date"
                          value={row.endDate}
                          onChange={(v) => setRow(row.id, { endDate: v ?? null })}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <TextField
                          size="small"
                          label="Title"
                          value={row.title}
                          onChange={(e) => setRow(row.id, { title: e.target.value })}
                          fullWidth
                        />
                        {/* hint cuando no pudo inferir slug */}
                        {row.error && !hasCoreError ? (
                          <Typography
                            variant="caption"
                            sx={{ color: '#B45309' }}
                          >
                            {row.error}
                          </Typography>
                        ) : null}
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        {row.status ? (
                          <StatusBadge status={row.status} />
                        ) : row.saved ? (
                          <StatusBadge status="scheduled" />
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ py: 2, minWidth: 220 }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="Guardar fila">
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon fontSize="small" />}
                                disabled={row.uploading}
                                onClick={() => saveRow(row)}
                                sx={{ textTransform: 'none' }}
                              >
                                {row.uploading ? 'Guardando…' : 'Guardar'}
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip title="Eliminar fila">
                            <span>
                              <IconButton
                                size="small"
                                sx={{ color: '#64748B' }}
                                onClick={() => removeRow(row.id)}
                                disabled={row.uploading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>

                        {hasCoreError ? (
                          <Typography
                            variant="caption"
                            sx={{ color: '#DC2626', display: 'block', mt: 0.75 }}
                          >
                            {row.error}
                          </Typography>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modal instrucciones */}
        <Modal
          open={showInstructions}
          onClose={() => setShowInstructions(false)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Paper
            sx={{
              maxWidth: 640,
              width: '90%',
              borderRadius: 3,
              p: 4,
              position: 'relative',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: '#1F2937' }}
              >
                Instructions
              </Typography>
              <IconButton
                onClick={() => setShowInstructions(false)}
                sx={{ color: '#6B7280' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {instructionsContent.map((instruction, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{ color: '#374151', mb: 1.2 }}
              >
                • {instruction}
              </Typography>
            ))}
          </Paper>
        </Modal>

        <Snackbar
          open={snack.open}
          autoHideDuration={3500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.sev}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
  );
}
