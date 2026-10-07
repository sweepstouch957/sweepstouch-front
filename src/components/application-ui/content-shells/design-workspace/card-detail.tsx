'use client';

import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { ALL_TAGS, CAUSE_LABEL, TAG_LABEL, TYPE_LABEL, statusMeta } from './constants';
import { enhanceBrief } from './enhance-brief';
import { AuditPanel } from './audit-panel';
import { cardActions } from './permissions';
import { RichTextArea } from './rich-text-area';
import { SavingsButton } from './savings-button';
import { uid, useCurrentUser, useDesignStore } from './store';
import { TimerChip } from './timer-chip';
import type { CardTag, DesignCard, ErrorCause } from './types';
import { cardSubtitle, dateTime } from './ui-helpers';

/**
 * Detalle de la tarjeta: todos los campos, el ciclo de vida y los botones que
 * correspondan al rol activo. Es la pantalla donde ocurre casi todo el flujo.
 */

interface Props {
  cardId: string | null;
  onClose: () => void;
  onDuplicate: (card: DesignCard) => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}
    >
      {label}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{children}</Box>
  </Box>
);

export function CardDetail({ cardId, onClose, onDuplicate }: Props): React.JSX.Element | null {
  const card = useDesignStore((s) => s.cards.find((c) => c.id === cardId) ?? null);
  const designers = useDesignStore((s) => s.designers);
  const user = useCurrentUser();
  const store = useDesignStore();

  const [toast, setToast] = React.useState('');
  const [confirmAudit, setConfirmAudit] = React.useState(false);
  const [causeDialog, setCauseDialog] = React.useState<null | 'from_audit' | 'from_approval'>(null);
  const [cause, setCause] = React.useState<ErrorCause>('error_disenador');
  const [enhancing, setEnhancing] = React.useState(false);

  if (!card) return null;

  const actions = cardActions(card, user);
  const isEspecial = card.type === 'especial';
  const meta = statusMeta(card.status);
  const subtitle = cardSubtitle(card);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(card.address);
      setToast('Dirección copiada');
    } catch {
      setToast('No se pudo copiar');
    }
  };

  const attach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    store.updateCard(card.id, {
      attachments: [
        ...card.attachments,
        ...files.map((f) => ({
          id: uid(),
          name: f.name,
          kind: (f.name.split('.').pop() ?? 'file').toLowerCase(),
          size: f.size,
          url: '#',
        })),
      ],
    });
  };

  const toggleTag = (tag: CardTag) =>
    store.updateCard(card.id, {
      tags: card.tags.includes(tag) ? card.tags.filter((t) => t !== tag) : [...card.tags, tag],
    });

  const confirmCause = () => {
    store.sendToErrors(card.id, cause);
    setCauseDialog(null);
    setToast(`Movida a Errores / Updates · ${CAUSE_LABEL[cause]}`);
  };

  const runEnhance = async () => {
    setEnhancing(true);
    try {
      store.updateCard(card.id, { brief: await enhanceBrief(card.brief) });
      setToast('Pedido reescrito por IA. Revisalo antes de asignar.');
    } finally {
      setEnhancing(false);
    }
  };

  const lastError = card.errorPeriods[card.errorPeriods.length - 1];

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
              >
                {card.storeName}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                >
                  {subtitle}
                  {card.duplicatedFromId && ' · copia de otra tarjeta'}
                </Typography>
              )}
            </Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <TimerChip
                card={card}
                size="medium"
              />
              <Chip
                label={meta.label}
                color={meta.role === 'secondary' ? 'default' : meta.role}
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={TYPE_LABEL[card.type]}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
              gap: 3,
            }}
          >
            {/* ── Columna izquierda: lista de productos y auditoría ── */}
            <Stack spacing={2.5}>
              {isEspecial && (
                <>
                  <Field label="Solicita">
                    <Typography variant="body2">{card.requesterName ?? 'Sin definir'}</Typography>
                  </Field>
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: 'text.secondary',
                        }}
                      >
                        Brief - el pedido completo
                      </Typography>
                      {actions.editFields && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            enhancing ? <CircularProgress size={14} /> : <AutoAwesomeRoundedIcon />
                          }
                          disabled={!card.brief.trim() || enhancing}
                          onClick={runEnhance}
                        >
                          Enhance pedido
                        </Button>
                      )}
                    </Stack>
                    <TextField
                      fullWidth
                      multiline
                      minRows={8}
                      size="small"
                      value={card.brief}
                      disabled={!actions.editFields}
                      onChange={(e) => store.updateCard(card.id, { brief: e.target.value })}
                    />
                  </Box>
                </>
              )}

              {/* Un especial no tiene lista de productos ni savings. */}
              {!isEspecial && (
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: 'text.secondary',
                    }}
                  >
                    Lista de productos {!actions.editProductList && '(solo lectura)'}
                  </Typography>
                  <SavingsButton
                    productList={card.productList}
                    tags={card.tags}
                    canEdit={actions.editProductList}
                    onApply={(html) => store.updateCard(card.id, { productList: html })}
                    onResult={setToast}
                  />
                </Stack>
                <RichTextArea
                  value={card.productList}
                  onChange={(html) => store.updateCard(card.id, { productList: html })}
                  readOnly={!actions.editProductList}
                  minHeight={220}
                  maxHeight={420}
                  placeholder="Pegá acá la lista del cliente. Acepta texto e imágenes."
                  ariaLabel="Lista de productos"
                />
              </Box>
              )}

              <Field label="Adjuntos">
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {card.attachments.map((a) => (
                      <Chip
                        key={a.id}
                        size="small"
                        icon={<AttachFileRoundedIcon />}
                        label={`${a.name} (${Math.max(1, Math.round(a.size / 1024))} KB)`}
                        onDelete={
                          actions.editFields
                            ? () =>
                                store.updateCard(card.id, {
                                  attachments: card.attachments.filter((x) => x.id !== a.id),
                                })
                            : undefined
                        }
                      />
                    ))}
                    {card.attachments.length === 0 && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                      >
                        Sin adjuntos
                      </Typography>
                    )}
                  </Stack>
                  {actions.editFields && (
                    <Button
                      component="label"
                      size="small"
                      startIcon={<AttachFileRoundedIcon />}
                    >
                      Adjuntar archivos
                      <input
                        hidden
                        multiple
                        type="file"
                        onChange={attach}
                      />
                    </Button>
                  )}
                </Stack>
              </Field>

              {(card.status === 'auditoria' ||
                card.status === 'errores_updates' ||
                card.auditIssues.length > 0) && (
                <>
                  <Divider />
                  <AuditPanel
                    card={card}
                    canEdit={actions.auditIssues}
                  />
                </>
              )}
            </Stack>

            {/* ── Columna derecha: datos y trazabilidad ── */}
            <Stack spacing={2}>
              <Field label="Dirección">
                <Tooltip title="Click para copiar">
                  <Box
                    onClick={copyAddress}
                    sx={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <Typography variant="body2">{card.address}</Typography>
                    <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Tooltip>
              </Field>

              {!isEspecial && (
              <Stack
                direction="row"
                spacing={2}
              >
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Promo desde"
                  InputLabelProps={{ shrink: true }}
                  value={card.promoStart}
                  disabled={!actions.editFields}
                  onChange={(e) => store.updateCard(card.id, { promoStart: e.target.value })}
                />
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Promo hasta"
                  InputLabelProps={{ shrink: true }}
                  value={card.promoEnd}
                  disabled={!actions.editFields}
                  onChange={(e) => store.updateCard(card.id, { promoEnd: e.target.value })}
                />
              </Stack>
              )}

              <Stack
                direction="row"
                spacing={2}
              >
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Diseñador"
                  value={card.designerId ?? ''}
                  disabled={!actions.editFields}
                  onChange={(e) => store.assignDesigner(card.id, e.target.value || null)}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {designers.map((d) => (
                    <MenuItem
                      key={d.id}
                      value={d.id}
                    >
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
                {!isEspecial && (
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    label="Productos"
                    value={card.productCount}
                    disabled={!actions.editFields}
                    onChange={(e) =>
                      store.updateCard(card.id, {
                        productCount: Math.max(0, Math.floor(Number(e.target.value)) || 0),
                      })
                    }
                  />
                )}
              </Stack>

              {!isEspecial && (
              <Field label="Etiquetas">
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {ALL_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      size="small"
                      label={TAG_LABEL[tag]}
                      variant={card.tags.includes(tag) ? 'filled' : 'outlined'}
                      color={card.tags.includes(tag) ? 'primary' : 'default'}
                      onClick={actions.editFields ? () => toggleTag(tag) : undefined}
                    />
                  ))}
                </Stack>
              </Field>
              )}

              {!isEspecial && (
              <Stack
                direction="row"
                spacing={2}
              >
                <Field label="Shelfsigns">
                  <Typography variant="body2">
                    {card.tags.includes('shelfsigns') ? card.shelfsignsCount : '—'}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.disabled"
                      sx={{ ml: 0.5 }}
                    >
                      (= productos)
                    </Typography>
                  </Typography>
                </Field>
                <Field label="Versiones tablets">
                  <Typography variant="body2">
                    {card.tabletVersions}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.disabled"
                      sx={{ ml: 0.5 }}
                    >
                      (mock — fase 2: PNGs en Drive)
                    </Typography>
                  </Typography>
                </Field>
              </Stack>
              )}

              <Field label="Carpeta de Drive">
                {card.folderUrl ? (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                  >
                    <Chip
                      size="small"
                      color="success"
                      icon={<FolderRoundedIcon />}
                      label="Carpeta creada"
                    />
                    <IconButton
                      size="small"
                      href={card.folderUrl}
                      target="_blank"
                      rel="noopener"
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ) : (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                  >
                    Todavía no creada
                  </Typography>
                )}
              </Field>

              {lastError && (
                <Alert severity={lastError.cause === 'error_disenador' ? 'error' : 'info'}>
                  Última entrada a Errores / Updates: <b>{CAUSE_LABEL[lastError.cause]}</b> ·{' '}
                  {dateTime(lastError.start)}
                </Alert>
              )}

              <Field label="Trazabilidad">
                <Stack spacing={0.25}>
                  {(
                    [
                      ['Creación', card.timestamps.createdAt],
                      ['Asignación', card.timestamps.assignedAt],
                      ['Inicio de diseño', card.timestamps.designStartedAt],
                      ['Envío a auditoría', card.timestamps.sentToAuditAt],
                      ['Aprobación', card.timestamps.approvedAt],
                      ['Agendado', card.timestamps.scheduledAt],
                    ] as const
                  ).map(([label, value]) => (
                    <Stack
                      key={label}
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {label}
                      </Typography>
                      <Typography variant="caption">{dateTime(value)}</Typography>
                    </Stack>
                  ))}
                  {card.holdPeriods.length > 0 && (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Pausas
                      </Typography>
                      <Typography variant="caption">{card.holdPeriods.length}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Field>
            </Stack>
          </Box>
        </DialogContent>

        {/* ── Botonera por rol ── */}
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
          {actions.defineProducts && (
            <Button
              variant="contained"
              onClick={() => store.updateCard(card.id, { status: 'productos_definidos' })}
            >
              Marcar productos definidos
            </Button>
          )}
          {actions.createFolder && (
            <Button
              variant="contained"
              startIcon={<FolderRoundedIcon />}
              onClick={() => {
                store.createFolder(card.id);
                setToast('Carpeta creada (simulada)');
              }}
            >
              Crear carpeta
            </Button>
          )}
          {actions.startDesign && (
            <Button
              variant="contained"
              onClick={() => store.startDesign(card.id)}
            >
              Iniciar diseño
            </Button>
          )}
          {actions.sendToAudit && (
            <Button
              variant="contained"
              onClick={() => setConfirmAudit(true)}
            >
              Pasar a auditoría
            </Button>
          )}
          {actions.pause && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => store.pause(card.id)}
            >
              Pausar
            </Button>
          )}
          {actions.resume && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => store.resume(card.id)}
            >
              Reanudar
            </Button>
          )}
          {actions.approveAudit && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                store.approveAudit(card.id);
                setToast('Auditoría aprobada');
              }}
            >
              Aprobar auditoría
            </Button>
          )}
          {actions.returnWithErrors && (
            <Button
              variant="outlined"
              color="error"
              disabled={card.auditIssues.length === 0}
              onClick={() => {
                setCause('error_disenador');
                setCauseDialog('from_audit');
              }}
            >
              Devolver con errores
            </Button>
          )}
          {actions.registerUpdate && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                setCause('update_cliente');
                setCauseDialog('from_approval');
              }}
            >
              Registrar update
            </Button>
          )}
          {actions.approve && (
            <Button
              variant="contained"
              color="success"
              onClick={() => store.approve(card.id)}
            >
              Aprobar
            </Button>
          )}
          {actions.simulateScheduled && (
            <Button
              variant="outlined"
              onClick={() => store.simulateScheduled(card.id)}
            >
              Simular agendado
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          {actions.duplicate && (
            <>
              <Button
                startIcon={<ContentCopyRoundedIcon />}
                onClick={() => onDuplicate(card)}
              >
                Duplicar
              </Button>
              <Tooltip title="Eliminar tarjeta">
                <IconButton
                  color="error"
                  onClick={() => {
                    store.deleteCard(card.id);
                    onClose();
                  }}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación obligatoria antes de auditoría */}
      <Dialog
        open={confirmAudit}
        onClose={() => setConfirmAudit(false)}
      >
        <DialogTitle>¿Pasar a auditoría?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Verificaste medidas, peso {card.type !== 'especial' && '(menos de 500 KB si es MMS)'} y
            que la carpeta esté creada con los archivos adentro?
          </Typography>
          {!card.folderUrl && (
            <Alert
              severity="warning"
              sx={{ mt: 2 }}
            >
              Esta tarjeta todavía no tiene carpeta creada.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAudit(false)}>Volver</Button>
          <Button
            variant="contained"
            onClick={() => {
              store.sendToAudit(card.id);
              setConfirmAudit(false);
            }}
          >
            Sí, pasar a auditoría
          </Button>
        </DialogActions>
      </Dialog>

      {/* Causa obligatoria al entrar a Errores / Updates */}
      <Dialog
        open={causeDialog !== null}
        onClose={() => setCauseDialog(null)}
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
          <Button onClick={() => setCauseDialog(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmCause}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

export default CardDetail;
