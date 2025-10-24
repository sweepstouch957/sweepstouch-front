'use client';
import React from 'react';
import { Card, CardHeader, CardContent, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Typography, Box } from '@mui/material';

export interface Cashier { _id: string; firstName?: string; lastName?: string; phoneNumber?: string; email?: string; }
interface ResultsProps { cashiers: Cashier[]; isLoading?: boolean; }

const Results: React.FC<ResultsProps> = ({ cashiers = [], isLoading = false }) => (
  <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
    <CardHeader title={<Typography variant="h5"
      fontWeight={600}>Cajeras</Typography>} />
    <CardContent sx={{ p: 0 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3}><Typography>Cargando...</Typography></TableCell></TableRow>
            ) : cashiers.length === 0 ? (
              <TableRow><TableCell colSpan={3}><Box py={4}
                textAlign="center"><Typography
                  variant="body2"
                  color="text.secondary">Sin registros por ahora.</Typography></Box></TableCell></TableRow>
            ) : cashiers.map((c) => (
              <TableRow key={c._id}>
                <TableCell>{[c.firstName, c.lastName].filter(Boolean).join(' ') || '-'}</TableCell>
                <TableCell>{c.phoneNumber || '-'}</TableCell>
                <TableCell>{c.email || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);
export default Results;
