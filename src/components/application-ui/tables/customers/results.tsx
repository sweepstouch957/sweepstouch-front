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
}

export default function Results(props: ResultsProps) {
  const { customers, total, page, limit, isLoading, search, onSearchChange, onPageChange, onLimitChange, onExportPdf, exporting } = props;
  return (
    <Card>
      <Box
        p={2}
        display="flex"
        alignItems="center"
        gap={2}>
        <Typography
          variant="h5"
          sx={{ flex: 1 }}>Customers</Typography>
        {onExportPdf && (
          <Button
            size="small"
            startIcon={<PictureAsPdf />}
            variant="outlined"
            onClick={onExportPdf}
            disabled={exporting}>
            {exporting ? 'Generando…' : 'Export PDF'}
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
