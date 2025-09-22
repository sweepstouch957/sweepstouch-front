import { Close, DeleteRounded, Edit, ImageSearch } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface Promo {
  _id: string;
  title: string;
  imageMobile: string;
  type: string;
  category: 'generic' | 'custom';
  isActive: boolean;
  status: 'active' | 'pending' | 'completed';
  startDate: string;
  genericType?: string;
  endDate: string;
  storeId?: {
    _id: string;
    image: string;
    name: string;
  };
  sweepstakeId?: {
    _id: string;
    name: string;
  };
}

interface Props {
  promos: Promo[];
  total: number;
  page: number;
  limit: number;
  idStore: string;

  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
  onEdit: (promo: Promo) => void;
  onDelete: (id: string) => void;
}

const values: any = {
  "in_progress": {
    label: 'En Progreso',
    color: 'info',
  },
  pending: {
    label: 'Pendiente de Aprobacion',
    color: 'warning',
  },
  completed: {
    label: 'Completada',
    color: 'success',
  },
};
export const PromoResults = ({
  promos,
  total,
  page,
  limit,
  idStore,
  onChangePage,
  onChangeLimit,
  onEdit,
  onDelete,
}: Props) => {
  const { t } = useTranslation();
  const [imageOpen, setImageOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handlePreview = (url: string) => {
    setCurrentImage(url);
    setImageOpen(true);
  };

  const handleClosePreview = () => {
    setImageOpen(false);
    setCurrentImage(null);
  };

  return (
    <>
      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {!idStore && <TableCell>{t('Store')}</TableCell>}
                <TableCell>{t('Promo')}</TableCell>
                <TableCell>{t('Type')}</TableCell>
                <TableCell>{t('Status')}</TableCell>
                <TableCell>{t('Start Date')}</TableCell>
                <TableCell>{t('End Date')}</TableCell>
                <TableCell align="center">{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promos.map((promo) => (
                <TableRow
                  key={promo._id}
                  hover
                >
                  {/* Tienda o Sorteo */}
                  {!idStore && (
                    <TableCell>
                      <Box
                        display="flex"
                        alignItems="center"
                        sx={{
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          window.open(
                            `/admin/management/stores/edit/${promo.storeId._id}`,
                            '_blank'
                          );
                        }}
                      >
                        <Avatar
                          src={promo.storeId?.image || ''}
                          sx={{ mr: 1 }}
                          alt={promo.storeId?.name || 'Sorteo'}
                        />
                        <Typography fontWeight={500}>
                          {promo?.genericType !== 'root' ? promo.storeId?.name : 'Sorteo Generico'}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}

                  {/* Imagen y título */}
                  <TableCell>
                    <Box
                      display="flex"
                      alignItems="center"
                    >
                      <Avatar
                        src={promo.imageMobile}
                        variant="rounded"
                        sx={{ width: 48, height: 48, mr: 1, cursor: 'pointer' }}
                        onClick={() => handlePreview(promo.imageMobile)}
                      />
                      <Typography>{promo.title || 'Sin título'}</Typography>
                    </Box>
                  </TableCell>

                  {/* Tipo */}
                  <TableCell>
                    <Chip
                      label={promo.type.toUpperCase()}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip
                      label={values[promo.status]?.label || ""}
                      size="small"
                      color={values[promo.status]?.color || "default"}
                    />
                  </TableCell>

                  {/* Fechas */}
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(promo.startDate), 'dd/MM/yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(promo.endDate), 'dd/MM/yyyy')}
                    </Typography>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                    >
                      {/*<Tooltip title={t('Preview Image')}>
                        <IconButton
                          color="info"
                          onClick={() => handlePreview(promo.imageMobile)}
                        >
                          <ImageSearch fontSize="small" />
                        </IconButton>
                      </Tooltip>*/}

                      <Tooltip title={t('Edit')}>
                        <IconButton
                          color="primary"
                          onClick={() => onEdit(promo)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Delete')}>
                        <IconButton
                          color="error"
                          onClick={() => onDelete(promo._id)}
                        >
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {promos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      No hay promociones disponibles
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <Box p={2}>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={(e, newPage) => onChangePage(newPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => onChangeLimit(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 15, 20]}
          />
        </Box>
      </Card>

      {/* Modal de Imagen */}
      <Dialog
        open={imageOpen}
        onClose={handleClosePreview}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('Promo Image')}
          <IconButton
            onClick={handleClosePreview}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={currentImage || ''}
            alt="Imagen"
            sx={{
              width: '100%',
              maxHeight: 600,
              objectFit: 'contain',
              borderRadius: 2,
              border: '1px solid #ddd',
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
