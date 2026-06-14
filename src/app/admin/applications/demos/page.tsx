'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import OndemandVideoRoundedIcon from '@mui/icons-material/OndemandVideoRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
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
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';
import { demoService, type DemoEntry } from '@/services/demo.service';

const STATUS_CHIP: Record<
  DemoEntry['status'],
  { label: string; color: 'success' | 'warning' | 'error' }
> = {
  ready:      { label: 'Listo',      color: 'success' },
  generating: { label: 'Generando…', color: 'warning' },
  error:      { label: 'Error',      color: 'error'   },
};

function demoUrl(id: string) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/demo/${id}`;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function DemoRow({ demo, onDelete }: { demo: DemoEntry; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const url = demoUrl(demo._id);
  const s = STATUS_CHIP[demo.status];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr auto', md: '1fr 90px auto' },
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Info */}
      <Box minWidth={0}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
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
  const [demos, setDemos]         = useState<DemoEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [open, setOpen]           = useState(false);
  const [name, setName]           = useState('');
  const [prompt, setPrompt]       = useState('');

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

  const ready = demos.filter((d) => d.status === 'ready').length;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 } }}>
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
          demos.map((d) => (
            <DemoRow key={d._id} demo={d} onDelete={handleDelete} />
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
    </Box>
  );
}
