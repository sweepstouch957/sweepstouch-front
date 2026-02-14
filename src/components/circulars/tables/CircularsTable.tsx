// src/components/circulars/CircularsTable.tsx
'use client';

import { RowItem } from '@/hooks/fetching/circulars/useManageCircularsData';
import { fmt, initialsFromSlug } from '@/utils/format';
import {
  Edit as EditIcon,
  Language as LanguageIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Circular } from '@services/circular.service';
import React from 'react';
import { StatusBadge } from '../StatusBadge';

const formatAudience = (n?: number) => (typeof n === 'number' ? n.toLocaleString('en-US') : '—');

export type PreviewLabel = 'Current Circular' | 'Next Circular';

export type CircularsTableProps = {
  rows: RowItem[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onPreview: (circular: Circular, storeName: string, label: PreviewLabel) => void;
  onEdit: (circular: Circular, storeName: string) => void;
};

export const CircularsTable: React.FC<CircularsTableProps> = ({
  rows,
  isLoading,
  search,
  onSearchChange,
  onPreview,
  onEdit,
}) => {
  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: '#2D3748' }}
        >
          Circular Status by Store
        </Typography>

        {/* 🔍 Input de búsqueda dentro del header de la tabla */}
        <TextField
          size="small"
          placeholder="Search store…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>STORE</TableCell>
              <TableCell>CURRENT CIRCULAR</TableCell>
              <TableCell>NEXT CIRCULAR</TableCell>
              <TableCell align="center">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ slug, storeName, storeImage, audience, current, next }) => (
              <TableRow
                key={slug}
                hover
              >
                {/* STORE */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={storeImage}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: storeImage ? undefined : '#E91E63',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {!storeImage && initialsFromSlug(slug)}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: '#2D3748' }}
                        >
                          {storeName}
                        </Typography>
                        <StatusBadge status={current?.status || next?.status || 'scheduled'} />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: '#A0AEC0', display: 'block' }}
                      >
                        {slug}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#4A5568', display: 'block', mt: 0.5 }}
                      >
                        Audience: {formatAudience(audience)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* CURRENT */}
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#2D3748', fontWeight: 500 }}
                    >
                      {current ? current.title : 'No active circular'}
                    </Typography>
                    {current?.endDate && (
                      <Typography
                        variant="caption"
                        sx={{ color: '#718096' }}
                      >
                        {`UNTIL ${fmt(current.endDate)}`}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        disabled={!current?.fileUrl}
                        onClick={() => current && onPreview(current, storeName, 'Current Circular')}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<EditIcon fontSize="small" />}
                        disabled={!current}
                        onClick={() => current && onEdit(current, storeName)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Box>
                </TableCell>

                {/* NEXT */}
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#2D3748', fontWeight: 500 }}
                    >
                      {next ? next.title : 'No scheduled circular'}
                    </Typography>
                    {next?.startDate && (
                      <Typography
                        variant="caption"
                        sx={{ color: '#2196F3' }}
                      >
                        {`STARTS ${fmt(next.startDate)}`}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        disabled={!next?.fileUrl}
                        onClick={() => next && onPreview(next, storeName, 'Next Circular')}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<EditIcon fontSize="small" />}
                        disabled={!next}
                        onClick={() => next && onEdit(next, storeName)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Box>
                </TableCell>

                {/* ACTIONS */}
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {/* Preview rápido */}
                    <Tooltip title="Quick preview">
                      <span>
                        <IconButton
                          size="small"
                          sx={{ color: '#718096' }}
                          disabled={!current?.fileUrl && !next?.fileUrl}
                          onClick={() => {
                            if (current?.fileUrl && current) {
                              onPreview(current, storeName, 'Current Circular');
                            } else if (next?.fileUrl && next) {
                              onPreview(next, storeName, 'Next Circular');
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    {/* 🌐 LINKTREE */}
                    <Tooltip title="Open Linktree">
                      <IconButton
                        size="small"
                        component="a"
                        href={`https://links.sweepstouch.com/?slug=${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#00A9BC',
                          '&:hover': {
                            bgcolor: 'rgba(0,169,188,0.08)',
                          },
                        }}
                      >
                        <LanguageIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2 }}
                  >
                    No hay tiendas/circulares para mostrar.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
