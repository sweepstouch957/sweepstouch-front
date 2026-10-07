'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { AREA_LABEL } from './constants';
import { RichTextArea } from './rich-text-area';
import { useCurrentUser, useDesignStore } from './store';
import type { DesignCard } from './types';
import { dateTime } from './ui-helpers';

/**
 * Checklist de auditoría.
 *
 * Los ítems no salen de una lista predefinida: el auditor agrega un check y
 * escribe al lado la descripción del error. La descripción acepta imágenes
 * pegadas con Ctrl+V, que en la práctica es una captura del error marcado.
 *
 * Cada error guarda quién lo marcó y de qué área, para poder contar errores por
 * auditor (Pedro = diseño, María = contenido) además del total por diseñador.
 */

interface Props {
  card: DesignCard;
  /** El diseñador ve la lista pero no la edita. */
  canEdit: boolean;
}

export function AuditPanel({ card, canEdit }: Props): React.JSX.Element {
  const user = useCurrentUser();
  const addAuditIssue = useDesignStore((s) => s.addAuditIssue);
  const removeAuditIssue = useDesignStore((s) => s.removeAuditIssue);

  const [draft, setDraft] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const isEmptyDraft = !draft.replace(/<[^>]*>/g, '').trim() && !draft.includes('<img');

  const submit = () => {
    if (isEmptyDraft) return;
    addAuditIssue(card.id, draft, user);
    setDraft('');
    setAdding(false);
  };

  const byAuthor = React.useMemo(() => {
    const map = new Map<string, number>();
    card.auditIssues.forEach((i) => map.set(i.authorName, (map.get(i.authorName) ?? 0) + 1));
    return Array.from(map.entries());
  }, [card.auditIssues]);

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Checklist de auditoría
          {card.auditRound > 1 && (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              ronda {card.auditRound}
            </Typography>
          )}
        </Typography>
        <Stack
          direction="row"
          spacing={0.5}
        >
          {byAuthor.map(([name, count]) => (
            <Chip
              key={name}
              size="small"
              label={`${name}: ${count}`}
              variant="outlined"
            />
          ))}
        </Stack>
      </Stack>

      {card.auditIssues.length === 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Sin errores registrados.
        </Typography>
      )}

      <Stack
        spacing={1}
        divider={<Divider flexItem />}
      >
        {card.auditIssues.map((issue) => (
          <Stack
            key={issue.id}
            direction="row"
            spacing={1}
            alignItems="flex-start"
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                <Chip
                  size="small"
                  label={`${issue.authorName} · ${AREA_LABEL[issue.area]}`}
                  color={issue.area === 'diseño' ? 'primary' : 'secondary'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: 10.5 }}
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                >
                  {dateTime(issue.createdAt)} · ronda {issue.round}
                </Typography>
              </Stack>
              <Box
                sx={{
                  fontSize: 13,
                  '& img': { maxWidth: '100%', borderRadius: 1, mt: 0.5 },
                  '& div': { lineHeight: 1.5 },
                }}
                // El contenido lo escribe el propio auditor en el editor del
                // módulo; no viene de una fuente externa.
                dangerouslySetInnerHTML={{ __html: issue.description }}
              />
            </Box>
            {canEdit && (
              <IconButton
                size="small"
                color="error"
                onClick={() => removeAuditIssue(card.id, issue.id)}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ))}
      </Stack>

      {canEdit && (
        <Box>
          {adding ? (
            <Stack spacing={1}>
              <RichTextArea
                value={draft}
                onChange={setDraft}
                minHeight={90}
                placeholder="Describí el error. Podés pegar una captura con Ctrl+V."
                ariaLabel="Descripción del error"
              />
              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  size="small"
                  variant="contained"
                  disabled={isEmptyDraft}
                  onClick={submit}
                >
                  Agregar error
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setAdding(false);
                    setDraft('');
                  }}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Button
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => setAdding(true)}
            >
              Agregar error al checklist
            </Button>
          )}
        </Box>
      )}

      {!canEdit && card.auditIssues.length > 0 && (
        <Alert severity="warning">
          Corregí estos puntos y volvé a pasar la tarjeta a auditoría.
        </Alert>
      )}
    </Stack>
  );
}

export default AuditPanel;
