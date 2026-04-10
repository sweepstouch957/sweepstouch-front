import { Customer } from '@/models/customer';
import { SearchTwoTone, PictureAsPdf } from '@mui/icons-material';
import {
  Avatar, Box, Card, Chip, Divider, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, Button
} from '@mui/material';
import dayjs from 'dayjs';
import React from 'react';
import type { Customer as ModelCustomer } from '@/models/customer';
import type { Customer as ServiceCustomer } from '@/services/customerService';

type CustomerRow = Partial<ModelCustomer & ServiceCustomer> & {
  _id?: string;          // puede venir opcional en el service
  phoneNumber?: string;  // idem
  countryCode?: string;
};

interface ResultsProps {
  exporting?: boolean;
  onExportPdf?: () => void;
  customers: CustomerRow[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export default function Results(props: ResultsProps) {
  const { 
    customers, total, page, limit, isLoading, 
    search, onSearchChange, onPageChange, onLimitChange, 
    onExportPdf, exporting, stats 
  } = props;

  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      {/* Summary Cards */}
      <Box 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} 
        gap={2} 
        mb={3}
      >
        <Card sx={{ 
          p: 2, 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', 
          color: '#fff',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="overline" sx={{ opacity: 0.7, fontWeight: 700 }}>Total Clientes</Typography>
          <Typography variant="h3" fontWeight={800}>{stats?.total || 0}</Typography>
        </Card>
        
        <Card sx={{ 
          p: 2, 
          background: 'linear-gradient(135deg, #0d4d1a 0%, #15803d 100%)', 
          color: '#fff',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700 }}>Activos</Typography>
          <Typography variant="h3" fontWeight={800}>{stats?.active || 0}</Typography>
        </Card>

        <Card sx={{ 
          p: 2, 
          background: 'linear-gradient(135deg, #4d0d0d 0%, #991b1b 100%)', 
          color: '#fff',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700 }}>Inactivos</Typography>
          <Typography variant="h3" fontWeight={800}>{stats?.inactive || 0}</Typography>
        </Card>
      </Box>

      <Box
        p={2}
        display="flex"
        alignItems="center"
        gap={2}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ flex: 1 }}>Directorio</Typography>
        <TextField
          size="small"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchTwoTone fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {onExportPdf && (
          <Button
            size="small"
            startIcon={<PictureAsPdf />}
            variant="outlined"
            onClick={onExportPdf}
            disabled={exporting}
            sx={{ borderRadius: '8px', px: 2 }}
          >
            {exporting ? 'Generando…' : 'Exportar PDF'}
          </Button>
        )}
      </Box>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>ZIP</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c._id}>
                <TableCell>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1.5}>
                    <Avatar
                      sx={{ width: 28, height: 28 }}>{(c.firstName || '?')[0]}</Avatar>
                    <Box>
                      <Typography
                        variant="body1"
                        fontWeight={600}>
                        {[c.firstName, (c as any).lastName].filter(Boolean).join(' ') || '—'}
                      </Typography>
                      {c.email && (
                        <Typography
                          variant="caption"
                          color="text.secondary">{c.email}</Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {'+' + c.phoneNumber}
                  </Typography>
                </TableCell>
                <TableCell><Typography variant="body2">{(c as any).zipCode || '—'}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2">{dayjs(c.createdAt).format('DD/MM/YYYY')}</Typography>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box
                    p={3}
                    textAlign="center">
                    <Typography
                      variant="body2"
                      color="text.secondary">No customers found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={Math.max(0, (page || 1) - 1)}
        onPageChange={(_, p) => onPageChange(p + 1)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Card>
  );
}
