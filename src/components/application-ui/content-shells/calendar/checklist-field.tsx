'use client';

import {
  calendarService,
  type ChecklistItem,
  type ChecklistStatus,
} from '@/services/calendar.service';
import { uploadTaskEvidence } from '@/services/upload.service';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const STATES: { v: ChecklistStatus; label: string; color: 'standard' | 'success' | 'error' }[] = [
  { v: 'pendiente', label: 'Pendiente', color: 'standard' },
  { v: 'listo', label: 'Listo', color: 'success' },
  { v: 'emergencia', label: 'Emergencia', color: 'error' },
];

const isImage = (url: string) => /\.(png|jpe?g|gif|webp|heic|avif)(\?|$)/i.test(url);

/**
 * Checklist de preparación de un evento: requerimientos libres o desde una plantilla
 * (editable: se guarda con el mismo nombre), cada uno Pendiente / Listo / Emergencia
 * y con evidencias (fotos o archivos). Los avisos los arma el backend al guardar.
 */
export function ChecklistField({
  value,
  onChange,
}: {
  value: ChecklistItem[];
  onChange: (v: ChecklistItem[]) => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const [lastTemplate, setLastTemplate] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['calendar', 'checklist-templates'],
    queryFn: calendarService.checklistTemplates,
    staleTime: 5 * 60_000,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['calendar', 'checklist-templates'] });
  const saveMut = useMutation({
    mutationFn: calendarService.saveChecklistTemplate,
    onSuccess: (t) => {
      refresh();
      setLastTemplate(t.name);
      toast.success(`Plantilla "${t.name}" guardada`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar la plantilla'),
  });
  const removeMut = useMutation({
    mutationFn: calendarService.removeChecklistTemplate,
    onSuccess: () => {
      refresh();
      toast.success('Plantilla borrada');
    },
  });

  const set = (i: number, patch: Partial<ChecklistItem>) =>
    onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const has = (label: string) => value.some((c) => c.label.toLowerCase() === label.toLowerCase());
  const add = (label: string) => {
    const l = label.trim();
    if (l && !has(l)) onChange([...value, { label: l, status: 'pendiente', evidence: [] }]);
    setDraft('');
  };
  const applyTemplate = (name: string, items: string[]) => {
    onChange([
      ...value,
      ...items.filter((l) => !has(l)).map((label) => ({ label, status: 'pendiente' as const, evidence: [] })),
    ]);
    setLastTemplate(name);
  };
  const saveAsTemplate = () => {
    const name = window.prompt(
      'Nombre de la plantilla (si ya existe, se reemplaza con estos puntos):',
      lastTemplate
    );
    if (name?.trim()) saveMut.mutate({ name: name.trim(), items: value.map((c) => c.label) });
  };
  const attach = async (i: number, files: FileList | null) => {
    if (!files?.length) return;
    setUploading(i);
    try {
      const urls = await Promise.all([...files].slice(0, 5).map(uploadTaskEvidence));
      set(i, { evidence: [...(value[i].evidence || []), ...urls].slice(0, 10) });
    } catch {
      toast.error('No se pudo subir la evidencia');
    } finally {
      setUploading(null);
    }
  };

  const ready = value.filter((c) => c.status === 'listo').length;

  return (
    <Stack spacing={1}>
      {/* Plantillas: un clic suma sus puntos; la ✕ borra la plantilla */}
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={0.75}
        alignItems="center"
      >
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Plantillas:
        </Typography>
        {templates.map((t) => (
          <Chip
            key={t._id}
            size="small"
            variant={lastTemplate === t.name ? 'filled' : 'outlined'}
            label={`${t.name} (${t.items.length})`}
            onClick={() => applyTemplate(t.name, t.items)}
            onDelete={() => {
              if (window.confirm(`¿Borrar la plantilla "${t.name}"?`)) removeMut.mutate(t._id);
            }}
          />
        ))}
        {value.length > 0 && (
          <Button
            size="small"
            startIcon={<SaveOutlinedIcon fontSize="small" />}
            onClick={saveAsTemplate}
            disabled={saveMut.isPending}
          >
            Guardar como plantilla
          </Button>
        )}
      </Stack>

      {value.length > 0 ? (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {ready} de {value.length} listos · una emergencia avisa al instante a todos los
          involucrados
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Elige una plantilla o escribe los requerimientos abajo.
        </Typography>
      )}

      {value.map((c, i) => (
        <Box
          // índice y no label: el label se edita y cambiar la key perdería el foco
          key={i}
          sx={{
            p: 1,
            border: 1,
            borderRadius: 1.5,
            borderColor: c.status === 'emergencia' ? 'error.main' : 'divider',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
          >
            <TextField
              variant="standard"
              size="small"
              value={c.label}
              onChange={(e) => set(i, { label: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { fontSize: 13, fontWeight: 600 } }}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={c.status}
              onChange={(_, v) => v && set(i, { status: v })}
            >
              {STATES.map((st) => (
                <ToggleButton
                  key={st.v}
                  value={st.v}
                  color={st.color}
                  sx={{ px: 1, py: 0.25, fontSize: 11 }}
                >
                  {st.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Tooltip title="Adjuntar evidencia (fotos o archivos)">
              <IconButton
                size="small"
                component="label"
                disabled={uploading === i}
              >
                {uploading === i ? (
                  <CircularProgress size={16} />
                ) : (
                  <AttachFileRoundedIcon fontSize="small" />
                )}
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    attach(i, e.target.files);
                    e.target.value = '';
                  }}
                />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              aria-label={`Quitar ${c.label}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          {c.status === 'emergencia' && (
            <TextField
              size="small"
              fullWidth
              placeholder="¿Qué pasa? (va en el aviso a todos)"
              value={c.note || ''}
              onChange={(e) => set(i, { note: e.target.value })}
              sx={{ mt: 1 }}
            />
          )}

          {(c.evidence?.length ?? 0) > 0 && (
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.75}
              sx={{ mt: 1 }}
            >
              {c.evidence!.map((url) => (
                <Box
                  key={url}
                  sx={{ position: 'relative' }}
                >
                  <Box
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      overflow: 'hidden',
                      color: 'text.secondary',
                    }}
                  >
                    {isImage(url) ? (
                      <Box
                        component="img"
                        src={url}
                        alt="Evidencia"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <InsertDriveFileOutlinedIcon />
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    aria-label="Quitar evidencia"
                    onClick={() =>
                      set(i, { evidence: (c.evidence || []).filter((u) => u !== url) })
                    }
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      p: 0.25,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ))}

      <Stack
        direction="row"
        spacing={1}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Agregar requerimiento (ej. Permiso del dueño)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            }
          }}
        />
        <Button
          size="small"
          onClick={() => add(draft)}
          disabled={!draft.trim()}
        >
          Agregar
        </Button>
      </Stack>
    </Stack>
  );
}
