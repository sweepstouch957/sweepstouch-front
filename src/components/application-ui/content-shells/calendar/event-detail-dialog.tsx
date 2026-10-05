'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import {
  EVENT_TYPES,
  fmtNum,
  longDate,
  PARTICIPANT_SOURCE_LABEL,
  SOURCE_LABEL,
  STATUS_LABEL,
  statusColor,
  timeRange,
} from './constants';

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNotify: () => void;
  onOpenLink: (link: string) => void;
  notifying: boolean;
}

function downloadReport(e: CalendarEvent) {
  const x = (s: unknown) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const tiendas = e.stores
    .map(
      (s) =>
        `${s.storeName}${s.storeAddress ? ` — ${s.storeAddress}` : ''}${s.confirmed ? ' ✓' : ''}`
    )
    .join('\n');
  const html =
    `<!doctype html><html lang="es"><meta charset="utf-8"><title>Reporte · ${x(
      e.title
    )}</title><body style="font-family:Helvetica,Arial,sans-serif;color:#231F20;max-width:760px;margin:32px auto;padding:0 20px">` +
    `<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FC0C83">Sweepstouch · Reporte de evento</div>` +
    `<h1 style="margin:6px 0 4px">${x(e.title)}</h1><div style="color:#6B6366">${x(longDate(e))}${
      timeRange(e) ? ` · ${x(timeRange(e))}` : ''
    } · ${x(EVENT_TYPES[e.type]?.label || e.type)}</div>` +
    `<div style="margin:24px 0;padding:18px;border:1px solid #CFE3D6;background:#F4FAF6;border-radius:10px"><div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#1F5A36">Números registrados</div><div style="font-size:40px;font-weight:700;color:#1F5A36">${x(
      e.report?.numbers != null ? fmtNum(e.report.numbers) : '—'
    )}</div></div>` +
    `<h3>Lo lleva</h3><p>${x(e.ownerName || '—')}${
      e.departmentName ? ` (${x(e.departmentName)})` : ''
    }</p>` +
    `<h3>Tiendas</h3><p style="white-space:pre-line">${x(
      tiendas || 'Todas las tiendas de la red'
    )}</p>` +
    (e.description
      ? `<h3>Descripción</h3><p style="white-space:pre-wrap">${x(e.description)}</p>`
      : '') +
    `<h3>Resultados / observaciones</h3><p style="white-space:pre-wrap">${x(
      e.report?.note || 'Sin observaciones.'
    )}</p>` +
    ((e.report?.evidence || []).length
      ? `<h3>Evidencias (${
          e.report!.evidence.length
        })</h3><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">${e
          .report!.evidence.map((u) => `<img src="${x(u)}" style="width:100%;border-radius:8px">`)
          .join('')}</div>`
      : '') +
    `<p style="margin-top:32px;font-size:12px;color:#6B6366">Generado ${new Date(
      e.report?.at || Date.now()
    ).toLocaleString('es-US')}</p></body></html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = `reporte-${e.date}-${e.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)}.html`;
  a.click();
}

export function EventDetailDialog({
  event: e,
  onClose,
  onEdit,
  onDelete,
  onNotify,
  onOpenLink,
  notifying,
}: Props) {
  const theme = useTheme();
  const ty = EVENT_TYPES[e.type] || EVENT_TYPES.otro;
  const own = e.source === 'event';
  const isFinal = e.status === 'finalizado' && e.report?.numbers != null;
  const stores = e.stores.map(
    (s) =>
      `${s.storeName}${s.storeAddress ? ` — ${s.storeAddress}` : ''}${
        s.contact ? ` · ${s.contact}` : ''
      }${own && e.stores.length > 1 ? (s.confirmed ? ' ✓' : ' ○') : ''}`
  );
  const confirmed = e.stores.filter((s) => s.confirmed).length;

  const Row = ({ k, v }: { k: string; v: React.ReactNode }) =>
    v ? (
      <>
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{k}</Typography>
        <Box sx={{ fontSize: 13, whiteSpace: 'pre-line', maxHeight: 200, overflow: 'auto' }}>
          {v}
        </Box>
      </>
    ) : null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ px: 2.5, py: 2, bgcolor: ty.bg, color: ty.fg }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          {ty.label}
          {e.source !== 'event' ? ` · ${SOURCE_LABEL[e.source]}` : ''}
          {e.identifier ? ` · ${e.identifier}` : ''}
        </Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{e.title}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{longDate(e)}</Typography>
      </Box>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', gap: '8px 12px' }}>
          <Row
            k="Hora"
            v={timeRange(e) || 'Sin hora definida'}
          />
          <Row
            k="Estado"
            v={
              <Typography
                sx={{ fontWeight: 600, fontSize: 13, color: statusColor(theme, e.status) }}
              >
                {STATUS_LABEL[e.status]}
              </Typography>
            }
          />
          <Row
            k="Lo lleva"
            v={
              e.ownerName ? `${e.ownerName}${e.departmentName ? ` · ${e.departmentName}` : ''}` : ''
            }
          />
          <Row
            k={e.stores.length > 1 ? `Tiendas (${e.stores.length})` : 'Tienda'}
            v={stores.length ? stores.join('\n') : 'Todas las tiendas de la red'}
          />
          {own && e.stores.length > 1 && (
            <Row
              k="Confirmación"
              v={`${confirmed} de ${e.stores.length} tiendas confirmaron`}
            />
          )}
          <Row
            k="Descripción"
            v={e.description || '—'}
          />
          {e.participants?.length > 0 && (
            <Row
              k="Involucrados"
              v={
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={0.5}
                >
                  {e.participants.map((p) => (
                    <Tooltip
                      key={p.userId}
                      title={PARTICIPANT_SOURCE_LABEL[p.source] || p.source}
                    >
                      <Chip
                        size="small"
                        label={p.name}
                        variant={p.source === 'owner' ? 'filled' : 'outlined'}
                        color={p.source === 'owner' ? 'primary' : 'default'}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              }
            />
          )}
          {own && (e.remindersSent || []).length > 0 && (
            <Row
              k="Avisos"
              v={e
                .remindersSent!.map(
                  (r) =>
                    `${
                      {
                        created: 'Creación',
                        d7: '7 días antes',
                        d1: '1 día antes',
                        d0: 'El mismo día',
                        rescheduled: 'Cambio de fecha',
                        cancelled: 'Cancelación',
                        manual: 'Manual',
                      }[r.stage] || r.stage
                    } · ${new Date(r.at).toLocaleDateString('es-US', {
                      day: 'numeric',
                      month: 'short',
                    })} · ${r.to} personas`
                )
                .join('\n')}
            />
          )}
        </Box>

        {e.status === 'cancelado' && e.cancelReason && (
          <Box
            sx={{
              mt: 1.75,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.08),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'error.main',
              }}
            >
              Motivo de la cancelación
            </Typography>
            <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{e.cancelReason}</Typography>
          </Box>
        )}

        {isFinal && (
          <Box
            sx={{
              mt: 1.75,
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-end"
              gap={1}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: 'success.dark',
                  }}
                >
                  Reporte · números registrados
                </Typography>
                <Typography
                  sx={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'success.dark',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtNum(e.report!.numbers!)}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => downloadReport(e)}
              >
                Descargar reporte
              </Button>
            </Stack>
            <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap', mt: 1 }}>
              {e.report?.note || 'Sin observaciones.'}
            </Typography>
            {(e.report?.evidence || []).length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px,1fr))',
                  gap: 0.75,
                  mt: 1.25,
                }}
              >
                {e.report!.evidence.map((u) => (
                  <Box
                    key={u}
                    component="a"
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      display: 'block',
                      aspectRatio: '1',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      component="img"
                      src={u}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{ px: 2.5, pb: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
      >
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
        >
          {own ? (
            <>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<EditRoundedIcon fontSize="small" />}
                onClick={onEdit}
              >
                Editar
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<CampaignRoundedIcon fontSize="small" />}
                onClick={onNotify}
                disabled={notifying}
              >
                {notifying ? 'Enviando…' : 'Avisar a todos'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                onClick={onDelete}
              >
                Eliminar
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<OpenInNewRoundedIcon fontSize="small" />}
              onClick={() => onOpenLink(e.link)}
            >
              Abrir en {SOURCE_LABEL[e.source]}
            </Button>
          )}
        </Stack>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
