'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import OndemandVideoRoundedIcon from '@mui/icons-material/OndemandVideoRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { demoService, type DemoEntry } from '@/services/demo.service';

const STATUS_CHIP: Record<
  DemoEntry['status'],
  { label: string; color: 'success' | 'warning' | 'error' }
> = {
  ready:      { label: 'Listo',      color: 'success' },
  generating: { label: 'Generando…', color: 'warning' },
  error:      { label: 'Error',      color: 'error'   },
};

const FEATURED_DEMO_NAME = 'plataforma de mensajeria multicanal';

function normalizeDemoName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isFeaturedDemo(demo: DemoEntry) {
  return normalizeDemoName(demo.name) === FEATURED_DEMO_NAME;
}

function demoUrl(id: string) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/demo/${id}`;
}

function DemoPreview({ demo }: { demo: DemoEntry }) {
  const [html, setHtml] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    setHtml('');
    setFailed(false);

    if (demo.status !== 'ready') return undefined;

    demoService
      .getPublic(demo._id)
      .then((d) => {
        if (active) setHtml(d.html ?? '');
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [demo._id, demo.status, demo.updatedAt]);

  const shellSx = {
    width: { xs: 112, sm: 168, md: 220 },
    aspectRatio: '16 / 10',
    borderRadius: 1.25,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: '#f8f9fa',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  } as const;

  if (demo.status === 'generating') {
    return (
      <Box sx={{ ...shellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress
          size={18}
          thickness={5}
          sx={{ color: 'warning.main' }}
        />
      </Box>
    );
  }

  if (demo.status === 'error' || failed) {
    return (
      <Box sx={{ ...shellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ErrorOutlineRoundedIcon sx={{ color: 'error.main', fontSize: 20 }} />
      </Box>
    );
  }

  return (
    <Box sx={shellSx}>
      {html ? (
        <Box
          component="iframe"
          srcDoc={html}
          title={`Preview de ${demo.name}`}
          sandbox="allow-scripts allow-forms allow-popups"
          sx={{
            width: { xs: 448, sm: 672, md: 880 },
            height: { xs: 280, sm: 420, md: 550 },
            border: 0,
            display: 'block',
            pointerEvents: 'none',
            transform: 'scale(0.25)',
            transformOrigin: 'top left',
          }}
        />
      ) : (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress
            size={16}
            thickness={5}
            sx={{ color: '#ef0f82' }}
          />
        </Box>
      )}
    </Box>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  demo: DemoEntry;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: DemoEntry) => void;
}

function EditDialog({ demo, open, onClose, onSaved }: EditDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [name, setName] = useState(demo.name);
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState('');
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch full HTML when dialog opens
  useEffect(() => {
    if (!open) return;
    setName(demo.name);
    setLoadingHtml(true);
    demoService
      .getPublic(demo._id)
      .then((d) => {
        const h = d.html ?? '';
        setHtml(h);
        setPreview(h);
      })
      .catch(() => setHtml(''))
      .finally(() => setLoadingHtml(false));
  }, [open, demo._id, demo.name]);

  // Debounce preview — update iframe 400ms after user stops typing
  const handleHtmlChange = (val: string) => {
    setHtml(val);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreview(val), 400);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await demoService.update(demo._id, {
        name: name.trim(),
        generatedHtml: html,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          height: fullScreen ? '100%' : '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 0.5, flexShrink: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <EditRoundedIcon sx={{ color: '#ef0f82', fontSize: 20 }} />
          <span>Editar demo</span>
        </Stack>
      </DialogTitle>
      <Divider />

      <DialogContent
        sx={{
          p: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left — editor */}
        <Box
          sx={{
            width: { xs: '100%', md: '42%' },
            borderRight: { md: '1px solid' },
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              disabled={saving}
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {loadingHtml ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={24} sx={{ color: '#ef0f82' }} />
              </Box>
            ) : (
              <textarea
                value={html}
                onChange={(e) => handleHtmlChange(e.target.value)}
                disabled={saving}
                placeholder="Pega o escribe el HTML de la demo aquí…"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  padding: '12px 14px',
                  fontFamily: '"Fira Code", "Cascadia Code", "Courier New", monospace',
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: '#1a1a2e',
                  background: '#f8f9ff',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.paper',
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              {html.length.toLocaleString('es')} caracteres
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Preview se actualiza al soltar el teclado
            </Typography>
          </Box>
        </Box>

        {/* Right — live preview */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
            height: { xs: 320, md: 'auto' },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Vista previa en tiempo real
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {preview ? (
              <iframe
                srcDoc={preview}
                title="Preview"
                sandbox="allow-scripts allow-forms allow-popups"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="caption" color="text.disabled">
                  {loadingHtml ? 'Cargando HTML…' : 'El preview aparece aquí'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} size="small">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loadingHtml || !name.trim()}
          size="small"
          startIcon={saving ? <CircularProgress size={14} thickness={5} sx={{ color: 'inherit' }} /> : <CheckRoundedIcon fontSize="small" />}
          sx={{ bgcolor: '#ef0f82', '&:hover': { bgcolor: '#d40e75' }, fontWeight: 700, px: 2.5 }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function DemoRow({
  demo,
  onDelete,
  onEdit,
}: {
  demo: DemoEntry;
  onDelete: (id: string) => void;
  onEdit: (demo: DemoEntry) => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = demoUrl(demo._id);
  const s = STATUS_CHIP[demo.status];
  const featured = isFeaturedDemo(demo);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'auto minmax(0, 1fr) auto', md: 'auto minmax(0, 1fr) 70px auto' },
        alignItems: 'center',
        gap: { xs: 1.5, sm: 2.25 },
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.75, sm: 2.25 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <DemoPreview demo={demo} />

      {/* Info */}
      <Box minWidth={0}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
          {(demo.pinned || featured) && (
            <PushPinRoundedIcon sx={{ fontSize: 14, color: '#ef0f82', flexShrink: 0 }} />
          )}
          <Typography variant="body2" fontWeight={700} noWrap>
            {demo.name}
          </Typography>
          <Chip
            label={s.label}
            color={s.color}
            size="small"
            sx={{ fontSize: 10, height: 18, flexShrink: 0 }}
          />
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {demo.prompt}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="caption" color="text.disabled">
            {formatDistanceToNow(new Date(demo.createdAt), { addSuffix: true, locale: es })}
          </Typography>
          {demo.views > 0 && (
            <Typography variant="caption" color="text.disabled">
              · {demo.views} vista{demo.views !== 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Status indicator (desktop) */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
        {demo.status === 'generating' ? (
          <CircularProgress size={16} thickness={5} sx={{ color: 'warning.main' }} />
        ) : demo.status === 'error' ? (
          <ErrorOutlineRoundedIcon fontSize="small" color="error" />
        ) : null}
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={0.25} alignItems="center">
        {demo.status === 'ready' && (
          <>
            <Tooltip title="Editar HTML">
              <IconButton
                size="small"
                onClick={() => onEdit(demo)}
                sx={{ color: 'text.secondary' }}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={copied ? 'Copiado' : 'Copiar enlace'}>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ color: copied ? 'success.main' : 'text.secondary' }}
              >
                {copied ? (
                  <CheckRoundedIcon fontSize="small" />
                ) : (
                  <ContentCopyRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Abrir demo">
              <IconButton
                size="small"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                sx={{ color: '#ef0f82' }}
              >
                <OpenInNewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="Eliminar">
          <IconButton
            size="small"
            onClick={() => onDelete(demo._id)}
            sx={{ color: 'text.disabled' }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemosPage() {
  const [demos, setDemos]           = useState<DemoEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [open, setOpen]             = useState(false);
  const [name, setName]             = useState('');
  const [prompt, setPrompt]         = useState('');
  const [editTarget, setEditTarget] = useState<DemoEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await demoService.list();
      setDemos(data);
    } catch {
      /* silenciar */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim()) return;
    setGenerating(true);
    try {
      const created = await demoService.create({ name: name.trim(), prompt: prompt.trim() });
      setDemos((prev) => [created, ...prev]);
      setName('');
      setPrompt('');
      setOpen(false);
    } catch (e: any) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await demoService.delete(id);
    setDemos((prev) => prev.filter((d) => d._id !== id));
  };

  const handleSaved = (updated: DemoEntry) => {
    setDemos((prev) => prev.map((d) => (d._id === updated._id ? { ...d, ...updated } : d)));
  };

  const sortedDemos = useMemo(
    () =>
      demos
        .map((demo, index) => ({ demo, index }))
        .sort((a, b) => {
          const aFeatured = isFeaturedDemo(a.demo);
          const bFeatured = isFeaturedDemo(b.demo);

          if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
          if (a.demo.pinned !== b.demo.pinned) return a.demo.pinned ? -1 : 1;

          return a.index - b.index;
        })
        .map(({ demo }) => demo),
    [demos],
  );

  const ready = demos.filter((d) => d.status === 'ready').length;

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha('#ef0f82', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <OndemandVideoRoundedIcon sx={{ color: '#ef0f82', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              Demos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {ready} listo{ready !== 1 ? 's' : ''} · {demos.length} total
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <IconButton size="small" onClick={load} disabled={loading}>
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setOpen(true)}
            sx={{ bgcolor: '#ef0f82', '&:hover': { bgcolor: '#d40e75' }, fontWeight: 700 }}
          >
            Nueva demo
          </Button>
        </Stack>
      </Stack>

      {/* List */}
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} sx={{ color: '#ef0f82' }} />
          </Box>
        ) : demos.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <AutoAwesomeRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Aún no hay demos
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Crea uno con el botón de arriba — la IA genera la página completa.
            </Typography>
          </Box>
        ) : (
          sortedDemos.map((d) => (
            <DemoRow key={d._id} demo={d} onDelete={handleDelete} onEdit={setEditTarget} />
          ))
        )}
      </Box>

      <Typography variant="caption" color="text.disabled" display="block" mt={1.5} px={0.5}>
        Los demos son públicos — cualquiera con el enlace puede verlos sin iniciar sesión.
      </Typography>

      {/* Dialog: nueva demo */}
      <Dialog
        open={open}
        onClose={() => !generating && setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesomeRoundedIcon sx={{ color: '#ef0f82', fontSize: 20 }} />
            <span>Nueva demo con IA</span>
          </Stack>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombre de la demo"
            placeholder="Ej. Landing para Supermercado García"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            disabled={generating}
          />
          <TextField
            label="Descripción de lo que quieres generar"
            placeholder={`Ejemplos:\n• Una landing page moderna para un supermercado hispano, con sección hero, beneficios, testimonios y CTA de contacto.\n• Un dashboard de métricas de campaña con tarjetas de KPI, gráfico de barras mensual y tabla de top tiendas.\n• Una página de precios con 3 planes: Starter, Pro, Enterprise.`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={5}
            disabled={generating}
            inputProps={{ style: { fontSize: 13, lineHeight: 1.6 } }}
          />

          {generating && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha('#ef0f82', 0.05),
                border: '1px solid',
                borderColor: alpha('#ef0f82', 0.2),
              }}
            >
              <CircularProgress size={16} thickness={5} sx={{ color: '#ef0f82', flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">
                Claude está generando la página… puede tardar 10–30 segundos.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setOpen(false)}
            size="small"
            disabled={generating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!name.trim() || !prompt.trim() || generating}
            size="small"
            startIcon={
              generating ? (
                <CircularProgress size={14} thickness={5} sx={{ color: 'inherit' }} />
              ) : (
                <AutoAwesomeRoundedIcon fontSize="small" />
              )
            }
            sx={{ bgcolor: '#ef0f82', '&:hover': { bgcolor: '#d40e75' }, fontWeight: 700, px: 2.5 }}
          >
            {generating ? 'Generando…' : 'Generar con IA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: editar demo */}
      {editTarget && (
        <EditDialog
          demo={editTarget}
          open={Boolean(editTarget)}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </Box>
  );
}
