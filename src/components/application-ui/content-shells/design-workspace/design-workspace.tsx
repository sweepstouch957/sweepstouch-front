'use client';

import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemText,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { AREA_LABEL, CAUSE_LABEL, ROLE_LABEL } from './constants';
import { Board } from './board';
import { CardDetail } from './card-detail';
import { ConfigPanel } from './config-panel';
import { CreateCardDialog } from './create-card-dialog';
import { Dashboard } from './dashboard';
import { DuplicateDialog } from './duplicate-dialog';
import { useCurrentUser, useDesignPeople, useDesignStore } from './store';
import type { DesignCard, ErrorCause } from './types';

/**
 * Workspace › Diseño — sistema de gestión de producción de flyers MMS.
 *
 * Fase 1: mockup completo sobre datos en localStorage. El switcher "Ver como"
 * es de demo: son dos admins (Pedro y María, con todos los permisos) y el
 * equipo de diseño. En fase 2 la persona sale del usuario autenticado.
 */

const TABS = ['Tablero', 'Configuración', 'Dashboard'];

export function DesignWorkspace(): React.JSX.Element {
  const [tab, setTab] = React.useState(0);
  const [openCardId, setOpenCardId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [duplicating, setDuplicating] = React.useState<DesignCard | null>(null);

  /** Tarjeta arrastrada a Errores/Updates: falta elegir la causa. */
  const [pendingCauseId, setPendingCauseId] = React.useState<string | null>(null);
  const [cause, setCause] = React.useState<ErrorCause>('error_disenador');

  const user = useCurrentUser();
  const people = useDesignPeople();
  const setCurrentUser = useDesignStore((s) => s.setCurrentUser);
  const sendToErrors = useDesignStore((s) => s.sendToErrors);
  const resetMock = useDesignStore((s) => s.resetMock);

  /**
   * El estado se rehidrata desde localStorage en el cliente. Sin esta espera el
   * HTML del servidor y el del navegador difieren y React tira error de
   * hidratación.
   */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isAdmin = user.role === 'admin';

  const confirmCause = () => {
    if (pendingCauseId) sendToErrors(pendingCauseId, cause);
    setPendingCauseId(null);
  };

  return (
    <>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Diseño
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Workspace · producción de flyers MMS, shelfsigns y piezas especiales
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <TextField
              select
              size="small"
              label="Ver como"
              value={user.id}
              onChange={(e) => setCurrentUser(e.target.value)}
              sx={{ minWidth: 250 }}
            >
              {people.map((u) => (
                <MenuItem
                  key={u.id}
                  value={u.id}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <Avatar sx={{ width: 26, height: 26, fontSize: 12 }}>
                      {u.name.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={u.name}
                      secondary={
                        u.role === 'admin' && u.area
                          ? `${ROLE_LABEL[u.role]} · audita ${AREA_LABEL[u.area]}`
                          : ROLE_LABEL[u.role]
                      }
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <Tooltip title="Restablecer los datos de demostración">
              <Button
                size="small"
                color="inherit"
                startIcon={<RestartAltRoundedIcon />}
                onClick={resetMock}
              >
                Reiniciar demo
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mt: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((label, i) => (
            <Tab
              key={label}
              label={label}
              // Configuración es sólo de administración.
              disabled={i === 1 && !isAdmin}
            />
          ))}
        </Tabs>
      </Box>
      <Divider />

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {!mounted ? (
          <Stack spacing={2}>
            <Skeleton
              variant="rounded"
              height={40}
            />
            <Skeleton
              variant="rounded"
              height={420}
            />
          </Stack>
        ) : (
          <>
            {tab === 0 && (
              <Board
                onOpenCard={setOpenCardId}
                onCreate={() => setCreateOpen(true)}
                onNeedsCause={(id) => {
                  setCause('error_disenador');
                  setPendingCauseId(id);
                }}
              />
            )}

            {tab === 1 &&
              (isAdmin ? (
                <ConfigPanel />
              ) : (
                <Alert severity="info">Sólo administración puede abrir la configuración.</Alert>
              ))}

            {tab === 2 && <Dashboard />}
          </>
        )}
      </Box>

      <CreateCardDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={setOpenCardId}
      />

      <CardDetail
        cardId={openCardId}
        onClose={() => setOpenCardId(null)}
        onDuplicate={(card) => setDuplicating(card)}
      />

      <DuplicateDialog
        card={duplicating}
        onClose={() => setDuplicating(null)}
        onDuplicated={(id) => setOpenCardId(id)}
      />

      {/* Arrastrar a Errores/Updates exige la causa, igual que el botón. */}
      <Dialog
        open={pendingCauseId !== null}
        onClose={() => setPendingCauseId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Causa del movimiento</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Toda entrada a Errores / Updates queda registrada con su causa.
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Causa"
            value={cause}
            onChange={(e) => setCause(e.target.value as ErrorCause)}
          >
            <MenuItem value="error_disenador">{CAUSE_LABEL.error_disenador}</MenuItem>
            <MenuItem value="update_cliente">{CAUSE_LABEL.update_cliente}</MenuItem>
          </TextField>
          <Alert
            severity="info"
            sx={{ mt: 2 }}
          >
            {cause === 'error_disenador'
              ? 'Suma a la métrica de calidad del diseñador.'
              : 'No afecta las métricas del diseñador; aparece en el reporte de updates.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingCauseId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmCause}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default DesignWorkspace;
