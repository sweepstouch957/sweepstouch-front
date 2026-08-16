'use client';

import { useQboConnect, useQboStatus } from '@hooks/fetching/qbo/useQbo';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

/** Dato suelto de la conexión. Etiqueta arriba, valor abajo, sin adornos. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Typography variant="body2"
fontWeight={600}
sx={{ wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Estado de la conexión con QuickBooks.
 *
 * Es la pantalla a la que Intuit manda a sus revisores desde el perfil de la app,
 * así que tiene que explicarse sola: qué empresa está conectada, en qué entorno,
 * y cómo reconectar si se cayó.
 */
export function ConnectionCard() {
  const theme = useTheme();
  const status = useQboStatus();
  const connect = useQboConnect();

  const [token, setToken] = useState('');

  if (status.isLoading) {
    return <Skeleton variant="rounded"
height={190}
sx={{ borderRadius: 2 }} />;
  }

  const data = status.data;
  const connected = data?.connected ?? false;
  const sandbox = data?.env === 'sandbox';
  const tone = connected ? (sandbox ? 'warning' : 'success') : 'error';
  const color = theme.palette[tone].main;

  return (
    <Card>
      <CardContent>
        <Stack direction="row"
spacing={2}
alignItems="flex-start">
          <Avatar
            variant="rounded"
            sx={{ width: 48, height: 48, bgcolor: alpha(color, 0.12), color, borderRadius: 2 }}
          >
            {connected ? <CloudDoneRoundedIcon /> : <CloudOffRoundedIcon />}
          </Avatar>

          <Box flex={1}
minWidth={0}>
            <Stack direction="row"
alignItems="center"
spacing={1}
flexWrap="wrap"
useFlexGap>
              <Typography variant="h6"
fontWeight={700}>
                {connected ? data?.companyName || 'QuickBooks Online' : 'QuickBooks sin conectar'}
              </Typography>
              <Chip
                size="small"
                color={tone}
                variant="outlined"
                icon={sandbox ? <ScienceRoundedIcon /> : undefined}
                label={connected ? (sandbox ? 'Sandbox' : 'Producción') : 'Desconectado'}
              />
            </Stack>

            <Typography variant="body2"
color="text.secondary"
sx={{ mb: 2 }}>
              {connected
                ? 'Las facturas y pagos se sincronizan contra esta empresa.'
                : 'Sin conexión no se puede leer la cartera ni empujar facturas.'}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 4 }}
              divider={<Divider orientation="vertical"
flexItem />}
            >
              <Field label="Company ID"
value={data?.realmId || '—'} />
              <Field label="Entorno"
value={sandbox ? 'Sandbox de pruebas' : 'Producción'} />
              <Field label="Estado"
value={connected ? 'Activa' : 'Requiere reconexión'} />
            </Stack>
          </Box>
        </Stack>

        {!connected && (
          <>
            <Alert severity="warning"
sx={{ mt: 2.5 }}>
              <AlertTitle>Cómo reconectar</AlertTitle>
              {data?.error || 'El refresh token venció o nunca se guardó.'}
              <Typography variant="caption"
display="block"
sx={{ mt: 1 }}>
                En <strong>developer.intuit.com</strong> → tu app → <strong>OAuth 2.0 Playground</strong>,
                autoriza la empresa y copia el <code>refresh_token</code>. Pégalo abajo. El servicio
                lo rota solo de ahí en adelante; solo vence tras 100 días sin uso.
              </Typography>
            </Alert>

            <Stack direction={{ xs: 'column', sm: 'row' }}
spacing={1.5}
sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Refresh token"
                placeholder="RT1-99-H0-…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button
                variant="contained"
                disabled={!token.trim() || connect.isPending}
                onClick={() => connect.mutate(token.trim(), { onSuccess: () => setToken('') })}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Conectar
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ConnectionCard;
