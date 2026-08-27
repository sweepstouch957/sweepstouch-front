'use client';

import type { SecretSale } from '@/services/secret-sale.service';
import { tint, tintBorder, toneText } from '@/theme/semantic';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { Box, Card, Chip, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import Image from 'next/image';
import React from 'react';
import { daysLeft, STATUS_LABEL, STATUS_ROLE, saleStatus } from './constants';

interface Props {
  sale: SecretSale;
  onEdit: (sale: SecretSale) => void;
  onDelete: (sale: SecretSale) => void;
  onToggleActive: (sale: SecretSale) => void;
  onViewLeads: (sale: SecretSale) => void;
}

/**
 * Una secret sale. El flyer se muestra completo a propósito: acá adentro es
 * donde se revisa que la pieza esté bien antes de que la vea nadie afuera.
 */
export const SaleCard = React.memo(function SaleCard({
  sale,
  onEdit,
  onDelete,
  onToggleActive,
  onViewLeads,
}: Props) {
  const theme = useTheme();
  const status = saleStatus(sale);
  const role = STATUS_ROLE[status];
  const left = daysLeft(sale.endDate);

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${tintBorder(theme, role, 0.3)}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', bgcolor: tint(theme, role, 0.08) }}>
        <Image
          src={sale.flyerImage}
          alt={sale.title}
          fill
          sizes="(max-width: 900px) 100vw, 320px"
          style={{ objectFit: 'cover', filter: status === 'expired' ? 'grayscale(1)' : undefined }}
        />
        <Chip
          size="small"
          label={STATUS_LABEL[status]}
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            fontWeight: 700,
            bgcolor: tint(theme, role, 0.9),
            color: theme.palette.getContrastText(tint(theme, role, 0.9)),
          }}
        />
      </Box>

      <Stack spacing={1} sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap title={sale.title}>
          {sale.title}
        </Typography>

        {sale.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
            {sale.description}
          </Typography>
        ) : null}

        <Typography variant="caption" color="text.secondary">
          {format(new Date(sale.startDate), 'dd MMM')} → {format(new Date(sale.endDate), 'dd MMM yyyy')}
          {status === 'active' && left >= 0 ? ` · vence en ${left} día${left === 1 ? '' : 's'}` : ''}
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 0.5 }}>
          <Tooltip title="Ver contactos capturados">
            <Chip
              size="small"
              icon={<GroupsRounded />}
              label={`${sale.leadCount ?? 0} contactos`}
              onClick={() => onViewLeads(sale)}
              sx={{ fontWeight: 600, color: toneText(theme, role), bgcolor: tint(theme, role, 0.12) }}
            />
          </Tooltip>

          <Stack direction="row">
            <Tooltip title={sale.isActive ? 'Pausar' : 'Reactivar'}>
              <IconButton size="small" onClick={() => onToggleActive(sale)}>
                {sale.isActive ? <PauseRounded fontSize="small" /> : <PlayArrowRounded fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(sale)}>
                <EditRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton size="small" color="error" onClick={() => onDelete(sale)}>
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
});
