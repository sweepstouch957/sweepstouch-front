'use client';

/**
 * Teléfono con el mensaje TAL CUAL lo recibe el cliente: placeholders resueltos por el
 * backend con el mismo pipeline del envío (nombre de un cliente real, short link real de la
 * tienda, ahorro real…), más lo que cuesta: segmentos, codificación y caracteres.
 */
import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Alert, Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { useMessagePreview } from './useMessagePreview';

type Props = {
  storeId?: string;
  content: string;
  /** Imagen de la campaña (MMS): con imagen no hay segmentos. */
  image?: File | string | null;
};

export default function MessagePreviewPanel({ storeId, content, image }: Props) {
  const { preview, updating, error } = useMessagePreview(storeId, content);
  const isMms = !!image;
  const seg = preview?.segments;

  return (
    <Stack gap={1.5}>
      <Box sx={{ position: 'relative' }}>
        <PreviewPhone
          content={preview?.text ?? ''}
          image={image}
        />
        {updating && content.trim() && (
          <Chip
            size="small"
            icon={
              <AutorenewRoundedIcon
                sx={{
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                }}
              />
            }
            label="Actualizando"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          />
        )}
      </Box>

      {!storeId && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Sin tienda no se puede armar la vista previa real.
        </Typography>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ py: 0 }}
        >
          {error?.response?.data?.error || 'No se pudo armar la vista previa'}
        </Alert>
      )}

      {preview && (
        <>
          {/* Costo: lo que cuenta el operador */}
          <Stack
            direction="row"
            gap={0.75}
            flexWrap="wrap"
          >
            {isMms ? (
              <Chip
                size="small"
                color="info"
                label="MMS: sin límite de segmentos"
              />
            ) : (
              <Tooltip
                title={`${
                  seg?.encoding === 'UCS-2' ? 'Tiene emojis o caracteres especiales: ' : ''
                }${seg?.perSegment} caracteres por SMS`}
              >
                <Chip
                  size="small"
                  color={(seg?.segments ?? 0) > 2 ? 'warning' : 'default'}
                  label={`${seg?.segments} SMS · ${seg?.length} caracteres`}
                />
              </Tooltip>
            )}
            <Chip
              size="small"
              variant="outlined"
              label={seg?.encoding === 'UCS-2' ? 'Con emojis (UCS-2)' : 'Texto plano (GSM-7)'}
            />
          </Stack>

          {/* Placeholders mal escritos: llegarían literales al cliente */}
          {preview.placeholders.unknown.map((u) => (
            <Alert
              key={u.token}
              severity="warning"
              icon={<WarningAmberRoundedIcon fontSize="small" />}
              sx={{ py: 0 }}
            >
              <strong>{u.token}</strong> no es un placeholder: llegaría así al cliente.
              {u.suggestion ? ` ¿Quisiste decir ${u.suggestion}?` : ''}
            </Alert>
          ))}

          {/* De dónde salen los datos de ejemplo (todos reales) */}
          {(preview.placeholders.used.includes('#name') ||
            preview.sample.perCustomerLinks.length > 0) && (
            <Stack
              direction="row"
              gap={1}
              sx={{ color: 'text.secondary' }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18, mt: 0.25 }} />
              <Typography
                variant="body2"
                sx={{ fontSize: 12.5 }}
              >
                {preview.placeholders.used.includes('#name') &&
                  (preview.sample.name
                    ? `#name: ${preview.sample.name}, un cliente real de ${preview.sample.store}. `
                    : 'Ningún cliente con nombre: así lo reciben los que no tienen nombre. ')}
                {preview.sample.perCustomerLinks.length > 0 &&
                  `${preview.sample.perCustomerLinks.join(
                    ', '
                  )}: cada cliente recibe su propio link corto al enviar (mismo largo que el de muestra).`}
              </Typography>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
