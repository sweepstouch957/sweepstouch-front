/** Pasos del flujo de la campaña: lógica pura (sin React Query), los íconos van como JSX. */
import type { CampaignImportJob } from '@/services/circular.service';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import type { ReactNode } from 'react';

export type StepState = 'done' | 'active' | 'error' | 'idle';

export interface Step {
  icon: ReactNode;
  title: string;
  detail: string;
  state: StepState;
}

/** "2 oct": día corto en la zona de la tienda (Este), sin año. */
const fmt = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        timeZone: 'America/New_York',
      })
    : '';

/**
 * Los 5 pasos que corren solos al agendar una campaña con arte, conectados:
 * campaña → arte optimizado → IA lee productos → banner → lista del cliente.
 * Deriva todo de la campaña y del job de circular-service; no pide nada propio.
 */
export function buildSteps(campaign: any, job: CampaignImportJob | null): Step[] {
  const hasArt = !!campaign?.image;
  const scheduled =
    campaign?.status === 'scheduled' ||
    campaign?.status === 'active' ||
    campaign?.status === 'completed';
  const r = job?.result;
  const from = r?.effectiveFrom ? new Date(r.effectiveFrom) : null;
  const waitsDate = !!from && from > new Date();

  const ai: Step = !job
    ? {
        icon: <AutoAwesomeRoundedIcon />,
        title: 'IA lee productos',
        detail: 'Sin lectura automática (campaña anterior o sin agendar)',
        state: 'idle',
      }
    : job.status === 'failed'
      ? {
          icon: <AutoAwesomeRoundedIcon />,
          title: 'IA lee productos',
          detail: job.error || 'Falló',
          state: 'error',
        }
      : job.status === 'done'
        ? {
            icon: <AutoAwesomeRoundedIcon />,
            title: 'IA lee productos',
            detail: `${r?.found ?? 0} encontrados en el arte`,
            state: 'done',
          }
        : {
            icon: <AutoAwesomeRoundedIcon />,
            title: 'IA lee productos',
            detail:
              job.status === 'running'
                ? `Leyendo…${job.attempts > 1 ? ` (intento ${job.attempts}/3)` : ''}`
                : 'En cola',
            state: 'active',
          };

  const list: Step =
    job?.status === 'done'
      ? {
          icon: <ListAltRoundedIcon />,
          title: 'Lista del cliente',
          detail: r?.added
            ? `+${r.added} productos · ${
                waitsDate ? `se muestran el ${fmt(from)}` : `visibles desde el ${fmt(from)}`
              }`
            : r?.found
              ? 'Ya estaban todos en la lista'
              : 'No había productos para sumar',
          state: r?.added && waitsDate ? 'active' : 'done',
        }
      : {
          icon: <ListAltRoundedIcon />,
          title: 'Lista del cliente',
          detail: 'Productos y precios desde el día de la campaña',
          state: 'idle',
        };

  // Banner: el encabezado del arte, visible sólo los días de la campaña.
  const b = r?.banner;
  const bannerEnd = b ? new Date(+new Date(b.endDate) - 1) : null;
  const banner: Step =
    job?.status !== 'done'
      ? {
          icon: <ViewCarouselOutlinedIcon />,
          title: 'Banner de la lista',
          detail: 'Encabezado del arte, sólo los días de la campaña',
          state: 'idle',
        }
      : b
        ? {
            icon: <ViewCarouselOutlinedIcon />,
            title: 'Banner de la lista',
            detail: `${fmt(b.startDate)} → ${fmt(bannerEnd)}${
              b.fromArt ? ' (fechas del arte)' : ''
            }`,
            state: new Date(b.startDate) > new Date() ? 'active' : 'done',
          }
        : {
            icon: <ViewCarouselOutlinedIcon />,
            title: 'Banner de la lista',
            detail: 'No se creó: había uno manual esos días o el arte no tiene encabezado',
            state: 'idle',
          };

  return [
    {
      icon: <CampaignRoundedIcon />,
      title: 'Campaña agendada',
      detail: campaign
        ? `${campaign.title || 'Sin título'} · ${fmt(campaign.startDate)}`
        : 'Todavía no hay campaña con arte',
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
