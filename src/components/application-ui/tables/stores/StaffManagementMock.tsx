'use client';

import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
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
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Roles mockeados
const MOCK_ROLES = [
  'Dueño',
  'Supervisor de caja',
  'Supervisor',
  'Secretario',
  'Asistente',
];

// Datos mockeados del staff
const MOCK_STAFF = [
  { id: 1, name: 'Juan Pérez', contact: '555-1234', role: 'Dueño' },
  { id: 2, name: 'Ana Gómez', contact: '555-5678', role: 'Supervisor de caja' },
  { id: 3, name: 'Carlos Ruiz', contact: '555-9012', role: 'Secretario' },
  { id: 4, name: 'Marta López', contact: '555-3456', role: 'Supervisor' },
];

interface StaffManagementMockProps {
  storeId: string;
}

const StaffManagementMock: React.FC<StaffManagementMockProps> = ({ storeId }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', contact: '', role: MOCK_ROLES[0] });

  const filteredStaff = MOCK_STAFF.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.contact.includes(searchTerm)
  );

  const handleAddStaff = () => {
    // Lógica mock: solo cerrar el modal
    console.log('Simulando agregar staff:', newStaff);
    setIsAddModalOpen(false);
    setNewStaff({ name: '', contact: '', role: MOCK_ROLES[0] });
  };

  const handleMockAction = (action: string, staffName: string) => {
    alert(`Simulando acción: ${action} para ${staffName}`);
  };

  return (
    <Box>
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
            mb={2}
          >
            <TextField
              label={t('Search Staff')}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddModalOpen(true)}
            >
              {t('Add Staff Member')}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Listado Mock de Empleados (CRUD Mock) */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Name')}</TableCell>
                  <TableCell>{t('Contact')}</TableCell>
                  <TableCell>{t('Role')}</TableCell>
                  <TableCell align="center">{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {staff.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{staff.contact}</TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title={t('Edit (Mock)')}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleMockAction('Edit', staff.name)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Delete (Mock)')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleMockAction('Delete', staff.name)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStaff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {t('No staff members found.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal para Agregar Staff */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Add New Staff Member')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label={t('Name')}
                type="text"
                fullWidth
                variant="outlined"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label={t('Contact Number')}
                type="text"
                fullWidth
                variant="outlined"
                value={newStaff.contact}
                onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                margin="dense"
                label={t('Role')}
                fullWidth
                variant="outlined"
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              >
                {MOCK_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {t(role)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddModalOpen(false)} color="secondary">
            {t('Cancel')}
          </Button>
          <Button onClick={handleAddStaff} color="primary" variant="contained">
            {t('Add Staff')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagementMock;
