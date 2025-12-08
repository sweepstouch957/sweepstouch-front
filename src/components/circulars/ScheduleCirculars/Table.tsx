/* eslint-disable react/jsx-max-props-per-line */
import React from 'react';
import {
    Delete as DeleteIcon,
    Save as SaveIcon,
    UploadFile as UploadIcon,
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    Paper,
    Popover,
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
import { DateRange } from 'react-date-range';
import { StatusBadge } from '../StatusBadge';
import { Row } from '../types/ScheduleCirculars';

type CircularsTableProps = {
    rows: Row[];
    prettySize: (bytes: number) => string;
    setRow: (id: string, patch: Partial<Row>) => void;
    removeRow: (id: string) => void;
    saveRow: (row: Row) => Promise<void> | void;
    onSlugBlur: (id: string, slug: string) => void;
    onRangeChange: (id: string, start: Date | null, end: Date | null) => void;
};

const headerStyles = { fontWeight: 700, color: '#475569' };

function formatDate(d?: Date | null) {
    if (!d) return 'Sin fecha';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

type DateRangeCellProps = {
    row: Row;
    onChange: (start: Date | null, end: Date | null) => void;
};

function DateRangeCell({ row, onChange }: DateRangeCellProps) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const open = Boolean(anchorEl);
    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    const selectionRange = {
        startDate: row.startDate ?? new Date(),
        endDate: row.endDate ?? row.startDate ?? new Date(),
        key: 'selection',
    };

    return (
        <>
            <Box
                onClick={handleOpen}
                sx={{
                    borderRadius: 999,
                    border: '1px solid #E2E8F0',
                    px: 1.8,
                    py: 0.8,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#F8FAFC',
                    '&:hover': { borderColor: '#A5B4FC', bgcolor: '#EEF2FF' },
                }}
            >
                <Box
                    sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        bgcolor: '#E0E7FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#3730A3',
                    }}
                >
                    R
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.2 }}>
                        Rango activo
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', lineHeight: 1.2 }}>
                        {formatDate(row.startDate)} — {formatDate(row.endDate)}
                    </Typography>
                </Box>
            </Box>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ p: 2 }}>
                    <DateRange
                        ranges={[selectionRange]}
                        onChange={(ranges) => {
                            const sel = (ranges as any).selection;
                            onChange(sel.startDate ?? null, sel.endDate ?? null);
                        }}
                        moveRangeOnFirstSelection={false}
                    />
                </Box>
            </Popover>
        </>
    );
}

