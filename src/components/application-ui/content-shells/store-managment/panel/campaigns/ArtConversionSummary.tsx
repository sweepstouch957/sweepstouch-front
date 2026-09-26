'use client';

/**
 * Resumen de la conversión del arte: ORIGINAL (lo que se subió, de donde la IA lee los
 * productos) → MMS (la copia que viaja al teléfono). Peso, medidas, formato y cuánto se
 * redujo, con el progreso real mientras sube y comprime.
 */
import { MMS_MAX_BYTES } from '@/services/upload.service';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { alpha, Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import {
  fmtBytes,
  fmtFormat,
  reductionPct,
  type ArtOriginal,
  type ArtUploadState,
} from './useCampaignArtUpload';

type Spec = {
  label: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  accent?: boolean;
};

function SpecCard({ label, bytes, width, height, format, accent }: Spec) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: accent ? 'success.main' : 'divider',
        bgcolor: (t) => (accent ? alpha(t.palette.success.main, 0.05) : 'background.default'),
      }}
    >
      <Typography
        variant="body2"
        fontWeight={700}
        color={accent ? 'success.main' : 'text.secondary'}
        sx={{ fontSize: 12, letterSpacing: '.04em' }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}
      >
        {fmtBytes(bytes)}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {width && height ? `${width} × ${height} px` : 'Medidas —'} · {fmtFormat(format)}
      </Typography>
    </Box>
  );
}

const origSpec = (o: ArtOriginal): Spec => ({
  label: 'ORIGINAL',
  bytes: o.bytes,
  width: o.width,
  height: o.height,
  format: o.type,
});

export default function ArtConversionSummary({
  state,
  onRetry,
}: {
  state: ArtUploadState;
  onRetry: () => void;
}) {
  if (state.status === 'idle') return null;

  if (state.status === 'uploading' || state.status === 'compressing') {
    const uploading = state.status === 'uploading';
    return (
      <Stack gap={1}>
        <SpecCard {...origSpec(state.original)} />
        <Stack
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            variant="body2"
            fontWeight={600}
          >
            {uploading ? 'Subiendo el original…' : 'Comprimiendo para el MMS…'}
          </Typography>
          {uploading && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {state.progress}%
            </Typography>
          )}
        </Stack>
        <LinearProgress
          variant={uploading ? 'determinate' : 'indeterminate'}
          value={state.progress}
          sx={{ borderRadius: 1, height: 6 }}
        />
        {!uploading && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 12.5 }}
          >
            Probando tamaños hasta quedar por debajo de 500 KB sin perder nitidez.
          </Typography>
        )}
      </Stack>
    );
  }

  if (state.status === 'error') {
    return (
      <Stack gap={1}>
        <SpecCard {...origSpec(state.original)} />
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ color: 'error.main' }}
        >
          <ErrorOutlineRoundedIcon fontSize="small" />
          <Typography
            variant="body2"
            sx={{ flex: 1 }}
          >
            {state.error}
          </Typography>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
          >
            Reintentar
          </Button>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 12.5 }}
        >
          Si no se resuelve, al guardar se vuelve a intentar.
        </Typography>
      </Stack>
    );
  }

  if (state.status !== 'done') return null;
  const { original, result } = state;
  const mms: Spec = result.compressed
    ? {
        label: 'COPIA MMS',
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        format: result.format,
        accent: true,
      }
    : { ...origSpec(original), label: 'VIAJA TAL CUAL', accent: true };
  const saved = reductionPct(original.bytes, mms.bytes);
  const scale =
    result.compressed && original.width && result.width
      ? Math.round((result.width / original.width) * 100)
      : 100;
  const underLimit = mms.bytes <= MMS_MAX_BYTES;

  return (
    <Stack gap={1.25}>
      {result.compressed ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="stretch"
          gap={1}
        >
          <SpecCard {...origSpec(original)} />
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              color: 'text.disabled',
              transform: { xs: 'rotate(90deg)', sm: 'none' },
            }}
          >
            <ArrowForwardRoundedIcon />
          </Box>
          <SpecCard {...mms} />
        </Stack>
      ) : (
        <SpecCard {...mms} />
      )}

      <Stack
        direction="row"
        gap={0.75}
        flexWrap="wrap"
      >
        <Chip
          size="small"
          color={underLimit ? 'success' : 'warning'}
          icon={<CheckCircleRoundedIcon />}
          label={underLimit ? 'Bajo el límite de 500 KB' : 'Supera 500 KB'}
        />
        {saved > 0 && (
          <Chip
            size="small"
            variant="outlined"
            label={`−${saved} % de peso`}
          />
        )}
        {scale < 100 && (
          <Chip
            size="small"
            variant="outlined"
            label={`Reducida al ${scale} % de su tamaño`}
          />
        )}
        {result.compressed && (
          <Chip
            size="small"
            variant="outlined"
            label="Original guardado"
          />
        )}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ color: 'primary.main' }}
      >
        <AutoAwesomeOutlinedIcon fontSize="small" />
        <Typography
          variant="body2"
          color="text.primary"
        >
          Al agendar, la IA lee los productos y el banner del{' '}
          {result.compressed ? 'original' : 'arte'}.
        </Typography>
      </Stack>
    </Stack>
  );
}
