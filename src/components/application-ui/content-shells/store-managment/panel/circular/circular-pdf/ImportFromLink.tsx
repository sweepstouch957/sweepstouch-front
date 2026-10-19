'use client';

/** "Traer del link de la tienda": baja el PDF de la semana desde circularss. */
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { Box, Button, LinearProgress, Link as MuiLink, Stack, Typography } from '@mui/material';
import { blockSx } from './styles';
import { externalUrl } from './utils';

export default function ImportFromLink({
  circularssUrl,
  hasCurrent,
  pending,
  onImport,
}: {
  circularssUrl?: string;
  hasCurrent: boolean;
  pending: boolean;
  onImport: () => void;
}) {
  const hint = !circularssUrl
    ? 'La tienda no tiene link de circular. Cárgalo en los datos de la tienda o sube el PDF arriba.'
    : hasCurrent
      ? 'Ya hay un circular vigente o agendado para esta semana.'
      : 'Baja el PDF de esta semana, crea el circular y la IA carga sus productos.';

  return (
    <Box sx={blockSx}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        gap={{ xs: 1.25, md: 2 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ flexShrink: 0 }}
        >
          <LinkRoundedIcon
            color="primary"
            fontSize="small"
          />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            noWrap
          >
            Traer del link de la tienda
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {hint}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
          sx={{ flexShrink: 0 }}
        >
          {circularssUrl && (
            <MuiLink
              href={externalUrl(circularssUrl)}
              target="_blank"
              rel="noopener"
              variant="body2"
              underline="hover"
            >
              Abrir link
            </MuiLink>
          )}
          {/* Secundaria: la acción rosa del bloque es "Agendar". */}
          <Button
            size="small"
            variant="outlined"
            disabled={!circularssUrl || hasCurrent || pending}
            onClick={onImport}
          >
            {pending ? 'Trayendo…' : 'Traer circular de la semana'}
          </Button>
        </Stack>
      </Stack>
      {pending && <LinearProgress sx={{ borderRadius: 1 }} />}
    </Box>
  );
}
