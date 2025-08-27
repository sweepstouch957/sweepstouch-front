// src/components/stores/StoreKioskCard.tsx
'use client';

import { copyToClipboard } from '@/utils/ui/store.page';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

type Props = { kioskUrl: string; storeId: string };

export default function StoreKioskCard({ kioskUrl, storeId }: Props) {
  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2 }}
    >
      <CardHeader title="Tablet / Kiosko" />
      <CardContent sx={{ pt: 0 }}>
        <Grid
          container
          spacing={2}
          alignItems="center"
        >
          <Grid
            item
            xs={12}
            md={8}
          >
            <TextField
              fullWidth
              label="URL del Kiosko"
              value={kioskUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Tooltip title="Copiar">
                    <IconButton
                      edge="end"
                      onClick={() => copyToClipboard(kioskUrl)}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={() => window.open(kioskUrl, '_blank')}
              >
                Abrir Kiosko
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(`/admin/management/stores/edit/${storeId}`, '_blank')}
              >
                Editar Tienda
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1.5}
        >
          Conecta esta URL en la tablet para registrar clientes en piso de venta.
        </Typography>
      </CardContent>
    </Card>
  );
}
