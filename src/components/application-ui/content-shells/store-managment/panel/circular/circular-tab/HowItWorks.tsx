'use client';

import { alpha, Box, Button, Paper, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';

/** Qué puede hacer la persona acá, en una línea por paso, con el botón que lo hace. */
export default function HowItWorks({
  storeId,
  onOpenAgents,
  onOpenProducts,
}: {
  storeId: string;
  onOpenAgents: () => void;
  onOpenProducts: () => void;
}) {
  const steps = [
    {
      n: 1,
      title: 'Agenda la campaña con su arte',
      text: 'Desde Campañas. Si la tienda no tiene arte, sube el PDF del circular más abajo.',
      action: (
        <Button
          size="small"
          component={NextLink}
          href={`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`}
        >
          Agendar campaña
        </Button>
      ),
    },
    {
      n: 2,
      title: 'Los robots leen el flyer solos',
      text: 'Siete agentes extraen productos, precios, fotos y deciden qué se ve. No hay que hacer nada.',
      action: (
        <Button
          size="small"
          onClick={onOpenAgents}
        >
          Ver la oficina
        </Button>
      ),
    },
    {
      n: 3,
      title: 'Revisa lo que quedó dudoso',
      text: 'Lo seguro se aplica solo; lo dudoso espera tu ok en Agentes IA. Precios y fotos se corrigen en Productos.',
      action: (
        <Button
          size="small"
          onClick={onOpenProducts}
        >
          Ir a Productos
        </Button>
      ),
    },
    {
      n: 4,
      title: 'El cliente arma su lista',
      text: 'El día de la campaña el link muestra SOLO ese flyer, con los precios del día.',
      action: null,
    },
  ];
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
        borderColor: (t) => alpha(t.palette.primary.main, 0.2),
      }}
    >
      <Typography
        variant="overline"
        color="primary"
        fontWeight={800}
      >
        Cómo funciona
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mt: 0.5,
        }}
      >
        {steps.map((s) => (
          <Stack
            key={s.n}
            spacing={0.5}
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              >
                {s.n}
              </Box>
              <Typography
                variant="body2"
                fontWeight={800}
                lineHeight={1.2}
              >
                {s.title}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flex: 1 }}
            >
              {s.text}
            </Typography>
            {s.action && <Box sx={{ ml: -0.75 }}>{s.action}</Box>}
          </Stack>
        ))}
      </Box>
    </Paper>
  );
}