export function CircularsTable({
    rows,
    prettySize,
    setRow,
    removeRow,
    saveRow,
    onSlugBlur,
    onRangeChange,
}: CircularsTableProps) {
    return (
        <Paper
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid #EDF2F7',
            }}
            elevation={0}
        >
            <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid #EDF2F7', bgcolor: '#FAFAFB' }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#2D3748', fontSize: 18 }}
                >
                    Circular Schedule Management
                </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 560 }}>
                <Table
                    stickyHeader
                    size="small"
                    sx={{ '& td, & th': { borderBottomColor: '#F1F5F9' } }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerStyles}>STORE</TableCell>
                            <TableCell sx={{ width: 260, ...headerStyles }}>DATE RANGE</TableCell>
                            <TableCell sx={{ width: 260, ...headerStyles }}>TITLE</TableCell>
                            <TableCell sx={{ width: 120, ...headerStyles }}>STATUS</TableCell>
                            <TableCell align="center" sx={{ width: 160, ...headerStyles }}>
                                ACCIONES
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ py: 5 }}>
                                    <Stack spacing={1.2} alignItems="center" sx={{ color: '#64748B' }}>
                                        <UploadIcon />
                                        <Typography variant="body2">
                                            Sube PDFs o crea filas para agendar circulares.
                                        </Typography>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        )}

                        {rows.map((row) => {
                            const needsSlug = !row.storeSlug;
                            const hasStoreError = !!row.storeError;

                            return (
                                <TableRow
                                    key={row.id}
                                    hover
                                    sx={{
                                        '&:nth-of-type(odd)': { bgcolor: '#FCFCFD' },
                                        position: 'relative',
                                    }}
                                >
                                    {row.uploading && (
                                        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
                                            <LinearProgress />
                                        </Box>
                                    )}

                                    {/* STORE: avatar + info tienda + slug compacto + archivo en una línea */}
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Stack direction="row" spacing={1.8} alignItems="flex-start">
                                            <Avatar
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor: needsSlug ? '#F97316' : '#0EA5E9',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {row.storeSlug ? row.storeSlug.slice(0, 2).toUpperCase() : '??'}
                                            </Avatar>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
                                                {/* Info tienda */}
                                                {row.storeInfo ? (
                                                    <Box sx={{ mb: 0.25 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}
                                                        >
                                                            {row.storeInfo.name}
                                                        </Typography>
                                                        {row.storeInfo.address && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: '#64748B',
                                                                    display: 'block',
                                                                    lineHeight: 1.2,
                                                                }}
                                                            >
                                                                {row.storeInfo.address}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 500, color: '#475569', lineHeight: 1.2 }}
                                                    >
                                                        {row.storeSlug || 'Slug pendiente'}
                                                    </Typography>
                                                )}

                                                {/* Slug compacto */}
                                                <TextField
                                                    size="small"
                                                    variant="outlined"
                                                    placeholder="Slug de tienda"
                                                    value={row.storeSlug}
                                                    onChange={(e) =>
                                                        setRow(row.id, {
                                                            storeSlug: e.target.value.trim().toLowerCase(),
                                                            storeError: null,
                                                        })
                                                    }
                                                    onBlur={(e) => onSlugBlur(row.id, e.target.value)}
                                                    error={needsSlug || hasStoreError}
                                                    sx={{
                                                        '& .MuiInputBase-input': {
                                                            fontSize: 12,
                                                            py: 0.6,
                                                        },
                                                    }}
                                                />

                                                {/* Estado de lookup / error corto */}
                                                {row.storeLoading && (
                                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                        Buscando tienda…
                                                    </Typography>
                                                )}
                                                {row.storeError && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: '#DC2626' }}
                                                    >
                                                        {row.storeError}
                                                    </Typography>
                                                )}

                                                {/* Archivo en una sola línea */}
                                                {row.file && (
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.75}
                                                        alignItems="center"
                                                        sx={{ mt: 0.2, maxWidth: 340 }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: '#64748B',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                            title={row.file.name}
                                                        >
                                                            {row.file.name}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={prettySize(row.file.size)}
                                                            sx={{
                                                                bgcolor: '#E2E8F0',
                                                                color: '#1E293B',
                                                                fontWeight: 500,
                                                                fontSize: 10,
                                                                height: 20,
                                                            }}
                                                        />
                                                    </Stack>
                                                )}
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    {/* DATE RANGE */}
                                    <TableCell sx={{ py: 1.5 }}>
                                        <DateRangeCell
                                            row={row}
                                            onChange={(start, end) => onRangeChange(row.id, start, end)}
                                        />
                                    </TableCell>

                                    {/* TITLE */}
                                    <TableCell sx={{ py: 1.5 }}>
                                        <TextField
                                            size="small"
                                            value={row.title}
                                            onChange={(e) => setRow(row.id, { title: e.target.value })}
                                            fullWidth
                                            placeholder="Título del circular"
                                            sx={{
                                                '& .MuiInputBase-input': {
                                                    fontSize: 13,
                                                    py: 0.8,
                                                },
                                            }}
                                        />
                                    </TableCell>

                                    {/* STATUS */}
                                    <TableCell sx={{ py: 1.5 }}>
                                        {row.status ? (
                                            <StatusBadge status={row.status} />
                                        ) : row.saved ? (
                                            <StatusBadge status="scheduled" />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>

                                    {/* ACTIONS */}
                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="Guardar fila">
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        startIcon={<SaveIcon fontSize="small" />}
                                                        disabled={row.uploading}
                                                        onClick={() => saveRow(row)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: 999,
                                                            px: 2,
                                                            fontSize: 13,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        Guardar
                                                    </Button>
                                                </span>
                                            </Tooltip>

                                            <Tooltip title="Eliminar fila">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#64748B',
                                                            borderRadius: 999,
                                                            '&:hover': { bgcolor: '#F1F5F9' },
                                                        }}
                                                        onClick={() => removeRow(row.id)}
                                                        disabled={row.uploading}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
