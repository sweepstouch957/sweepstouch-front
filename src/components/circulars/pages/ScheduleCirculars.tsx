'use client';

/* eslint-disable react/jsx-max-props-per-line */
import {
  circularService,
  inferStoreSlugFromFilename,
  inferTitleFromFilename,
  type Circular,
} from '@services/circular.service';
import {
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
  IconButton,
  Modal,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useMemo, useState } from 'react';
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
          file: undefined,
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
          file: undefined,
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

  const setRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  async function saveRow(r: Row) {
    // Validaciones
    if (!r.storeSlug) return setRow(r.id, { error: 'Falta storeSlug' });
    if (!r.startDate || !r.endDate) return setRow(r.id, { error: 'Selecciona rango de fechas' });
    if (r.file && r.error) return; // por ejemplo error de tamaño/slug

    try {
      setRow(r.id, { uploading: true, error: null });

      const payloadRange = {
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
      };

      let result: { ok: boolean; circular: Circular };

      if (r.file) {
        // Sube y agenda en una sola acción
        result = await circularService.upload({
          file: r.file,
          storeSlug: r.storeSlug,
          startDate: payloadRange.startDate,
          endDate: payloadRange.endDate,
          title: r.title || undefined,
        });
      } else {
        // Agenda sin archivo
        result = await circularService.schedule({
          storeSlug: r.storeSlug,
          startDate: payloadRange.startDate,
          endDate: payloadRange.endDate,
          title: r.title || undefined,
        });
      }

      const status = result.circular.status;
      setRow(r.id, { uploading: false, saved: true, status });
      setSnack({ open: true, msg: `Circular guardado para ${r.storeSlug}`, sev: 'success' });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error guardando circular';
      setRow(r.id, { uploading: false, error: msg });
      setSnack({ open: true, msg, sev: 'error' });
    }
  }

  async function saveAll() {
    for (const r of rows) {
      // Saltar ya guardados
      if (r.saved) continue;
      await saveRow(r);
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}
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

          <Box sx={{ display: 'flex', gap: 1 }}>
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
          </Box>
        </Box>

        {/* File Uploader */}
        <Box sx={{ mb: 4 }}>
          <FileUploader
            // tu FileUploader debe aceptar solo PDFs; si no, aquí filtra igual
            uploadedFiles={[]}
            onFileUpload={handleFileUpload}
            accept="application/pdf,.pdf"
            icon={<UploadIcon />}
            helpText={`Arrastra PDFs (máx ${MAX_MB}MB) — el nombre debe traer el slug de tienda`}
          />
        </Box>

        {/* Tabla de gestión */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: '#2D3748' }}
            >
              Circular Schedule Management
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STORE</TableCell>
                  <TableCell width={220}>START DATE</TableCell>
                  <TableCell width={220}>END DATE</TableCell>
                  <TableCell>TITLE</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell align="center">ACCIONES</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Sube archivos o crea filas manualmente para agendar circulares.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#E91E63',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          {row.storeSlug ? row.storeSlug.slice(0, 2).toUpperCase() : '??'}
                        </Avatar>
                        <Box sx={{ minWidth: 220 }}>
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
                          />
                          {row.file ? (
                            <Typography
                              variant="caption"
                              sx={{ color: '#718096' }}
                            >
                              {row.file.name}
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{ color: '#718096' }}
                            >
                              (Sin archivo — se agenda solo fechas)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <DatePicker
                        label="Start Date"
                        value={row.startDate}
                        onChange={(v) => setRow(row.id, { startDate: v ?? null })}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </TableCell>

                    <TableCell>
                      <DatePicker
                        label="End Date"
                        value={row.endDate}
                        onChange={(v) => setRow(row.id, { endDate: v ?? null })}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        label="Title"
                        value={row.title}
                        onChange={(e) => setRow(row.id, { title: e.target.value })}
                        fullWidth
                      />
                    </TableCell>

                    <TableCell>
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

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Guardar fila">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SaveIcon fontSize="small" />}
                              disabled={row.uploading}
                              onClick={() => saveRow(row)}
                            >
                              {row.uploading ? 'Guardando...' : 'Guardar'}
                            </Button>
                          </span>
                        </Tooltip>

                        <IconButton
                          size="small"
                          sx={{ color: '#718096' }}
                          onClick={() => removeRow(row.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {row.error ? (
                        <Typography
                          variant="caption"
                          color="error"
                        >
                          {row.error}
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
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
              maxWidth: 600,
              width: '90%',
              borderRadius: 3,
              p: 4,
              position: 'relative',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: '#2D3748' }}
              >
                Instructions
              </Typography>
              <IconButton
                onClick={() => setShowInstructions(false)}
                sx={{ color: '#718096' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {instructionsContent.map((instruction, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{ color: '#2D3748', mb: 1.2 }}
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
    </LocalizationProvider>
  );
}
