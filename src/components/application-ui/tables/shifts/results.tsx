// ================================================
// components/ShiftTableWithActions.tsx (controlled by parent via hook props)
// ================================================
'use client';

import { Delete, Edit, Visibility } from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Popover,
  Select,
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
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import { FC, useMemo, useRef, useState } from 'react';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import ShiftPreviewModal from '../../dialogs/shift-preview';
import DeleteShiftDialog from '../../dialogs/shift/delete';
import NewShiftModal from '../../dialogs/shift/modal';
import { DateRangeValue, Sweepstake, UseShiftsTableResult } from '@/hooks/pages/useShiftsPage';

// === Small inline RangePicker (pure controlled) ===
function RangePicker({
  value,
  onChange,
  label = 'Rango de fechas',
  formatRange,
}: {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  label?: string;
  formatRange: (value: DateRangeValue) => string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLInputElement>(null);
  const range: Range = useMemo(
    () => ({
      key: 'selection',
      startDate: value.startDate ?? undefined,
      endDate: value.endDate ?? value.startDate ?? undefined,
    }),
    [value]
  );
  const handleChange = (r: RangeKeyDict) => {
    const sel = r.selection;
    onChange({ startDate: sel.startDate ?? null, endDate: sel.endDate ?? null });
  };
  return (
    <>
      <TextField
        inputRef={anchorRef}
        label={label}
        size="small"
        value={formatRange(value)}
        onClick={() => setOpen(true)}
        InputProps={{
          readOnly: true,
          sx: {
            minWidth: 280,
            background: theme.palette.mode === 'dark' ? '#1f1f1f' : '#fff',
            borderRadius: 2,
            cursor: 'pointer',
          },
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (value.startDate || value.endDate) && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ startDate: null, endDate: null });
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1 } } }}
      >
        <Box>
          <DateRange
            ranges={[range]}
            onChange={handleChange}
            moveRangeOnFirstSelection={false}
            editableDateInputs
            rangeColors={[theme.palette.primary.main]}
            months={2}
            direction="horizontal"
          />
        </Box>
      </Popover>
    </>
  );
}

// ===== Controlled props: everything the hook returns + sweepstakes =====
export interface ShiftTableWithActionsProps extends UseShiftsTableResult {
  sweepstakes: Sweepstake[];
}

const ShiftTableWithActions: FC<ShiftTableWithActionsProps> = ({
  sweepstakes,
  // data
  shifts,
  pagination,
  totalToPay,
  isLoading,
  isFetching,
  // filters & paging
  status,
  setStatus,
  dateRange,
  setDateRange,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  pageSizeOptions,
  // modals
  selectedShiftId,
  openPreview,
  openEdit,
  openDelete,
  closeAllModals,
  previewModalOpen,
  editModalOpen,
  deleteModalOpen,
  // helpers
  usd,
  buildExcelAndDownload,
  formatRange,
}) => {
  const theme = useTheme();

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'assigned':
        return theme.palette.primary.main;
      case 'available':
        return theme.palette.secondary.main;
      case 'completed':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[300];
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        mb={2}
      >
        <Typography
          fontWeight="bold"
          fontSize={18}
        >
          Lista de Turnos ({pagination.total})
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="flex-end"
          useFlexGap
        >
          <FormControl
            size="small"
            sx={{ minWidth: 160 }}
          >
            <InputLabel id="status-label">Estado</InputLabel>
            <Select
              labelId="status-label"
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="available">available</MenuItem>
              <MenuItem value="assigned">assigned</MenuItem>
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="completed">completed</MenuItem>
            </Select>
          </FormControl>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            formatRange={formatRange}
          />

          <Tooltip title="Exportar a Excel (agrupado por promotora)">
            <span>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => buildExcelAndDownload(shifts)}
                disabled={!shifts || shifts.length === 0}
                sx={{ textTransform: 'none' }}
              >
                Exportar Excel
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {isFetching && <LinearProgress sx={{ mb: 1, borderRadius: 1, height: 3, opacity: 0.8 }} />}

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', height: 240 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius: 4, background: '#f9f9f9' }}>
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
                <TableRow>
                  <TableCell>Supermercados</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Impulsadora</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Pago</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                      >
                        <Image
                          src={shift.storeInfo?.image || '/placeholder-profile.png'}
                          alt={shift.supermarketName || 'store'}
                          width={40}
                          height={40}
                          style={{ borderRadius: '50%' }}
                        />
                        <Box>
                          <Typography fontWeight="bold">
                            {shift.storeInfo?.name}{' '}
                            {shift.storeInfo?.customerCount != null && (
                              <>
                                , <b>{shift.storeInfo?.customerCount}</b>
                              </>
                            )}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={shift.status || 'Sin estado'}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(shift.status || ''),
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography>
                        {shift.date ? new Date(shift.date).toLocaleDateString() : ''}
                      </Typography>
                      <Typography variant="caption">
                        {shift.startTime ? new Date(shift.startTime).toLocaleTimeString() : ''} -{' '}
                        {shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {shift.promoterId ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Avatar
                            src={shift.requestedBy?.profileImage || '/placeholder-profile.png'}
                            alt={shift.requestedBy?.firstName || 'Promotora'}
                          />
                          <Typography>{shift.requestedBy?.firstName || 'Sin asignar'}</Typography>
                        </Stack>
                      ) : (
                        <Chip
                          label="Sin asignar"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>

                    <TableCell>
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, ((shift.totalParticipations || 0) / 400) * 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#ffe4f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.primary.main,
                            },
                          }}
                        />
                        <Typography variant="caption">
                          {shift.totalParticipations || 0}/400
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight="bold">
                        ${(shift.totalEarnings ?? 0).toFixed(2)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <IconButton
                          color="primary"
                          onClick={() => openPreview(shift._id)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>

                        {shift.status === 'active' && (
                          <IconButton
                            color="secondary"
                            onClick={() => openEdit(shift._id)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}

                        {!['active', 'completed'].includes(String(shift.status)) && (
                          <>
                            <IconButton
                              color="secondary"
                              onClick={() => openEdit(shift._id)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => openDelete(shift._id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            mt={3}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <FormControl
              size="small"
              sx={{ minWidth: 150 }}
            >
              <InputLabel id="rows-per-page-label">Por página</InputLabel>
              <Select
                labelId="rows-per-page-label"
                label="Por página"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                {pageSizeOptions.map((n) => (
                  <MenuItem
                    key={n}
                    value={n}
                  >
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Pagination
              color="primary"
              variant="outlined"
              shape="rounded"
              page={page}
              count={pagination.pages}
              onChange={(_, value) => setPage(value)}
              siblingCount={1}
              boundaryCount={1}
            />
          </Stack>
        </>
      )}

      {/* Modals */}
      <ShiftPreviewModal
        open={previewModalOpen}
        onClose={closeAllModals}
        shiftId={selectedShiftId}
      />
      <NewShiftModal
        open={editModalOpen}
        onClose={closeAllModals}
        sweepstakes={sweepstakes}
        shiftId={selectedShiftId}
      />
      <DeleteShiftDialog
        open={deleteModalOpen}
        shiftId={selectedShiftId}
        onClose={closeAllModals}
      />
    </Box>
  );
};

export default ShiftTableWithActions;
