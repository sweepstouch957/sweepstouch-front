'use client';

import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { DEFAULT_PRIMARY_COLOR, masterPreviewProduct } from './constants';
import { ShelfSign } from './shelf-sign';
import type { ShelfSignConfig } from './types';

/**
 * Paso 1 — Plantilla master.
 * Lo editable: color primario y la caja regular/save. Todo lo demás (franja
 * VIP, QR, "Powered by") es fijo por marca.
 */

interface Props {
  config: ShelfSignConfig;
  onChange: (patch: Partial<ShelfSignConfig>) => void;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function StepMaster({ config, onChange }: Props): React.JSX.Element {
  // El campo de texto se edita libre; sólo se propaga cuando el hex es válido,
  // si no el cartón parpadea a negro mientras se tipea.
  const [hexDraft, setHexDraft] = React.useState(config.color);

  React.useEffect(() => {
    setHexDraft(config.color);
  }, [config.color]);

  const commitHex = (value: string) => {
    const next = value.startsWith('#') ? value : `#${value}`;
    setHexDraft(next);
    if (HEX_RE.test(next)) onChange({ color: next });
  };

  const preview = React.useMemo(() => masterPreviewProduct(), []);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            Plantilla master
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            Color primario
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 0.5, mb: 2 }}
            alignItems="center"
          >
            <Box
              component="input"
              type="color"
              value={HEX_RE.test(hexDraft) ? hexDraft : DEFAULT_PRIMARY_COLOR}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => commitHex(e.target.value)}
              sx={{
                width: 48,
                height: 40,
                p: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <TextField
              size="small"
              fullWidth
              value={hexDraft}
              onChange={(e) => commitHex(e.target.value)}
              error={!HEX_RE.test(hexDraft)}
              helperText={!HEX_RE.test(hexDraft) ? 'Hex de 6 dígitos, ej #EC0F8B' : ' '}
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={config.showSaveBox}
                onChange={(e) => onChange({ showSaveBox: e.target.checked })}
              />
            }
            label="Mostrar caja regular price / save"
            slotProps={{ typography: { variant: 'body2' } }}
          />

          <Alert
            severity="info"
            sx={{ mt: 2 }}
          >
            Afecta a los números de precio, la franja VIP y los acentos. Los logos VIP y
            &quot;Powered by Sweepstouch&quot; mantienen su arte original: no se recolorean.
          </Alert>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2, lineHeight: 1.6 }}
          >
            Elementos fijos: franja VIP, QR (lo inyecta la tienda que elijas en el paso 3) y el
            logo Powered by. La caja regular/save y el OFFER VALID quedan anclados abajo, sin
            importar el alto del precio.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ overflow: 'auto' }}>
        <CardContent>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1 }}
          >
            Vista previa del master (producto de ejemplo)
          </Typography>
          {/* La media hoja mide 8.5 × 5.5 in; a 0.62 entra en el ancho del panel. */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Box
              sx={{
                transform: 'scale(0.62)',
                transformOrigin: 'top left',
                width: '8.5in',
                height: '3.6in',
              }}
            >
              <Box sx={{ width: '8.5in', background: '#fff', border: '1px solid #eee' }}>
                <ShelfSign
                  product={preview}
                  config={config}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default StepMaster;
