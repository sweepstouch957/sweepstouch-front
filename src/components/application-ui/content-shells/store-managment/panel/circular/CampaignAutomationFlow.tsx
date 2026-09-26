'use client';

import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import { alpha, Box, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import type { CampaignImportJob } from '@/services/circular.service';

type StepState = 'done' | 'active' | 'error' | 'idle';

interface Step {
  icon: ReactNode;
  title: string;
  detail: string;
  state: StepState;
}

const fmt = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'America/New_York' }) : '';

/**
 * Los 5 pasos que corren solos al agendar una campaña con arte, conectados:
 * campaña → arte optimizado → IA lee productos → banner → lista del cliente.
 * Deriva todo de la campaña y del job de circular-service; no pide nada propio.
 */
export function buildSteps(campaign: any, job: CampaignImportJob | null): Step[] {
  const hasArt = !!campaign?.image;
  const scheduled = campaign?.status === 'scheduled' || campaign?.status === 'active' || campaign?.status === 'completed';
  const r = job?.result;
  const from = r?.effectiveFrom ? new Date(r.effectiveFrom) : null;
  const waitsDate = !!from && from > new Date();

  const ai: Step = !job
    ? { icon: <AutoAwesomeRoundedIcon />, title: 'IA lee productos', detail: 'Sin lectura automática (campaña anterior o sin agendar)', state: 'idle' }
    : job.status === 'failed'
      ? { icon: <AutoAwesomeRoundedIcon />, title: 'IA lee productos', detail: job.error || 'Falló', state: 'error' }
      : job.status === 'done'
        ? { icon: <AutoAwesomeRoundedIcon />, title: 'IA lee productos', detail: `${r?.found ?? 0} encontrados en el arte`, state: 'done' }
        : {
            icon: <AutoAwesomeRoundedIcon />,
            title: 'IA lee productos',
            detail: job.status === 'running' ? `Leyendo…${job.attempts > 1 ? ` (intento ${job.attempts}/3)` : ''}` : 'En cola',
            state: 'active',
          };

  const list: Step =
    job?.status === 'done'
      ? {
          icon: <ListAltRoundedIcon />,
          title: 'Lista del cliente',
          detail: r?.added
            ? `+${r.added} productos · ${waitsDate ? `se muestran el ${fmt(from)}` : `visibles desde el ${fmt(from)}`}`
            : r?.found
              ? 'Ya estaban todos en la lista'
              : 'No había productos para sumar',
          state: r?.added && waitsDate ? 'active' : 'done',
        }
      : { icon: <ListAltRoundedIcon />, title: 'Lista del cliente', detail: 'Productos y precios desde el día de la campaña', state: 'idle' };

  // Banner: el encabezado del arte, visible sólo los días de la campaña.
  const b = r?.banner;
  const bannerEnd = b ? new Date(+new Date(b.endDate) - 1) : null;
  const banner: Step =
    job?.status !== 'done'
      ? { icon: <ViewCarouselOutlinedIcon />, title: 'Banner de la lista', detail: 'Encabezado del arte, sólo los días de la campaña', state: 'idle' }
      : b
        ? {
            icon: <ViewCarouselOutlinedIcon />,
            title: 'Banner de la lista',
            detail: `${fmt(b.startDate)} → ${fmt(bannerEnd)}${b.fromArt ? ' (fechas del arte)' : ''}`,
            state: new Date(b.startDate) > new Date() ? 'active' : 'done',
          }
        : { icon: <ViewCarouselOutlinedIcon />, title: 'Banner de la lista', detail: 'No se creó: había uno manual esos días o el arte no tiene encabezado', state: 'idle' };

  return [
    {
      icon: <CampaignRoundedIcon />,
      title: 'Campaña agendada',
      detail: campaign ? `${campaign.title || 'Sin título'} · ${fmt(campaign.startDate)}` : 'Todavía no hay campaña con arte',
      state: campaign ? (scheduled ? 'done' : 'idle') : 'idle',
    },
    {
      icon: <ImageRoundedIcon />,
      title: 'Arte optimizado',
      detail: !hasArt
        ? 'Sin imagen'
        : campaign?.sourceImage
          ? 'Original guardado · MMS < 500 KB'
          : 'Imagen liviana para el MMS',
      state: hasArt ? 'done' : 'idle',
    },
    ai,
    banner,
    list,
  ];
}

export default function CampaignAutomationFlow({ steps }: { steps: Step[] }) {
  const theme = useTheme();
  const color = (s: StepState) =>
    s === 'done'
      ? theme.palette.success.main
      : s === 'active'
        ? theme.palette.info.main
        : s === 'error'
          ? theme.palette.error.main
          : theme.palette.text.disabled;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems="stretch"
      component="ol"
      aria-label="Automatización de la campaña"
      sx={{ listStyle: 'none', m: 0, p: 0 }}
    >
      {steps.map((s, i) => {
        const c = color(s.state);
        const next = steps[i + 1];
        return (
          <Stack key={s.title} component="li" direction={{ xs: 'row', md: 'column' }} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color: s.state === 'idle' ? c : '#fff',
                  bgcolor: s.state === 'idle' ? alpha(c, 0.1) : c,
                  border: s.state === 'idle' ? `1.5px dashed ${alpha(c, 0.5)}` : 'none',
                  '& svg': { fontSize: 20 },
                }}
              >
                {s.state === 'done' ? <CheckRoundedIcon /> : s.state === 'error' ? <CloseRoundedIcon /> : s.icon}
                {s.state === 'active' && (
                  <CircularProgress size={48} thickness={2} sx={{ position: 'absolute', color: c }} />
                )}
              </Box>
              {/* Conector: lleno si este paso ya pasó el testigo al siguiente */}
              {next && (
                <Box
                  aria-hidden
                  sx={{
                    flex: 1,
                    minWidth: { md: 16 },
                    minHeight: { xs: 16, md: 0 },
                    width: { xs: 2, md: 'auto' },
                    height: { xs: 'auto', md: 2 },
                    mx: { md: 1 },
                    my: { xs: 0.5, md: 0 },
                    bgcolor: s.state === 'done' ? color('done') : 'transparent',
                    backgroundImage:
                      s.state === 'done'
                        ? 'none'
                        : {
                            xs: `repeating-linear-gradient(180deg, ${alpha(theme.palette.text.disabled, 0.4)} 0 6px, transparent 6px 12px)`,
                            md: `repeating-linear-gradient(90deg, ${alpha(theme.palette.text.disabled, 0.4)} 0 6px, transparent 6px 12px)`,
                          },
                  }}
                />
              )}
            </Stack>
            <Box sx={{ pl: { xs: 1.5, md: 0 }, pr: { md: 2 }, pt: { md: 1 }, pb: { xs: next ? 2 : 0, md: 0 }, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>
                {s.title}
              </Typography>
              <Typography variant="caption" sx={{ color: s.state === 'error' ? 'error.main' : 'text.secondary', display: 'block' }}>
                {s.detail}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
