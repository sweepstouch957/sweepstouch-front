'use client';

import { taskClient } from '@/services/task.service';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

/**
 * "¿Cómo va RCS?" — busca un tema en TODO Cowork (títulos, descripciones, tags,
 * notas de avance, criterio de cierre, responsable y proyectos) y arma el mismo
 * reporte que manda el bot, con su PDF descargable.
 */
export function TopicReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ data: any; pdfUrl: string } | null>(null);

  async function run() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await taskClient.getTopicReport(q);
      setResult(res);
    } catch (e: any) {
      setResult(null);
      setError(e?.response?.data?.error || 'No se pudo armar el reporte');
    } finally {
      setLoading(false);
    }
  }

  const t = result?.data?.totals;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Reporte por tema</DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          autoFocus
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="rcs, nsa, promotoras, kiosko, evento…"
          helperText="Busca en títulos, descripciones, tags, avances, criterios de cierre, responsables y proyectos."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, opacity: 0.5 }} />
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Typography
            variant="caption"
            color="error.main"
            sx={{ mt: 1, display: 'block' }}
          >
            {error}
          </Typography>
        )}

        {t && (
          <Box mt={2}>
            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
              mb={1.5}
            >
              <Chip size="small" label={`${t.total} tareas`} />
              <Chip size="small" color="success" variant="outlined" label={`${t.done} cerradas (${t.progress}%)`} />
              <Chip size="small" label={`${t.active} activas`} />
              {t.overdue > 0 && <Chip size="small" color="error" label={`${t.overdue} vencidas`} />}
              {t.blocked > 0 && <Chip size="small" color="error" variant="outlined" label={`${t.blocked} bloqueadas`} />}
            </Stack>

            {result.data.projects?.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={1}
              >
                Proyectos: {result.data.projects.map((p: any) => p.name).join(', ')}
              </Typography>
            )}

            {t.total === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                No hay nada registrado con ese tema. Si el trabajo existe pero no está en Cowork, no se
                puede priorizar ni apoyar.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {result.data.byAssignee.slice(0, 6).map((a: any) => (
                  <Stack
                    key={a.name}
                    direction="row"
                    justifyContent="space-between"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.text.primary, 0.03),
                    }}
                  >
                    <Typography fontSize={12}>{a.name}</Typography>
                    <Typography
                      fontSize={12}
                      color="text.secondary"
                    >
                      {a.active} activas · {a.done} cerradas
                      {a.overdue > 0 ? ` · ${a.overdue} vencidas` : ''}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Cerrar
        </Button>
        {result && t?.total > 0 && (
          <Button
            startIcon={<DownloadRoundedIcon />}
            onClick={() => window.open(result.pdfUrl, '_blank', 'noopener')}
            sx={{ borderRadius: 1.5, textTransform: 'none' }}
          >
            Descargar PDF
          </Button>
        )}
        <Button
          variant="contained"
          disableElevation
          onClick={run}
          disabled={!query.trim() || loading}
          startIcon={loading ? <CircularProgress size={14} /> : undefined}
          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
        >
          {loading ? 'Buscando…' : 'Ver cómo va'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
