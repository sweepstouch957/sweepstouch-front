'use client';

/**
 * Botón "Tutorial" de la cabecera + modal de ayudas: a la izquierda las tareas, a la derecha
 * los pasos (y el video de la guía cuando exista). Abre en la guía de la pestaña actual.
 */
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import type { PanelTab } from '../header/tabs';
import { tutorialFor, TUTORIALS } from './tutorials';

export default function TutorialButton({ tab }: { tab: PanelTab }) {
  // null = cerrado; si no, el id de la guía abierta.
  const [openId, setOpenId] = useState<string | null>(null);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const guide = TUTORIALS.find((t) => t.id === openId);

  return (
    <>
      <Button
        variant="text"
        size="small"
        color="inherit"
        startIcon={<HelpOutlineRoundedIcon />}
        onClick={() => setOpenId(tutorialFor(tab).id)}
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 999,
          whiteSpace: 'nowrap',
          color: 'text.secondary',
        }}
      >
        Tutorial
      </Button>

      <Dialog
        open={!!guide}
        onClose={() => setOpenId(null)}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen}
      >
        <DialogTitle
          fontWeight={800}
          sx={{ pr: 6 }}
        >
          ¿Cómo se hace?
          <IconButton
            aria-label="Cerrar"
            onClick={() => setOpenId(null)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }}>
            <List
              dense
              sx={{
                flex: { sm: '0 0 260px' },
                borderRight: { sm: '1px solid' },
                borderBottom: { xs: '1px solid', sm: 'none' },
                borderColor: { xs: 'divider', sm: 'divider' },
                // En el teléfono las tareas van en una tira que se desliza.
                display: { xs: 'flex', sm: 'block' },
                overflowX: { xs: 'auto', sm: 'visible' },
                py: { xs: 0.5, sm: 1 },
              }}
            >
              {TUTORIALS.map((t) => (
                <ListItemButton
                  key={t.id}
                  selected={t.id === openId}
                  onClick={() => setOpenId(t.id)}
                  sx={{ flex: { xs: '0 0 auto', sm: 'unset' }, borderRadius: 1, mx: 0.5 }}
                >
                  <ListItemText
                    primary={t.title}
                    primaryTypographyProps={{
                      fontWeight: t.id === openId ? 800 : 500,
                      noWrap: fullScreen,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>

            {guide && (
              <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                >
                  {guide.title}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {guide.goal}
                </Typography>
                {guide.video && (
                  <Box
                    component="video"
                    key={guide.video}
                    src={guide.video}
                    controls
                    playsInline
                    preload="metadata"
                    sx={{ width: '100%', borderRadius: 2, mb: 2, bgcolor: 'black' }}
                  />
                )}
                <Stack
                  component="ol"
                  gap={1.5}
                  sx={{ listStyle: 'none', p: 0, m: 0 }}
                >
                  {guide.steps.map((s, i) => (
                    <Stack
                      component="li"
                      key={s.do}
                      direction="row"
                      gap={1.5}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          flex: '0 0 32px',
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                        }}
                      >
                        {i + 1}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 16 }}>{s.do}</Typography>
                        {s.why && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {s.why}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
