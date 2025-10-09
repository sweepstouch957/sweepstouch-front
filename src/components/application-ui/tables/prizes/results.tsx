
import { DeleteRounded, Edit, OpenInNewRounded, SearchTwoTone, AddRounded } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { prizesClient } from '@/services/sweepstakes.service';
import { useAuth } from '@/hooks/use-auth';
import NextLink from 'next/link';
import { Tooltip } from '@mui/material';


type Prize = {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  value?: number;
  details?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface ResultsProps {
  prizes: Prize[];
  isLoading: boolean;
  refetch: () => void;
}

const currency = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '-';

export default function Results({ prizes, isLoading, refetch }: ResultsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<string | null>(null);

  // NEW: preview image state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(prizes) ? prizes : [];
    if (!q) return list;
    return list.filter(
      (p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    );
  }, [prizes, search]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await prizesClient.deletePrize(toDelete);
      setToDelete(null);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        py={2}
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <TextField
          size="small"
          placeholder={t('Search prizes by name or description')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchTwoTone />
              </InputAdornment>
            )
          }}
          sx={{ maxWidth: 420, flex: 1 }}
        />

        <Tooltip title={t('Create prize')}>
          <Button
            component={NextLink}
            href="/admin/management/prizes/create"
            variant="contained"
            startIcon={<AddRounded />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('Create prize')}
          </Button>
        </Tooltip>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('Image')}</TableCell>
              <TableCell>{t('Name')}</TableCell>
              <TableCell>{t('Description')}</TableCell>
              <TableCell>{t('Value')}</TableCell>
              <TableCell>{t('Created')}</TableCell>
              <TableCell align="right">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((p) => (
              <TableRow hover
                key={p._id || p.name}>
                <TableCell>
                  <Avatar
                    variant="rounded"
                    src={p.image}
                    sx={{ width: 48, height: 48, cursor: p.image ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (p.image) {
                        setPreviewUrl(p.image);
                        setPreviewName(p.name || t('Prize image'));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}>
                    {p.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    title={p.description}>
                    {p.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{currency(p.value)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">

                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => setToDelete(p._id || '')}>
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box
                    py={6}
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    <Typography color="text.secondary">
                      {isLoading ? t('Loading...') : t('No results')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Box
        display="flex"
        justifyContent="flex-end">
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
          slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }}
        />
      </Box>

      {/* Delete confirm */}
      <Dialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}>
        <DialogTitle>{t('Are you sure?')}</DialogTitle>
        <DialogContent>
          <Typography>{t('This prize will be permanently deleted.')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>{t('Cancel')}</Button>
          <Button
            color="error"
            startIcon={<DeleteRounded />}
            variant="contained"
            onClick={handleDelete}>
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image preview modal */}
      <Dialog
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewName || t('Prize image')}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex"
            justifyContent="center"
            alignItems="center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl ?? ''}
              alt={previewName || 'image preview'}
              style={{ maxWidth: '100%', height: 'auto', borderRadius: 12 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {previewUrl && (
            <Button
              startIcon={<OpenInNewRounded />}
              onClick={() => window.open(previewUrl!, '_blank')}>
              {t('Open image')}
            </Button>
          )}
          <Button onClick={() => setPreviewUrl(null)}>{t('Close')}</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
