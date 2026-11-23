'use client';

/**
 * Agenda la campaña de recaptura: una campaña normal de la tienda INACTIVA (de ahí sale
 * la audiencia) con `recaptureTargetStore`, que deja fuera a quien ya está en la tienda
 * destino. Título, texto, imagen y fecha son libres; el link sugerido es el linktree corto
 * de la tienda activa.
 */

import { useConfirm } from '@/components/base/confirm';
import { campaignClient } from '@/services/campaing.service';
import type { RecaptureNeighbor, RecaptureRow } from '@/services/recapture.service';
import { shortLinkService } from '@/services/short-link.service';
import { uploadCampaignArt } from '@/services/upload.service';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const num = (n: number) => Number(n || 0).toLocaleString('es');
const bare = (url: string) => url.replace(/^https?:\/\//, '');

/** Valor para <input type="datetime-local"> en hora local. */
function localInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function RecaptureSendDialog({
  source,
  target,
  onClose,
  onSent,
}: {
  source: RecaptureRow['store'];
  target: RecaptureNeighbor;
  onClose: () => void;
  onSent: () => void;
}) {
  const confirm = useConfirm();
  const [title, setTitle] = useState(`Recaptura: ${source.name} → ${target.name}`);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [when, setWhen] = useState(() => localInput(new Date(Date.now() + 15 * 60_000)));
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const link = useQuery({
    queryKey: ['recapture-link', target.slug],
    queryFn: () => shortLinkService.forStore(target.slug),
    staleTime: Infinity,
    retry: 1,
  });

  // El mensaje se arma una vez, cuando llega el link (o falla y se usa el largo).
  useEffect(() => {
    if (content || link.isLoading) return;
    const url = link.data?.shortUrl ? bare(link.data.shortUrl) : `links.sweepstouch.com/?slug=${target.slug}`;
    setContent(
      `${source.name} ya no envia ofertas. Recibe las de ${target.name}${target.address ? ` (${target.address})` : ''}, cerca de ti: ${url}\nReply STOP to cancel`
    );
  }, [link.isLoading, link.data, content, source.name, target]);

  const date = new Date(when);
  const tooSoon = !(date.getTime() > Date.now() + 2 * 60_000);

  const send = useMutation({
    mutationFn: async () => {
      // Con imagen sale como MMS. Sólo la copia liviana: no es un flyer del que leer productos.
      const art = image ? await uploadCampaignArt(image) : null;
      return campaignClient.createCampaign(
        {
          title: title.trim(),
          description: 'Recaptura de números de tienda inactiva',
          content,
          startDate: date.toISOString(),
          platform: 'infobip',
          recaptureTargetStore: target.id,
          ...(art ? { image: art.url, imagePublicId: art.public_id } : {}),
        } as any,
        source.id
      );
    },
    onSuccess: () => {
      toast.success('Campaña de recaptura agendada');
      onSent();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || e?.message || 'No se pudo agendar la campaña'),
  });

  const submit = () =>
    void confirm({
      title: '¿Agendar la campaña de recaptura?',
      details: [
        ['De (inactiva)', source.name],
        ['Invita a', target.name],
        ['La reciben', `${num(target.recoverable)} números`],
        ['Tipo', image ? 'MMS (con imagen)' : 'SMS'],
        ['Sale', date.toLocaleString('es')],
      ],
      confirmLabel: 'Agendar',
    }).then((ok) => ok && send.mutate());

  return (
    <Dialog open onClose={send.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0.5 }}>Campaña de recaptura</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            A los <b>{num(target.recoverable)}</b> números de <b>{source.name}</b> (inactiva) que todavía no están en{' '}
            <b>{target.name}</b>.{target.alreadyThere > 0 && ` Los ${num(target.alreadyThere)} que ya están no la reciben.`}
          </Typography>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 120 }} />
          <TextField
            label="Mensaje"
            multiline
            minRows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={link.isLoading}
            helperText={`${content.length} caracteres${image ? '' : ` · ${Math.max(1, Math.ceil(content.length / 153))} SMS por número`}`}
          />
          <Stack direction="row" alignItems="center" gap={1.5}>
            {preview && (
              <Box component="img" src={preview} alt="Imagen de la campaña" sx={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 1.5, border: 1, borderColor: 'divider' }} />
            )}
            <Button component="label" variant="outlined" size="small" startIcon={<AddPhotoAlternateRoundedIcon />} disabled={send.isPending}>
              {image ? 'Cambiar imagen' : 'Agregar imagen (opcional)'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setImage(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </Button>
            {image && (
              <Button size="small" color="inherit" onClick={() => setImage(null)} disabled={send.isPending}>
                Quitar
              </Button>
            )}
          </Stack>
          <TextField
            label="Fecha y hora de envío"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={tooSoon}
            helperText={tooSoon ? 'Tiene que ser a futuro (al menos unos minutos).' : 'Tu hora local.'}
          />
          <Alert severity="info" sx={{ fontSize: 12 }}>
            Queda como campaña {image ? 'MMS' : 'SMS'} de {source.name}: se ve en el listado de campañas y ahí se puede cancelar antes de
            que salga.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={send.isPending}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={submit}
          disabled={send.isPending || tooSoon || !title.trim() || content.trim().length < 10 || target.recoverable === 0}
          startIcon={send.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Agendar para {num(target.recoverable)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
